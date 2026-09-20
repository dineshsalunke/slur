# LANE STATE — sealed block (#164) — written by the supervisor, 2026-09-20 (second clear)

**Your context was cleared at a clean seam. This file plus `LANE-FACTS.md` are the whole of what you
need.** Everything below is verified, not remembered. Do not re-read the art package — `LANE-FACTS.md`
quotes board 28 verbatim. Do not re-read the supervisor handovers; they are history, not instructions.

## Where the work is

| | |
|---|---|
| branch | `art/sealed-block` off `origin/dev` @ `cf1c98c`, pushed, **nothing unpushed**, tree clean |
| HEAD | `0521682` docs(lane): the chamfer's visual gate — silhouette and top rim pass, vertical strips do not resolve |
| gate | **green on `1295523`** — typecheck clean · lint 3 warnings = the pre-existing `noExcessiveLinesPerFile` baseline, ratchet clean · shared **78/78** · client **85/85** · server **4/4** · build OK. `0521682` is markdown-only, so that green still stands |
| stack | 5204 / 2604, up; log `.claude/lane/dev.log`; `/iso-block` → 200 |
| issue | #164, locked (comment `5750325229`). No PR yet |
| **capture** | **Yours, and it needs nobody's permission** — see *The frame tap* below. The old "Chrome belongs to another lane" constraint is **dead**. |

Commits: `5fc6620` instrument + M2 body + AABB assertion · `f40343c` slice-1 gate results ·
`0eb7947` board-28 repoint · `de2bb69` prior state doc · `5418601` cold-key + triplanar ·
`eaccf1d` env specular closed + both wear dials swept · `bc8189b` prior state doc ·
**`f71db93` the chamfer** · `1295523` chamfer facet measurements · `0521682` the chamfer's visual gate.

## The frame tap — how you read pixels now

`curl 'http://localhost:5204/__frame-tap?name=<name>'` writes the **composed frame, with bloom** to
`.claude/art-pass/00-frame-tap/refs/<name>.png` and answers with the path. Then just Read the PNG. **No
focus, no foregrounding, no extension pairing, no CDP.** Any Chrome that merely has the route *loaded* is a
valid responder; tab group `953585186` / tabId `253884869` is still sitting on `/iso-block` and is enough.

This is proven on this lane, not assumed: the bevel gate below was read this way, `ok: true`, `pumped: 1`,
`firstDeltaSeconds: 89.77` — i.e. rAF in that hidden tab had been dead for 89.8 s and the tap pumped the
frame itself.

Two rules that come with it:

- **`firstDeltaSeconds` reads time since the last frame from ANY source, and a pump is a frame.** Two taps
  back-to-back both report ~0.016 even with rAF stone dead. To use it as an rAF probe, leave a ~10 s gap.
- **A tap that 504s means the route never mounted R3F** (root creation gates on measured size, so a
  never-visible tab has no responder). Reload the tab; do not retry the tap.

Refs are **gitignored** (`.claude/art-pass/.gitignore:3`, `*/refs/`). A frame reproduces by re-tapping, not
by looking in git — so name your taps meaningfully and quote the name in any finding.

## Built and gated — do not redo

- **`/iso-block`** on the existing `<IsoLab>`, `size={8}`, board overlay
  **`28_non_destructible_blocks_FINAL_DRAFT.png`** (serves 200 over the `art-refs-blocks` mount).
- **The M2 body:** roughness **0.52** (midpoint of 0.45–0.60), metalness **0**, colour **`#0d1117`**, no
  emissive. Deck for contrast: `FLOOR_METALNESS 0.75`, `FLOOR_ROUGHNESS 0.4` (`track-materials.ts:16,11`).
  The separation from the deck is **finish, not value** — a coated dielectric against a bare conductor.
- **Three footprints:** `4×8`, `5.5×5.5`, `3.5×5`, all 8u. The first is today's generator output; the
  other two are GDD §0's own blessed legal examples.
- **The AABB assertion, in both directions** — no vertex outside the envelope, *and* the envelope reached
  on every axis, per footprint. Re-run green after the chamfer.
