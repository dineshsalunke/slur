# The block surface, the Fresnel trade, and three agents on one branch

**Date:** 2026-09-22 · **Branch:** `dev` (commit `a0c87d1`)

Picks up [[2026-09-22-rail-lights-and-the-missing-tone-map]]. Its Next #6 is done and its Next #1–#3
are superseded by owner direction: the work moved from judging rail lights to the block and monolith
surfaces.

## Branch policy changed — no worktrees, no branches

Owner's instruction: **all agents work directly on `dev`**, no worktrees, and **no creating branches
unless specifically asked** or unless agents are launched through the herdr skill. A branch I created
for this work (`art/block-surface`) was deleted.

`dev` was moved forward locally by **fast-forwarding the ref** (`git branch -f dev art/rail-lights`)
rather than checking out, so no file in the shared tree changed and no peer's uncommitted work was
disturbed. That absorbed the five `art/rail-lights` commits. `dev` is **not pushed**.

**`feat/test-level` and `feat/ship-feel` were deliberately NOT merged.** Their work already landed on
`dev` through squash-merges, so their commit lists are stale history. A direct tree diff (`git diff
dev..<branch>`, two dots — the three-dot form is misleading here because the merge base is ancient)
puts both **net behind** dev: `feat/ship-feel` is +2444/−3327, `feat/test-level` +1458/−1683. Merging
either would revert dev. They look safe to delete; that is the owner's call and was left open.
`/Users/apple/Projects/personal/slur-worktrees/ship-feel` is still a registered worktree, also left
for the owner.

## Three agents, one working tree

Peers this session: **`rearview-mirror`** and **`hud`**. Both were told the branch policy, the
ownership split, and to **stage by explicit pathspec — never `git add -A` or `git commit -a`**. That
protocol held: three commits landed from two agents with no cross-contamination.

Ownership as agreed: **this session** owns `sealed-block-*`, `monolith-geometry.ts`,
`track-blocks.tsx`, `scene-effects.tsx` and `docs/ART_MATERIALS.md`. `rearview-mirror` owns
`rear-view*`, `net-canvas.tsx`, `test-level-canvas.tsx`, `track-instancing.ts`. `hud` owns
`apps/client/app/game/hud/`.

**`git commit -m … -- <paths>` requires that order** — `-- <paths> -m …` makes git read the message as
a pathspec and fail.

## The Fresnel trade: a dark deck and a flat ramp are mutually exclusive

The previous session fixed the deck's brown near→far ramp by moving `GRAPHITE_ALBEDO` `#303c45` →
`#7c8590`. Verified against the installed shader, that fix bought flatness by spending the direction's
dark deck, and **there is no metalness setting that recovers both**.

`three@0.185.1/src/renderers/shaders/ShaderChunk/lights_physical_fragment.glsl.js:51`:

> `material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );`

with `material.specularColor = vec3( 0.04 )` (line 50), and line 35:

> `material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );`

F90 is 1.0 at the default `specularIntensity` regardless of metalness, so the grazing/facing ratio is
`1 / F0` for every metalness value. Computed from those two lines:

| | albedo | metalness | F0 | F90/F0 | diffuse |
|---|---|---|---|---|---|
| **shipped** | `#7c8590` | 0.90 | 0.212 | **4.7×** | 0.023 |
| M1 band, top | `#303c45` | 1.00 | 0.043 | 23.3× | 0 |
| M1 band, bottom | `#0a1117` | 1.00 | 0.005 | 189.6× | 0 |
| any dielectric, dark albedo | `#1a2028` | 0.00 | 0.040 | **25.0×** | 0.014 |

**Dropping metalness makes the ramp worse, not better** — F0 floors at 0.04, so a dark dielectric ramps
more than the dark conductor did. F0 *is* the ramp, and a dark surface is a low-F0 surface. The only
thing that flattened it was making the deck a bright metal; `#7c8590` at metalness 0.9 is aluminium.
M1's band tops out at `#303c45`, so **the shipped albedo is a silent rewrite of M1's family
definition**, not a tuning value.

