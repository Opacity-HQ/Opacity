import { create } from "zustand";
import type { MQTrial, SessionResult, TrialOutcome } from "./types";

// Active game session state only — per frontend/AGENTS.md, Zustand never
// duplicates server data. Dashboard/child data stays in TanStack Query
// (lib/queries/dashboard.ts) as the single source of truth; this store only
// holds the client-side flow state of a sitting actually in progress.
// "loading" / "needs-child" / "error" are NOT phases here — those are
// derived from the dashboard query's status in page.tsx.
type Phase = "intro" | "show" | "recall" | "feedback" | "stats";

type MemoryQuestState = {
  childId: string | null;
  phase: Phase;
  sessionId: string | null;
  level: number;
  trials: MQTrial[];
  trialCursor: number;
  lastOutcome: TrialOutcome | null;
  // Running totals across every sitting since the page opened; the
  // per-sitting numbers come back from /complete in `result`.
  roundsPlayed: number;
  totalScore: number;
  result: SessionResult | null;
  setChildId: (childId: string) => void;
  startSession: (input: {
    sessionId: string;
    level: number;
    trials: MQTrial[];
  }) => void;
  startRecall: () => void;
  recordOutcome: (outcome: TrialOutcome) => void;
  nextRound: () => void;
  setResult: (result: SessionResult) => void;
  resetToIntro: () => void;
};

export const useMemoryQuestStore = create<MemoryQuestState>((set) => ({
  childId: null,
  phase: "intro",
  sessionId: null,
  level: 1,
  trials: [],
  trialCursor: 0,
  lastOutcome: null,
  roundsPlayed: 0,
  totalScore: 0,
  result: null,

  setChildId: (childId) => set({ childId }),

  startSession: ({ sessionId, level, trials }) =>
    set({
      sessionId,
      level,
      trials,
      trialCursor: 0,
      lastOutcome: null,
      result: null,
      phase: "show",
    }),

  startRecall: () => set({ phase: "recall" }),

  recordOutcome: (outcome) =>
    set((s) => ({
      lastOutcome: outcome,
      roundsPlayed: s.roundsPlayed + 1,
      totalScore: s.totalScore + outcome.localScore,
      phase: "feedback",
    })),

  nextRound: () =>
    set((s) => ({ trialCursor: s.trialCursor + 1, phase: "show" })),

  setResult: (result) => set({ result, phase: "stats" }),

  resetToIntro: () =>
    set({
      phase: "intro",
      sessionId: null,
      trials: [],
      trialCursor: 0,
      lastOutcome: null,
    }),
}));
