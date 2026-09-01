import { create } from "zustand";
import type { SMTrial } from "@/app/api/games/sound-match/plan";
import type { AccuracyResult } from "./types";

// Active game-session state only — per frontend/AGENTS.md, Zustand never
// duplicates server data (dashboard/children stays in TanStack Query).
// "loading" / "needs-child" / "error" are derived from the dashboard query
// in page.tsx, not duplicated here.
//
// `levelup` is the 1-2s non-blocking transition between in-session levels:
// it renders instead of the current trial and auto-clears via a timeout in
// LevelUpTransition, which then advances the cursor. It never routes
// anywhere and never blocks input longer than the transition.
type Phase = "intro" | "playing" | "levelup" | "completed";

interface SoundMatchState {
  childId: string | null;
  phase: Phase;
  sessionId: string | null;
  trials: SMTrial[];
  trialCursor: number;
  levelUpTo: number | null;
  accuracyResult: AccuracyResult | null;

  setChildId: (childId: string) => void;
  startSession: (payload: { sessionId: string; trials: SMTrial[] }) => void;
  advanceTrial: () => void;
  enterLevelUp: (level: number) => void;
  exitLevelUp: () => void;
  setCompleted: (accuracyResult: AccuracyResult) => void;
  resetToIntro: () => void;
}

export const useSoundMatchStore = create<SoundMatchState>((set) => ({
  childId: null,
  phase: "intro",
  sessionId: null,
  trials: [],
  trialCursor: 0,
  levelUpTo: null,
  accuracyResult: null,

  setChildId: (childId) => set({ childId }),

  startSession: ({ sessionId, trials }) =>
    set({
      sessionId,
      trials,
      trialCursor: 0,
      phase: "playing",
      levelUpTo: null,
      accuracyResult: null,
    }),

  advanceTrial: () => set((state) => ({ trialCursor: state.trialCursor + 1 })),

  enterLevelUp: (level) => set({ phase: "levelup", levelUpTo: level }),

  // The cursor only advances once the transition has finished playing.
  exitLevelUp: () =>
    set((state) => ({
      phase: "playing",
      levelUpTo: null,
      trialCursor: state.trialCursor + 1,
    })),

  setCompleted: (accuracyResult) => set({ phase: "completed", accuracyResult }),

  resetToIntro: () =>
    set({
      phase: "intro",
      sessionId: null,
      trials: [],
      trialCursor: 0,
      levelUpTo: null,
      accuracyResult: null,
    }),
}));
