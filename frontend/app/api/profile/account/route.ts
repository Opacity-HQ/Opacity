import { requireUser } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiSuccess, toApiErrorResponse } from "@/lib/api/response";

// Permanently deletes the signed-in account. Removing an auth user is an
// admin-only operation (it cannot be expressed under RLS), which is why this
// is the one place the profile page uses the service-role client.
// children.owner_id cascades from auth.users, so every child and all of
// their data goes with it.
export async function DELETE() {
  try {
    const { user, supabase } = await requireUser();

    const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
    if (error) throw error;

    // Clear the now-orphaned session cookies.
    await supabase.auth.signOut();

    return apiSuccess({ deleted: true });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
