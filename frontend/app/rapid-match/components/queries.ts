import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queries/fetch-json";
import type { RMTrial, RMResponse } from "@/app/api/games/rapid-match/plan";
import type { AccuracyResult } from "./types";

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
  trials: RMTrial[];
  difficultyLevel: number;
};

export type SubmitTrialsInput = {
  sessionId: string;
  trials: Array<{
    trialIndex: number;
    response: RMResponse;
    reactionTimeMs?: number;
    timeToFirstMoveMs?: number;
  }>;
};

export function useStartRapidMatchSessionMutation() {
  return useMutation({
    mutationFn: (input: StartSessionInput) =>
      fetchJson<StartSessionOutput>("/api/games/rapid-match", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useSubmitRapidMatchTrialsMutation() {
  return useMutation({
    mutationFn: (input: SubmitTrialsInput) =>
      fetchJson<{ recorded: number }>("/api/games/rapid-match/trial", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useCompleteRapidMatchSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      fetchJson<AccuracyResult>("/api/games/rapid-match/complete", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
