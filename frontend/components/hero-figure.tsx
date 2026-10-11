"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "./hero-figure.css";

// viewBox of the drawing, in user units
const VBX = -91.8;
const VBW = 257.8;
const VBH = 279.7;

const ROUTE = "M-38.45 48.2L-53.69 57L83.66 136.3";

const KEY_X = [5.6, 14, 22.4, 30.8, 39.2, 47.6, 56];
const KEY_Y = [6.5, 14.9, 23.3];

// bar order: sound, letters, words, memory, speed
const BAR_LABELS = ["sound", "letters", "words", "memory", "speed"];
const BAR_H = [15, 12, 10, 16, 18];
// the "letters" bar (index 1) starts as the highlighted, tallest one
const BAR_HOT = 1;
const BAR_BASE = 33;
const BAR_HOT_H = 26;

// where each bar's top sits in svg space (for the callout leader)
const BAR_TOPS: [number, number][] = [
  [74.48, 69],
  [88.33, 77],
  [102.19, 85],
  [116.05, 93],
  [129.9, 101],
];
// callout tag: centre x and bottom y in svg space
const CALL = { cx: 108, bottom: 42 };

// the highlight cycles letters, sound, memory, speed, words
const NAMES = [
  "sound: steady",
  "b/d: improving",
  "words: needs practice",
  "memory: building",
  "speed: faster",
];
const SEQ = [1, 0, 3, 4, 2];

// Captions sit next to the object they describe. ax/ay anchor on the object
// (svg units), ox/oy are the gap in screen px so it stays the same at any width.
// mode "l" puts the caption to the left of its anchor, "r" to the right.
const CAPS = [
  { id: "hf-cap1", ax: -7.8, ay: -52.3, ox: 10, oy: 6, mode: "r" },
  { id: "hf-cap2", ax: 7.36, ay: 92.25, ox: -3, oy: 19, mode: "l" },
  { id: "hf-cap3", ax: 83.66, ay: 136.3, ox: -14, oy: 25, mode: "l" },
] as const;

const IDLE = "tap the laptop to try it";

