import { ApiError } from "./api-error";

// Single place that understands the { ok, data } / { ok: false, error }
// envelope every route handler returns (see lib/api/response.ts). Every
// queryFn/mutationFn in the app goes through this — the one deliberate
// exception to "no raw fetch in client components" per frontend/AGENTS.md,
// since it's the shared primitive TanStack Query itself is built on.
export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body = await res.json();

  if (!res.ok || !body.ok) {
    throw new ApiError(
      body.error?.code ?? "internal_error",
      body.error?.message ?? "Something went wrong.",
      body.error?.details,
    );
  }

  return body.data as T;
}
