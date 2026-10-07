"use client";

import { Eye, MousePointerClick, Timer } from "lucide-react";
import GameIntro from "@/components/game-intro";

type MatchIntroProps = {
  loading: boolean;
  onStart: () => void;
};

export default function MatchIntro({ loading, onStart }: MatchIntroProps) {
  return (
    <GameIntro
      icon="/rapid.svg"
      title="Rapid Match"
      description="Match symbols rapidly! Speed up your visual recognition."
      steps={[
        { icon: Eye, text: "Watch the target symbol at the top" },
        { icon: MousePointerClick, text: "Tap the matching symbol or press keys (1-6)" },
        { icon: Timer, text: "React as quickly and accurately as you can" },
      ]}
      loading={loading}
      onStart={onStart}
      startId="rapid-match-start"
    />
  );
}
