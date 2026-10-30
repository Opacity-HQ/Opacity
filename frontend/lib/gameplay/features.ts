import contract from "./contract.json";

export const GAMEPLAY_CONTRACT = contract;
export const FEATURE_NAMES = [...contract.games.flatMap((game) =>
  contract.metrics.map((metric) => `${game.id}.${metric}`),
), ...contract.games.map((game) => `${game.id}.available`)];

// Only server-loaded database rows are accepted by the HTTP route. No client
// scores, clinical profile fields, mastery, or prior model outputs are predictors.
export type GameplaySession = {
  id: string;
  child_id: string;
  game_id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  difficulty_level: number;
  config: unknown;
  session_scores: {
    accuracy: number | null;
    mean_rt_ms: number | null;
    rt_cv: number | null;
    raw_features: unknown;
  } | null;
};

export type GameReadiness = {
  gameId: string;
  name: string;
  ready: boolean;
  reason: string | null;
  sessionId: string | null;
  completedAt: string | null;
};

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sessionFeatures(session: GameplaySession, game: typeof contract.games[number]) {
  const plan = record(session.config);
  const score = session.session_scores;
  const raw = record(score?.raw_features);
  if (plan.version !== game.plan_version || raw.version !== game.score_version) {
    return { reason: "Play again to record the supported game version." };
  }
  if (!Array.isArray(plan.trials) || plan.trials.length === 0) {
    return { reason: "The saved game plan is missing. Play another full session." };
  }
  const trials = plan.trials.map(record);
  if (trials.some((trial) => !Number.isInteger(trial.index))
      || new Set(trials.map((trial) => trial.index)).size !== trials.length
      || (game.id !== "memory-quest" && trials.some((trial) => typeof trial.isWarmup !== "boolean"))) {
    return { reason: "The saved game plan is incompatible. Play another full session." };
  }
  const expected = game.id === "memory-quest" ? trials.length
    : trials.filter((trial) => trial.isWarmup === false).length;
  const count = raw[game.count_field];
  if (expected < 2 || !Number.isInteger(count) || count !== expected) {
    return { reason: "Finish every scored round in a new session." };
  }
  if (!score || !finite(score.accuracy) || score.accuracy < 0 || score.accuracy > 1
      || !Number.isInteger(session.difficulty_level) || session.difficulty_level < 1
      || session.difficulty_level > game.max_difficulty) {
    return { reason: "The saved score is incomplete or invalid. Play again." };
  }
  if ((score.mean_rt_ms !== null && (!finite(score.mean_rt_ms) || score.mean_rt_ms < 0))
      || (score.rt_cv !== null && (!finite(score.rt_cv) || score.rt_cv < 0))) {
    return { reason: "The saved timing measurements are invalid. Play again." };
  }
  return { values: [score.accuracy, score.mean_rt_ms === null ? null : Math.log1p(score.mean_rt_ms),
    score.rt_cv, session.difficulty_level] };
}

export function extractGameplayFeatures(sessions: GameplaySession[], childId: string, now = Date.now()) {
  const earliest = now - contract.assessment_window_days * 86_400_000;
  const values: (number | null)[] = [];
  const games: GameReadiness[] = contract.games.map((game) => {
    // Use the latest completed sitting, never silently substitute an older,
    // better score when the newest completed sitting has invalid/missing data.
    const session = sessions.filter((s) => s.child_id === childId && s.game_id === game.id
      && s.status === "completed" && s.completed_at !== null
      && Number.isFinite(Date.parse(s.completed_at)))
      .sort((a, b) => Date.parse(b.completed_at!) - Date.parse(a.completed_at!) || b.id.localeCompare(a.id))[0];
    let reason: string | null = null;
    if (!session) reason = "Complete a full session.";
    else {
      const finished = Date.parse(session.completed_at!);
      const started = Date.parse(session.started_at);
      if (finished < earliest) reason = "Play again; this session is older than 7 days.";
      else if (!Number.isFinite(started) || started > finished || finished > now || started < earliest) {
        reason = "Play a new session within the current 7-day window.";
      } else {
        const features = sessionFeatures(session, game);
        if (features.values) values.push(...features.values);
        else reason = features.reason!;
      }
    }
    if (reason !== null) values.push(...contract.metrics.map(() => null));
    return { gameId: game.id, name: game.name, ready: reason === null, reason,
      sessionId: session?.id ?? null, completedAt: session?.completed_at ?? null };
  });
  values.push(...games.map((game) => game.ready ? 1 : 0));
  return { games, values: games.filter((game) => game.ready).length >= contract.minimum_games ? values : null };
}
