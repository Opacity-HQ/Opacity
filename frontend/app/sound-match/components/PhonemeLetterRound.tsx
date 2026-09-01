"use client";

import { useEffect, useRef, useState } from "react";
import { Check, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SMTrial } from "@/app/api/games/sound-match/plan";
import { useTrialClock, MIN_REACTION_MS } from "./useTrialClock";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useSpeech } from "./useSpeech";
import SpeakerButton from "./SpeakerButton";
import type { TrialOutcome } from "./types";

// Level 4 (Q13-15): phoneme -> letter, 4 options. The sound is spoken (and
// its label, e.g. "/b/", shown as text — a phoneme label is not a spelled
// word, so this doesn't leak the answer). Options are letter glyphs, which
// must be visible because picking the letter *is* the task.
type PhonemeLetterTrial = Extract<SMTrial, { roundType: "phoneme-letter" }>;

export default function PhonemeLetterRound({
  trial,
  onAnswer,
}: {
  trial: PhonemeLetterTrial;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  const { markFirstMove, commit, hasElapsedSinceOnset } = useTrialClock(
    trial.index,
  );
  const reducedMotion = usePrefersReducedMotion();
  const { speak } = useSpeech();
  const [selected, setSelected] = useState<number | null>(null);
  const answeredRef = useRef(false);

  useEffect(() => {
    // State resets via the per-trial `key` remount in page.tsx.
    answeredRef.current = false;
    speak(trial.spokenText);

    const timeout = window.setTimeout(() => {
      if (answeredRef.current) return;
      answeredRef.current = true;
      const { reactionTimeMs, timeToFirstMoveMs } = commit(performance.now());
      onAnswer({
        trialIndex: trial.index,
        response: { selectedIndex: null },
        reactionTimeMs,
        timeToFirstMoveMs,
        localCorrect: false,
      });
    }, trial.timeoutMs);

    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial.index]);

  function pick(index: number, timeStamp: number) {
    if (answeredRef.current) return;
    if (!hasElapsedSinceOnset(MIN_REACTION_MS, timeStamp)) return;
    answeredRef.current = true;
    setSelected(index);
    const { reactionTimeMs, timeToFirstMoveMs } = commit(timeStamp);
    const localCorrect = index === trial.correctIndex;

    window.setTimeout(
      () => {
        onAnswer({
          trialIndex: trial.index,
          response: { selectedIndex: index },
          reactionTimeMs,
          timeToFirstMoveMs,
          localCorrect,
        });
      },
      reducedMotion ? 300 : 650,
    );
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (answeredRef.current) return;
      const n = Number.parseInt(e.key, 10);
      if (!Number.isNaN(n) && n >= 1 && n <= trial.options.length) {
        e.preventDefault();
        pick(n - 1, e.timeStamp);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial.index, trial.options.length]);

  return (
    <div className="flex flex-col items-center justify-center w-full gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="font-pixel text-[17px] sm:text-[21px] text-[#1d1d1d] max-w-[440px] leading-snug">
          {trial.prompt}
        </p>
        <div className="flex flex-row items-center gap-3">
          <SpeakerButton
            onPlay={() => speak(trial.spokenText)}
            label="Play the sound again"
          />
          <span className="font-pixel text-[22px] sm:text-[26px] text-[#1d1d1d] px-3 py-1 rounded-md bg-[#f9f6fe] border-2 border-[#e4d9f9]">
            {trial.targetPhoneme}
          </span>
        </div>
      </div>

      <div
        role="group"
        aria-label={trial.prompt}
        className="grid grid-cols-2 gap-3 sm:gap-4 w-full max-w-[320px]"
      >
        {trial.options.map((letter, i) => {
          const isSelected = selected === i;
          const showCorrect = selected !== null && i === trial.correctIndex;
          const showWrong = isSelected && i !== trial.correctIndex;
          return (
            <button
              key={`${letter}-${i}`}
              type="button"
              disabled={selected !== null}
              onMouseDown={(e) => markFirstMove(e.timeStamp)}
              onKeyDown={(e) => {
                markFirstMove(e.timeStamp);
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  pick(i, e.timeStamp);
                }
              }}
              onClick={(e) => pick(i, e.timeStamp)}
              aria-label={
                showCorrect
                  ? `Letter ${letter}, correct`
                  : showWrong
                    ? `Letter ${letter}, your pick, not correct`
                    : `Letter ${letter}`
              }
              data-cuelume-press
              data-cuelume-release
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-[16px] border-2 font-pixel text-[30px] sm:text-[36px] transition-all duration-150",
                "bg-white border-[#e0e0e0] hover:border-[#949494] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] focus-visible:ring-offset-2",
                showCorrect && "border-emerald-500 bg-emerald-50 text-emerald-900",
                showWrong &&
                  (reducedMotion
                    ? "border-[#e8c8c8] bg-[#f9f0f0] text-[#991b1b]"
                    : "border-[#e8c8c8] bg-[#f9f0f0] text-[#991b1b] animate-[wiggle_0.4s_ease-in-out]"),
              )}
            >
              <span>{letter}</span>
              <span className="font-pixel text-[10px] text-[#a0a0a0] absolute bottom-1.5 left-2">
                {i + 1}
              </span>
              {showCorrect && (
                <Check
                  className="absolute top-1.5 right-1.5 w-4 h-4 text-emerald-600"
                  aria-hidden="true"
                />
              )}
              {showWrong && (
                <XCircle
                  className="absolute top-1.5 right-1.5 w-4 h-4 text-[#991b1b]"
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
