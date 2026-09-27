Agent: workerone · Lane: #320 portal gate width + hop cue (PLAN FIRST) · Updated: 2026-09-27 (plan sent, awaiting owner)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#320 "Portal looks 4u wide (should read 6u) and a hop has no clear cue".
1. The drawn gate must match the sim catch width (6u, `portalR: 3`, `portalH: 5`).
2. Add a clear hop cue.

**Plan sent to slur-supervisor. No edits until the owner approves.**

## Done

- #318: 4b17a2e, fc85cd7. Closed.
- #320: measured the gate and sent the plan + claim (no code changes).

## State

- The gate is a circle: inner radius 3, centre at deck + 3 (`GATE_CENTRE_Y`). Feet inner edge at x=±2.35 up to y=1.35.
- Raycast of the real geometry (node strip-types script in scratch, imports portal-ring.ts): clear width y=0.5 → 3.21u, 0.8 → 3.99u, 1.0 → 4.39u, 1.25 → 4.71u, 3 → 5.94u.
- Ship ride height is deck + 0.35 to 1.25 (`Hover.base` + `Hover.speedLift`).
- The sim catch is a box: `|dx| < portalR + halfW`, `dy < portalH` (portal.ts `enters`).
- Existing hop cue: two `pushHit` sparks (attach-room-to-world.ts:258) + `portalHop` sfx (respawn.ogg ×1.6). The chase camera hard-cuts x/z.
- ART_SCALE_REFERENCE has no portal row.
- Proposed: arch aperture (straight sides ±3 up to y=2, radius-3 semicircle top at y=5) + gate bursts (MineShock kinds, upright) + FOV punch from the predicted hop. Rejected: bigger circle, lowered circle, HUD tag, camera smoothing. Screen warp is kept as a follow-up.

## Uncommitted

None of mine. Owner data in `tracks/` is not mine. Do not commit it.

## Held files

None until approval. Claim sent: portal-ring.ts(+test), portal-field/{constants,utils,utils.test}, mine-shock-events.ts, mine-shock/{tsx,constants,utils}, net/attach-room-to-world.ts, camera/chase.ts + new camera/hop-kick.ts, ecs/net-systems.ts, docs/ART_SCALE_REFERENCE.md, docs/GDD.md §5.

## Next

1. Wait for the owner's pick, relayed by slur-supervisor.
2. Build the arch geometry and tests. Re-run the raycast: expect 6.0u at every hover height.
3. Build the cues. Verify on /test-level: draw calls unchanged, headless tap of a hop (DPR 1, mute, kill after).
4. Commit by pathspec, then `gh issue close 320 -c "<SHA>"`.

## Open questions

- Owner: A + 1 + 2 as recommended? Deck threshold strip (D)? Screen warp (3) now or later?
- #315, #308, `unionRects` order: still open from the last lane.

## Lessons → memory

none this seam.
