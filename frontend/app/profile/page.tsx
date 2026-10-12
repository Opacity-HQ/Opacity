import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./components/ProfileClient";

// Server component: resolves who is signed in so the account section can show
// the right controls (guests have no email or password to manage). Everything
// else on the page is client-side and goes through TanStack Query.
export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex w-full flex-1 justify-center">
      <ProfileClient
        email={user?.email ?? null}
        isGuest={Boolean(user?.is_anonymous) || !user}
      />
    </div>
  );
}
