"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTrialClock } from "./useTrialClock";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";
import type { WBTrial, TrialOutcome } from "./types";

type Stage = "preview" | "build";

export default function BuildRound({
  trial,
  onAnswer,
  playCue,
  triggerHaptic,
}: {
  trial: WBTrial;
  onAnswer: (outcome: TrialOutcome) => void;
  playCue: (sound: "tick" | "success" | "error" | "droplet") => void;
  triggerHaptic: (preset: "nudge" | "success" | "error") => void;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [stage, setStage] = useState<Stage>("preview");
  const { markFirstMove, commit } = useTrialClock(`${trial.index}-${stage}`);
  const [filled, setFilled] = useState<number[]>([]);
  const [previewProgress, setPreviewProgress] = useState(100);
  const [result, setResult] = useState<boolean | null>(null);
  const answeredRef = useRef(false);
  const filledRef = useRef<number[]>([]);

  function submit(eventTimeStamp: number) {
    if (answeredRef.current) return;
    answeredRef.current = true;
    const { reactionTimeMs, timeToFirstMoveMs } = commit(eventTimeStamp);

    const answer = filledRef.current;
    const submittedWord = answer.map((i) => trial.tiles[i]).join("").toLowerCase();
    const localCorrect = submittedWord === trial.word.toLowerCase();

    setResult(localCorrect);
    playCue(localCorrect ? "success" : "error");
    triggerHaptic(localCorrect ? "success" : "error");

    window.setTimeout(
      () => {
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "build", tileIndices: answer },
          reactionTimeMs,
          timeToFirstMoveMs,
          localCorrect,
        });
      },
      reducedMotion ? 250 : 700,
    );
  }

  // Show the assembled word, then scramble it into tiles. Local state
  // starts fresh each trial because the parent remounts this component with
  // `key={trial.index}` — no reset-on-prop-change effect needed here.
  useEffect(() => {
    const startMs = Date.now();
    const progressInterval = window.setInterval(() => {
      const elapsed = Date.now() - startMs;
      setPreviewProgress(Math.max(0, (1 - elapsed / trial.previewMs) * 100));
    }, 50);

    const previewTimeout = window.setTimeout(() => {
      window.clearInterval(progressInterval);
      setPreviewProgress(0);
      setStage("build");
    }, trial.previewMs);

    return () => {
      window.clearInterval(progressInterval);
      window.clearTimeout(previewTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trial.index]);

  // Timeout during the build stage auto-submits whatever tiles are filled.
  useEffect(() => {
    if (stage !== "build") return;
    const timeout = window.setTimeout(() => {
      if (!answeredRef.current) submit(performance.now());
    }, trial.timeoutMs);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, trial.index]);

  function tapTile(tileIndex: number, e: React.MouseEvent | React.KeyboardEvent) {
    if (stage !== "build" || answeredRef.current) return;
    if (filledRef.current.includes(tileIndex)) return;
    if (filledRef.current.length >= trial.word.length) return;

    markFirstMove(e.timeStamp);
    playCue("tick");
    triggerHaptic("nudge");

    const next = [...filledRef.current, tileIndex];
    filledRef.current = next;
    setFilled(next);

    if (next.length === trial.word.length) {
      window.setTimeout(() => submit(e.timeStamp), 150);
    }
  }

  function backspace() {
    if (answeredRef.current || filledRef.current.length === 0) return;
    playCue("droplet");
    const next = filledRef.current.slice(0, -1);
    filledRef.current = next;
    setFilled(next);
  }

  const slots = Array.from({ length: trial.word.length });

  return (
    <div className="flex flex-col items-center justify-center w-full gap-6">
      {stage === "preview" ? (
        <>
          <p className="font-pixel text-[18px] sm:text-[22px] text-[#1d1d1d] text-center">
            Remember this word
          </p>
          <div
            role="group"
            aria-label={`Word: ${trial.word}`}
            className="flex flex-row gap-2 sm:gap-3"
          >
            {trial.word.split("").map((letter, i) => (
              <div
                key={i}
                className="font-pixel text-[26px] sm:text-[32px] w-[50px] h-[60px] sm:w-[60px] sm:h-[70px] rounded-[12px] border-2 border-[#e0e0e0] bg-[#f9f6fe] flex items-center justify-center"
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="w-full max-w-[300px] h-[5px] bg-[#efefef] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1d1d1d] rounded-full transition-none"
              style={{ width: `${previewProgress}%` }}
            />
          </div>
        </>
      ) : (
        <>
          <p className="font-pixel text-[18px] sm:text-[22px] text-[#1d1d1d] text-center">
            Now build it!
          </p>

          <div role="group" aria-label="Your answer" className="flex flex-row gap-2 sm:gap-3">
            {slots.map((_, i) => {
              const tileIndex = filled[i];
              const letter = tileIndex !== undefined ? trial.tiles[tileIndex] : null;
              return (
                <div
                  key={i}
                  className={cn(
                    "font-pixel text-[26px] sm:text-[32px] w-[50px] h-[60px] sm:w-[60px] sm:h-[70px] rounded-[12px] border-2 flex items-center justify-center transition-all duration-150",
                    letter
                      ? "border-[#1d1d1d] bg-[#f7f7f7]"
                      : "border-dashed border-[#e0e0e0] bg-white",
                    result === true && "border-emerald-500 bg-emerald-50",
                    result === false &&
                      (reducedMotion
                        ? "border-red-400 bg-red-50"
                        : "border-red-400 bg-red-50 animate-[wiggle_0.4s_ease-in-out]"),
                  )}
                >
                  {letter ?? (
                    <span className="font-pixel text-[13px] text-[#d0d0d0]">{i + 1}</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-md px-2">
            {trial.tiles.map((letter, i) => {
              const used = filled.includes(i);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={used}
                  onClick={(e) => tapTile(i, e)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      tapTile(i, e);
                    }
                  }}
                  aria-label={`Letter ${letter}`}
                  className={cn(
                    "font-pixel text-[22px] sm:text-[26px] w-[46px] h-[52px] sm:w-[54px] sm:h-[60px] rounded-[12px] border-2 flex items-center justify-center transition-all duration-150",
                    "bg-white border-[#e0e0e0] hover:border-[#949494] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d1d1d] focus-visible:ring-offset-2",
                    used && "opacity-30 cursor-not-allowed",
                  )}
                >
                  {letter}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={backspace}
            disabled={filled.length === 0}
            className="font-pixel text-[13px] sm:text-[14px] flex flex-row items-center gap-2 px-4 py-2 bg-white border-2 border-[#efefef] rounded-[12px] hover:bg-[#f5f5f5] disabled:opacity-30 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed text-[#5e5e5e]"
          >
            ← backspace
          </button>
        </>
      )}
    </div>
  );
}
