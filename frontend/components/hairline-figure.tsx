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

const IDLE_AFTER_USER_MS = 2500;
const SWEEP_PERIOD_S = 9;

/**
 * The figures react to a pointer. To keep them always moving, a virtual pointer
 * drifts back and forth across the stage and is fed in as synthetic pointermove
 * events while the figure is on screen. A real pointer takes over, and autoplay
 * resumes once it has been idle for a moment. Skipped for reduced motion.
 */
function autoplay(stage: HTMLElement, name: string) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};

  // a different phase per figure, so the cards do not move in lockstep
  const phase = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % 100 / 100 * Math.PI * 2;
  let frame = 0;
  let visible = false;
  let userUntil = 0;
  let start = 0;

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    if (now < userUntil || document.hidden) return;
    if (!start) start = now;
    const t = ((now - start) / 1000) * ((Math.PI * 2) / SWEEP_PERIOD_S) + phase;
    const r = stage.getBoundingClientRect();
    stage.dispatchEvent(
      new PointerEvent("pointermove", {
        pointerType: "mouse",
        clientX: r.left + r.width * (0.5 + 0.42 * Math.sin(t)),
        clientY: r.top + r.height * (0.52 + 0.2 * Math.sin(t * 0.43 + 1)),
      }),
    );
  };

  const onUser = (e: Event) => {
    if (e.isTrusted) userUntil = performance.now() + IDLE_AFTER_USER_MS;
  };
  stage.addEventListener("pointermove", onUser);
  stage.addEventListener("pointerdown", onUser);
  stage.addEventListener("pointerleave", onUser);

  const observer = new IntersectionObserver(([entry]) => {
    const next = entry.isIntersecting;
    if (next === visible) return;
    visible = next;
    cancelAnimationFrame(frame);
    if (visible) frame = requestAnimationFrame(tick);
  });
  observer.observe(stage);

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    stage.removeEventListener("pointermove", onUser);
    stage.removeEventListener("pointerdown", onUser);
    stage.removeEventListener("pointerleave", onUser);
  };
}

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
    let stopAutoplay: (() => void) | undefined;

    Promise.all([import("./hairline/kernel"), figures[name]()]).then(([kernel, module]) => {
      if (cancelled) return;
      const engine = kernel.default as unknown as Engine;
      engine.inject(document);
      const svg = engine.mk("svg", { viewBox: "0 0 400 320", "aria-hidden": "true" }, stage);
      const figure = module.default(engine);
      destroy = figure.mount({ stage, svg, read: { textContent: "" } }, figure.range[1]).destroy;
      stopAutoplay = autoplay(stage, name);
    });

    return () => {
      cancelled = true;
      stopAutoplay?.();
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
