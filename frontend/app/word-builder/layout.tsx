import GameLayout from "@/components/game-layout";
import { getDisplayUsername } from "@/lib/auth/get-display-username";

export default async function WordBuilderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await getDisplayUsername();

  return (
    <GameLayout title="word builder" username={username}>
      {children}
    </GameLayout>
  );
}
