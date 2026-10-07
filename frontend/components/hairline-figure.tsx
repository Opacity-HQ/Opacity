"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type HairlineFigureName =
  | "sound-match"
  | "letter-detective"
  | "word-builder"
  | "memory-quest"
  | "rapid-match";

type Figure = {
  means: string;
  range: [number, number, number];
  mount: (
    parts: { stage: HTMLElement; svg: SVGElement; read: { textContent: string } },
    value: number,
  ) => { set: (value: number) => void; destroy: () => void };
};

type Engine = { inject: (root: Document) => void; mk: (tag: string, attrs: Record<string, string>, parent: Element) => SVGElement };

const figures: Record<HairlineFigureName, () => Promise<{ default: (engine: Engine) => Figure }>> = {
  "sound-match": () => import("./hairline/figures/sound-match"),
  "letter-detective": () => import("./hairline/figures/letter-detective"),
  "word-builder": () => import("./hairline/figures/word-builder"),
  "memory-quest": () => import("./hairline/figures/memory-quest"),
  "rapid-match": () => import("./hairline/figures/rapid-match"),
};

type HairlineFigureProps = {
  name: HairlineFigureName;
  label: string;
  className?: string;
};

/**
 * One Hairline line drawing, made with the hairline-create skill. The engine and
 * the figure load on the client only; until then the box holds its 5:4 shape.
 */
export function HairlineFigure({ name, label, className }: HairlineFigureProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;
    let cancelled = false;
    let destroy: (() => void) | undefined;

    Promise.all([import("./hairline/kernel"), figures[name]()]).then(([kernel, module]) => {
      if (cancelled) return;
      const engine = kernel.default as unknown as Engine;
      engine.inject(document);
      const svg = engine.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
      const figure = module.default(engine);
      destroy = figure.mount({ stage, svg, read: { textContent: "" } }, figure.range[1]).destroy;
    });

    return () => {
      cancelled = true;
      destroy?.();
      stage.replaceChildren();
    };
  }, [name]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      data-hairline={name}
      data-hairline-theme="light"
      className={cn("aspect-[5/4]", className)}
    />
  );
}
