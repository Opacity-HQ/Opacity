# App Flow — Backend & Letter Detective

## Top-level flow (deck slide 10: Screen → Understand → Personalize → Play → Improve)

```
Landing (app/page.tsx, Atharv's — untouched)
   │
   ├─ "lets play" → Signin dialog/drawer (components/signin.tsx)
   │      ├─ enters email+password → account created/logged in (Supabase Auth)
   │      └─ "play without login"  → anonymous sign-in (Supabase Auth, anonymous provider)
   │
   ▼
Either path lands an authenticated Supabase user (anonymous or full) → redirect to game or dashboard
   │
   ├─ No child profile yet → prompted to create one (display name, birth year, grade)
   │
   ▼
/letter-detective  (and, by the same contract, the other four game routes)
   │
   ├─ POST /api/games/letter-detective            → creates game_sessions row, server-authored config, returns rounds
   ├─ POST /api/games/letter-detective/trial       → batched trial submissions, graded server-side
   ├─ POST /api/games/letter-detective/complete    → final grading, session_scores, skill_states updated
   │
   ▼
/dashboard  (Atharv's route, this branch ships the API only)
   │
   └─ GET /api/dashboard → children list, per-game progress, latest screening_reports row
```

## Guest → claimed account

1. Child plays as guest → real `auth.users` row (`is_anonymous = true`), real `children` row owned by that user id.
2. Later, "sign in" flow calls `supabase.auth.updateUser({ email, password })` on the *same* user — Supabase Auth clears `is_anonymous` once the email is verified.
3. No data migration needed: the `children`, `game_sessions`, `game_trials` rows already belong to that user id and simply become visible under the now-claimed account.

## Session lifecycle (state machine, `game_sessions.status`)

```
        POST /api/games/<game>
              │
              ▼
      ┌───────────────┐   trial submissions (any count)   ┌────────────┐
      │  in_progress   │ ─────────────────────────────────▶│ in_progress│ (loop)
      └───────┬────────┘                                    └────────────┘
              │
   POST .../complete            client tab closes / times out without complete
              │                            │
              ▼                            ▼
        ┌───────────┐               ┌─────────────┐
        │ completed │               │  abandoned   │  (swept by a scheduled check
        └───────────┘               └─────────────┘   or lazily on next session start)
```

Trials already submitted before abandonment are kept — GBDTs handle incomplete sessions natively (deck, tech stack slide), and an abandoned session is itself a signal worth keeping, not discarding.

## Adaptive loop (deck slide 9: Identify → Personalize → Adjust → Evolve)

```
session complete → session_scores computed → skill_states upserted (mastery, difficulty, streak)
        │
        ▼
next session start reads skill_states → picks difficulty tier / distractor count / exposure time
        │
        └────────────────────────────────────────────────────────────────────┘  (loop per child, per skill)
```

## Risk report (deck slide 7)

`screening_reports` rows are generated from accumulated `session_scores` across games (out of scope to *generate* in this branch — that's the ML service — but the table and the dashboard read path exist so the UI has something to render once it does).
