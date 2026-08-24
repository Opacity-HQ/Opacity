// Mirrors the ApiErrorCode union in frontend/lib/api/response.ts. Thrown by
// fetchJson so every useQuery/useMutation error carries a stable `code` a
// component can branch on, instead of parsing error.message text.
export class ApiError extends Error {
  code: string;
  details?: unknown;

  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}
