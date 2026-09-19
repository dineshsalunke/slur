# LANE BRIEF — art-pass task 2: the track

**Branch** `art/track` · **worktree** `../slur-worktrees/track` · **ports** `CLIENT_PORT=5201`,
`VITE_SERVER_PORT=2601` (the background lane held 5200/2600; do not collide with it).

Written by the supervisor. **You execute; you do not write briefs, decision records or handovers** — report
first-hand facts (what you built, measured, broke) and the supervisor writes the prose. Your context is the
scarce thing; spend it on the render, not the retrospective.

---

## 0. Read these before writing a line of code

In this order. Do not skim past the first two — the whole task is downstream of them.

1. **`.claude/art-pass/02-track/README.md`** — the task. §2 is the spec, §4 the definition of done, §7 the
   decisions already taken, §8 the resolved reflection question. This brief does not restate §2; you read it.
2. **`.claude/art-pass/INDEX.md`** §2 (authority order) and §4 (standing facts already paid for).
3. **`docs/ART_SCALE_REFERENCE.md`** — the sole authority on every dimension. It overrides every number
   printed on every board.
4. **`.claude/art-pass/03-lighting/research/2026-09-18-emissive-as-light.md`** — §2F (the mechanism), §2A
   rung 2 (why `onBeforeCompile` and not a hand-rolled BRDF), §4 (recommendation + the fallback ladder and
   what would make it wrong). This is 743 lines and it is the reason task 2 skips its own research step.
5. **`conventions/r3f.md`** — the installed-stack idioms. Non-negotiable, not advisory.
6. **`.claude/art-pass/01-background/HANDOVER-SESSION-5.md`** §1 — four things a cold context tries to "fix"
   back in the sky. You will be working next to that code. Leave it alone.
7. **`docs/ART_MATERIALS.md`** — **revision 3, landed as #135 and CURRENT.** M1 (track graphite), M7
   (marigold emissive — read the boundary-vs-inserts paragraph twice), M8 (gap slab edges), §3 (the two
   marigold tiers). Any older warning you find that "M1 is partly stale" predates rev 3 and is itself stale.
8. **`docs/art-direction/track/24_track_BRIEF.md`** and **`25_track_procedural_wear_BRIEF.md`** — the art
   package's own words for the material, boundary, seam and gap language, and the **frozen** wear target.
   Board 25 is frozen by explicit owner approval; its exclusion list binds.

**The look target is `docs/art-direction/boards/12_approved_scene_marigold_depth.png`** (crops in
`02-track/refs/`, regenerate with `./make-refs.sh`). What we match is the **gestalt** — mood, depth, palette,
contrast, the sense of speed. Never a pixel match. A cheap non-physical trick that lands the look is a
legitimate answer, often the right one; the boards are AI renders and tell you the **target**, never the
**mechanism**.

---

## 1. What you are building

Four art ingredients and one setup item still open. Nothing else — §5 of the README lists what is out of
scope, and camera height in particular is deferred by ADR-010 and is **not** yours to change.

| # | Thing | One-line shape |
|---|---|---|
| **A** | **Floor** | Dark graphite/black metal, large clean panel divisions, sparse fine seams, **restrained** gloss, carrying the rail's warmth across the surface as streaks |
| **B** | **Edge rail** | Continuous **marigold** energy defining the ribbon — functional (perspective + speed), not decorative. An embedded edge strip, never a raised bar |
| **C** | **Gaps** | Real missing geometry with the frozen three-part read: marigold edge definition · inner-lip glow · darker inner cavity |
| **D** | **Wear** | Board 25's frozen three layers — broad finish patches · elongated scuff clusters · sparse joint-edge rub. **World-space in the shader, not a second texture** |
| ~~**S1**~~ | ~~Review setup~~ | **DONE — merged as #131.** Tone mapping ON · lab lights deleted · blocks split off the rails and defaulted OFF |
| **S2** | Floor swap | `TrackFloor` becomes the game's floor; `TrackRibbon`'s instanced floor quads are deleted |

---

## 2. The decisions already taken — build to these, do not re-open them

D1–D8 are of-record in `02-track/README.md` §7 with full reasoning. **D6, D7 and D8 were taken after #131
landed and they re-shape what remains** — D7 in particular reverses the slice order in §3. Read §7 for the
*why*; this is the operative summary.

