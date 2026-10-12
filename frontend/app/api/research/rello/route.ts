import { requireUser } from "@/lib/api/auth";
import { toApiErrorResponse } from "@/lib/api/response";
import { createRelloHandlers } from "@/lib/research/rello-route";
import { forwardResearchRequest } from "@/lib/research/service-client";

export const runtime = "nodejs";
const handlers = createRelloHandlers({
  enabled: () => process.env.OPACITY_RESEARCH_DEMO_ENABLED === "true",
  authenticate: requireUser,
  forward: forwardResearchRequest,
  authError: toApiErrorResponse,
});

export const GET = handlers.GET;
export const POST = handlers.POST;
