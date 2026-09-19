# LANE BRIEF — the SEALED deadly block

**Branch** `art/block` · **worktree** `../slur-worktrees/block` · **base** fresh `origin/dev` · **ports**
`CLIENT_PORT=5202`, `VITE_SERVER_PORT=2602` (5200/2600 and 5201/2601 are taken by other lanes).

Written by the supervisor. **You execute; you do not write briefs, decision records or handovers** — report
first-hand facts and the supervisor writes the prose.

**This lane runs in parallel with `art/track`.** That is only safe because you work in your **own isolation
route** and touch none of the files it is rewriting. Read §6 before you create a single file.

---

## 0. Read these first

1. **`docs/art-direction/handoff/04_OBSTACLES.md`** — the frozen direction. Short; read all of it.
2. **`docs/ART_SCALE_REFERENCE.md` §2** — "Obstacle blocks: **only the height is fixed**". The sole
   dimensional authority. It overrides every number printed on every board.
3. **`docs/DECISIONS.md` ADR-009** — so you know what you are **not** building, and why (§2 here).
4. **`.claude/art-pass/INDEX.md`** §2 (authority order + palette) and §4 (standing facts).
5. **`conventions/r3f.md`** — installed-stack idioms, non-negotiable.
6. **`apps/client/app/routes/iso-monolith/`** — the exemplar for the instrument you are about to build.

**Board:** `10_obstacle_blocks_final.png` is the golden reference for **material and silhouette language
only**. `INDEX.md` §2 records that board 10 *"depicts disallowed stacks"* and that only boards 03 and 04 are
scale-trustworthy. **Take the look, never the size.** The boards will not be reshot; do not ask.

---

## 1. What you are building

**The sealed deadly block — silhouette and material. One thing.**

The frozen read, verbatim from `04_OBSTACLES.md`: *clean · solid · monolithic · simple silhouette · dark
material family shared with track/world · sparse marigold seams*, landing at a glance as:

> **sealed mass — avoid it**

And its explicit prohibition: *"Avoid unnecessary chips, decals, greebles, or decorative damage."* This is a
restraint exercise. The block is a **mass**, not a model.

---

## 2. What you are NOT building, and why it matters

### Not the fractured / destructible block

`docs/DECISIONS.md` **ADR-009** proposes merging slow blocks and destructible blocks into one *breakable
block* primitive — sealed (deadly, unchanged) versus fractured (shoot it to clear the path, or smash through
and pay a speed tax). It is **`PROPOSED`, not accepted**, and it says so itself: *"gated on the readability
test below. **Do not build until that gate passes.**"*

That gate is a live experiment nobody has run: *at 55 u/s on the real chase camera, can a player reliably
tell sealed from fractured with enough time to react?* Closing on an 8u block leaves roughly half a second.

**You are building only the half the ADR leaves unchanged.** ADR-009's own table: *"**Sealed** | solid,
monolithic, sparse seams | **deadly** — kills on contact (unchanged)"*. That is shipped gameplay. Building it
is not a bet on the ADR either way, which is exactly why this lane can run now.

**If you find yourself designing a crack, stop.** That is the other lane's experiment, and it carries a sim
change, a networking change (blocks gain a synced destroyed flag) and a fairness-validator change with it.

### Not the amber drag block

ADR-009 proposes deleting it as a separate primitive. Arting it now is likely throwaway. Leave
`DRAG_SURFACE` exactly as it is.

### Not a support colour, ever

If anything pushes you toward a red hazard cue: the palette is **warm ramp only** — `#FFE0A0` warm core →
`#FFB52E` hot amber → `#F59A24` marigold falloff, against cold desaturated environment. *"No cyan, no
magenta, no red. A red hazard colour code is explicitly excluded."* ADR-009 contains a fallback proposing
`Alert Red #FF4B3E`; that fallback **contradicts the frozen palette**, is not yours to take, and is not in
play for the sealed block anyway. Escalate rather than reach for it.

---

## 3. The hard constraints — each is a way to fail invisibly

### 3a. WYSIWYG: the mesh IS the physics hull

Blocks are discrete AABBs and the renderer sizes each instance from its **own** `[x0,x1]×[y0,y1]×[z0,z1]`,
so what you see is exactly what the ship's footprint tests against. **Nothing may protrude outside the AABB.**
A silhouette detail that juts out kills the player on apparent empty air; a detail carved in makes solid mass
look passable. Chamfers, bevels and seam recesses are therefore **inward only**.

### 3b. Height is 8u. Always. Never vary it.

`BLOCK_HEIGHT = 8` — *"cube top (y) = 2 cells. **ABOVE double-jump reach on purpose → UN-jumpable**: strafe
around, never hop."* A block drawn short enough to look hoppable is a gameplay lie that gets players killed.

**Width and depth are FREE** — GDD §0 is explicit that today's 4u × 8u is *"a generation artifact, not a
rule — any size is legal"*, and offers `5.5 × 5.5 × 8u` and `3.5 × 5 × 8u` as legal examples. **That freedom
is your entire silhouette budget.** Vary width and depth for interest; never the height.

### 3c. Instancing distorts authored detail — design around it

