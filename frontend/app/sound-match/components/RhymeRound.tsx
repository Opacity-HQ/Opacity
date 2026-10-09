"use client";

import type { SMTrial } from "@/app/api/games/sound-match/plan";
import type { TrialOutcome } from "./types";
import PictureChoiceRound from "./PictureChoiceRound";

// Level 2 (Q5-8): rhyme / same start-or-end sound. Shares the picture-answer
// UI with FirstSoundRound via PictureChoiceRound.
export default function RhymeRound({
  trial,
  onAnswer,
}: {
  trial: Extract<SMTrial, { roundType: "rhyme" }>;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  return <PictureChoiceRound trial={trial} onAnswer={onAnswer} />;
}
