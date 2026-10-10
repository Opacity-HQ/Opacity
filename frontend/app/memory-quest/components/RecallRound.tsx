"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { ALL_SYMBOLS, SymbolIcon } from "./icons";
import { useTrialClock } from "./useTrialClock";
import type { MQTrial, TrialOutcome } from "./types";

// Short pause after the last slot fills so the child sees their final pick
// land before the round closes.
const AUTO_SUBMIT_DELAY_MS = 120;

/** Shuffled bank: the path's symbols plus random distractors. */
function buildBank(sequence: string[]): string[] {
  const unique = [...new Set(sequence)];
  const distractors = ALL_SYMBOLS.filter((s) => !unique.includes(s))
    .sort(() => Math.random() - 0.5)
    .slice(0, Math.max(3, 9 - unique.length));
  return [...unique, ...distractors].sort(() => Math.random() - 0.5);
}

// Column widths for the bank (flex-wrap so a partial last row stays centered)
function bankItemWidth(count: number): string {
  if (count <= 6) return "w-[calc((100%-1.5rem)/3)] sm:w-[calc((100%-2rem)/3)]";
  if (count <= 8) return "w-[calc((100%-2.25rem)/4)] sm:w-[calc((100%-3rem)/4)]";
  return "w-[calc((100%-2.25rem)/4)] sm:w-[calc((100%-4rem)/5)]";
}

// Local copy of the server's grading (app/api/games/memory-quest/plan.ts),
// used only for the instant feedback screen. The server regrades from the
// raw response; nothing computed here is ever submitted.
function gradeLocally(trial: MQTrial, items: string[], selectedIndex: number | null) {
  const accuracy =
    trial.roundType === "sequence"
      ? trial.sequence.filter((s, i) => items[i] === s).length / trial.sequence.length
      : selectedIndex === trial.grid.indexOf(trial.target)
        ? 1
        : 0;
  return {
    localAccuracy: accuracy,
    localCorrect: accuracy === 1,
    localScore: Math.round(accuracy * trial.level * 100),
  };
}

type Feedback = {
  onSelect: () => void;
  onBackspace: () => void;
};

