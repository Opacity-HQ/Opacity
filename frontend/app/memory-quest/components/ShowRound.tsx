"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { SymbolIcon } from "./icons";
import type { MQTrial } from "./types";

// The memorise step: shows the path or map with a countdown bar for the
// round's displayMs, then hands over to recall. Remounted per round (keyed
// by trial index in page.tsx), so the timer always starts fresh.
export default function ShowRound({
  trial,
  onDone,
}: {
  trial: MQTrial;
  onDone: () => void;
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startMs = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startMs;
      setProgress(Math.max(0, (1 - elapsed / trial.displayMs) * 100));
    }, 50);
    const timeout = setTimeout(onDone, trial.displayMs);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [trial.displayMs, onDone]);

  const itemCount =
    trial.roundType === "sequence"
      ? trial.sequence.length
      : trial.grid.filter(Boolean).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center w-full gap-5 sm:gap-6"
    >
      <div className="flex flex-col items-center gap-1 text-center mt-2">
        <h2 className="font-pixel text-[20px] sm:text-[24px] text-[#1d1d1d]">
          {trial.roundType === "position" ? "the map" : "the path"}
        </h2>
        <p className="font-pixel text-[16px] sm:text-[20px] text-center text-[#5e5e5e] flex items-center justify-center gap-2">
          {trial.roundType === "position" ? (
            <>
              Remember where
              <SymbolIcon symbol={trial.target} className="w-9 h-9 sm:w-10 sm:h-10 text-[#1d1d1d]" />
              <span className="sr-only">{trial.target}</span>
              is!
            </>
          ) : (
            "Remember this sequence!"
          )}
        </p>
      </div>

      {trial.roundType === "position" ? (
        <div
          className="grid gap-3 sm:gap-4 p-2"
          style={{ gridTemplateColumns: `repeat(${trial.gridSize}, minmax(0, 1fr))` }}
        >
          {trial.grid.map((symbol, i) => (
            <motion.div
              key={`map-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 250 }}
              className="flex items-center justify-center w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] bg-white border-[2px] border-[#e0e0e0] rounded-[14px]"
            >
              {symbol && (
                <SymbolIcon symbol={symbol} className="w-8 h-8 sm:w-11 sm:h-11 text-[#1d1d1d]" />
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-row flex-wrap items-center justify-center gap-1.5 sm:gap-2 px-2">
          {trial.sequence.map((symbol, i) => (
            <motion.div
              key={`${symbol}-${i}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 250 }}
              className="flex flex-row items-center gap-1.5 sm:gap-2"
            >
              <div className="flex items-center justify-center w-[68px] h-[68px] sm:w-[88px] sm:h-[88px] bg-white border-[2px] border-[#e0e0e0] rounded-[14px]">
                <SymbolIcon symbol={symbol} className="w-9 h-9 sm:w-12 sm:h-12 text-[#1d1d1d]" />
              </div>
              {i < trial.sequence.length - 1 && (
                <span aria-hidden className="font-pixel text-[14px] sm:text-[16px] text-[#6b6b6b]">
                  →
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="flex flex-col items-center w-full max-w-[340px] gap-2 px-2">
        <div className="flex flex-row items-center justify-between w-full">
          <span className="font-pixel text-[12px] text-[#6b6b6b]">level {trial.level}</span>
          <span className="font-pixel text-[12px] text-[#6b6b6b]">{itemCount} items</span>
        </div>
        <div
          role="progressbar"
          aria-label="Time left to memorise"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full h-[5px] bg-[#efefef] rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-[#1d1d1d] rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="font-sauce text-[12px] text-[#6b6b6b]">
          memorise before the bar runs out
        </span>
      </div>
    </motion.div>
  );
}
