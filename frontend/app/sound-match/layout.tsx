import GameLayout from "@/components/game-layout";
import { getDisplayUsername } from "@/lib/auth/get-display-username";

export default async function SoundMatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await getDisplayUsername();

  return (
    <GameLayout title="sound match" username={username}>
      {children}
    </GameLayout>
  );
}
