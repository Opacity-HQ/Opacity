import type { RMResponse } from "@/app/api/games/rapid-match/plan";

export type TrialOutcome = {
  trialIndex: number;
  response: RMResponse;
  localCorrect: boolean;
  reactionTimeMs: number;
  timeToFirstMoveMs?: number;
};

export type AccuracyResult = {
  accuracy: number;
  meanRtMs: number | null;
  mastery: number;
  nextDifficultyLevel: number;
  streak: number;
  throughput: number;
};
