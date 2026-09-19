# `art/block` — LANE STATE

**Replaces itself.** This file says where the work *is*; `LANE-BRIEF.md` says what the work *is* and does not
change. Read the brief first, then this. Written by the supervisor from the lane's first-hand reports — do
not re-derive what is here; if what you find contradicts it, stop and say so rather than quietly fixing
either one.

Last written: 2026-09-19, supervisor session **`supervisor`**, at the second context handover.
`git log -1` is authoritative for HEAD — **this file cannot name its own commit** without being one behind,
so it doesn't try.

---

## 1. Where the branch is

| | |
|---|---|
| Branch | `art/block`, worktree `../slur-worktrees/block` |
| Code commits | `9a6551b` the `/iso-block` instrument · `5c601d3` the sealed block. Base `1807bc0` (= `origin/dev` at cut) |
| Working tree | clean |
| Pushed | **yes** — `origin/art/block` at the same commit, `rev-list --left-right --count` = `0 0` |
| Verify gate | `pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build` |
| Gate result | **green** — lint "Checked 175 files, 3 warnings, 1 info" (all pre-existing `noExcessiveLinesPerFile`) + "✓ Canvas-isolation: 9 route entry modules clean"; 75 shared · **49 client (8 files)** · 4 server; SPA build |
| Ports | client **5202**, server **2602** · stack up |
| Review URL | `http://localhost:5202/iso-block` |

**Run `pnpm format` before `pnpm lint`** — biome treats formatting as a lint *error* and the gate fails on
nothing otherwise. The commit hook **rejects a `Co-Authored-By` trailer** even though your session
instructions tell you to add one; commit without it, and never bundle `git add` and `git commit` in one call.

## 2. What is built — `5c601d3`, *the sealed deadly block: shaded mass, one marigold seam*

All under `apps/client/app/routes/iso-block/` unless noted.

- **`route.tsx`** — `<IsoLab title size={FRAME_SIZE} board="10_obstacle_blocks_final.png" rig={false}>`
  wrapping `<DeepSpaceSky config={DEEP_SPACE}/>` + `<SealedBlockFamily/>`. `FRAME_SIZE = BLOCK_FAMILY.span / 2`,
  so framing derives from a tested span rather than a magic number.
- **`sealed-block.tsx`** — one `InstancedMesh` over a **unit** `<boxGeometry/>`, three instances placed in a
  **ref callback** (static data, no external system to sync, so not an effect). Deliberately **the same path
  the game uses**: judging any other arrangement would judge something the player never sees, because the
  stretch the material must survive exists only on that path. Material built once at module scope so it
  survives HMR.
- **`sealed-block-material.ts`** — `createSealedBlockMaterial()`: `MeshStandardMaterial` +
  `onBeforeCompile`, four GLSL chunk replacements, six uniforms,
  `customProgramCacheKey = 'sealed-block-v1'` so three never shares a program with a plain standard material.
- **`block-dimensions.ts`** — `BLOCK_FOOTPRINTS` (three test cases), `FAMILY_GAP = 3`, pure `layOutFamily()`,
  re-export of `BLOCK_HEIGHT` from `@slur/shared` (never a literal 8, so it cannot drift from the sim).
- **`routes.ts`** — one line after the `iso-sky` line.
- `placeholder-block.tsx` was added in `9a6551b` and **deleted** in `5c601d3`, per its own
  delete-don't-evolve header.

Riding this PR to `dev` (they exist nowhere else): `07-blocks/LANE-BRIEF.md`, `INDEX.md`,
`HANDOVER-SUPERVISOR-SESSION-6.md`.

## 3. Measured values — first-hand, do not re-derive

- `BLOCK_BASE_COLOR` **`#0B0C0F`**, roughness **0.55**, metalness **0**. Base colour and roughness are marked
  **PROVISIONAL** in the file header pending `art/track` slice 2's dark-material family — adopt those rather
  than forking a second dark-metal language. `metalness 0` because metal with no env contribution renders
  black.