**The cause was never the material.** The previous handover's own reason #2 says it: a reflectance ramp
is only a visible gradient if the grazing end reflects something brighter. The reference's grazing
direction sees a dark corridor. A 25× ramp over a black sky is invisible. The fix belongs in the
environment — what sits above the horizon where the far deck looks — not in the albedo.
`Env.bandIntensity` 1.8 → 0.4 was already a step down that road.

**Corroborated by the owner's own texture reference.** `Metal046B_1K-JPG_Color.jpg`, handed over as the
target look, is a dark cast metal around `#3a3a3a` — inside M1's band. The shipped albedo is not.

**Proposal, awaiting the owner's call:** revert `GRAPHITE_ALBEDO` into M1's band, let the 25× ramp stand
against a dark grazing environment, and let the rail `RectAreaLight`s be the local brightness —
which is what `cruise-lighting.png` shows and what the rails were built for. **Not actioned.**

## Landed: `a0c87d1`

**The `patch` reserved-word bug is fixed.** Renamed to `wear`. Also scanned every shader source in
`apps/client/app/game/scene/` for other GLSL ES reserved words used as identifiers — none.

**The seam flicker had a specific cause, and it was not the side-face bias.**
`sealed-block-shader.ts` had:

> `float feather = clamp( fwidth( u ), 0.0, 0.05 );`

The cap existed to hide the derivative explosion where `u` wraps at the 0/perimeter corner, but it also
capped the anti-aliasing footprint. Past the distance where a seam is thinner than 0.05u per pixel the
feather stops growing, the seam becomes a sub-pixel hard step, and it shimmers. Replaced with
`length( fwidth( vSealedWorld.xz ) )` — the same arc-length-per-pixel measure, no wrap discontinuity,
so it needs no cap — plus a `coverage = clamp( halfW / footprint, 0.0, 1.0 )` term, because a widened
feather would otherwise *brighten* a sub-pixel seam instead of dimming it. Analytic AA and energy
conservation are a pair; the old code had neither.

**Why the sides looked worse.** `sealedBlockSeams` distributes seams evenly **by arc length**, and
`sealedPerimeterU` gives each face a share proportional to its own width. A 1-lane block is 4 wide × 8
deep, so the two ±x faces take **16 of 24 perimeter units — 67%**. Travel is +z, so the face the player
sees is the block's `z0` face, at 17%. The bias is the amplifier, not the cause. **Owner's decision: if
texture and lighting make blocks readable and the flicker is fixed, side seams may stay.** So the
face-weighting change was NOT made.

**Chamfer 0.12u → 0.5u.** On an 8u block 0.12u is 1.5% — invisible at any distance, and flat-shaded
besides (`sealed-block-geometry.ts` pushes an explicit per-face normal per triangle). The owner's call
was explicitly *silhouette, not specular*, given the lighting. 0.5u matches the monoliths' existing
0.45u.

**A duplicated-constant trap, caught before it shipped.** `track-blocks.tsx` had its own `BLOCK_BEVEL`
and `BLOCK_SEAM_WIDTH` shadowing `SEALED_BLOCK_BEVEL` and `SEALED_BLOCK_SEAM_WIDTH`. Widening only one
of the pair would have desynchronised seam placement, because `sealedBlockInset()` computes seam
positions **on the CPU** from `SEALED_BLOCK_BEVEL` while the shader derives `vSealedInset` from
`uSealedBevel`. Unified on the shared constants.

Verification: typecheck clean · lint clean (9 pre-existing warnings, comment ratchet passed) · **155
client + 4 server tests pass**.

## Not done: the block texture

The largest remaining art item, fully specified and not started.

