Agent: workertwo · Lane: meteor glow lingers after the hit (#259) · Updated: 2026-09-25

Older versions hold the #257 width lane (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Owner report: "reflections of the meteor fade slowly and stay even after the hit." Owner approved an ember end of 1.0 s.

## Done

- cf09c55 — the ember fades to exactly 0 at `EMBER_END = 1` (a `(1 − age/END)²` window, black at and after the end). The impact light is multiplied by a `(1 − age/1.8)²` window. New `meteor-scorch.test.ts`. Pushed to origin/dev. Closes #259.

## State

- The hit lands at t≈1.43 in the harness; the light at t=2.1 is 345 cd = 3189·e^(−age/0.3), so age ≈ 0.67 s. The first report said t≈2.0; that was wrong.
- Before, at 30u: the light was visible to ~+2.4 s and the ember to ~+10.5 s after the hit.
- After, at 30u: the ember shows 110 px at +0.67 s, 38 px at +0.77 s and 0 px from +0.87 s. The light fades with no pop: 18,935 px at +0.67 s, 245 px at +1.37 s, 0 px from +1.57 s.
- A hard light cut at 1.8 s was tried first. It popped from 1,183 px to 0 in one 0.1 s sample, so it was replaced by the fade window.
- Gates: typecheck green, client 357/357 (50 files), lint green (5 warnings, none mine). The tree held other workers' uncommitted files during the gates.
- The soot mark is unchanged. A mark stays `live` for the soot, and a black additive ember adds nothing.

## Uncommitted

None.

## Held files

None. Claims released.

## Next

1. The owner flies it on :5173 to confirm the feel.

## Open questions

None.

## Lessons → memory

none
