Agent: workerthree · Lane: #356 marigold env band (CLOSED) · Updated: 2026-09-29

## Goal
Bring back the warm env band from before #352 in the HDRI-based PMREM env. Dials: colour, intensity, height. Every tier.

## Done
- 9c2ce73: env-band/env-band.state.ts + .constants.ts, scene-environment.tsx wires it; 3 dials in tuning-schema.ts + panel. Pushed. #356 closed with the SHA.

## State
- Mechanism: fullscreen pass HDRI + additive band → HalfFloat equirect RT; `needsPMREMUpdate` on change only. bandIntensity 0 (or unset) → raw HDRI.
- Cost, headless Metal DPR 1, readPixels-synced: PMREM low 0.5–0.7 ms, high 0.6–0.7 ms; band pass 0.2–0.5 ms; 0 extra draws on unchanged frames; first compile ~90 ms.
- Both tiers load the 1k default HDRI (the default URL ignores hdriRes).
- Look at defaults 1.5 / 6°: monoliths and deck go marigold-warm; the effect is subtle on rough faces [seen, not measured].
- Known leak: when the HDRI size changes, the old RT is disposed but its PMREM target is not (WebGLEnvironments adds no dispose listener for RT textures). This happens only when the size changes [inferred from source].
- Scratch: /private/tmp/claude-501/-Users-apple-Projects-personal-slur/71083242-33b1-4d25-ab6b-f4744745c01d/scratchpad (band.mjs, band-sync.mjs, b-*.png).

## Uncommitted
none

## Held files
none (schema + panel loan released at 9c2ce73)

## Next
1. Idle. Wait for the supervisor or the owner's /test-level verdict on the defaults.

## Open questions
- Owner: is 1.5 / 6° strong enough? The band is subtle on the rough monolith faces.

## Lessons → memory
.claude/memory/gl-finish-does-not-sync-headless-metal.md
