"use client";

import { Blocks } from "lucide-react";
import Link from "next/link";

export default function BuilderComplete({
  accuracy,
  onPlayAgain,
}: {
  accuracy: number;
  onPlayAgain: () => void;
}) {
  const percent = Math.round(accuracy * 100);

  return (
    <div className="flex flex-col items-center justify-center w-full gap-5 px-4 text-center">
      <Blocks className="text-[#1d1d1d]" size={40} aria-hidden="true" />
      <span className="font-pixel text-[26px] sm:text-[32px] text-[#1d1d1d]">
        Words built!
      </span>
      <p className="font-sauce text-[15px] sm:text-[16px] text-[#5e5e5e] max-w-sm">
        You built {percent}% of the words correctly. Every round sharpens
        your spelling skills.
      </p>
      <div className="flex flex-row items-center justify-center gap-3 mt-2">
        <button
          type="button"
          onClick={onPlayAgain}
          className="button-shadow font-pixel text-[16px] flex items-center justify-center bg-[#1b1b1b] hover:bg-[#323232] hover:translate-y-[-3px] transition-all duration-200 rounded-[18px] px-[22px] py-[9px] text-white cursor-pointer"
        >
          build more words
        </button>
        <Link
          href="/dashboard"
          className="font-pixel text-[16px] flex items-center justify-center bg-[#f7f7f7] hover:bg-[#eaeaea] transition-all duration-200 rounded-[18px] px-[22px] py-[9px] text-[#1d1d1d]"
        >
          back to dashboard
        </Link>
      </div>
    </div>
  );
}
