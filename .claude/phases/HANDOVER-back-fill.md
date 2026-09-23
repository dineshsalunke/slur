# Handover — #170, the back-fill that was never the problem

Session of 2026-09-23, branch `dev`, issue #170. Picked up from
`.claude/phases/HANDOVER-asteroids.md`, whose "what to do next" item 1 was *"Resolve #170, then
re-judge the rock."* One commit: `e45bdaf`.

## What #170 asked for, and why it was the wrong lever

> *"Every light in the scene that carries meaningful energy arrives from ahead of the player... **Owner
> decision (2026-09-20): add a low fill from behind the player**"*

**That fill already exists and is correctly aimed.** `apps/client/app/game/scene/back-fill.tsx` is a
cold `directionalLight`, colour `#bcc0c4`, at `Fill.azimuth` 25 / `Fill.elevation` 35. Its position
is `( ground*sin(az), sin(el)*D, -ground*cos(az) )` with the target left at the origin, so the
vector-to-light is `(0.346, 0.574, -0.742)` and **N·L on the player-facing (−Z) face is 0.742** —
better than the 0.469 the issue's own bearing table recommends at 225/48.5. The asteroid handover
described it as *"a directionalLight at intensity 0.35 aimed away from the camera"*; that was
recalled, not read, and it is wrong about the aim.

Raising it does nothing. Measured on a frozen frame, one clean 60×40 patch of a block's presented
face:

| `Fill.intensity` | presented face |
|---|---|
| 0.35 (default) | rgb(24.4, 10.0, **1.3**) |
| 1 | rgb(27.4, 12.6, **2.1**) |
| 10 | rgb(25.9, 12.2, **4.0**) |
| 50 | rgb(22.8, 10.4, **3.8**) |

A 143× raise buys 2.5 levels of blue. `Environment.intensity` 1→3 does reach the face
(rgb 29.4, 15.4, 7.4) but takes the deck 28.6 → 66.7 to do it — the wrong ratio by a wide margin.
`NearFill.intensity` 40 → 0 barely moves it either, so the warm camera light is not the source.

## The actual blocker

`SEALED_BLOCK_METALNESS` was `GRAPHITE_METALNESS` = **0.9**, inherited from the deck family. At 0.9
the diffuse term is about 10% of albedo, so a fill light has almost nothing to land on and the face
is a mirror. What it mirrors is the authored environment's marigold horizon band — `Env.bandColor`
is `ACCENT_ANCHOR` on a `BAND_RADIUS` 98 cylinder in `authored-environment.tsx`, sitting exactly
where a vertical face's reflection lands. That is why a face that should be cold graphite measures
**24:10:1, the accent hue exactly, with zero blue.**

