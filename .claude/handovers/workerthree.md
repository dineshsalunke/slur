Agent: workerthree · Lane: #362 default HDRI → cyclorama_hard_light (CLOSED) · Updated: 2026-09-29

## Goal
Make Poly Haven `cyclorama_hard_light` (1k, CC0) the default lighting HDRI, replacing kloppenheim_02_puresky.

## Done
- d47a026: cyclorama_hard_light_1k.hdr self-hosted; HDRI_DEFAULT_URL; kloppenheim file deleted; ADD.md, DECISIONS.md ADR-030 item 2, ART_MATERIALS.md item 22. Pushed. #362 closed with the SHA.
- Earlier: 9c2ce73 (#356 marigold env band).

## State
- Dev server serves the new file: 200, 1,409,707 B. HDRI vitest 7/7 pass.
- Offline node stats (band defaults 1.5 / 6°): key peak az 36° el 24° (old sun az 36° el 17°) → rotation 0 still fits.
- Mean radiance 0.774 vs 0.311 old. Up-face irradiance 2.74 vs 0.99; down-face 2.08 vs 0.25.
- Band share of vertical-face irradiance 4–9% (was 7–26%); of total env energy 4.9% (was 11.3%).
- bandIntensity ≈ 5–7 would restore the old share [computed, not seen on screen].
- On-screen look [unmeasured]: owner verifies on /test-level.

## Uncommitted
none

## Held files
none

## Next
1. Idle. Wait for the owner's /test-level verdict: keep bandIntensity 1.5 or raise it (5–7).

## Open questions
- Owner: the new map is ~2.5× brighter overall. Lower Environment.intensity (1.2)? Raise bandIntensity?

## Lessons → memory
.claude/memory/measure-an-hdri-offline-in-node.md
