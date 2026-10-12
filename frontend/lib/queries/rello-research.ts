import { useMutation, useQuery } from "@tanstack/react-query";
import type { RelloInput, RelloMetadata, RelloPrediction } from "@/lib/research/rello-contract";
import { fetchJson } from "./fetch-json";

export function useRelloMetadata() {
  return useQuery({
    queryKey: ["research", "rello", "metadata"],
    queryFn: () => fetchJson<RelloMetadata>("/api/research/rello"),
    select: (data) => ({ ...data, taskList: data.questions.join(", ") }),
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
    retry: false,
  });
}

export function useRelloPrediction() {
  return useMutation({
    mutationKey: ["research", "rello", "prediction"],
    mutationFn: (input: RelloInput) => fetchJson<RelloPrediction>("/api/research/rello", {
      method: "POST", body: JSON.stringify(input),
    }),
    retry: false,
    gcTime: 0,
    // Predictions have no optimistic result: wait for the fitted model's answer.
  });
}
