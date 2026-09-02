import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/types";

// Sound Match — phonological-awareness screening.
//
// Two difficulty axes, per app/sound-match/AGENTS.md:
//  - INTRA-session (this file): a fixed 15-question progression, level tagged
//    by position (Q1-4 -> L1, Q5-8 -> L2, Q9-12 -> L3, Q13-15 -> L4). The
//    client reads `trial.level` off this server-authored plan and never
//    computes it itself (anti-tamper, see docs/saket/TRD.md).
//  - INTER-session (route.ts): `skill_states.difficulty_level` for
//    `phonological_awareness` (1-4) scales how hard the content inside each
//    in-session level actually is (timeout, minimal-pair pool).

export type SMRoundType =
  | "first-sound"
  | "rhyme"
  | "minimal-pair"
  | "phoneme-letter";

export type SMLevel = 1 | 2 | 3 | 4;

export type SMOption = { label: string; icon?: string };

type SMBase = {
  index: number;
  isWarmup: boolean;
  // 1..15 for scored trials ("Q1..Q15" in the source design); null for the
  // unscored warm-ups that sit outside that counter.
  questionNumber: number | null;
  // Server-authored instruction copy — the client never composes trial copy,
  // same reason game_sessions.config is server-authored everywhere else.
  prompt: string;
  timeoutMs: number;
};

export type SMTrial =
  | (SMBase & {
      level: 1;
      roundType: "first-sound";
      targetWord: string;
      spokenText: string;
      options: SMOption[];
      correctIndex: number;
    })
  | (SMBase & {
      level: 2;
      roundType: "rhyme";
      targetWord: string;
      spokenText: string;
      options: SMOption[];
      correctIndex: number;
    })
  | (SMBase & {
      level: 3;
      roundType: "minimal-pair";
      targetWord: string;
      spokenText: string;
      options: string[];
      correctIndex: number;
      confusionPair: [string, string];
    })
  | (SMBase & {
      level: 4;
      roundType: "phoneme-letter";
      targetPhoneme: string;
      spokenText: string;
      options: string[];
      correctIndex: number;
    });

export type SMPlan = {
  version: 1;
  difficultyLevel: number;
  trials: SMTrial[];
};

export type SMResponse = { selectedIndex: number | null };

// Pure function of question position, mirroring the source design table.
// An incorrect answer never demotes the level — position is the only input.
export function getLevel(questionNumber: number): SMLevel {
  if (questionNumber <= 4) return 1;
  if (questionNumber <= 8) return 2;
  if (questionNumber <= 12) return 3;
  return 4;
}

// ---------------------------------------------------------------------------
// Content banks
// ---------------------------------------------------------------------------

type PictureItem = {
  target: string;
  correct: SMOption;
  distractors: [SMOption, SMOption];
};

// L1 — first-sound recognition. Target word (spoken) shares its initial
// sound with the correct option; distractors do not. Every option carries a
// lucide icon so a pre-reader can answer from the picture.
const FIRST_SOUND_ITEMS: PictureItem[] = [
  { target: "monkey", correct: { label: "moon", icon: "Moon" }, distractors: [{ label: "dog", icon: "Dog" }, { label: "star", icon: "Star" }] },
  { target: "sock", correct: { label: "sun", icon: "Sun" }, distractors: [{ label: "cat", icon: "Cat" }, { label: "bird", icon: "Bird" }] },
  { target: "bicycle", correct: { label: "bell", icon: "Bell" }, distractors: [{ label: "fish", icon: "Fish" }, { label: "leaf", icon: "Leaf" }] },
  { target: "candle", correct: { label: "car", icon: "Car" }, distractors: [{ label: "moon", icon: "Moon" }, { label: "apple", icon: "Apple" }] },
  { target: "dolphin", correct: { label: "dog", icon: "Dog" }, distractors: [{ label: "key", icon: "Key" }, { label: "star", icon: "Star" }] },
  { target: "feather", correct: { label: "fish", icon: "Fish" }, distractors: [{ label: "car", icon: "Car" }, { label: "bird", icon: "Bird" }] },
  { target: "kitten", correct: { label: "key", icon: "Key" }, distractors: [{ label: "heart", icon: "Heart" }, { label: "cloud", icon: "Cloud" }] },
  { target: "lemon", correct: { label: "leaf", icon: "Leaf" }, distractors: [{ label: "gift", icon: "Gift" }, { label: "sun", icon: "Sun" }] },
  { target: "hamster", correct: { label: "heart", icon: "Heart" }, distractors: [{ label: "dog", icon: "Dog" }, { label: "apple", icon: "Apple" }] },
  { target: "goggles", correct: { label: "gift", icon: "Gift" }, distractors: [{ label: "fish", icon: "Fish" }, { label: "bell", icon: "Bell" }] },
  { target: "astronaut", correct: { label: "apple", icon: "Apple" }, distractors: [{ label: "moon", icon: "Moon" }, { label: "car", icon: "Car" }] },
  { target: "starfish", correct: { label: "star", icon: "Star" }, distractors: [{ label: "leaf", icon: "Leaf" }, { label: "dog", icon: "Dog" }] },
];

