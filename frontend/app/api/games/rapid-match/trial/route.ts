import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";
import { gradeTrial, type RMPlan, type RMResponse } from "../plan";

const responseSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("target"), selectedOptionIndex: z.number().nullable() }),
  z.object({ kind: z.literal("compare"), claimedMatch: z.boolean().nullable() }),
  z.object({ kind: z.literal("grid"), selectedIndex: z.number().nullable() }),
]);

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  trials: z
    .array(
      z.object({
        trialIndex: z.number().int().min(0),
        response: responseSchema,
        reactionTimeMs: z.number().int().min(0).optional(),
        timeToFirstMoveMs: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "validation_failed",
        "Invalid trial submission.",
        parsed.error.flatten(),
      );
    }

    const { supabase } = await requireUser();
    const { sessionId, trials: submitted } = parsed.data;

    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("id, status, config")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) throw sessionError;
    if (!session) return apiError("session_not_found", "Session not found.");
    if (session.status !== "in_progress") {
      return apiError(
        "session_already_completed",
        "This session is no longer accepting trials.",
      );
    }

    const plan = session.config as unknown as RMPlan;
    const trialByIndex = new Map(plan.trials.map((t) => [t.index, t]));

    const rows = [];
    for (const submission of submitted) {
      const trial = trialByIndex.get(submission.trialIndex);
      if (!trial) {
        return apiError(
          "trial_out_of_range",
          `Trial index ${submission.trialIndex} is not part of this session.`,
        );
      }

      const { isCorrect, errorType } = gradeTrial(
        trial,
        submission.response as RMResponse,
      );

      rows.push({
        session_id: sessionId,
        trial_index: submission.trialIndex,
        stimulus: trial,
        response: submission.response,
        is_correct: trial.isWarmup ? null : isCorrect,
        error_type: trial.isWarmup ? null : errorType,
        reaction_time_ms: submission.reactionTimeMs ?? null,
        time_to_first_move_ms: submission.timeToFirstMoveMs ?? null,
      });
    }

    const { error: upsertError } = await supabase
      .from("game_trials")
      .upsert(rows, { onConflict: "session_id,trial_index" });

    if (upsertError) throw upsertError;

    return apiSuccess({ recorded: rows.length });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