- **Seam:** `SEAM_CORE_COLOR` `#FFE0A0`, `SEAM_GLOW_COLOR` `#FFB52E`, `SEAM_INSET` **0.55u** in from the
  chosen vertical corner, `SEAM_HALF_WIDTH` **0.06u** core with the visible groove running to ~**0.18u**
  half-width, `SEAM_INTENSITY` **6** (must clear 1.0 — ACES tone mapping is ON, `toneMapped` left at default
  per task 2's D3). Albedo is multiplied by `(1 - 0.75*seamTrough)`; emissive adds
  `mix(uSeamGlow, uSeamCore, seamCore) * 6 * (seamCore + 0.25*seamTrough)`. **One corner-wrap**, vertical,
  full 8u, on the two faces meeting a corner hashed from `floor(instanceMatrix[3].xz + 0.5)`. Inset is
  clamped to `blockHalf*0.5` per axis so a narrow block keeps the seam inboard instead of folding it past
  centre.
- **Bevel:** `CHAMFER` **0.18u** band on every edge.
  `lean = clamp((uChamfer - blockEdge)/uChamfer, 0, 1) * sign(vBlockPos)`, then
  `lean *= 1.0 - abs(objNormal)` so a fragment never leans along its own face axis;
  `bent = normalize(objNormal + lean)`.

> **⚠ WHY those numbers is `[unmeasured]`.** Nothing on disk records why 0.18 / 0.06 / 0.55 / 6 rather than
> neighbouring values — those choices were made in a conversation that has since been cleared. **Treat them
> as tunable-with-reason-unknown, not as pinned.** The files state the mechanism, not the derivation.

## 4. The four injection points, and the correction the lane made to its own plan

All four are replacements inside one `main()`:

1. **VERTEX after `<begin_vertex>`** — `vBlockSize = length(instanceMatrix[i].xyz)` per axis;
   `vBlockPos = position * vBlockSize`; the corner hash; `vAxisX/Y/Z = normalize(normalMatrix * unit axis)`.
   Has an `#else` branch giving `vBlockSize = vec3(1.0)` when drawn un-instanced.
2. **FRAGMENT after `<color_fragment>`** — `blockHalf`/`blockEdge`, `faceIsX`/`faceIsZ`, the inset clamp,
   `seamCore`/`seamTrough`, groove darkening. Locals stay in scope for (3) and (4).
3. **FRAGMENT after `<normal_fragment_begin>`** — the bevel lean.
4. **FRAGMENT after `<emissivemap_fragment>`** — `totalEmissiveRadiance +=`.

**The correction:** `normal_fragment_begin` leaves `normal` in **VIEW** space, so the bevel cannot write an
object-space normal directly. It builds `bent` in box-local space and re-expresses it as
`normalize(vAxisX*bent.x + vAxisY*bent.y + vAxisZ*bent.z)` — the object axes carried through `normalMatrix`
as varyings — rather than duplicating three's instanced-normal chain.

> **CITATION ERROR — fix it in the next slice.** Both `sealed-block-material.ts` and the `5c601d3` commit
> message credit **`track-instancing.ts`** for *"`put()` sets only `.position` and `.scale`"*. **That file
> does not exist on this branch** — it is `art/track`'s. The **claim is true**: `put()` lives in
> `apps/client/app/game/scene/track-view.tsx`, lines 62–63 set `.position` and `.scale`, and no
> rotation/quaternion appears anywhere in that file (verified). Only the filename is wrong — and it is the
> evidence underwriting box-local-over-triplanar, so it must not stay wrong.

## 5. The 15 tests (two files) and what they actually protect

`sealed-block-material.test.ts` (9):

- **THE AABB GATE — the load-bearing one.** `SEALED_BLOCK_VERTEX` must match neither
  `/\btransformed\s*[-+*/]?=/` nor `/\bgl_Position\s*=/`. **The mesh IS the physics hull**: the renderer
  scales this box by each block's own extents, so a detail poking outside it kills the player on apparent
  empty air. Nothing else in the stack would notice a vertex write — this test is the only thing between a
  future edit and a silent gameplay lie.
- Reads extent off `instanceMatrix` (asserts `length( instanceMatrix[ 0 ].xyz )` and `position * vBlockSize`).
- Has the non-instanced `#ifdef`/`#else` fallback.
- Seam keyed to `faceIsX`/`faceIsZ` and **never `faceIsY`** — a horizontal band implies a ledge on a block
  that is un-jumpable by design.
- Inset clamp present on both axes.
- **NO RED:** for both seam hexes, `g > 0.55*r` and `b < g`. Guards the frozen palette against ADR-009's
  `Alert Red #FF4B3E` fallback drifting in.
- Emissive actually writes `totalEmissiveRadiance`; bevel writes `normal = normalize(` and references
  `uChamfer`; bevel never leans along its own face axis.

`block-dimensions.test.ts` (6): `BLOCK_HEIGHT === 8` (because `rig={false}` drops `<ScaleReference>`, so the
height that encodes un-jumpability is asserted, not eyeballed); width/depth merely `> 0`, **deliberately
unconstrained**; three distinct aspect ratios; layout centred on origin; exact `FAMILY_GAP` between
neighbours; a single footprint has no gap.

## 6. Decisions of record — B1…B12

B1–B6 reasoning is in `HANDOVER-SUPERVISOR-SESSION-7.md` §3 and §8; B7–B12 in its §14. Headlines:

- **B1** Route is **`/iso-block`** on the existing `<IsoLab>`. Not `/art-gallery` — it imports
  `LETHAL_SURFACE` from the file `art/track` is rewriting. Not `/art-lab` — whole track, and `art/track` owns
  every file in it.
- **B2** **Contact shading is NOT this lane's gate.** No floor here, and faking one means inventing the
  dark-material value task 2 slice 2 is about to define. It is a two-ingredient composition read that gates
  in `/art-lab` *after* `art/track` merges. **This lane exists to make that later gate possible.**
- **B3** Board **`10_obstacle_blocks_final.png`**, cross-checked against
  `12_approved_scene_marigold_depth.png`, which outranks individual boards. **Dimensions from
  `ART_SCALE_REFERENCE.md` §2 only.** Crop panels at native res (`make-refs.sh crop`); they do not resolve in
  the whole poster.
- **B4** `rig={false}` + the lane's own `<DeepSpaceSky>`. No lane-local lights.
- **B5** Do not edit `iso-lab.tsx`; the 8u height is asserted in a test instead.
- **B6** **CONFIRMED ON EVIDENCE — do not add a `grid?: boolean` prop.** The lane turned the grid on looking
  for a reason to overturn B6 and found the opposite: two or three faint far-apart lines at this framing, and
  the block occludes the ones that would have read as contact. Too coarse relative to an 8u subject.
- **B7 — Material-only silhouette (owner's ruling).** No chamfer geometry; the mesh stays a literal unit box.
  The decisive argument: *"nothing protrudes outside the AABB"* becomes true **by construction** rather than
  by assertion. At 55 u/s on an 8u block the contour delta is ~1 px, so what a player sees is a rim-highlight
  band, which shading holds at constant world width and geometry cannot without stretching. Contour-breaking
  belongs to the **fractured** block, out of scope.
- **B8 — Red leaves the hazard vocabulary (owner's ruling), as intended.** Not a live choice: the frozen
  palette excludes red and `track-materials.ts`'s own header calls its values a shipped-TRON retone, not the
  handoff palette. `Alert Red #FF4B3E` stays escalation-only and stays the supervisor's.
- **B9 — Instancing: "unstretched box-local space".** Triplanar is **dead**: `put()` writes position and
  non-uniform scale and **never rotation**, so `vec3 size = vec3(length(im[0]), length(im[1]), length(im[2]))`
  *is* `(sx,sy,sz)`; triplanar exists to handle arbitrary rotation we do not have and would pay three samples
  + blend per fragment forever for it. Under `USE_INSTANCING` three already applies the inverse-scale normal
  correction, so non-uniform scale does not break normals. Extension is three-native `onBeforeCompile`;
  drei's `shaderMaterial` would discard the PBR lighting, and `three-custom-shader-material` is not installed.
- **B10 — ONE corner-wrap seam**, following the board and overriding the earlier invented *"1–2 seams placed
  asymmetrically"*: the board never shows two seams and never an asymmetric scatter. Corner chosen by hashing
  the instance translation — cosmetic, client-side, nothing to desync.
- **B11 — No mid-face horizontal seam.** A gameplay override of a board reading, and it stands: a horizontal
  band implies a ledge on an un-jumpable block. The board's only horizontal run is the top edge, where the
  bevel highlight already lives.
- **B12 — The three footprints are TEST CASES, NOT A SPEC.** **Width and depth are the generator's output,
  not the art's**, so acceptance is *"the material holds across the continuous range the generator emits"*,
  never *"it looks good at three curated sizes"*. This is the sharpest thing this lane has said; do not let it
  be quietly re-narrowed.

**What the board crops settled:** panel 3's STANDARD (DEADLY) row is CUBE (1×1) · WIDE (2×1, 3×1) · TALL
(1×2) · STACK — **half spec and half poison**, and *nothing on the board marks the difference*: take the
aspect-ratio idea, and TALL/STACK vary the one axis that must never vary. Panel 7 captions the hazard
identity — *"MONOLITHS ARE ENVIRONMENT. BLOCKS ARE HAZARDS."* (**task 4 inherits: monoliths stay off-ribbon,
unseamed and cold**). CUBE and WIDE carry **visibly the same seam thickness** — the art independently asking
for an instance-invariant world-unit feature, which killed "accept the stretch" on its own terms. Crops are
in `07-blocks/refs/` (gitignored).

## 7. THE OWNER'S GATE FINDINGS — this is the next slice

The owner looked at `/iso-block` and reported: **it reads good, but it is UNTEXTURED** — no surface detail,
no material finish. And a new requirement: **glow on the bottom edges where a block meets the track.**

**The untextured finding is confirmed from the code, first-hand:** there are **zero texture samples and zero
procedural detail functions** in the shader — no noise, no fbm, no grain, no panel breakup, no AO term, no
roughness variation (`roughness` is the constant 0.55, no map, no per-fragment modulation). The only spatial
variation on any face is the seam (~0.18u half-width, two faces) and the bevel lean (0.18u band along edges).
**Everything between those bands is a mathematically uniform surface** — same albedo, same roughness, same
normal — so a face interior has literally nothing to catch light with and would read as flat mass under *any*
rig. Flat lighting may compound it; it cannot be the cause.

> **This does NOT overturn B9, and must not be treated as doing so.** Zero *texture samples* was a
> consequence of choosing box-local space over triplanar; it was never a decision that the block should read
> as bare shaded mass. Those are separable, and letting an engineering choice silently decide an art question
> is the failure here. **The bevel already proves the mechanism procedural detail needs** — world-unit
> feature sizing, authored in box-local space, instance-invariant, zero samplers, six vertex ALU ops. Grain
> or panel breakup is the same trick again, not a new capability.

**And the boards were never read for this.** There is **no note, comment or commit line anywhere about
surface treatment, grain, panel breakup or finish.** So the board re-read that is owed is a *genuine first
read*, not a recall: crop board 10's panels at native res and read them specifically for **material
treatment, surface detail and finish**, cross-checked against board 12.

**The contact glow — constraints, first-hand, no design yet:**

- The block's own material **can** do it today with no new plumbing: `vBlockPos.y` is already available and
  already un-stretched by instance scale, so a band keyed to `(blockHalf.y + vBlockPos.y)` is constant world
  height on every footprint — the same guarantee the seam has. Cheapest, survives instancing, single
  `InstancedMesh` intact. **Its cost: the shader has no knowledge of whether a floor is under it, so it glows
  identically over a gap.** The gap case is real, not hypothetical — the generator emits full-width and
  partial floor-strip gaps (ADR-006), and B12 says acceptance is the continuous range.
- Per-instance "is grounded" would need a new `InstancedBufferAttribute` in `track-view.tsx` — **a shared
  file `art/track` owns right now.**
- A separate additive element at the base breaks the single `InstancedMesh` **and** needs its own instance
  placement pass in that same shared file.
- Floor-side authoring needs block positions exposed to the floor shader; nothing does that today, and the
  floor material is `art/track`'s to define.
- **This does not contradict B11.** B11 rejected a *mid-face* band because mid-height implies a ledge. A glow
  at the very base reads as contact with the ground, not as a foothold — different feature, different height.
  Keep it tight to the base for exactly that reason.
- **You can build it; you cannot judge it here.** No floor, and `rig={false}` means no fill. Its gate stays
  `/art-lab` after `art/track` merges, per B2. Say so rather than faking a floor.

## 8. What has NEVER been seen, and two readings that are second-hand

**The material has never been judged.** The gate proves the code sound and proves nothing about the art. What
it needs is a look at `/iso-block` with the three footprints in frame, and specifically **whether the bevel
reads at all** — the single element most likely to need tuning.

Two readings are recorded from an agent whose conversation has since been cleared, so they are **second-hand
and unre-measured**; re-take them rather than citing them:

- *The `<Lightformer>` rig's reach on a small dark object is **generous, not marginal*** — the box read as a
  clearly-lit mid blue-grey, the opposite of swallowed. **A previous supervisor's stated pass condition,
  "sparse and dark is the PASS", was WRONG for this route** and the lane's evidence overturned it. Do not
  reintroduce it.
- *The rig is very **flat*** — the two visible side faces sat at nearly the same value, almost no directional
  definition. This is what earned the bevel its complexity on evidence rather than taste: a painted edge line
  would not respond to a rig like that; a normal lean does.

## 9. Open

- The board re-read for material finish, then a design recommendation for surface detail **and** the contact
  glow, weighed on the four axes (survives non-uniform instance scale · cost per instance · needs a second
  material path · degradation at distance). **No geometry or material lands before the supervisor approves
  it.**
- The `track-instancing.ts` → `track-view.tsx` citation fix.
- Base colour and roughness stay provisional pending `art/track` slice 2. Seam and bevel are **this lane's**
  and are not downstream of that.
- A supervisor-owned shared-file fix, deliberately deferred while two lanes are live:
  `iso-lab-controls.tsx`'s copy *"rig off — the subject is lit only by itself"* was written for `/iso-sky`
  and is **false on `/iso-block`**. Not yours to touch.

## 10. Browser, and the lane that is about to make it unnecessary

A third lane, **`art/frame-tap`** (ports 5203/2603), is building an instrument to pump a frame and write a
PNG to disk over plain HTTP — no Chrome focus, no CDP. Not ready. Don't build for it, don't wait on it, and
don't invest in workarounds for the hidden-tab trap.

Until then: **`visibilityState` is the only reliable test** — canvas size proves nothing (one lane measured
3456×1926, fully mounted, rAF dead), and **`computer screenshot` FORCES a measure**, which is where the
large-canvas presentation comes from. **Never `await` a frame** through `javascript_tool` — it hangs the CDP
evaluate to its 45 s timeout, and that hang is the diagnosis; install a free-running counter and read it on a
**later** call. **Tab groups are per-session**, so a restarted agent cannot adopt its predecessor's tab —
**never record a tab id here**, record the URL. Create your own, pass its `tabId` every call, match on **your
own port (5202)**, and never touch `:5201` or `:5203`.

**One supervisor, and it is the session named `supervisor`.** Twice this project has had two supervisor
sessions instructing one lane at once, because a `--fork-session --resume` kept running detached after its
window closed. **Both times the lane was the only party that could see both voices, and escalating rather
than picking is what caught it.** If a second voice appears, say so and keep following this one until told
otherwise in writing.
