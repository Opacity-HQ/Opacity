import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "./fetch-json";
import { dashboardKeys } from "./dashboard";

export const onboardingKeys = {
  all: ["onboarding"] as const,
};

export type OnboardingStatus = {
  signedIn: boolean;
  needsOnboarding: boolean;
  hasChildren: boolean;
  displayName: string | null;
};

// The gate is mounted app-wide, so this runs on every route. It never
// refetches on its own (focus/reconnect): the answer only changes when the
// user signs in or completes the form, and both of those invalidate it
// explicitly. Keeping it off focus-refetch also avoids a modal appearing
// mid-game.
export function useOnboardingQuery() {
  return useQuery({
    queryKey: onboardingKeys.all,
    queryFn: () => fetchJson<OnboardingStatus>("/api/signin/onboarding"),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}

type SaveOnboardingInput = {
  fullName: string;
  birthYear?: number;
  gradeLevel?: string;
};

export function useSaveOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveOnboardingInput) =>
      fetchJson<{ displayName: string; childCreated: boolean }>(
        "/api/signin/onboarding",
        { method: "POST", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      // Status flips to "done", and the first child may now exist for every
      // game's dashboard lookup.
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
