import { z } from "zod";
import { extractGameplayFeatures, GAMEPLAY_CONTRACT, type GameplaySession } from "./features";
import { predictGameplayVector } from "./model";
import type { GameplayResult } from "./types";

type Dependencies = {
  enabled: () => boolean;
  // Auth and database access stay in one operation, using the same RLS client.
  loadAuthorizedSessions: (childId: string, since: string) => Promise<GameplaySession[]>;
  errorResponse: (error: unknown) => Response;
  now?: () => number;
};

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
function failure(status: number, code: string, message: string) {
  return Response.json({ ok: false, error: { code, message } }, { status, headers });
}

export function createGameplayHandler(deps: Dependencies) {
  return async function GET(request: Request) {
    if (!deps.enabled()) return failure(404, "not_found", "Gameplay prototype is disabled.");
    const url = new URL(request.url);
    const parsed = z.string().uuid().safeParse(url.searchParams.get("childId"));
    const sessionParam = url.searchParams.get("sessionId");
    const session = z.string().uuid().nullable().safeParse(sessionParam);
    if (!parsed.success || url.searchParams.getAll("childId").length !== 1
        || !session.success || url.searchParams.getAll("sessionId").length > 1
        || [...url.searchParams.keys()].some((key) => key !== "childId" && key !== "sessionId")) {
      return failure(400, "validation_failed", "Provide a valid childId and optional completed sessionId.");
    }
    const now = (deps.now ?? Date.now)();
    const since = new Date(now - GAMEPLAY_CONTRACT.assessment_window_days * 86_400_000).toISOString();
    let sessions: GameplaySession[];
    try {
      sessions = await deps.loadAuthorizedSessions(parsed.data, since);
    } catch (error) {
      const response = deps.errorResponse(error);
      response.headers.set("Cache-Control", headers["Cache-Control"]);
      response.headers.set("Vary", "Cookie");
      return response;
    }
    try {
      const { games, values } = extractGameplayFeatures(sessions, parsed.data, now);
      // A completion screen must include the just-finished session. Never show
      // an old classification if its score hasn't saved or isn't usable yet.
      const pendingSession = session.data !== null
        && !games.some((game) => game.ready && game.sessionId === session.data);
      const common = { games, simulated: true as const, trainingSource: "synthetic" as const,
        pendingSession, assessmentWindowDays: GAMEPLAY_CONTRACT.assessment_window_days };
      const result: GameplayResult = values === null || pendingSession
        ? { ...common, status: "needs_games" }
        : { ...common, status: "ready", ...predictGameplayVector(values),
            sessionsIncluded: games.filter((game) => game.ready).map((game) => game.sessionId!) };
      return Response.json({ ok: true, data: result }, { headers });
    } catch {
      return failure(503, "model_unavailable", "The gameplay model is unavailable. Please try again.");
    }
  };
}
