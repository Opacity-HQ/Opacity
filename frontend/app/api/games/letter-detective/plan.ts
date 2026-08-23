import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

// Server-authored stimulus plan for one Letter Detective session (one
// "case", built around a single confusable letter pair) plus the grading
// logic for it. Lives inside this game's own API folder per
// backend/backend.md — nothing here is shared with other games.
//
// Round types implement docs/saket/UIUX_BRIEF.md:
//   lineup   -> "The Lineup"            (mirror/rotation discrimination)
//   impostor -> "Spot the Impostor"     (pure visual discrimination)
//   stakeout -> "Stakeout"              (sustained search, throughput/vigilance)
//   words    -> "Undercover in Words"   (position-conditional accuracy)
// "Case Files" is the session-level wrapper (one pair = one case), not a
// round type of its own.
//
// Deliberate design: no trial stores a separate "answer key" field
// (correctOptionIndex / impostorIndex / correctPositions). The answer is
// always derivable from data the client needs anyway to render the round
// (options+targetLetter, gridLetters+impostorLetter, word+targetLetter), so
// storing it separately would just be an answer key sitting in the network
// response for free. Grading recomputes it server-side from those same
// fields at submit time.

const DISTRACTOR_POOL = [
  "a", "c", "e", "g", "h", "k", "l", "r", "s", "v", "x", "y", "z",
] as const;

type ConfusionType = "mirror" | "rotation" | "visual" | "sequence";

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

export type LDPlan = {
  version: 1;
  pair: { letterA: string; letterB: string; confusionType: ConfusionType };
  trials: LDTrial[];
};

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

// Exposure time shrinks as difficulty rises, per docs/saket/UIUX_BRIEF.md
// adaptive knobs (unlimited -> 1200ms -> 600ms masked).
function exposureForDifficulty(difficultyLevel: number) {
  if (difficultyLevel <= 1) return 1200;
  if (difficultyLevel === 2) return 900;
  if (difficultyLevel === 3) return 700;
  return 600;
}

function buildDistractors(exclude: string[], count: number) {
  const pool = DISTRACTOR_POOL.filter((l) => !exclude.includes(l));
  return shuffle([...pool]).slice(0, count);
}

export async function generatePlan(
  supabase: SupabaseClient<Database>,
  difficultyLevel: number,
): Promise<LDPlan> {
  const difficultyTier = Math.min(difficultyLevel, 4);

  const { data: tieredPairs, error: pairsError } = await supabase
    .from("ld_letter_pairs")
    .select("letter_a, letter_b, confusion_type, difficulty_tier")
    .lte("difficulty_tier", difficultyTier);

  if (pairsError) throw pairsError;

  let pairPool = tieredPairs ?? [];
  if (pairPool.length === 0) {
    const { data: allPairs, error: allPairsError } = await supabase
      .from("ld_letter_pairs")
      .select("letter_a, letter_b, confusion_type, difficulty_tier");
    if (allPairsError) throw allPairsError;
    pairPool = allPairs ?? [];
  }
  if (pairPool.length === 0) {
    throw new Error("No Letter Detective content seeded.");
  }

  const chosenPair = pickRandom(pairPool);
  const pair: LDPlan["pair"] = {
    letterA: chosenPair.letter_a,
    letterB: chosenPair.letter_b,
    confusionType: chosenPair.confusion_type as ConfusionType,
  };

  const exposureMs = exposureForDifficulty(difficultyLevel);
  const timeoutMs = 5000;

  const trials: LDTrial[] = [];
  let index = 0;

  // 3 warm-up lineup trials, excluded from scoring.
  for (let i = 0; i < 3; i++) {
    trials.push(buildLineupTrial(index++, pair, exposureMs, timeoutMs, true));
  }

  for (let i = 0; i < 4; i++) {
    trials.push(buildLineupTrial(index++, pair, exposureMs, timeoutMs, false));
  }

  for (let i = 0; i < 4; i++) {
    trials.push(buildImpostorTrial(index++, pair, exposureMs, timeoutMs));
  }

  for (let i = 0; i < 6; i++) {
    const isTarget = Math.random() < 0.4;
    trials.push(
      buildStakeoutTrial(index++, pair, exposureMs, timeoutMs, isTarget),
    );
  }

  const { data: words } = await supabase
    .from("ld_word_items")
    .select("word, target_letter, position, difficulty_tier")
    .in("target_letter", [pair.letterA, pair.letterB])
    .lte("difficulty_tier", difficultyTier);

  const chosenWords = shuffle(words ?? []).slice(0, 4);
  for (const w of chosenWords) {
    trials.push(
      buildWordsTrial(index++, w.word, w.target_letter, exposureMs, timeoutMs),
    );
  }

  return { version: 1, pair, trials };
}

