-- Mirrors auth.users for full (non-guest) accounts. Not created for
-- anonymous guest sessions until the account is claimed (email attached) —
-- see docs/saket/APP_FLOW.md "Guest -> claimed account".
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'parent' check (role in ('parent', 'teacher', 'admin')),
  display_name text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_owner_all"
  on public.profiles
  for all
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