// L2 — rhyme. Target word (spoken) rhymes with the correct option only.
const RHYME_ITEMS: PictureItem[] = [
  { target: "jar", correct: { label: "car", icon: "Car" }, distractors: [{ label: "sun", icon: "Sun" }, { label: "fish", icon: "Fish" }] },
  { target: "bun", correct: { label: "sun", icon: "Sun" }, distractors: [{ label: "cat", icon: "Cat" }, { label: "leaf", icon: "Leaf" }] },
  { target: "log", correct: { label: "dog", icon: "Dog" }, distractors: [{ label: "bell", icon: "Bell" }, { label: "star", icon: "Star" }] },
  { target: "wish", correct: { label: "fish", icon: "Fish" }, distractors: [{ label: "moon", icon: "Moon" }, { label: "car", icon: "Car" }] },
  { target: "third", correct: { label: "bird", icon: "Bird" }, distractors: [{ label: "gift", icon: "Gift" }, { label: "sun", icon: "Sun" }] },
  { target: "smart", correct: { label: "heart", icon: "Heart" }, distractors: [{ label: "dog", icon: "Dog" }, { label: "key", icon: "Key" }] },
  { target: "proud", correct: { label: "cloud", icon: "Cloud" }, distractors: [{ label: "cat", icon: "Cat" }, { label: "bell", icon: "Bell" }] },
  { target: "shell", correct: { label: "bell", icon: "Bell" }, distractors: [{ label: "fish", icon: "Fish" }, { label: "star", icon: "Star" }] },
  { target: "name", correct: { label: "flame", icon: "Flame" }, distractors: [{ label: "dog", icon: "Dog" }, { label: "moon", icon: "Moon" }] },
  { target: "toast", correct: { label: "ghost", icon: "Ghost" }, distractors: [{ label: "sun", icon: "Sun" }, { label: "car", icon: "Car" }] },
  { target: "spoon", correct: { label: "moon", icon: "Moon" }, distractors: [{ label: "cat", icon: "Cat" }, { label: "bell", icon: "Bell" }] },
  { target: "far", correct: { label: "star", icon: "Star" }, distractors: [{ label: "key", icon: "Key" }, { label: "leaf", icon: "Leaf" }] },
];

type MinimalPairItem = {
  target: string;
  options: [string, string, string];
  pair: [string, string];
  hard: boolean;
};