function buildLineupTrial(
  index: number,
  pair: LDPlan["pair"],
  exposureMs: number,
  timeoutMs: number,
  isWarmup: boolean,
): LDTrial {
  const target = Math.random() < 0.5 ? pair.letterA : pair.letterB;
  const twin = target === pair.letterA ? pair.letterB : pair.letterA;
  const distractors = buildDistractors([pair.letterA, pair.letterB], 3);
  const options = shuffle([target, twin, ...distractors]);
  return {
    index,
    roundType: "lineup",
    isWarmup,
    targetLetter: target,
    twinLetter: twin,
    options,
    exposureMs,
    timeoutMs,
  };
}

function buildImpostorTrial(
  index: number,
  pair: LDPlan["pair"],
  exposureMs: number,
  timeoutMs: number,
): LDTrial {
  const base = Math.random() < 0.5 ? pair.letterA : pair.letterB;
  const impostor = base === pair.letterA ? pair.letterB : pair.letterA;
  const gridSize = 9;
  const impostorPosition = Math.floor(Math.random() * gridSize);
  const gridLetters = Array.from({ length: gridSize }, (_, i) =>
    i === impostorPosition ? impostor : base,
  );
  return {
    index,
    roundType: "impostor",
    isWarmup: false,
    baseLetter: base,
    impostorLetter: impostor,
    gridLetters,
    exposureMs,
    timeoutMs,
  };
}

function buildStakeoutTrial(
  index: number,
  pair: LDPlan["pair"],
  exposureMs: number,
  timeoutMs: number,
  isTarget: boolean,
): LDTrial {
  const target = pair.letterA;
  const twin = pair.letterB;
  const distractors = buildDistractors([pair.letterA, pair.letterB], 4);
  const streamLetter = isTarget ? target : pickRandom([twin, ...distractors]);
  return {
    index,
    roundType: "stakeout",
    isWarmup: false,
    streamLetter,
    isTarget: streamLetter === target,
    exposureMs,
    timeoutMs,
  };
}

function buildWordsTrial(
  index: number,
  word: string,
  targetLetter: string,
  exposureMs: number,
  timeoutMs: number,
): LDTrial {
  return {
    index,
    roundType: "words",
    isWarmup: false,
    word,
    targetLetter,
    exposureMs: exposureMs * 2,
    timeoutMs: timeoutMs * 2,
  };
}

export type LDResponse =
  | { kind: "lineup"; selectedOptionIndex: number | null }
  | { kind: "impostor"; selectedIndex: number | null }
  | { kind: "stakeout"; tapped: boolean }
  | { kind: "words"; tappedPositions: number[] };

export function gradeTrial(
  trial: LDTrial,
  response: LDResponse,
  confusionType: ConfusionType,
): { isCorrect: boolean; errorType: string | null } {
  const confusionErrorType =
    confusionType === "mirror"
      ? "mirror"
      : confusionType === "rotation"
        ? "rotation"
        : "visual_similar";

  if (trial.roundType === "lineup" && response.kind === "lineup") {
    if (response.selectedOptionIndex === null) {
      return { isCorrect: false, errorType: "timeout" };
    }
    const correctIndex = trial.options.indexOf(trial.targetLetter);
    const isCorrect = response.selectedOptionIndex === correctIndex;
    if (isCorrect) return { isCorrect, errorType: null };
    const selectedTwin =
      trial.options[response.selectedOptionIndex] === trial.twinLetter;
    return { isCorrect, errorType: selectedTwin ? confusionErrorType : null };
  }

  if (trial.roundType === "impostor" && response.kind === "impostor") {
    if (response.selectedIndex === null) {
      return { isCorrect: false, errorType: "timeout" };
    }
    const correctIndex = trial.gridLetters.indexOf(trial.impostorLetter);
    const isCorrect = response.selectedIndex === correctIndex;
    return { isCorrect, errorType: isCorrect ? null : confusionErrorType };
  }

  if (trial.roundType === "stakeout" && response.kind === "stakeout") {
    const isCorrect = response.tapped === trial.isTarget;
    if (isCorrect) return { isCorrect, errorType: null };
    return {
      isCorrect,
      errorType: trial.isTarget ? "omission" : confusionErrorType,
    };
  }

  if (trial.roundType === "words" && response.kind === "words") {
    const expected: number[] = [];
    for (let i = 0; i < trial.word.length; i++) {
      if (trial.word[i].toLowerCase() === trial.targetLetter.toLowerCase()) {
        expected.push(i);
      }
    }
    const submitted = [...response.tappedPositions].sort((a, b) => a - b);
    expected.sort((a, b) => a - b);
    const isCorrect =
      submitted.length === expected.length &&
      submitted.every((v, i) => v === expected[i]);
    return { isCorrect, errorType: isCorrect ? null : "omission" };
  }

  return { isCorrect: false, errorType: null };
}