export default function RecallRound({
  trial,
  feedback,
  onAnswer,
}: {
  trial: MQTrial;
  feedback: Feedback;
  onAnswer: (outcome: TrialOutcome) => void;
}) {
  const clock = useTrialClock(trial.index);
  const [items, setItems] = useState<string[]>([]);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [corrections, setCorrections] = useState(0);
  const [bank] = useState(() =>
    trial.roundType === "sequence" ? buildBank(trial.sequence) : [],
  );
  const submittedRef = useRef(false);

  function submit(
    eventTimeStamp: number,
    answer: { items: string[]; selectedIndex: number | null },
  ) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const timing = clock.commit(eventTimeStamp);
    onAnswer({
      trialIndex: trial.index,
      response:
        trial.roundType === "sequence"
          ? { kind: "sequence", items: answer.items, corrections }
          : { kind: "position", selectedIndex: answer.selectedIndex },
      ...timing,
      ...gradeLocally(trial, answer.items, answer.selectedIndex),
    });
  }

  // Reaction time is stamped at the tap that fills the last slot; the
  // submit itself waits a beat so that pick is visible first.
  const lastTapRef = useRef(0);
  const isFull =
    trial.roundType === "sequence" && items.length === trial.sequence.length;

  useEffect(() => {
    if (!isFull) return;
    const t = setTimeout(
      () => submit(lastTapRef.current, { items, selectedIndex: null }),
      AUTO_SUBMIT_DELAY_MS,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFull]);

  function handleBankTap(symbol: string, e: React.MouseEvent) {
    if (trial.roundType !== "sequence" || isFull) return;
    clock.markFirstMove(e.timeStamp);
    lastTapRef.current = e.timeStamp;
    feedback.onSelect();
    setItems((prev) => [...prev, symbol]);
  }

  function handleBackspace() {
    if (items.length === 0 || isFull) return;
    feedback.onBackspace();
    setCorrections((c) => c + 1);
    setItems((prev) => prev.slice(0, -1));
  }

  function handleCellTap(cell: number, e: React.MouseEvent) {
    if (submittedRef.current) return;
    clock.markFirstMove(e.timeStamp);
    setSelectedCell(cell);
    submit(e.timeStamp, { items: [], selectedIndex: cell });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center w-full gap-5"
    >
      <div className="flex flex-col items-center gap-1 mt-2">
        <h2 className="font-pixel text-[20px] sm:text-[24px] text-[#1d1d1d] dark:text-[#f2f2f2]">your turn!</h2>
        <p className="font-pixel text-[16px] sm:text-[20px] text-center text-[#5e5e5e] dark:text-[#a3a3a3] flex items-center justify-center gap-2">
          {trial.roundType === "position" ? (
            <>
              Where was
              <SymbolIcon symbol={trial.target} className="w-9 h-9 sm:w-10 sm:h-10 text-[#1d1d1d] dark:text-[#f2f2f2]" />
              <span className="sr-only">{trial.target}</span>?
            </>
          ) : (
            "Tap the pictures in the correct order"
          )}
        </p>
      </div>

      {trial.roundType === "position" ? (
        <div
          className="grid gap-3 sm:gap-4 p-2 mt-4"
          style={{ gridTemplateColumns: `repeat(${trial.gridSize}, minmax(0, 1fr))` }}
        >
          {trial.grid.map((_, i) => (
            <motion.button
              type="button"
              key={`recall-map-${i}`}
              aria-label={`row ${Math.floor(i / trial.gridSize) + 1}, column ${(i % trial.gridSize) + 1}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={(e) => handleCellTap(i, e)}
              disabled={selectedCell !== null}
              className={`flex items-center justify-center w-[56px] h-[56px] sm:w-[70px] sm:h-[70px] rounded-[12px] border-[2px] bg-white dark:bg-[#141414] transition-all duration-150 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#1d1d1d] dark:focus-visible:outline-[#f2f2f2] ${
                selectedCell === i
                  ? "border-[#1d1d1d] dark:border-[#f2f2f2]"
                  : "border-dashed border-[#a8a8a8] hover:border-[#5e5e5e] dark:hover:border-[#a3a3a3] hover:bg-[#f9f9f9] dark:hover:bg-[#2a2a2a]"
              }`}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-row flex-wrap items-center justify-center gap-2 px-4 max-w-full">
            {trial.sequence.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center justify-center w-[52px] h-[52px] sm:w-[60px] sm:h-[60px] rounded-[12px] border-[2px] bg-white dark:bg-[#141414] transition-all duration-150 ${
                  items[i]
                    ? "border-[#a8a8a8]"
                    : i === items.length
                      ? "border-[#5e5e5e] dark:border-[#a3a3a3] border-dashed"
                      : "border-dashed border-[#a8a8a8]"
                }`}
              >
                {items[i] ? (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <SymbolIcon symbol={items[i]} className="w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d] dark:text-[#f2f2f2]" />
                    <span className="sr-only">{items[i]}</span>
                  </motion.span>
                ) : (
                  <span className="font-pixel text-[11px] text-[#6b6b6b] dark:text-[#a3a3a3]">{i + 1}</span>
                )}
              </motion.div>
            ))}
          </div>

          <div className="flex flex-col items-center w-full gap-3 px-4 mt-2">
            <div className="flex flex-row flex-wrap justify-center gap-3 sm:gap-4 w-full max-w-[540px]">
              {bank.map((symbol, i) => (
                <motion.button
                  type="button"
                  key={`${symbol}-${i}`}
                  aria-label={symbol}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.035 }}
                  whileTap={{ scale: 0.88 }}
                  onClick={(e) => handleBankTap(symbol, e)}
                  disabled={isFull}
                  className={`flex items-center justify-center aspect-square ${bankItemWidth(bank.length)} bg-white dark:bg-[#141414] border-[2px] border-[#efefef] dark:border-[#262626] rounded-[14px] shadow-[0_4px_14px_rgba(0,0,0,0.07)] hover:bg-[#f9f9f9] dark:hover:bg-[#2a2a2a] hover:border-[#d4d4d4] dark:hover:border-[#3a3a3a] transition-all duration-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed`}
                >
                  <SymbolIcon symbol={symbol} className="w-10 h-10 sm:w-14 sm:h-14 text-[#1d1d1d] dark:text-[#f2f2f2]" />
                </motion.button>
              ))}
            </div>

            <button
              type="button"
              id="memory-quest-backspace"
              onClick={handleBackspace}
              disabled={items.length === 0 || isFull}
              className="flex flex-row items-center gap-2 px-4 py-2 bg-white dark:bg-[#141414] border-[2px] border-[#efefef] dark:border-[#262626] rounded-[12px] hover:bg-[#f5f5f5] dark:hover:bg-[#2a2a2a] disabled:opacity-30 transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="font-pixel text-[13px] sm:text-[14px] text-[#5e5e5e] dark:text-[#a3a3a3]">
                ← backspace
              </span>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
