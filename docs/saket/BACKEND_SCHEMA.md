# Backend Schema — Opacity

All tables live in the `public` schema of the single Supabase project. RLS is **enabled on every table from its first migration** — nothing is ever created open and locked down later.

## ERD (textual)

```
auth.users (Supabase-managed)
   │ 1:1
   ▼
profiles ───────────────┐
   │ 1:N (owner)         │ N:M (teaches)
   ▼                     ▼
children ◀───────── classroom_members ──▶ classrooms
   │ 1:N                                     (owner: profiles, role=teacher)
   ▼
game_sessions ──1:N──▶ game_trials
   │ 1:1
   ▼
session_scores
   │
   ▼ (aggregated across sessions)
screening_reports

children ──1:N──▶ skill_states   (child_id, skill_key)

games (reference/seed)         ld_letter_pairs (reference/seed)
                                ld_word_items   (reference/seed)
```

## Tables

### `profiles`
Mirrors `auth.users`, one row per human account (parent/teacher/admin — **not** created for pure guest sessions until claimed).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = `auth.users.id` |
| `role` | text | `parent` \| `teacher` \| `admin` |
| `display_name` | text | |
| `created_at` | timestamptz | default `now()` |

RLS: a user reads/updates only their own row.

### `children`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `owner_id` | uuid FK → `auth.users` | the account (anonymous or full) that owns this child profile |
| `display_name` | text | |
| `birth_year` | int | year only — data minimization |
| `grade_level` | text | nullable |
| `locale` | text | default `en` |
| `created_at` | timestamptz | |

RLS: `owner_id = auth.uid()` for all operations. Teachers get read via `classroom_members`, not via this table's own policy directly (see helper below).

### `classrooms`, `classroom_members`
`classrooms(id, teacher_id → auth.users, name, created_at)`.
`classroom_members(classroom_id, child_id, added_at)`, composite PK.

RLS: teacher owns/manages their classroom rows. A parent must explicitly add their child to a classroom (insert into `classroom_members` where `child_id` is one they own) — a teacher can never add a child unilaterally.

### `games` (seed/reference, public-read, no client writes)
`id text PK` (`letter-detective`, `sound-match`, `word-builder`, `memory-quest`, `rapid-match`), `name`, `skill_domain`.

### `game_sessions`
The contract every game builds on.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `child_id` | uuid FK → `children` | |
| `game_id` | text FK → `games` | |
| `status` | text | `in_progress` \| `completed` \| `abandoned` |
| `difficulty_level` | int | snapshot at session start |
| `config` | jsonb | **server-authored** stimulus plan — the seed/round list the client is served; makes the session reproducible and is what trials are graded against |
| `device` | jsonb | UA, screen size, input type, refresh rate — needed to normalize RT across devices |
| `started_at` | timestamptz | |
| `completed_at` | timestamptz | nullable |
| `duration_ms` | int | nullable until completion |

RLS: `owns_child(child_id)` for the owning parent/guest; teacher read-only via `teaches_child(child_id)`.

### `game_trials`
One row per stimulus. This is the table the ML story rests on.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK → `game_sessions` | |
| `trial_index` | int | `unique(session_id, trial_index)` |
| `stimulus` | jsonb | what was shown (drawn from `config`, denormalized here for query convenience) |
| `response` | jsonb | what the child submitted — **raw**, never a claimed correctness |
| `is_correct` | boolean | **computed server-side only**, at write time, from `stimulus` vs `response` |
| `error_type` | text | nullable — `mirror` \| `rotation` \| `visual_similar` \| `phonological` \| `omission` \| `timeout` |
| `reaction_time_ms` | int | |
| `time_to_first_move_ms` | int | nullable — hesitation signal, distinct from commit time |
| `created_at` | timestamptz | |

RLS: same predicate as parent `game_sessions`, joined through `session_id`.

### `session_scores`
One row per completed session.

| Column | Type | Notes |
|---|---|---|
| `session_id` | uuid PK/FK → `game_sessions` | |
| `accuracy` | numeric | |
| `mean_rt_ms` | numeric | |
| `median_rt_ms` | numeric | |
| `rt_cv` | numeric | coefficient of variation — RT variability, itself a signal |
| `mirror_error_rate` | numeric | nullable, game-dependent |
| `throughput` | numeric | correct responses / minute |
| `raw_features` | jsonb | the exact feature vector handed to the ML service — versioned by key, not by table shape |
| `computed_at` | timestamptz | |

### `skill_states`
| Column | Type | Notes |
|---|---|---|
| `child_id` | uuid FK → `children` | composite PK with `skill_key` |
| `skill_key` | text | e.g. `letter_discrimination_mirror` |
| `mastery` | numeric | 0–1 |
| `difficulty_level` | int | current level fed to next session start |
| `streak` | int | |
| `updated_at` | timestamptz | |

### `screening_reports`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `child_id` | uuid FK → `children` | |
| `risk_band` | text | `low` \| `moderate` \| `elevated` — **never** a diagnostic label |
| `strengths` | jsonb | |
| `needs_practice` | jsonb | |
| `progress` | jsonb | |
| `shap_explanations` | jsonb | nullable until ML service lands |
| `model_version` | text | nullable |
| `sessions_included` | uuid[] | |
| `generated_at` | timestamptz | |

RLS: same owner/teacher predicate as `children`.

### Letter Detective content (public-read reference tables)

`ld_letter_pairs(id, letter_a, letter_b, confusion_type text — mirror|rotation|visual|sequence, difficulty_tier int)`

`ld_word_items(id, word, target_letter, position text — initial|medial|final, difficulty_tier int)`

## RLS helper functions

```sql
create or replace function owns_child(child uuid) returns boolean
language sql security definer stable as $$
  select exists (select 1 from children where id = child and owner_id = auth.uid())
$$;

create or replace function teaches_child(child uuid) returns boolean
language sql security definer stable as $$
  select exists (
    select 1 from classroom_members cm
    join classrooms c on c.id = cm.classroom_id
    where cm.child_id = child and c.teacher_id = auth.uid()
  )
$$;
```

`security definer stable` avoids recursive-policy joins (a policy on `children` that queries `children` again through a normal join would recurse); every policy on child-scoped tables calls one of these two functions instead of writing the join inline.

## Seeds (`backend/supabase/seed/`)

- `games` — the five fixed rows.
- `ld_letter_pairs` — b/d, p/q (mirror); b/p, d/q, n/u, m/w (rotation); m/n, i/j, f/t (visual); was/saw, on/no (sequence).
- `ld_word_items` — a small starter set covering initial/medial/final target positions for each seeded pair.
