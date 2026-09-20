# `art/track` — LANE FACTS

Raw first-hand facts, one line each. No prose, no reasoning, no narrative. `[unmeasured]` means this lane
could not source it first-hand — it is NOT reconstructed. The supervisor writes the state doc from this.

---

## Branch

- Branch `art/track`, worktree `../slur-worktrees/track`, base `1807bc0` (`dev` at task-1 merge).
- HEAD `441a2d9` art(sky): frame the backdrop at tilt -2 / fov 120, and pin the margin it accepts.
- `b00c91f` art(sky): fov slider floor 70→43 in both panels + coverage-number fix in the iso-sky hint.
- `c833324` docs lane-state · `e339381` far-plane fix · `eedd49e` scene probe · `1bb5839` slice 0 · `c937888` sky knobs.
- Tree clean, pushed, `rev-list --left-right --count origin/art/track...HEAD` = `0 0`.
- Ports: client 5201, server 2601. Chrome contention is `block-49` on 5202, NOT 5201.

## Gate

- Full gate GREEN at `441a2d9`: typecheck · lint · shared 75/75 · client 37/37 · server 4/4 · build.
- Lint: 3 pre-existing `noExcessiveLinesPerFile` warnings + "✓ Canvas-isolation: 8 route entry modules clean".
- Client test count went 35-with-1-failing → 37-all-passing: Option C removed 1 assertion, added 3.
- `pnpm format` MUST run before `pnpm lint` — biome treats formatting as a lint error.
- `pnpm -r test` silently skips `@slur/shared`; the explicit `--filter @slur/shared` is not redundant.
- Commit hook rejects a `Co-Authored-By` trailer; do not bundle `git add` and `git commit` in one Bash call.

## Sky framing — shipped values

- `DEEP_SPACE.backdrop`: `bearingDeg 0`, `elevationDeg -2`, `fovDeg 120`, `edgeFadeDeg 12`, `gain 1`.
- `DEEP_SPACE.radius` 800, `starBearingDeg 66`, `starElevationDeg 19`.
- `starBearingDeg 66` is conditional on pan never having moved during the owner's sitting — `[unmeasured]`.
- `SKY_TUNING` is an in-memory module singleton seeded by `committed()` from `DEEP_SPACE`; nothing persists it.
- `writeSkyTuning` couples `starBearingDeg` to `backdropBearingDeg` (`sky-tuning.ts:101`); pan-only edits must go through it.
- `skyConfigSnippet()` dumps every knob paste-ready — use it before any reload if a sitting's values matter.

## Sky framing — measured, fov 70 (pixels, `gl.render` + `readPixels`, PRE-bloom PRE-tone-map)

- `phiLength` read live = −70.0°, so fov 70 was genuinely live for every fov-70 number here.
- Void as fraction of frame WIDTH: parked fov 60 → 0.154 left / 0.144 right.
- Top speed fov 75 straight → ~0.21 each side. Top speed + 13.39° strafe yaw → ~0.125 one side / ~0.333 other.
- Patch span parked, by differencing patch-visible against patch-hidden: x 0.154–0.856 of width.
- Star census over a 237,160-px void block: 0.008% of pixels lit (~19 px), mean +0.005 luma, max +225.
- Void floor luma 6.0 flat. Patch interior luma 42–66 at the sampled rows.
- Boundary profile, 20px steps: ~0 at x=440, 1.6 at 480, 3.6 at 500, 7.5 at 520, 27.5 at 540, 42 at 560.
- Last ~40px inside the geometric border sits within ~3 luma of void — the patch EDGE is not a visible line.

## Sky framing — fov 120 (calibrated arithmetic, NOT pixels)

- Parked (frame half-width 46.01°): 0 uncovered, 14° spare. Top speed straight (54.01°): 0 uncovered, 6° spare.
- Top speed + 13.39° strafe yaw: 0.1159 of frame width uncovered on the LEADING edge; other edge 0.
- `ACCEPTED_EDGE_MARGIN = 0.12` of frame width (`sky-config.test.ts`), computed value 0.1159, passes thin.
- Calibration at fov 70: predicted 0.162 / 0.246 / 0.356 vs measured 0.154 / ~0.21 / 0.333 → model runs 1–2% of width CONSERVATIVE.
- Angle→screen-width is NOT linear: width per degree grows as sec²θ. 7.4°/107.5° reads 6.9%; tangent-correct is 11.6%.
- `[unmeasured]` fov 120's actual patch span in pixels — rides free at the owner's sitting.

## Coverage derivation

- Worst case is TOP SPEED, swept over the whole speed range: `2·(53.76 + 13.39) = 134.30°`. Rest is 122.54°.
- `sky-config.test.ts` always computed 134.297; vitest printed it. The prose's ≈138.5° was what was wrong.
- 138.5° mixed REST-pose yaw (15.52°, look distance 18u) with TOP-SPEED frame width (107.5°) — two speeds, one number.
- Chase at top speed: `back` 11+3=14, `lookAhead` 7, look distance 21u, yaw `atan((80/16)/21)` = 13.39°.
- Chase at rest: look distance 18u, yaw 15.52°, frame 91.5° wide. Yaw and frame width pull opposite ways.
- Pitch down: 18.43° at top speed, 21.25° at rest (`chase.ts` height 9, lookAtLift 2).
- Frame half-widths at canvas aspect 1.7944: 46.01° at vfov 60, 54.01° at vfov 75.

## Slider floor 43

- `makeEdgeFade` vertical fade fraction is `edgeFadeDeg / fovVDeg`; its `du = min(v, 1-v)` peaks at 0.5.
- So at `fovV ≤ 2·edgeFadeDeg` every texel is part-transparent and the patch never reaches alpha 1 anywhere.
- `fovV = fovDeg / 1.7768` (image 1672×941). At `edgeFadeDeg 12`: `2·12·1.7768 = 42.64` → floor 43 at step 1.
- The floor MOVES if `edgeFadeDeg` moves. Floor was duplicated in `art-lab-sky-controls.tsx` AND `sky-tuning-panel.tsx`.

## Far plane

- R3F builds `new THREE.PerspectiveCamera(75, 0, 0.1, 1000)` — `@react-three/fiber@9.7.0` `dist/events-156d8d12.esm.js:15771`.
- `camera={{…}}` overrides only named fields; no Canvas in this app names `far`. three's own default 2000 is never in play.
- The "black sphere" was a far-plane hole: camera-locked patch is equidistant, clip is `radius·cos(a) > far`.
- radius 1200 vs far 1000 → circular hole of half-angle `acos(1000/1200)` = 33.6° centred on the CAMERA AXIS.
- Hole is camera-axis-defined, so it is independent of the sky's pan/tilt/fov — dragging tilt never moved it.
- Shipped fix: `radius` 1200 → 800. Confirmed live by toggling far 1000→5000: interior points 6/6/6/6 → 14.6/12.9/28.7/9.2, control outside the hole 12.4 both times.
- VISUALLY CONFIRMED this session at radius 800: hole gone, sky continuous, planet limb + terminator legible.
- drei spans the star shell OUTWARD: `let r = radius + depth` (drei 10.7.8 `core/Stars.js:65`) → field 400→520, inside 800.
- `iso-lab-canvas.tsx` is the only Canvas setting `far` (`max(4000, dist*12)`) — why `/iso-lab` never showed it. Issue #128.

## Bloom-off point samples (retracted "near-white clipped" finding)

