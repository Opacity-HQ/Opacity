import { createClient } from "@/lib/supabase/server";

// Shared by every game's layout.tsx (and dashboard's) to supply GameLayout's
// `username` prop with the real signed-in user instead of its "pranshu"
// placeholder default. Nothing captures a display name at signup yet (see
// docs/saket/PRD.md), so the email's local part is the most honest
// identifier available for a full account; a guest session gets "guest"
// instead of falling through to the placeholder.
export async function getDisplayUsername(): Promise<string | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.email) return user.email.split("@")[0];
  if (user?.is_anonymous) return "guest";
  return undefined;
}
