import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./fetch-json";
import { ApiError } from "./api-error";

// Structured query key hierarchy per frontend/AGENTS.md. Dashboard data is
// shared across every game and the dashboard route itself, so it lives in
// lib/queries rather than any one game's folder.
export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export type DashboardGameProgress = {
  gameId: string;
  gameName: string;
  sessionsCompleted: number;
  lastPlayedAt: string | null;
  difficultyLevel: number;
};

export type DashboardChild = {
  id: string;
  displayName: string;
  birthYear: number;
  gradeLevel: string | null;
  locale: string;
  games: DashboardGameProgress[];
  skills: {
    skillKey: string;
    mastery: number;
    difficultyLevel: number;
    streak: number;
  }[];
  latestReport: {
    riskBand: string;
    strengths: unknown;
    needsPractice: unknown;
    progress: unknown;
    generatedAt: string;
  } | null;
};

type DashboardData = { children: DashboardChild[] };

// unauthorized is never worth retrying — the session isn't coming back
// without the user taking a new action, so retrying just delays the error.
function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.code === "unauthorized") return false;
  return failureCount < 2;
}

export function useDashboardQuery() {
  return useQuery({
    queryKey: dashboardKeys.all,
    queryFn: () => fetchJson<DashboardData>("/api/dashboard"),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    // A child's dashboard data doesn't need to refetch just because the
    // player alt-tabbed mid-game — avoid disruptive background fetching
    // during active gameplay, per frontend/AGENTS.md.
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: shouldRetry,
  });
}

type CreateChildInput = {
  displayName: string;
  birthYear: number;
  gradeLevel?: string;
  locale?: string;
};

export function useCreateChildMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChildInput) =>
      fetchJson<{
        id: string;
        displayName: string;
        birthYear: number;
        gradeLevel: string | null;
        locale: string;
      }>("/api/dashboard", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
