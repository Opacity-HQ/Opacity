create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  game_id text not null references public.games (id),
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  difficulty_level integer not null default 1,
  -- Server-authored stimulus plan, persisted at session start. Trials are
  -- graded against this, never against what the client claims. See
  -- docs/saket/TRD.md "Anti-tamper model".
  config jsonb not null default '{}'::jsonb,
  device jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms integer
);

create index if not exists game_sessions_child_id_idx on public.game_sessions (child_id);
create index if not exists game_sessions_child_game_status_idx on public.game_sessions (child_id, game_id, status);

alter table public.game_sessions enable row level security;

create policy "game_sessions_owner_all"
  on public.game_sessions
  for all
  to authenticated
  using (public.owns_child(child_id))
  with check (public.owns_child(child_id));

create policy "game_sessions_teacher_select"
  on public.game_sessions
  for select
  to authenticated
  using (public.teaches_child(child_id));

-- One row per stimulus. is_correct is computed server-side at write time,
-- never accepted as a claim from the client.
create table if not exists public.game_trials (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  trial_index integer not null,
  stimulus jsonb not null,
  response jsonb not null default '{}'::jsonb,
  is_correct boolean,
  error_type text check (
    error_type is null
    or error_type in ('mirror', 'rotation', 'visual_similar', 'phonological', 'omission', 'timeout')
  ),
  reaction_time_ms integer,
  time_to_first_move_ms integer,
  created_at timestamptz not null default now(),
  unique (session_id, trial_index)
);

create index if not exists game_trials_session_id_idx on public.game_trials (session_id);

alter table public.game_trials enable row level security;

create policy "game_trials_owner_all"
  on public.game_trials
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

create policy "game_trials_teacher_select"
  on public.game_trials
  for select
  to authenticated
  using (
    exists (
      select 1 from public.game_sessions gs
      where gs.id = session_id and public.teaches_child(gs.child_id)
    )
  );
