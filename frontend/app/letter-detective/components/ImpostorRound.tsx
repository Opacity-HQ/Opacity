"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialClock, MIN_REACTION_MS } from "./useTrialClock";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { LDTrial, TrialOutcome } from "./types";

type ImpostorTrial = Extract<LDTrial, { roundType: "impostor" }>;

export default function ImpostorRound({
  trial,
  onAnswer,
}: {
  trial: ImpostorTrial;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  const { markFirstMove, commit, hasElapsedSinceOnset } = useTrialClock(trial.index);
  const reducedMotion = usePrefersReducedMotion();
  const [selected, setSelected] = useState<number | null>(null);
  const answeredRef = useRef(false);

  const impostorIndex = trial.gridLetters.indexOf(trial.impostorLetter);

  useEffect(() => {
    answeredRef.current = false;

    const timeout = window.setTimeout(() => {
      if (!answeredRef.current) {
        answeredRef.current = true;
        const { reactionTimeMs, timeToFirstMoveMs } = commit(performance.now());
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "impostor", selectedIndex: null },
          reactionTimeMs,
          timeToFirstMoveMs,
          localCorrect: false,
        });
      }
    }, trial.timeoutMs);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial.index]);

  function handlePick(index: number, e: React.MouseEvent | React.KeyboardEvent) {
    if (answeredRef.current) return;
    if (!hasElapsedSinceOnset(MIN_REACTION_MS, e.timeStamp)) return;
    answeredRef.current = true;
    setSelected(index);
    const { reactionTimeMs, timeToFirstMoveMs } = commit(e.timeStamp);
    const localCorrect = index === impostorIndex;

    window.setTimeout(
      () => {
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "impostor", selectedIndex: index },
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
      <p className="font-pixel text-[20px] sm:text-[24px] text-[#1d1d1d] text-center">
        Spot the impostor letter
      </p>
      <div
        role="group"
        aria-label="Tap the letter that is different"
        className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-[280px]"
      >
        {trial.gridLetters.map((letter, index) => {
          const isSelected = selected === index;
          const isCorrectAnswer = selected !== null && index === impostorIndex;
          const isWrongPick = isSelected && index !== impostorIndex;
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
                  ? `Grid letter ${index + 1}, ${letter}, correct answer`
                  : isWrongPick
                    ? `Grid letter ${index + 1}, ${letter}, your pick, not correct`
                    : `Grid letter ${index + 1}, ${letter}`
              }
              data-cuelume-press
              data-cuelume-release
              className={cn(
                "font-pixel text-[26px] sm:text-[30px] aspect-square rounded-[14px] border-2 flex items-center justify-center transition-all duration-150",
                "bg-white border-[#e0e0e0] hover:border-[#949494] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] focus-visible:ring-offset-2",
                isCorrectAnswer && "border-emerald-500 bg-emerald-50",
                isWrongPick &&
                  (reducedMotion
                    ? "border-[#e8c8c8] bg-[#f9f0f0]"
                    : "border-[#e8c8c8] bg-[#f9f0f0] animate-[wiggle_0.4s_ease-in-out]"),
              )}
            >
              <span className="relative">
                {letter}
                {isCorrectAnswer && (
                  <Check
                    className="absolute -top-3 -right-5 text-emerald-600"
                    size={16}
                    aria-hidden="true"
                  />
                )}
                {isWrongPick && (
                  <Circle
                    className="absolute -top-3 -right-5 text-[#c88f8f] fill-[#c88f8f]"
                    size={12}
                    aria-hidden="true"
                  />
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
