import { useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queries/fetch-json";
import { dashboardKeys } from "@/lib/queries/dashboard";
import type { MQResponse, MQTrial, SessionResult } from "./types";

// Game-specific mutations for POST /api/games/memory-quest — kept inside
// this game's own folder per frontend/AGENTS.md, mirroring
// backend/backend.md's rule that each game's API stays in its own folder.
// These are mutations, not queries: starting a session, submitting rounds,
// and completing a session all create or modify rows.

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
  level: number;
  trials: MQTrial[];
};

export function useStartMemoryQuestSessionMutation() {
  return useMutation({
    mutationFn: (input: StartSessionInput) =>
      fetchJson<StartSessionResult>("/api/games/memory-quest", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

type SubmitTrialsInput = {
  sessionId: string;
  trials: {
    trialIndex: number;
    response: MQResponse;
    reactionTimeMs?: number;
    timeToFirstMoveMs?: number;
  }[];
};

export function useSubmitMemoryQuestTrialsMutation() {
  return useMutation({
    mutationFn: (input: SubmitTrialsInput) =>
      fetchJson<{ recorded: number }>("/api/games/memory-quest/trial", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

export function useCompleteMemoryQuestSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) =>
      fetchJson<SessionResult>("/api/games/memory-quest/complete", {
        method: "POST",
        body: JSON.stringify({ sessionId }),
      }),
    onSuccess: () => {
      // The child's working_memory level and session count just changed;
      // the intro note and the dashboard both read them from here.
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
