import GameLayout from "@/components/game-layout";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <GameLayout title="dashboard">{children}</GameLayout>;
}
