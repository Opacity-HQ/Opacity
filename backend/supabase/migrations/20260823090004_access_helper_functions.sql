-- security definer + stable: every RLS policy on child-scoped tables calls
-- one of these instead of writing the join inline, so the predicate can
-- never drift between tables, and so a policy on `children` doesn't have to
-- recursively query `children` again.
create or replace function public.owns_child(child uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.children
    where id = child and owner_id = auth.uid()
  )
$$;

create or replace function public.teaches_child(child uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.classroom_members cm
    join public.classrooms c on c.id = cm.classroom_id
    where cm.child_id = child and c.teacher_id = auth.uid()
  )
$$;

-- Small shared trigger for tables that track updated_at (skill_states).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
