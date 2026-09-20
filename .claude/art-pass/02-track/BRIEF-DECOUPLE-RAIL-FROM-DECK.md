# Brief — the rail sits outboard; the deck keeps its full width

**Status:** live brief, revised 2026-09-20 after the first version was found to cite the wrong branch.
Supersedes `BRIEF-BOUNDARY-THREE-WAY.md`. Written to be read cold.

**Base branch: `art/boundary-three-way` @ `1b98357` (PR #151, held, DRAFT).** Branch off it, do not
branch off `origin/dev` — A/B/C exist nowhere else, and the owner judges the new shape beside them.
**#151 becomes the carrier for all of it**; its description needs rewriting when this lands, because
its original premise (three bevel shapes) has been rejected. That is my call, not the lane's.

## What the owner wants, in his own arithmetic

A rail box of width `railW`, pivot at centre, at `HALF_WIDTH + railW/2` on the +x side — occupying
`[32, 32+railW]`, mirrored on −x. **The deck keeps every unit of its ±32.** That is the whole
requirement. He restated it three times before it landed; do not re-derive it or negotiate it.

## Why A and C cannot satisfy it, and why B already half does

On `origin/dev` the deck's own top face is generated inset by the trim's width
(`track-floor.tsx:67-68` at `bb59350`):

```
const deckL = isOuterEdge( x0 ) ? x0 + w : x0;
const deckR = isOuterEdge( x1 ) ? x1 - w : x1;
```

The same `w` drives the deck mesh and the boundary mesh, so dragging `width` does not widen a rail
beside the deck — **it shrinks the deck** and repaints the reclaimed strip as trim.

**On the base branch this is already fixed for B, and that is the shortcut.** `track-floor.tsx:71-72`
@ `1b98357` reads `! outboard && isOuterEdge( x0 ) ? x0 + w : x0` — gated on a flag, B emits the deck's
full top face, with a test pinning it ("leaves the deck its full top face out to the track edge"). What
B *additionally* does is slope downward by `h` and carry the slab wall out to `x0 - w`
(`sideL`/`sideR`, lines 75-76). **Strip the slope and B is the owner's box.**

## The work

1. **Let the rise reach zero.** `boundaryWrap`'s slider is `min 0.25` (`debug-panel.tsx:136`). At `h = 0`
   B's quad runs from `(x0, y)` to `(x0-w, y)` — coplanar with the deck, spanning `[32, 32+w]`, which is
   exactly the requirement. Lower the min to 0.
2. **Give the flat rail its own variant** beside A/B/C, or fold it into B as B-with-rise — your call on
   shape, but the owner must be able to click between "eats the deck" and "does not" and watch the deck
   stop moving when he drags `width`. Keep A/B/C switchable.
3. **Finish B's gap ends.** The squared-off cap is the known rough edge and it becomes load-bearing once
   this variant is the candidate rather than an instrument.
4. **Delete the corner-contract comment**, `track-geometry.ts:1-3` — *"the deck omits exactly the facets
   the strip fills, so both must read the same numbers and the same edge rule"*. Verified present and
   identical on both `origin/dev` and `1b98357`. It will be false.
5. Keep `BOUNDARY_W`/`BOUNDARY_H` out of the deck's own top-face maths. That import mattering only to
   the rail is the acceptance test for the decoupling.

**Height is open, and it is the one thing to leave on a slider.** Flat satisfies the package's *"must
not stand proud of the floor"* literally, and unlike a downward flare it cannot hide — the far-rail
occlusion bound needs depth below y=0 and at h=0 there is none. A raised band reads better and violates
that package line. **Do not choose between flush and raised.** That is the owner's call with Codex.

Worth stating in the PR: this also fixes a live bug on `dev` — the sim floor spans ±`HALF_WIDTH`
unconditionally, so at the shipped `BOUNDARY_W = 1.0` the player flies 1u per side of floor that renders
as rail.

## Corrections that have each cost a session — read before writing code

- **Cite line numbers against the branch you are on, and say which branch.** The first version of this
  brief quoted a `BOUNDARY_H` comment (*"without taking deck, since only `w` crosses the playable top"*)
  that exists only on `art/boundary-bevel` (#149, the `:5205` worktree) — **not** on `dev` and not on
  the base branch, where it reads *"Wrap down the outer face…"*. The lane caught it. Do not delete text
  without grepping for it first.
- **`../slur-worktrees/track-slice2` stays.** It is stale and it is also the lane's own herdr shell cwd;
  removing it pulls the floor out from under the running agent. It dies at teardown.
- **Never cite code or its comments as art direction.** Read code for what it does, never for what it
  should be. Several comments in these files assert a design the owner has now rejected.
- **`docs/art-direction/` is read-only.** Disagreements go in a Claude-owned doc with a quoted
  *decisions + departures* section, handed to the owner.
- **Only one Chrome tab renders at a time.** `:5205` and `:5206` are the owner's. Never take rendering.
- **No `Co-Authored-By`-style trailer** on commits in this repo.
- **Full gate before reporting done:** typecheck · lint · tests (shared/client/server) · build.

## Stack

`:5206` = base-branch A/B/C, worktree `../slur-worktrees/boundary-three-way`, `CLIENT_PORT=5206` /
`VITE_SERVER_PORT=2606`, launched `PORT=2606 pnpm dev`. The previous session's server died with its
shell — relaunch it. `:5205` is the owner's and is not yours.

## The one number, stated both ways so it cannot be built wrong

Right rail: faces at `x = 32` (inner, flush with the deck edge) and `x = 32 + railW` (outer).

- **As emitted quads** (what the code does today, via `pushQuad`'s raw world-space vertices): write
  those two x values literally. There is no pivot and no transform.
- **As a mesh with a CENTRED pivot** — three's `BoxGeometry` is centred on the origin — the position is
  `x = 32 + railW/2`. **Not `32`**: that straddles the deck edge and silently eats `railW/2` of deck,
  which is this whole session's bug reintroduced through a different door. Not `32 + railW` either:
  that leaves a `railW/2` gap between deck edge and rail.

Left rail mirrors: faces at `-32` and `-(32 + railW)`; centred-pivot position `x = -(32 + railW/2)`.

Either way **the deck's own top face still ends at exactly ±`HALF_WIDTH` and nothing about the rail
moves it.** The owner raised the pivot ambiguity himself; treat it as a hard acceptance check, not a
detail — assert the deck's outer vertex is at ±32 in a test regardless of `railW`.
