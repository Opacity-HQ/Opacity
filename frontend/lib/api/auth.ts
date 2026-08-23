import { createClient } from "@/lib/supabase/server";
import { ApiRouteError } from "@/lib/api/response";
import type { User } from "@supabase/supabase-js";

// Resolves the current user (anonymous or full account both qualify — an
// anonymous guest is a real auth.users row with a real session). Throws a
// typed ApiRouteError the route handler's try/catch turns into a 401, so
// callers never need to null-check.
export async function requireUser(): Promise<{
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new ApiRouteError("unauthorized", "Sign in required.");
  }

  return { user, supabase };
}

// Confirms the caller owns or teaches the given child, using the exact same
// predicate the database's RLS policies use (owns_child / teaches_child) —
// selecting the row through the RLS-scoped client can never drift from what
// the database actually enforces, because it *is* the enforcement.
export async function requireChildAccess(childId: string) {
  const { user, supabase } = await requireUser();

  const { data: child, error } = await supabase
    .from("children")
    .select("id, owner_id, display_name, birth_year, grade_level, locale")
    .eq("id", childId)
    .maybeSingle();

  if (error) {
    throw new ApiRouteError("internal_error", "Could not verify child access.");
  }

  if (!child) {
    throw new ApiRouteError("forbidden", "You do not have access to this child.");
  }

  return { user, supabase, child };
}
