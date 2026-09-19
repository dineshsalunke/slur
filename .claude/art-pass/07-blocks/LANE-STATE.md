# `art/block` — LANE STATE

**Replaces itself.** This file says where the work *is*; `LANE-BRIEF.md` says what the work *is* and does not
change. Read the brief first, then this. Written by the supervisor from the lane's first-hand reports — do
not re-derive what is here; if what you find contradicts it, stop and say so rather than quietly fixing
either one.

Last written: 2026-09-19, supervisor session, at the first context handover. `git log -1` is authoritative
for HEAD — **this file cannot name its own commit** without being one behind, so it doesn't try. The only
code commit is `9a6551b`.

---

## 1. Where the branch is

| | |
|---|---|
| Branch | `art/block`, worktree `../slur-worktrees/block` |
| Code commit | `9a6551b` — `art(block): the /iso-block instrument, lit by the shipped rig`. Parent `1807bc0` (= `origin/dev` at cut) |
| Working tree | clean at handover |
| Pushed | **no** — push early; commits in a worktree exist nowhere else |
| Verify gate | `pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build` |
| Gate result | **green** — lint "Checked 173 files. Found 3 warnings. Found 1 info." (all 3 pre-existing `noExcessiveLinesPerFile`, incl. `packages/shared/src/sim/track.ts` at 362 lines) + "✓ Canvas-isolation: **9** route entry modules clean"; 75 shared · 36 client (7 files) · 4 server; SPA build |
| Ports | client **5202**, server **2602** · stack up at handover |
| Review URL | `http://localhost:5202/iso-block` |
| Chrome tab | `253884490`, parked on that URL. **Adopt it, don't create another** — see §7 |

**Run `pnpm format` before `pnpm lint`** — biome treats formatting as a lint *error* and the gate fails on
nothing otherwise.

## 2. What is built — `9a6551b`

Four new files under `apps/client/app/routes/iso-block/`, one line in `routes.ts`
(`route( 'iso-block', 'routes/iso-block/route.tsx' ),` placed after the `iso-sky` line), plus three
supervisor docs that reach `dev` only through this lane's PR.

- **`route.tsx`** — `<IsoLab title="Sealed deadly block" size={8} board="10_obstacle_blocks_final.png"
  rig={false}>` wrapping a `<Fragment>` of `<DeepSpaceSky config={DEEP_SPACE} />` + `<PlaceholderBlock />`.
  `rig={false}` is decision **B4**: `<IsoLab>`'s own rig is a lane-local `ambientLight` + `directionalLight`,
  the very thing task 2's D4 deleted from `/art-lab`, so the only way to be lit by the *shipped* rig is to
  switch the lab's off and mount `DeepSpaceSky` in the route's children — the `/iso-sky` pattern.
- **`placeholder-block.tsx`** — one `<mesh position={[0, height/2, 0]}>` with `boxGeometry` and
  `meshStandardMaterial color="#6b7280" roughness={0.7} metalness={0}`, sitting *on* the ground plane.
  Header says delete-don't-evolve. **It deliberately does NOT import `LETHAL_SURFACE`**, for two independent
  reasons: that material's `emissive: '#ff2740'` is the red the frozen palette excludes, and its
  `toneMapped: false` is exactly what D3 removes — so importing it for convenience drags both into this lane,
  and a placeholder wearing the shipped red reads as a decision someone took. A neutral box reads as
  undesigned, which is what a placeholder should read as.
- **`block-dimensions.ts`** — `PLACEHOLDER_BLOCK = { width: 4, height: BLOCK_HEIGHT, depth: 8 }` as const,
  with `height` **imported from `@slur/shared`**, never a literal 8, so it cannot drift from the sim. Split
  from the component solely so the test runs on vitest's node env without pulling React in.
- **`block-dimensions.test.ts`** — two separate assertions: `BLOCK_HEIGHT === 8` pins the sim constant, and
  `PLACEHOLDER_BLOCK.height === BLOCK_HEIGHT` pins the subject to it. A second test asserts width/depth are
  merely `> 0` — deliberately *unconstrained*, because width and depth are free.

## 3. NOT done, and must not be reported as done

- **Nothing about the block itself is designed.** No silhouette, no seams, no material. The commit is the
  *instrument* plus a throwaway grey box.
- **`/iso-block` is NOT confirmed to render.** The gate proves the code sound, not that anything is on
  screen. See §4.
