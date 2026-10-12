"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTrialClock, MIN_REACTION_MS } from "./useTrialClock";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { LDTrial, TrialOutcome } from "./types";

type StakeoutTrial = Extract<LDTrial, { roundType: "stakeout" }>;

export default function StakeoutRound({
  trial,
  targetLetter,
  onAnswer,
}: {
  trial: StakeoutTrial;
  targetLetter: string;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  const { markFirstMove, commit, hasElapsedSinceOnset } = useTrialClock(trial.index);
  const reducedMotion = usePrefersReducedMotion();
  const [tapped, setTapped] = useState(false);
  const answeredRef = useRef(false);

  useEffect(() => {
    answeredRef.current = false;

    const timeout = window.setTimeout(() => {
      submit(false, performance.now());
    }, trial.exposureMs);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial.index]);

  function submit(didTap: boolean, eventTimeStamp: number) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setTapped(didTap);
    const { reactionTimeMs, timeToFirstMoveMs } = commit(eventTimeStamp);
    const localCorrect = didTap === (trial.streamLetter === targetLetter);

    window.setTimeout(
      () => {
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "stakeout", tapped: didTap },
          reactionTimeMs,
          timeToFirstMoveMs,
          localCorrect,
        });
      },
      reducedMotion ? 150 : 300,
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full gap-6">
      <p className="font-pixel text-[18px] sm:text-[22px] text-[#1d1d1d] dark:text-[#f2f2f2] text-center">
        Tap only when you see{" "}
        <span className="inline-block px-1 align-baseline text-[32px] sm:text-[40px]">
          {targetLetter}
        </span>
      </p>
      <button
        type="button"
        disabled={answeredRef.current}
        onMouseDown={(e) => {
          if (!hasElapsedSinceOnset(MIN_REACTION_MS, e.timeStamp)) return;
          markFirstMove(e.timeStamp);
          submit(true, e.timeStamp);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!hasElapsedSinceOnset(MIN_REACTION_MS, e.timeStamp)) return;
            markFirstMove(e.timeStamp);
            submit(true, e.timeStamp);
          }
        }}
        aria-label={`Current letter ${trial.streamLetter}. Tap if this matches ${targetLetter}.`}
        data-cuelume-press
        data-cuelume-release
        className={cn(
          "font-pixel text-[64px] sm:text-[80px] w-[160px] h-[160px] rounded-[24px] border-2 flex items-center justify-center transition-all duration-150",
          "bg-white dark:bg-[#141414] border-[#e0e0e0] dark:border-[#333333] hover:border-[#949494] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] dark:focus-visible:ring-[#f2f2f2] focus-visible:ring-offset-2",
          tapped && "border-[#1d1d1d] dark:border-[#f2f2f2] bg-[#f7f7f7] dark:bg-[#1f1f1f]",
        )}
      >
        {trial.streamLetter}
      </button>
    </div>
  );
}
