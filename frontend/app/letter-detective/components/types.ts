// Mirrors the public trial shape returned by POST /api/games/letter-detective
// (see app/api/games/letter-detective/plan.ts). Kept as a local, game-scoped
// type rather than importing the API's module, per AGENTS.md — game state
// stays inside app/letter-detective/.

export type LDPair = {
  letterA: string;
  letterB: string;
  confusionType: "mirror" | "rotation" | "visual" | "sequence";
};

export type LDTrial =
  | {
      index: number;
      roundType: "lineup";
      isWarmup: boolean;
      targetLetter: string;
      twinLetter: string;
      options: string[];
      exposureMs: number;
      timeoutMs: number;
    }
  | {
      index: number;
      roundType: "impostor";
      isWarmup: boolean;
      baseLetter: string;
      impostorLetter: string;
      gridLetters: string[];
      exposureMs: number;
      timeoutMs: number;
    }
  | {
      index: number;
      roundType: "stakeout";
      isWarmup: boolean;
      streamLetter: string;
      isTarget: boolean;
      exposureMs: number;
      timeoutMs: number;
    }
  | {
      index: number;
      roundType: "words";
      isWarmup: boolean;
      word: string;
      targetLetter: string;
      exposureMs: number;
      timeoutMs: number;
    };

export type LDResponse =
  | { kind: "lineup"; selectedOptionIndex: number | null }
  | { kind: "impostor"; selectedIndex: number | null }
  | { kind: "stakeout"; tapped: boolean }
  | { kind: "words"; tappedPositions: number[] };

export type TrialOutcome = {
  trialIndex: number;
  response: LDResponse;
  reactionTimeMs: number;
  timeToFirstMoveMs: number;
  // Client-side only, purely for the immediate feedback glow/wiggle — the
  // server independently regrades from the raw response, this is never
  // trusted as the recorded score. See docs/saket/TRD.md "Anti-tamper model".
  localCorrect: boolean;
};
