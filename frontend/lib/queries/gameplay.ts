import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "./fetch-json";
import type { GameplayResult } from "@/lib/gameplay/types";
import { ApiError } from "./api-error";

export function useGameplayPrediction(childId: string, sessionRevision: string, completedSessionId?: string) {
  return useQuery({
    queryKey: ["experimental-gameplay", childId, sessionRevision, completedSessionId ?? null] as const,
    queryFn: async () => {
      const params = new URLSearchParams({ childId });
      if (completedSessionId) params.set("sessionId", completedSessionId);
      try {
        return await fetchJson<GameplayResult>(`/api/experimental/gameplay?${params}`);
      } catch (error) {
        if (error instanceof ApiError && error.code === "not_found") return null;
        throw error;
      }
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: false,
  });
}
