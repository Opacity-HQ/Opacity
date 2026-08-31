import GameLayout from "@/components/game-layout";
import { getDisplayUsername } from "@/lib/auth/get-display-username";

export default async function LetterDetectiveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await getDisplayUsername();

  return (
    <GameLayout title="letter detective" username={username}>
      {children}
    </GameLayout>
  );
}
