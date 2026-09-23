Agent: workertwo · Lane: distinct finish gate (#220); #214 parked · Updated: 2026-09-23, ~21:30

## Goal

#220: make the finish gate unmistakably the finish, not another arch. Owner approved A + B + C and signed
off on the look. #214 stays parked on the owner's eyes-on check.

## Done

- `c36518a` — A + B + C.
  - A: `finish-outline.tsx` instances a 4u marigold band and a 1.25u `#FFE0A0` core up the inner leg faces and
    under the lintel, at 2× reference intensity, with `fog={ false }`.
  - B: `GATE_FRAME` is now legs 40u, depth 40u, lintel 48u, overhang 8u, height 240u. A new test holds it
    above every arch.
  - C: a three-row 4u checker crosses the deck at finishZ.
  - `ART_MATERIALS.md` §7 item 13 records the tier move and the fog exception.
- Earlier: `58bb6e6` bulky arches, `921ee24` gate + arches + finish reset, `f9248ef` pillars. #214 SHAs:
  `523d63c`, `b6f1f45`, `8c9afaf`, `248096d`, `215159e`.

## State

- At `c36518a`: client vitest 225/225, tsc clean, biome clean, comment ratchet passes.
- The scene fog is linear 40u–420u and the camera far plane is 1000u, both measured. Without `fog:false`
  the outline was invisible at 450u (force-green probe). With it, the 450u still shows a lit doorway that
  no arch has.
- The finish reads to about 1000u (the far plane) at most. No gate still was possible at 2000u, because
  nothing past 1000u is drawn.
- The floor checker reads only at close range. At a 4u eye height it is a few pixels tall.
- The headless Chrome (port 9337) and the dev server (port 5186) are killed.

## Uncommitted

None of mine. (`docs/art-direction/**` untracked files belong to ChatGPT. Never add them.)

## Held files

None. `docs/ART_MATERIALS.md` is released to workerthree.

## Next

1. Wait for the supervisor.
2. #214 step 5 whenever the owner plays it.

## Open questions

1. Should the finish read beyond 1000u? That needs a larger camera far plane, which affects the whole
   scene, or a separate beacon. Not built.
2. The floor checker is weak from the chase camera. Keep it, drop it, or make it taller?
3. `Monolith.seamEmissive` defaults to 2, which equals `MARIGOLD_REFERENCE_INTENSITY`, while
   `ART_MATERIALS.md` §3 caps environmental glow at ≤ 0.25 of gameplay. Not mine to change; flagged.
4. #214: do sealed blocks stop a bolt (built as yes)? One `smashKeep` for every class? A marigold ember
   burst on a break?

## Lessons → memory

- `.claude/memory/fog-hides-emissive-past-420u.md`
- `.claude/memory/instanced-ref-callback-needs-geometry-prop.md`
