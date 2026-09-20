# LANE STATE — sealed block (#164) — written by the supervisor, 2026-09-20

**Your context was cleared at a clean seam. This file plus `LANE-FACTS.md` are the whole of what you
need.** Everything below is verified, not remembered. Do not re-read the art package — `LANE-FACTS.md`
quotes board 28 verbatim.

## Where the work is

| | |
|---|---|
| branch | `art/sealed-block` off `origin/dev` @ `cf1c98c`, pushed, **nothing unpushed**, tree clean |
| HEAD | `eaccf1d` art(blocks): close the env specular, and exhaust both of board 28's wear dials |
| gate | **green** — lint 3 warnings = the pre-existing `noExcessiveLinesPerFile` baseline · comment ratchet clean. The last two commits are **markdown only**, so typecheck / shared 78/78 / client 80/80 / server 4/4 / build are unchanged from `5fc6620`'s green |
| stack | 5204 / 2604, up; log `.claude/lane/dev.log`; `/iso-block` → 200 |
| issue | #164, locked (comment `5750325229`). No PR yet |
| **Chrome** | **NOT yours.** `split-crown` holds the tab. Ask me before assuming it; `tabs_context_mcp` will say no tab group exists for your session |

Commits: `5fc6620` instrument + M2 body + AABB assertion · `f40343c` slice-1 gate results ·
`0eb7947` board-28 repoint · `de2bb69` prior state doc · `5418601` cold-key + triplanar ·
`eaccf1d` env specular closed + both wear dials swept.

## Built and gated — do not redo

- **`/iso-block`** on the existing `<IsoLab>`, `size={8}`, board overlay
  **`28_non_destructible_blocks_FINAL_DRAFT.png`** (serves 200 over the `art-refs-blocks` mount).
- **The M2 body:** roughness **0.52** (midpoint of 0.45–0.60), metalness **0**, colour **`#0d1117`**, no
  emissive. Deck for contrast: `FLOOR_METALNESS 0.75`, `FLOOR_ROUGHNESS 0.4` (`track-materials.ts:16,11`).
  The separation from the deck is **finish, not value** — a coated dielectric against a bare conductor.
- **Three footprints:** `4×8`, `5.5×5.5`, `3.5×5`, all 8u. The first is today's generator output; the
  other two are GDD §0's own blessed legal examples.
- **The AABB assertion, in both directions** — no vertex outside the envelope, *and* the envelope reached
  on every axis, per footprint.
- `BLOCK_HEIGHT = 8` (`packages/shared/src/sim/track.ts:143`), `BLOCK_DEPTH = 8` (`:144`), block z centred
  in the 20u segment (`:358`).

**No silhouette work has been done, deliberately.** Slice 1 is a plain cuboid in the decided material,
which is what board 28 asks for.

## What your own measurement established, and what came of it

You proved the block's **player-facing face is rgb(0,0,0)** — direct `0.00e+0`, env diffuse `4.81e-5`, env
specular `2.91e-4`, total `3.39e-4`. `dotNV` 0.928, so no grazing-angle rescue. And you exhausted both of
board 28's wear dials: roughness across the whole M2 band moves the **top** face 2 levels, non-monotonically;
value responds at 4.9% for ~4 levels. On the presented face, both are zero.

**That went to the owner and they decided: add a low fill from behind the player.** It is filed as **#170**
(art-pass task 3, lighting), with your numbers, your correction that the existing 246°/−19° fill card *does*
reach the presented face at `7.36e-3` but is ~3 orders too weak, and the constraint that the fill must not
close the ~980x deck/block gap that keeps the silhouette readable.

**#170 is NOT yours and you must not touch lighting.** No edits to `sky-config.ts`, `sky-environment.tsx`,
`star-light.tsx`, or any light anywhere. If your work seems to need the fill, stop and tell me.

## THE AUTHORITY — board 28 only

`docs/art-direction/blocks/28_non_destructible_blocks_SPEC.md` is the block direction. It supersedes board
10 and `handoff/04_OBSTACLES.md`. **The owner was explicit: boards 25, 26 and 27 are history — do not read
them.** `docs/art-direction/` is **read-only** for us in all cases.

