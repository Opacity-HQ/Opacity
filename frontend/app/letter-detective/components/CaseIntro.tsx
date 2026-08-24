"use client";

import Image from "next/image";
import type { LDPair } from "./types";

export default function CaseIntro({
  pair,
  loading,
  onStart,
}: {
  pair: LDPair | null;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center w-full gap-6 px-4 text-center">
      <Image src="/letter.svg" alt="" width={48} height={48} aria-hidden="true" />
      <div className="flex flex-col items-center gap-2">
        <span className="font-pixel text-[26px] sm:text-[32px] text-[#1d1d1d]">
          {pair ? `Case: ${pair.letterA} vs ${pair.letterB}` : "New case"}
        </span>
        <p className="font-open-sauce text-[15px] sm:text-[16px] text-[#5e5e5e] max-w-sm">
          Look carefully at each letter. Take your time — there is no wrong
          way to play.
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        disabled={loading}
        className="button-shadow font-pixel text-[18px] flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-3px] transition-all duration-200 rounded-[20px] px-[28px] py-[10px] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "loading case..." : "start case"}
      </button>
    </div>
  );
}
