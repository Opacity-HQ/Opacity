import {
  Star, Home, TreePine, Moon, Book, Sun, Key, Cloud,
  Heart, Flower, Umbrella, Music, Anchor, Bell, Rocket,
  Snowflake, Trophy, Zap, HelpCircle, type LucideIcon,
} from "lucide-react";

// Symbol names the server sends (app/api/games/memory-quest/plan.ts SYMBOLS)
// mapped to their lucide icons.
const SYMBOL_ICONS: Record<string, LucideIcon> = {
  Star, Home, TreePine, Moon, Book, Sun, Key, Cloud,
  Heart, Flower, Umbrella, Music, Anchor, Bell, Rocket,
  Snowflake, Trophy, Zap,
};

export const ALL_SYMBOLS = Object.keys(SYMBOL_ICONS);

export function SymbolIcon({
  symbol,
  className = "w-8 h-8 sm:w-10 sm:h-10 text-[#1d1d1d]",
}: {
  symbol: string;
  className?: string;
}) {
  const Icon = SYMBOL_ICONS[symbol] ?? HelpCircle;
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
