-- owner_id references auth.users directly (not profiles), so an anonymous
-- guest can own a child profile before ever claiming a full account.
create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  birth_year integer not null check (birth_year between 1990 and 2100),
  grade_level text,
  locale text not null default 'en',
  created_at timestamptz not null default now()
);

create index if not exists children_owner_id_idx on public.children (owner_id);

alter table public.children enable row level security;

-- Owner policy only for now. Teacher read access is added once
-- teaches_child() exists (see 20260823090005_children_teacher_select_policy.sql) —
-- that function depends on classrooms/classroom_members, created next.
create policy "children_owner_all"
  on public.children
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
