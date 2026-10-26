-- The optional clinical profile feature was removed (the ML model doesn't use
-- it, so there is no reason to keep collecting health data about minors).
-- Drops the table, its RLS policy (dropped with it), and the atomic-save
-- function added on top of it. Nothing else references either object.
drop function if exists public.save_clinical_section(uuid, text, jsonb);
drop table if exists public.child_clinical_profiles;