Blocks have **no texture map at all** — `SEALED_BLOCK_SURFACE` is three scalars. The only variation is
`sealedWearPatch()`, one broad per-fragment FBM blotch field at `uSealedWearMax` 0.6 (live — set every
frame at `track-blocks.tsx:113`; the `0` in `sealedBlockUniforms()` is only an initial value). That is
why blocks read as flat colour.

**Plan:** a new `sealed-block-texture.ts` following the `track-texture.ts` idiom (canvas2d, `RES` 1024,
seeded RNG, `wrapDraw`/`wrapRect` tiling helpers, packed roughness/metalness canvas, `configure()` with
`anisotropy = 8`), matching `Metal046B`: fine speckled grain, broad cloudy mottling, sparse bright
scratch clusters. **No plates, no tiles** — owner's instruction, so `surfaceMaps()` cannot be reused
directly: `plateValue()` draws a 4×4 plate grid even at `jointWidth: 0`.

Two constraints found while reading:
- **Blocks have no `uv` attribute.** `sealed-block-geometry.ts` writes only `position` and `normal`.
  UVs must be added, world-scaled so texel density stays constant across varying block widths.
- **Bake it, do not compute it per fragment.** Per-fragment procedural noise cannot be mipmapped and is
  itself an aliasing source at distance — directly relevant to the flicker complaint, and to the
  rear-view mirror, which is all distance. Multi-octave value noise filled straight into `ImageData`
  suits the fine speckle better than lobe-stamping.

## Not done: monolith chamfers

`monolith-geometry.ts` chamfers **only the vertical edges** — `crossSection()` builds an 8-point ring
and the top/bottom caps meet the sides at a hard 90°. `chamferX = shape.chamfer / shape.width` with
`chamfer: 0.45`. It also calls `computeVertexNormals()` on **non-indexed** geometry, which is flat
shading. The owner asked for bigger chamfers on monoliths too; the cap edges need adding, not just
widening.

## Game mechanics the owner announced — not started, no issues filed

Three changes, flagged as *"a big game mechanic change is coming"*. **Filing GitHub issues was offered
and not yet approved.**

1. **Block height becomes a 4u–8u range**, 4u clearable by a single jump. This rewrites `docs/GDD.md:53`
   — *"Deadly block height | `8u` (`BLOCK_HEIGHT`) | **above double-jump reach on purpose** — strafe
   around, never hop"*. Today every block is identical except width: `track.ts:125` fixes
   `BLOCK_HEIGHT = 8` and `BLOCK_DEPTH = 8`, and `buildWalls` centres every block in its segment.
2. **Block hit bounces and stops instead of killing**; kill only at full speed. Touches `step.ts`
   collision response, and needs a netcode look — a bounce is a server-authoritative impulse the client
   must predict and reconcile.
3. **Players can fall off the deck edges.** This is nearly free: `step.ts:74` `clampToEdges( s, t )` is
   a hard wall pinning `s.x` to `±limit` and zeroing `vx`. Everything downstream exists —
   `floorUnder`/`landingFloor` decide support from floor spans and `step.ts:189` `if ( s.y < t.deathY )`
   already kills. **Relaxing that clamp is the feature.**