`docs/ART_MATERIALS.md` §M2 — *"Metalness | 0.0"* for "standard deadly blocks and destructible
blocks" — and §7 item 1, *"M2's roughness 0.45 – 0.60 and metalness 0 stand"*. The shipped 0.9 was
an unrecorded departure, so `e45bdaf` is conformance, not a new art decision. §7 records the deck's
departure (`FLOOR_METALNESS` 0.75 against M1's 1.0) but nothing about blocks.

**The acceptance bar, measured directly.** The issue wanted *"enough headroom that a roughness or
value wear spread inside M2's own band produces a visible swing"*:

| | `Block.wear` 0 | `Block.wear` 1 | swing |
|---|---|---|---|
| metalness 0.9 | rgb(24.1, 9.8, 1.3) | rgb(24.1, 9.8, 1.2) | **0 levels** |
| metalness 0 | rgb(27.9, 17.3, 7.0) | rgb(28.3, 14.2, 3.3) | green −3, blue −3.7 |

Board 28's variation mechanism was not weak under the old value. It was exactly zero. #164's wear
half is now unblocked.

## What landed

`e45bdaf` — `SEALED_BLOCK_METALNESS` → 0, and `track-blocks.tsx` stops overwriting
`material.metalness` from `num( 'Block.metalness' )` every frame (the JSX already spreads
`SEALED_BLOCK_SURFACE`). Baked as a constant per the panel's bake-then-delete retirement, so the
`Block.metalness` schema entry is now **inert** — it belongs to the retirement pass, and anyone who
twiddles it before then will see nothing happen.

Verified on a clean default run with no `localStorage` override: face rgb(28.2, 14.1, 3.3),
identical to the override probe; deck unchanged. `biome check`, the comment ratchet, `tsc --noEmit`
and the 21 sealed-block tests all pass on the two changed files.

The full measurement set is on the issue:
`github.com/dineshsalunke/slur/issues/170#issuecomment-5788645335`.

## Deliberately not bundled — this is the remaining half of #170

The metalness fix unblocks diffuse. It does **not** by itself put a *cold* value on the face, which
is what the issue's *"Cold, not warm"* constraint asks for. That needs the fill raised too:

| | presented face |
|---|---|
| metalness 0, `Fill.intensity` 0.35 | rgb(28.2, 14.1, **3.3**) |
| metalness 0, `Fill.intensity` 2 | rgb(25.9, 14.5, **10.4**) |
| metalness 0, `Fill.intensity` 3 | rgb(25.2, 19.0, **19.1**) |

`Fill` is global. The asteroid field's albedo (`#4a545f`) was tuned against `Fill.intensity` 0.35
one session ago under #211, and at 2 the rubble visibly pales. **That is an owner's-eye call across
two lanes**, which is why it is not in `e45bdaf`. `.claude/frame-tap-refs/m0-f2.png` and `m0-f3.png`
are the candidate frames, against `repro1.png` as the before.

At 2 the block still reads unambiguously as a solid dark object against the deck (deck 29.7 → 33.7,
face 25.9), so the issue's *"keep the silhouette"* constraint survives — but that was judged on
numbers plus one look, not by the owner.

## Run the same measurement on the monolith and the deck

Both are still `GRAPHITE_METALNESS` 0.9 and both are **M1 bare metal** by spec, so for them 0.9 is
intended. But it means their player-facing faces are mirrors of the same marigold band, which is
very likely the mechanism behind **#162** (*"the deck out-shines the rail that lights it"*) seen
from the other side. Nobody has measured it.

`docs/ART_MATERIALS.md` §0 is the thing to read before touching either: *"a bare metal surface with
nothing to reflect renders black and reads as a hole. This is a constraint on the lighting rig, not
a licence to drop metalness until the problem goes away."* M2 is exempt because metalness 0 is what
M2 *specifies*; M1 is not.

## The loop, which is now good enough to trust

Two additions to the headless frame tap, both indexed in `.claude/memory/`.

**Freeze the camera or the A/B is worthless.** `KeyP` toggles `simFreeze` (`dev/sim-freeze.ts`);
`LocalLoop` skips the sim but still runs `updateChaseCamera`, so the frame holds. Drive a headless
Chrome over CDP — `/json/list`, then `Runtime.evaluate` over node 24's native `WebSocket` — set the
override with `localStorage.setItem( 'slur.tuning.v1', ... )` (entries are `{ value, from }`;
`restore()` drops one whose `from` no longer matches the schema default), `location.reload()`, hold
`KeyW` for a fixed duration, `KeyP`, tap. Input reads `e.code`, so a synthetic `KeyboardEvent`
works. The same duration lands the same frame to within one level — verified twice at ±0.1.

**Do not judge brightness from a viewed tap.** The deck measures rgb(26–31) and reads as mid-grey; a
`0x1a1a1a` patch composited into the frame is nearly invisible against it while `0x404040` is
obviously lighter. A standalone 0/26/64/128 ramp renders faithfully, so this is simultaneous
contrast against a near-black surround, not display normalisation. Decode with
`ffmpeg -i f.png -f rawvideo -pix_fmt rgb24 -` and index the buffer; node has no PNG decoder and
NN-1 rules out the obvious alternative. `drawbox` at `t=3` marks a probe rectangle — use it every
time, because a face identified by eye is often the neighbouring one. The first sweep this session
was run against a monolith's **−X** face believing it was a block's **−Z** face, and reported a
null result for the wrong reason.

Scratch scripts are in the session scratchpad and are not worth preserving; they are four lines
each and the memory notes carry the shape.

## Shared-checkout state at handover

`apps/client/app/dev/{tuning-panel.tsx,tuning-schema.ts}`, `game/scene/monolith-group.tsx`,
`track-materials.ts` and `track-texture.ts` are **another session's uncommitted work** — the
monoliths moved onto the sealed-block maps. Untouched here, and deliberately: the `Block.metalness`
tunable would naturally have been removed from the schema and panel in this change, and was left in
place only to stay out of that lane. Commit was by explicit pathspec, per
`.claude/memory/shared-checkout-shares-one-git-index.md`.

A client dev server is running on `:5177` against `:2567`, with a headless Chrome on CDP port 9337.
Both are this session's and can be killed.