### D1 — `TrackFloor` is the floor; the instanced floor quads go

Two floors exist today. `TrackView` draws the game's floor as instanced **0.6u-thick untextured boxes**;
`TrackFloor` (`track-floor.tsx`) is a **single generated continuous mesh**, 2u thick, textured, with computed
end caps — and it is mounted **only** behind `/art-lab`'s `slab` toggle. Nothing in the game uses it.

`TrackFloor` wins for two reasons, neither aesthetic: **gap treatment is geometry** (the three-part read needs
a continuous mesh with real caps — instanced boxes cannot express an inner lip), and **instanced boxes repeat
every 4u**, which is precisely the "dense emissive seam grid" the spec forbids. One continuous mesh makes
panel size a **texture** decision instead of a geometry constraint.

**Blocks and rails stay in `TrackView`.** Only the floor quads go. When they do, `TrackView`'s `showFloor`
prop and `/art-lab`'s `slab` layer toggle both lose their reason to exist — retire them in the same slice
rather than leaving a dead comparison switch behind.

### D2 — the emitter array comes FORWARD from task 3

Build the patched-material emitter light **now**: **`MeshStandardMaterial` patched through
`onBeforeCompile`, fed by a FIXED-SIZE uniform array of the K nearest emitters**, with the **edge rails as
the only emitters** in this task. Mechanism, the ≥5-option enumeration behind it, and the fallback ladder:
the emissive-as-light research §2F / §4.

**`onBeforeCompile` is the idiom, not a hack** — it is what drei's own `MeshReflectorMaterial` does, and this
repo already precedents it in `ship-model.tsx`'s dissolve shader.

**FIXED-SIZE IS LOAD-BEARING AND MUST BE SAID IN THE CODE.** A varying light count **recompiles the shader
mid-race**; a fixed-size array has no count to churn, so it cannot. That is the entire reason the research
chose this shape over a real-light rig. Do not "tidy" it into a dynamic array. If K ever has to vary, express
it as `material.defines.NUM_EMITTERS` — never as untracked branching inside the `onBeforeCompile` closure.

*Why it moves earlier:* without it task 2 delivers a dark grey ribbon with a marigold stripe — not the spec,
and no more judgeable than the two probe spheres, which defeats the reason the track was reordered ahead of
the sky gate. Task 3 then **balances and extends** this to engines, pickups, projectiles and monolith seams
rather than inventing it.

**K is yours to pick, informed by a playtest.** The research flags the risk it cannot answer: emitters
entering and leaving the K-nearest set mid-race can **pop**. If a hard cutoff pops visibly, raise K (the
uniform budget has headroom) or cross-fade the selection — and tell the supervisor which, because it is a
fact worth recording.

### D3 — RESOLVED: tone mapping is ON, at the renderer default, everywhere

**Owner decision, 2026-09-19.** Every surface in `track-materials.ts` currently sets `toneMapped: false`,
while the done-criterion is "rail reads marigold (not red-orange) **in the final tone-mapped frame**" — so as
written the test cannot be run. It is **not** becoming a panel switch. **Delete `toneMapped: false` from the
track surfaces and let the renderer default stand.**

*Verified-this-session* (installed `@react-three/fiber@9.7.0`, `dist/events-*.esm.js`): `<Canvas>` sets
`gl.toneMapping = ACESFilmicToneMapping` unless the `flat` prop is passed, which it is not. So "default" here
means **ACES Filmic**, and that matters: ACES desaturates and rolls hot saturated warms toward yellow-white,
which is exactly the transform that can turn an authored marigold into something else on screen. **Expect to
re-tune every emissive value in `track-materials.ts`** — values chosen to bypass tone mapping will not
survive being put through it, and the rail's `emissiveIntensity: 2.6` is the first thing that will look
wrong. That re-tune is the work, not a regression.

This settles the same question task 1 deferred, for the whole frame, once.

### D4 — NEW: `/art-lab` loses its own lights and is lit by the shipped sky rig

