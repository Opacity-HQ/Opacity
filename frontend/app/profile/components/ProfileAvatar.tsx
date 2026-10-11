"use client";

import { useEffect, useRef, useState } from "react";
import { Blobatar } from "@blobatar/react";
import { useAvatarEyeColor } from "@/lib/use-avatar-eye-color";
import { happy, idle, sad, scared, smug, surprised, wink } from "blobatar/expression";
import type { Expression } from "blobatar/expression";

// Untinted poses only, so the eye colour holds through every reaction.
const REACTIONS: Expression[] = [happy, surprised, wink, smug, scared, sad];
const HOLD_MS = 1200;

// The avatar reacts when clicked: it holds a random pose briefly, then settles back.
export function ProfileAvatar({ name, size = 160 }: { name: string; size?: number }) {
  const [pose, setPose] = useState<Expression>(idle);
  const eye = useAvatarEyeColor();
  const last = useRef(-1);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function react() {
    // never repeat the previous pose, so every tap visibly changes
    let i = Math.floor(Math.random() * REACTIONS.length);
    if (i === last.current) i = (i + 1) % REACTIONS.length;
    last.current = i;
    setPose(REACTIONS[i]);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setPose(idle), HOLD_MS);
  }

  return (
    <button
      type="button"
      onClick={react}
      aria-label={`${name}'s avatar. Tap for a reaction`}
      className="shrink-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1b1b1b] dark:focus-visible:outline-[#f2f2f2]"
    >
      <Blobatar
        name={name}
        size={size}
        animate="always"
        expression={pose}
        palette={{ eye }}
        className="pointer-events-none"
      />
    </button>
  );
}
