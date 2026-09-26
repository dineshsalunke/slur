Agent: workerfour · Lane: #295 Blink pickup (after the portal) · Updated: 2026-09-26

## Goal

Build a Blink pickup: an instant short self-hop, forward, back or diagonal. Reuse the portal's BC4 path
(`clearSpotAt()` + the `portalHops` snap counter).

## Done

- 1ef88f0 — ADR-022: the exit-ring bloom is kept as the hop flash (owner decision). Open item closed.
- #289 portal: all slices shipped, issue closed (see git log of this file).

## State

- The plan went to slur-supervisor: 4 slices, 5 open questions. No approval yet.
- Clients do not predict powers. Fire intents are applied on the server at their input seq (`run-sim.ts` `fireReady`). [read this session]
- Ratios: seeker, mine, boost and shield 0.15 each; portal and tug 0.1 each; the bolt takes the remaining 0.2. [read this session]

## Uncommitted

None.

## Held files

None. The S1 claim is requested and not yet cleared: `combat/blink.ts`, `blink.test.ts`, `combat/constants.ts`,
`combat/power-bag.ts`, `sim-config.ts`, `index.ts` (all under `packages/shared/src/`).

## Next

1. Wait for the owner's approval and answers, relayed by the supervisor.
2. S1 shared sim → S2 server (`run/combat.ts`; serialize with workerfive on `run-sim.ts`) → S3 client → S4 docs.
3. Verify on /test-level. Close #295 with the SHAs.

## Open questions

- Distance fixed or speed-scaled; lateral from the held strafe; back-hop vz; prediction deferred; the share.

## Lessons → memory

- none.
