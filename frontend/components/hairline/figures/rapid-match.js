/* eslint-disable */
// @ts-nocheck
// Drawn with the hairline-create skill; the figure is a function of the engine so the page can load it on demand.
export default function rapid_match(HL) {
  const hairline = (figure) => figure;
  /**
   * Rapid match: a stopwatch lying on its back, its crown at the far edge, a
   * ring of twelve dots round its dial and one bright hand, still at rest.
   * Three streaks trail behind it on the ground. The nearer the pointer comes the
   * faster the hand goes, on a spring, and the streaks stretch with the rate; when
   * the pointer leaves, the hand slows to a stop. The slider is the top rate, in
   * turns a second.
   *
   * The pattern: dilate time, turned the other way. The world keeps moving, the
   * pointer does not choose a part, it sets a rate, and a spring carries it.
   */
  const {
    Cam, clamp, facing, fit, prism, proj, rings, rrect, seg, unproj, reducedMotion,
    spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
  } = HL;

  const R = 30, H = 10, SLOW = 0, TRAIL = [34, 56, 44], TY = [-17, 3, 22], TX = -38, NEAR = R + 8, FAR = R + 52;

  function mount({ stage, svg, read }, value) {
    const bag = disposer();
    let top = value, deg = -58;

    const C = Cam(45, 0.5, 3.3);
    fit(C, [[TX - 56, -20, 0], [TX - 56, 24, 0], [R, R, 0], [R, -R, 0], [-R, R, 0], [-27, -27, 18], [R, 22, H]], 200, 166);
    const P = proj(C), front = facing(C);

    const g = mk("g", {}, svg);
    const rate = spring(SLOW, { eps: 0.002 });
    const streaks = TRAIL.map((_, k) => mk("path", { class: "nf " + (k === 1 ? "sil" : "lo") }, g));
    let drawn = NaN;
    const trail = (r) => {
      if (r === drawn) return;
      drawn = r;
      const f = 0.22 + 0.78 * clamp((r - SLOW) / (top - SLOW), 0, 1.25);
      streaks.forEach((el, k) => el.setAttribute("d", seg(P(TX, TY[k], 0), P(TX - TRAIL[k] * f, TY[k], 0))));
    };

    // the crown stands out of the far edge; the case is painted over its foot
    const [sr, si] = rings(-30, -30, -20, -20, 4, 1.2), [cr, ci] = rings(-31.5, -31.5, -18.5, -18.5, 6.5, 1.2);
    put(solid(g), prism(P, front, sr, si, 3, 16));
    put(solid(g), prism(P, front, cr, ci, 16, 20));
    // a full round gets more steps than rings() gives it
    put(solid(g), prism(P, front, rrect(-R, -R, R, R, R, 14), rrect(-R + 1.8, -R + 1.8, R - 1.8, R - 1.8, R - 1.8, 14), 0, H));

    // twelve dots on the dial, the quarters brighter
    for (let k = 0; k < 12; k++) {
      const a = (k * Math.PI) / 6;
      place(flatDot(g, C, k % 3 ? 0.9 : 1.2, k % 3 ? "dot off" : "dot m"), P(21 * Math.cos(a), 21 * Math.sin(a), H));
    }
    const hand = mk("path", { class: "nf hi" }, g), hub = flatDot(g, C, 1.6, "dot");
    place(hub, P(0, 0, H));

    const B = register(stage, (dt) => {
      let moving = stepS(rate, dt);
      if (rate.x > 0.001 && !reducedMotion()) { deg += rate.x * 360 * dt; moving = true; }
      const a = (deg * Math.PI) / 180;
      hand.setAttribute("d", seg(P(0, 0, H), P(17 * Math.cos(a), 17 * Math.sin(a), H)));
      trail(rate.x);
      return moving;
    });
    bag.add(B.unregister);

    let over = null;
    function retarget() {
      if (!over) { rate.t = SLOW; read.textContent = "rest"; }
      else {
        const d = Math.hypot(over[0], over[1]), f = clamp(1 - (d - NEAR) / (FAR - NEAR), 0, 1);
        rate.t = SLOW + (top - SLOW) * f;
        read.textContent = rate.t.toFixed(1) + "×";
      }
      B.wake();
    }

    bag.add(pointer(stage, {
      move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
      leave: () => { over = null; retarget(); },
    }));
    bag.add(() => svg.replaceChildren());

    return { set: (v) => { top = v; drawn = NaN; if (over) retarget(); else B.wake(); }, destroy: bag.dispose };
  }

  return hairline({
    name: "rapid-match",
    means: "A stopwatch with a slow hand and streaks behind it: the nearer the pointer, the faster the hand sweeps and the longer the streaks.",
    rules: [3, 4, 7, 8],
    range: [1.2, 2.2, 3.4],
    mount,
  });
}