- slab RGB (60,64,70) · rail (91,98,109) · upper sky (4,6,12) · void `#02030a` = (2,3,10). Mid-dark grey, NOT clipped.
- The blow-out is a BLOOM-BUDGET problem, which task 3 owns — not an emissive-value problem in task 2.
- `gl.toneMapping` reads 0 (NoToneMapping) live while R3F source sets ACESFilmic absent `flat` (same file, line 15903).
- Most likely the postprocessing `EffectComposer` takes tone mapping into the chain. `[unmeasured]` — confirm WHERE before judging rail hue at slice 3.
- Every luminance number in this file comes from `gl.render()`, which bypasses the composer: pre-bloom, pre-tone-map.

## Floor material — the slice-1 starting state

- `FLOOR_SURFACE` = `{ emissive: '#c8d0d8', emissiveIntensity: 0.05, color: '#050507' }` at `track-materials.ts:17`.
- `track-materials.ts` contains ZERO `roughness` keys across all four surfaces (`grep -c` = 0) — verified first-hand.
- No map, no roughness, no procedural term: mathematically uniform, nothing for light to catch.
- `art/block` measured the same failure on the block: albedo features dilute below JPEG noise at ~85–90% non-diffuse; roughness variation is the lever that shows. Read `07-blocks/SESSION-9-ADDENDUM.md` §1 before designing D1 — do not re-derive.

## Slice 1 — the floor swap (D1)

- `buildFloorGeometry` loops `i < Math.round(track.finishZ / SEG_LEN)` = 400; `TrackRibbon`'s window is `sim.z + AHEAD` (900u), unbounded.
- `segmentAt(400)` and `segmentAt(420)` both return `kind:'finish'`, `floors:[{x0:-32,x1:32,y:0}]` — the run-out pad continues past the line.
- So swapping as-is leaves NO floor past the finish line for the whole leader-grace window. Fix rides slice 1.
- `emitSpan` hardcodes `t = 0`, `b = -SLAB_THICKNESS` — it ignores `FloorSpan.y`. `TrackRibbon` honours it (`f.y - FLOOR_THICK/2`); rails ride `seg.floors[0].y`.
- Latent, not live: seeds 1/2/3/7/42/1337/99991, 2,675 spans, distinct `f.y` set = `[0]`, every track 400 segments.
- `continues()` compares x-range only — two spans at different `y` would read as continuous and suppress the cap between them.
- Seed 1: 382 spans, 18 holes, 20 partial-width spans → ≤2,292 quads ≈ 13.7k verts for the WHOLE track, built once in a `useMemo`.
- Instanced path does a 49-segment window walk + 2 `instanceMatrix` uploads every frame; expect the swap to IMPROVE frame time. `[unmeasured]` — no frame-time number taken.
- Thickness changes 0.6u (instanced) → 2u (`SLAB_THICKNESS`) at the swap. That trade is what the owner's gap frames judge.

## Floor material ownership (commit 1)

- `/art-gallery`'s slab subject hand-rolled `<boxGeometry [64,0.5,20]>` + raw `FLOOR_SURFACE`; it does NOT consume `TrackRibbon`, so the deletion would not break it — it would make it LIE.
- `TrackFloor` overrode `FLOOR_SURFACE` inline: `color` white, `roughness 0.62`, `metalness 0.12`. Nothing could import those.
- Now `track-materials.ts` owns them: `FLOOR_ROUGHNESS = 0.62`, `FLOOR_METALNESS = 0.12`, `floorSurface()` (lazy — `trackSurfaceTexture()` needs `document`).
- `FLOOR_ROUGHNESS` is the constant `art/block`'s §4 condition 2 binds them to import rather than copy. It did not exist before this commit.
- `floorSurface()` must NOT be called at module scope: `SUBJECTS` is imported by `gallery-camera.tsx` and `art-gallery-sidebar.tsx` for metadata. Hence `TrackSlabSubject` is a component.
- No client test imports `subjects.tsx`; `apps/client/vitest.config.ts` is `environment: 'node'` with per-file jsdom docblocks.
- `track.test.tsx` tests the env-lab `Track` (flat grid), NOT `TrackRibbon`/`TrackView` — the rename does not touch it.
- Gallery box UVs would have stretched one panel tile across 64u, so the subject shares `buildSpanGeometry` instead.
- CHECKED, not assumed: the block lane's normalised-`BoxGeometry`-UV warning does NOT apply to `TrackFloor` — `uvFor` divides WORLD position by `PANEL_W`/`PANEL_L` on a generated mesh with no instance scale.
- Gate GREEN after commit 1: typecheck · lint (3 pre-existing warnings) · shared 75/75 · client 37/37 · server 4/4 · build.
- Commit 1 = `c1ccb97`. Commit 2 = `f6d1351`. Both pushed; `origin/art/track...HEAD` = `0 0`.
- Commit 2: floor now builds to `finishZ/SEG_LEN + ceil(AHEAD/SEG_LEN)` = 400 + 45 segments; `emitSpan` reads `span.y`; `continues()` takes `y`, tested within 1e-4. Both no-ops on screen today.
- Gate GREEN after commit 2, same counts.
- NOT DONE, deliberately: the deletion (quads out of `TrackRibbon`, `showFloor`/`slab` retired, `TrackView` composing `TrackFloor`, rename to `track-rails.tsx`). HELD until the owner's gap frames are taken — the dev server serves the working tree, so deleting the quads kills the comparison whatever the commit order.

## Chrome / instrumentation

- `visibilityState` is the ONLY reliable hidden-tab test. Canvas size proves nothing — measured 3456×1926, mounted, rAF dead.
- In a hidden tab ResizeObserver never fires, so R3F never builds its root and `window.__ART_LAB` never publishes; canvas sits at 300×150 while the window is 1728×963.
- `computer screenshot` forces the measure — and forces the window FORWARD. That is the focus steal. Three of them were this lane's; two were the same parked frame and one bought nothing.
- `javascript_tool` reads DOM (panel toggles, slider values, config) at ZERO focus cost. Only pixels need the window.
- Panel ON state reads as background `oklab(0.828 0.0183479 0.188107 / 0.15)`; OFF is `rgba(0, 0, 0, 0)`.
- Composed screenshots CANNOT be posed: a forced render re-runs the Loop and `updateChaseCamera` resets the camera — a second screenshot came back byte-identical to the first.
- `gl.render(scene, camera)` + `readPixels` WORKS with rAF dead, and bypasses EffectComposer (free bloom-off read).
- Read a whole SCANLINE per `readPixels` call; per-pixel calls are a GPU stall each. MAX-POOL when building a luminance map.
- A 1-px scanline cannot census sparse points — 2200 stars over a sphere almost never intersect one. Use a 2D block.
- `useThree` beats `__THREE_DEVTOOLS__`; a React-fiber walk from the canvas does NOT reach the R3F store (`createRoot` closure). zustand's store is a FUNCTION, so a `typeof v === 'object'` guard rejects it.
- Tab groups are PER-SESSION: a restarted agent cannot adopt its predecessor's tab. Record URLs, never tab ids.
- Never `await` a frame through `javascript_tool` — it hangs the CDP evaluate to its 45s timeout, and the hang IS the diagnosis. Use a free-running counter read on a LATER call.
- `SceneProbe` (`window.__ART_LAB`, DEV-only) still mounted; deleting it is a slice-4 acceptance item.

## Things that were wrong, and what corrected them

