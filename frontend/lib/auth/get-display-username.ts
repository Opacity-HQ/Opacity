import { createClient } from "@/lib/supabase/server";
import { getFirstName } from "./first-name";

// Shared by every game's layout.tsx (and dashboard's) to supply GameLayout's
// `username` prop. For a full account that's the first name from the
// onboarding form (profiles.display_name — see /api/signin/onboarding);
// accounts that haven't completed onboarding yet fall back to the email's
// local part rather than showing nothing. A guest session gets "guest".
export async function getDisplayUsername(): Promise<string | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return undefined;
  if (user.is_anonymous) return "guest";

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return getFirstName(profile?.display_name) ?? user.email?.split("@")[0];
}
