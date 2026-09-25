# 2026-09-21 — Track look & materials: the plan

Procedurally building the track's **models and materials**. This file is the durable artifact: it is
written to be read cold by a lane agent who has never seen the reference boards.

**Status: all three decisions settled by the owner 2026-09-21 (§3). Nothing blocks — ready for a lane.**

---

## 0. The single most important finding

**The material sheet already exists.** `docs/ART_MATERIALS.md` specifies nine material families with
concrete numbers, an element→material map (`:399-419`) and marigold intensity tiers (`:423-461`).
**Do not re-derive it.** The track's families are already written:

| Family | Element | Spec (quoted from `docs/ART_MATERIALS.md`) |
|---|---|---|
| **M1 Track graphite** | the deck | "bare conductor", metalness **1.0**, roughness **0.35–0.50**, base colour between `#0A1117` and `#303C45`; panels are **"4u tiles in breaking bond — 16 across the 64u ribbon, alternate rows offset 2u"** (`:93,118-134`); joints **0.2–0.8u**, "dark by default, low contrast… Sparse emissive inserts permitted" (`:95,502`) |
| **M7 Marigold emissive** | boundary, seam inserts, gap rims | anchors `#F59A24` / `#FFB52E` / `#FFE0A0` (hot core gameplay-tier only); gameplay reference intensity **1.0**, "the track boundary strip defines it"; environmental **≤0.25 of gameplay** (`:303-350,423-461`) |
| **M8 Gap slab edges** | the cut faces of a gap | M1 family; side walls roughness **0.50–0.65**; rim is "thin M7 edge definition + slight inner-lip illumination" (`:352-375`) |

Dimensions come from `docs/ART_SCALE_REFERENCE.md`, which **overrides every number printed on a board**:
track **64u** wide (`HALF_WIDTH=32`), segment **20u**, total **8000u**, rail **1u × 1u** with a
**0.15u** chamfer, pivot at **±32.5** exactly.

**ADR-012 is the hard constraint on all edge work** (`ART_SCALE_REFERENCE.md:46-58`): *"The deck's
rendered top face ends at exactly ±HALF_WIDTH, always… Nothing that is drawn may move where the deck is
drawn to end."* The sim's floor spans ±HALF_WIDTH unconditionally
(`packages/shared/src/sim/track.ts:133`). Art may not move the play boundary.

So the work is **implementation**, not authorship of a new sheet.

---

## 1. The reference boards

**Board A — `docs/art-direction/progression/calm.png`** ("MONOLITH CORRIDOR / CALM"), the CALM rung of
Codex's approved progression (calm → balanced → intense), Monolith Corridor being the selected
enclosure motif (`docs/art-direction/README.md:13`).

**Board B — the gameplay mock ("gaps and seams")**, supplied by the owner 2026-09-21. **Not in the
repo.** It came in as a pasted image; `docs/art-direction/` is ChatGPT's read-only workspace, so Claude
cannot file it. **Owner action: put board B into the package on the ChatGPT side**, otherwise the
written reading below is the only durable record of it.

### What the boards show (durable reading — the boards may be unavailable to the lane)

**Deck.** Large near-black slabs, polished but **not mirror**: marigold reflections smear into long
vertical streaks rather than crisp images — low roughness plus fine micro-detail. Fine crack networks
run through the centre lane; wear is **in the slab**, not a decal on top. Board B's deck reads dustier
and more matte than board A's, with wider slabs.

**Three emissive tiers, and they are not equal.**
1. **Edge rails** — continuous, unbroken, the brightest thing in frame. They are what tells a player
   where the track ends.
2. **Lateral seams** — short **dashed** marigold segments between slabs.
3. **Longitudinal seams** — mostly dark, occasional dashes on board A; on board B several run
   **continuous** and bright.

That A→B difference looks deliberate: **seam density and brightness are a progression dial**
(calm → balanced → intense), not a constant. Build it as a parameter.

**Gaps (board B).** Cut **through** the ribbon. **What shows through is the scene background — the
nebula and starfield — and nothing else** (owner, 2026-09-21). There is no substrate, no debris layer,
nothing rendered beneath the deck, and **none needs building**: a gap is a true hole and the existing
sky dome is already behind it. Shapes are **notched, not rectangular**: they step along slab
boundaries, with partial floor strips surviving beside them (which matches the existing generator's
"full-width + partial floor-strip" gaps). Every cut edge carries a marigold line along the inner lip;
that rim is what makes a hole read lethal rather than dark.

**Lighting.** The only cool light in either frame is the sky — milky-way band, planet-limb rim, faint
dust. Everything on the ground is marigold. Ambient fill is effectively zero, consistent with the
direction's *"there is no fill; shadow sides go black"* and *"No global orange wash or bright blue
ambient fill"* (`ART_MATERIALS.md:681`, quoting `track/24_track_BRIEF.md`).

**Deliberately out of scope** (per the owner, 2026-09-21): monoliths, asteroids, obstacle blocks,
vehicles, ingredients. This task is **the track ribbon only** — deck, seams, rails, gaps. Where the
boards show those elements, read them as context for the deck's lighting, not as work.

