// Server-authored stimulus plan for one Memory Quest session (one "sitting"
// of rounds) plus the grading and adaptive-level logic for it. Lives inside
// this game's own API folder per backend/backend.md — nothing here is shared
// with other games.
//
// Round types:
//   sequence -> "the path": remember an ordered row of symbols, then tap
//               them back in order from a bank.
//   position -> "the map":  remember where one symbol sat in a grid, then
//               tap that cell on an empty grid.
//
// Deliberate design: no trial stores a separate answer-key field. A sequence
// round's answer is the sequence itself (the client has to show it), and a
// position round's target symbol appears exactly once in its grid, so the
// target cell is derivable from data the client already needs to render the
// round. Grading recomputes the answer server-side from the plan stored in
// game_sessions.config — the client only ever sends what it tapped and when.

const SYMBOLS = [
  "Star", "Home", "TreePine", "Moon", "Book", "Sun", "Key", "Cloud",
  "Heart", "Flower", "Umbrella", "Music", "Anchor", "Bell", "Rocket",
  "Snowflake", "Trophy", "Zap",
] as const;

export const MIN_LEVEL = 1;
/** Level 20 = a 22-item path with only 500 ms to memorise it. */
export const MAX_LEVEL = 20;
const MIN_DISPLAY_MS = 500;

/** Two paths then a map, same rhythm as before the Supabase rewrite. */
const ROUND_TYPES = ["sequence", "sequence", "position"] as const;

/** Consecutive strong rounds needed to advance a level. */
export const STRONG_ROUNDS_TO_ADVANCE = 3;

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
      /** Row-major cells; "" is an empty cell. `target` appears exactly once. */
      grid: string[];
      target: string;
      displayMs: number;
    };

export type MQPlan = {
  version: 1;
  level: number;
  trials: MQTrial[];
};

export type MQResponse =
  | { kind: "sequence"; items: string[]; corrections: number }
  | { kind: "position"; selectedIndex: number | null };

export function clampLevel(level: number) {
  return Math.min(Math.max(level, MIN_LEVEL), MAX_LEVEL);
}

/** Path grows by one item per level: L1 -> 3 items, L20 -> 22 items. */
export function sequenceLengthForLevel(level: number) {
  return level + 2;
}

/** Display time shrinks from 3000 ms at L1 to a 500 ms floor around L13. */
function displayMsForLevel(level: number) {
  return Math.max(MIN_DISPLAY_MS, 3000 - (level - 1) * 200);
}

function gridSizeForLevel(level: number) {
  if (level <= 4) return 3;
  if (level <= 9) return 4;
  return 5;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generatePlan(difficultyLevel: number): MQPlan {
  const level = clampLevel(difficultyLevel);
  const trials = ROUND_TYPES.map((roundType, index) =>
    roundType === "sequence"
      ? buildSequenceTrial(index, level)
      : buildPositionTrial(index, level),
  );
  return { version: 1, level, trials };
}

function buildSequenceTrial(index: number, level: number): MQTrial {
  return {
    index,
    roundType: "sequence",
    level,
    sequence: Array.from({ length: sequenceLengthForLevel(level) }, () =>
      pickRandom(SYMBOLS),
    ),
    displayMs: displayMsForLevel(level),
  };
}

function buildPositionTrial(index: number, level: number): MQTrial {
  const gridSize = gridSizeForLevel(level);
  const totalCells = gridSize * gridSize;
  const filledCount = Math.min(sequenceLengthForLevel(level), totalCells);
  const filledCells = shuffle(Array.from({ length: totalCells }, (_, i) => i))
    .slice(0, filledCount);

  const target = pickRandom(SYMBOLS);
  const others = SYMBOLS.filter((s) => s !== target);

  const grid: string[] = Array.from({ length: totalCells }, () => "");
  // The first filled cell holds the target; every other filled cell gets a
  // non-target symbol, so the target is unambiguous.
  filledCells.forEach((cell, i) => {
    grid[cell] = i === 0 ? target : pickRandom(others);
  });

  return {
    index,
    roundType: "position",
    level,
    gridSize,
    grid,
    target,
    displayMs: displayMsForLevel(level),
  };
}

export type MQGrade = {
  /** 0–1. Sequence rounds earn partial credit per position; maps are all or nothing. */
  accuracy: number;
  isCorrect: boolean;
  errorType: string | null;
};

export function gradeTrial(trial: MQTrial, response: MQResponse): MQGrade {
  if (trial.roundType === "sequence" && response.kind === "sequence") {
    const expected = trial.sequence;
    const matches = expected.filter((item, i) => response.items[i] === item)
      .length;
    const accuracy = expected.length > 0 ? matches / expected.length : 0;
    if (accuracy === 1) return { accuracy, isCorrect: true, errorType: null };

    // "order": every right symbol was recalled, just not in the right
    // places. "item": at least one symbol was missing or wrong.
    const sameItems =
      response.items.length === expected.length &&
      [...response.items].sort().join() === [...expected].sort().join();
    return {
      accuracy,
      isCorrect: false,
      errorType: sameItems ? "order" : "item",
    };
  }

  if (trial.roundType === "position" && response.kind === "position") {
    if (response.selectedIndex === null) {
      return { accuracy: 0, isCorrect: false, errorType: "timeout" };
    }
    const isCorrect = response.selectedIndex === trial.grid.indexOf(trial.target);
    return {
      accuracy: isCorrect ? 1 : 0,
      isCorrect,
      errorType: isCorrect ? null : "location",
    };
  }

  return { accuracy: 0, isCorrect: false, errorType: null };
}

/** Score for one round: accuracy x level x 100, so partial recall earns points. */
export function roundScore(trial: MQTrial, accuracy: number) {
  return Math.round(accuracy * trial.level * 100);
}

export type RoundPerformance = {
  accuracy: number;
  reactionTimeMs: number | null;
  corrections: number;
  displayMs: number;
};

// Rule-based adaptive level, carried over from the original in-memory
// version (no AI API needed):
//   strong round: >= 85% accuracy, answered within 2x the display time.
//   ADVANCE: STRONG_ROUNDS_TO_ADVANCE strong rounds in a row. The streak is
//            persisted in skill_states.streak, so it carries across sittings.
//   DROP:    any very poor round (< 40% accuracy, or 3+ corrections) drops
//            one level and resets the streak.
//   HOLD:    anything else keeps the level and resets the streak.
// The level only changes between sittings, since every round in a sitting
// was generated at the sitting's level.
export function nextLevel(
  level: number,
  previousStreak: number,
  rounds: RoundPerformance[],
): { level: number; streak: number } {
  let streak = previousStreak;
  let advanced = false;
  let dropped = false;

  for (const round of rounds) {
    const responseLimit = round.displayMs * 2;
    const isStrong =
      round.accuracy >= 0.85 &&
      round.reactionTimeMs !== null &&
      round.reactionTimeMs <= responseLimit;
    const isWeak = round.accuracy < 0.4 || round.corrections >= 3;

    if (isStrong) {
      streak += 1;
      if (streak >= STRONG_ROUNDS_TO_ADVANCE) {
        advanced = true;
        streak = 0;
      }
    } else {
      streak = 0;
      if (isWeak) dropped = true;
    }
  }

  if (advanced) return { level: clampLevel(level + 1), streak };
  if (dropped) return { level: clampLevel(level - 1), streak: 0 };
  return { level, streak };
}
