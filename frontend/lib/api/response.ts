import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_failed"
  | "session_not_found"
  | "session_already_completed"
  | "trial_out_of_range"
  | "rate_limited"
  | "internal_error";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiErrorBody = {
  ok: false;
  error: { code: ApiErrorCode; message: string; details?: unknown };
};

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  validation_failed: 422,
  session_not_found: 404,
  session_already_completed: 409,
  trial_out_of_range: 422,
  rate_limited: 429,
  internal_error: 500,
};

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ ok: true, data }, init);
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: unknown,
) {
  return NextResponse.json<ApiErrorBody>(
    { ok: false, error: { code, message, details } },
    { status: STATUS_BY_CODE[code] },
  );
}

// Thrown by lib/api/auth.ts helpers and caught at the route handler
// boundary, so `requireUser()` / `requireChildAccess()` can short-circuit a
// handler without every route hand-rolling its own error response.
export class ApiRouteError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiRouteError";
  }
}

export function toApiErrorResponse(err: unknown) {
  if (err instanceof ApiRouteError) {
    return apiError(err.code, err.message, err.details);
  }
  console.error(err);
  return apiError("internal_error", "Something went wrong.");
}
