import { NextRequest } from "next/server";
import { z } from "zod";
import { requireChildAccess } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";
import { generatePlan } from "./plan";

const SKILL_KEY = "processing_speed";
const GAME_ID = "rapid-match";

const startSchema = z.object({
  childId: z.string().uuid(),
  device: z
    .object({
      userAgent: z.string().max(300).optional(),
      screenWidth: z.number().optional(),
      screenHeight: z.number().optional(),
      inputType: z.enum(["touch", "mouse", "keyboard"]).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = startSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(
        "validation_failed",
        "Invalid session start request.",
        parsed.error.flatten(),
      );
    }

    const { supabase, child } = await requireChildAccess(parsed.data.childId);

    const { data: skillState } = await supabase
      .from("skill_states")
      .select("difficulty_level")
      .eq("child_id", child.id)
      .eq("skill_key", SKILL_KEY)
      .maybeSingle();

    const difficultyLevel = skillState?.difficulty_level ?? 1;

    const plan = await generatePlan(supabase, difficultyLevel);

    const { data: session, error } = await supabase
      .from("game_sessions")
      .insert({
        child_id: child.id,
        game_id: GAME_ID,
        status: "in_progress",
        difficulty_level: difficultyLevel,
        config: plan,
        device: parsed.data.device ?? {},
      })
      .select("id")
      .single();

    if (error) throw error;

    return apiSuccess({
      sessionId: session.id,
      trials: plan.trials,
      difficultyLevel,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