**A blocker that applies to both #1 and any block-depth variation.** The threadable-clearance invariant
is per-z-slice (`GDD.md:31` — *"At every z-slice, the widest contiguous lethal-free floor run must be ≥
`MIN_CLEAR`"*), but the check samples **one slice only** — `track.ts:415`, `const zc = seg.z0 + SEG_LEN
/ 2;` then `.filter( b => b.z0 <= zc && zc < b.z1 )`. That is valid **only because every block is
centred**. Vary depth or z-offset and the sampler misses the worst slice. The check must move to
sampling every block z-boundary in the segment, with tests, before block geometry varies in z.

## Handed over by `rearview-mirror`, for whoever owns it

**`scene-effects.tsx` has an HMR-only crash — this is issue #166, already filed.** Reported
independently by both peers this session, which is a fair measure of how much it costs: it kills the
page on any HMR edit that re-renders the Canvas subtree, so iterating on scene code means a hard reload
every time. On a hot re-render — not a fresh load — the canvas tears
down with `TypeError: Converting circular structure to JSON`, from `@react-three/postprocessing`'s
`JSON.stringify( restProps )` memo. Under React 19 `ref` is an ordinary prop, so `<Bloom ref={ ref }
mipmapBlur />` at `scene-effects.tsx:24` feeds the `BloomEffect` into that stringify, and its internal
passes hold a scene whose `scene.children[ 0 ].parent` closes the circle. Clears on reload. The fix is
a ref-free `Bloom` or a stable non-enumerable handle. **Not fixed.**

`track-instancing.ts` `BACK` 80 → 240, by `rearview-mirror`: `TrackBlocks` is the only component that
streams (floor, rail, rim, seams and monoliths all build once over the whole track), so in a
backward-facing view blocks alone vanished past 80u. Worst case measured at 71 instances against
`BLOCK_LIMIT` 160. **That constant is now load-bearing for the mirror — do not lower it silently.**

## A correction worth keeping

I attributed "blocks rendering oddly in the rear-view" to the `patch` compile bug. `rearview-mirror`
measured it and I was wrong on both counts: the fix was already in the tree, and the real causes were
`BACK = 80` plus a mirror camera at `fov` 82 — three's `PerspectiveCamera.fov` is **vertical**, so at
the panel's 3.2 aspect that was a 140° horizontal fisheye. **Do not hand a peer a causal story that was
never measured.**

## Blocked

**The Chrome extension is not connected this session.** Nothing below was judged on screen — the seam
flicker fix, the 0.5u chamfer and the whole Fresnel argument are reasoned from source and arithmetic,
not looked at. The dev stack is up on `:5173`/`:2567`. First thing next session: reconnect the
extension and look at `/test-level`.

## Next

1. **Reconnect the extension and judge `a0c87d1`** — is the seam flicker gone, and does the 0.5u
   chamfer read in silhouette? Both are one-constant dials. **Click into the page first:** both peers
   independently lost time to the driven tab being backgrounded, where `rAF` never fires, the scene
   screenshots black and per-frame readouts stay blank. It cost one of them a 45s CDP timeout. This is
   not a rendering bug and it invalidates any screenshot taken before the click.
2. **Fix issue #166 before the texture work** — `scene-effects.tsx` is mine, and the block texture is
   the most HMR-iterative task left. Paying a hard reload per edit while dialling a procedural texture
   is the wrong order of work.
2. **Build `sealed-block-texture.ts`** per the plan above, plus the `uv` attribute.
3. **Monolith cap-edge chamfers**, and widen the vertical ones.
4. **The `GRAPHITE_ALBEDO` decision** — revert into M1's band and fix the ramp environmentally, or amend
   M1. Owner's call; M1's colour band is owner-set.
5. **File the three mechanics issues** once approved, and fix the `track.ts:415` clearance sampler
   before any block-geometry variation lands.
6. **`ART_MATERIALS.md` §7 departures entry is still owed, now seven items:** the five from the previous
   handover, plus the `GRAPHITE_ALBEDO`-versus-M1-band contradiction with the F0 table above, plus the
   0.5u chamfer. §7 item 10's undeclared white ambient is now **stale** — `rg` finds `ambientLight` only
   in `landing-scene.tsx`; the game scene's was removed with the lighting strip.
7. **Decide `feat/test-level`, `feat/ship-feel` and the `ship-feel` worktree** — all three look
   disposable, none were touched.

## Related

- [[2026-09-22-rail-lights-and-the-missing-tone-map]] — the handover this picks up.
- [[2026-09-22-the-rearview-mirror]] — `rearview-mirror`'s parallel work in the same tree.