export function HeroFigure({ className }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const svgNode = svgRef.current;
    const statusNode = statusRef.current;
    if (!svgNode || !statusNode) return;
    // rebound so the narrowing survives inside the nested functions below
    const svg: SVGSVGElement = svgNode;
    const status: HTMLParagraphElement = statusNode;

    const q = <T extends Element = SVGElement>(sel: string, ctx: ParentNode = svg) =>
      ctx.querySelector<T>(sel) as T;
    const qa = <T extends Element = SVGElement>(sel: string) =>
      Array.from(svg.querySelectorAll<T>(sel));
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    // the OS preference, or the app's Settings > Reduce motion switch
    const reduced = () =>
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      document.documentElement.hasAttribute("data-reduce-motion");

    let alive = true;

    const play = q<SVGGElement>(".play");
    const letters = q<SVGGElement>(".letters");
    const gb = q<SVGGElement>("#hf-gb");
    const gd = q<SVGGElement>("#hf-gd");
    const dx = Number(letters.getAttribute("data-dx"));
    const blocks = qa<SVGGElement>(".block");
    const labels = [q("#hf-cap1 .lbl"), q("#hf-cap2 .lbl"), q("#hf-cap3 .lbl")];
    const fireWrap = q<SVGGElement>(".fire");
    const fireT = q(".fire-tail");
    const fireC = q(".fire-core");
    const bars = qa<SVGRectElement>(".bar");
    const hot = q<SVGRectElement>("#hf-hot");
    const halo = q<SVGRectElement>("#hf-halo");
    const hint = q<SVGGElement>(".hint");
    const co = q<SVGGElement>("#hf-callout");

    let si = 0;
    let flipped = false;
    let busy = false;

    const unit = () => parseFloat(svg.style.getPropertyValue("--u")) || 0.75;

    // callout tag + leader, sized from the current label scale
    function layout() {
      const u = unit();
      const fs = 12 * u; // matches .tag-txt in the CSS
      const lh = fs * 1.2;
      const text = NAMES[SEQ[si]];
      const t1 = q<SVGTSpanElement>(".t1", co);
      const tx = q<SVGTextElement>(".tag-txt", co);
      t1.textContent = text;
      let bw = 0;
      try {
        bw = tx.getBBox().width;
      } catch {
        /* not rendered yet */
      }
      if (!bw) bw = text.length * 0.6 * fs;
      const w = bw + 12 * u;
      const h = lh + 8 * u;
      // centred over the bar, but kept inside the drawing so long text is not cut off
      const x = Math.max(VBX + 2 * u, Math.min(VBX + VBW - w - 2 * u, CALL.cx - w / 2));
      const y = CALL.bottom - h;
      const tag = q(".tag", co);
      tag.setAttribute("x", x.toFixed(2));
      tag.setAttribute("y", y.toFixed(2));
      tag.setAttribute("width", w.toFixed(2));
      tag.setAttribute("height", h.toFixed(2));
      t1.setAttribute("x", (x + w / 2).toFixed(2));
      t1.setAttribute("y", (y + 4 * u + fs * 0.85).toFixed(2));
      const b = BAR_TOPS[SEQ[si]];
      const ax = Math.max(x + 3 * u, Math.min(x + w - 3 * u, b[0]));
      q(".leader", co).setAttribute(
        "d",
        `M${ax.toFixed(2)} ${CALL.bottom}L${b[0]} ${b[1] - 1.5}`,
      );
      const dot = q(".leader-dot", co);
      dot.setAttribute("cx", String(b[0]));
      dot.setAttribute("cy", String(b[1] - 1.5));
    }

    function setCallout(swap: boolean) {
      layout();
      if (swap && !reduced()) co.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }

    function say(text: string) {
      status.textContent = text;
      if (!reduced()) status.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
    }

    // captions: anchored to their object, text-anchor decides which side they grow to
    function place() {
      const u = unit();
      CAPS.forEach((c) => {
        const g = document.getElementById(c.id);
        if (!g) return;
        const l = q(".lbl", g);
        const s = q(".sub", g);
        const x = c.ax + c.ox * u;
        const y = c.ay + c.oy * u;
        const anchor = c.mode === "l" ? "end" : "start";
        [l, s].forEach((t) => {
          t.setAttribute("x", x.toFixed(2));
          t.setAttribute("text-anchor", anchor);
        });
        l.setAttribute("y", y.toFixed(2));
        s.setAttribute("y", (y + 15 * u).toFixed(2));
      });
    }

    // Keep text about 11px on screen at any size. The figure is letterboxed into
    // its box, so the scale is limited by whichever of width / height is tighter.
    function size() {
      const r = svg.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const s = Math.min(r.width / VBW, r.height / VBH);
      svg.style.setProperty("--u", (1 / s).toFixed(4));
      const drawn = VBW * s;
      svg.classList.toggle("lt400", drawn < 400);
      svg.classList.toggle("lt560", drawn < 560);
      place();
      layout();
    }
    size();
    const ro = new ResizeObserver(size);
    ro.observe(svg);
    // the callout is measured with getBBox, so lay it out again once fonts arrive
    document.fonts?.ready.then(() => {
      if (alive) size();
    });

    // ---- the play action ----
    const lit = (i: number, on = true) => labels[i].classList.toggle("on", on);

    // the highlighted bar is always the tallest; the others keep their own height
    function setHot(i: number) {
      bars.forEach((b, j) => {
        const h = j === i ? BAR_HOT_H : Number(b.getAttribute("data-h"));
        b.setAttribute("height", String(h));
        b.setAttribute("y", String(BAR_BASE - h));
      });
      (["x", "y", "width", "height"] as const).forEach((a) => {
        hot.setAttribute(a, bars[i].getAttribute(a) ?? "");
        halo.setAttribute(a, bars[i].getAttribute(a) ?? "");
      });
    }

    function dismissHint() {
      if (hint.classList.contains("gone")) return;
      hint.classList.add("gone");
      setTimeout(() => hint.setAttribute("display", "none"), 350);
    }

    // b d <-> d b: each glyph slides to the other slot while squashing through zero width
    function flip(still: boolean) {
      const prev = flipped;
      flipped = !flipped;
      const to = [flipped ? dx : 0, flipped ? -dx : 0];
      const from = [prev ? dx : 0, prev ? -dx : 0];
      [gb, gd].forEach((g, k) => {
        g.setAttribute("transform", `translate(${to[k]} 0)`);
        const inner = g.firstElementChild as SVGGElement;
        const d = to[k] - from[k];
        if (still) {
          inner.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 });
        } else {
          inner.animate(
            [
              { transform: `translateX(${-d}px) scaleX(1)` },
              { transform: `translateX(${-d / 2}px) scaleX(.04)`, offset: 0.5 },
              { transform: "translateX(0px) scaleX(1)" },
            ],
            { duration: 400, easing: "ease-in-out" },
          );
        }
      });
    }

    function hop() {
      // DOM order is far-to-near; hop 1, 2, 3 left to right
      blocks.forEach((b, i) => {
        b.animate(
          [
            { transform: "translateY(0)" },
            { transform: "translateY(-7px)", offset: 0.45 },
            { transform: "translateY(0)" },
          ],
          { duration: 340, delay: (blocks.length - 1 - i) * 80, easing: "ease-out" },
        );
      });
    }

    function fire() {
      fireWrap.style.opacity = "1";
      const o: KeyframeAnimationOptions = { duration: 1200, easing: "linear" };
      fireT.animate([{ strokeDashoffset: 260 }, { strokeDashoffset: -1000 }], o);
      return fireC
        .animate([{ strokeDashoffset: 70 }, { strokeDashoffset: -1190 }], o)
        .finished.then(() => {
          fireWrap.style.opacity = "0";
        });
    }

    function regrow() {
      bars.forEach((b, i) => {
        const kf = [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }];
        const o: KeyframeAnimationOptions = {
          duration: 300,
          delay: i * 55,
          easing: "cubic-bezier(.2,.8,.2,1)",
          fill: "backwards",
        };
        b.animate(kf, o);
        if (i === SEQ[si]) {
          hot.animate(kf, o);
          halo.animate(kf, o);
        }
      });
    }

    async function run() {
      if (busy) return;
      busy = true;
      dismissHint();
      const still = reduced();
      svg.classList.add("busy");
      lit(0);
      say("a child plays a 5 minute game");
      flip(still);
      si = (si + 1) % SEQ.length;
      if (still) {
        await wait(300);
        lit(1);
        say("response time and accuracy are recorded");
        await wait(300);
        lit(1, false);
        lit(2);
        say("parents see where practice helps");
        setHot(SEQ[si]);
        [hot, halo].forEach((e) => e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150 }));
        setCallout(false);
      } else {
        hop();
        await wait(560);
        if (!alive) return;
        lit(1);
        say("response time and accuracy are recorded");
        await fire();
        if (!alive) return;
        lit(1, false);
        lit(2);
        say("parents see where practice helps");
        setHot(SEQ[si]);
        regrow();
        setCallout(true);
      }
      await wait(2000);
      if (!alive) return;
      labels.forEach((_, i) => lit(i, false));
      flip(still); // back to "b d": that is the resting state
      say(IDLE);
      await wait(still ? 160 : 420);
      if (!alive) return;
      svg.classList.remove("busy");
      busy = false;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        void run();
      }
    };
    const onClick = () => void run();
    play.addEventListener("click", onClick);
    play.addEventListener("keydown", onKey);

    return () => {
      alive = false;
      ro.disconnect();
      play.removeEventListener("click", onClick);
      play.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className={cn("hero-fig flex flex-col", className)}>
      <div className="relative min-h-0 flex-1">
        <svg
          ref={svgRef}
          className="lt400 lt560"
          viewBox="-91.8 -95.2 257.8 279.7"
          xmlns="http://www.w3.org/2000/svg"
          role="group"
          aria-labelledby="hf-title hf-desc"
        >
          <title id="hf-title">How Opacity works</title>
          <desc id="hf-desc">
            A child plays a letter game on a laptop; the results flow along a line to a parent
            dashboard where one skill is highlighted.
          </desc>
          <defs>
            <filter id="hf-glow" filterUnits="userSpaceOnUse" x="-111.8" y="-115.2" width="297.8" height="319.7">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hf-soft" filterUnits="userSpaceOnUse" x="-111.8" y="-115.2" width="297.8" height="319.7">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hf-bloom" filterUnits="userSpaceOnUse" x="-111.8" y="-115.2" width="297.8" height="319.7">
              <feGaussianBlur stdDeviation="4.5" />
            </filter>
          </defs>

          {/* play station: the laptop and its three blocks are one tap target */}
          <g
            className="play"
            role="button"
            tabIndex={0}
            aria-label="Play the demo: letters flip, data flows, insight appears"
          >
            <polygon
              className="focus-ring"
              points="45.47,19.25 49.05,22.35 50.31,26 49.05,29.65 45.47,32.75 -2.17,60.25 -7.53,62.32 -13.86,63.05 -20.18,62.32 -25.55,60.25 -59.32,40.75 -62.91,37.65 -64.17,34 -62.91,30.35 -59.32,27.25 -11.69,-0.25 -6.33,-2.32 0,-3.05 6.33,-2.32 11.69,-0.25"
            />
            <g className="hint">
              <polygon
                className="hint-ring"
                points="49.36,18.5 53.35,21.94 54.74,26 53.35,30.06 49.36,33.5 -0.87,62.5 -6.83,64.8 -13.86,65.61 -20.89,64.8 -26.85,62.5 -63.22,41.5 -67.2,38.06 -68.6,34 -67.2,29.94 -63.22,26.5 -12.99,-2.5 -7.03,-4.8 0,-5.61 7.03,-4.8 12.99,-2.5"
              />
            </g>

            <g className="laptop">
              <polygon
                className="side"
                points="-56.35,31 -55.89,29.65 -54.56,28.5 -4.33,-0.5 -2.34,-1.27 0,-1.54 2.34,-1.27 4.33,-0.5 40.7,20.5 42.03,21.65 42.5,23 42.5,26 42.03,27.35 40.7,28.5 -9.53,57.5 -11.51,58.27 -13.86,58.54 -16.2,58.27 -18.19,57.5 -54.56,36.5 -55.89,35.35 -56.35,34"
              />
              <polygon
                className="top"
                points="40.7,20.5 42.03,21.65 42.5,23 42.03,24.35 40.7,25.5 -9.53,54.5 -11.51,55.27 -13.86,55.54 -16.2,55.27 -18.19,54.5 -54.56,33.5 -55.89,32.35 -56.35,31 -55.89,29.65 -54.56,28.5 -4.33,-0.5 -2.34,-1.27 0,-1.54 2.34,-1.27 4.33,-0.5"
              />
              <g transform="matrix(-0.86603 0.5 0.86603 0.5 0 -3)">
                {KEY_Y.flatMap((y) =>
                  KEY_X.map((x) => (
                    <rect key={`${x}-${y}`} className="key" x={x} y={y} width={6.4} height={6.4} rx={1.4} />
                  )),
                )}
                <rect className="key" x={14} y={31.7} width={40} height={6.4} rx={1.4} />
                <rect className="key" x={22} y={40.7} width={24} height={7} rx={2} />
              </g>
              <polygon className="side" points="2.6,-1.5 -56.29,32.5 -71.14,-40.07 -12.25,-74.07" />
              <polygon className="side" points="-56.29,32.5 -58.89,31 -73.74,-41.57 -71.14,-40.07" />
              <polygon className="top" points="-14.85,-75.57 -12.25,-74.07 -71.14,-40.07 -73.74,-41.57" />
              <g filter="url(#hf-soft)" pointerEvents="none">
                <g transform="matrix(0.86603 -0.5 0.22414 1.09534 -71.14 -40.07)">
                  <rect className="scr-glow" x={3.5} y={3.5} width={61} height={59.26} rx={3} />
                </g>
              </g>
              <g transform="matrix(0.86603 -0.5 0.22414 1.09534 -71.14 -40.07)">
                <rect className="scr-edge" x={3.5} y={3.5} width={61} height={59.26} rx={3} />
              </g>
              <g transform="matrix(0.86603 -0.5 0.22414 1.09534 -71.14 -40.07)">
                <g className="letters" data-dx="21.8">
                  <g className="glyph" id="hf-gb">
                    <g className="gi">
                      <path d="M14.7 15.67V42.27" />
                      <circle cx={23.1} cy={33.87} r={8.4} />
                    </g>
                  </g>
                  <g className="glyph" id="hf-gd">
                    <g className="gi">
                      <path d="M53.3 15.67V42.27" />
                      <circle cx={44.9} cy={33.87} r={8.4} />
                    </g>
                  </g>
                </g>
                <text className="scr-txt" x={34} y={52.28} textAnchor="middle">
                  which one is b?
                </text>
              </g>
              <line className="hinge" x1={-0.69} y1={0.6} x2={-52.65} y2={30.6} />
            </g>

            <g className="block">
              <polygon className="side" points="70.89,45.94 59,50.93 59,38.93 70.89,33.94" />
              <polygon className="side" points="59,50.93 50.36,44.06 50.36,32.06 59,38.93" />
              <polygon className="top" points="62.25,27.07 70.89,33.94 59,38.93 50.36,32.06" />
              <g transform="matrix(0.99084 -0.41563 0 1 59 38.93)">
                <circle className="pip" cx={2.4} cy={6} r={1.6} />
                <circle className="pip" cx={6} cy={6} r={1.6} />
                <circle className="pip" cx={9.6} cy={6} r={1.6} />
              </g>
            </g>
            <g className="block">
              <polygon className="side" points="46.77,59 36.37,65 36.37,53 46.77,47" />
              <polygon className="side" points="36.37,65 25.98,59 25.98,47 36.37,53" />
              <polygon className="top" points="36.37,41 46.77,47 36.37,53 25.98,47" />
              <g transform="matrix(0.86603 -0.5 0 1 36.37 53)">
                <circle className="pip" cx={3.84} cy={6} r={1.6} />
                <circle className="pip" cx={8.16} cy={6} r={1.6} />
              </g>
            </g>
            <g className="block">
              <polygon className="side" points="22.52,73 12.12,79 12.12,67 22.52,61" />
              <polygon className="side" points="12.12,79 1.73,73 1.73,61 12.12,67" />
              <polygon className="top" points="12.12,55 22.52,61 12.12,67 1.73,61" />
              <g transform="matrix(0.86603 -0.5 0 1 12.12 67)">
                <circle className="pip" cx={6} cy={6} r={1.6} />
              </g>
            </g>
          </g>

          {/* data path */}
          <g className="data">
            <path className="wire" d={ROUTE} />
            <g filter="url(#hf-glow)">
              <path className="pulse p1-tail" pathLength={1000} d={ROUTE} />
            </g>
            <path className="pulse p1-core" pathLength={1000} d={ROUTE} />
            <g filter="url(#hf-glow)">
              <path className="pulse p2-tail" pathLength={1000} d={ROUTE} />
            </g>
            <path className="pulse p2-core" pathLength={1000} d={ROUTE} />
            <g className="fire" opacity={0}>
              <g filter="url(#hf-glow)">
                <path className="pulse fire-tail" pathLength={1000} d={ROUTE} />
              </g>
              <path className="pulse fire-core" pathLength={1000} d={ROUTE} />
            </g>
            <circle className="node" cx={-38.45} cy={48.2} r={2.4} />
            <circle className="node" cx={83.66} cy={136.3} r={2.4} />
            <circle className="node-dot" cx={83.66} cy={136.3} r={0.95} />
          </g>

          {/* dashboard monitor */}
          <g className="monitor">
            <polygon
              className="side"
              points="81.34,139 81.81,137.65 83.14,136.5 95.26,129.5 97.25,128.73 99.59,128.46 101.94,128.73 103.92,129.5 124.71,141.5 126.04,142.65 126.5,144 126.5,146.5 126.04,147.85 124.71,149 112.58,156 110.6,156.77 108.25,157.04 105.91,156.77 103.92,156 83.14,144 81.81,142.85 81.34,141.5"
            />
            <polygon
              className="top"
              points="124.71,141.5 126.04,142.65 126.5,144 126.04,145.35 124.71,146.5 112.58,153.5 110.6,154.27 108.25,154.54 105.91,154.27 103.92,153.5 83.14,141.5 81.81,140.35 81.34,139 81.81,137.65 83.14,136.5 95.26,129.5 97.25,128.73 99.59,128.46 101.94,128.73 103.92,129.5"
            />
            <polygon className="side" points="108.25,142 104.79,144 104.79,126.5 108.25,124.5" />
            <polygon className="side" points="104.79,144 99.59,141 99.59,123.5 104.79,126.5" />
            <polygon className="top" points="103.06,121.5 108.25,124.5 104.79,126.5 99.59,123.5" />
            <polygon className="side" points="142.03,144 138.56,146 138.56,99 142.03,97" />
            <polygon className="side" points="138.56,146 65.82,104 65.82,57 138.56,99" />
            <polygon className="top" points="69.28,55 142.03,97 138.56,99 65.82,57" />
            <g filter="url(#hf-bloom)" pointerEvents="none">
              <g transform="matrix(0.86603 0.5 0 1 65.82 57)">
                <rect
                  id="hf-halo"
                  className="bar-halo"
                  x={21.5}
                  y={BAR_BASE - BAR_HOT_H}
                  width={9}
                  height={BAR_HOT_H}
                />
              </g>
            </g>
            <g transform="matrix(0.86603 0.5 0 1 65.82 57)">
              <line className="base" x1={3.5} y1={BAR_BASE} x2={80.5} y2={BAR_BASE} />
              {BAR_H.map((h, i) => (
                <rect
                  key={i}
                  className="bar"
                  data-i={i}
                  data-h={h}
                  x={5.5 + 16 * i}
                  y={i === BAR_HOT ? BAR_BASE - BAR_HOT_H : BAR_BASE - h}
                  width={9}
                  height={i === BAR_HOT ? BAR_HOT_H : h}
                />
              ))}
              {BAR_LABELS.map((name, i) => (
                <text key={name} className="bar-lbl" x={10 + 16 * i} y={40} textAnchor="middle">
                  {name}
                </text>
              ))}
            </g>
            <g filter="url(#hf-glow)">
              <g transform="matrix(0.86603 0.5 0 1 65.82 57)">
                <rect
                  id="hf-hot"
                  className="bar-hot"
                  x={21.5}
                  y={BAR_BASE - BAR_HOT_H}
                  width={9}
                  height={BAR_HOT_H}
                />
              </g>
            </g>
          </g>

          {/* captions: positions are set from the effect so they track the label scale */}
          <g className="labels">
            <g id="hf-cap1">
              <text className="lbl" x={-0.3} y={-49.3}>1 play</text>
              <text className="sub" x={-0.3} y={-39.9}>5 short games</text>
            </g>
            <g id="hf-cap2">
              <text className="lbl" x={5.1} y={104.3} textAnchor="end">2 measure</text>
              <text className="sub" x={5.1} y={113.6} textAnchor="end">speed + accuracy</text>
            </g>
            <g id="hf-cap3">
              <text className="lbl" x={73.2} y={152.8} textAnchor="end">3 insight</text>
              <text className="sub" x={73.2} y={162.2} textAnchor="end">skills at a glance</text>
            </g>
          </g>

          {/* callout on the highlighted bar; text and geometry are set from the effect */}
          <g id="hf-callout" className="callout">
            <path className="leader" d="" />
            <circle className="leader-dot" r={1.8} />
            <rect className="tag" rx={3} />
            <text className="tag-txt" textAnchor="middle">
              <tspan x={108} className="t1" />
            </text>
          </g>
        </svg>
      </div>
      <p ref={statusRef} className="hero-fig-status" aria-live="polite">
        {IDLE}
      </p>
    </div>
  );
}
