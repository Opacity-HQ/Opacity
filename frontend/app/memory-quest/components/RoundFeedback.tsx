"use client";

import { motion } from "motion/react";
import { Frown, Trophy } from "lucide-react";
import { SymbolIcon } from "./icons";
import type { MQTrial, TrialOutcome } from "./types";

// Instant per-round result from the client's local grade (the server
// regrades independently). Reveals the right answer after a miss.
export default function RoundFeedback({
  trial,
  outcome,
  roundsPlayed,
  isLastRound,
  onNext,
}: {
  trial: MQTrial;
  outcome: TrialOutcome;
  roundsPlayed: number;
  isLastRound: boolean;
  onNext: () => void;
}) {
  const correct = outcome.localCorrect;
  const targetCell =
    trial.roundType === "position" ? trial.grid.indexOf(trial.target) : -1;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center w-full gap-5 sm:gap-6 mt-2"
    >
      <motion.span
        animate={
          correct
            ? { scale: [1, 1.35, 1], rotate: [0, 10, -10, 0] }
            : { x: [-10, 10, -10, 10, 0] }
        }
        transition={{ duration: 0.55 }}
        className="block"
      >
        {correct ? (
          <Trophy className="w-16 h-16 sm:w-20 sm:h-20 text-[#1d1d1d]" strokeWidth={1.5} aria-hidden />
        ) : (
          <Frown className="w-16 h-16 sm:w-20 sm:h-20 text-[#1d1d1d]" strokeWidth={1.5} aria-hidden />
        )}
      </motion.span>

      <div role="status" className="flex flex-col items-center gap-1 text-center">
        <h2 className="font-pixel text-[22px] sm:text-[26px] text-[#1d1d1d]">
          {correct ? "perfect!" : "good try!"}
        </h2>
        <p className="font-sauce text-[14px] sm:text-[15px] text-[#5e5e5e]">
          {correct
            ? "You remembered the path!"
            : outcome.localAccuracy >= 0.5
              ? "Almost there!"
              : "The forest path was tricky!"}
        </p>
      </div>

      <div className="flex flex-row items-stretch justify-center gap-3 w-full max-w-[340px]">
        {[
          { label: "score", value: `+${outcome.localScore}` },
          { label: "level", value: trial.level },
          { label: "round", value: roundsPlayed },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex flex-col items-center flex-1 bg-white border-[2px] border-[#efefef] rounded-[12px] py-3"
          >
            <span className="font-pixel text-[15px] sm:text-[17px] text-[#1d1d1d]">{value}</span>
            <span className="font-sauce text-[12px] text-[#6b6b6b] mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {!correct && (
        <div className="flex flex-col items-center gap-2 w-full max-w-[340px]">
          <span className="font-pixel text-[12px] sm:text-[13px] text-[#6b6b6b]">
            {trial.roundType === "position" ? "the correct spot was:" : "the correct path was:"}
          </span>

          {trial.roundType === "position" ? (
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${trial.gridSize}, minmax(0, 1fr))` }}
            >
              {trial.grid.map((_, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-center w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] rounded-[12px] border-[2px] bg-white ${
                    i === targetCell ? "border-[#1d1d1d]" : "border-[#efefef]"
                  }`}
                >
                  {i === targetCell && (
                    <>
                      <SymbolIcon symbol={trial.target} className="w-7 h-7 sm:w-8 sm:h-8 text-[#1d1d1d]" />
                      <span className="sr-only">{trial.target}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-2.5">
              {trial.sequence.map((symbol, i) => (
                <div
                  key={i}
                  className="flex items-center justify-center w-[56px] h-[56px] sm:w-[68px] sm:h-[68px] bg-white border-[2px] border-[#e0e0e0] rounded-[14px]"
                >
                  <SymbolIcon symbol={symbol} className="w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]" />
                  <span className="sr-only">{symbol}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        id="memory-quest-next"
        onClick={onNext}
        className="button-shadow flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-4px] transition-all duration-200 rounded-[20px] px-[24px] py-[10px] cursor-pointer"
      >
        <span className="font-pixel text-[17px] sm:text-[20px] text-white">
          {isLastRound ? "see stats" : "next round"}
        </span>
      </button>
    </motion.div>
  );
}
