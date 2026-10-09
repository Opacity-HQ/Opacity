import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";
import {
  gradeTrial,
  nextLevel,
  roundScore,
  type MQPlan,
  type MQResponse,
  type RoundPerformance,
} from "../plan";

const SKILL_KEY = "working_memory";

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

// Grades the completed sitting: re-grades every recorded round against the
// stored plan, writes accuracy/RT features into session_scores (the vector
// Saatvik's ML service consumes), then updates skill_states with the
// adaptive level for the next sitting — the Identify -> Personalize ->
// Adjust -> Evolve loop from docs/saket/APP_FLOW.md.
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
      .select("trial_index, response, error_type, reaction_time_ms")
      .eq("session_id", sessionId)
      .order("trial_index");

    if (trialsError) throw trialsError;

    const plan = session.config as unknown as MQPlan;
    const trialByIndex = new Map(plan.trials.map((t) => [t.index, t]));

    // Re-grade from the stored plan rather than trusting anything stored
    // alongside the response — the per-round partial accuracy isn't a
    // column, and the plan is the single source of truth for the answer.
    const rounds = (trials ?? []).flatMap((row) => {
      const trial = trialByIndex.get(row.trial_index);
      if (!trial) return [];
      const response = row.response as unknown as MQResponse;
      const grade = gradeTrial(trial, response);
      return [
        {
          trial,
          grade,
          errorType: row.error_type,
          reactionTimeMs: row.reaction_time_ms,
          corrections: response.kind === "sequence" ? response.corrections : 0,
        },
      ];
    });

    const perfectRounds = rounds.filter((r) => r.grade.isCorrect);
    const accuracy =
      rounds.length > 0
        ? rounds.reduce((sum, r) => sum + r.grade.accuracy, 0) / rounds.length
        : 0;

    const reactionTimes = rounds
      .map((r) => r.reactionTimeMs)
      .filter((v): v is number => v !== null);

    const sequenceLengths = rounds.flatMap((r) =>
      r.trial.roundType === "sequence" ? [r.trial.sequence.length] : [],
    );
    const recalledLengths = perfectRounds.flatMap((r) =>
      r.trial.roundType === "sequence" ? [r.trial.sequence.length] : [],
    );
    const corrections = rounds.reduce((sum, r) => sum + r.corrections, 0);
    const score = rounds.reduce(
      (sum, r) => sum + roundScore(r.trial, r.grade.accuracy),
      0,
    );

    const completedAt = new Date();
    const startedAt = new Date(session.started_at);
    const durationMs = completedAt.getTime() - startedAt.getTime();

    const meanRt = mean(reactionTimes);
    const medianRt = median(reactionTimes);
    const rtCv = coefficientOfVariation(reactionTimes);
    const throughput =
      durationMs > 0 ? perfectRounds.length / (durationMs / 60000) : 0;
    const maxSequenceLength =
      sequenceLengths.length > 0 ? Math.max(...sequenceLengths) : 0;

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
      // Letter-reversal metric; not applicable to working memory.
      mirror_error_rate: null,
      throughput,
      raw_features: {
        version: 1,
        level: plan.level,
        roundsScored: rounds.length,
        perfectRounds: perfectRounds.length,
        // Longest path shown this sitting, and longest recalled perfectly
        // (the child's demonstrated span).
        maxSequenceLength,
        longestRecalledSequence:
          recalledLengths.length > 0 ? Math.max(...recalledLengths) : 0,
        attempts: rounds.length,
        errors: rounds.length - perfectRounds.length,
        corrections,
        score,
        errorTypeCounts: countBy(rounds.map((r) => r.errorType)),
      },
    });

    if (scoreError) throw scoreError;

    const { data: existingSkillState } = await supabase
      .from("skill_states")
      .select("mastery, streak")
      .eq("child_id", session.child_id)
      .eq("skill_key", SKILL_KEY)
      .maybeSingle();

    const previousMastery = existingSkillState?.mastery ?? 0;
    const previousStreak = existingSkillState?.streak ?? 0;

    // Simple exponential moving average — recent performance weighted
    // higher, but one bad sitting doesn't erase prior mastery.
    const newMastery = previousMastery * 0.7 + accuracy * 0.3;

    const performance: RoundPerformance[] = rounds.map((r) => ({
      accuracy: r.grade.accuracy,
      reactionTimeMs: r.reactionTimeMs,
      corrections: r.corrections,
      displayMs: r.trial.displayMs,
    }));
    const next = nextLevel(
      session.difficulty_level,
      previousStreak,
      performance,
    );

    const { error: skillStateError } = await supabase
      .from("skill_states")
      .upsert(
        {
          child_id: session.child_id,
          skill_key: SKILL_KEY,
          mastery: newMastery,
          difficulty_level: next.level,
          streak: next.streak,
        },
        { onConflict: "child_id,skill_key" },
      );

    if (skillStateError) throw skillStateError;

    return apiSuccess({
      accuracy,
      meanRtMs: meanRt,
      score,
      level: plan.level,
      nextDifficultyLevel: next.level,
      mastery: newMastery,
      streak: next.streak,
      maxSequenceLength,
      attempts: rounds.length,
      errors: rounds.length - perfectRounds.length,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

function countBy(values: (string | null)[]) {
  const counts: Record<string, number> = {};
  for (const v of values) {
    const key = v ?? "correct";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