- **The branch is unpushed.**
- **`curl` returning 200 proves nothing about WebGL.** The lane verified `/iso-block` → 200 and `/` → 200
  before touching Chrome; that means the stack serves the route, and is easy to mistake for progress.

## 4. The render check — needs the owner to foreground Chrome

Measured twice, including after a full reload, on tab `253884490`:

- `document.visibilityState: "hidden"`, `hasFocus: false`
- canvas `width/height` and `clientWidth/Height` all **`300×150`** — the unsized HTML default. R3F never
  resized it, so **rAF has never run**.
- `read_console_messages` filtered on `error|Error|warn|Warning|THREE|failed|Cannot|undefined`: **no
  messages** (tracking starts at the first call, so this covers the post-reload load).

**The DOM half is verified correct**, which is the useful part obtainable without a foreground tab —
verbatim from `body.innerText`: `"Sealed deadly block"`, `"Subject framed at 8u · rig off — the subject is
lit only by itself"`, `"REFERENCE BOARD"`, `"★ Nebula backdrop (boards' sky)"` and the board list. So the
route resolves, `<IsoLab>` mounted with `rig={false}` as intended, and the board picker is populated. Only
the WebGL frame is unproven.

> **Both hidden-tab presentations are now on record.** This lane: `300×150`, never resized — the classic
> signature. The `art/track` lane: **`3456×1926`, fully mounted, rAF dead.** So **canvas size confirms the
> trap when it is small and proves nothing when it is large.** `visibilityState` is the only reliable test,
> and it must be re-checked on every call — foregrounded now is not foregrounded in five minutes. A rAF-based
> probe through `javascript_tool` will also *hang* the CDP evaluate to its 45s timeout; that hang is the
> diagnosis, not a frozen renderer. **A black frame is never evidence about the block.**

**Pass condition, stated before the look rather than after:** a small grey box (4 × 8 × 8u) on the ground
plane in a near-black field, faint nebula behind, no fill light, dark sides going fully black. **Sparse and
dark is the PASS.** If the placeholder is swallowed entirely, that is information about the `<Lightformer>`
rig's reach on a small dark object — **not** a reason to add a light. If this block needs lane-local fill to
look good, the block is wrong, not the lighting.

## 5. Decisions of record (B1–B6)

Reasoning in `HANDOVER-SUPERVISOR-SESSION-7.md` §3. Headlines:

- **B1** Route is **`/iso-block`** on the existing `<IsoLab>`. Not `/art-gallery` — it is *coupled to the
  file `art/track` is rewriting* (`routes/art-gallery/subjects.tsx:7-9` imports `LETHAL_SURFACE` from
  `game/scene/track-materials`, used at lines 103/130/149/153). Not `/art-lab` — whole track, and `art/track`
  owns every file in it.
- **B2** **Contact shading is NOT this lane's gate.** An isolated route has no floor, and faking one means
  inventing the dark-material value task 2 slice 2 is about to define. It is a two-ingredient composition
  read that gates in `/art-lab` *after* `art/track` merges and the block is wired into the instanced blocks.
  **This lane exists to make that later gate possible, not to pre-empt it.**
- **B3** Board is **`docs/art-direction/boards/10_obstacle_blocks_final.png`** (the golden reference named in
  `handoff/04_OBSTACLES.md`), checked against `12_approved_scene_marigold_depth.png`, which outranks
  individual boards. Board 10 = asset identity; board 12 = does the material belong to the world.
  **Dimensions from `ART_SCALE_REFERENCE.md` §2 only** — board 10 is explicitly "no variable height, no cell
  notation, no vertical stacks" and *depicts disallowed stacks*. Crop its panels at native resolution via
  `make-refs.sh crop`; they do not resolve when the 1536×1024 poster is read whole.
- **B4** Lighting: `rig={false}` + the lane's own `<DeepSpaceSky config={DEEP_SPACE} />`. No lane-local
  lights. Neutral rig is a one-click sanity check, never the gate.
- **B5** **Do not edit `iso-lab.tsx` to decouple the scale ruler.** The 8u height is asserted in a test
  instead — stronger for a dimension that encodes un-jumpability, and it avoids a shared-file change while a
  second lane is live. The ruler's emissive cyan `#3BD6FF` is off-palette and a bloom magnet next to a dark
  block, so losing it with `rig={false}` is a feature.
