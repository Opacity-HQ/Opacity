import type {
  DashboardChild,
  DashboardSessionPoint,
} from "@/lib/queries/dashboard";

// Pure view-model helpers for the dashboard charts. Kept free of React so the
// chart components stay declarative.

export const SKILL_LABELS: Record<string, string> = {
  letter_discrimination: "Letters",
  phonological_awareness: "Sounds",
  word_decoding: "Words",
  working_memory: "Memory",
  processing_speed: "Speed",
};

const SKILL_ORDER = Object.keys(SKILL_LABELS);

export function skillRadar(child: DashboardChild) {
  const mastery = new Map(child.skills.map((s) => [s.skillKey, s.mastery]));
  const metrics = SKILL_ORDER.map((key) => ({
    key,
    label: SKILL_LABELS[key],
  }));
  const values = Object.fromEntries(
    SKILL_ORDER.map((key) => [key, Math.round((mastery.get(key) ?? 0) * 100)]),
  );
  return { metrics, values };
}

export function overallMastery(child: DashboardChild): number | null {
  if (child.skills.length === 0) return null;
  const sum = child.skills.reduce((acc, s) => acc + s.mastery, 0);
  return Math.round((sum / child.skills.length) * 100);
}

export function gamesPlayed(child: DashboardChild): number {
  return child.games.filter((g) => g.sessionsCompleted > 0).length;
}

// One point per completed session that has a score, as a percentage.
// One point per calendar day (mean of that day's scored sessions) so several
// sessions on the same day don't draw vertical spikes or duplicate x labels.
function dailyMean(
  points: { completedAt: string; value: number }[],
  digits: number,
) {
  const days = new Map<string, { date: Date; sum: number; n: number }>();
  for (const p of points) {
    const d = new Date(p.completedAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const day = days.get(key) ?? {
      date: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      sum: 0,
      n: 0,
    };
    day.sum += p.value;
    day.n += 1;
    days.set(key, day);
  }
  const f = 10 ** digits;
  return [...days.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((d) => ({ date: d.date, value: Math.round((d.sum / d.n) * f) / f }));
}

export function accuracySeries(history: DashboardSessionPoint[]) {
  return dailyMean(
    history
      .filter((h) => h.accuracy !== null)
      .map((h) => ({
        completedAt: h.completedAt,
        value: (h.accuracy as number) * 100,
      })),
    0,
  ).map((d) => ({ date: d.date, accuracy: d.value }));
}

// Average response time in seconds, one point per day with scored sessions.
export function speedSeries(history: DashboardSessionPoint[]) {
  return dailyMean(
    history
      .filter((h) => h.meanRtMs !== null)
      .map((h) => ({
        completedAt: h.completedAt,
        value: (h.meanRtMs as number) / 1000,
      })),
    1,
  ).map((d) => ({ date: d.date, seconds: d.value }));
}

export function accuracyByGame(history: DashboardSessionPoint[]) {
  const groups = new Map<string, { name: string; sum: number; n: number }>();
  for (const h of history) {
    if (h.accuracy === null) continue;
    const g = groups.get(h.gameId) ?? { name: h.gameName, sum: 0, n: 0 };
    g.sum += h.accuracy;
    g.n += 1;
    groups.set(h.gameId, g);
  }
  return [...groups.values()].map((g) => ({
    name: g.name,
    accuracy: Math.round((g.sum / g.n) * 100),
  }));
}

// GitHub-style weekly columns of 7 day-bins (Sunday first) covering the last
// `weeks` weeks, each bin counting the sessions completed on that local day.
export function activityColumns(
  history: DashboardSessionPoint[],
  weeks = 16,
  now = new Date(),
) {
  const dayKey = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const counts = new Map<string, number>();
  for (const h of history) {
    const key = dayKey(new Date(h.completedAt));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisWeekStart = new Date(today);
  thisWeekStart.setDate(today.getDate() - today.getDay());

  return Array.from({ length: weeks }, (_, w) => {
    const weekStart = new Date(thisWeekStart);
    weekStart.setDate(thisWeekStart.getDate() - (weeks - 1 - w) * 7);
    return {
      bin: w,
      bins: Array.from({ length: 7 }, (_, d) => {
        const date = new Date(weekStart);
        date.setDate(weekStart.getDate() + d);
        return {
          bin: d,
          date,
          count: date > today ? 0 : (counts.get(dayKey(date)) ?? 0),
        };
      }),
    };
  });
}
