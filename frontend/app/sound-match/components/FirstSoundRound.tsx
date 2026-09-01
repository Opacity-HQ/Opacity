"use client";

import type { SMTrial } from "@/app/api/games/sound-match/plan";
import type { TrialOutcome } from "./types";
import PictureChoiceRound from "./PictureChoiceRound";

// Level 1 (Q1-4) + warm-ups: basic first-sound recognition. Shares the
// picture-answer UI with RhymeRound via PictureChoiceRound.
export default function FirstSoundRound({
  trial,
  onAnswer,
}: {
  trial: Extract<SMTrial, { roundType: "first-sound" }>;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  return <PictureChoiceRound trial={trial} onAnswer={onAnswer} />;
}