- "A rogue object mounts the black sphere" — wrong. No unexplained renderable existed; exactly 5 renderables, 1 sphere.
- "The sphere is the baked planet, cropped" — wrong, and it was measured, argued and confident. The owner's falsification test (drag tilt, body does not move) killed it.
- "Near-white, clipped slab and rails" — wrong, a bloom-ON eyeball read of a thumbnail. Point samples retracted it.
- "Planet at top right of the parked frame" — wrong; the patch-visible/hidden difference proved that region is void.
- "Zero stars in the void" from a 1-px scanline — a sampling artefact, caught before reporting; re-measured as a 2D block.
- Coverage need ≈138.5° — wrong, relayed as authoritative by the supervisor; the test always computed 134.297.
- fov-120 margin ≈7% — wrong, relayed by the supervisor, wrong in the UNSAFE direction; tangent-correct is 11.6%, and 0.07 would have put `ACCEPTED_EDGE_MARGIN` below the thing it exists to permit.
- Every reversal in this lane was settled by rendering or measuring, never by reasoning — including confident, well-argued retractions built from source alone.
- A test built on a false premise is an ACTIVE source of false confidence: `radius < 2000` passed while the bug shipped underneath it. It was replaced, not added beside. The same applies to the coverage assertion Option C replaced.

## Open

- Slice 0 UNGATED — no owner verdict. Framing is not the gate. Judged moving, chase camera, bloom on AND off.
- Slice 1 is NO LONGER gated on the slice-0 verdict (supervisor decision); the next sitting gates both.
- Owner block for the sitting is owned by the supervisor, committed on `art/block` at `1527d19`. Do not edit it.
- Frame tap (`art/frame-tap`) stays OUT of this branch; it reaches here through `dev` after its own PR.
- The deferred `/iso-sky` gate is not this lane's to run; its roughness self-test needs `Star light` OFF as well as `Env rig` off.

## Session 1 (2026-09-19) — slice 1 preparation

### Base

- Lane base SHA `639a2f2605edc77e0d54e33f9c6a757b60c92b80`, branch `art/track`, tree clean at session start.
- Lab defaults read from `lab-layers.ts:46-54`: `rails:true slab:true blocks:false backdrop:true env:false ships:false finish:false`.
- `/art-lab` default seed `1234` (`routes/art-lab/route.tsx:33`), default env index `ENV_VARIANTS.length-1` = `C · Grid Void`.

### Track content, seed 1234 (measured, node against `packages/shared/dist`)

- 400 segments: 361 full-width floor, 20 partial-floor, 19 zero-floor (full gaps). 381 floor spans total.
- First full gap at segment 10, z=200. First partial at segment 7, z=140 (floor `-16..0` only).
- Segment 113, z=2260 — partial, floor `-24..-8` (16u of 64u). Used as the slice-1 comparison target.

### `buildFloorGeometry` cost — the D1 concern, MEASURED

- Cold module, vitest/node (NOT browser), seed 1234, `TRACK_SEGMENTS=400`: **14.65 ms**.
- Geometry: **10,704 vertices · 3,568 triangles · 128,448 bytes** of position attribute.
- Verdict: not a visible hitch, ~7× under the 100 ms escalation threshold. **Measured, not a problem** — no NEEDS-DECISION.
- Caveat: measured in node, not in the browser. Browser figure `[unmeasured]`.
- Method: temporary `export` on `buildFloorGeometry` + a throwaway vitest; both reverted, nothing left in the tree.

### Slice-1 forced material deltas (the baseline slice 2's metalness question is measured AGAINST)

The swap forces exactly four changes, none of them chosen. Instanced quads use `FLOOR_SURFACE`; `TrackFloor` uses `floorSurface()`.

- base `color` `#050507` → `#ffffff` — base colour MULTIPLIES the map; at `#050507` the texture crushes to flat black.
- `map`: none → `trackSurfaceTexture()` (tiled canvas, 1024², one 16×20u panel).
- `roughness` unset (three default 1.0) → `FLOOR_ROUGHNESS = 0.62`; `metalness` unset (default 0.0) → `FLOOR_METALNESS = 0.12`.
- thickness `FLOOR_THICK = 0.6u` (`track-ribbon.tsx:14`) → `SLAB_THICKNESS = 2u` (`track-floor.tsx:15`).
- `emissive #c8d0d8` / `emissiveIntensity 0.05` are carried over unchanged from `FLOOR_SURFACE`.

### Pre-delete comparison — CAPTURED (this was the last chance)

- Matched by construction: `labControls.paused=true` + `labCommands.jumpToZ=2200`, seed 1234, env C, bloom OFF, warmup 20, frames 2. Both temp edits reverted.
- `00-frame-tap/refs/s1-before-instanced-bloomoff.png` — the floor being deleted (instanced 0.6u quads).
- `00-frame-tap/refs/s1-before-generated-bloomoff.png` — `TrackFloor`, same camera and frame.
- Luma (`ffprobe signalstats`, YMIN/YAVG/YMAX): instanced `0 / 31.07 / 255`; generated `0 / 39.33 / 241`.
- Read: generated shows panel seams (faint lateral + longitudinal lines) the instanced floor has none of; generated is brighter and value-graded down the ribbon; the partial gap ahead reads with a visible lit side wall on the generated mesh vs a flat dark slot on the instanced one. No z-fighting in either.
- Both captures taken through the frame tap, no window focus (method matters — see the retraction below).
- Post-swap counterpart captures: `[not yet taken — slice 1 code not written]`.

### Bloom — lab vs game, VERIFIED (asked for before slice 2)

- Game (`net-canvas.tsx:133-139`): one `<EffectComposer multisampling={0}>` + `<Bloom mipmapBlur>` driven by `GRID_VOID.bloom`, hardcoded.
- Lab (`art-lab-canvas.tsx`): same composer and same `<Bloom mipmapBlur>`, but driven by `env.bloom` — i.e. whichever of A/B/C is selected.
- `GRID_VOID` resolves BY NAME (`env-config.ts:160`), not by index, so reordering `ENV_VARIANTS` cannot repoint it.
- Values: A · Deep-Space Drift `1.0 / 0.45 / 0.2` · B · Neon Canyon `1.4 / 0.4 / 0.25` · **C · Grid Void `intensity 1.2 / threshold 0.42 / smoothing 0.2`**.
- So at the lab's DEFAULT env (C) the lab and the game bloom identically. **On A or B they do not** — a bloom gate taken on A or B measures a pass the game never runs.
- Owner's "bloom washes the whole screen out" reproduction: `[unmeasured]` — bloom-ON captures are blocked, see below.

### Frame tap — two environment limits found this session (both first-hand)

- The tap answered on a pre-existing tab, then stopped answering entirely after an HMR full-reload; a freshly navigated tab also did not answer for ~6 minutes across 8 attempts.
- During that window the page was demonstrably alive: Vite HMR `connected`, DOM panels rendered, readout showed `z 2200 / 8000 seg 110/400`, so `useFrame` was running and the jump had applied.
- rAF probe in that tab: **0 frames in 1837 ms**, `visibilityState: "hidden"`, `document.hasFocus() false` — the known hidden-tab state, and not the cause of the tap failing.
- **The tap began answering the moment the lab's `bloom` toggle was clicked OFF, and stopped again when it was clicked back ON.** Reproduced twice in each direction.
- Working hypothesis, NOT verified: with `<EffectComposer>` mounted in an occluded tab the R3F subtree stays suspended, so `FrameTap`'s `hot.on` registration (a passive effect) never runs, while `useFrame` (a layout effect) does. Consequence either way: **bloom-ON captures are currently unobtainable from an occluded tab.**
- Chrome reports `visibilityState: "hidden"` even with the tab active in the frontmost Chrome window, because the terminal covers it (macOS occlusion). Raising Chrome did not change it.

### Brief corrections landed