// L3 — minimal-pair discrimination. `hard: false` = the easy confusable pool
// (b/p, sh/ch); `hard: true` = the harder pool (i/ee, a/e, f/v, d/t). The
// base difficulty picks which pool is drawn from.
const MINIMAL_PAIR_ITEMS: MinimalPairItem[] = [
  { target: "pear", options: ["pear", "bear", "chair"], pair: ["p", "b"], hard: false },
  { target: "big", options: ["big", "pig", "dig"], pair: ["b", "p"], hard: false },
  { target: "cab", options: ["cab", "cap", "cat"], pair: ["b", "p"], hard: false },
  { target: "pack", options: ["pack", "back", "tack"], pair: ["p", "b"], hard: false },
  { target: "shop", options: ["shop", "chop", "stop"], pair: ["sh", "ch"], hard: false },
  { target: "shin", options: ["shin", "chin", "thin"], pair: ["sh", "ch"], hard: false },
  { target: "wash", options: ["wash", "watch", "wasp"], pair: ["sh", "ch"], hard: false },
  { target: "sheep", options: ["sheep", "ship", "shape"], pair: ["ee", "i"], hard: true },
  { target: "cheap", options: ["cheap", "chip", "chirp"], pair: ["ee", "i"], hard: true },
  { target: "beat", options: ["beat", "bit", "bait"], pair: ["ee", "i"], hard: true },
  { target: "pen", options: ["pen", "pan", "pin"], pair: ["e", "a"], hard: true },
  { target: "bed", options: ["bed", "bad", "bud"], pair: ["e", "a"], hard: true },
  { target: "van", options: ["van", "fan", "man"], pair: ["v", "f"], hard: true },
  { target: "vine", options: ["vine", "fine", "wine"], pair: ["v", "f"], hard: true },
  { target: "time", options: ["time", "dime", "lime"], pair: ["t", "d"], hard: true },
];

type PhonemeLetterItem = {
  phoneme: string;
  spoken: string;
  correct: string;
  options: [string, string, string, string];
  prompt: string;
};

const PROMPT_INITIAL = "Which letter makes this sound?";
const PROMPT_FINAL = "Which letter makes the LAST sound you hear?";

