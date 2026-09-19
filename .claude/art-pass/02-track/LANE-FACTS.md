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
