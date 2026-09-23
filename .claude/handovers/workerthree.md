Agent: workerthree · Lane: monolith seam flicker → composer MSAA (no issue yet) · Updated: 2026-09-24 ~02:55

## Goal

Owner pick: fix the far monolith-seam flicker by turning on composer MSAA (not polygonOffset). Measure the
cost first and report numbers to slur-supervisor BEFORE committing.

## Done

- 94113ae — diagnosis handover + memory `sub-pixel-geometry-drops-out-without-aa.md`. Cause: sub-pixel
  point sampling, no AA. Report sent to the supervisor.

## State

- Diagnosis numbers (HEAD fd818e6, DPR 1, 1600×813, stepped clock 1u/frame, 41 frames, camera 394→354u
  from the seam pair at z 494.23, x ±34.22): baseline 5–7 whole-seam drops (min 0.65 of neighbours),
  mean frame jump 0.10. Width 0.75/1.0/1.5, proud 1.0/1.5 and polygonOffset −1/−2/−4 each give 0 drops.
  Emissive 6 gives 8 (worse).
- Contamination check: workerfour drove my :9333 Chrome to :5173 for ~40 s. The fresh :9343 baseline
  (`h-base`) matched the :9333 baselines exactly (L 46.7 / min 0.67 / drops at 4,12,19,26,32,33,39;
  R 46.8 / 0.65). `cdp.mjs` attaches only to a `:5183` page, so a run in that window fails rather than
  misreads. Readings stand.
- 1bb7ae3 removed MSAA on the canvas default framebuffer (`antialias: false`, `canvas-gl.ts`). Its reason,
  "the composer's final quad gains nothing from MSAA", still holds [inferred]. Composer `multisampling` is a
  different knob and has been 0 since a2c4f8d. So 1bb7ae3 is not the reason MSAA is off in the scene pass.
- Live allocations at HEAD [verified]: main target `DEPTH_COMPONENT24` 1600×813 non-MS; rear-view FBO
  448×140 already 4× MS (`RGBA16F` + depth).
- All my Chrome instances (:9333, :9343) and scratch :5183 are killed. Next launch: fresh port (e.g. :9353)
  and fresh profile dir.
- Scratch tools (session scratchpad, may be gone): `cdp.mjs` (connect/ev/shot, port is hard-coded),
  `step.mjs` (stepped sequence + seam probe; args tag d0 d1 n setup), `dial.mjs` (tag kind val — in zsh
  pass `${=a}`), `depthfmt.mjs` (log depth formats via addScriptToEvaluateOnNewDocument, keep the CDP
  session open across `Page.reload`), `png.mjs`. Rebuild from this list if missing.

## Uncommitted

- none

## Held files

- Claimed by the supervisor for this lane: `apps/client/app/game/scene/scene-effects.tsx` (not yet edited).

## Next

1. Launch scratch client `CLIENT_PORT=5183 VITE_SERVER_PORT=2577 pnpm dev` in apps/client and headless
   Chrome on a fresh port (DPR 1, `--mute-audio`).
2. Cost A/B without editing: try the composer's `multisampling` live over CDP if reachable; otherwise
   edit `scene-effects.tsx` `multisampling={ 0 }` → 4 (then 2) on the scratch server. Same frozen pose,
   frame time (CPU `performance.now()` around `advance()`, plus GPU via `EXT_disjoint_timer_query_webgl2`
   if swiftshader exposes it) at DPR 1 and DPR 2 (`Render.dpr`), 0 vs 2 vs 4. Note swiftshader is CPU —
   flag that GPU numbers on the owner's machine are [unmeasured]; ask the supervisor whether the owner
   should read the in-game frame meter.
3. Re-run the 41-frame seam sequence with MSAA on: expect 0 drops. Also check the rail lip (#229, db2660c)
   at the same distance.
4. Report numbers to slur-supervisor. Commit only after approval, by explicit path.

## Open questions

- Supervisor/owner: is swiftshader timing acceptable as the cost measure, or should the owner read the
  frame meter on real hardware at DPR 2?

## Lessons → memory

- none new this seam (94113ae holds the diagnosis lessons).