// L4 — phoneme -> letter, with 4 options. The last two items target a sound
// at a non-initial position in the word, per the source design.
const PHONEME_LETTER_ITEMS: PhonemeLetterItem[] = [
  { phoneme: "/b/", spoken: "buh", correct: "B", options: ["B", "D", "P", "T"], prompt: PROMPT_INITIAL },
  { phoneme: "/d/", spoken: "duh", correct: "D", options: ["D", "B", "P", "T"], prompt: PROMPT_INITIAL },
  { phoneme: "/p/", spoken: "puh", correct: "P", options: ["P", "B", "D", "T"], prompt: PROMPT_INITIAL },
  { phoneme: "/t/", spoken: "tuh", correct: "T", options: ["T", "D", "P", "B"], prompt: PROMPT_INITIAL },
  { phoneme: "/f/", spoken: "ffff", correct: "F", options: ["F", "V", "S", "Z"], prompt: PROMPT_INITIAL },
  { phoneme: "/v/", spoken: "vvvv", correct: "V", options: ["V", "F", "B", "W"], prompt: PROMPT_INITIAL },
  { phoneme: "/g/", spoken: "guh", correct: "G", options: ["G", "K", "C", "J"], prompt: PROMPT_INITIAL },
  { phoneme: "/m/", spoken: "mmmm", correct: "M", options: ["M", "N", "W", "H"], prompt: PROMPT_INITIAL },
  { phoneme: 'end of "cat"', spoken: "cat", correct: "T", options: ["T", "D", "K", "N"], prompt: PROMPT_FINAL },
  { phoneme: 'end of "dog"', spoken: "dog", correct: "G", options: ["G", "K", "D", "B"], prompt: PROMPT_FINAL },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function timeoutFor(level: SMLevel, baseDifficulty: number, isWarmup: boolean): number {
  if (isWarmup) return 15000;
  const base = { 1: 9000, 2: 8000, 3: 7000, 4: 7000 }[level];
  return Math.max(3500, base - (baseDifficulty - 1) * 1000);
}

function buildPicture(
  index: number,
  questionNumber: number | null,
  level: 1 | 2,
  baseDifficulty: number,
  item: PictureItem,
  isWarmup: boolean,
): SMTrial {
  const options = shuffle<SMOption>([item.correct, ...item.distractors]);
  const correctIndex = options.indexOf(item.correct);
  const shared: SMBase = {
    index,
    isWarmup,
    questionNumber,
    prompt:
      level === 1
        ? "Which picture starts with the same sound as the word you hear?"
        : "Which picture rhymes with the word you hear?",
    timeoutMs: timeoutFor(level, baseDifficulty, isWarmup),
  };
  if (level === 1) {
    return { ...shared, level: 1, roundType: "first-sound", targetWord: item.target, spokenText: item.target, options, correctIndex };
  }
  return { ...shared, level: 2, roundType: "rhyme", targetWord: item.target, spokenText: item.target, options, correctIndex };
}

function buildMinimalPair(
  index: number,
  questionNumber: number,
  baseDifficulty: number,
  item: MinimalPairItem,
): SMTrial {
  const options = shuffle(item.options);
  const correctIndex = options.indexOf(item.target);
  return {
    index,
    isWarmup: false,
    questionNumber,
    prompt: "Listen carefully. Which word did you hear?",
    timeoutMs: timeoutFor(3, baseDifficulty, false),
    level: 3,
    roundType: "minimal-pair",
    targetWord: item.target,
    spokenText: item.target,
    options,
    correctIndex,
    confusionPair: item.pair,
  };
}

function buildPhonemeLetter(
  index: number,
  questionNumber: number,
  baseDifficulty: number,
  item: PhonemeLetterItem,
): SMTrial {
  const options = shuffle(item.options);
  const correctIndex = options.indexOf(item.correct);
  return {
    index,
    isWarmup: false,
    questionNumber,
    prompt: item.prompt,
    timeoutMs: timeoutFor(4, baseDifficulty, false),
    level: 4,
    roundType: "phoneme-letter",
    targetPhoneme: item.phoneme,
    spokenText: item.spoken,
    options,
    correctIndex,
  };
}

// ---------------------------------------------------------------------------
// Plan generation
// ---------------------------------------------------------------------------

// The Supabase client is unused: unlike Letter Detective (which reads
// ld_* content tables) Sound Match's content banks are static in this file.
// Kept in the signature to match the shared game-plan contract.
export async function generatePlan(
  _supabase: SupabaseClient<Database>,
  difficultyLevel: number,
): Promise<SMPlan> {
  const baseDifficulty = clamp(Math.round(difficultyLevel) || 1, 1, 4);

  const firstSoundPool = shuffle(FIRST_SOUND_ITEMS);
  const warmups = firstSoundPool.slice(0, 2);
  const l1 = firstSoundPool.slice(2, 6);
  const l2 = shuffle(RHYME_ITEMS).slice(0, 4);
  const l3Bank =
    baseDifficulty >= 3
      ? MINIMAL_PAIR_ITEMS
      : MINIMAL_PAIR_ITEMS.filter((item) => !item.hard);
  const l3 = shuffle(l3Bank).slice(0, 4);
  const l4 = shuffle(PHONEME_LETTER_ITEMS).slice(0, 3);

  const trials: SMTrial[] = [];
  let index = 0;

  // 2 unscored warm-ups (Level 1 mechanic), outside the Q1..Q15 counter —
  // see app/sound-match/AGENTS.md "Warm-up decision".
  for (const item of warmups) {
    trials.push(buildPicture(index++, null, 1, baseDifficulty, item, true));
  }
  l1.forEach((item, i) => trials.push(buildPicture(index++, i + 1, 1, baseDifficulty, item, false)));
  l2.forEach((item, i) => trials.push(buildPicture(index++, i + 5, 2, baseDifficulty, item, false)));
  l3.forEach((item, i) => trials.push(buildMinimalPair(index++, i + 9, baseDifficulty, item)));
  l4.forEach((item, i) => trials.push(buildPhonemeLetter(index++, i + 13, baseDifficulty, item)));

  return { version: 1, difficultyLevel: baseDifficulty, trials };
}

// Pure and server-only — the single grading authority for both live scoring
// (trial/route.ts) and nothing else. Never trust a client-sent correctness
// flag (docs/saket/TRD.md "Anti-tamper model").
export function gradeTrial(
  trial: SMTrial,
  response: SMResponse,
): { isCorrect: boolean; errorType: string | null } {
  if (response.selectedIndex === null) {
    return { isCorrect: false, errorType: "timeout" };
  }
  const isCorrect = response.selectedIndex === trial.correctIndex;
  // `error_type` reserves "phonological" in game_trials for exactly this
  // game (docs/saket/BACKEND_SCHEMA.md) — don't invent a new taxonomy value.
  return { isCorrect, errorType: isCorrect ? null : "phonological" };
}
