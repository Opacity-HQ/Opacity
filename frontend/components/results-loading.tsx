"use client";

import { DotmSquare18 } from "@/components/ui/dotm-square-18";

interface ResultsLoadingProps {
  error?: string | null;
  onRetry?: () => void;
}

// Icon size matches the label's font size so they read as one line.
const LABEL_PX = 20;

export default function ResultsLoading({ error, onRetry }: ResultsLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-6 py-16"
    >
      <div className="flex flex-row items-center gap-3">
        <DotmSquare18 size={LABEL_PX} dotSize={3} speed={1.2} bloom />
        <p
          className="font-pixel text-[#1d1d1d] leading-none"
          style={{ fontSize: LABEL_PX }}
        >
          loading results...
        </p>
      </div>
      {error && (
        <div className="flex flex-col items-center gap-3">
          <p role="alert" className="font-pixel text-[13px] text-red-600">
            {error}
          </p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="font-pixel text-[16px] bg-[#1b1b1b] hover:bg-[#323232] transition-all duration-200 rounded-[15px] px-[24px] py-[10px] text-white cursor-pointer"
            >
              try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
