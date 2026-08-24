import { create } from "zustand";
import type { LDPair, LDTrial } from "./types";

// Active game session state only — per frontend/AGENTS.md, Zustand never
// duplicates server data. Dashboard/child data stays in TanStack Query
// (lib/queries/dashboard.ts) as the single source of truth; this store only
// holds the client-side flow state of a session actually in progress.
// "loading" / "needs-child" / "error" are NOT phases here — those are
// derived directly from the dashboard query's status in page.tsx, not
// duplicated into this store.
type Phase = "intro" | "playing" | "solved";

type LetterDetectiveState = {
  childId: string | null;
  phase: Phase;
  sessionId: string | null;
  pair: LDPair | null;
  trials: LDTrial[];
  trialCursor: number;
  accuracyResult: number;
  setChildId: (childId: string) => void;
  startSession: (input: {
    sessionId: string;
    pair: LDPair;
    trials: LDTrial[];
  }) => void;
  advanceTrial: () => void;
  setSolved: (accuracyResult: number) => void;
  resetToIntro: () => void;
};

export const useLetterDetectiveStore = create<LetterDetectiveState>(
  (set) => ({
    childId: null,
    phase: "intro",
    sessionId: null,
    pair: null,
    trials: [],
    trialCursor: 0,
    accuracyResult: 0,

    setChildId: (childId) => set({ childId }),

    startSession: ({ sessionId, pair, trials }) =>
      set({ sessionId, pair, trials, trialCursor: 0, phase: "playing" }),

    advanceTrial: () => set((s) => ({ trialCursor: s.trialCursor + 1 })),

    setSolved: (accuracyResult) => set({ accuracyResult, phase: "solved" }),

    resetToIntro: () =>
      set({
        phase: "intro",
        sessionId: null,
        pair: null,
        trials: [],
        trialCursor: 0,
      }),
  }),
);