**Owner decision, 2026-09-19.** `art-lab-canvas.tsx` currently mounts `ambientLight intensity={0.4}` plus
`directionalLight intensity={1.1}` **on top of** `DeepSpaceSky`, which already brings the shipped `StarLight`
and `SkyEnvironment` rig. So the track would be judged under two lab-only lights that do not exist in the
game — and a flat ambient specifically contradicts the standing fact that **there is no fill; shadow sides go
black**. A review under lights the game does not have is worthless.

**Delete both.** The lab is lit by `DeepSpaceSky` and by the track's own emissives, and by nothing else.

**Consequence you must handle:** the sky's light and environment currently ride the `backdrop` layer toggle,
so deleting the lab lights would make "backdrop off" mean "pitch black" — which destroys a legitimate review
mode. **The lighting rig (`StarLight` + `SkyEnvironment`) must stay mounted regardless of the backdrop
toggle; only the visible patch is what `backdrop` hides.** `DeepSpaceSky` already takes `light` and
`environment` props for exactly this kind of split (`/iso-sky` uses them for its self-test) — the mechanism is
yours to choose, the behaviour is not.

Judge the result from the **real chase camera** in `/art-lab`, never the `/art-gallery` orbit camera, where a
side-facing glow is edge-on and reads as unlit even when it is correct.

### D5 — the obstacle blocks come OUT of the review frame, and are NOT retoned

An earlier draft of this brief told you to retone the red `#ff2740` lethal blocks to the warm ramp, because
red is excluded from the palette and the blocks are in every frame the floor would be judged in. The owner
struck that: the blocks *"are just plain box, they don't really help in any way and also block the view."*
Retoning was treating a symptom of leaving them in the shot at all.

**The cause:** `/art-lab` bundles blocks and rails into one toggle — `art-lab-canvas.tsx` mounts
`layers.hazards ? <TrackView …>`, and `TrackView` draws floor quads **plus** lethal blocks **plus** drag
blocks **plus the edge rails** together. `hazards` defaults ON only because switching it off would also
delete the **marigold edge rail, which is the subject of this task**.

**What you build:** split them. **Rails and blocks become independent layers, and blocks default OFF.**
Mechanism is yours — a `showBlocks` prop mirroring the existing `showFloor`, or splitting `TrackView` into
two leaf components (the latter fits non-negotiable #10 better, and D1 is already reshaping this component
anyway). Behaviour is not yours: judging the floor, rail and gaps must never require looking past plain boxes.

Keep blocks **one click away** — §2 asks for *"clear hazard-to-floor contact shading"*, and that read needs a
block present. It is a deliberate check, not the default frame.

**Do not touch `LETHAL_SURFACE` or `DRAG_SURFACE` colours.** The retone is cancelled, not deferred: no blocks
in frame means no forbidden red in frame means nothing to retone. Those colours belong to the later
block-design task, judged when someone is actually judging blocks.

### D6 — the track boards govern seam density; board 17 is atmosphere only

**Owner decision, 2026-09-19.** Board 17 (the golden reference) shows continuous full-length glowing lines
in a regular lateral rhythm, which reads as lane markings. The written direction forbids exactly that.
**The track boards win.** Board 24 specifies *"sparse short emissive segments of varied lengths and
irregular spacing among mostly dark joints"* and excludes *"repeated lane-like cadence, full glowing grid or
a highlighted safe route"*. Build the restrained version; treat board 17 as mood.

**Do not separate the boundary from the inserts by dimming the inserts.** Both are gameplay tier; rev 3's M7
is explicit that what separates them is that the boundary is **unbroken and predictable** while inserts are
**short, varied and irregular** — *"making inserts regular or continuous destroys that separation… which is
the failure mode, not dimness."*

### D7 — the emitter array is built BEFORE the floor's finish is judged

**Owner decision, 2026-09-19.** §3's slice order is now **swap → light → surface → gaps**. Dark metal carries
no information until something warm reflects off it, so judging the deck's finish before the rail lights it
judges it under light the finished scene will not have — the same rule that put the background first in the
arc. The deck keeps its current material through the rail slice and is refined **once**, afterwards, under
final light.

### D8 — board 25's wear lives in the D2 shader patch, in world space

