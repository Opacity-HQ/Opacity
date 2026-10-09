import {
  Sun,
  Moon,
  Star,
  Cloud,
  Heart,
  Cat,
  Dog,
  Fish,
  Bird,
  Apple,
  Bell,
  Car,
  Key,
  Leaf,
  Gift,
  Flame,
  Ghost,
  type LucideIcon,
} from "lucide-react";

// Picture-answer icons for Levels 1-2 (first-sound / rhyme). The plan's
// content banks only ever reference names in this map. Per frontend/AGENTS.md
// these are lucide icons, never emoji.
const ICONS: Record<string, LucideIcon> = {
  Sun,
  Moon,
  Star,
  Cloud,
  Heart,
  Cat,
  Dog,
  Fish,
  Bird,
  Apple,
  Bell,
  Car,
  Key,
  Leaf,
  Gift,
  Flame,
  Ghost,
};

export function OptionIcon({
  name,
  className,
}: {
  name?: string;
  className?: string;
}) {
  if (!name) return null;
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}
