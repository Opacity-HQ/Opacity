import { requireChildAccess } from "@/lib/api/auth";
import { ApiRouteError, toApiErrorResponse } from "@/lib/api/response";
import { gameplayPrototypeEnabled } from "@/lib/gameplay/config";
import { GAMEPLAY_CONTRACT } from "@/lib/gameplay/features";
import { createGameplayHandler } from "@/lib/gameplay/route";

export const GET = createGameplayHandler({
  enabled: gameplayPrototypeEnabled,
  errorResponse: toApiErrorResponse,
  loadAuthorizedSessions: async (childId, since) => {
    const { supabase } = await requireChildAccess(childId);
    // One query per game avoids a global row cap hiding a less-played game.
    // Only server-saved plans and scores from this authorized child are used.
    const results = await Promise.all(GAMEPLAY_CONTRACT.games.map(async (game) => {
      const { data, error } = await supabase.from("game_sessions")
        .select("id, child_id, game_id, status, started_at, completed_at, difficulty_level, config, session_scores(accuracy, mean_rt_ms, rt_cv, raw_features)")
        .eq("child_id", childId).eq("game_id", game.id).eq("status", "completed")
        .gte("completed_at", since)
        .order("completed_at", { ascending: false }).order("id", { ascending: false }).limit(1);
      if (error) throw new ApiRouteError("internal_error", "Could not load saved game scores. Please try again.");
      return data ?? [];
    }));
    return results.flat();
  },
});