Blocks render as an `InstancedMesh` whose per-instance transform **scales a unit box** by the block's real
dimensions. So a chamfer authored on a 4×8 block is **stretched** on a 5.5×5.5 block, and a seam's width
changes with the instance. Enumerate your options before picking one (non-negotiable #14): a world-space /
triplanar material that is scale-invariant by construction · UV derived from world position rather than the
unit cube · a small set of per-size geometry variants · detail carried entirely by the material with
geometry left a plain box · authored geometry accepting the stretch. **Say in one line which you chose and
why.** Sizing texture features in **world units, not pixels** is a trap already paid for here.

### 3d. Untouchable gameplay contracts

`MIN_CLEAR = 7u` threadable clearance and `CELL = 4u` as an **authoring-snap-only** grid are gameplay, from
GDD §0. Art never reinterprets them. The sim is continuous float-AABB and never reads `CELL`.

---

## 4. The dependency on `art/track`, stated honestly

*"Dark material family **shared with track/world**"* means your material is **downstream of the floor
material the `art/track` lane is defining right now.** That is a follow relationship, not a conflict:

- **Build the independent half first** — silhouette family, proportion, seam placement, how the block meets
  the floor. None of that waits on anything.
- **Adopt the floor's material values when task 2's slice 2 lands.** Do not invent a parallel dark-metal
  language and hope it matches; that is how two ingredients end up in two different worlds.
- Tone mapping is **ON at the renderer default** everywhere (ACES Filmic — task 2's D3). Author for the
  tone-mapped frame; never set `toneMapped: false`.

**Why this lane exists now:** the track spec requires *"clear hazard-to-floor contact shading"*, and that
read is unjudgeable with no object making contact. A finished sealed block is what puts a legitimate object
back in the track's frame for its later gates — the placeholder boxes were removed precisely because they
taught nothing (task 2's D5).

---

## 5. Definition of done

- Reads as **sealed mass — avoid it** at a glance, at race speed.
- **Distinguishable from an environmental monolith.** Monoliths are task 4 and unbuilt, so you cannot judge
  against them — instead, state plainly what carries your block's *hazard* identity, so task 4 inherits the
  constraint to differentiate from you.
- **Silhouette family, not one cube:** at least three legal width/depth combinations that read as the same
  material world without looking like a repeated asset.
- **No chips, decals, greebles or decorative damage.** Restraint is the spec.
- **Nothing protrudes outside the AABB** — assert it, do not eyeball it.
- Reads with bloom **on and off**.
- Correct at **true world scale** against the scale ruler — never scaled to look right.

---

## 6. Your instrument, and the parallel-lane rule

**Build `/iso-block` with the existing `<IsoLab>`** (`apps/client/app/iso-lab/`), copying the shape of
`apps/client/app/routes/iso-monolith/`. `<IsoLab>` gives you the board overlay, the scale ruler, the ground
grid, a bloom toggle and the neutral object rig. Pass the subject at **true world scale**; the lab never
scales it.

**Files you MUST NOT touch — `art/track` is rewriting all of them right now:**
`track-view.tsx` · `track-ribbon.tsx` · `track-blocks.tsx` · `track-instancing.ts` · `track-materials.ts` ·
`track-floor.tsx` · `track-texture.ts` · `tube-walls.tsx` · `art-lab-canvas.tsx` · `lab-layers.ts` · and
anything under `.claude/art-pass/02-track/`.

Your block's **visual** lives in its own new component. **Wiring it into the game's instanced blocks happens
later, after `art/track` merges** — it is a small, deliberate integration step, not part of this lane. If you
believe you must edit one of those files, that is a NEEDS-DECISION, not a judgement call.

Judge from the **real chase camera** when the time comes, never the `/art-gallery` orbit camera, where a
side-facing glow is edge-on and reads as unlit even when correct.

> ⚠ **Never gate from an automated Chrome tab.** It reports `visibilityState: "hidden"`, rAF never fires, and
> the canvas stays black while the DOM panels render fine. Paid for twice. The tab must be **foreground**,
> created by you (`tabs_create_mcp`), with its `tabId` passed on every call so parallel lanes do not fight.

---

## 7. The verify gate — in full, before every commit

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

`pnpm -r test` **silently skips `@slur/shared`** and its 75 sim tests — the explicit `--filter` is not
redundant. Three `noExcessiveLinesPerFile` warnings are pre-existing on `dev`; anything beyond those is yours.
**Tests never gate art.** Green means the code is sound, not that the art is right.

---

## 8. Rules of engagement

- **Work in your worktree**, never the shared checkout — a pre-commit hook hard-blocks that.
- **Never regex-edit source.** `Edit`, or `ast-grep` for genuinely structural changes. No `sed -i`/`perl -pi`.
- **No Python** — `jq`/`yq` → `fish`/`bash` → ecosystem-native → ask.
- **React house style:** `<Fragment>` never `<>`; one component per file (route modules exempt).
- **No per-frame React re-renders**; push subscriptions down to leaves.
- **`useEffect` is an escape hatch** — each one carries a justification naming the external system it syncs.
- **No reflexive primitive** — enumerate ≥5 candidates for any mechanism decision, commit the winner with a
  **one-line** rationale.
- **Comments terse**, only what the code cannot say. Longer reasoning goes in your report to the supervisor.
- **Verify before recommending** — any API/flag/version claim must be verified against the **installed**
  version, and say which source tier it came from.
- **Procedural is a default, not a law.** It must buy a player-visible outcome. If an authored asset is
  genuinely the better answer, say so — task 1 pivoted to shipping a bitmap for exactly that reason.

---

## 9. Escalation — you ask the SUPERVISOR, never the user

```
NEEDS-DECISION: <one line>
CONTEXT: <2-4 lines>
OPTION A — <label>: <meaning> / consequence: <cost>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why>
IF NO ANSWER: <what you do meanwhile, or that you are blocked>
```

**Escalate:** anything touching a gameplay contract (the 8u height, `MIN_CLEAR`, the AABB hull) · any pull
toward a red or off-palette cue · anything that reopens ADR-009 · needing to edit an `art/track` file ·
adding a dependency · and your design direction **before** you invest a slice in it.

**Do not escalate** what you can settle by verifying — an API's behaviour, a measured value, whether
something renders. Verify, don't ask. Never treat silence as approval.
