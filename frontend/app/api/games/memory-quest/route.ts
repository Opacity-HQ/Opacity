import { NextRequest, NextResponse } from "next/server";

// ─── Types ────────────────────────────────────────────────────────────────────

type ChallengeType = "sequence" | "position";

type StoredChallenge = {
  playerId: string;
  type: ChallengeType;
  level: number;
  sequence: string[];
  target?: string;
  targetIndex?: number;
  gridSize?: number;
  displayMs: number;
  createdAt: number;
};

type PerformanceRecord = {
  /** 0.0–1.0: proportion of positions answered correctly in this round. */
  accuracy: number;
  responseTimeMs: number;
  mistakes: number;
  level: number;
};

type PlayerState = {
  level: number;
  history: PerformanceRecord[];
};

type GlobalMemoryQuestStore = {
  challenges: Map<string, StoredChallenge>;
  players: Map<string, PlayerState>;
};

// ─── Symbol pool (18 items — matches frontend EMOJI_MAP) ─────────────────────

const symbols = [
  "Star", "Home", "TreePine", "Moon", "Book", "Sun", "Key", "Cloud",
  "Heart", "Flower", "Umbrella", "Music", "Anchor", "Bell", "Rocket",
  "Snowflake", "Trophy", "Zap",
];

// ─── Difficulty constants ─────────────────────────────────────────────────────

/**
 * Hard cap on how high the level can go.
 * Level 20 = 22-item sequence with only 500 ms to memorise it.
 */
const MAX_LEVEL = 20;

/** Absolute floor for display time regardless of level. */
const MIN_DISPLAY_MS = 500;

const MAX_HISTORY = 20;
const CHALLENGE_LIFETIME_MS = 10 * 60 * 1000; // 10 min
const STORE_KEY = "__opacityMemoryQuestStore";

// ─── Difficulty scaling functions ─────────────────────────────────────────────

/** Sequence grows by one item per level: L1 → 3 items, L20 → 22 items. */
function sequenceLengthForLevel(level: number): number {
  return level + 2;
}

/**
 * Display time shrinks from 3 000 ms at L1 down to 500 ms floor around L13.
 *   L1  → 3 000 ms
 *   L5  → 2 200 ms
 *   L10 → 1 200 ms
 *   L13 →   700 ms
 *   L15+→   500 ms (floor)
 */
function displayMsForLevel(level: number): number {
  return Math.max(MIN_DISPLAY_MS, 3000 - (level - 1) * 200);
}

/**
 * How many consecutive good rounds are needed before the level advances.
 * Makes it progressively harder to climb at higher levels.
 *
 *   L1 – L4  : 2 rounds  (fast ramp-up so the game feels responsive)
 *   L5 – L10 : 3 rounds
 *   L11 – L15: 4 rounds
 *   L16 – L20: 5 rounds  (sustained mastery required at the top)
 */
function requiredWindowSize(level: number): number {
  if (level <= 4)  return 2;
  if (level <= 10) return 3;
  if (level <= 15) return 4;
  return 5;
}

// ─── In-memory store (development fallback) ───────────────────────────────────
//
// WARNING: This store lives in the Node.js process memory via globalThis.
// It persists across HTTP requests for the lifetime of the server process,
// but is completely wiped every time `npm run dev` restarts.
// Replace with Supabase reads/writes for durable, cross-session storage.

function getStore(): GlobalMemoryQuestStore {
  const g = globalThis as typeof globalThis & { [STORE_KEY]?: GlobalMemoryQuestStore };
  g[STORE_KEY] ??= { challenges: new Map(), players: new Map() };
  return g[STORE_KEY];
}

// ─── Player state helpers ─────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getPlayerState(playerId: string): PlayerState {
  const store = getStore();
  const existing = store.players.get(playerId);
  if (existing) return existing;
  const state: PlayerState = { level: 1, history: [] };
  store.players.set(playerId, state);
  return state;
}

function randomItems(length: number): string[] {
  return Array.from(
    { length },
    () => symbols[Math.floor(Math.random() * symbols.length)]
  );
}

