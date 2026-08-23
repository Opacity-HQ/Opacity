# UI/UX Design Brief — Letter Detective

Theme: **"The Letter Lineup."** The child is a detective; confusable letters (b/d, p/q, m/w, n/u...) are suspects. Fits the existing pixel-font, playful-but-clean tone already established on the landing page.

## Screens

1. **Case intro** — one confusion pair framed as "today's case," a single clear instruction line, big "start" button. No reading burden beyond the instruction.
2. **Round** (5 variants, see game design below) — full-bleed stimulus area, no visible score or timer during play (see Anti-frustration).
3. **Case solved** — celebratory summary *after* the round, collectible suspect card unlocked, "next case" / "back to detective office" (home).

## Dyslexia-friendly rules (from `AGENTS.md`, restated in game-specific terms)

- Only `font-pixel` / `font-sauce`. No serif for body copy (serif is *used deliberately* as a difficulty knob inside the game itself, never for UI chrome).
- Never colour-only state: a wrong pick gets a shape/motion cue (gentle wiggle) in addition to any colour change; a correct pick glows *and* has a distinct icon.
- Clear spacing, one instruction at a time, short sentences, icons alongside text where possible.
- Real semantic `<button>` elements throughout — never a `div` with an onClick standing in for one.
- Full keyboard path: number keys / arrow keys select a suspect, `Enter` confirms; visible focus ring at every step.
- Respect `prefers-reduced-motion` — case-transition animation and the wiggle/glow feedback both get a reduced-motion fallback (instant state change, no easing).
- Stable dimensions at every breakpoint — a letter grid must not reflow mid-round on a resize; layout is fixed once a round starts.

## Anti-frustration rules (screening validity depends on these, not just kindness)

- **No visible running score or countdown during play.** A visible score changes how a child responds — they slow down to avoid mistakes or rush against a timer — which corrupts the reaction-time signal the whole game exists to capture. Celebrate only after a case ends.
- No red X, no failure sound, no "wrong!" text. Incorrect tap → brief gentle wiggle on the tapped suspect, then the correct one glows so the child still learns the right answer.
- A timeout is not failure — it just quietly ends the trial and moves on; nothing on screen implies the child did something wrong.
- Every round starts with 3 warm-up trials that don't count toward scoring, so the first "real" trial isn't also the child's first exposure to the mechanic.

## Game design — five round types

| Round | What the child does | Feature it isolates |
|---|---|---|
| **The Lineup** | Target letter shown, then 4–6 suspects incl. its mirror/rotation twins; tap the match | Which *wrong* twin gets picked separates mirror confusion (b/d) from rotation confusion (b/p, d/q) |
| **Spot the Impostor** | Grid of one letter, one flipped copy hidden among it; tap the impostor | Pure visual discrimination, no reading load |
| **Stakeout** | 30s window, tap only the target letter as it appears among distractors | Throughput, vigilance decrement over the window, false-alarm rate on the twin — strongest processing-speed signal |
| **Undercover in Words** | Target letter hidden inside real words; tap every occurrence | Position-conditional accuracy (initial / medial / final) — medial-position misses are a stronger dyslexia signal than initial-position misses |
| **Case Files** | Five cases, each built around one confusion pair, each unlocking a collectible card on completion | Pure engagement mechanic — gets a child through 40+ trials, the volume the scoring model needs, without it feeling like a test |

## Adaptive knobs (read/written via `skill_states`, see TRD)

Distractor count (2→6) · exposure time (unlimited → 1200ms → 600ms masked) · confusion tier (mirror → rotation → visual → sequence) · font (sans → serif, serif increases mirror-confusion difficulty on purpose) · case (uppercase → lowercase) · audio letter-name cue (on/off).

## Visual language

- Icons: `lucide-react` for UI chrome (back, home, replay). Letters themselves are typography, not icon assets.
- Palette/spacing: reuse existing tokens in `app/globals.css` — no new custom colours introduced for this game.
- Collectible cards use the existing card/dashed-border visual pattern already on the landing page (`dashed-border`, `button-shadow` classes) for visual continuity with the rest of the site.
