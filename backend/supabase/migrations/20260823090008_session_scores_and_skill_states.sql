create table if not exists public.session_scores (
  session_id uuid primary key references public.game_sessions (id) on delete cascade,
  accuracy numeric,
  mean_rt_ms numeric,
  median_rt_ms numeric,
  rt_cv numeric,
  mirror_error_rate numeric,
  throughput numeric,
  -- Exact feature vector handed to the ML scoring service. Versioned by key
  -- within the jsonb payload, not by table shape.
  raw_features jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now()
);

alter table public.session_scores enable row level security;

create policy "session_scores_owner_all"
  on public.session_scores
  for all
  to authenticated
  using (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = session_id and public.owns_child(gs.child_id)
    )
  )
  with check (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = session_id and public.owns_child(gs.child_id)
    )
  );

create policy "session_scores_teacher_select"
  on public.session_scores
  for select
  to authenticated
  using (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = session_id and public.teaches_child(gs.child_id)
    )
  );

-- Drives the adaptive difficulty loop: read on session start, upserted on
-- session completion. See docs/saket/APP_FLOW.md "Adaptive loop".
create table if not exists public.skill_states (
  child_id uuid not null references public.children (id) on delete cascade,
  skill_key text not null,
  mastery numeric not null default 0 check (mastery between 0 and 1),
  difficulty_level integer not null default 1,
  streak integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (child_id, skill_key)
);

alter table public.skill_states enable row level security;

create policy "skill_states_owner_all"
  on public.skill_states
  for all
  to authenticated
  using (public.owns_child(child_id))
  with check (public.owns_child(child_id));

create policy "skill_states_teacher_select"
  on public.skill_states
  for select
  to authenticated
  using (public.teaches_child(child_id));

create trigger skill_states_set_updated_at
  before update on public.skill_states
  for each row
  execute function public.set_updated_at();