function createChallenge(playerId: string, type: ChallengeType): StoredChallenge {
  const state  = getPlayerState(playerId);
  const level  = clamp(state.level, 1, MAX_LEVEL);
  const length = sequenceLengthForLevel(level);

  const challenge: StoredChallenge = {
    playerId,
    type,
    level,
    sequence: randomItems(length),
    displayMs: displayMsForLevel(level),
    createdAt: Date.now(),
  };

  if (type === "position") {
    challenge.gridSize = level <= 4 ? 3 : (level <= 9 ? 4 : 5);
    const totalCells = challenge.gridSize * challenge.gridSize;
    challenge.sequence = Array.from({ length: totalCells }, () => "");
    const indices = Array.from({ length: totalCells }, (_, i) => i).sort(() => Math.random() - 0.5);
    const filledIndices = indices.slice(0, Math.min(length, totalCells));
    const randomSymbols = randomItems(filledIndices.length);
    filledIndices.forEach((idx, i) => {
      challenge.sequence[idx] = randomSymbols[i];
    });
    challenge.targetIndex = filledIndices[Math.floor(Math.random() * filledIndices.length)];
    challenge.target      = challenge.sequence[challenge.targetIndex];
  }

  return challenge;
}

// ─── Adaptive difficulty model ────────────────────────────────────────────────
//
// Rule-based adaptive mastery algorithm (no external AI API required).
//
// ADVANCE: the player must sustain high accuracy AND fast responses across
//          N consecutive rounds, where N grows with the current level.
//          This prevents a lucky single round from inflating difficulty.
//
// DROP:    a single very poor round (accuracy < 40 % or many correction taps)
//          drops the player back one level immediately so they never feel stuck.
//
// HOLD:    anything in between — the level stays the same.
//
// Behavioural features collected per round (for future ML model):
//   accuracy, responseTimeMs, mistakes, level
// Cumulative summary exposed via the POST response:
//   accuracy %, maxSequenceLength, avgResponseTimeMs, difficultyLevelReached

function nextLevel(state: PlayerState, record: PerformanceRecord): number {
  const windowSize = requiredWindowSize(state.level);
  const recent     = [...state.history, record].slice(-windowSize);

  const avgAccuracy = recent.reduce((s, r) => s + r.accuracy, 0)       / recent.length;
  const avgResponse = recent.reduce((s, r) => s + r.responseTimeMs, 0) / recent.length;

  // The allowed response budget is 2× the display time for the current level.
  // A player who consistently answers within this window is performing well.
  const responseLimit = displayMsForLevel(state.level) * 2.0;

  // ── ADVANCE ──────────────────────────────────────────────────────────────
  // Need all N recent rounds to be strong (85 %+ accuracy, quick response).
  if (
    recent.length >= windowSize &&
    avgAccuracy  >= 0.85 &&
    avgResponse  <= responseLimit
  ) {
    return clamp(state.level + 1, 1, MAX_LEVEL);
  }

  // ── DROP ─────────────────────────────────────────────────────────────────
  // A single very bad round drops one level immediately.
  if (record.accuracy < 0.4 || record.mistakes >= 3) {
    return clamp(state.level - 1, 1, MAX_LEVEL);
  }

  // ── HOLD ─────────────────────────────────────────────────────────────────
  return state.level;
}

// ─── JSON helpers ─────────────────────────────────────────────────────────────

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

// ─── Route handlers ───────────────────────────────────────────────────────────

/**
 * GET /api/games/memory-quest?playerId=<id>&type=sequence|position
 *
 * Creates a new challenge at the player's current adaptive level.
 * Returns the sequence to display, the display duration in ms, the current
 * level, and an opaque challenge ID.  The expected answer is kept server-side.
 */
export async function GET(request: NextRequest) {
  const playerId      = request.nextUrl.searchParams.get("playerId")?.trim() || "guest";
  const requestedType = request.nextUrl.searchParams.get("type") || "sequence";

  if (requestedType !== "sequence" && requestedType !== "position") {
    return jsonError("type must be sequence or position", 400);
  }

  const challenge   = createChallenge(playerId, requestedType);
  const challengeId = crypto.randomUUID();
  getStore().challenges.set(challengeId, challenge);

  return NextResponse.json({
    ok: true,
    challenge: {
      id:             challengeId,
      type:           challenge.type,
      level:          challenge.level,
      sequence:       challenge.sequence,
      target:         challenge.target,
      targetIndex:    challenge.targetIndex,
      gridSize:       challenge.gridSize,
      displayMs:      challenge.displayMs,
      sequenceLength: challenge.sequence.length,
    },
  });
}

