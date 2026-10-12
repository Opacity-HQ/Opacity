-- Saves exactly one section of a child's clinical profile in a single atomic
-- statement. The route used to read the whole `data` object, merge one section
-- in JS and write it back, so two quick saves of different sections could each
-- start from the same snapshot and one would silently overwrite the other.
-- `data || {section: value}` merges inside the database instead.
--
-- security invoker (the default) on purpose: the caller's RLS policy on
-- child_clinical_profiles (owner-only, via owns_child) still decides whether
-- the insert/update is allowed, so this adds no new access path.
create or replace function public.save_clinical_section(
  p_child_id uuid,
  p_section text,
  p_value jsonb
)
returns jsonb
language sql
set search_path = public
as $$
  insert into public.child_clinical_profiles as p (child_id, data, updated_at)
  values (p_child_id, jsonb_build_object(p_section, p_value), now())
  on conflict (child_id) do update
    set data = p.data || jsonb_build_object(p_section, p_value),
        updated_at = now()
  returning data;
$$;

revoke execute on function public.save_clinical_section(uuid, text, jsonb) from anon, public;
grant execute on function public.save_clinical_section(uuid, text, jsonb) to authenticated;
