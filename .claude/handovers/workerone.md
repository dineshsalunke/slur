Agent: workerone · Lane: #354 fake deck reflections (owner-approved A+B+C) · Updated: 2026-09-28 23:59

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#354: warm additive streaks on the deck under rails, block seams, pickups and exhausts, like
`docs/art-direction/golden-reference/cruise-lighting.png` (LOOK only). Every tier, near-zero cost.
Then, as a SEPARATE commit with its own measurement: stronger deck Wear maps + deck anisotropy.

Owner decisions (via supervisor): approach A+B+C approved. v1 has NO stencil: measure and report
how often a streak floats over a gap lip. Exhausts are IN v1. Do not touch canvas-gl.ts or
scene-effects.

## Done

- `3c576aa` part 1: rail sheen (deck patch) + block-seam streaks. Shared streak shader in
  `deck-reflection/deck-reflection.ts`.
- `668df76` FIX: 3c576aa blacked the main view (NaN). Cause: spot profile
  `exp( - pow( ( v - centre ) * 2.5, 2.0 ) )`, pow of a negative base. Now squared by
  multiplication, quad varyings clamped. Reported to supervisor.
- `f0562e7` pickups + exhausts + tuned defaults:
  - `pickup-reflections/`: InstancedMesh, one quad per pickup anchor, matrix = translation,
    `m[0]` = alive (0 when taken). Mounted in `pickup-field.tsx`. Utils test added.
  - `exhaust-reflections/`: shares ExhaustField's instanceMatrix + aDrive via onBeforeRender, plus
    new `aDeckY` (floorBelow per ship, `NO_FLOOR` = -1e5 → skipped). Reach 6u.
  - Defaults: stretch 1.5, length 36, width 0.6, rail 1, block 0.6, pickup 1.5, exhaust 0.3.
    Spot factor 2.5 → 3.5 (soft ends).

## State

- On screen [measured, headless DPR 1, /test-level]: block seams cast columns toward the camera,
  pickup casts a line to the ship, exhaust a soft streak behind the ship, rail sheen reads on the
  right rim (left rim is washed out by the white sky light on the deck). Shots in session scratchpad
  only (lost on clear); driver recipe below.
- Perf [measured, DPR 1 1728×1080, GPU-synced median, best of 2, owner tab may share GPU]:
  low on 3.40 / off 3.20 / no rail patch 3.10 ms, draws 49 vs 46;
  high on 9.60 / off 7.90 / no rail patch 8.00 ms, draws 129 vs 123 (rear view doubles streak draws).
  high runs were noisy (16.1 / 9.6 on). The +1.7 ms at high is [unconfirmed]; rerun before the ADR.
  Draws 129 is under the 200 soft cap.
- Gap-lip artefact count over a drive: [unmeasured].
- Driver recipe: playwright-core from `~/.npm/_npx/9833c18b2d85bc59`, system Chrome `--headless=new`
  `--force-device-scale-factor=1 --mute-audio`; tuning through `slur.tuning.v1` localStorage; use
  `page.screenshot` (canvas toDataURL gives black); place ship via loaderData room
  `sim.state.players.get(sessionId)` x/z/lastSafeX/lastSafeZ. Draw count: init-script wrapper on
  `HTMLCanvasElement.prototype.getContext`. Rail-off: `page.route` rewrite of `track-floor.tsx`
  `patchRailSheen( mat, reflection )` → `0`. perf skill's `perf.mjs` needs a StoreExpose edit — avoided.

## Uncommitted

- none of mine. `scene-backdrop/*` modified in the tree are NOT mine.

## Held files

- `deck-reflection/*`, `block-reflections/*`, `pickup-reflections/*`, `exhaust-reflections/*`,
  `track-floor/track-floor.tsx`, `track-blocks/track-blocks.tsx`, `pickup-field.tsx`,
  `exhaust-field/*`, `deck-breakup.ts`, `docs/DECISIONS.md`, `docs/ART_MATERIALS.md`.
- `dev/tuning-schema.ts`: supervisor handoff — do NOT edit until the supervisor says workerthree's
  envMapIntensity deletion (#355) has landed. My Reflect defaults are already committed (f0562e7).
- Part 2 adds `track-materials.ts` (claim it first).

## Next

1. Rerun the perf at high (3 reps) alone on the GPU to confirm or drop the +1.7 ms.
2. Count gap-lip artefacts over a drive (streak drawn where the deck has a hole). Report the rate.
3. ADR in `docs/DECISIONS.md` + ART_MATERIALS note (element → material map: reflections are
   additive accent, tone-mapped). Commit.
4. **Part 2 (separate commit):** (a) widen Wear ranges (metalMin/metalMax, roughSpan, valueSpan)
   with before/after taps. (b) Deck anisotropy via MeshPhysicalMaterial with extras at 0 (three
   0.185.1 compiles Standard and Physical as one 'physical' program; anisotropy compiles only when
   > 0). Check `#define PHYSICAL` is a no-op at metalness 1. Measure the low tier. Dials
   Deck.anisotropy + Deck.anisotropyRotation (after the tuning-schema handoff clears). Check
   chainShaderPatch / deck-breakup / rail-sheen still work. workerthree may send Metal values.
5. Close #354 with SHAs after part 2.

## Open questions

- Left rim sheen is invisible under the white sky light on the deck. Accept, or raise rail gain?
  (owner, via supervisor)

## Lessons → memory

- Updated `.claude/memory/msaa-edge-samples-extrapolate-varyings.md` (second incident: `pow(x, 2.0)`
  on a signed value; triage by zeroing gains through `slur.tuning.v1`).
