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
