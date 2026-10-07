/* eslint-disable */
// @ts-nocheck
// Drawn with the hairline-create skill; the figure is a function of the engine so the page can load it on demand.
export default function sound_match(HL) {
  const hairline = (figure) => figure;
  /**
   * Sound match: a speaker at one end of a runway, a tile with a dot code at the
   * other. Six waves lie on the runway between them. The pointer's place along
   * the runway sets how far the sound has travelled: the waves it has reached
   * fan open, the last one takes the bright stroke, and when the sound reaches
   * the tile the tile lifts and takes it. The slider is how far a wave fans open.
   *
   * The pattern: discrete items. Tweens, a stagger by distance from the speaker,
   * and a hit test on the ground plane, which never moves.
   */
  const {
    Cam, clamp, facing, fit, open, prism, proj, rings, unproj, circ, poly,
    tdone, tset, tval, tween, spring, stepS, disposer, flatDot, mk, place, pointer, put, register, solid,
  } = HL;

  const N = 6, CX = 16, R0 = 20, DR = 12, STEP = 55, REST = 2, SHUT = 5;
  const TX0 = 100, TX1 = 134, TY = 17, LIFT = 7, SZ = 24;

  function mount({ stage, svg, read }, value) {
    const bag = disposer();
    let fan = value;

    const C = Cam(45, 0.5, 1.9);
    fit(C, [[-12, -26, -4], [TX1 + 8, 26, -4], [TX1 + 8, -26, LIFT + 3], [-12, 26, SZ]], 200, 166);
    const P = proj(C), front = facing(C);

    const g = mk("g", {}, svg);
    const [br, bi] = rings(-12, -26, TX1 + 8, 26, 9, 2);
    put(solid(g), prism(P, front, br, bi, -4, 0));

    // the waves lie on the runway; each is an arc whose span grows when the sound reaches it
    const waves = [];
    for (let i = 0; i < N; i++) waves.push({ r: R0 + DR * i, a: tween(i < REST ? fan : SHUT), el: mk("path", { class: "nf lo" }, g), drawn: NaN });
    // a wave is an arc of its radius, y apart by +-w: w is how far it has fanned open
    const arc = (r, wide) => {
      const w = Math.min(wide, r * 0.9);
      const pts = [];
      for (let k = 0; k <= 12; k++) { const y = -w + (2 * w * k) / 12; pts.push(P(CX + Math.sqrt(r * r - y * y), y, 0)); }
      return open(pts);
    };

    // the speaker: a cabinet with a cone set into its face, and a dot at the cone's heart
    const sp = solid(g);
    const [sr, si] = rings(-12, -14, CX - 2, 14, 4, 1.6);
    put(sp, prism(P, front, sr, si, 0, SZ));
    const face = (R, cls) => mk("path", { d: poly(circ(R, 16).map((q) => P(CX - 2, q.u * 1, SZ / 2 + q.v))), class: cls }, g);
    face(9.5, "nf"); face(5.5, "nf lo");
    place(flatDot(g, C, 1.1, "dot m"), P(CX - 2, 0, SZ / 2));

    // the tile: a thin plate with a 2 × 2 dot code, lifted by its own spring
    const lift = spring(0, { eps: 0.02 });
    const tile = solid(g);
    const [tr, ti] = rings(TX0, -TY, TX1, TY, 4, 1.4);
    const code = [0, 1, 2, 3].map((k) => flatDot(g, C, 1.2, k === 0 ? "dot m" : "dot off"));
    const dotAt = (k, z) => P(TX0 + 12 + (k % 2) * 10, -4.5 + Math.floor(k / 2) * 9, z);

    const B = register(stage, (dt, now) => {
      let moving = false;
      waves.forEach((w) => {
        const a = tval(w.a, now);
        if (a !== w.drawn) { w.drawn = a; w.el.setAttribute("d", arc(w.r, a)); }
        if (!tdone(w.a, now)) moving = true;
      });
      if (stepS(lift, dt)) moving = true;
      const z = lift.x;
      put(tile, prism(P, front, tr, ti, 0, 2.6 + z));
      code.forEach((el, k) => place(el, dotAt(k, 2.6 + z)));
      return moving;
    });
    bag.add(B.unregister);

    let act = -2;
    /** The sound has reached the first a waves; a = N + 1 means it has reached the tile, and -1 is rest. */
    function setReach(a, force) {
      if (a === act && !force) return;
      const now = performance.now(), n = a < 0 ? REST : Math.min(a, N), on = a === N + 1;
      act = a;
      waves.forEach((w, i) => {
        tset(w.a, i < n ? fan : SHUT, now, Math.abs(i - (n - 1)) * STEP);
        w.el.setAttribute("class", "nf " + (i === n - 1 && !on ? "hi" : i < n ? "sil" : "lo"));
      });
      lift.t = on ? LIFT : 0;
      tile.sil.classList.toggle("hi", on);
      code[0].setAttribute("class", on ? "dot" : "dot m");
      read.textContent = a < 0 ? "rest" : on ? "tile" : "wave " + a;
      B.wake();
    }
    setReach(-1);

    bag.add(pointer(stage, {
      move: (p) => {
        const [x, y] = unproj(C, p[0], p[1], 0);
        if (y < -30 || y > 30) return setReach(-1);
        setReach(x > TX0 - 6 ? N + 1 : clamp(Math.round((x - CX - R0) / DR) + 1, 1, N));
      },
      leave: () => setReach(-1),
    }));
    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => {
        fan = v;
        setReach(act, true);
      },
      destroy: bag.dispose,
    };
  }

  return hairline({
    name: "sound-match",
    means: "A speaker sends waves down a runway to a tile with a dot code: the pointer sets how far the sound has gone.",
    rules: [1, 2, 4, 10],
    range: [14, 20, 24],
    mount,
  });
}
