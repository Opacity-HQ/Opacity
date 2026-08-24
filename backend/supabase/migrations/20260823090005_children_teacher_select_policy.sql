-- Adds teacher read access to children now that teaches_child() exists.
-- Owner policy (all commands) already covers the parent/guest case.
create policy "children_teacher_select"
  on public.children
  for select
  to authenticated
  using (public.teaches_child(id));