/**
 * POST /api/games/memory-quest
 *
 * Accepts the player's answer, scores each position individually (partial
 * accuracy 0–1), runs the adaptive difficulty policy, and returns:
 *   - result  : correctness, score, current level, next level, feedback text
 *   - summary : cumulative behavioural features for ML analysis
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON", 400);
  }

  if (!body || typeof body !== "object") {
    return jsonError("Request body must be an object", 400);
  }

  const input       = body as Record<string, unknown>;
  const challengeId = typeof input.challengeId === "string" ? input.challengeId : "";
  const playerId    = typeof input.playerId    === "string" ? input.playerId.trim() : "";
  const response    =
    Array.isArray(input.response) &&
    input.response.every((x) => typeof x === "string")
      ? (input.response as string[])
      : null;
  const responseTimeMs = typeof input.responseTimeMs === "number" ? input.responseTimeMs : NaN;
  const attempts       = typeof input.attempts        === "number" ? input.attempts        : 1;
  const mistakes       = typeof input.mistakes        === "number" ? input.mistakes        : 0;

  if (!challengeId || !playerId || !response || !Number.isFinite(responseTimeMs)) {
    return jsonError(
      "challengeId, playerId, response, and responseTimeMs are required",
      400
    );
  }

  const challenge = getStore().challenges.get(challengeId);
  if (!challenge || challenge.playerId !== playerId) {
    return jsonError("Challenge not found", 404);
  }
  if (Date.now() - challenge.createdAt > CHALLENGE_LIFETIME_MS) {
    return jsonError("Challenge expired", 410);
  }

  let accuracy = 0;
  if (challenge.type === "position") {
    const tappedIndex = parseInt(response[0] || "-1", 10);
    accuracy = tappedIndex === challenge.targetIndex ? 1 : 0;
  } else {
    // ── Partial accuracy: every matching position counts ──────────────────────
    const positionMatches = response.filter(
      (item, idx) => item === challenge.sequence[idx]
    ).length;
    accuracy = challenge.sequence.length > 0
      ? positionMatches / challenge.sequence.length
      : 0;
  }
  const correct = accuracy === 1;

  // ── Run the adaptive difficulty model ─────────────────────────────────────
  const state  = getPlayerState(playerId);
  const record: PerformanceRecord = {
    accuracy,
    responseTimeMs: clamp(responseTimeMs, 0, 120_000),
    mistakes:       clamp(Math.round(mistakes), 0, 100),
    level:          challenge.level,
  };
  const updatedLevel  = nextLevel(state, record);
  state.history       = [...state.history, record].slice(-MAX_HISTORY);
  state.level         = updatedLevel;
  getStore().challenges.delete(challengeId);

  // ── Cumulative behavioural summary (exposed as ML features) ───────────────
  const history = state.history;
  const summary = {
    /** Overall accuracy across all recorded rounds (0–100). */
    accuracy: Math.round(
      (history.reduce((s, r) => s + r.accuracy, 0) / history.length) * 100
    ),
    /** Longest sequence length the player has faced. */
    maxSequenceLength: Math.max(...history.map((r) => sequenceLengthForLevel(r.level))),
    /** Mean response time in ms. */
    averageResponseTimeMs: Math.round(
      history.reduce((s, r) => s + r.responseTimeMs, 0) / history.length
    ),
    attempts:               Math.max(1, Math.round(attempts)),
    errors:                 record.mistakes,
    difficultyLevelReached: Math.max(...history.map((r) => r.level)),
  };

  // Score: proportional to accuracy × level so partial recall earns points
  const score = Math.round(accuracy * challenge.level * 100);

  return NextResponse.json({
    ok: true,
    result: {
      correct,
      score,
      level:     challenge.level,
      nextLevel: updatedLevel,
      feedback:  correct
        ? "Perfect recall!"
        : accuracy >= 0.5
        ? "Almost there!"
        : "Good try!",
    },
    summary,
  });
}