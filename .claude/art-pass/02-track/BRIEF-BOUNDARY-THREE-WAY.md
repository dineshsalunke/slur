# Brief — the boundary eats the deck: build a three-way A/B, don't pick a winner

Cold-start doc. Read this and the files it names. Do not re-read the big art docs.

## The complaint, and why it is structural

The owner has twice reported that the marigold rail "eats into the track". He is right, and it is not
a tuning complaint.

In `apps/client/app/game/scene/track-boundary.tsx`, `emitBoundary` sets the bevel's top edge to
`const i = x0 + w` (and `x1 - w`) — **inward** from the track's outer edge at ±`HALF_WIDTH`. So at any
`w`, `w` units per side of floor are repainted as edge trim. Committed is `BOUNDARY_W = 1.0`; the owner
last dialled 3.

`BOUNDARY_W`/`BOUNDARY_H` are **client-only** — they appear nowhere in `packages/shared` or
`apps/server`, and the sim floor spans ±`HALF_WIDTH` regardless. So nothing is taken from the player.
**The deck is lying about where it ends**, which is the worse failure: it looks like you should not be
there and you can be. Dialling `w` down shrinks the lie without fixing it.

## Build three, judge in one frame, pick none

Switchable from the TUNING panel so all three can be compared live. **Do not replace the current
path** — it is variant A and it is the control.

**A — inboard bevel (current, control).** Exactly what ships today.

**B — outboard flare.** Mirror shape: bevel runs from the deck corner at (±32, 0) outward and downward
to (±32±w, −h); the deck's top face goes the full ±32 and its side wall picks up below. Zero deck bite.

**C — inboard, but with no hard inner edge.** Geometry unchanged from A. The marigold falls off
*inward* as a gradient instead of ending on a line. The hypothesis: what reads as "not track" is the
**hard inner edge**, not the marigold itself. A soft falloff should read as a hot edge on continuous
deck rather than as a boundary you are trespassing over. This is a material/emissive change, not a
geometry change, and it is the cheapest of the three if it works.

## The bound that governs variant B — verify it, don't take it

For a camera at (cx, H, 0) and a point (32+w, −h, D), the sight line crosses x = 32 at
t = (32−cx)/(32+w−cx), and requiring y > 0 there gives:

**h·(32 − cx) < H·w**

`D` cancels — the bound is **distance-independent**. Two cases matter:

- **On-axis** (cx = 0): h < (H/32)·w. At the dialled H = 7.5 that is h < 0.234·w, so w = 4 buys
  h ≈ 0.94.
- **Far rail** (cx = −32, pressed against the opposite edge, reading the rail across the track):
  h < (H/64)·w = 0.117·w. At w = 4 that is **h < 0.47** — exactly half.

**Judge variant B against the FAR rail, not the near one.** At speed the near rail is half out of
frame; the far rail is what you read lateral position from. A previous context derived the on-axis
number and nearly shipped it as the headline — the far-rail case is the honest one, and it means B is
markedly more likely to fail than the on-axis figure suggests. That is fine. **Failing informatively is
the job here.**

Re-derive both cases yourself. If either does not cancel for you, say so before building.

## Scope discipline

- Geometry and panel switching only. Do **not** retune intensity, do **not** re-freeze
  `MARIGOLD_REFERENCE_INTENSITY`.
- `track-geometry.ts`'s corner contract cuts both ways: the deck omits exactly the facets the strip
  fills. If variant B changes what the deck omits, `track-floor.tsx` must agree or you get a corner
  seam or coplanar z-fighting. The pinned contract test should cover any new path.
- The geometry rebuild is ~8.6ms for 400 segments, so geometry knobs apply **on release**, never per
  input event. **Do not reach for a timer.**

## Do NOT resolve the design conflict

The owner's position: the trim must never affect the playable read. The art package's position: it is
not a rail and must not stand proud of the floor. A **raised** outboard band would satisfy him and
violate the package — so it is not on this list. B and C are the two shapes that could satisfy both. If
neither reads, the conflict escalates to the owner and Codex. Report that outcome; do not solve it.

## Housekeeping

Fresh worktree off `origin/dev`, sibling path, your own port. `:5202` and `:5204` are torn down so ports
are free; **`:5205` is the owner's live gate and must stay up.** No `Co-Authored-By` trailer on commits
(enforced by a PreToolUse hook on the personal profile, and by `CONTRIBUTING.md:134`). Full gate —
typecheck · lint (3 pre-existing `packages/shared` warnings expected, canvas-isolation 8/8, comment
ratchet must not gain) · `pnpm -r test` · build. Comments 1–2 plain lines. Any mechanism decision needs
five weighed candidates, weighed in the PR body.

## Instrument hazards, all already paid for

A tab must mount **genuinely visible** — a never-visible tab never mounts R3F, and canvas size is not
the test. Check `gl.info.render.frame` advances before believing any capture. Drive the panel's own
DOM; never `await import(...)`. Yield a task after `dispatchEvent` before reading.
