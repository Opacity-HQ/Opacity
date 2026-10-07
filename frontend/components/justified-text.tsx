"use client";

import { useEffect, useRef, useState } from "react";
import { lineText, prepare, solve, type Prepared } from "@kitlangton/justice";
import { cn } from "@/lib/utils";

type JustifiedLine = {
  text: string;
  wordSpacing: number;
  tracking: number;
  opening: number;
};

type JustifiedTextProps = {
  children: string;
  className?: string;
};

/**
 * A paragraph set with @kitlangton/justice's optimal-fit line breaking.
 * Server render and pre-measurement fall back to a normal wrapping paragraph.
 */
export function JustifiedText({ children: text, className }: JustifiedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [lines, setLines] = useState<JustifiedLine[] | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const context = document.createElement("canvas").getContext("2d");
    if (!context) return;

    let cached: { font: string; prepared: Prepared } | null = null;

    const compute = () => {
      const width = el.clientWidth;
      if (width <= 0) return;

      const style = getComputedStyle(el);
      const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;

      if (!cached || cached.font !== font) {
        context.font = font;
        cached = {
          font,
          prepared: prepare(text, (value) => context.measureText(value).width),
        };
      }

      const { prepared } = cached;
      const layout = solve(prepared, width);
      setLines(
        layout.lines.map((line) => ({
          text: lineText(prepared, line),
          wordSpacing: line.wordSpacing,
          tracking: line.tracking,
          opening: line.opening,
        })),
      );
    };

    const observer = new ResizeObserver(compute);
    observer.observe(el);

    // Measurements are only valid once the web font has loaded.
    let active = true;
    const onFontsReady = () => {
      if (active) compute();
    };
    document.fonts.ready.then(onFontsReady);
    document.fonts.addEventListener("loadingdone", onFontsReady);

    return () => {
      active = false;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", onFontsReady);
    };
  }, [text]);

  return (
    <p ref={ref} className={cn(className)}>
      {lines ? (
        <>
          <span className="sr-only">{text}</span>
          {lines.map((line, index) => (
            <span
              key={index}
              aria-hidden="true"
              className="block whitespace-nowrap"
              style={{
                wordSpacing: line.wordSpacing,
                letterSpacing: line.tracking,
                marginLeft: -line.opening,
              }}
            >
              {line.text}
            </span>
          ))}
        </>
      ) : (
        text
      )}
    </p>
  );
}
