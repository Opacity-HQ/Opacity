/* eslint-disable */
// @ts-nocheck
// Drawn with the hairline-create skill; the figure is a function of the engine so the page can load it on demand.
export default function letter_detective(HL) {
  const hairline = (figure) => figure;
  /**
   * Letter detective: two letter blocks, b and d, mirror images of one another
   * about a dashed axis on a slab. A magnifying glass hangs over the pair and
   * follows the pointer on a spring. The block under the glass lifts and takes
   * the bright stroke; the other lies still. The glass has a dashed ring on the
   * slab below it, and the block the glass is not on is the one it is not
   * looking at. The slider is how far the block lifts.
   *
   * The pattern: one of many, with a continuous follower. A tween picks, a
   * spring follows, and the hit test reads the blocks' resting tops.
   */
  const {
    Cam, facing, fit, hull, poly, prism, proj, rings, rrect, ringAt, seg, unproj, clamp,
    tdone, tset, tval, tween, spring, stepS, disposer, mk, pointer, put, register, solid,
  } = HL;

  const H = 8, AX = 40, LZ = 30, LR = 14, HL_LEN = 22, DIR = [0.2, -0.98], BOX = [-6, -22, 86, 24];

  /** A letter: its stem and its bowl, as footprints. The d is the b mirrored about the axis. */
  const parts = (mirror) => {
    const mx = (x0, x1) => (mirror ? [2 * AX - x1, 2 * AX - x0] : [x0, x1]);
    const [s0, s1] = mx(6, 13), [b0, b1] = mx(12, 30);
    return [rings(s0, -14, s1, 16, 2.4, 1), rings(b0, -2, b1, 16, 9, 1.4)];
  };

  function mount({ stage, svg, read }, value) {
    const bag = disposer();
    let up = value;

    const C = Cam(45, 0.5, 2.7);
    fit(C, [[BOX[0], BOX[1], -3], [BOX[2], BOX[3], -3], [BOX[2], BOX[1], -3], [BOX[0], BOX[3], LZ], [78, -46, LZ], [4, -46, LZ]], 200, 166);
    const P = proj(C), front = facing(C);

    const g = mk("g", {}, svg);
    const [br, bi] = rings(BOX[0], BOX[1], BOX[2], BOX[3], 8, 2);
    put(solid(g), prism(P, front, br, bi, -3, 0));
    mk("path", { d: seg(P(AX, BOX[1] + 3, 0), P(AX, BOX[3] - 3, 0)), class: "nf dash" }, g);
    const ground = mk("path", { class: "nf dash" }, g);

    // two blocks, each a stem and a bowl that lift together
    const blocks = [false, true].map((mirror) => {
      const els = parts(mirror).map(([ring, inner]) => ({ ring, inner, s: solid(g) }));
      if (mirror) els.reverse(); // the d's bowl is the farther part
      return { els, z: tween(0) };
    });

    const lens = { x: spring(AX), y: spring(-2) };
    const glass = mk("path", { class: "nf hi" }, g), rim = mk("path", { class: "nf lo" }, g), grip = mk("path", { class: "sil" }, g);
    const disc = (r, n) => rrect(-r, -r, r, r, r, n);
    const at = (ring, x, y) => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));

    const B = register(stage, (dt, now) => {
      let moving = false;
      for (const b of blocks) {
        const z = tval(b.z, now);
        b.els.forEach((e) => put(e.s, prism(P, front, e.ring, e.inner, z, H + z)));
        if (!tdone(b.z, now)) moving = true;
      }
      if (stepS(lens.x, dt)) moving = true;
      if (stepS(lens.y, dt)) moving = true;
      const x = lens.x.x, y = lens.y.x;
      glass.setAttribute("d", poly(ringAt(P, at(disc(LR, 14), x, y), LZ)));
      rim.setAttribute("d", poly(ringAt(P, at(disc(LR - 2.4, 14), x, y), LZ)));
      ground.setAttribute("d", poly(ringAt(P, at(disc(LR, 14), x, y), 0)));
      const a = [x + DIR[0] * LR, y + DIR[1] * LR], b = [a[0] + DIR[0] * HL_LEN, a[1] + DIR[1] * HL_LEN];
      grip.setAttribute("d", poly(hull(ringAt(P, at(disc(2.4, 8), a[0], a[1]), LZ).concat(ringAt(P, at(disc(2.4, 8), b[0], b[1]), LZ)))));
      return moving;
    });
    bag.add(B.unregister);

    let act = -2;
    /** Lifts block a (0 is the b, 1 the d) and lets the other lie; -1 is rest. The stagger would be nothing to see between two. */
    function pick(a) {
      if (a === act) return;
      act = a;
      const now = performance.now();
      blocks.forEach((b, i) => {
        tset(b.z, a === i ? up : 0, now, 0);
        b.els.forEach((e) => e.s.sil.classList.toggle("hi", a === i));
      });
      glass.setAttribute("class", a < 0 ? "nf hi" : "nf sil");
      read.textContent = a < 0 ? "rest" : a ? "d" : "b";
      B.wake();
    }
    pick(-1);

    bag.add(pointer(stage, {
      move: (p) => {
        // the block is picked from its resting top, the glass is put where the pointer is on screen
        const [tx, ty] = unproj(C, p[0], p[1], H), [gx, gy] = unproj(C, p[0], p[1], LZ);
        pick(tx < BOX[0] || tx > BOX[2] || ty < BOX[1] || ty > BOX[3] ? -1 : tx < AX ? 0 : 1);
        lens.x.t = clamp(gx, 4, 76); lens.y.t = clamp(gy, -8, 14);
        B.wake();
      },
      leave: () => { pick(-1); lens.x.t = AX; lens.y.t = -2; B.wake(); },
    }));
    bag.add(() => svg.replaceChildren());

    return {
      set: (v) => {
        up = v;
        if (act >= 0) tset(blocks[act].z, up, performance.now(), 0);
        B.wake();
      },
      destroy: bag.dispose,
    };
  }

  return hairline({
    name: "letter-detective",
    means: "A b and a d lie as mirror images, and a magnifying glass follows the pointer: the block under it lifts.",
    rules: [1, 4, 5, 8],
    range: [4, 8, 14],
    mount,
  });
}
