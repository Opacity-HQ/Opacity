// Mirrors the public trial shape returned by POST /api/games/word-builder
// (see app/api/games/word-builder/plan.ts). Kept as a local, game-scoped
// type rather than importing the API's module, per AGENTS.md — game state
// stays inside app/word-builder/.

export type WBTrial = {
  index: number;
  isWarmup: boolean;
  word: string;
  tiles: string[];
  previewMs: number;
  timeoutMs: number;
  difficultyTier: number;
};

export type WBResponse = {
  kind: "build";
  tileIndices: number[];
};

export type TrialOutcome = {
  trialIndex: number;
  response: WBResponse;
  reactionTimeMs: number;
  timeToFirstMoveMs: number;
  // Client-side only, purely for the immediate feedback glow — the server
  // independently regrades from the raw response, this is never trusted as
  // the recorded score. See docs/saket/TRD.md "Anti-tamper model".
  localCorrect: boolean;
};
