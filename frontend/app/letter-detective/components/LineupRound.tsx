"use client";

import { useEffect, useRef, useState } from "react";
import { Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialClock, MIN_REACTION_MS } from "./useTrialClock";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { LDTrial, TrialOutcome } from "./types";

type LineupTrial = Extract<LDTrial, { roundType: "lineup" }>;

export default function LineupRound({
  trial,
  onAnswer,
}: {
  trial: LineupTrial;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  const { markFirstMove, commit, hasElapsedSinceOnset } = useTrialClock(trial.index);
  const reducedMotion = usePrefersReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);
  const answeredRef = useRef(false);

  useEffect(() => {
    answeredRef.current = false;

    const timeout = window.setTimeout(() => {
      if (!answeredRef.current) {
        answeredRef.current = true;
        const { reactionTimeMs, timeToFirstMoveMs } = commit(performance.now());
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "lineup", selectedOptionIndex: null },
          reactionTimeMs,
          timeToFirstMoveMs,
          localCorrect: false,
        });
      }
    }, trial.timeoutMs);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial.index]);

  const correctIndex = trial.options.indexOf(trial.targetLetter);

  function handlePick(index: number, e: React.MouseEvent | React.KeyboardEvent) {
    if (answeredRef.current) return;
    if (!hasElapsedSinceOnset(MIN_REACTION_MS, e.timeStamp)) return;
    answeredRef.current = true;
    setSelected(index);
    const { reactionTimeMs, timeToFirstMoveMs } = commit(e.timeStamp);
    const localCorrect = index === correctIndex;

    window.setTimeout(
      () => {
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "lineup", selectedOptionIndex: index },
          reactionTimeMs,
          timeToFirstMoveMs,
          localCorrect,
        });
      },
      reducedMotion ? 300 : 650,
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full gap-6">
      <p className="font-pixel text-[20px] sm:text-[24px] text-[#1d1d1d] dark:text-[#f2f2f2] text-center">
        Find the letter{" "}
        <span className="inline-block px-1 align-baseline text-[32px] sm:text-[40px]">
          {trial.targetLetter}
        </span>
      </p>
      <div
        role="group"
        aria-label={`Pick the letter ${trial.targetLetter}`}
        className="grid grid-cols-5 gap-3 sm:gap-4 w-full max-w-md"
      >
        {trial.options.map((letter, index) => {
          const isSelected = selected === index;
          const isCorrectAnswer = selected !== null && index === correctIndex;
          const isWrongPick = isSelected && index !== correctIndex;
          return (
            <button
              key={index}
              type="button"
              disabled={selected !== null}
              onMouseDown={(e) => markFirstMove(e.timeStamp)}
              onKeyDown={(e) => {
                markFirstMove(e.timeStamp);
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handlePick(index, e);
                }
              }}
              onClick={(e) => handlePick(index, e)}
              aria-label={
                isCorrectAnswer
                  ? `Letter ${letter}, correct answer`
                  : isWrongPick
                    ? `Letter ${letter}, your pick, not correct`
                    : `Letter ${letter}`
              }
              data-cuelume-press
              data-cuelume-release
              className={cn(
                "relative font-pixel text-[24px] sm:text-[28px] aspect-square rounded-[14px] border-2 shadow-[0_4px_14px_rgba(0,0,0,0.07)] flex items-center justify-center transition-all duration-150",
                "bg-white dark:bg-[#141414] border-[#e0e0e0] dark:border-[#333333] hover:border-[#949494] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] dark:focus-visible:ring-[#f2f2f2] focus-visible:ring-offset-2",
                isCorrectAnswer && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200",
                isWrongPick &&
                  (reducedMotion
                    ? "border-[#e8c8c8] dark:border-[#5c2b2b] bg-[#f9f0f0] dark:bg-[#2a1a1a] text-[#991b1b] dark:text-[#fca5a5]"
                    : "border-[#e8c8c8] dark:border-[#5c2b2b] bg-[#f9f0f0] dark:bg-[#2a1a1a] text-[#991b1b] dark:text-[#fca5a5] animate-[wiggle_0.4s_ease-in-out]"),
              )}
            >
              <span>{letter}</span>
              {isCorrectAnswer && (
                <Check
                  className="absolute top-1.5 right-1.5 text-emerald-600 dark:text-emerald-400 w-4 h-4"
                  aria-hidden="true"
                />
              )}
              {isWrongPick && (
                <XCircle
                  className="absolute top-1.5 right-1.5 text-[#991b1b] dark:text-[#fca5a5] w-4 h-4"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