- `LANE-BRIEF.md` §6 rewritten 2026-09-19: the "the tab must be **foreground**" instruction is **RETRACTED** (it predates PR #134). The diagnosis stands, the conclusion is dead — the tap drives R3F 9.7.0 `advance()`, which gates on none of `frameloop` / `internal.active` / `internal.frames`. Do not reinstate it from a stale copy.
- `track-ribbon.tsx:98` said the rail is retoned "in this task's slice 3"; D7 makes it slice 2. Corrected.
- The two comparison PNGs are GITIGNORED (`.claude/art-pass/.gitignore:3` = `*/refs/`). They exist only on disk in this worktree; they do not survive a worktree teardown.

### Corrections to the "Slice 1 — the floor swap (D1)" section above (both already fixed in code at 639a2f2)

- "`buildFloorGeometry` loops to 400 → no floor past the finish line" — STALE. `track-floor.tsx:157` now reads `Math.round(track.finishZ / SEG_LEN) + Math.ceil(AHEAD / SEG_LEN)`, so the run-out pad is built. Nothing rides slice 1 for it.
- "`emitSpan` hardcodes `t = 0`, `b = -SLAB_THICKNESS`, ignoring `FloorSpan.y`" — STALE. It now reads `const t = span.y; const b = span.y - SLAB_THICKNESS`. `continues()` also compares `y` (`Math.abs(f.y - y) < 1e-4`), so a step no longer suppresses its cap.
- Span count for seed 1234 is 381 (the 2,675 figure in that section is the total across 7 seeds, not one track).
- Evidence made durable: full-res PNGs live only in the gitignored `00-frame-tap/refs/`; tracked copies are `02-track/evidence/s1-before-{instanced,generated}-bloomoff.jpg` (q=2 JPEG, 285 KB + 291 KB, 3456×1926). Committed as plain blobs — `.gitattributes` routes only `apps/client/public/models/**` and `docs/art-direction/**` PNGs through LFS, and adding a third LFS pattern for two files was not worth the risk.
- `CONTRIBUTING.md` §3 comment rule (commit `3d17865`) is NOT on `origin/dev` as of 2026-09-19 — `origin/dev` is `639a2f2`, and the §3 that IS there says the opposite: "Copy its naming, its comment density, its idioms."
- Comment pass done on 5 of this lane's 17 files: `track-floor.tsx` 212→183 lines (79→52 comment lines, 37%→28%), `track-ribbon.tsx` 103→93, `track-materials.ts` 92→76, `track-view.tsx`, and the deleted rail comment. Verified comment-only: `git diff` filtered for non-comment lines shows no logic change.
- NOT yet swept, still owed: `track.tsx` · `track-blocks.tsx` · `track-instancing.ts` · `track-texture.ts` · `tube-walls.tsx` · all of `routes/art-lab/` (7 files). None of them read yet this session.
- Gate GREEN after the comment pass: typecheck 0 errors · lint 3 pre-existing warnings · shared 75/75 · client 9 files passed · server 4/4 · build ✓.
- CORRECTION: the comment rule IS on `origin/dev` as `59805a1` (#137), verified 2026-09-19 — §3 now reads "Comment only what the code cannot say, in 1–2 plain lines". The earlier `3d17865` was a pre-merge branch commit; the PR squash-merged, so that SHA is not reachable from `dev` and never will be. LANE-BRIEF's interim summary has been deleted accordingly.

## Session 2 (2026-09-19) — slice 1, the floor swap

### Authority named BEFORE the slice (standing obligation, supervisor session 2)

- Governing: board 24 panel 04 "Gap lip" — "actual missing deck; thin warm lip; visible dark cut wall and open space underneath"; its do-not-copy column excludes "apparent slab thickness". `ART_MATERIALS.md` §5 maps gap side walls/underside to M8 and the rim/inner lip to M7.
- Governing: `ART_SCALE_REFERENCE.md` §1 — track thickness is "not a sim constant. The sim floor is a plane; thickness is pure art." §6 — a gap is 20u down-track and "should look like a genuine chasm, not a seam".
- Supervisor RULING on the apparent conflict: a board never constrains a VALUE, only an APPEARANCE. The scale reference governs the number (2u is legal, no escalation); board 24 governs whether the edge READS chunky from the chase camera. Where they genuinely collide on the same thing, the scale reference wins on dimensions and it escalates.
- What the slice must therefore buy: the inner lip and the visible cut wall at a gap, which live in the end caps and side faces. Continuous-and-not-z-fighting is NOT sufficient — if gaps still read as flat slots the slice has not succeeded.

### Built

- `track-ribbon.tsx` → `git mv` to `track-rails.tsx`; `TrackRibbon` → `TrackRails`, rails only. Floor quads, `FLOOR_LIMIT`, `FLOOR_THICK`, `showFloor`, `floorRef`/`prevFloor` and the `FLOOR_SURFACE` import all deleted.
- `TrackView` now composes `TrackFloor` + `TrackRails` + `TrackBlocks`. `net-canvas.tsx` unchanged — it renders `TrackView`, so the game picks the generated deck up through the composer.
- `lab-layers.ts`: `slab` → `floor`, now a peer of `rails`/`blocks`, all three independent. Defaults floor ON, rails ON, blocks OFF — unchanged in effect.
- `art-lab-canvas.tsx` mounts the three independently; `showFloor` is gone from the call site.
- `FLOOR_SURFACE` folded into `floorSurface()` — after the swap nothing consumed the near-black base, and an exported constant the game never ships is a lie, not a spare part. `FLOOR_ROUGHNESS` / `FLOOR_METALNESS` untouched (the block lane imports them).
- Rail geometry unchanged: `railY = seg.floors[0].y + RAIL_H/2`, and `TrackFloor`'s top face is also at `span.y`, so the rail sits on the new deck exactly as it sat on the quads. No new coplanar pair.

### Comment sweep — 4 more files, swept while inside them for the swap

- Done this session: `art-lab-canvas.tsx`, `lab-layers.ts`, `track-blocks.tsx`, `track-instancing.ts`. Plus `track-rails.tsx` carried its swept comments across the rename, minus the floor ones.
- Still owed: `track.tsx` · `track-texture.ts` · `tube-walls.tsx` · and 6 of `routes/art-lab/` (`art-lab-controls.tsx`, `art-lab-readout.tsx`, `art-lab-rig.tsx`, `art-lab-sky-controls.tsx`, `lab-state.ts`, `route.tsx`).
- Supervisor confirmed the owed count is 12, not 13; their 13 was a miscount and LANE-STATE was right.

### The Canvas-isolation guard has a FALSE NEGATIVE — measured, not reasoned

- `pnpm lint` went red on a file I did not touch: "apps/client/app/routes/art-lab/route.tsx renders <ArtLabCanvas> and calls: useState, useMemo".
- Cause: `scripts/check-canvas-isolation.mjs` `strip()` removes strings BEFORE comments, and its template-literal regex pairs backticks ACROSS comment boundaries. A collapsed pair can swallow the `*/` between two comments, after which the block-comment stripper eats an arbitrary span of real code.
- Measured at HEAD `3284fed`: running the guard's own `strip()` over `art-lab-canvas.tsx` leaves NO `<Canvas` and ZERO exported function names — the whole file vanishes. So `ArtLabCanvas` was never in the wrapper set and `/art-lab`'s route was never checked, while the guard printed "✓ 8 route entry modules clean".
- Trigger for the flip: my comment sweep cut that file 22 backticks → 6, changing the parity. A comment-only edit is sufficient to change what this guard checks.
- STILL EXEMPT in my tree, same mechanism: `apps/client/app/iso-lab/iso-lab.tsx` and `apps/client/app/iso-lab/iso-lab-canvas.tsx` — both contain a literal `<Canvas` that `strip()` eats.
- The underlying violation is REAL and pre-existing: `routes/art-lab/route.tsx` holds `useState` ×4 plus a `useMemo` directly above `<ArtLabCanvas>`.
- In-repo precedent for the fix: `routes/env-lab/route.tsx` is 3 lines returning `<EnvLabCanvas />` with its state inside the canvas; `routes/art-gallery/route.tsx` returns sidebar + canvas with zero hooks.
- Escalated as NEEDS-DECISION (options: extract an `ArtLabShell` leaf / exempt the route in the guard / both). NOT resolved by me, NOT papered over. Restoring backticks to re-hide it was considered and rejected on sight.

### Gate at the slice-1 code, before the guard question is settled

- `pnpm format` clean · `pnpm typecheck` 0 errors · biome 3 pre-existing `noExcessiveLinesPerFile` warnings and nothing new · shared **75/75** · client **61/61 across 9 files** · server **4/4** · `pnpm build` ✓.
- Client test count is 61 now, not the 37 LANE-STATE records — the difference came in from `dev`, not from this change. All pass.
- `pnpm lint` exits 1 ONLY on the Canvas-isolation guard, for the reason above. No commit taken with it red.

### Frames — NOT taken, blocked on a tab

- Stack IS up: 5201 (vite, pid 73609) and 2601 (server, pid 73608) both listening; `GET /art-lab` → 200.
- `curl "localhost:5201/__frame-tap?name=…&warmup=20&frames=2"` answers: "frame-tap: nobody answered. Is a lab route open on this dev server, in ANY Chrome window?" — no lab tab with a live HMR socket exists in this session.
- So the tap needs a tab OPENED, which the Chrome freeze reserves to a supervisor-granted slot. Requested. `[unmeasured]`: every post-swap frame, including the z=2200 counterpart to `evidence/s1-before-{instanced,generated}-bloomoff.jpg`.
- To match the predecessor's comparison camera the capture needs the same temp edits: `labControls.paused = true` and `labCommands.jumpToZ = 2200`, seed 1234, env C, bloom OFF, warmup 20, frames 2 — reverted after, as they were last time.

### Noted for SLICE 2, not acted on

- `TrackRails` still breaks the rail over full gaps (`if (seg.floors.length === 0) continue`). Board 24 wants the outer boundary "continuous" and "straight", and `ART_MATERIALS.md` M7 separates boundary from inserts by the boundary being "unbroken and predictable". The existing in-code justification is that the break is what makes a gap read at the shallow chase angle. These conflict, the rail is slice 2's subject, and the call is not slice 1's. Left exactly as it was.

### Option A landed — the `ArtLabShell` extraction (supervisor ruling C)

- New `routes/art-lab/art-lab-shell.tsx` holds the four `useState`s, `toggleLayer` and the track `useMemo`; `route.tsx` is now hook-free, returning `<WorldProvider><ArtLabShell /></WorldProvider>`.
- Justification is the in-repo precedent, not the ruling: `env-lab/route.tsx` is 3 lines with its state inside the canvas; `art-gallery/route.tsx` holds zero hooks.
- WHAT THIS DOES NOT DO, recorded so a later session does not misread the commit: the same re-render still walks the Canvas subtree, one level down. It has MOVED, not gone. What it buys is that a React Router loader or navigation re-render of the route entry no longer reconciles the scene — the specific thing non-negotiable #10's rule addresses.
- Side effect worth having: the guard now DISCOVERS `ArtLabCanvas` as a wrapper (`✓ Canvas-isolation: 8 route entry modules clean (wrappers: Canvas, NetCanvas, ArtGalleryCanvas, ArtLabCanvas, EnvLabCanvas, LandingScene)`) — `/art-lab` is checked for the first time, and passes.
- `scripts/check-canvas-isolation.mjs` NOT touched. Issue **#138** owns it. Supervisor reproduced the defect independently on `dev` at `59805a1`: strip() leaves `iso-lab.tsx` at 19%, `iso-lab-canvas.tsx` at 39%, `art-lab-canvas.tsx` at 27% — blind to all three since #115.

### Owner's "I can only see the rails, no floor" — DIAGNOSED, and it is NOT a mounting fault

- Frame tap answered at `http://localhost:5201/art-lab`, bloom ON, composed, 22 frames pumped → `00-frame-tap/refs/s1-after-swap.png`, 3456×1994.
- The deck IS mounted and IS rendering. It fills the frame. This is not a wiring fault, not an unmounted layer, and not a black material.
- Whole frame: YMIN 6 · YAVG 61.33 · YMAX 255 · SATAVG 4.41.
- Deck block 1000×1000 at x1400,y300: YMIN **55** · YAVG **65.34** · YMAX **81** · SATAVG 3.47.
- Deck block 1000×560 at x1400,y150 (further up-frame): YMIN 61 · YAVG 69.99 · YMAX 104 · SATAVG 3.98.
- Sky band 1000×60 at x1400,y200: YMIN 19 · YAVG 58.15 · YMAX 255 · SATAVG 9.27.
- **⚠ I RETRACT MY OWN FIRST READ.** Eyeballing the downscaled frame I called the deck "near-white"; the measurement says mid-grey, YMAX 81 over the deck block — nowhere near clipping. That is the identical error already retracted in LANE-STATE §5 ("near-white, clipped slab and rails — WRONG, a bloom-ON eyeball read of a thumbnail"). Measure the frame; do not read it.
- The real cause of the "no floor" read: the deck is a **near-uniform mid-grey field with no visible panel structure** — 26 luma values of spread across a 1000×1000 block, saturation ~3.5, no seams legible. There is nothing for the eye to identify as a surface, so it reads as absence.
- Consistent with what `LANE-FACTS` already recorded for `FLOOR_SURFACE`: "no map, no roughness, no procedural term: mathematically uniform, nothing for light to catch". The map IS bound now via `floorSurface()`, but at bloom ON its contrast does not survive.
- Consistent too with the predecessor's bloom-OFF capture, which showed the seams as "faint lateral + longitudinal lines". Faint survives bloom OFF and does not survive bloom ON.
- **The deck's finish is SLICE 3's subject**, so this is the expected starting state, not a slice-1 defect. Slice 1 is the swap, and the swap works.
- `[unmeasured]`: the bloom-OFF half of the pair at this camera. The `&ab=1` tap returned "nobody answered" — rewriting `route.tsx` triggered an HMR full reload and killed the tab's socket, the same failure the predecessor recorded. The bloom-ON/OFF pair the supervisor asked for is still owed and needs a live tab.
- `[unmeasured]`: whether the washout is uniform or concentrated in the VFX that still set `toneMapped: false`. One capture cannot answer it; the hypothesis is neither confirmed nor killed.
- NOT DONE and deliberately: no bloom knob touched, no track emissive compensated. Rev 3 §3 makes the boundary strip the reference intensity 1.0 the whole scene's scale is later built from.

### Comment ratio on slice 1's NEW/rewritten files — caught by the owner, fixed

- The sweep fixed the READ path; writing `art-lab-shell.tsx` fresh at 13 comment lines on 50 re-opened it on the WRITE path. A new file written at a high ratio instructs the next agent to match it, which is the exact loop the rule was rewritten to break.
- `art-lab-shell.tsx` 50→43 lines, 13→6 comment lines (26% → 13.9%). Kept: the `length - 1` = C · Grid Void inline, the one-line `resolveTrack` purity note, the lab-state boundary rule. Cut: the JSDoc paragraph restating the four useStates below it, the env-lab/art-gallery precedent argument (it is PR-body material, same category as the re-render caveat), and the functional-update note naming the pattern it sits on.
- `track-rails.tsx` 59→54 lines, 11→6 comment lines (11.1%). Cut the "instanced while the floor is one baked mesh" paragraph — a design argument, and partly invented at the rename rather than carried across.
- `route.tsx` 29→21 lines, 14→6 comment lines (48.2% → 28.5%). Not named in the review but in the same diff: removing the hooks left all the prose behind. Kept the wrong-scale reason the instrument exists and the hook-free boundary rule; cut the rest.
- Tree average at the time of the review was 22.6% and falling.
- Gate GREEN after the trim: format · typecheck · biome 3 pre-existing warnings · Canvas-isolation 8 clean · shared 75/75 · client 61/61 · server 4/4 · build.

### `lab-layers.ts` — swept once, still above bar, trimmed again

- After the session-2 sweep it still measured **42.8%** (24 comment lines on 56) — the second-worst file in the routed set, and inside the PR whose own subject is comment discipline.
- Cause: the sweep rewrote the header but KEPT an 8-line MECHANISM block enumerating the rejected alternatives (koota trait, context, URL search param). That is the "five mechanisms weighed" shape the rule names; it belongs in the PR body.
- Now **40 lines, 8 comment, 20.0%**. Kept: the one-line "re-render IS the effect / per-frame knobs live in lab-state" boundary, the blocks-OFF-by-default reason with its one-click caveat, backdrop being independent of `env`, ships hiding the MESH only, and the key-order note on `LAB_LAYER_KEYS`. Cut: the mechanism block, the DEFAULTS paragraph (the object states them), and the one-line restatements of `floor`/`rails`/`env`/`finish`.
- LESSON, worth more than the number: a file can be swept and still be above bar. "Swept" is not a state; the ratio is. Measure after, not just before.

### Routed sweep set is 13, not 12 — my earlier concession was wrong

- `routes/art-lab/` holds **8** sweepable files, not 7: art-lab-canvas, art-lab-controls, art-lab-readout, art-lab-rig, art-lab-sky-controls, lab-layers, lab-state, route. (Excluded: `scene-probe.tsx`, temp, deleted at slice 4; `art-lab-shell.tsx`, new this slice.)
- 5 scene files + 8 = **13**. The supervisor's first message said 13 and enumerated 12; I resolved it to 12 and resolved it the wrong way. Accepted back to 13.
- DONE (5, all in #140): track-blocks 13.9% · track-instancing 21.7% · art-lab-canvas 19.1% · lab-layers 20.0% · route 28.5%. Not in the 13 but in the PR: track-rails 11.1% · art-lab-shell 13.9%.
- PENDING (8): track.tsx 11.5% · track-texture.ts 35.0% · tube-walls.tsx 12.3% · art-lab-controls.tsx 8.9% · art-lab-readout.tsx 23.9% · art-lab-rig.tsx 22.4% · art-lab-sky-controls.tsx 25.8% · lab-state.ts **72.2%** (worst in the set).

### Branch history — the rebase was the SUPERVISOR's

- Commits `ace1b5a`/`8c46e23` on base `3284fed` became `da0855a`/`4e06524` on base `80f2778`. Supervisor confirmed they rebased it at 23:55:33 and had not told me; three agents exist (supervisor, this lane, comment-sweep) and no rogue session. PR #139 and the `chore/comment-ratchet` branch are also theirs.
- Raising it was correct even though content survived. Content surviving is not a reason to absorb an unexplained rewrite.

### ⚠ SLICE 2 GATE HAZARD, told in advance by the supervisor

- #139 adds a **comment-ratchet to `pnpm lint`** counting any line starting with `//` or `*` under apps/, packages/ and scripts/. It does NOT know it is inside a template literal, so **GLSL comments in the `onBeforeCompile` emitter shader WILL count against the file's budget.** Supervisor judged this correct rather than a bug — a shader comment is still a comment. Budget for it before writing the patch, not at the gate.

## Session 3 (2026-09-20) — slice 2, the re-shape

### Base

- Worktree `../slur-worktrees/track-slice2`, branch `art/track-slice2`, HEAD at session start `bf26bfa`, tree clean.
- `packages/shared/dist` did NOT exist in this worktree; `pnpm --filter @slur/shared build` was needed before any node measurement.

### Authority named BEFORE the slice

- Board 24 panel 02 "Boundary": carry "continuous narrow marigold emitter at the upper outer edge; dark engineered section; localized halo and reflection"; do NOT copy "apparent slab thickness; raised rails or ornamental edge machinery".
- Board 24 "Materials and light": the outer boundary is "the clearest continuous track signal… Keep it visually distinct from intermittent interior inserts."
- Board 24 "Scale and construction": "emitter width and slab thickness remain unapproved numerical choices. Preserve the visual relationships above rather than measuring the pixels." So `BOUNDARY_W`/`BOUNDARY_H` are a lane call, NOT a scale-reference number, and need no escalation.
- `ART_MATERIALS.md` element map: "Track boundary / edge strip | M1 carrier + **M7**, embedded at the outer edge — never a raised rail".
- `ART_MATERIALS.md` M7: the emitter sits "in the top outer corner of the slab, with the dark cut side-face dropping away beneath it".

### Built — geometry only, NO retone

- `track-rails.tsx` → `git mv` to `track-boundary.tsx`; `TrackRails` → `TrackBoundary`. `RAIL_W`/`RAIL_H`/`RAIL_LIMIT` deleted.
- NEW `track-geometry.ts` holds the quad primitives (`pushQuad`, `uvFor`, `packGeometry`, the normal constants) that the deck and the strip now share, plus `BOUNDARY_W = 0.5`, `BOUNDARY_H = 0.5` and `isOuterEdge()`. The notch and the strip must agree; a contract shared by two files lives in neither.
- The strip is an L-section on the slab's top outer corner: `BOUNDARY_W` across the top plane, `BOUNDARY_H` down the outer face. Nothing stands proud — highest boundary vertex is exactly `span.y`, pinned by a test.
- The SOLID is unchanged. `emitSpan` yields FACETS, not material: at an outer edge the deck's top face stops at `±(HALF_WIDTH - BOUNDARY_W)` and its outer wall starts at `span.y - BOUNDARY_H`, and the strip fills exactly that. Disjoint, not overlaid — so there is nothing to z-fight, and the visual hull still equals the physics hull.
- End caps stay full rectangles: the cap is the face you look AT across a gap, and the corner point `(±32, span.y)` is legitimately on it.
- `BOUNDARY_SURFACE` is `RAIL_SURFACE` renamed, VALUES UNCHANGED (`#c8d0d8` / 2.6 / `#15171a`). The retone is held on the supervisor's instruction pending the owner's ruling on which material sheet is canonical.
- Boundary is now BAKED over the deck's segment range (shared `segmentCount()`), not instanced from a moving Z-window. That retires the rail pool's fixed `RAIL_LIMIT = 128`, which silently dropped instances past it.
- Lab layer `rails` → `boundary`. Boundary OFF now leaves the deck's corner unsurfaced — that is the A/B for what the strip is doing, and it is deliberate.
- `/art-gallery`'s `rail` subject (a hand-rolled 0.6 × 0.35u box) is REPLACED by `boundary-subject.tsx`: 8u of real deck plus the real strip, built at true world X so the panel UVs land where they do in game. The old subject would have shown the excluded shape after the shape was deleted.
- `placeholder-monolith.tsx` follows the rename only. Recorded in-file: it imports the GAMEPLAY-tier emissive for an environmental subject; the monolith lane owns unpicking that. Not touched further.

### Measured — seed 1234, node against `packages/shared/dist`, same `isOuterEdge` rule as the code

- Build range `last` = 445 segments (400 track + 45 run-out pad).
- 426 floor spans · 19 zero-floor segments (full gaps).
- 814 span edges at `±HALF_WIDTH` → **1,628 boundary quads · 9,768 vertices · 117,216 bytes** of position attribute, built once in a `useMemo`.
- Segments carrying the strip: **406 on both edges · 2 on one edge only · 18 on neither**.

### The floor-span finding (feeds escalation 2, does not resolve it)

- Over the 400 track segments: 361 reach both edges, 19 have no floor, and the remaining **20 are partial spans that reach NEITHER edge** (18 of them plus the 2 one-edge cases across the full 445).
- The generator emits MID-TRACK strips, never edge-hugging ones. So board 24's "a near-edge gap retains an intact supporting outer floor strip and a straight outer boundary" describes a case this generator does not currently produce.
- Consequence, measured: the OLD rail keyed on `seg.floors.length !== 0` and drew at `±32` regardless, so for those 20 segments it was **floating at ±32 over empty space on both sides**.
- Embedding makes that impossible by construction — a strip in the slab's corner cannot exist where there is no slab. This is FORCED by the shape change, not a decision taken in this lane.
- `track-rails.tsx:34`'s full-gap break semantics are PRESERVED exactly: no floors → no spans → no strip. Escalation 2 is untouched and still open.

### Pinned by test — `track-boundary.test.ts`, 5 cases

- Highest boundary vertex is exactly `0` (a positive value here IS the excluded "raised rail").
- The strip is 4 quads / 24 verts per full-width span, reaching `±HALF_WIDTH` at both `y = 0` and `y = -BOUNDARY_H` — i.e. it wraps the corner rather than lying flat on it.
- The deck's UPWARD-facing vertices at `y = 0` span exactly `±(HALF_WIDTH - BOUNDARY_W)`: the deck stops where the strip starts. No seam, no overlap.
- An interior span (`-24..-8`) gets ZERO strip and keeps its full un-notched top face — gap rims are board 24 panel 04, a different element.
- Outward normal sign checked on both outer facets, because winding is computed rather than hand-ordered and an inverted facet vanishes under backface culling with every gate green.
- First draft of the deck assertion FAILED at `±32` vs `±31.5`. The code was right; the test was measuring end-cap vertices, which legitimately sit at the corner. Hence the `facingUp` filter.

### `gl.toneMapping` — CLOSED, was `[unmeasured]`

- `@react-three/fiber@9.7.0` sets `gl.toneMapping = flat ? NoToneMapping : ACESFilmicToneMapping`; no `<Canvas>` in this app passes `flat`.
- `@react-three/postprocessing@3.0.4` `<EffectComposer>` runs an effect that sets `gl.toneMapping = NoToneMapping` while mounted and restores the prior value on unmount (`dist/index.js`). It adds tone mapping to the CHAIN only if you mount its `<ToneMapping>` effect.
- `grep -rn ToneMapping apps/client/app` (excluding `toneMapped`): **zero hits**. Nothing mounts it.
- Therefore: **bloom OFF → ACES Filmic. Bloom ON → no tone mapping at all.** That is why `gl.toneMapping` read 0 live, and it explains the owner's "bloom washes the whole screen out" without any emissive being wrong: with no ACES rolloff every emissive above 1.0 clips hard to white, then blooms.
- Consequence for the gate: a bloom-on/bloom-off pair currently varies bloom AND tone mapping together. D3's criterion "reads marigold in the final tone-mapped frame" is unrunnable in the bloom-ON half.
- NOT fixed here. Mounting `<ToneMapping>` changes every frame in the game and belongs to task 3's bloom/exposure budget.

### ACES probe — the retone's arithmetic, computed and ready for when the retone is unblocked

- Method: three's `ACESFilmicToneMapping` transcribed from `tonemapping_pars_fragment.glsl` (exposure 1), then linear→sRGB; bloom test is postprocessing's Rec.709 luminance on the LINEAR frame against env C's `threshold 0.42`.
- `#F59A24` (M7 primary marigold) ×1 → linear luma 0.43 (only just over threshold) → displayed rgb(231,174,59), hue 30°, sat 0.95.
- `#F59A24` ×2 → linear luma 0.85 → rgb(249,213,111), hue 39°, sat 0.83.
- `#F59A24` ×4 → rgb(255,235,166), hue 44°, sat 0.62. ×6 → sat 0.47.
- `#FFE0A0` (hot core) is ALREADY desaturated at ×1: rgb(227,216,185), sat 0.37. Authoring the core colour directly gives a near-white band — consistent with M7's "does not have to be authored into every insert".
- ACES moves hue UP with intensity (20° source → 30° at ×1 → 46° at ×6). So the failure direction is yellow-white washout, NOT the vermilion board 24 warns against.
- Read: §3's "reference intensity 1.0" is a SCALE anchor, not `emissiveIntensity: 1.0` in three units — at ×1 the strip sits on a knife-edge of blooming at all.
- `[unmeasured]`: all of the above is arithmetic, not pixels. No frame has been captured this session and the stack has not been launched.

### Gate at the re-shape — GREEN

- `pnpm format` clean · `pnpm typecheck` 0 errors · biome 3 pre-existing `noExcessiveLinesPerFile` warnings, nothing new · Canvas-isolation 8 route entry modules clean · comment ratchet "13 changed source files, none gained comment lines" · shared **75/75** · client **66/66 across 10 files** (was 61/61 across 9 — the 5 new are this slice's) · server **4/4** · `pnpm build` ✓.
- The ratchet DID bite, exactly as forecast: first lint run flagged 3 new files over the 20% budget and 3 touched files as having gained lines. Fixed by cutting, not by suppressing.

### Correction to a standing lane fact

- "The commit hook rejects a `Co-Authored-By` trailer" is WRONG about the mechanism. `.githooks/` contains only `install-hooks.sh` and `pre-commit`; `pre-commit` has no author check (`grep -i author` → nothing), `.git/hooks/` holds no installed hooks in this worktree, and 15 of the last 40 commits on this history DO carry the trailer.
- The RULE still stands and is still followed — it is project policy, `CONTRIBUTING.md:131`, not hook enforcement. Only the stated reason was wrong.

### Owner ruling relayed by the supervisor, 2026-09-20 — the retone's terms, NOT yet acted on

Recorded before any retone code exists, because this arrived as a message and lives nowhere else on disk.
The ruling is "reconcile, keep both" between the rev-3 sheet and the uncommitted Codex revision.

- **No frozen numeric anchor.** The Codex text wins on this point: "The former blanket environmental
  no-halo rule and numeric 0.25 intensity cap are not final art constraints… Judge environmental
  subordination in the composed frame; no numeric light ratio is frozen." So "the boundary strip is
  reference intensity 1.0" is DEAD as a target. The ACES probe above replaces it.
- **M1 becomes metalness 1.0 / roughness 0.35–0.50**, replacing the shipped 0.12 / 0.62. The owner took
  the Codex values as a STARTING POINT — that sheet also says "Numeric settings are inherited first-pass
  tuning presets, not frozen art requirements… Tune to the final references under the real camera and
  lighting."
- **The M1 metalness sitting is CANCELLED. Do not render that pair.** It was going to the owner as an
  open escalation; the ruling settles it. Known risk to watch instead: at metalness 1.0 everything the
  specular misses goes black, because the sky measures ~linear 0.01 as an IBL source. If that bites it is
  now a FINDING to raise with a frame, not a decision waiting on anyone.
- **Acceptance is "judge at gameplay distance and race speed, with bloom enabled and disabled"** plus
  "Preserve gold after tone mapping, rather than reddish spill." The ACES probe says the failure direction
  is yellow-white washout, not vermilion — so the second clause is not the live risk; the first is.
- **Standing assumption CONFIRMED under the winning text:** author the honest value and let the bloom-ON
  frame show the defect. Do NOT dim the strip to hide bloom washout.
- **Tone mapping: deferred to task 3 by owner ruling. Do NOT mount `<ToneMapping>`.** The measurement
  above stands; whoever presents bloom-on/bloom-off frames must label them honestly, because that pair
  currently varies bloom AND tone mapping together.
- **Board 24 still governs the boundary under both sheets**, so nothing in the re-shape commit is at risk,
  and `BOUNDARY_W`/`BOUNDARY_H` remain a lane call.

### Still owed at this seam

- The retone itself. NOT STARTED — no emissive value changed, no frame captured, stack never launched.
- The frames: `PORT=2601 pnpm dev`, then `curl localhost:5201/__frame-tap?name=<name>`, bloom on AND off
  at a matched camera, both labelled. `[unmeasured]` — every pixel of this slice.
- The emitter array (step 3) has not been designed or started.

---

# `art/emitter-array` — LANE FACTS

Appended by the emitter-array lane (task 2, D2/D7). Same rules: one line each, `[unmeasured]` is honest.

## Environment

- Worktree `/Users/apple/Projects/personal/slur-worktrees/emitter-array`, branch `art/emitter-array`, base `origin/dev` @ `1b2e71f`.
- Ports `CLIENT_PORT=5200` / `VITE_SERVER_PORT=2600`; stack started `PORT=2600 pnpm dev`, log `.claude/lane/dev.log`.
- `curl http://localhost:5200/art-lab` → `200`. Stack came up first try; no stale `.vite` cache, no git-lfs smudge fault.
- `three` installed version `0.185.1`, read from `apps/client/node_modules/three/package.json`.

## Source readings (three@0.185.1, installed tree)

- `ShaderChunk/lights_fragment_begin.glsl.js` declares `geometryPosition`, `geometryNormal`, `geometryViewDir`, `geometryClearcoatNormal` and `IncidentLight directLight` unguarded, before any light loop.
- Same chunk calls `RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight )` — the exact signature the patch reuses.
- `ShaderChunk/lights_pars_begin.glsl.js:56` `getDistanceAttenuation( lightDistance, cutoffDistance, decayExponent )` sits OUTSIDE every `#if NUM_*_LIGHTS` guard → available with zero scene lights.
- `ShaderChunk/lights_physical_pars_fragment.glsl.js:645` `#define RE_Direct RE_Direct_Physical`, unconditional.
- Same file lines 178-183: anisotropy enters `RE_Direct_Physical` via `material.anisotropyT`/`anisotropyB` under `USE_ANISOTROPY` — so routing through `RE_Direct` inherits anisotropy with NO change to the injected GLSL.
- `ShaderLib/meshphysical.glsl.js:186` contains the literal `#include <lights_fragment_begin>` the patch string-matches.
- `webgl/WebGLUniforms.js:74` `flatten()` returns the array unchanged when element 0 is a number → a flat `Float32Array` uploads directly to a `vec4[]` uniform with no per-frame boxing.
- `math/Color.js:204,286` `setHex`/`setStyle` default to `SRGBColorSpace` → `new THREE.Color('#F59A24')` converts to working-linear, matching how three treats a light's own colour.

## As-built

- `EMITTER_SLOTS = 12`, a literal interpolated into the GLSL array size; the `onBeforeCompile` closure's source text is constant, so three's default `customProgramCacheKey()` (returns `onBeforeCompile.toString()`) is safe and no override is needed.
- Slot layout: `uEmitters[i]` = view-space centre xyz + half-length along `uEmitterAxis`; `uEmitterTint[i]` = rgb×intensity + cutoff distance. Cutoff `0` parks a slot.
- Emitters are TUBES, not points: closest point on the run to the reflection ray (Karis 2013 representative point). A point emitter is the same slot with half-length `0`, which is the shape task 3's engines/pickups inherit.
- Rail runs are STATIC per track (`buildRailRuns`), not rebuilt per frame: the strip is baked into the deck and neither moves. Per frame the work is a K-nearest scan plus ≤12 writes.
- Runs are clamped to `[shipZ - range, shipZ + range]` each frame; endpoints therefore slide continuously rather than popping in and out of the K set.
- Emitter positions are transformed to view space on the CPU (`camera.matrixWorldInverse`), matching what three does for its own lights; the shader does no matrix work.
- Defaults landed: `RAIL_EMITTER_INTENSITY = 40`, `RAIL_EMITTER_RANGE = 150`, `RAIL_EMITTER_DECAY = 1`. All three are **guesses pending a render** — see below.
- Decay defaults to 1, not 2: at physical `1/d²` the ribbon's centre is 32u from either rail (attenuation ~1/1024) and would stay black. Authored falloff was the research's stated reason to prefer this mechanism.
- Panel knobs added under a `rail emitter` section: intensity (0-200), range (10-400), decay (0-3). All three are in `debugTuningSource()` so a landed value copies out as source.
- Deck material confirmed `FLOOR_METALNESS = 1.0` / `FLOOR_ROUGHNESS = 0.42` at `track-materials.ts:14,16` — matches the brief; the README's "flagged, not decided" section is stale (supervisor owns that doc and is fixing it).
- Comment ratchet paid in `track-materials.ts`: added 1 line for the authored-decay reason, removed a 2-line doc block that sat on `FLOOR_ENV_MAP_INTENSITY` while describing `floorSurface()`, re-added as 1 line on the function it describes. Net 0.

## Gate

- `pnpm typecheck` → pass (shared, server, client).
- `pnpm lint` → pass. 3 pre-existing `noExcessiveLinesPerFile` warnings, none in changed files. Comment ratchet: "7 changed source files, none gained comment lines".
- `pnpm --filter @slur/shared test` → 75 pass / 0 fail.
- `pnpm -r test` → server 4 pass, client 72 pass (11 files), including 5 new `track-rails.test.ts` cases.
- `pnpm build` → pass.

## Not measured

- **Nothing has been rendered.** Every visual claim about this slice is `[unmeasured]`.
- The tab reports `visibilityState: "hidden"`, `document.hasFocus() === false`; rAF is therefore dead and the canvas is black for that reason, not as a result.
- `curl 'http://localhost:5200/__frame-tap?name=emitter-01'` → `504`. No `__r3f` key on the canvas or any ancestor, and a 40-frame fiber walk found no R3F store → the R3F root never mounted in this tab. Consistent with the known "never-visible tab never mounts R3F" fault, whose remedy is mounting visible, not reloading.
- Shader compile is therefore **unverified**: with no render, the program is never linked, so a GLSL error would not have surfaced yet. Typecheck cannot see inside a template literal.
- Isotropic vs anisotropic: `[unmeasured]` — the brief requires settling it by rendering and it is not yet renderable.
- Whether `FLOOR_METALNESS = 1.0` is tenable: `[unmeasured]`, and it is the README's own "single most likely thing to fail at the rail gate".
- Frame-time cost of the patch: `[unmeasured]`.
