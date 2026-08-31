import GameLayout from "@/components/game-layout";
import { getDisplayUsername } from "@/lib/auth/get-display-username";

export default async function MemoryQuestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await getDisplayUsername();

  return (
    <GameLayout title="memory quest" username={username}>
      {children}
    </GameLayout>
  );
}
