import { relloInputSchema, relloMetadataSchema, relloPredictionSchema } from "./rello-contract";

const HEADERS = { "Cache-Control": "no-store" };
const MAX_BODY_BYTES = 16_384;

function failure(code: string, message: string, status: number) {
  return Response.json({ ok: false, error: { code, message } }, { status, headers: HEADERS });
}

type Dependencies = {
  enabled: () => boolean;
  authenticate: () => Promise<unknown>;
  forward: (path: string, body?: unknown) => Promise<Response>;
  authError: (error: unknown) => Response;
};

async function readBody(request: Request) {
  if (!request.body) throw new Error("Missing JSON body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new RangeError("Request exceeds 16 KiB");
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

// Dependencies make auth and failure paths testable without a production session.
export function createRelloHandlers(deps: Dependencies) {
  async function authorize() {
    if (!deps.enabled()) return failure("not_found", "Research demo is not enabled.", 404);
    try {
      await deps.authenticate();
      return null;
    } catch (error) {
      const response = deps.authError(error);
      response.headers.set("Cache-Control", "no-store");
      return response;
    }
  }

  async function forward(path: string, body?: unknown) {
    try {
      const response = await deps.forward(path, body);
      if (response.status === 422) return failure("validation_failed", "The model rejected these task counts.", 422);
      if (!response.ok) return failure("service_unavailable", "Research prediction service is unavailable.", 503);
      const result = path.endsWith("metadata")
        ? relloMetadataSchema.safeParse(await response.json())
        : relloPredictionSchema.safeParse(await response.json());
      if (!result.success) return failure("service_unavailable", "Prediction service returned an incompatible response.", 503);
      return Response.json({ ok: true, data: result.data }, { headers: HEADERS });
    } catch {
      return failure("service_unavailable", "Cannot reach the research prediction service. Please try again.", 503);
    }
  }

  return {
    GET: async () => {
      const denied = await authorize();
      return denied ?? forward("/v1/research/rello/metadata");
    },
    POST: async (request: Request) => {
      const denied = await authorize();
      if (denied) return denied;
      const origin = request.headers.get("origin");
      if (origin && origin !== new URL(request.url).origin) return failure("forbidden", "Cross-origin requests are not allowed.", 403);
      if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
        return failure("validation_failed", "Send an application/json request.", 415);
      }
      let body: unknown;
      try {
        body = await readBody(request);
      } catch (error) {
        return failure("validation_failed", error instanceof RangeError ? "Request exceeds 16 KiB." : "Request must contain valid JSON.", error instanceof RangeError ? 413 : 400);
      }
      const parsed = relloInputSchema.safeParse(body);
      if (!parsed.success) return failure("validation_failed", parsed.error.issues[0]?.message ?? "Invalid task counts.", 422);
      return forward("/v1/research/rello/predict", parsed.data);
    },
  };
}
