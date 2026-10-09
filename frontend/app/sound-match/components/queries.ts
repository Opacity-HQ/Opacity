import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queries/fetch-json";
import type { SMTrial, SMResponse } from "@/app/api/games/sound-match/plan";
import type { AccuracyResult } from "./types";

// Game-specific mutations for POST /api/games/sound-match — kept in this
// game's own folder per frontend/AGENTS.md, same shape as Rapid Match's.

export type StartSessionInput = {
  childId: string;
  device?: {
    userAgent?: string;
    screenWidth?: number;
    screenHeight?: number;
    inputType?: "touch" | "mouse" | "keyboard";
  };
};

export type StartSessionOutput = {
  sessionId: string;
  trials: SMTrial[];
  difficultyLevel: number;
};

export type SubmitTrialsInput = {
  sessionId: string;
  trials: Array<{
    trialIndex: number;
    response: SMResponse;
    reactionTimeMs?: number;
    timeToFirstMoveMs?: number;
  }>;
};

export function useStartSoundMatchSessionMutation() {
  return useMutation({
    mutationFn: (input: StartSessionInput) =>
      fetchJson<StartSessionOutput>("/api/games/sound-match", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSubmitSoundMatchTrialsMutation() {
  return useMutation({
    mutationFn: (input: SubmitTrialsInput) =>
      fetchJson<{ recorded: number }>("/api/games/sound-match/trial", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useCompleteSoundMatchSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      fetchJson<AccuracyResult>("/api/games/sound-match/complete", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
