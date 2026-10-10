import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Check, XCircle } from "lucide-react";
import type { RMTrial } from "@/app/api/games/rapid-match/plan";
import type { TrialOutcome } from "./types";

type TargetMatchRoundProps = {
  trial: Extract<RMTrial, { roundType: "target" }>;
  onAnswer: (outcome: TrialOutcome) => void;
};

export default function TargetMatchRound({
  trial,
  onAnswer,
}: TargetMatchRoundProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  const onsetRef = useRef<number | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      onsetRef.current = performance.now();
    });
    return () => cancelAnimationFrame(frame);
  }, [trial.index]);

  const correctIndex = trial.options.indexOf(trial.targetSymbol);

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
          response: { kind: "target", selectedOptionIndex: index },
          localCorrect,
          reactionTimeMs,
        });
      }, 500);
    },
    [answered, correctIndex, onAnswer, trial.index],
  );

  // Keyboard shortcut support (1-6)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (answered) return;
      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= trial.options.length) {
        e.preventDefault();
        handleSelect(keyNum - 1, e.timeStamp);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [answered, handleSelect, trial.options.length]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center w-full max-w-[440px] gap-6"
    >
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="font-pixel text-[13px] text-[#a0a0a0]">
          {trial.isWarmup ? "warm-up trial" : "target match"}
        </span>
        <h2 className="font-pixel text-[22px] sm:text-[26px] text-[#1d1d1d] dark:text-[#f2f2f2]">
          find the matching symbol
        </h2>
      </div>

      {/* Target Box */}
      <div className="flex flex-col items-center justify-center w-[100px] h-[100px] sm:w-[120px] sm:h-[120px] bg-white dark:bg-[#141414] border-[3px] border-[#1d1d1d] dark:border-[#f2f2f2] rounded-[20px] shadow-sm">
        <span className="font-pixel text-[42px] sm:text-[52px] text-[#1d1d1d] dark:text-[#f2f2f2] select-none">
          {trial.targetSymbol}
        </span>
      </div>

      {/* Options grid */}
      <div
        className={`grid gap-3 w-full max-w-[380px] ${
          trial.options.length <= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"
        }`}
      >
        {trial.options.map((option, i) => {
          const isSelected = selectedIndex === i;
          const isCorrect = i === correctIndex;

          let cardClasses =
            "bg-white dark:bg-[#141414] border-[#d4d4d4] dark:border-[#3a3a3a] hover:border-[#1d1d1d] dark:hover:border-[#f2f2f2] hover:bg-[#f9f9f9] dark:hover:bg-[#2a2a2a]";
          let iconNode = null;

          if (answered) {
            if (isCorrect) {
              cardClasses = "bg-[#f0fbf5] dark:bg-[#0f2118] border-[#a3e635] text-[#166534] dark:text-emerald-300";
              iconNode = (
                <Check className="w-4 h-4 text-[#166534] dark:text-emerald-300 absolute top-2.5 right-2.5" />
              );
            } else if (isSelected) {
              cardClasses = "bg-[#f9f0f0] dark:bg-[#2a1a1a] border-[#e8c8c8] dark:border-[#5c2b2b] text-[#991b1b] dark:text-[#fca5a5]";
              iconNode = (
                <XCircle className="w-4 h-4 text-[#991b1b] dark:text-[#fca5a5] absolute top-2.5 right-2.5" />
              );
            }
          }

          return (
            <motion.button
              key={`${option}-${i}`}
              type="button"
              id={`target-option-${i}`}
              disabled={answered}
              onClick={(e) => handleSelect(i, e.timeStamp)}
              animate={isSelected && !isCorrect ? { x: [-4, 4, -4, 4, 0] } : {}}
              transition={{ duration: 0.3 }}
              data-cuelume-press
              className={`relative flex flex-col items-center justify-center h-[90px] sm:h-[100px] rounded-[16px] border shadow-[0_4px_14px_rgba(0,0,0,0.07)] transition-all duration-150 cursor-pointer disabled:cursor-default ${cardClasses}`}
            >
              <span className="font-pixel text-[32px] sm:text-[38px] select-none">
                {option}
              </span>
              <span className="font-pixel text-[11px] text-[#6b6b6b] dark:text-[#a3a3a3] absolute bottom-1.5 left-2">
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
