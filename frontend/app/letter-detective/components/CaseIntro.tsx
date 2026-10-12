"use client";

import { Search, ListChecks, MousePointerClick } from "lucide-react";
import GameIntro from "@/components/game-intro";
import type { LDPair } from "./types";

export default function CaseIntro({
  pair,
  loading,
  onStart,
}: {
  pair: LDPair | null;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <GameIntro
      icon="/letter.svg"
      title="Letter Detective"
      description="Look carefully at each letter to solve the case. Take your time — there is no wrong way to play."
      steps={[
        { icon: Search, text: "Look closely at each letter" },
        { icon: ListChecks, text: "Follow the clue at the top of each round" },
        { icon: MousePointerClick, text: "Tap the letters that fit the clue" },
      ]}
      note={
        pair ? (
          <p className="font-pixel text-[15px] text-[#5e5e5e] dark:text-[#a3a3a3]">
            today&apos;s case: {pair.letterA} vs {pair.letterB}
          </p>
        ) : null
      }
      loading={loading}
      onStart={onStart}
      startId="letter-detective-start"
    />
  );
}