**Owner decision, 2026-09-19.** Board 25 froze the wear treatment after this brief was first written. It is
built as **world-position-driven noise inside the same `onBeforeCompile` patch D2 adds**, *not* as a second
`roughnessMap` on the tiled canvas pipeline: `track-texture.ts` repeats every 16 × 20u, a tile cannot hold a
feature larger than itself, and board 25 wants broad patches that *"avoid identical stamps on adjacent tiles
or obvious repeating bands"*. World space has no period by construction. The tiled canvas is **kept** for
fine grain below ~1u. Full layer list, the controls to expose, and the exclusion list: §3 slice 3.

### Riding along — isotropic vs anisotropic, settled by rendering

§8 resolved the floor-reflection question: **grazing-angle specular streaks, not mirrors** — so
`MeshReflectorMaterial` and its extra scene render are very likely never needed. The open sub-question is
whether isotropic GGX stretches enough, or whether **anisotropy aligned down-track** is the missing term.
That decides whether the patched material is `MeshStandardMaterial` or `MeshPhysicalMaterial`.

**Settle it by rendering, not by reading more boards — the boards have given all they can.** Try isotropic
first; reach for Physical only when a render shows isotropic cannot get there.

*Verified in `three@0.185.1`:* `anisotropy`, `anisotropyRotation` and `anisotropyMap` live on
**`MeshPhysicalMaterial`**, not Standard. **Footgun already paid for:** the `anisotropy` setter recompiles
the shader when the value crosses zero (`this._anisotropy > 0 !== value > 0` → `version++`) — never animate
or toggle it through 0 mid-race.

---

## 3. Build it in four remaining slices, and stop at each gate

Isolation first, composition second. **Do not build ahead of a gate** — the whole point of the order is that
each variable is judged alone, and a slice built on an un-gated slice cannot be judged at all.

> **⚠ THE SLICE ORDER CHANGED — D7.** The original plan put the floor's finish before the rail that lights
> it. It is now **swap → light → surface → gaps**, and the old slice 0 is **already merged as #131**. The
> numbering below is the current one; ignore any older reference to "slice 2 = floor material".

### ~~Slice 0~~ — honest frame (D3 + D4 + D5) — **DONE, merged as #131**

Tone mapping on at the ACES default · `/art-lab`'s own `ambientLight` + `directionalLight` deleted with the
sky rig mounted unconditionally · `TrackView` split into `TrackRibbon` + `TrackBlocks`, blocks defaulting
OFF. **Do not redo any of it, and do not "fix" the lab's lights back.**

Note what it did **not** do, despite the PR title saying "floor material": `TrackFloor` and
`track-texture.ts` exist but are mounted **only** behind `/art-lab`'s `slab` toggle. `showFloor` is intact
and the game's floor is still instanced 0.6u boxes. Your first slice is the swap.

### Slice 1 — `TrackFloor` becomes the floor (D1)

Swap it in, delete `TrackRibbon`'s floor quads, retire `showFloor` and the `slab` layer toggle. No material
change in this slice beyond what the swap forces.

**Gate:** the ribbon is continuous, gaps still read as holes with depth, nothing z-fights, frame time has not
regressed. Compare against the instanced floor *before* you delete it — that comparison is the last chance.

### Slice 2 — the rail, and the emitter array (B + D2) — **moved ahead of the floor's finish**

Retone the rail to marigold, then patch the material and feed it the K nearest rail emitters. Isotropic
first; anisotropic only if a render demands it.

**This is now the second slice, not the fourth, and the reason is load-bearing (D7):** dark metal carries no
information until something warm reflects off it, so the deck's finish cannot be judged before the rail
lights it. Light first, then the surfaces it lights. The deck keeps its current material through this slice.

**The rail is an edge, not a rail.** `ART_MATERIALS.md` M7 puts the emitter *"in the top outer corner of the
slab"* as a narrow embedded strip with a small bright core and a controlled local halo — board 24's own
do-not-copy column excludes *"raised rails or ornamental edge machinery"*. It stays **continuous even where
the deck beside it is not**: a near-edge gap keeps *"an intact supporting outer floor strip and a straight
outer boundary"*.

**Gate:** the rail reads **golden marigold, never vermilion or red-orange, in the final tone-mapped frame** —
judge displayed pixels, not the input hex — and the floor carries its warmth as **streaks elongated along the
view direction**, bright-only, never inverting. Bloom on **and** off.

