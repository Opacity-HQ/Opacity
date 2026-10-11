import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchJson } from "./fetch-json";
import { dashboardKeys } from "./dashboard";
import { onboardingKeys } from "./onboarding";
import type {
  ClinicalProfile,
  ClinicalSectionKey,
} from "@/lib/profile/clinical";

// Structured query keys per frontend/AGENTS.md.
export const profileKeys = {
  clinical: (childId: string) => ["profile", "clinical", childId] as const,
};

type ClinicalResponse = { profile: ClinicalProfile; updatedAt: string | null };

export function useClinicalProfileQuery(childId: string | null) {
  return useQuery({
    queryKey: profileKeys.clinical(childId ?? "none"),
    queryFn: () =>
      fetchJson<ClinicalResponse>(
        `/api/profile/clinical?childId=${encodeURIComponent(childId!)}`,
      ),
    enabled: Boolean(childId),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    select: (data) => data.profile,
  });
}

type SaveSectionInput<K extends ClinicalSectionKey = ClinicalSectionKey> = {
  childId: string;
  section: K;
  value: ClinicalProfile[K];
};

export function useSaveClinicalSectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SaveSectionInput) =>
      fetchJson<{ profile: ClinicalProfile }>("/api/profile/clinical", {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    // Show the saved value immediately; roll back if the server rejects it.
    onMutate: async ({ childId, section, value }) => {
      const key = profileKeys.clinical(childId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ClinicalResponse>(key);
      if (previous) {
        queryClient.setQueryData<ClinicalResponse>(key, {
          ...previous,
          profile: { ...previous.profile, [section]: value },
        });
      }
      return { previous, key };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: (_data, _err, { childId }) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.clinical(childId) });
    },
  });
}

export function useDeleteClinicalProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) =>
      fetchJson<{ deleted: true }>(
        `/api/profile/clinical?childId=${encodeURIComponent(childId)}`,
        { method: "DELETE" },
      ),
    onSuccess: (_data, childId) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.clinical(childId) });
    },
  });
}

export function useUpdateChildMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { childId: string; displayName: string; age: number }) =>
      fetchJson<{ displayName: string; birthYear: number }>(
        "/api/profile/child",
        { method: "PATCH", body: JSON.stringify(input) },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}

export function useDeleteChildMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) =>
      fetchJson<{ deleted: true }>(
        `/api/profile/child?childId=${encodeURIComponent(childId)}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<{ deleted: true }>("/api/profile/account", {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

// Auth actions run against the Supabase browser client (the session lives in
// its cookies), wrapped as mutations so they follow the same loading/error
// handling as the rest of the page.
export function useSignOutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await createClient().auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: async (password: string) => {
      const { error } = await createClient().auth.updateUser({ password });
      if (error) throw error;
    },
  });
}

export function useChangeEmailMutation() {
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await createClient().auth.updateUser({ email });
      if (error) throw error;
    },
  });
}

export function useSignOutEverywhereMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await createClient().auth.signOut({ scope: "global" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
