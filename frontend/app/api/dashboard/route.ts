import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { apiSuccess, apiError, toApiErrorResponse } from "@/lib/api/response";

const currentYear = new Date().getFullYear();
const createChildSchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  birthYear: z.number().int().min(1990).max(currentYear),
  gradeLevel: z.string().trim().max(40).optional(),
  locale: z.string().trim().max(10).optional(),
});

// Dashboard-level aggregate data only, per backend/backend.md — no
// game-specific logic here. Fetches everything the RLS-scoped user can see
// (their own children, or the children of classrooms they teach) and
// aggregates per-game progress and the latest screening report in JS. Fine
// at this scale (a handful of children, a few dozen sessions each); revisit
// with a Postgres view/RPC if this ever needs to aggregate at real volume.
export async function GET() {
  try {
    const { supabase } = await requireUser();

    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select("id, display_name, birth_year, grade_level, locale, owner_id")
      .order("created_at", { ascending: true });

    if (childrenError) throw childrenError;
    if (!children || children.length === 0) {
      return apiSuccess({ children: [] });
    }

    const childIds = children.map((c) => c.id);

    const [{ data: games }, { data: sessions }, { data: skillStates }, { data: reports }] =
      await Promise.all([
        supabase.from("games").select("id, name, skill_domain"),
        supabase
          .from("game_sessions")
          .select("child_id, game_id, status, difficulty_level, completed_at, started_at")
          .in("child_id", childIds),
        supabase
          .from("skill_states")
          .select("child_id, skill_key, mastery, difficulty_level, streak")
          .in("child_id", childIds),
        supabase
          .from("screening_reports")
          .select(
            "child_id, risk_band, strengths, needs_practice, progress, generated_at",
          )
          .in("child_id", childIds)
          .order("generated_at", { ascending: false }),
      ]);

    const gameNames = new Map((games ?? []).map((g) => [g.id, g.name]));

    const latestReportByChild = new Map<
      string,
      NonNullable<typeof reports>[number]
    >();
    for (const report of reports ?? []) {
      if (!latestReportByChild.has(report.child_id)) {
        latestReportByChild.set(report.child_id, report);
      }
    }

    const result = children.map((child) => {
      const childSessions = (sessions ?? []).filter(
        (s) => s.child_id === child.id,
      );

      const gameProgress = (games ?? []).map((game) => {
        const forGame = childSessions.filter((s) => s.game_id === game.id);
        const completed = forGame.filter((s) => s.status === "completed");
        const mostRecent = [...forGame].sort(
          (a, b) =>
            new Date(b.started_at).getTime() - new Date(a.started_at).getTime(),
        )[0];

        return {
          gameId: game.id,
          gameName: gameNames.get(game.id) ?? game.id,
          sessionsCompleted: completed.length,
          lastPlayedAt: mostRecent?.started_at ?? null,
          difficultyLevel: mostRecent?.difficulty_level ?? 1,
        };
      });

      const skills = (skillStates ?? [])
        .filter((s) => s.child_id === child.id)
        .map((s) => ({
          skillKey: s.skill_key,
          mastery: s.mastery,
          difficultyLevel: s.difficulty_level,
          streak: s.streak,
        }));

      const report = latestReportByChild.get(child.id) ?? null;

      return {
        id: child.id,
        displayName: child.display_name,
        birthYear: child.birth_year,
        gradeLevel: child.grade_level,
        locale: child.locale,
        games: gameProgress,
        skills,
        latestReport: report
          ? {
              riskBand: report.risk_band,
              strengths: report.strengths,
              needsPractice: report.needs_practice,
              progress: report.progress,
              generatedAt: report.generated_at,
            }
          : null,
      };
    });

    return apiSuccess({ children: result });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

// Creates a child profile owned by the current user (anonymous guest or
// full account — see docs/saket/APP_FLOW.md). This is the entry point that
// unblocks every game: session start requires a childId.
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await requireUser();
    const parsed = createChildSchema.safeParse(await request.json());

    if (!parsed.success) {
      return apiError(
        "validation_failed",
        "Invalid child profile.",
        parsed.error.flatten(),
      );
    }

    const { data: child, error } = await supabase
      .from("children")
      .insert({
        owner_id: user.id,
        display_name: parsed.data.displayName,
        birth_year: parsed.data.birthYear,
        grade_level: parsed.data.gradeLevel,
        locale: parsed.data.locale ?? "en",
      })
      .select("id, display_name, birth_year, grade_level, locale")
      .single();

    if (error) throw error;

    return apiSuccess({
      id: child.id,
      displayName: child.display_name,
      birthYear: child.birth_year,
      gradeLevel: child.grade_level,
      locale: child.locale,
    });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
