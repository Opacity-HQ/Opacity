"use client";

import Link from "next/link";
import { useId } from "react";
import { CheckCircle2, FlaskConical, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameplayPrediction } from "@/lib/queries/gameplay";

export default function GameplayPrediction({ childId, sessionRevision, completedSessionId }: {
  childId: string;
  sessionRevision: string;
  completedSessionId?: string;
}) {
  const titleId = useId();
  const { data, isPending, isFetching, isError, refetch } = useGameplayPrediction(childId, sessionRevision, completedSessionId);
  if (data === null && !isFetching) return null;
  const readyGames = data?.games.filter((game) => game.ready).length ?? 0;
  return (
    <section data-gameplay-result aria-labelledby={titleId} className="w-full max-w-3xl rounded-xl border border-border bg-card p-4 text-left font-sauce sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={titleId} className="flex items-center gap-2 font-pixel text-lg">
          <FlaskConical aria-hidden="true" className="size-5 shrink-0" /> Your experimental classification
        </h2>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <RotateCw aria-hidden="true" className="size-4" /> Refresh result
        </Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Synthetic-data prototype. The class below is simulated and cannot determine whether someone has dyslexia.
      </p>
      <div aria-live="polite" aria-atomic="true" className="mt-4">
        {isPending || isFetching ? <p className="text-sm">Checking saved game sessions...</p>
          : isError || !data ? <p role="alert" className="text-sm">Could not load a prediction. Check your connection and try Refresh result.</p>
          : <>
            {data.status === "ready" ? <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Simulated result</p>
              <p className="mt-1 text-2xl font-semibold">{data.classification === "dyslexia" ? "Dyslexia" : "No dyslexia"}</p>
              <p className="mt-2 text-xl font-semibold">Model confidence: {(data.confidence * 100).toFixed(1)}%</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Confidence in the selected simulated class, not the chance of having dyslexia.
                {" "}Based on {readyGames} of {data.games.length} games from the last {data.assessmentWindowDays} days.
                {readyGames < data.games.length && " Provisional result: complete more games to update it."}
              </p>
              {data.missingFeatureCount > 0 && <p className="mt-2 text-sm">
                {data.missingFeatureCount} measurements were unavailable and filled using the synthetic training data.
              </p>}
              <p className="mt-2 break-all text-xs text-muted-foreground">Model: {data.modelId}</p>
            </> : <>
              <p className="font-medium">{readyGames} of {data.games.length} games ready</p>
              <p className="mt-1 text-sm text-muted-foreground">{data.pendingSession
                ? "The session you just played is not available for classification yet. Refresh to check again; if it remains incomplete, play a new full session."
                : "Finish a full game to see your simulated classification here. Results update as you complete more games."}</p>
            </>}
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {data.games.map((game) => <li key={game.gameId} className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 text-sm">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {game.ready && <CheckCircle2 aria-hidden="true" className="size-4 shrink-0" />}{game.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{game.ready ? "Complete" : game.reason}</p>
                </div>
                <Link href={`/${game.gameId}`} className="shrink-0 rounded-md border border-border px-3 py-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2">
                  {game.ready ? "Replay" : "Play"}
                </Link>
              </li>)}
            </ul>
          </>}
      </div>
    </section>
  );
}
