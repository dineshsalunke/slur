Agent: workerone · Lane: #303 procedural portal models · Updated: 2026-09-27 00:55

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Replace the #289 torus portal visuals with a procedural linked-ring pickup and an A/B gate, matching the owner's hero shots. Client only.

## Done

- 5e9abd0 `scene/portal-ring.ts` (one bevelled wedge → segmented ring, sleeves), pickup (linked pair, dashed face lines), gate (24 wedges, inner sleeve, feet, lug with 1/2 marks). Pushed; #303 closed with the SHA.

## State

- Measured at 5e9abd0: client typecheck clean; client vitest 447/447; biome, ls-lint and the comment ratchet clean on the lane files.
- Draw calls, /test-level headless (DPR 1, 1280×720), median of 30 frames:
  - Before: open deck 128, pickup in view 129, one deployed pair 130.
  - After: open deck 126, pickup in view 127, one deployed pair 132.
  - The −2 on the open deck is not this lane [inferred: other workers' changes between runs].
  - The pair adds 6 = 3 meshes × main + rear-view pass.
- Stills (scratchpad, session d9013cc9): `before-{pickup,gate}.png`, `v3-{pickup,pickup-close,gate,gate-close}.png`.
- Gate aperture = 6u (2·portalR), not the board's 4u. Owner-approved departure; sim untouched.
- The gate's graphite rim reads dark against the sky. It is the deck material under scene light, not a bug. The glowing inner wall dominates at an angle, as in hero shot 12.
- The bottom of the gate ring sits under the deck (centre at y + portalR). Over a void it would show [unmeasured: portals are placed on the deck].

## Uncommitted

None after this commit.

## Held files

None. Released: portal-ring.ts(+test), portal-pickups/*, portal-field/*.

## Next

1. Report to slur-supervisor; take the next lane.

## Open questions

- Owner: is the gate rim dark enough to lose the segmented look? Levers: sleeve reach (`GATE_SLEEVE`), `PORTAL_ARMED_INTENSITY`, or a lighter rim finish.

## Lessons → memory

- New: `.claude/memory/zoom-the-chase-camera-over-cdp.md`.