The decided shape: **sealed rectangular cuboids with restrained bevels** (no draft, no taper) · **marigold
seams vertical only**, variable positions, multiple permitted · **no top-face luminous returns or glowing
outlines** · variation comes from **broad wear patches in sheen and muted graphite value**, not from
differing silhouettes · **clean is a legitimate endpoint of the wear range** · wear strength and seam count
are independent controls · **no fissures, cracks or separated plates** · keep the silhouette intact at every
wear level · preserve generous dark face areas.

Board 28's **image** is a final draft that *"has not itself been approved"* — the written direction is what
is decided, the image is a LOOK target, and *"illustrative proportions, apparent height and camera matching
are not measured evidence."* `docs/ART_SCALE_REFERENCE.md` stays the sole dimensional authority; board 28
establishes no new footprint dimensions.

Your mechanism choice — **proportional geometry + world-space material** — is confirmed by the spec's own
authoring intent and stands. Write the five-way weighing into the PR body (non-negotiable #14).

## Next actions, in this order

**#164 is NOT blocked by #170.** Board 28 fixes the silhouette independently of the lighting, and it says
clean is a legitimate endpoint — so you build the whole thing and ship it at clean. Only wear *tuning* waits.

**1. Restrained bevels on the cuboid.** The one silhouette control board 28 allows. Parameterised, not
hand-modelled. Re-run the two-directional AABB assertion after — a bevel that eats the envelope is the same
class of lie about an un-jumpable wall as a block drawn short.

**2. The vertical marigold seams.** These are the priority, because they are **the only thing that works
today**: emissive, therefore self-lit, therefore unaffected by the rig problem you measured. On the presented
face they currently carry *all* the information. Vertical only, variable position, multiple permitted, seeded.
`MARIGOLD_REFERENCE_INTENSITY` is 2.0 and still `[unmeasured]` — if you need a value, measure it, don't guess.

**3. The wear mechanism, plumbed and left at clean.** Triplanar world-space, seeded per instance, with
placement / scale / coverage / contrast as named controls — the spec's own list. Build it, verify it varies,
then **set the shipped strength to clean** and say in the PR that tuning is deferred to #170. Do not spend
effort tuning a dial you have proved delivers 0–2 levels.

**4. Stop and report.** Then the visual gate, once I can give you Chrome.

## Traps already paid for — do not rediscover

- **`onBeforeCompile` is one slot per material**, and `patchEmitterLight` already holds the floor's. If the
  block ever takes emitter light the two must be **composed**, not both assigned.
- **Any patch whose GLSL varies with a JS value must override `customProgramCacheKey`** or three serves a
  stale program.
- **No usable built-in triplanar.** three 0.185.1 ships `triplanarTextures` but TSL-only, and this client
  imports nothing from `three/tsl` or `three/webgpu`; drei 10.7.8 has none. Hand-write it in
  `onBeforeCompile`. The built-in would not have helped anyway — its default `positionNode` is
  `positionLocal`, which on an InstancedMesh is the unit box, so the pattern would scale with the instance:
  exactly the anisotropy to avoid.
- **Carry your own `worldPosition` varying.** `instanceMatrix` is folded in correctly, but that chunk
  declares `worldPosition` only under `USE_ENVMAP || DISTANCE || USE_SHADOWMAP || ...` — we satisfy it today
  only because the scene happens to have an `<Environment>`.
- **Anisotropic instance scale does NOT break normals on 0.185.** `defaultnormal_vertex` divides by squared
  column lengths first, which is the inverse-transpose for scale+rotation; our matrices are scale+translate,
  the supported case. **A shader that "corrects" for this would be wrong.**
- **The lint comment-ratchet fires on TOUCHED files** — a one-line comment added to an existing file costs a
  deletion somewhere. Budget for it.
- All of the above are already in `LANE-FACTS.md`; this list exists so you do not go looking.

## Untouched, and must stay so

`docs/ART_MATERIALS.md` (its M2 correction is in flight as **PR #168** — do not duplicate it) ·
everything under `docs/art-direction/` · `LETHAL_SURFACE`'s red at `track-materials.ts:35` (the retone is
the integration step after #164, deliberately deferred) · all lighting (#170).

## Still `[unmeasured]`

The visual gate — zero pixels have been seen on this lane. How the block reads at race speed in `/art-lab`.
Whether a base-contact seam reads per-block or as a continuous route glow. `MARIGOLD_REFERENCE_INTENSITY`.
