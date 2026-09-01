import type { SMResponse } from "@/app/api/games/sound-match/plan";

// Mirrors Rapid Match / Letter Detective. `localCorrect` is client-side only,
// purely for the immediate glow/wiggle feedback — the server regrades every
// raw response independently and this is never trusted as the score. See
// docs/saket/TRD.md "Anti-tamper model".
export type TrialOutcome = {
  trialIndex: number;
  response: SMResponse;
  localCorrect: boolean;
  reactionTimeMs: number;
  timeToFirstMoveMs?: number;
};

// Shape returned by POST /api/games/sound-match/complete. `streak` is the
// longest run of correct answers within this session (the source design's
// results-screen figure), `xp` is presentational.
export type AccuracyResult = {
  accuracy: number;
  meanRtMs: number | null;
  mastery: number;
  nextDifficultyLevel: number;
  streak: number;
  xp: number;
  levelReached: number;
  correctCount: number;
  totalScored: number;
};
