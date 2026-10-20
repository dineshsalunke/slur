Agent: workertwo · Lane: room rules config, RFC-349 S6 (#411, ADR for #70) · Updated: 2026-10-20

## Goal
Add a per-room Rules override map (B2) on the room. It is merged the same way on both ends and locked at GO.
A dev host writes it in the lobby. Step one is ADR-035, approved by the owner before any code.

## Done
- ADR-035 draft written (not in the repo):
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a1837ad7-251d-425d-8ee5-b99b466513f7/scratchpad/adr-035-draft.md`.
  Sent to slur-supervisor for the owner on 2026-10-20.

## State
- Last ADR in `docs/DECISIONS.md` is ADR-034, so this one is ADR-035.
- `RunSim` takes its config once in the constructor (`run/run-sim.ts:78`). `RunRoom` passes none, so a
  hosted room runs `DEFAULT_SIM_CONFIG`.
- Client: `attach-room-to-world.ts:121` holds `room.simConfig ?? DEFAULT_SIM_CONFIG` in `RunConfig`. Only
  the loopback room has `simConfig` (`tunedSimConfig()`, live getters over 10 dials).
- `fixedStep` steps only countdown and racing, so the lobby reads no config.
- `RunState` has 14 fields. `SimConfig` has non-number fields: `seekerWindowMode` (enum) and `towJump` (bool).
- The Dockerfile sets `NODE_ENV=production`. No server code reads `NODE_ENV` today.

## Uncommitted
- none

## Held files
- none (the file claim goes out after the owner approves the ADR)

## Next
1. Wait for the owner's answer through slur-supervisor: wire (W1), preset (P1), v1 keys (K1), dev gate (G1).
2. Fold in the answers, then send the supervisor the exact file claim list.
3. Commit ADR-035 to `docs/DECISIONS.md`, then build: specs and `resolveRules` in shared, `RulesState`,
   `RunSim` build at GO, room handler with the dev gate, client derive into `RunConfig`, dials from specs,
   host send.
4. Bit-equality A/B (6 seeds × 3600 ticks plus a negative control), a two-SDK-client decode check, all
   three suites. Push, then close #411 with the SHA.

## Open questions
- The four ADR choices above (owner).
- The dev stack is down. Ask slur-supervisor before starting `pnpm dev`.

## Lessons → memory
- none
