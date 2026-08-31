import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";
import type { RMPlan } from "../plan";

const SKILL_KEY = "processing_speed";
const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 4;

const bodySchema = z.object({ sessionId: z.string().uuid() });

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function mean(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function coefficientOfVariation(values: number[]) {
  if (values.length < 2) return null;
  const m = mean(values)!;
  if (m === 0) return null;
  const variance =
    values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance) / m;
}

function countBy(values: (string | null)[]) {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = v ?? "correct";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export async function POST(request: NextRequest) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError("validation_failed", "Invalid completion request.");
    }

    const { supabase } = await requireUser();
    const { sessionId } = parsed.data;

    const { data: session, error: sessionError } = await supabase
      .from("game_sessions")
      .select("id, child_id, status, difficulty_level, started_at, config")
      .eq("id", sessionId)
      .maybeSingle();

    if (sessionError) throw sessionError;
    if (!session) return apiError("session_not_found", "Session not found.");
    if (session.status !== "in_progress") {
      return apiError(
        "session_already_completed",
        "This session has already been completed.",
      );
    }

    const { data: trials, error: trialsError } = await supabase
      .from("game_trials")
      .select("is_correct, error_type, reaction_time_ms")
      .eq("session_id", sessionId);

    if (trialsError) throw trialsError;

    const scored = (trials ?? []).filter((t) => t.is_correct !== null);
    const correctCount = scored.filter((t) => t.is_correct).length;
    const accuracy = scored.length > 0 ? correctCount / scored.length : 0;

    const reactionTimes = scored
      .map((t) => t.reaction_time_ms)
      .filter((v): v is number => v !== null);

    const completedAt = new Date();
    const startedAt = new Date(session.started_at);
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const meanRt = mean(reactionTimes);
    const medianRt = median(reactionTimes);
    const rtCv = coefficientOfVariation(reactionTimes);
    const throughput =
      durationMs > 0 ? correctCount / (durationMs / 60000) : 0;

    const plan = session.config as unknown as RMPlan;

    const { error: updateSessionError } = await supabase
      .from("game_sessions")
      .update({
        status: "completed",
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
      })
      .eq("id", sessionId);

    if (updateSessionError) throw updateSessionError;

    const { error: scoreError } = await supabase.from("session_scores").upsert({
      session_id: sessionId,
      accuracy,
      mean_rt_ms: meanRt,
      median_rt_ms: medianRt,
      rt_cv: rtCv,
      mirror_error_rate: 0,
      throughput,
      raw_features: {
        version: 1,
        difficultyLevel: plan.difficultyLevel,
        trialsScored: scored.length,
        errorTypeCounts: countBy(scored.map((t) => t.error_type)),
      },
    });

    if (scoreError) throw scoreError;

    const { data: existingSkillState } = await supabase
      .from("skill_states")
      .select("mastery, difficulty_level, streak")
      .eq("child_id", session.child_id)
      .eq("skill_key", SKILL_KEY)
      .maybeSingle();

    const previousMastery = existingSkillState?.mastery ?? 0;
    const previousStreak = existingSkillState?.streak ?? 0;

    const newMastery = previousMastery * 0.7 + accuracy * 0.3;
    const newStreak = accuracy >= 0.8 ? previousStreak + 1 : 0;

    let newDifficulty = session.difficulty_level;
    if (accuracy >= 0.85 && newStreak >= 2) {
      newDifficulty = Math.min(MAX_DIFFICULTY, session.difficulty_level + 1);
    } else if (accuracy < 0.5) {
      newDifficulty = Math.max(MIN_DIFFICULTY, session.difficulty_level - 1);
    }

    const { error: skillStateError } = await supabase
      .from("skill_states")
      .upsert(
        {
          child_id: session.child_id,
          skill_key: SKILL_KEY,
          mastery: newMastery,
          difficulty_level: newDifficulty,
          streak: newStreak,
        },
        { onConflict: "child_id,skill_key" },
      );

    if (skillStateError) throw skillStateError;

    return apiSuccess({
      accuracy,
      meanRtMs: meanRt,
      mastery: newMastery,
      nextDifficultyLevel: newDifficulty,
      streak: newStreak,
      throughput,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
