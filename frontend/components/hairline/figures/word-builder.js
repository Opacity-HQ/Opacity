/* eslint-disable */
// @ts-nocheck
// Drawn with the hairline-create skill; the figure is a function of the engine so the page can load it on demand.
export default function word_builder(HL) {
  const hairline = (figure) => figure;
  /**
   * Word builder: a tray with three slots and a block for each, punched with
   * one, two and three dots in the order of the word. At rest the middle block
   * hangs above its slot on dashed drops, waiting to be set down. The block
   * under the pointer lifts out of its slot and takes the bright stroke, and the
   * one that was up drops into place, staggered outwards from the pointer. The
   * slider is how high a block lifts.
   *
   * The pattern: discrete items. Tweens, a stagger by distance, identity carried
   * by dots, and a hit test on the slots, which never move.
   */
  const {
    Cam, facing, fit, extremes, proj, prism, rings, rrect, seg, poly, unproj, clamp,
    tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
  } = HL;

  const N = 3, PITCH = 32, SZ = 22, BH = 20, STEP = 60, REST = 1;
  const BOX = [-8, -22, 2 * PITCH + SZ + 8, 22];
  const cx = (i) => 3 + i * PITCH + SZ / 2;

  function mount({ stage, svg, read }, value) {
    const bag = disposer();
    let up = value;

    const C = Cam(45, 0.5, 2.7);
    fit(C, [[BOX[0], BOX[1], -3], [BOX[2], BOX[3], -3], [BOX[2], BOX[1], -3], [BOX[0], BOX[3], -3], [cx(1), 0, BH + 26 + 4]], 200, 166);
    const P = proj(C), front = facing(C);

    const g = mk("g", {}, svg);
    const [br, bi] = rings(BOX[0], BOX[1], BOX[2], BOX[3], 8, 2);
    put(solid(g), prism(P, front, br, bi, -3, 0));
    for (let i = 0; i < N; i++) mk("path", { d: poly(rrect(cx(i) - SZ / 2 - 2, -13, cx(i) + SZ / 2 + 2, 13, 5, 4).map((q) => P(q.u, q.v, 0))), class: "nf lo" }, g);

    // back to front along x: each block has its guides (behind it), its body and its dot code (on top)
    const blocks = [];
    for (let i = 0; i < N; i++) {
      const [ring, inner] = rings(cx(i) - SZ / 2, -SZ / 2, cx(i) + SZ / 2, SZ / 2, 4.5, 1.6);
      const grp = mk("g", {}, g);
      const guides = mk("path", { class: "nf dash" }, grp);
      const body = solid(grp);
      const dots = [];
      for (let k = 0; k <= i; k++) dots.push(flatDot(grp, C, 1.5, "dot m"));
      blocks.push({ ring, inner, guides, body, dots, ends: extremes(P, ring), z: tween(i === REST ? up : 0) });
    }

    function draw(b, i, z) {
      put(b.body, prism(P, front, b.ring, b.inner, z, z + BH));
      b.guides.setAttribute("d", z < 1 ? "" : b.ends.map((q) => seg(P(q.u, q.v, 0), P(q.u, q.v, z))).join(""));
      b.dots.forEach((el, k) => place(el, P(cx(i), (k - i / 2) * 6.5, z + BH)));
    }

    const B = register(stage, (_dt, now) => {
      let moving = false;
      blocks.forEach((b, i) => { draw(b, i, tval(b.z, now)); if (!tdone(b.z, now)) moving = true; });
      return moving;
    });
    bag.add(B.unregister);

    let act = -2;
    /** Lifts block a out of its slot (-1 is rest, which holds the middle one up) and sets the others down, staggered from it. */
    function pick(a, force) {
      if (a === act && !force) return;
      const now = performance.now(), from = a < 0 ? (act < 0 ? REST : act) : a, hold = a < 0 ? REST : a;
      act = a;
      blocks.forEach((b, i) => {
        tset(b.z, i === hold ? up : 0, now, i === hold ? 0 : Math.abs(i - from) * STEP);
        b.body.sil.classList.toggle("hi", i === hold);
        b.dots.forEach((el) => el.setAttribute("class", i === hold ? "dot" : "dot m"));
      });
      read.textContent = a < 0 ? "rest" : "slot " + (a + 1);
      B.wake();
    }
    pick(-1);

    bag.add(pointer(stage, {
      move: (p) => {
        const [x, y] = unproj(C, p[0], p[1], 0);
        pick(x < BOX[0] || x > BOX[2] || Math.abs(y) > 24 ? -1 : clamp(Math.floor((x + 2) / PITCH), 0, N - 1));
      },
      leave: () => pick(-1),
    }));
    bag.add(() => svg.replaceChildren());

    return { set: (v) => { up = v; pick(act, true); }, destroy: bag.dispose };
  }

  return hairline({
    name: "word-builder",
    means: "Three blocks with one, two and three dots wait in their slots: the one under the pointer lifts out, and the last one drops back.",
    rules: [1, 2, 4, 6],
    range: [12, 20, 28],
    mount,
  });
}
