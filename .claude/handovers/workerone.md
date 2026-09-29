Agent: workerone · Lane: #354 fake deck reflections (part 2b awaiting owner) · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#354: warm additive streaks on the deck (done), part 2a Wear (done, no change), part 2b deck anisotropy
(measured, owner decision pending). Queued: EngineLight pool → marigold (#359 follow-up).

## Done

- `3c576aa` `668df76` `f0562e7` part 1; `a249221` ADR-031 + ART_MATERIALS item 23.
- `59aa760` pickup clear box; `6cb1f36` + `7cb7e05` seam blur + clearance; `bb86b64` docs.
- `e80f54f` part 2a verdict: Wear stays 0.3/0.25/0.7/1.
- `0bb4b5b` #359 (CLOSED): EngineLight.back measured from the rearmost exhaust port.

## State

- 2b [measured]: deck as MeshPhysicalMaterial at anisotropy 0 = Standard (luma 51.0/50.8, 44.8/44.9).
  Deck UV: tangent +x, bitangent +z (track-geometry.ts uvFor 'deck'). Along x: ~no change at 0.5/0.9.
  Along z (rotation π/2): the planet HDRI lobe smears toward the camera, luma +15 at 0.5 and +32 at 0.9.
  At 0.15–0.3 the only visible effect is a larger engine pool. Emissives are not reflected.
- 2b cost [measured, uncapped vsync, 1728×1080]: low 5.0 → 5.1 ms; high 8.35 → 9.1 ms medians, noisy.
- Scripts in scratchpad `19862e93…/scratchpad`: `aniso.mjs` (SETS = material props applied live via
  the __THREE_DEVTOOLS__ hook), `stat.mjs` (region luma + gradients), `cost.mjs` (readPixels-synced
  median, A/B in one page, `--disable-gpu-vsync --disable-frame-rate-limit`). Taps in `old/` and `shots/`.
- 2b question sent to the supervisor with options (a) drop [recommended], (b) dials at 0, (c) 0.15 along z.
- No headless Chrome running.

## Uncommitted

- none. The Physical swap in track-floor.tsx was reverted.

## Held files

- `deck-reflection/*`, `block-reflections/*`, `pickup-reflections/*`, `exhaust-reflections/*`,
  `track-floor/track-floor.tsx`, `track-blocks/*`, `pickup-field.tsx`, `exhaust-field/*`,
  `deck-breakup.ts`, `docs/DECISIONS.md`, `docs/ART_MATERIALS.md`, `track-texture.ts`,
  `track-materials.ts`, `engine-light/*`.
- `dev/tuning-schema.ts` + `dev/tuning-panel/tuning-panel.tsx`: ON LOAN to workerthree (#356).

## Next

1. Apply the owner's 2b answer. For (b)/(c): track-floor.tsx deck → `meshPhysicalMaterial` (3 lines:
   deckRef type, attachDeck param type, JSX tag); anisotropy + anisotropyRotation from `floorSurface()`.
   Record the result in ADR-031.
2. When tuning-schema.ts is back: EngineLight.color default → marigold accent (owner, 2026-09-29), then
   re-measure nozzle hue (`nozzle.mjs`/`hue.mjs` in scratchpad `dce8336e…`), cite 0bb4b5b on #359.
   Also Environment.rotation 180 + Metal.baseColor #595c62 defaults, and a `Reflect.blur` dial.
3. Apply the block-streak verdict if it asks for changes.
4. Close #354 with SHAs.

## Open questions

- Owner: 2b option (a)/(b)/(c)?
- Owner: are the block seam streaks right (length, blur rate)?

## Lessons → memory

- `.claude/memory/aniso-stretches-the-hdri-not-emissives.md`.
