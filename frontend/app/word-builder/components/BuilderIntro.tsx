"use client";

import { Eye, MousePointerClick, Blocks } from "lucide-react";
import GameIntro from "@/components/game-intro";

export default function BuilderIntro({
  loading,
  onStart,
}: {
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <GameIntro
      icon="/block.svg"
      title="Word Builder"
      description="Look closely at the word, then build it again from letter tiles. Take your time — there is no wrong way to play."
      steps={[
        { icon: Eye, text: "Look closely at the word" },
        { icon: MousePointerClick, text: "Tap the letter tiles in order" },
        { icon: Blocks, text: "Build the word again, one tile at a time" },
      ]}
      loading={loading}
      onStart={onStart}
      startId="word-builder-start"
    />
  );
}
