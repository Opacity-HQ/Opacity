/* eslint-disable */
// @ts-nocheck
// Drawn with the hairline-create skill; the figure is a function of the engine so the page can load it on demand.
export default function memory_quest(HL) {
  const hairline = (figure) => figure;
  /**
   * Memory quest: six cards in two rows of three on a slab, face down, each with
   * a border on its back. One lies face up, showing a code of lit dots. The card
   * under the pointer turns over about its own axis and shows its code; the one
   * that was open turns back, staggered by how many cards away it is. The slider
   * is that stagger, in ms.
   *
   * The pattern: discrete items. Tweens for the turn, a stagger by distance, a
   * code of dots for identity, and a hit test on the resting footprints.
   */
  const {
    Cam, facing, fit, proj, prism, rings, rrect, poly, unproj, clamp,
    tdone, tset, tval, tween, disposer, flatDot, mk, place, pointer, put, register, solid,
  } = HL;

  const COLS = 3, ROWS = 2, N = COLS * ROWS, W = 24, D = 28, PX = 32, PY = 36, TK = 1.6, REST = 1;
  const CODES = [0b100011, 0b011100, 0b101010, 0b010101, 0b110001, 0b001110];
  const BOX = [-9, -37, 93, 37];
  const cxOf = (i) => (i % COLS) * PX + 8, cyOf = (i) => (Math.floor(i / COLS) - 0.5) * PY;

  function mount({ stage, svg, read }, value) {
    const bag = disposer();
    let stag = value;

    const C = Cam(45, 0.5, 2.4);
    fit(C, [[BOX[0], BOX[1], -3], [BOX[2], BOX[3], -3], [BOX[2], BOX[1], -3], [BOX[0], BOX[3], -3], [BOX[2], BOX[1], W + 7], [BOX[0], BOX[3], 7]], 200, 166);
    const P = proj(C), front = facing(C);

    const g = mk("g", {}, svg);
    const [br, bi] = rings(BOX[0], BOX[1], BOX[2], BOX[3], 8, 2);
    put(solid(g), prism(P, front, br, bi, -3, 0));

    const shape = rrect(-W / 2, -D / 2, W / 2, D / 2, 3.4, 3), edge = rrect(-W / 2 + 3, -D / 2 + 3, W / 2 - 3, D / 2 - 3, 1.6, 2);
    const slots = [[-5, -8], [5, -8], [-5, 0], [5, 0], [-5, 8], [5, 8]];

    // back to front: ascending x + y
    const order = [...Array(N).keys()].sort((a, b) => cxOf(a) + cyOf(a) - cxOf(b) - cyOf(b));
    const cards = [];
    for (const i of order) {
      const grp = mk("g", {}, g);
      const under = mk("path", { class: "lo" }, grp), top = mk("path", { class: "sil" }, grp), border = mk("path", { class: "nf lo" }, grp);
      const dots = slots.map((_, k) => {
        const el = flatDot(grp, C, 1.2, CODES[i] >> k & 1 ? "dot m" : "dot off");
        return { el, rx: el.getAttribute("rx"), ry: el.getAttribute("ry"), lit: !!(CODES[i] >> k & 1) };
      });
      cards[i] = { top, under, border, dots, a: tween(i === REST ? 180 : 0) };
    }

    /** A point of card i turned by th degrees: u across it, v along it, lifted off its face by off. */
    function draw(i, th) {
      const c = cards[i], t = (th * Math.PI) / 180, s = Math.sin(t), k = Math.cos(t), sg = k >= 0 ? 1 : -1;
      const w = (u, v, off) => P(cxOf(i) + u * k - off * sg * s, cyOf(i) + v, (W / 2 + u) * s + off * sg * k + 0.3 + (7 * th) / 180);
      c.under.setAttribute("d", poly(shape.map((q) => w(q.u, q.v, 0))));
      c.top.setAttribute("d", poly(shape.map((q) => w(q.u, q.v, TK))));
      const faceUp = th > 90;
      c.border.setAttribute("d", faceUp ? "" : poly(edge.map((q) => w(q.u, q.v, TK))));
      c.dots.forEach((d, n) => {
        d.el.setAttribute("rx", faceUp ? d.rx : "0"); d.el.setAttribute("ry", faceUp ? d.ry : "0");
        place(d.el, w(slots[n][0], slots[n][1], TK));
      });
    }

    const B = register(stage, (_dt, now) => {
      let moving = false;
      cards.forEach((c, i) => { draw(i, tval(c.a, now)); if (!tdone(c.a, now)) moving = true; });
      return moving;
    });
    bag.add(B.unregister);

    let act = -2, was = REST;
    /** Turns card a face up and the one that was up face down, staggered by the cards between; -1 is rest, which holds one card up. */
    function pick(a, force) {
      if (a === act && !force) return;
      const now = performance.now(), hold = a < 0 ? REST : a, from = a < 0 ? was : a;
      act = a; was = hold;
      const dist = (i) => Math.abs((i % COLS) - (from % COLS)) + Math.abs(Math.floor(i / COLS) - Math.floor(from / COLS));
      cards.forEach((c, i) => {
        tset(c.a, i === hold ? 180 : 0, now, i === hold ? 0 : dist(i) * stag);
        c.top.classList.toggle("hi", i === hold);
        c.dots.forEach((d) => d.el.setAttribute("class", d.lit ? (i === hold ? "dot" : "dot m") : "dot off"));
      });
      read.textContent = a < 0 ? "rest" : "card " + (a + 1);
      B.wake();
    }
    pick(-1);

    bag.add(pointer(stage, {
      move: (p) => {
        const [x, y] = unproj(C, p[0], p[1], 0);
        const c = Math.floor((x - cxOf(0) + PX / 2) / PX), r = Math.floor((y + PY) / PY);
        pick(c < 0 || c >= COLS || r < 0 || r >= ROWS || Math.abs(y) > BOX[3] ? -1 : r * COLS + c);
      },
      leave: () => pick(-1),
    }));
    bag.add(() => svg.replaceChildren());

    return { set: (v) => { stag = v; }, destroy: bag.dispose };
  }

  return hairline({
    name: "memory-quest",
    means: "Six cards lie face down, one face up: the card under the pointer turns over to show its dots, and the open one turns back.",
    rules: [1, 2, 4, 8],
    range: [0, 70, 150],
    mount,
  });
}
