// Mirrors the public round shape returned by POST /api/games/memory-quest
// (see app/api/games/memory-quest/plan.ts). Kept as a local, game-scoped
// type rather than importing the API's module, per AGENTS.md — game state
// stays inside app/memory-quest/.

export type MQTrial =
  | {
      index: number;
      roundType: "sequence";
      level: number;
      sequence: string[];
      displayMs: number;
    }
  | {
      index: number;
      roundType: "position";
      level: number;
      gridSize: number;
      grid: string[];
      target: string;
      displayMs: number;
    };

export type MQResponse =
  | { kind: "sequence"; items: string[]; corrections: number }
  | { kind: "position"; selectedIndex: number | null };

export type TrialOutcome = {
  trialIndex: number;
  response: MQResponse;
  reactionTimeMs: number;
  timeToFirstMoveMs: number;
  // Client-side only, purely for the immediate feedback screen — the
  // server independently regrades from the raw response, and these are
  // never sent or trusted as the recorded score. See docs/saket/TRD.md
  // "Anti-tamper model".
  localAccuracy: number;
  localCorrect: boolean;
  localScore: number;
};

export type SessionResult = {
  accuracy: number;
  meanRtMs: number | null;
  score: number;
  level: number;
  nextDifficultyLevel: number;
  mastery: number;
  streak: number;
  maxSequenceLength: number;
  attempts: number;
  errors: number;
};
