Agent: workerone · Lane: #354 fake deck reflections (part 2b next) · Updated: 2026-09-29 (seam, context warning)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#354: warm additive streaks on the deck (done), then part 2 as SEPARATE commits: 2a Wear ranges
(done: owner keeps the base values), 2b deck anisotropy.

## Done

- `3c576aa` `668df76` `f0562e7` part 1; `a249221` ADR-031 + ART_MATERIALS item 23.
- `59aa760` pickup clear box; `6cb1f36` + `7cb7e05` seam blur + clearance.
- `bb86b64` ADR-031/item 23 updated for the three commits above; left rim marked accepted.
- `e80f54f` part 2a verdict recorded: the owner keeps Wear at 0.3/0.25/0.7/1. No code change.
- `0bb4b5b` #359 (quick lane, CLOSED): EngineLight.back is measured from the rearmost exhaust port.
  Nozzle hue high 16.1° → 31.3°, low 24.5° → 35.6°. The deck pool behind the ship is ~3u further
  back and brighter (luma high 86.5 → 94.6).

## State

- Wear sweep taps [measured]: scratchpad `dce8336e…/scratchpad/shots/{base,w1,w2,w3}-*.png`.
- #359 taps [measured]: scratchpad `dce8336e…/scratchpad/noz/{low,high}-{def,noLight,fixed,…}.png`,
  crops `noz-crop*.png`, `noz-fixed.png`. Scripts: `nozzle.mjs` (SETS, TIERS, BLACK, ROUGH),
  `hue.mjs <png> '[x0,y0,x1,y1]'`, `crop.mjs`, `wear.mjs`, `regstat.mjs`.
- Older scripts in scratchpad `153f7ede…/scratchpad` (gaplip, jshot, joints, perf).
- Client vitest for engine-light 2/2; client typecheck + biome + comment ratchet clean on 0bb4b5b.
- Block-streak verdict (length/blur): not received yet [unmeasured].
- No headless Chrome left running.

## Uncommitted

- none (this handover and the new memory are committed with it).

## Held files

- `deck-reflection/*`, `block-reflections/*`, `pickup-reflections/*`, `exhaust-reflections/*`,
  `track-floor/track-floor.tsx`, `track-blocks/*`, `pickup-field.tsx`, `exhaust-field/*`,
  `deck-breakup.ts`, `docs/DECISIONS.md`, `docs/ART_MATERIALS.md`, `track-texture.ts`,
  `track-materials.ts`.
- `engine-light/*` (#359, done; release).
- `dev/tuning-schema.ts` + `dev/tuning-panel/tuning-panel.tsx`: ON LOAN to workerthree (#356).

## Next

1. Part 2b: deck anisotropy in `track-materials.ts`. Use MeshPhysicalMaterial with the extras at 0
   (three 0.185.1: Standard and Physical share the 'physical' program, WebGLPrograms.js:36-37;
   anisotropy compiles only when > 0, :140). Check that `#define PHYSICAL` is a no-op at metalness 1.
   Check that chainShaderPatch, deck-breakup and rail-sheen still apply. Measure the low tier.
   Dials `Deck.anisotropy` + `Deck.anisotropyRotation` need tuning-schema.ts; preview first with a
   route rewrite (`nozzle.mjs` shows the pattern; register the route AFTER the favicon step).
2. When tuning-schema.ts is back: Environment.rotation 180 + Metal.baseColor #595c62 defaults
   (owner-approved), and a `Reflect.blur` dial for `uReflBlur`.
3. Apply the block-streak verdict if it asks for changes.
4. Close #354 with SHAs after part 2b.

## Open questions

- Owner: are the block seam streaks right (length, blur rate)?
- Owner: the EngineLight.color `#ff9a3c` pool on the deck now shows more after #359. Keep it, or use
  the accent?

## Lessons → memory

- `.claude/memory/point-light-at-an-emitter-shifts-its-hue.md`.
