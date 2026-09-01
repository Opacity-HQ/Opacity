import { create } from "zustand";
import type { RMTrial } from "@/app/api/games/rapid-match/plan";
import type { AccuracyResult } from "./types";

type Phase = "intro" | "playing" | "completed";

interface RapidMatchState {
  childId: string | null;
  phase: Phase;
  sessionId: string | null;
  trials: RMTrial[];
  trialCursor: number;
  accuracyResult: AccuracyResult | null;

  setChildId: (childId: string) => void;
  startSession: (payload: { sessionId: string; trials: RMTrial[] }) => void;
  advanceTrial: () => void;
  setCompleted: (accuracyResult: AccuracyResult) => void;
  resetToIntro: () => void;
}

export const useRapidMatchStore = create<RapidMatchState>((set) => ({
  childId: null,
  phase: "intro",
  sessionId: null,
  trials: [],
  trialCursor: 0,
  accuracyResult: null,

  setChildId: (childId) => set({ childId }),

  startSession: ({ sessionId, trials }) =>
    set({
      sessionId,
      trials,
      trialCursor: 0,
      phase: "playing",
      accuracyResult: null,
    }),

  advanceTrial: () =>
    set((state) => ({
      trialCursor: state.trialCursor + 1,
    })),

  setCompleted: (accuracyResult) =>
    set({
      phase: "completed",
      accuracyResult,
    }),

  resetToIntro: () =>
    set({
      phase: "intro",
      sessionId: null,
      trials: [],
      trialCursor: 0,
      accuracyResult: null,
    }),
}));
