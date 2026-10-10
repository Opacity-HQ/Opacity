"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const subscribe = () => () => {};

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  // The resolved theme is only known on the client; render a neutral state
  // until mounted so server and first client render match.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#e8e8e8] bg-white text-[#1d1d1d] transition-colors hover:bg-[#f7f7f7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1b1b1b] dark:border-[#2a2a2a] dark:bg-[#1f1f1f] dark:text-[#f2f2f2] dark:hover:bg-[#2a2a2a] dark:focus-visible:outline-[#f2f2f2]",
        className,
      )}
    >
      {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
