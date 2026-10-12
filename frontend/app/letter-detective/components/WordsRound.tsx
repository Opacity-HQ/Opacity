"use client";

import { useEffect, useRef, useState } from "react";
import { Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTrialClock, MIN_REACTION_MS } from "./useTrialClock";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { LDTrial, TrialOutcome } from "./types";

type WordsTrial = Extract<LDTrial, { roundType: "words" }>;

export default function WordsRound({
  trial,
  onAnswer,
}: {
  trial: WordsTrial;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  const { markFirstMove, commit, hasElapsedSinceOnset } = useTrialClock(trial.index);
  const reducedMotion = usePrefersReducedMotion();
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const answeredRef = useRef(false);

  const expectedPositions: number[] = [];
  for (let i = 0; i < trial.word.length; i++) {
    if (trial.word[i].toLowerCase() === trial.targetLetter.toLowerCase()) {
      expectedPositions.push(i);
    }
  }

  useEffect(() => {
    answeredRef.current = false;

    const timeout = window.setTimeout(() => {
      if (!answeredRef.current) {
        submit(performance.now());
      }
    }, trial.timeoutMs);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial.index]);

  function toggle(index: number, e: React.MouseEvent | React.KeyboardEvent) {
    if (answeredRef.current) return;
    markFirstMove(e.timeStamp);
    setSelectedPositions((prev) =>
      prev.includes(index) ? prev.filter((p) => p !== index) : [...prev, index],
    );
  }

  function submit(eventTimeStamp: number) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    setSubmitted(true);
    const { reactionTimeMs, timeToFirstMoveMs } = commit(eventTimeStamp);

    const sortedSelected = [...selectedPositions].sort((a, b) => a - b);
    const sortedExpected = [...expectedPositions].sort((a, b) => a - b);
    const localCorrect =
      sortedSelected.length === sortedExpected.length &&
      sortedSelected.every((v, i) => v === sortedExpected[i]);

    window.setTimeout(
      () => {
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "words", tappedPositions: selectedPositions },
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
      <p className="font-pixel text-[18px] sm:text-[22px] text-[#1d1d1d] dark:text-[#f2f2f2] text-center">
        Tap every{" "}
        <span className="inline-block px-1 align-baseline text-[32px] sm:text-[40px]">
          {trial.targetLetter}
        </span>{" "}
        in this word
      </p>
      <div
        role="group"
        aria-label={`Word: ${trial.word}`}
        className="flex flex-row gap-2 sm:gap-3"
      >
        {trial.word.split("").map((letter, index) => {
          const isSelected = selectedPositions.includes(index);
          const isExpected = expectedPositions.includes(index);
          const showCorrect = submitted && isExpected;
          const showWrong = submitted && isSelected && !isExpected;
          return (
            <button
              key={index}
              type="button"
              disabled={submitted}
              onClick={(e) => toggle(index, e)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  toggle(index, e);
                }
              }}
              aria-pressed={isSelected}
              aria-label={
                showCorrect
                  ? `Letter ${letter}, position ${index + 1}, correct`
                  : showWrong
                    ? `Letter ${letter}, position ${index + 1}, your pick, not correct`
                    : `Letter ${letter}, position ${index + 1}`
              }
              data-cuelume-toggle
              className={cn(
                "relative font-pixel text-[26px] sm:text-[32px] w-[50px] h-[60px] sm:w-[60px] sm:h-[70px] rounded-[12px] border-2 shadow-[0_4px_14px_rgba(0,0,0,0.07)] flex items-center justify-center transition-all duration-150",
                "bg-white dark:bg-[#141414] border-[#e0e0e0] dark:border-[#333333] hover:border-[#949494] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] dark:focus-visible:ring-[#f2f2f2] focus-visible:ring-offset-2",
                isSelected && !submitted && "border-[#1d1d1d] dark:border-[#f2f2f2] bg-[#f7f7f7] dark:bg-[#1f1f1f]",
                showCorrect && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200",
                showWrong &&
                  (reducedMotion
                    ? "border-[#e8c8c8] dark:border-[#5c2b2b] bg-[#f9f0f0] dark:bg-[#2a1a1a] text-[#991b1b] dark:text-[#fca5a5]"
                    : "border-[#e8c8c8] dark:border-[#5c2b2b] bg-[#f9f0f0] dark:bg-[#2a1a1a] text-[#991b1b] dark:text-[#fca5a5] animate-[wiggle_0.4s_ease-in-out]"),
              )}
            >
              <span>{letter}</span>
              {showCorrect && (
                <Check
                  className="absolute top-1 right-1 text-emerald-600 dark:text-emerald-400 w-3.5 h-3.5"
                  aria-hidden="true"
                />
              )}
              {showWrong && (
                <XCircle
                  className="absolute top-1 right-1 text-[#991b1b] dark:text-[#fca5a5] w-3.5 h-3.5"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
      {!submitted && (
        <button
          type="button"
          onClick={(e) => {
            if (!hasElapsedSinceOnset(MIN_REACTION_MS, e.timeStamp)) return;
            submit(e.timeStamp);
          }}
          data-cuelume-press
          data-cuelume-release
          className="font-pixel text-[16px] flex items-center justify-center bg-[#1b1b1b] dark:bg-[#f2f2f2] hover:bg-[#323232] dark:hover:bg-white transition-all duration-200 rounded-[15px] px-[24px] py-[8px] text-white dark:text-[#1b1b1b] cursor-pointer"
        >
          done
        </button>
      )}
    </div>
  );
}
