import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

export type RMRoundType = "target" | "compare" | "grid";

export type RMTrial =
  | {
      index: number;
      roundType: "target";
      isWarmup: boolean;
      targetSymbol: string;
      options: string[];
      exposureMs: number;
      timeoutMs: number;
    }
  | {
      index: number;
      roundType: "compare";
      isWarmup: boolean;
      leftSymbol: string;
      rightSymbol: string;
      isMatch: boolean;
      exposureMs: number;
      timeoutMs: number;
    }
  | {
      index: number;
      roundType: "grid";
      isWarmup: boolean;
      targetSymbol: string;
      gridSymbols: string[];
      exposureMs: number;
      timeoutMs: number;
    };

export type RMPlan = {
  version: 1;
  difficultyLevel: number;
  trials: RMTrial[];
};

export type RMResponse =
  | { kind: "target"; selectedOptionIndex: number | null }
  | { kind: "compare"; claimedMatch: boolean | null }
  | { kind: "grid"; selectedIndex: number | null };

const SHAPE_POOL = ["★", "▲", "■", "●", "✦", "⬢", "◆", "✿"] as const;
const ALPHA_POOL = ["A", "B", "E", "F", "H", "K", "M", "N", "1", "2", "5", "8"] as const;
const CONFUSABLE_PAIRS = [
  ["O", "0"],
  ["1", "I"],
  ["6", "9"],
  ["E", "F"],
  ["P", "R"],
  ["C", "G"],
  ["b", "d"],
  ["p", "q"],
  ["m", "w"],
] as const;

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

function exposureForDifficulty(difficultyLevel: number): number {
  if (difficultyLevel <= 1) return 1500;
  if (difficultyLevel === 2) return 1200;
  if (difficultyLevel === 3) return 900;
  return 700;
}

function timeoutForDifficulty(difficultyLevel: number): number {
  if (difficultyLevel <= 1) return 5000;
  if (difficultyLevel === 2) return 4000;
  if (difficultyLevel === 3) return 3500;
  return 3000;
}

function getSymbolPool(difficultyLevel: number): string[] {
  if (difficultyLevel <= 1) {
    return [...SHAPE_POOL];
  }
  if (difficultyLevel === 2) {
    return [...SHAPE_POOL, ...ALPHA_POOL];
  }
  const confusableFlat = CONFUSABLE_PAIRS.flat();
  return [...ALPHA_POOL, ...confusableFlat];
}

function buildTargetTrial(
  index: number,
  difficultyLevel: number,
  isWarmup: boolean,
): RMTrial {
  const pool = getSymbolPool(difficultyLevel);
  const targetSymbol = pickRandom(pool);
  
  let distractorCount = 3;
  if (difficultyLevel >= 3) distractorCount = 4;
  if (difficultyLevel >= 4) distractorCount = 5;

  const distractors = shuffle(pool.filter((s) => s !== targetSymbol)).slice(
    0,
    distractorCount,
  );
  const options = shuffle([targetSymbol, ...distractors]);

  return {
    index,
    roundType: "target",
    isWarmup,
    targetSymbol,
    options,
    exposureMs: exposureForDifficulty(difficultyLevel),
    timeoutMs: timeoutForDifficulty(difficultyLevel),
  };
}

function buildCompareTrial(
  index: number,
  difficultyLevel: number,
  isWarmup: boolean,
): RMTrial {
  const isMatch = Math.random() < 0.5;
  const pool = getSymbolPool(difficultyLevel);
  const leftSymbol = pickRandom(pool);
  let rightSymbol = leftSymbol;

  if (!isMatch) {
    if (difficultyLevel >= 3 && Math.random() < 0.6) {
      const pair = CONFUSABLE_PAIRS.find(
        (p) => p[0] === leftSymbol || p[1] === leftSymbol,
      );
      if (pair) {
        rightSymbol = pair[0] === leftSymbol ? pair[1] : pair[0];
      } else {
        const remaining = pool.filter((s) => s !== leftSymbol);
        rightSymbol = pickRandom(remaining);
      }
    } else {
      const remaining = pool.filter((s) => s !== leftSymbol);
      rightSymbol = pickRandom(remaining);
    }
  }

  return {
    index,
    roundType: "compare",
    isWarmup,
    leftSymbol,
    rightSymbol,
    isMatch: leftSymbol === rightSymbol,
    exposureMs: exposureForDifficulty(difficultyLevel),
    timeoutMs: timeoutForDifficulty(difficultyLevel),
  };
}

function buildGridTrial(
  index: number,
  difficultyLevel: number,
  isWarmup: boolean,
): RMTrial {
  const pool = getSymbolPool(difficultyLevel);
  const targetSymbol = pickRandom(pool);
  const gridSize = 9;
  const targetIndex = Math.floor(Math.random() * gridSize);

  const distractors = pool.filter((s) => s !== targetSymbol);
  const gridSymbols = Array.from({ length: gridSize }, (_, i) =>
    i === targetIndex ? targetSymbol : pickRandom(distractors),
  );

  return {
    index,
    roundType: "grid",
    isWarmup,
    targetSymbol,
    gridSymbols,
    exposureMs: exposureForDifficulty(difficultyLevel),
    timeoutMs: timeoutForDifficulty(difficultyLevel),
  };
}

export async function generatePlan(
  _supabase: SupabaseClient<Database>,
  difficultyLevel: number,
): Promise<RMPlan> {
  const trials: RMTrial[] = [];
  let index = 0;

  // 3 Warmup target trials
  for (let i = 0; i < 3; i++) {
    trials.push(buildTargetTrial(index++, difficultyLevel, true));
  }

  // Scored trials (15 trials total: 5 target, 5 compare, 5 grid)
  for (let i = 0; i < 5; i++) {
    trials.push(buildTargetTrial(index++, difficultyLevel, false));
  }

  for (let i = 0; i < 5; i++) {
    trials.push(buildCompareTrial(index++, difficultyLevel, false));
  }

  for (let i = 0; i < 5; i++) {
    trials.push(buildGridTrial(index++, difficultyLevel, false));
  }

  return {
    version: 1,
    difficultyLevel,
    trials,
  };
}

export function gradeTrial(
  trial: RMTrial,
  response: RMResponse,
): { isCorrect: boolean; errorType: string | null } {
  if (trial.roundType === "target" && response.kind === "target") {
    if (response.selectedOptionIndex === null) {
      return { isCorrect: false, errorType: "timeout" };
    }
    const correctIndex = trial.options.indexOf(trial.targetSymbol);
    const isCorrect = response.selectedOptionIndex === correctIndex;
    return {
      isCorrect,
      errorType: isCorrect ? null : "visual_similar",
    };
  }

  if (trial.roundType === "compare" && response.kind === "compare") {
    if (response.claimedMatch === null) {
      return { isCorrect: false, errorType: "timeout" };
    }
    const isCorrect = response.claimedMatch === trial.isMatch;
    return {
      isCorrect,
      errorType: isCorrect ? null : "visual_similar",
    };
  }

  if (trial.roundType === "grid" && response.kind === "grid") {
    if (response.selectedIndex === null) {
      return { isCorrect: false, errorType: "timeout" };
    }
    const correctIndex = trial.gridSymbols.indexOf(trial.targetSymbol);
    const isCorrect = response.selectedIndex === correctIndex;
    return {
      isCorrect,
      errorType: isCorrect ? null : "visual_similar",
    };
  }

  return { isCorrect: false, errorType: null };
}
