"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Area, AreaChart } from "@/components/charts/area-chart";
import { Bar } from "@/components/charts/bar";
import { BarChart } from "@/components/charts/bar-chart";
import { BarYAxis } from "@/components/charts/bar-y-axis";
import { Gauge } from "@/components/charts/gauge";
import { Grid } from "@/components/charts/grid";
import {
  HeatmapCells,
  HeatmapChart,
  HeatmapLegend,
  HeatmapTooltip,
  HeatmapXAxis,
  HeatmapYAxis,
} from "@/components/charts/heatmap";
import { RadarArea } from "@/components/charts/radar-area";
import { RadarAxis } from "@/components/charts/radar-axis";
import { RadarChart } from "@/components/charts/radar-chart";
import { RadarGrid } from "@/components/charts/radar-grid";
import { RadarLabels } from "@/components/charts/radar-labels";
import { ChartTooltip } from "@/components/charts/tooltip";
import { XAxis } from "@/components/charts/x-axis";
import type { DashboardChild } from "@/lib/queries/dashboard";
import {
  accuracyByGame,
  accuracySeries,
  activityColumns,
  overallMastery,
  skillRadar,
  speedSeries,
} from "./transform";

function NotEnoughData({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function MasteryGauge({ child }: { child: DashboardChild }) {
  const value = overallMastery(child);
  if (value === null) {
    return <NotEnoughData>Play a game to see overall mastery.</NotEnoughData>;
  }
  return (
    <div className="w-full max-w-[420px] [--chart-1:oklch(0.5_0_0)] dark:[--chart-1:oklch(0.87_0_0)]">
      <Gauge
        animate={false}
        centerValue={value}
        defaultLabel=""
        minWidth={0}
        suffix="%"
        value={value}
      />
    </div>
  );
}

export function SkillRadar({ child }: { child: DashboardChild }) {
  if (child.skills.length === 0) {
    return <NotEnoughData>Skills appear after the first game.</NotEnoughData>;
  }
  const { metrics, values } = skillRadar(child);
  return (
    <div className="mx-auto w-full max-w-sm">
      <RadarChart
        animate={false}
        data={[{ label: child.displayName, values }]}
        levels={4}
        margin={48}
        metrics={metrics}
      >
        <RadarGrid showLabels={false} />
        <RadarAxis />
        <RadarArea index={0} />
        <RadarLabels />
      </RadarChart>
    </div>
  );
}

// Softened foreground so the bars read as lighter than body text in both themes.
const SESSIONS_BAR_COLOR =
  "color-mix(in oklch, var(--foreground) 45%, transparent)";

const DESKTOP_QUERY = "(min-width: 768px)";

function useIsDesktop() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(DESKTOP_QUERY);
      mq.addEventListener("change", notify);
      return () => mq.removeEventListener("change", notify);
    },
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export function SessionsBar({ child }: { child: DashboardChild }) {
  const isDesktop = useIsDesktop();
  const played = child.games.filter((g) => g.sessionsCompleted > 0);
  if (played.length === 0) {
    return <NotEnoughData>No completed sessions yet.</NotEnoughData>;
  }
  const data = child.games.map((g) => ({
    name: g.gameName,
    sessions: g.sessionsCompleted,
  }));
  return (
    <BarChart
      animationDuration={0}
      aspectRatio={isDesktop ? "1.15 / 1" : "2.2 / 1"}
      barWidth={14}
      data={data}
      margin={{ top: 8, right: 16, bottom: 8, left: isDesktop ? 136 : 112 }}
      orientation="horizontal"
    >
      <Grid
        horizontal={false}
        stroke="color-mix(in oklch, var(--foreground) 30%, transparent)"
        vertical
      />
      <Bar
        animate={false}
        dataKey="sessions"
        fill={SESSIONS_BAR_COLOR}
        lineCap={3}
      />
      <BarYAxis align="left" />
      <ChartTooltip
        showDatePill={false}
        rows={(p) => [
          {
            color: SESSIONS_BAR_COLOR,
            label: "Sessions",
            value: String(p.sessions),
          },
        ]}
      />
    </BarChart>
  );
}

export function AccuracyTrend({ child }: { child: DashboardChild }) {
  const data = accuracySeries(child.history);
  if (data.length < 2) {
    return (
      <NotEnoughData>
        Complete at least two scored sessions to see a trend.
      </NotEnoughData>
    );
  }
  return (
    <AreaChart
      animationDuration={0}
      yDomainTweenDuration={0}
      aspectRatio="2.4 / 1"
      data={data}
      margin={{ left: 28, right: 28 }}
    >
      <Grid horizontal />
      <Area animate={false} dataKey="accuracy" />
      <XAxis numTicks={4} tickMode="domain" />
      <ChartTooltip
        rows={(p) => [
          {
            color: "var(--chart-line-primary)",
            label: "Accuracy",
            value: `${p.accuracy}%`,
          },
        ]}
      />
    </AreaChart>
  );
}

export function SpeedTrend({ child }: { child: DashboardChild }) {
  const data = speedSeries(child.history);
  if (data.length < 2) {
    return (
      <NotEnoughData>
        Complete at least two scored sessions to see a trend.
      </NotEnoughData>
    );
  }
  return (
    <AreaChart
      animationDuration={0}
      yDomainTweenDuration={0}
      aspectRatio="2.4 / 1"
      data={data}
      margin={{ left: 28, right: 28 }}
    >
      <Grid horizontal />
      <Area
        animate={false}
        dataKey="seconds"
        fill="var(--chart-line-secondary)"
      />
      <XAxis numTicks={4} tickMode="domain" />
      <ChartTooltip
        rows={(p) => [
          {
            color: "var(--chart-line-secondary)",
            label: "Avg. response",
            value: `${p.seconds}s`,
          },
        ]}
      />
    </AreaChart>
  );
}

export function AccuracyByGame({ child }: { child: DashboardChild }) {
  const data = accuracyByGame(child.history);
  if (data.length === 0) {
    return <NotEnoughData>No scored sessions yet.</NotEnoughData>;
  }
  return (
    <ul className="flex flex-col gap-4">
      {data.map((g) => (
        <li key={g.name}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-[#1d1d1d] dark:text-[#f2f2f2]">{g.name}</span>
            <span className="tabular-nums text-muted-foreground">
              {g.accuracy}%
            </span>
          </div>
          <Gauge
            animate={false}
            linearHeight={16}
            orientation="linear"
            totalNotches={24}
            value={g.accuracy}
          />
        </li>
      ))}
    </ul>
  );
}

// Empty days use a faint foreground tint so they read on light and dark; active
// days step up through a green scale with increasing opacity.
const HEATMAP_LEVELS = [
  "color-mix(in oklch, var(--foreground) 7%, transparent)",
  "oklch(0.72 0.15 150 / 0.35)",
  "oklch(0.68 0.17 150 / 0.6)",
  "oklch(0.62 0.18 150 / 0.85)",
  "oklch(0.55 0.18 150)",
] as const;

export function ActivityHeatmap({ child }: { child: DashboardChild }) {
  const data = activityColumns(child.history, 52);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A year is wider than most cards; start scrolled to the most recent weeks.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [child.id]);

  return (
    <div
      className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      ref={scrollRef}
    >
      <div className="w-full min-w-[760px]">
        <HeatmapChart
          animate={false}
          data={data}
          gap={3}
          levelColors={HEATMAP_LEVELS}
        >
          <HeatmapXAxis />
          <HeatmapYAxis />
          <HeatmapCells />
          <HeatmapTooltip
            formatLabel={(n) => `${n} session${n === 1 ? "" : "s"}`}
          />
          <HeatmapLegend />
        </HeatmapChart>
      </div>
    </div>
  );
}
