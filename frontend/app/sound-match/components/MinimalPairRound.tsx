"use client";

import { useEffect, useRef, useState } from "react";
import { Check, XCircle, Circle, Square, Triangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SMTrial } from "@/app/api/games/sound-match/plan";
import { useTrialClock, MIN_REACTION_MS } from "./useTrialClock";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import { useSpeech } from "./useSpeech";
import SpeakerButton from "./SpeakerButton";
import type { TrialOutcome } from "./types";

// Level 3 (Q9-12): minimal-pair discrimination (SHIP / SHEEP / CHIP).
//
// Judgment call from the build brief: at this level the whole point of the
// trial is *auditory* discrimination, so the answer options are NOT printed
// as the spelled-out minimal-pair words — that would let a child letter-match
// and skip the sound discrimination the trial exists to measure. Options are
// audio-replayable buttons (shape glyph + "Sound N"); the word is spoken and
// exposed only to assistive tech via aria-label.
//
// Fallback: if SpeechSynthesis is unavailable the words ARE shown as text, so
// the trial stays answerable — never block a trial on audio.
type MinimalPairTrial = Extract<SMTrial, { roundType: "minimal-pair" }>;

const SHAPES = [Circle, Square, Triangle];

export default function MinimalPairRound({
  trial,
  onAnswer,
}: {
  trial: MinimalPairTrial;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  const { markFirstMove, commit, hasElapsedSinceOnset } = useTrialClock(
    trial.index,
  );
  const reducedMotion = usePrefersReducedMotion();
  const { speak, isSupported } = useSpeech();
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
            label="Play the word you need to match again"
          />
          <span className="font-pixel text-[14px] text-[#5e5e5e] max-w-[180px] text-left">
            tap to hear the word again, then match it below
          </span>
        </div>
      </div>

      <ul
        aria-label={trial.prompt}
        className="flex w-full max-w-[380px] flex-col gap-3"
      >
        {trial.options.map((word, i) => {
          const Shape = SHAPES[i % SHAPES.length];
          const isSelected = selected === i;
          const showCorrect = selected !== null && i === trial.correctIndex;
          const showWrong = isSelected && i !== trial.correctIndex;
          return (
            <li key={`${word}-${i}`} className="flex flex-row items-stretch gap-2">
              <SpeakerButton
                size="sm"
                onPlay={() => speak(word)}
                label={`Play sound ${i + 1}`}
                className="self-center"
              />
              <button
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
                    ? `Sound ${i + 1}, "${word}", correct`
                    : showWrong
                      ? `Sound ${i + 1}, "${word}", your pick, not correct`
                      : `Choose sound ${i + 1}, "${word}"`
                }
                data-cuelume-press
                data-cuelume-release
                className={cn(
                  "relative flex flex-1 flex-row items-center gap-3 rounded-[16px] border-2 px-4 py-3.5 transition-all duration-150",
                  "bg-white border-[#e0e0e0] hover:border-[#949494] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] focus-visible:ring-offset-2",
                  showCorrect &&
                    "border-emerald-500 bg-emerald-50 text-emerald-900",
                  showWrong &&
                    (reducedMotion
                      ? "border-[#e8c8c8] bg-[#f9f0f0] text-[#991b1b]"
                      : "border-[#e8c8c8] bg-[#f9f0f0] text-[#991b1b] animate-[wiggle_0.4s_ease-in-out]"),
                )}
              >
                <Shape className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span className="font-pixel text-[15px] sm:text-[17px]">
                  {isSupported && selected === null ? `Sound ${i + 1}` : word}
                </span>
                <span className="font-pixel text-[11px] text-[#a0a0a0] ml-auto">
                  {i + 1}
                </span>
                {showCorrect && (
                  <Check
                    className="w-4 h-4 text-emerald-600 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {showWrong && (
                  <XCircle
                    className="w-4 h-4 text-[#991b1b] shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
