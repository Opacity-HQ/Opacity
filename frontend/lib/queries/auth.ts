import { useMutation } from "@tanstack/react-query";
import { fetchJson } from "./fetch-json";

type SigninInput =
  | { mode: "anonymous" }
  | { mode: "email"; email: string; password: string };

type SigninResult = {
  userId?: string;
  isAnonymous: boolean;
  confirmationRequired?: boolean;
  claimPending?: boolean;
};

// Auth mutations, not queries — signing in/up is an action with a side
// effect (a session is created), not data being read.
export function useSigninMutation() {
  return useMutation({
    mutationFn: (input: SigninInput) =>
      fetchJson<SigninResult>("/api/signin", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}

type LoginInput = { email: string; password: string };
type LoginResult = { userId?: string; isAnonymous: boolean };

export function useLoginMutation() {
  return useMutation({
    mutationFn: (input: LoginInput) =>
      fetchJson<LoginResult>("/api/login", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });
}
