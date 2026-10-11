-- Optional, parent-entered context that helps interpret a child's screening
-- results (reading history, family history, vision, hearing, ...). One row per
-- child; each section of the profile lives under its own key in `data` so the
-- shape can grow without a migration. This is sensitive health data about a
-- minor: owner-only access, deliberately NO teacher policy.
create table if not exists public.child_clinical_profiles (
  child_id uuid primary key references public.children (id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.child_clinical_profiles enable row level security;

create policy "child_clinical_profiles_owner_all"
  on public.child_clinical_profiles
  for all
  to authenticated
  using (public.owns_child(child_id))
  with check (public.owns_child(child_id));
