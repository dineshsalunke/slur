# Task 1 — handover after the cheap path landed (2026-09-19)

**State: built, gate green, NOT yet seen by a human eye.** Branch `art/background`, worktree
`../slur-worktrees/background`, client `:5200` / server `:2600`. Code commit `643af5a`.

Read `CHEAP-PATH-BRIEF.md` for the decision and `CHEAP-PATH-PLAN.md` for the plan. This file is what changed
against that plan, and what is left.

---

## 1. Your next action — the gate

```
PORT=2600 pnpm dev          # from this worktree
```

Then `http://localhost:5200/iso-sky` **in a FOREGROUND tab**, and afterwards `/art-lab` at race speed.

> ⚠ **Do not gate this from an automated Chrome tab.** The lane tried; the tab reports
> `document.visibilityState === "hidden"`, so rAF never fires and the WebGL canvas stays black while the DOM
> panels render fine. That is the `hidden-tab-blank-canvas` trap, already paid for twice — it is NOT a render
> bug, and there is nothing to debug. The scene is confirmed mounted by other means (§3).

**The acceptance test that matters is the roughness probes**, and the panel now has the switches to run it:

| Step | Switches | Expected |
|---|---|---|
| 1 | `Star light` OFF, `Env rig` OFF | Both probes go **flat/black**. If not, something else is lighting them and the test proves nothing. |
| 2 | `Star light` OFF, `Env rig` ON | The `0.2` and `0.9` probes look **visibly different**. **This is the task-1 pass condition** — the procedural path never achieved it. |
| 3 | both ON | The shipped look. |

Then judge the display: it should read as the reference **because it is the reference** — no histogram tuning.
Compare against the `Nebula backdrop (boards' sky)` board, which is already the route's default.

## 2. Three knobs that are eye calls, deliberately left at a defensible default

1. **`Tone map` (switch).** OFF shows the reference ungraded — and the definition of done is literally "it IS
   the reference". ON puts it in the same tonal world as everything else in frame. Shipped **ON**; A/B it.
2. **`Field of view` (120°).** Sized from the *measured* camera: the chase cam frames ~108° horizontally at
   top speed, so 120 covers it with ~6° of margin. Lower and the void shows at the frame edge under
   `fovStretch`; higher and the composition zooms out and the planet limb drifts toward the corner.
3. **`Tilt` (0°).** The chase cam is pitched **18–21° down**, so only the top ~10–20° of the frame is sky.
   Tilt decides how much of the nebula band lands in that strip rather than behind the rock field. This is the
   knob most likely to need moving, and it can only be judged in `/art-lab`, not in the free orbit.

`Copy config` emits a paste-ready `sky-config.ts` fragment for whatever you settle on.

## 3. What was verified without a human eye

- Full gate: `typecheck` · `lint` · **75** shared + **34** client + **4** server tests · `build`. All green.
- `/iso-sky` mounts clean — no console errors, canvas sized `3456×1994`, `nebula-backdrop.jpg` served (304).
- **Zero external requests across 62** on that route. The drei `<Environment>` *children* path fetches no CDN
  HDR, so the offline / office-LAN requirement in the brief holds. (`preset=` remains forbidden.)
- The direction convention is pinned by `sky-config.test.ts`, which **projects through a real three
  `PerspectiveCamera`** rather than re-asserting the algebra that produced it.

## 4. Deviations from `CHEAP-PATH-PLAN.md` — all deliberate

**The plan's four code commits became one.** Only the final swap was genuinely separable: deleting
`procedural-dome.tsx` leaves `ProceduralSky` with nothing to display, and the convention fix below touches the
config, the light and both labs simultaneously. Splitting would have meant committing a tree that does not
compile. The commit message carries the full story instead.

**A defect the plan did not know about: the bearing convention was wrong.** `starDirection` had `0 = −Z`,
i.e. bearing 0 pointed **behind** the player, while its own comment claimed the body sat "upper-right of the
game's forward view". Both numbers were eye-tuned in a free-orbit lab where forward had no meaning. It is now
`skyDirection`, `0 = +Z` (the way the ship flies), growing toward **screen-right, which is world −X** — a
camera looks down its own −Z, so `right = up × back = (0,1,0) × (0,0,−1) = (−1,0,0)`.