- `BLOCK_HEIGHT = 8` (`packages/shared/src/sim/track.ts:143`), `BLOCK_DEPTH = 8` (`:144`), block z centred
  in the 20u segment (`:358`).
- **The chamfer (`f71db93`), and its visual gate (`0521682`) — DONE.** Parameterised chamfered cuboid:
  6 face quads + 12 chamfer strips + 8 corner triangles = 44 triangles, non-indexed, flat-shaded, winding
  derived from the intended normal per polygon. `SEALED_BLOCK_BEVEL = 0.12` **world units** (not a
  fraction — same strip width on a 3.5u block and an 8u one), clamped to `0.45 × min(half-extent)` so it
  can never become a taper.

### What the bevel gate actually said — `sealed-block-bevel-01`

Read on real pixels, **geometry only**. Silhouette **PASS**: sealed rectangular cuboid, contour unbroken,
no taper, no rounding, no fissures, no separated plates, generous dark faces. Top chamfer strips
**RESOLVE** as a distinct narrow band, the corner still reading hard. Corner triangles **PRESENT and
correctly oriented** — independent confirmation of the winding construction on facets no test could have
caught rendering black. **Vertical chamfer strips do NOT resolve at that distance** — the near corner reads
as a hard value step, not a band; the facet is in the geometry (pinned by the `−Z/−X` test), it just does
not separate under that rig at that zoom, and its *in-game* read is still `[unmeasured]`.

**Flagged to the owner, not yours to resolve:** under the lab rig the top chamfer band is the brightest
feature on the block. It is a *lit* facet, not an emissive one, so it is not a "top-face luminous return" in
board 28's sense — but it sits near the excluded "glowing outline" read and must be re-judged once the
marigold seams and bloom are on it.

## Two standing corrections about instruments

- **A lab rig is a legibility instrument, never the art direction.** `/iso-block` runs `ambientLight 0.5` +
  a `directionalLight`; it makes a block look fine while the race view renders the same face rgb(0,0,0).
  Both are true at once. **Take geometry from a lab frame — silhouette, facet read, seam continuity — never
  levels.**
- **Check every lab's defaults before trusting a frame.** `/iso-block`'s `grid` and `rig` both start
  `true`, so the neutral rig is on unless you turn it off; compare mode starts `'off'`
  (`iso-lab.tsx:50`). There is no `shipBox` equivalent here — but `/art-lab` defaults `shipBox` ON and
  `ships` OFF, and that debug slab has already produced one phantom bug on another lane.

## What your own measurement established, and what came of it

You proved the block's **player-facing face is rgb(0,0,0)** — direct `0.00e+0`, env diffuse `4.81e-5`, env
specular `2.91e-4`, total `3.39e-4`. `dotNV` 0.928, so no grazing-angle rescue. And you exhausted both of
board 28's wear dials: roughness across the whole M2 band moves the **top** face 2 levels, non-monotonically;
value responds at 4.9% for ~4 levels. On the presented face, both are zero.

**That went to the owner and they decided: add a low fill from behind the player.** It is filed as **#170**
(art-pass task 3, lighting), with your numbers and the constraint that the fill must not close the ~980x
deck/block gap that keeps the silhouette readable.

Your chamfer recovers **exactly one** lit vertical edge on the presented silhouette (0.3388 on the `−Z/−X`
strip, 0.4646 on the corner) plus a continuous lit top rim — on facets a flat box does not possess. That
does **not** soften #170: every other presented-face chamfer facet is still 0.0000. It means only that the
front silhouette is no longer carried by the emissive seam alone.

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

### 1. The vertical marigold seams — the priority

They are **the only thing that works today**: emissive, therefore self-lit, therefore unaffected by the rig
problem you measured. On the presented face they currently carry *all* the information.

