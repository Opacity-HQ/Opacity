-- Fixes flagged by the Supabase security advisor after the initial schema
-- landed: pin search_path on set_updated_at (it was missing it, unlike
-- owns_child/teaches_child which already had it), and stop the unauthenticated
-- `anon` Postgres role from being able to call owns_child/teaches_child
-- directly over RPC. They're security definer purely so RLS policies can use
-- them without recursive-policy issues; every real caller in this app is
-- always at least an anonymous *Supabase Auth session* (Postgres role
-- `authenticated`), never the bare unauthenticated `anon` role, so `anon`
-- never needs to invoke them.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.owns_child(uuid) from anon, public;
revoke execute on function public.teaches_child(uuid) from anon, public;
grant execute on function public.owns_child(uuid) to authenticated;
grant execute on function public.teaches_child(uuid) to authenticated;
