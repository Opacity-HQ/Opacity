// Server-authored stimulus plan for one Word Builder session, plus the
// grading logic for it. Lives inside this game's own API folder per
// backend/backend.md — nothing here is shared with other games.
//
// Mechanic: the child briefly sees a whole word, then its letters scramble
// into tiles (plus a few distractor letters at higher tiers) and they must
// tap tiles back into the correct order. This targets orthographic
// sequencing and spelling-pattern recall — the "decoding" skill_domain this
// game is seeded under in the `games` table.
//
// Deliberate design: no trial stores a separate "answer" field — the
// correct spelling is always `trial.word`, which the client needs anyway to
// run the preview. Grading recomputes correctness/error type server-side
// from the submitted tile order at submit time, per docs/saket/TRD.md
// "Anti-tamper model".

import { WORD_BANK, DISTRACTOR_LETTER_POOL } from "./word-bank";

export type WBTrial = {
  index: number;
  isWarmup: boolean;
  word: string;
  tiles: string[];
  previewMs: number;
  timeoutMs: number;
  difficultyTier: number;
};

export type WBPlan = {
  version: 1;
  trials: WBTrial[];
};

export type WBResponse = {
  kind: "build";
  tileIndices: number[];
};

const WARMUP_COUNT = 2;
const MIN_TIER = 1;
const MAX_TIER = 4;

const DISTRACTOR_COUNT_BY_TIER: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3 };

// Preview shrinks as difficulty rises, mirroring Letter Detective's
// exposure-time knob in docs/saket/UIUX_BRIEF.md.
function previewMsForTier(tier: number) {
  if (tier <= 1) return 2500;
  if (tier === 2) return 2000;
  if (tier === 3) return 1600;
  return 1300;
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickWord(tier: number, used: Set<string>): string {
  const pool = WORD_BANK[tier].filter((w) => !used.has(w));
  const candidates = pool.length > 0 ? pool : WORD_BANK[tier];
  const word = candidates[Math.floor(Math.random() * candidates.length)];
  used.add(word);
  return word;
}

function buildDistractors(word: string, count: number): string[] {
  const exclude = new Set(word.split(""));
  const pool = DISTRACTOR_LETTER_POOL.filter((l) => !exclude.has(l));
  return shuffle(pool).slice(0, count);
}

function buildTrial(index: number, word: string, tier: number, isWarmup: boolean): WBTrial {
  const distractors = buildDistractors(word, isWarmup ? 0 : DISTRACTOR_COUNT_BY_TIER[tier]);
  const tiles = shuffle([...word.split(""), ...distractors]);
  return {
    index,
    isWarmup,
    word,
    tiles,
    previewMs: isWarmup ? 3000 : previewMsForTier(tier),
    timeoutMs: 20000,
    difficultyTier: tier,
  };
}

// Scored trials are weighted toward the child's assigned tier but spread
// across a couple of neighboring tiers too — a few easier warm confidence
// words, a couple of longer "stretch" words. This keeps every session
// varied in word length instead of gating all longer words behind repeated
// full-mastery sessions, while the majority still lands at the tier the
// adaptive difficulty actually assigned.
function tiersForSession(tier: number): number[] {
  const spread = [
    tier,
    tier,
    tier,
    tier,
    tier,
    Math.min(MAX_TIER, tier + 1),
    Math.min(MAX_TIER, tier + 1),
    Math.max(MIN_TIER, tier - 1),
  ];
  return shuffle(spread);
}

export function generatePlan(difficultyLevel: number): WBPlan {
  const tier = Math.min(Math.max(difficultyLevel, MIN_TIER), MAX_TIER);
  const used = new Set<string>();
  const trials: WBTrial[] = [];
  let index = 0;

  // Warm-up trials at tier 1, excluded from scoring.
  for (let i = 0; i < WARMUP_COUNT; i++) {
    trials.push(buildTrial(index++, pickWord(MIN_TIER, used), MIN_TIER, true));
  }

  for (const trialTier of tiersForSession(tier)) {
    trials.push(buildTrial(index++, pickWord(trialTier, used), trialTier, false));
  }

  return { version: 1, trials };
}

function sortedLetters(word: string): string {
  return word.toLowerCase().split("").sort().join("");
}

const REVERSAL_PAIRS: Record<string, string> = { b: "d", d: "b", p: "q", q: "p" };

export type DetailedErrorType =
  | "timeout"
  | "omission"
  | "insertion"
  | "transposition"
  | "reversal"
  | "substitution";

// Full spelling-error taxonomy, independent of what the `game_trials`
// table's `error_type` column can store (see gradeTrial below). Used both
// for the per-trial grade and — recomputed from the stored stimulus +
// response — for the richer breakdown in session_scores.raw_features at
// completion, so no signal is lost to the column's narrower vocabulary.
export function classifyOutcome(
  trial: WBTrial,
  response: WBResponse,
): { isCorrect: boolean; detailedErrorType: DetailedErrorType | null } {
  const submittedLetters = response.tileIndices
    .map((i) => trial.tiles[i])
    .filter((l): l is string => typeof l === "string");

  if (submittedLetters.length === 0) {
    return { isCorrect: false, detailedErrorType: "timeout" };
  }

  const submitted = submittedLetters.join("").toLowerCase();
  const target = trial.word.toLowerCase();

  if (submitted === target) {
    return { isCorrect: true, detailedErrorType: null };
  }

  if (submitted.length === target.length && sortedLetters(submitted) === sortedLetters(target)) {
    return { isCorrect: false, detailedErrorType: "transposition" };
  }

  if (submitted.length < target.length) {
    return { isCorrect: false, detailedErrorType: "omission" };
  }

  if (submitted.length > target.length) {
    return { isCorrect: false, detailedErrorType: "insertion" };
  }

  const mismatches: number[] = [];
  for (let i = 0; i < target.length; i++) {
    if (submitted[i] !== target[i]) mismatches.push(i);
  }
  const allReversals =
    mismatches.length > 0 &&
    mismatches.every((i) => REVERSAL_PAIRS[target[i]] === submitted[i]);

  return {
    isCorrect: false,
    detailedErrorType: allReversals ? "reversal" : "substitution",
  };
}

// The `game_trials.error_type` check constraint (see
// backend/supabase/migrations/20260823090007_game_sessions_and_trials.sql)
// only allows Letter Detective's vocabulary: mirror, rotation,
// visual_similar, phonological, omission, timeout. A b/d or p/q reversal
// *is* a mirror-image confusion, so "reversal" reuses "mirror" directly.
// transposition/insertion/substitution have no real match in that set and
// are stored as null here — full detail lives in classifyOutcome/raw_features.
const DB_SAFE_ERROR_TYPE: Partial<Record<DetailedErrorType, string>> = {
  timeout: "timeout",
  omission: "omission",
  reversal: "mirror",
};

export function gradeTrial(
  trial: WBTrial,
  response: WBResponse,
): { isCorrect: boolean; errorType: string | null } {
  const { isCorrect, detailedErrorType } = classifyOutcome(trial, response);
  const errorType = detailedErrorType ? (DB_SAFE_ERROR_TYPE[detailedErrorType] ?? null) : null;
  return { isCorrect, errorType };
}
