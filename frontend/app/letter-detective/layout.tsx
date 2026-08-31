import GameLayout from "@/components/game-layout";
import { createClient } from "@/lib/supabase/server";

// GameLayout already accepts `username` — this just supplies the real
// signed-in user instead of leaving it on its "pranshu" placeholder
// default. Nothing captures a display name at signup yet (see
// docs/saket/PRD.md), so the email's local part is the most honest
// identifier available for a full account; a guest session gets "guest"
// instead of falling through to the placeholder.
export default async function LetterDetectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const username = user?.email
    ? user.email.split("@")[0]
    : user?.is_anonymous
      ? "guest"
      : undefined;

  return (
    <GameLayout title="letter detective" username={username}>
      {children}
    </GameLayout>
  );
}
