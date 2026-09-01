import { create } from "zustand";
import type { WBTrial } from "./types";

// Active game session state only — per frontend/AGENTS.md, Zustand never
// duplicates server data. Dashboard/child data stays in TanStack Query
// (lib/queries/dashboard.ts) as the single source of truth; this store only
// holds the client-side flow state of a session actually in progress.
type Phase = "intro" | "playing" | "solved";

type WordBuilderState = {
  childId: string | null;
  phase: Phase;
  sessionId: string | null;
  trials: WBTrial[];
  trialCursor: number;
  accuracyResult: number;
  setChildId: (childId: string) => void;
  startSession: (input: { sessionId: string; trials: WBTrial[] }) => void;
  advanceTrial: () => void;
  setSolved: (accuracyResult: number) => void;
  resetToIntro: () => void;
};

export const useWordBuilderStore = create<WordBuilderState>((set) => ({
  childId: null,
  phase: "intro",
  sessionId: null,
  trials: [],
  trialCursor: 0,
  accuracyResult: 0,

  setChildId: (childId) => set({ childId }),

  startSession: ({ sessionId, trials }) =>
    set({ sessionId, trials, trialCursor: 0, phase: "playing" }),

  advanceTrial: () => set((s) => ({ trialCursor: s.trialCursor + 1 })),

  setSolved: (accuracyResult) => set({ accuracyResult, phase: "solved" }),

  resetToIntro: () =>
    set({
      phase: "intro",
      sessionId: null,
      trials: [],
      trialCursor: 0,
    }),
}));
