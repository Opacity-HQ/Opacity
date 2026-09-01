import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Check, XCircle } from "lucide-react";
import type { RMTrial } from "@/app/api/games/rapid-match/plan";
import type { TrialOutcome } from "./types";

type GridDashRoundProps = {
  trial: Extract<RMTrial, { roundType: "grid" }>;
  onAnswer: (outcome: TrialOutcome) => void;
};

export default function GridDashRound({
  trial,
  onAnswer,
}: GridDashRoundProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const onsetRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      onsetRef.current = performance.now();
    });
    return () => cancelAnimationFrame(frame);
  }, [trial.index]);

  const correctIndex = trial.gridSymbols.indexOf(trial.targetSymbol);

  const handleSelect = useCallback(
    (index: number, eventTime?: number) => {
      if (answered) return;
      setAnswered(true);
      setSelectedIndex(index);

      const endTime = eventTime ?? performance.now();
      const onset = onsetRef.current ?? endTime;
      const reactionTimeMs = Math.max(0, Math.round(endTime - onset));
      const localCorrect = index === correctIndex;

      setTimeout(() => {
        onAnswer({
          trialIndex: trial.index,
          response: { kind: "grid", selectedIndex: index },
          localCorrect,
          reactionTimeMs,
        });
      }, 500);
    },
    [answered, correctIndex, onAnswer, trial.index],
  );

  // Keyboard shortcut support (1-9 for grid cells)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (answered) return;
      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= trial.gridSymbols.length) {
        e.preventDefault();
        handleSelect(keyNum - 1, e.timeStamp);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answered, handleSelect, trial.gridSymbols.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center w-full max-w-[440px] gap-5"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-pixel text-[13px] text-[#a0a0a0]">
          {trial.isWarmup ? "warm-up trial" : "grid match"}
        </span>
        <h2 className="font-pixel text-[22px] sm:text-[26px] text-[#1d1d1d]">
          find target symbol in grid
        </h2>
      </div>

      {/* Target symbol indicator */}
      <div className="flex flex-row items-center gap-3 bg-white border-[2px] border-[#efefef] rounded-[15px] px-4 py-2">
        <span className="font-sauce text-[14px] text-[#5e5e5e]">Target:</span>
        <span className="font-pixel text-[28px] text-[#1d1d1d]">
          {trial.targetSymbol}
        </span>
      </div>

      {/* 3x3 Grid */}
      <div className="grid grid-cols-3 gap-2.5 w-full max-w-[320px] p-2">
        {trial.gridSymbols.map((symbol, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === correctIndex;

          let cellClasses =
            "bg-white border-[2px] border-[#efefef] hover:border-[#1d1d1d]";
          let iconNode = null;

          if (answered) {
            if (isCorrect) {
              cellClasses = "bg-[#f0fbf5] border-[#a3e635] text-[#166534]";
              iconNode = (
                <Check className="w-4 h-4 text-[#166534] absolute top-2 right-2" />
              );
            } else if (isSelected) {
              cellClasses = "bg-[#f9f0f0] border-[#e8c8c8] text-[#991b1b]";
              iconNode = (
                <XCircle className="w-4 h-4 text-[#991b1b] absolute top-2 right-2" />
              );
            }
          }

          return (
            <motion.button
              key={`grid-cell-${i}`}
              type="button"
              id={`grid-cell-${i}`}
              disabled={answered}
              onClick={(e) => handleSelect(i, e.timeStamp)}
              animate={isSelected && !isCorrect ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.3 }}
              data-cuelume-press
              className={`relative flex items-center justify-center h-[75px] sm:h-[85px] rounded-[14px] transition-all duration-150 cursor-pointer disabled:cursor-default ${cellClasses}`}
            >
              <span className="font-pixel text-[30px] sm:text-[36px] select-none">
                {symbol}
              </span>
              <span className="font-pixel text-[10px] text-[#a0a0a0] absolute bottom-1 left-1.5">
                {i + 1}
              </span>
              {iconNode}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
