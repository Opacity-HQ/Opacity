"use client";

import { Volume2, Ear, Headphones } from "lucide-react";
import GameIntro from "@/components/game-intro";

type SoundMatchIntroProps = {
  loading: boolean;
  onStart: () => void;
};

export default function SoundMatchIntro({ loading, onStart }: SoundMatchIntroProps) {
  return (
    <GameIntro
      icon="/sound.svg"
      title="Sound Match"
      description="Listen to a word, then pick the answer that matches its sound. Take your time — there is no wrong way to play."
      steps={[
        { icon: Headphones, text: "Turn your sound on — headphones help" },
        { icon: Volume2, text: "Tap the speaker any time to hear the word again" },
        { icon: Ear, text: "Tap an answer, or press keys 1–4" },
      ]}
      loading={loading}
      onStart={onStart}
      startId="sound-match-start"
    />
  );
}