**The design is already settled and is in `LANE-FACTS.md`. Do not re-derive it.** In one paragraph so you
can start cold: seams are parameterised by a **perimeter coordinate** walking the four side faces
(`u ∈ [0, 2(w+d))`) — vertical by construction, continuous across the chamfer strips because the face-select
switches exactly at the corner where both branches agree, seam width world-uniform. Horizontal surfaces are
masked off by `|world normal.y|`, which kills the top and bottom faces **and** the near-horizontal top
chamfer strips at `|n.y| ≈ 0.707` — enforcing board 28's "no top-face luminous returns" mechanically rather
than by care, and taking the owner-flagged top band with it. Emissive is added at
`#include <emissivemap_fragment>`.

Seam colour is `MARIGOLD_EMISSIVE × MARIGOLD_REFERENCE_INTENSITY` **imported** from `track-materials.ts`
(gameplay tier per `ART_MATERIALS.md` §2) — not a new number. So `MARIGOLD_REFERENCE_INTENSITY` still being
`[unmeasured]` does not block you, and nothing here guesses it.

### 2. The wear mechanism, plumbed and left at clean

Seeded per instance, with placement / scale / coverage / contrast as named controls — the spec's own list.
Build it, verify it varies, then **set the shipped strength to clean** and say in the PR that tuning is
deferred to #170. Do not spend effort tuning a dial you have proved delivers 0–2 levels.

**Wear is on 3D value noise of world position, which is projection-free — so no triplanar blend is needed at
all.** It still needs the same `vWorldPos` varying the triplanar work documented, so that is not wasted.
Chunk order, verified in `three@0.185.1` `meshphysical.glsl.js`: `map_fragment` :171 →
`roughnessmap_fragment` :176 → `normal_fragment_begin` :178 → `emissivemap_fragment` :182. Seams hook after
the normal exists; both wear hooks are before it and neither needs it.

### 3. Gate it on real pixels, then open the PR

Tap `/iso-block` for geometry and seam continuity. Then tap `/art-lab` for how it reads at race speed —
that is still `[unmeasured]` and is the one thing the iso rig cannot tell you.

## Traps already paid for — do not rediscover

- **`onBeforeCompile` is one slot per material**, and `patchEmitterLight` already holds the floor's. If the
  block ever takes emitter light the two must be **composed**, not both assigned.
- **Any patch whose GLSL varies with a JS value must override `customProgramCacheKey`** or three serves a
  stale program.
- **Carry your own `worldPosition` varying.** `instanceMatrix` is folded in correctly, but that chunk
  declares `worldPosition` only under `USE_ENVMAP || DISTANCE || USE_SHADOWMAP || ...` — we satisfy it today
  only because the scene happens to have an `<Environment>`.
- **Anisotropic instance scale does NOT break normals on 0.185.** `defaultnormal_vertex` divides by squared
  column lengths first, which is the inverse-transpose for scale+rotation; our matrices are scale+translate,
  the supported case. **A shader that "corrects" for this would be wrong.**
- **No usable built-in triplanar** — three 0.185.1's `triplanarTextures` is TSL-only and this client imports
  nothing from `three/tsl` or `three/webgpu`; drei 10.7.8 has none. Moot now that wear is 3D value noise,
  recorded so nobody goes looking.
- **The lint comment-ratchet fires on TOUCHED files** — a one-line comment added to an existing file costs a
  deletion somewhere. Budget for it.
- **`Co-Authored-By` is rejected by the commit hook.** Do not add the trailer.
- All of the above are already in `LANE-FACTS.md`; this list exists so you do not go looking.

## Untouched, and must stay so

Everything under `docs/art-direction/` · `LETHAL_SURFACE`'s red at `track-materials.ts:35` (the retone is
the integration step after #164, deliberately deferred) · all lighting (#170).

**`docs/ART_MATERIALS.md`: its M2 correction MERGED as PR #168** (`160b356` on `dev`). M2 now carries the
wear row, the vertical-seam-orientation row and the seeded instance-variation row, so the sheet and board 28
agree. **Do not duplicate that edit**, and if you rebase onto current `dev` you will pick it up.

## Still `[unmeasured]`

How the block reads at race speed in `/art-lab` · the in-game read of the vertical chamfer strip that
carries 0.3388 on the presented face · whether a base-contact seam reads per-block or as a continuous route
glow · `MARIGOLD_REFERENCE_INTENSITY`.
