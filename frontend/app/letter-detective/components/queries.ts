import { useMutation } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queries/fetch-json";
import type { LDPair, LDTrial, LDResponse } from "./types";

// Game-specific mutations for POST /api/games/letter-detective — kept
// inside this game's own folder per frontend/AGENTS.md, mirroring
// backend/backend.md's rule that each game's API stays in its own folder.
// These are mutations, not queries: starting a session, submitting a
// trial, and completing a session are all actions with side effects
// (they create/modify rows), not idempotent reads.

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
  pair: LDPair;
  trials: LDTrial[];
};

export function useStartLetterDetectiveSessionMutation() {
  return useMutation({
    mutationFn: (input: StartSessionInput) =>
      fetchJson<StartSessionResult>("/api/games/letter-detective", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

type SubmitTrialsInput = {
  sessionId: string;
  trials: {
    trialIndex: number;
    response: LDResponse;
    reactionTimeMs?: number;
    timeToFirstMoveMs?: number;
  }[];
};

export function useSubmitLetterDetectiveTrialsMutation() {
  return useMutation({
    mutationFn: (input: SubmitTrialsInput) =>
      fetchJson<{ recorded: number }>("/api/games/letter-detective/trial", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

type CompleteSessionResult = {
  pair: LDPair;
  accuracy: number;
  meanRtMs: number | null;
  mastery: number;
  nextDifficultyLevel: number;
  streak: number;
};

export function useCompleteLetterDetectiveSessionMutation() {
  return useMutation({
    mutationFn: (sessionId: string) =>
      fetchJson<CompleteSessionResult>(
        "/api/games/letter-detective/complete",
        {
          method: "POST",
          body: JSON.stringify({ sessionId }),
        },
      ),
  });
}
