import { useMutation } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queries/fetch-json";
import type { WBTrial, WBResponse } from "./types";

// Game-specific mutations for POST /api/games/word-builder — kept inside
// this game's own folder per frontend/AGENTS.md, mirroring backend/backend.md's
// rule that each game's API stays in its own folder. These are mutations,
// not queries: starting a session, submitting a trial, and completing a
// session are all actions with side effects (they create/modify rows), not
// idempotent reads.

type StartSessionInput = {
  childId: string;
  device?: {
    userAgent?: string;
    screenWidth?: number;
    screenHeight?: number;
    inputType?: "touch" | "mouse" | "keyboard";
  };
};

type StartSessionResult = {
  sessionId: string;
  trials: WBTrial[];
};

export function useStartWordBuilderSessionMutation() {
  return useMutation({
    mutationFn: (input: StartSessionInput) =>
      fetchJson<StartSessionResult>("/api/games/word-builder", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

type SubmitTrialsInput = {
  sessionId: string;
  trials: {
    trialIndex: number;
    response: WBResponse;
    reactionTimeMs?: number;
    timeToFirstMoveMs?: number;
  }[];
};

export function useSubmitWordBuilderTrialsMutation() {
  return useMutation({
    mutationFn: (input: SubmitTrialsInput) =>
      fetchJson<{ recorded: number }>("/api/games/word-builder/trial", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

type CompleteSessionResult = {
  accuracy: number;
  meanRtMs: number | null;
  mastery: number;
  nextDifficultyLevel: number;
  streak: number;
};

export function useCompleteWordBuilderSessionMutation() {
  return useMutation({
    mutationFn: (sessionId: string) =>
      fetchJson<CompleteSessionResult>("/api/games/word-builder/complete", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      }),
  });
}