- **B6** **The grid stays one-click; do not add a `grid?: boolean` prop yet.** It is the clean fix and is
  noted as such, but it buys one click per page load and costs a change to a shared file every other
  `/iso-*` route depends on. Revisit after one of the two lanes merges. **If the grid turns out load-bearing
  for judging lateral proportion rather than a nicety, that is a different trade — come back for it.**

## 6. `<IsoLab>` internals — measured, not skimmed

Do not re-derive these.

- Props are exactly `title`, `size`, `board`, `children`, `rig`. **No `grid` prop, no `bloom` prop.**
- **`grid` is `useState( rig )`** — initialised *from* `rig`, so `rig={false}` silently starts the grid off
  too. Deliberate per its comment ("a ground plane under a sky is noise, a ground plane under a monolith is
  the scale read"), but **the failure is quiet**: you pass `rig={false}` for lighting reasons and lose your
  scale grid with no signal.
- **`<ScaleReference>` sits under the SAME `rig ?` ternary as the ambient+directional pair** — ruler and
  lights are one switch, not two. Ruler is `emissive="#3BD6FF"`, `emissiveIntensity` 0.9 (ticks alternate
  0.8/0.3).
- The lab rig itself: `<ambientLight intensity={0.5} />` + `<directionalLight position={[dist, dist*1.6,
  -dist]} intensity={0.8} />`.
- Camera `fov 45`, `position [dist*0.6, dist*0.45, dist]` where `dist = Math.max(12, size * 1.9)`. **With
  `size={8}` the `max(12, …)` floor binds** (15.2 wins) — so **`size` is essentially inert for framing any
  subject below ~6.3u.** Anyone tuning a small subject via `size` will find it does nothing.
- `OrbitControls` target is `[0, size*0.35, 0]` → y=2.8 at size 8, i.e. *below* the 4u mid-height of an 8u
  block. Slightly low, judged fine.
- The Canvas is `memo`'d and `children` identity comes from the route's render, so panel slider drags do not
  reconcile the R3F subtree.

**A shared-file fix the SUPERVISOR owns — do not make it.** `iso-lab-controls.tsx` renders
*"rig off — the subject is lit only by itself"*. That was written for `/iso-sky`, where the subject **is**
the light source; on `/iso-block` it is false and will mislead whoever reads the panel mid-gate. Confirmed
rendering on this route. Scheduled for after one lane merges, alongside B6.

## 7. Chrome tab protocol — query before create; the PORT is the tag

The owner sees a stray empty tab each time a lane opens a page, and asked for per-lane tab tagging. **Each
lane's dev port already is one** — this lane is `localhost:5202`, `art/track` is `localhost:5201`.

1. Call **`tabs_context_mcp` FIRST**, every time, and **reuse** your own tab if it exists (`253884490`).
2. `tabs_create_mcp` **only** when no tab of yours is present.
3. Match on **your own port**. **Never adopt a tab on `5201`** — that is the other lane's, and taking it
   means the two lanes diagnose each other's page.
4. Several of your own → keep the one already on the route you want and **leave the rest alone**. Don't tidy
   the owner's browser.
5. `<title>` is a usable secondary check (`SLUR — Iso Lab · Blocks`) but the port cannot collide.

`claude-in-chrome` tools only — never Playwright/Puppeteer. The value is that lane and owner watch the
**same live tab**, so review is a glance, not a screenshot round-trip. *Unverified:* the cause of the stray
blank tab. Not diagnosed; don't repeat a guess as fact.

## 8. NEXT — the design recommendation. No geometry or material lands before the supervisor approves it.

Deliver: **silhouette family · seam language (the lane's own call, with reasoning) · the instancing
decision** weighed on four axes — *survives non-uniform instance scale · cost per instance · needs a second
material path · degradation at distance* — with ≥5 candidates, per project non-negotiable #14.

**The previous agent's preliminary thinking is below. It is UN-RESEARCHED — board 10's panels were never
cropped and `track-instancing.ts` was never read. Treat every ranking as a prior to be tested, not a
finding.** It is recorded because it is reasoning that would otherwise be re-derived at full price, not
because it is right.

**Instancing, tentative ranking:**
1. **Triplanar / world-space material on a plain box — likely winner.** The only candidate scale-invariant
   *by construction*: feature size is set in world units, so a 4-wide and a 5.5-wide block get identical
   seam width for free. Survives non-uniform scale definitionally; 3 samples + blend per fragment, no
   per-instance CPU work; no second material path; mips degrade gracefully. Also satisfies the standing
   "size texture features in world units, not pixels" rule — the same trap in different clothing.
2. **World-position-derived UVs.** Cheaper (1 sample) but needs a dominant-axis choice, so it gets ugly
   exactly on the chamfered inward-detail edges that *are* the design. Benchmark against triplanar only if
   fill cost bites.
3. **Material-only detail, geometry stays a literal box.** Cheapest, zero silhouette risk (the AABB *is* the
   box, so nothing can protrude). But the brief's read is "sealed mass" carried by **silhouette**, and
   ADR-010 requires the sealed/fractured distinction to break the **outer contour** — so this probably
   cannot carry hazard identity alone. Good fallback.
4. **Per-size geometry variants.** Exact authored chamfers, but one draw call per variant breaks the single
   `InstancedMesh` win, and block widths are continuous so the variant set is arbitrary. Rejected unless the
   family collapses to ≤3 discrete footprints.
5. **Accept the stretch — rejected on sight.** A chamfer that changes width with the instance is a
   silhouette lie, and silhouette is the whole spec.

**Unresolved and load-bearing:** is the chamfer *geometry* at all, or can a world-space normal/AO trick fake
the inward bevel well enough at race speed? That decides whether the instanced unit box stays literally a box.

**Silhouette family, tentative:** a constant-8u **"cut slab" family** — one material world, footprints
varying in width/depth only, per `ART_SCALE_REFERENCE.md` §2's own framing of "a wall of 8u-tall mass, cut to
arbitrary widths". Candidate trio (needs board 10 crops before defending): narrow deep pillar ~3.5 × 6;
squarish chunk ~5.5 × 5.5 (one of GDD §0's stated-legal examples); wide shallow slab ~7 × 3.5. **Aspect ratio
is the variation axis — never height, never a new motif.** Inward chamfer at the top edges to catch a rim
highlight and separate the block from a flat floor.

**Seams, tentative — the lane's call, not the board's** (`04_OBSTACLES.md` says only "sparse marigold seams",
no count/placement/width): **1–2 per block, vertical, full 8u height, placed off-centre and asymmetrically**,
width ~0.1–0.15u *in world units* so it is instance-invariant. Reasoning: "sparse" is the only adjective
given; asymmetry stops three footprints reading as one repeated asset; full-height verticals reinforce the
un-jumpable 8u instead of fighting it; and a **horizontal** seam risks implying a ledge or step, which is a
gameplay lie on an un-jumpable block. **Avoid a seam *grid*** — ADR-010's OQ6 answer rejects it outright.

**Hazard identity vs monoliths (task 4 inherits this):** working answer is **contact with the floor plus
marigold seam energy**. A hazard block *sits on the ribbon* and is small (8u against a 200–400u obelisk), so
scale + groundedness + being the only warm energy in the near field carry "this one can kill you". Task 4's
constraint falls out: **monoliths stay off-ribbon, unseamed and cold.**

## 9. Escalate, don't decide

Use the `NEEDS-DECISION` / `CONTEXT` / `OPTION` / `RECOMMENDATION` / `IF NO ANSWER` shape to the supervisor.
Escalate art and taste calls, anything reopening a frozen decision or ADR, anything touching gameplay
(**hazard readability is gameplay, not art-only**), and your research recommendation *before* implementing.
Do **not** escalate naming, file layout, or anything settleable by verifying — verify instead. Never ask the
owner directly. **Never treat silence as approval.**

**The standing trap:** ADR-009's fallback proposes `Alert Red #FF4B3E` on sealed blocks if silhouette alone
fails. That contradicts the frozen no-red palette. **Not this lane's to take — escalate it.**

## 10. Housekeeping

`git add` and `git commit` go in **separate** Bash calls — a hook rejection kills the whole call otherwise.
**No `Co-Authored-By` trailer:** the session-level attribution instruction asks for one and this repo's hook
rejects it. **The repo rule wins.**

`07-blocks/LANE-BRIEF.md`, `INDEX.md` and `HANDOVER-SUPERVISOR-SESSION-6.md` rode into `9a6551b`; this file
and `HANDOVER-SUPERVISOR-SESSION-7.md` follow. They are untracked in the shared checkout and reach `dev`
only through this lane's PR.
