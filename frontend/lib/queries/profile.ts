import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { fetchJson } from "./fetch-json";
import { dashboardKeys } from "./dashboard";
import { onboardingKeys } from "./onboarding";

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