---

## 2. State of the code (verified 2026-09-21)

- **Deck** — `track-floor.tsx` builds **one static `BufferGeometry`** per track by hand-pushing quads
  (`emitSpan`/`pushQuad`), not instanced; `meshStandardMaterial` + `trackSurfaceTexture()`.
- **Seam/edge glow is NOT emissive meshes.** It is a **shader uniform array** (`emitter-array.ts`)
  patched onto the floor material (`patchEmitterLight`) and fed per frame from `buildRailRuns`. Know
  this before "adding" seam lights — the mechanism exists.
- **Boundary** — separate mesh (`buildBoundaryGeometry`), `BOUNDARY_W/H = 1.0` (matches the 1u × 1u
  scale ref), emissive marigold.
- **Blocks** — two `InstancedMesh`es, plain box + flat emissive material, a placeholder against M2.
  **Out of scope — noted only so nobody "fixes" it in passing.**
- **Values** — `FLOOR_ROUGHNESS=0.4` (inside M1's band), `FLOOR_METALNESS=0.75` (**not** M1's 1.0 —
  recorded as a departure), `MARIGOLD_REFERENCE_INTENSITY=2.0`, `ENVIRONMENTAL_MARIGOLD_FRACTION=0.25`.
- **Lighting** — `AMBIENT_INTENSITY = 0` plus a `<ColdKey />`, as of commit `cf1c98c` (2026-09-21).
- **Bloom** — single global `<EffectComposer><TunedBloom/></EffectComposer>` in `net-canvas.tsx`, params
  from `env-config.ts`'s `GRID_VOID` (`intensity 1.2, threshold 0.42, smoothing 0.2, radius 0.6,
  levels 4`). Pinned stack: three **0.185.1**, R3F **9.7.0**, drei **10.7.8**, postprocessing **3.0.4**.

### Two code-level defects found while planning

1. **`ART_MATERIALS.md` §7 item 10 is STALE.** It records `AMBIENT_INTENSITY = 1` as an undeclared
   white fill contradicting the package. The code now has `0` and a `<ColdKey/>` (commit `cf1c98c`).
   The doc's own open question *"Does the deck get a key from above?"* (`:524`) appears **answered in
   code but never written down**. Read `cold-key.tsx` before trusting §5/§7 on deck lighting, and fix
   the sheet.
2. **No `toneMapped={false}` found on any track material** — not in `track-materials.ts`,
   `track-boundary.tsx` or `track-blocks.tsx` — despite `conventions/r3f.md:11-12`: *"Neon bloom = HDR
   emissive + `toneMapped={false}` + one `<Bloom mipmapBlur>`."* Not exhaustively audited at every
   prop-spread site. **Verify first** — if it is genuinely missing, every emissive on the track is
   being tone-mapped before bloom, and no amount of material tuning will look right.

---

## 3. The open decisions (OWNER'S CALL — these block work)

*Two further forks — whether obstacle blocks self-emit, and whether they are M2 coated metal or
engineered stone — are **deferred with the blocks themselves**, out of this task's scope. They are
recorded in `docs/ART_MATERIALS.md` §5 and matter whenever blocks are picked up again.*

**D1 — RESOLVED: direction changes MAY be proposed, if the blast radius is small.** Small means it
changes one surface or one treatment, not the palette, the camera or the progression. Every proposal
goes in a *decisions + departures* section quoting the package wording it changes (shape:
`ART_MATERIALS.md` §7), for the owner to paste to Codex. **Never edit `docs/art-direction/` — a silent
edit there is invisible to Codex and desynchronises both sides.** If a change would touch more than one
surface, stop and ask rather than widening it.

**D2 — RESOLVED: FLUSH rail.** The rail is **flush and coplanar with the deck, zero air gap**, which is
what the archived brief always asked for — so this *reverses* the raised-bar resolution and the
departure recorded at `ART_MATERIALS.md:330-343`. Two consequences the lane must carry out:
**(a)** the code ships **raised** today (`BOUNDARY_H = 1.0`, a lipped box) — that is now wrong and W4
is a geometry change, not a finish pass; **(b)** `ART_MATERIALS.md` §7's raised-rail departure is no
longer a departure and must be rewritten to record the reversal, since we are back in line with the
package. ADR-012 is unaffected and still governs: the deck's top face ends at exactly ±HALF_WIDTH, the
boundary occupies [32, 33] beside it, pivot ±32.5 — never ±32, never ±33.

**D3 — RESOLVED by the owner (2026-09-21): a stripped playable test level, raced in a hosted room.**
No route is restored — `/art-lab` and `/art-gallery` stay deleted. The instrument is **W-T** below:
the real ribbon, the real chase camera, the real sim, with every hazard removed so nothing competes
with the surface for attention. Judged in motion at speed, which is the package's own standard.

---

## 4. Work packages for the lane

**The track ribbon only** — deck, seams, rails, gaps. Ordered so nothing blocks on D1–D3 until it must.
**W0 first, always.**

**W0 — Verify the rendering path before touching materials.** (1) Audit every track material JSX site
for `toneMapped={false}`; fix if missing. (2) Read `cold-key.tsx` and write down what the deck's key
actually is. (3) Correct `ART_MATERIALS.md` §7 item 10 (the ambient fill is gone) and close §5's "does
the deck get a key" question. *No visual work is trustworthy until W0 is done.*

**W-T — The test level. Build this FIRST, right after W0.** A playable ribbon with **no hazards at
all**: no deadly blocks, no drag blocks, no pickups, no projectiles. Deck, rails, seams and gaps only —
exactly the four things this task is about, and nothing else drawing the eye.

Ship it as a **`TrackDescriptor` variant resolved through the existing provider** (ADR-001's
`resolveTrack`) — **not** a new route, **not** a second generator. The descriptor is synced, both ends
materialize the same `Track` from it, and the shared `simulate()` is untouched; that is the whole
load-bearing contract and this must not bend it. In practice: the generator's block density goes to
zero and gaps stay. That is the level.

It still honours the invariants it does not get to opt out of: the floor spans ±HALF_WIDTH
unconditionally (`packages/shared/src/sim/track.ts:133`), and threadable clearance (`MIN_CLEAR = 7u`,
GDD §0) is a property of the generator, not of the art. Race it from a hosted room (`/game/:roomId` —
the host can start solo, there is no min-player gate).

**Keep it in the repo.** It is the standing instrument for every later art change on the ribbon, not a
throwaway scaffold — which is what `/art-lab` was, and why its deletion cost us one.

**W1 — Deck panelisation to M1.** 4u tiles in breaking bond, 16 across the 64u ribbon, alternate rows
offset 2u; joints 0.2–0.8u, dark, low contrast. Decide procedural-texture vs geometry seams. Resolve
`FLOOR_METALNESS` 0.75 → M1's 1.0, or record why not. Watch the sheet's own open worry: whether
transverse joints **re-alias into stripes at distance** (`:494-544`) — check at speed, not in a still.

**W2 — Seam emissives as a progression dial.** Continuous rails (brightest) · dashed laterals ·
mostly-dark longitudinals, with density/brightness parameterised calm → balanced → intense. Reuse the
existing `emitter-array.ts` uniform path; do **not** add a second mechanism. Respect the tiers:
gameplay = 1.0, environmental ≤ 0.25. Forbidden by the package: *"no racing line, no safe-route glow,
no fully glowing tile grid, no marked driving lanes."*

**W3 — Gaps: cut faces and lit rims.** M8 side walls (roughness 0.50–0.65) with a thin M7 rim and
inner-lip illumination. **Nothing is built below the deck** — the hole shows the scene background
straight through. So the job is the cut geometry and its rim, plus verifying that the dome actually
reads through a gap at speed and that no ground plane, fog or dome-gradient term greys it out. Must not
disturb the sim: gaps are already generated, this is art only.

**W4 — Rails, FLUSH (D2).** Coplanar with the deck, zero air gap, no raised lip, no ornamental edge
machinery. Brightest emissive tier, continuous and unbroken — it is what tells a player where the track
ends. **This is a geometry change**: `BOUNDARY_H = 1.0` currently builds a raised box and has to go
flat. `RAIL_W` stays 1u, the pivot stays ±32.5, the deck's top face still ends at exactly ±HALF_WIDTH
(ADR-012). Also update `ART_MATERIALS.md` §7 per D2 — the raised-rail departure is reversed, not
amended. Check the chamfer still earns its place once the bar is flat; it may not.

**Housekeeping (independent, do anytime):** `env-config.ts` still carries three named variants A/B/C
with blue `#1e6fff` and magenta `#ff2bd6` walls; only `GRID_VOID` (C) is wired up. Two-thirds of it
contradicts *"marigold is the single accent family"* (`AUDIT.md:111`). Confirm with the owner, then
delete.

---

## 5. Verification

Every package is judged **in motion, at speed** — never from a still (the golden direction already
notes the approved image *"still exaggerates blur relative to the verbal target"*). Which instrument
is **D3**.

Gate: `pnpm typecheck` · `pnpm lint` · tests · `pnpm build`. Comment rule #15 applies — **no comments**
except one line each on `setTimeout`/`setInterval`/`useEffect`; the mechanism weighing for any
per-frame decision goes in the **PR body** (#14).

Authority order, highest first: **`docs/ART_SCALE_REFERENCE.md`** (dimensions, overrides every board
number) → **`docs/ART_MATERIALS.md`** (surfaces) → **`docs/art-direction/`** (look; READ-ONLY, never
edit) → the boards (LOOK, never SIZE).

---

## 6. Open, for the owner

- **All three decisions are settled** (§3): direction changes allowed at small blast radius · flush
  rail · the W-T test level is the instrument.
- **Board B is not in the repo** — file it on the ChatGPT side, or §1's written reading is all the lane gets.
- Scope is the track ribbon only. Monoliths, asteroids, blocks, vehicles and ingredients are out, by
  the owner's instruction 2026-09-21 — including the two block-material forks noted in §3.
