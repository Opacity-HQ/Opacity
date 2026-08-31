import GameLayout from "@/components/game-layout";
import { getDisplayUsername } from "@/lib/auth/get-display-username";

export default async function RapidMatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const username = await getDisplayUsername();

  return (
    <GameLayout title="rapid match" username={username}>
      {children}
    </GameLayout>
  );
}