**The star bearing was derived, per the owner's pick.** Method, reproducible: threshold the jpg at luma ≥ 210,
take the brightest pixel per row in the upper-right quadrant, Kasa-fit a circle → planet limb at centre
**(1679, 622) r 719 px**, residual **rms 4.2 px**. A polar sweep of that circle shows the lit arc running from
the frame edge at 120° to a **hard terminator at 169°** (luma 211 → 81 → 34 over six degrees). A crescent's
lit limb spans 180° centred on the sub-stellar azimuth, so the star sits at **79° screen-azimuth from the
planet centre — essentially straight above it**. Mapped through the patch: **bearing 66°, elevation 19°**.
The old `55/28` pair put the star **27° to the planet's right**, the mirror image of what the image shows.

> The *separation* from the planet is a composition choice, **not** a measurement. The crescent's thickness
> implies a phase angle geometrically inconsistent with the planet's apparent size — expected of an AI render
> (`boards-are-look-target-not-physics`) and not worth honouring. Only the **azimuth** is load-bearing.

**The mapping needed a decision the plan flagged and the owner made: sphere PATCH, no shader.** A stock
sphere's default UVs *are* equirectangular, so "swap the ShaderMaterial for a texture" would have been the
exact equirect mapping the brief rejects. `phiLength`/`thetaLength` cut out the cone a framed image actually
covers. Two things in there are non-obvious and are commented in place: **`phiLength` is negative** (so
image-left lands screen-left), which flips the winding, hence **`DoubleSide`** rather than reasoning about
which way the normals ended up pointing; and the edge fade is an **`alphaMap` DataTexture**, not an
`onBeforeCompile` patch, so the shader count stays at zero — which was the point of the pivot.

**The lab's state design was reversed on purpose.** The procedural version wrote slider values straight into
shader uniforms inside `useFrame` (zero React renders) and its own comment rejected `useSyncExternalStore` as
"still per-tick". That was right while the sky was a shader. There are now **no uniforms**: the knobs are
geometry arguments and `<Lightformer>` transforms, reachable only through props, so one render per change is
the **floor**. Split memoisation in `tunable-sky.tsx` keeps a backdrop drag from re-baking the cubemap.

## 5. Still open

- **The gate itself** (§1). Nothing here has been seen.
- **`docs/` sync.** `01-background/README.md` §1/§8 and `INDEX.md` carry the pivot amendments but still
  describe the procedural sky as the built thing in places.
- **Then task 2 (track).** Its floor-reflection question is already resolved — grazing-angle specular streaks,
  not mirrors (`02-track/README.md` §8) — so `MeshReflectorMaterial` and its extra scene render are very
  likely never needed. The one open sub-question is isotropic vs **anisotropic** specular aligned down-track,
  which decides `MeshStandardMaterial` vs `MeshPhysicalMaterial`. Settle it by rendering, not by reading boards.
- **Per-sector variation** (board 06's six sectors) was the *only* pro-procedural argument that survived
  scrutiny. On this path it is six bitmaps. Revisit `art/procedural-bg` @ `6d52029` only if it becomes real.

## 6. Files

**New:** `sky-backdrop.tsx` (the patch) · `sky-environment.tsx` (the Lightformer rig) · `deep-space-sky.tsx`
(composition) · `sky-config.test.ts` (the convention pin).
**Retired** (preserved on `art/procedural-bg`): `procedural-dome.tsx` · `celestial-body.tsx` ·
`procedural-sky.tsx` · `scene-backdrop.tsx`.
**Rewritten:** `sky-config.ts` · `sky-tuning.ts` · `sky-tuning-panel.tsx` · `tunable-sky.tsx`.
**Touched:** `star-light.tsx` (convention) · `art-lab-canvas.tsx` (swap; the void colour is now
unconditional, because the sky is no longer an `attach="background"` fighting over which attaches last).
