Agent: workerone · Lane: perf bisect (owner report) + parked block-bounce leftovers (#213) · Updated: 2026-09-23 ~18:00

## Goal

Find what dropped the game below 15 fps, and propose a fix; do not fix it. Parked: the #213 bounce leftovers,
which wait on the owner.

## Done

- `042db00`: memory `headless-game-tabs-starve-the-gpu.md` (+ the supervisor's edit to
  `headless-chrome-for-frame-taps.md`).
- Perf report sent to slur-supervisor (not a commit). The supervisor broadcast rule (a).
- Earlier #213 work: `7928739` (respawn probe on gap edges), `afb2642` (spark on predicted bounce),
  `8b4d950` (marigold hit sparks). See `.claude/phases/handover-bounce-leftovers.md`.

## State

Headless Chrome on Metal (M1 Pro), no vsync, no frame cap; old commits run as `git archive` exports:

- No code regression today. `/test-level` DPR 2 (3456×1826), alone on the GPU: HEAD `38b4fb8` 20.3 ms ·
  `a50049f` 20.1 · `ec5c780` 21.0 · `c47c532` 21.6. Draws 103→116, tris ~1.34M flat.
- Cause: GPU contention. HEAD alone is 20.7 ms; with one other headless game tab it is 40 ms (a vsync-capped
  rival also gives 40 ms). The same code read 20, 40 or 66 ms as outside load changed.
- DPR 1 is 8 ms and DPR 2 is 20 ms, so the frame is fill-bound. The rearview (R toggle) costs ~4 ms of 21 at DPR 2.
- Suspect meshes (pickups 131–135 inst, embers 384, hit spark 4/48, fractured 6–8/160, debris 0/24,
  sealed 33–57/320): each ≤2 ms when hidden, which is noise. The asteroids are 1.25M of the 1.34M tris but save only ~1 ms.
- CPU profile: time is GL stalls; postprocessing ~50%, rear-view pass ~25%, PMREM regenerates every frame ~3%.
- Scratch harness (not committed): `<scratchpad>/perf/{cdp,measure,level,ab,host,profile}.mjs` + `hook.js`.
  That scratchpad belongs to the old session. Rebuild the harness if needed: a GL draw hook on
  WebGL2RenderingContext.prototype, plus `window.__THREE_DEVTOOLS__` to reach the scene.
- All my headless Chromes and scratch dev servers (5181–5185) are killed.

## Uncommitted

None.

## Held files

None.

## Next

1. Wait for the owner's choice on the perf code fixes, which the supervisor relays:
   - DPR cap at 1.5 or adaptive DPR (`dev/render-scale.tsx` `TARGET_DPR = 2`; workertwo's slider `248096d`)
   - rearview at lower resolution or every other frame
   - `Environment frames={Infinity}` → 1
   Claim the files with the supervisor before the first write.
2. #213, pending owner yes: an ADR-014 as-built note (bounce is not cheaper than death in time: head-on 1.45 s
   vs death 1.50 s; recommend no intensity retune). File two issues: graze randomness (a clip shallower than a
   threshold should always glance, `step.ts`) and the pocket trap (seed 1, z≈6019, gap 3.1u vs 2.52u hull; fix
   it in the generator or the sim). ADR number, if a new one is needed: ADR-016 (re-check).

## Open questions

- Owner: which perf fixes from Next 1, if any?
- Owner: go-ahead for the #213 ADR note and the two issues?
- #213 leftovers not assigned: remote ships get no bounce spark (needs a broadcast from `run-room.ts`);
  spark WIDTH/BRIGHT look pending; `explosions.tsx` death burst is still cyan/magenta (off-palette).
