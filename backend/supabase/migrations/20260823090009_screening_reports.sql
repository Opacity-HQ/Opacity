-- risk_band is a screening signal, never a diagnostic label. See
-- docs/saket/PRD.md "Non-goals / constraints".
create table if not exists public.screening_reports (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  risk_band text not null check (risk_band in ('low', 'moderate', 'elevated')),
  strengths jsonb not null default '[]'::jsonb,
  needs_practice jsonb not null default '[]'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  shap_explanations jsonb,
  model_version text,
  sessions_included uuid[] not null default '{}',
  generated_at timestamptz not null default now()
);

create index if not exists screening_reports_child_id_idx on public.screening_reports (child_id);

alter table public.screening_reports enable row level security;

create policy "screening_reports_owner_all"
  on public.screening_reports
  for all
  to authenticated
  using (public.owns_child(child_id))
  with check (public.owns_child(child_id));

create policy "screening_reports_teacher_select"
  on public.screening_reports
  for select
  to authenticated
  using (public.teaches_child(child_id));