**Expect metalness to be the argument here.** M1 specifies bare conductor — **metalness 1.0, roughness
0.35–0.50** — against the shipped `0.12 / 0.62`. Metalness 1.0 removes diffuse entirely and the sky measures
**~linear 0.01** as an IBL source, so everything the rail's specular does not reach goes **pure black**. That
may be exactly the direction (*"there is no fill; shadow sides go black"*) or it may read as a void with a
stripe. **Render both and bring the pair to the gate.** Do not settle it from the sheet.

### Slice 3 — floor finish: panel language **and** board-25 wear, in one shader (A + D8)

Two things that used to be separate slices, because D8 makes them one mechanism.

**Panels and seams.** Procedural panel divisions and transverse seams giving lateral position across 64u.
Joints are **dark by default**. Interior emissive inserts are permitted and are **sparse, short, of varied
length, irregularly spaced** (D6) — never a regular cadence, a glowing grid, a racing line or a safe-route
glow. Rev 3's M7 names the failure mode precisely: *"making inserts regular or continuous destroys that
separation and produces the lane read the direction forbids — which is the failure mode, not dimness."*
So do **not** try to separate the boundary from the inserts by making the inserts dimmer; both are gameplay
tier and both may be equally hot. Continuity is the separator.

**Wear — world-space, inside the D2 patch, NOT a second texture (D8).** `track-texture.ts` is one 1024²
canvas over a 16 × 20u panel: it repeats 4× across the ribbon and ~400× down it. A tile cannot hold a feature
larger than itself, and a `roughnessMap` bolted onto that pipeline inherits the identical period — which
fails §4's *"a tiling period the eye can lock onto is a failure"* by construction. So wear is
**world-position-driven noise in the same `onBeforeCompile` patch the emitter array already adds**. The tiled
canvas is **kept**, demoted to fine grain below ~1u where a repeat is invisible at any real viewing distance.

Board 25's three frozen layers, in priority order:
1. **Finish wear (primary)** — sparse, broad, softly-bounded roughness patches that interrupt the warm
   reflections; some areas subtly *smoother*, not only duller; **substantial untouched areas retained**.
2. **Shallow scuffs (secondary)** — occasional elongated rub clusters, varied length, **weak** down-track
   bias that must never become a highlighted route.
3. **Joint-edge rub (tertiary)** — small intermittent worn portions near *selected* joint ends and bevels.
   Sparse selection, **never a bright outline around every tile**.

**Expose these as live uniforms** — board 25 asks for them by name: overall amount **including zero as the
clean baseline** · broad-patch coverage and characteristic size · the dulled-vs-smoother delta · scuff
density, length variation and directional bias · edge-rub amount · **a stable seed**, so two screenshots of
the same section are comparable.

**Excluded, from board 25's own list:** rust · flaking paint · muddy grime · skid/tyre marks · bright silver
scratches · dents · craters · broken floor · debris · **all-over fine noise** · lane-like wear bands · fully
outlined tile edges. And no brighter or bluer base values to make the wear visible.

**Gate — judge the OVERVIEW first, the closeup second.** Board 25 is explicit: *"wear should break
reflections without competing with hazards, pickups or gap edges. Closeups explain the material but must not
force tiny details into the gameplay render."* Compare against board 25 with **matched lighting and camera**;
board 24 is the clean baseline. Then: floor repetition is not visible at speed, the surface reads as dark
metal rather than grey plastic, and the wear is **stationary on the track** as the camera moves — no shimmer,
no swimming, no obvious repeating band.

### Slice 4 — gaps (C)

The three-part read: marigold edge definition · inner-lip glow · darker inner cavity. Rim brightness must not
perceptually **close** the opening; slab thickness must not **conceal** it from a low camera.

**Gate — the hardest read in the task, and the one most likely to fail:** gap edges are distinguishable from
panel seams *and* from reflected light, at race speed, **moving, not parked**. A 4 × 20u gap is legible at
55u/s from the production camera.

---

## 4. Definition of done

Straight from `02-track/README.md` §4, plus the two the wear freeze adds. All eight, or the task is not done:

- **Procedural** — no bitmap textures in the track pipeline.
- **Gap edges distinguishable** from panel seams and from reflected light, verified moving.
- **Rail reads marigold**, not red-orange, in the final tone-mapped frame.
- **Floor repetition not visible** — a tiling period the eye can lock onto is a failure.
- **Reads correctly with bloom on and off.**
- **A 4 × 20u gap is legible at 55u/s** from the production camera.
- **Wear matches board 25's character and strength** judged on the **overview**, and it breaks the warm
  reflections without competing with gap edges. Board 24 is the clean baseline.
- **Wear is stationary on the track and stable in motion** — no shimmer, no swimming, no repeating band,
  and every control board 25 names is exposed, including **zero wear as the clean baseline**.

---

## 5. The verify gate — run it in full before every commit

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

`pnpm -r test` **silently skips `@slur/shared`**, which holds the sim and its 75 tests — the explicit
`--filter` is not redundant. Three `noExcessiveLinesPerFile` warnings are pre-existing on `dev`
(`step.test.ts`, `track.test.ts`, `track.ts`); anything beyond those three is yours.

**Tests never gate art.** A green run means the code is sound, not that the art is right.

---

## 6. How it is judged

`/art-lab`, the **real chase camera**, at **race speed**, bloom **on and off**, against
`refs/12_approved_scene_marigold_depth.small.jpg`.

