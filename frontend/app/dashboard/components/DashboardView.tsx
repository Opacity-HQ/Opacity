"use client";

import Link from "next/link";
import { useState } from "react";
import { useDashboardQuery } from "@/lib/queries/dashboard";
import GameplayPrediction from "@/components/gameplay-prediction";
import {
  AccuracyByGame,
  AccuracyTrend,
  ActivityHeatmap,
  MasteryGauge,
  SessionsBar,
  SkillRadar,
  SpeedTrend,
} from "./charts";

const GAME_ROUTES: Record<string, string> = {
  "letter-detective": "/letter-detective",
  "sound-match": "/sound-match",
  "word-builder": "/word-builder",
  "memory-quest": "/memory-quest",
  "rapid-match": "/rapid-match",
};

const RISK_COPY: Record<string, string> = {
  low: "Low risk",
  moderate: "Moderate risk",
  elevated: "Elevated risk",
};

function Card({
  title,
  className = "",
  center = false,
  children,
}: {
  title: string;
  className?: string;
  // Vertically and horizontally centre the content in the card's free space.
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`flex flex-col rounded-xl border border-border bg-card p-4 sm:p-5 text-left ${className}`}
    >
      <h2 className="mb-3 font-pixel text-[16px] sm:text-[18px] text-[#1d1d1d] dark:text-[#f2f2f2]">
        {title}
      </h2>
      <div
        className={center ? "flex flex-1 items-center justify-center" : ""}
      >
        {children}
      </div>
    </section>
  );
}

export default function DashboardView({ gameplayPrototype = false }: { gameplayPrototype?: boolean }) {
  const { data, isPending, isError } = useDashboardQuery();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const children = data?.children ?? [];
  const child =
    children.find((c) => c.id === selectedId) ?? children[0] ?? null;

  if (isPending) {
    return (
      <p className="w-full px-4 py-12 text-center text-muted-foreground">
        Loading dashboard…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="w-full px-4 py-12 text-center text-muted-foreground">
        We couldn&apos;t load the dashboard. Please refresh and try again.
      </p>
    );
  }

  if (!child) {
    return (
      <div className="flex w-full flex-col items-center gap-3 px-4 py-12 text-center">
        <h1 className="font-pixel text-[28px] text-[#1d1d1d] dark:text-[#f2f2f2]">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Play any game to create a child profile and start seeing progress
          here.
        </p>
      </div>
    );
  }

  const report = child.latestReport;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pb-4 pt-6 sm:gap-6 sm:p-6">
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                c.id === child.id
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              type="button"
            >
              {c.displayName}
            </button>
          ))}
        </div>
      )}

      {gameplayPrototype && (
        <GameplayPrediction
          key={child.id}
          childId={child.id}
          sessionRevision={child.history.map((session) => `${session.sessionId}:${session.completedAt}`).join("|")}
        />
      )}

      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${gameplayPrototype ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
        {!gameplayPrototype && <Card className="md:col-span-1" title="Screening result">
          {report ? (
            <>
              <p className="text-2xl font-semibold text-[#1d1d1d] dark:text-[#f2f2f2]">
                {RISK_COPY[report.riskBand] ?? report.riskBand}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Updated {new Date(report.generatedAt).toLocaleDateString()}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Your report appears once enough games have been played.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            This is a screening, not a diagnosis.
          </p>
        </Card>}
        <Card center title="Overall mastery">
          <MasteryGauge child={child} />
        </Card>
        <Card title="Sessions by game">
          <SessionsBar child={child} />
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        <Card title="Skill profile">
          <SkillRadar child={child} />
        </Card>
        <Card title="Accuracy by game">
          <AccuracyByGame child={child} />
        </Card>
        <Card title="Accuracy over time">
          <AccuracyTrend child={child} />
        </Card>
        <Card title="Response speed over time">
          <SpeedTrend child={child} />
        </Card>
      </div>

      <Card title="Play activity (last 12 months)">
        <ActivityHeatmap child={child} />
      </Card>

      <Card title="Games">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          {child.games.map((g) => (
            <li
              className="flex flex-col items-start justify-between gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:gap-3"
              key={g.gameId}
            >
              <div>
                <p className="text-sm font-medium text-[#1d1d1d] dark:text-[#f2f2f2]">
                  {g.gameName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {g.sessionsCompleted} session
                  {g.sessionsCompleted === 1 ? "" : "s"} · level{" "}
                  {g.difficultyLevel}
                </p>
              </div>
              {GAME_ROUTES[g.gameId] && (
                <Link
                  className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                  href={GAME_ROUTES[g.gameId]}
                >
                  Play
                </Link>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
