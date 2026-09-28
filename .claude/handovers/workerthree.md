Agent: workerthree · Lane: #355 Environment.intensity dial (CLOSED) + deck albedo match (report sent) · Updated: 2026-09-28

## Goal
#355: one global reflection dial (owner chose option a). Albedo: measure the deck against the golden crop and recommend. No source edits.

## Done
- 5c85b52: deleted the Deck/Rail/Rock/Ship.envMapIntensity dials (schema, leva, material writes). #355 closed with the SHA.
- Albedo report sent to the supervisor. No source edits.

## State
- A/B at defaults, headless high: deck stats identical before and after 5c85b52. Environment.intensity 0 / 5 gives mid-deck p50 7 / 150.
- Albedo (L/R/M deck regions, p10/50/90; target 26/35/47):
  defaults L 112/203/237, R 34/44/55, M 44/59/77. The near-white L is the HDRI lobe (rotation 0).
  rot180 + Metal.baseColor #595c62: L 23/32/38, R 20/25/38, M 27/41/54. Recommended.
  rot180 + Environment.intensity 0.8: L 26/35/41, R 22/28/39, M 27/39/50. Also dims rocks, ship and rails.
- Residual: the deck stays cool (body ~41,40,47 vs 34,33,33; groove 14,13,23 vs 12,9,7). The HDRI is the cause.
- Rotation relights rocks and the ship too [seen, unmeasured].
- Scratch: /private/tmp/claude-501/-Users-apple-Projects-personal-slur/4621d17c-671f-43db-996e-8a7fe59a604e/scratchpad
  (sweep.mjs takes a variants JSON, st.mjs region stats, v-*.png taps).

## Uncommitted
none

## Held files
none (all released to the supervisor at 5c85b52)

## Next
1. Owner decides whether to apply rotation 180 + #595c62 (the defaults live in tuning-schema.ts / metal.ts; workerone holds those).
2. Idle. Wait for the supervisor.

## Open questions
- Owner: apply the albedo recommendation? Is the cool deck acceptable, or does the HDRI need a warm tint?

## Lessons → memory
.claude/memory/deck-glare-is-the-hdri-lobe.md