**Your own iteration goes through the frame tap, and never steals focus.**
`curl localhost:5201/__frame-tap?name=X` writes the composed frame — bloom included — to
`.claude/art-pass/00-frame-tap/refs/X.png` with no focus and no browser automation. It is deterministic:
same camera, same seed, every capture. That is what a before/after comparison requires and a live tab
cannot give you. (PR #134.)

**The live shared tab is for the OWNER's judgement, not your iteration.** Use it only when the owner is
actively looking, or when something reads differently in motion than it does in a still. Never take
window focus to get a picture.

> ⚠ **A black canvas in an automated tab is `visibilityState: "hidden"` killing rAF — not a renderer bug.**
> This cost two sessions. The answer is the frame tap, not focus. **Canvas size is not the test:** one case
> measured 3456×1926, fully mounted, with rAF still dead. A rAF probe that HANGS the CDP evaluate *is* the
> diagnosis.

The pre-#134 instruction that the tab "must be foreground" is **retracted**. The diagnosis behind it was
right; the conclusion is dead, because the tap drives R3F 9.7.0's `advance()`, which gates on none of
`frameloop` / `internal.active` / `internal.frames`.

**Tests never gate art.** A green run means the code is sound, not that the art is right.

---

## 6a. Comments

**`CONTRIBUTING.md` §3 is the authority. Read it there, not here** — two copies of a rule is a fork with a
delay fuse. It is on `dev` as `59805a1` (#137), verified 2026-09-19.

An interim summary lived here while that rule was still unmerged and `dev`'s §3 said the opposite. It has
been deleted now the real one has landed, which is what it was written to do.

### This lane's exclusive file set for the sweep

`track.tsx` · `track-blocks.tsx` · `track-floor.tsx` · `track-instancing.ts` · `track-materials.ts` ·
`track-ribbon.tsx` · `track-texture.ts` · `track-view.tsx` · `tube-walls.tsx` (all in
`apps/client/app/game/scene/`) and every `*.ts`/`*.tsx` under `apps/client/app/routes/art-lab/`.

**The `sky-*` files are NOT ours** — task 1 is closed and the sweep lane holds them. If a later slice needs
to edit one, ask the supervisor to move it across first; do not just edit it.

---

## 7. Traps already paid for — do not rediscover these

**Environment**
- A fresh worktree often serves a **stale Vite dep cache**, which makes koota's `useWorld` see a null React
  and blanks the whole Canvas behind the error boundary. Fix: `rm -rf apps/client/node_modules/.vite`, restart.
- **Unsmudged git-lfs ship models 404** and take the Canvas down the same way. Fix: `git lfs pull`.
- `tsx` has no dotenv loader: the server reads `PORT` from the shell and it **must equal** `VITE_SERVER_PORT`.

**Geometry and texture**
- **Compute winding from an intended normal; never reason about it.** `track-floor.tsx`'s `pushQuad` already
  does this — it takes the cross product and flips when it disagrees. Hand-predicting how a world-space corner
  order projects to screen space got the top face wrong (whole ribbon culled) and then the end caps wrong the
  same way. On concave outlines, "away from the centroid" silently inverts faces with every gate green.
- **Size texture features in WORLD units, not pixels.**
- **Base colour MULTIPLIES the map.** `FLOOR_SURFACE.color` is `#050507`; at that value the texture crushes to
  flat black and no grain or panel is visible. `TrackFloor` already overrides it to white for this reason.
- **Metalness without an environment map renders black** — a metallic surface gets its value from reflections.
  Raising metalness before there is something to reflect only removes information.
- **Module-singleton textures survive HMR**; a texture created in a component does not.

**Shader**
- Fixed-size uniform array (D2). A varying count recompiles mid-race.
- The `anisotropy` setter recompiles when crossing zero (D5's riding-along note).

---

## 8. Rules of engagement

- **Work in your worktree**, never the shared checkout. `git fetch origin && git worktree add -B art/track
  ../slur-worktrees/track origin/dev && cd ../slur-worktrees/track && pnpm install`. A committed pre-commit
  hook hard-blocks a Claude commit in the shared checkout.
- **Never regex-edit source.** `Edit` for exact matches, `ast-grep` for genuinely structural changes, `jq`/`yq`
  for structured data. A `sed -i`/`perl -pi` on source is how a doc header got four lines spliced into it.
- **No Python** — `jq`/`yq` → `fish`/`bash` → ecosystem-native → ask.
- **React house style:** `<Fragment>` never `<>`; one component per file (route modules exempt).
- **No per-frame React re-renders.** ECS → R3F via refs in `useFrame`. Push every subscription DOWN to its
  leaf; a parent that wraps siblings holds zero reactive subscriptions.
- **`useEffect` is an escape hatch, not the default** — and every one you write carries a justification
  comment saying which external system it synchronizes with.
- **No reflexive primitive.** For any *mechanism* decision, enumerate ≥5 candidates, weigh them, commit the
  winner with a **one-line** rationale. `setInterval`/`setTimeout` polling live game state is rejected on sight.
- **Comments: terse, and only what the code cannot say** — a rejected alternative, an external constraint, a
  footgun. One or two plain lines. No multi-paragraph justification blocks; that volume buries the comments
  that matter. Longer reasoning goes in your report to the supervisor, which becomes the PR body.
- **Verify before recommending.** Any API, flag, version or config key that underwrites code must be
  verified-this-session against the **installed** version — official docs → repo README/CHANGELOG/`.d.ts` →
  upstream source → `node_modules` as a last resort. Say which tier a claim came from.

---

## 9. Escalation — you ask the SUPERVISOR, never the user

When you hit a decision that is not yours, stop and emit:

```
NEEDS-DECISION: <one line>
OPTIONS: <each with its trade-off>
RECOMMENDATION: <your pick + why>
BLOCKED: <yes/no — what you can do meanwhile>
```

The supervisor takes most calls directly and escalates **gameplay · artistic · technical · project-wide** ones
to the owner, then relays the **reasoning**, not just the verdict. **Never treat silence as approval.**
Verify that a message was delivered — a relay dropped a whole decision packet in a previous session and the
failure looked exactly like success.

**Escalate rather than decide:** anything that would change `MIN_CLEAR`, `CELL`, ribbon width, segment length
or any other gameplay contract (art never reinterprets those); camera height (ADR-010 defers it); adding a
dependency; and the D-vs-F call if a render shows the floor genuinely needs mirrored **scenery** rather than
streaks — the research names that one explicitly as an art call, not a technical one.

---

## 10. Out of scope — do not build these

Camera height · obstacle block **design and colours** (D5: you split their toggle, you do not restyle them) ·
the finish gate · pickups ·
final lighting balance (task 3 — you build the emitter *mechanism*, task 3 balances it) · monoliths ·
asteroids · anything in `01-background/` (the sky is done; HANDOVER-SESSION-5 §1 lists what not to "fix").

The deferred `/iso-sky` gate runs **after** your track is in frame. Do not run it, and do not re-tune the
sky's three awaiting knobs (`Tone map`, `Field of view` 140, `Tilt` 0°) — they are the owner's to judge, with
your track in the shot. Note that D3 makes the sky's `Tone map` knob a foregone conclusion: ON.
