Agent: workerone · Lane: pacing step 2a — branching RFC (no issue; owner waived) · Updated: 2026-09-24

The step-1 pacing state is in the version of this file before 383b1d4. The #241 finish-fade state is at 383b1d4.

## Goal

An RFC, no code: how the pacing analyzer represents every viable route, how routes split and merge, what the `/pacing` board shows, and how per-route metrics feed the phrase model and the jump contract.

## Done

- RFC written: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/a42d7260-7d77-4e58-93e1-2b90e521bca9/scratchpad/rfc-pacing-branching.md`. Sent to slur-supervisor.
- Probe script (throwaway): `branches.mjs` and `branches2.mjs` in the same scratchpad. They import `packages/shared/dist`.

## State

- Measured on seeds 20260921, 1, 42, 7, 99991 (probe, not tested code):
  - 111–150 splits per seed; merges match within 2.
  - 1e29–1e39 distinct start→finish routes. A list of routes is not possible.
  - 30–36% of the track has ≥ 2 viable corridors. Max 4–5 side by side.
  - 87–88% of legal cells are viable. 32k–38k dead-end cells per seed.
  - About 10–17 splits per seed have both arms ≥ 25u (lower bound). The rest are short diamonds.
  - Probe time 30–82 ms per seed.
- Recommendation in the RFC: viable set → route graph → fork list (short diamonds folded in as dodges).
- workertwo is fixing the `/pacing` lag and may hold `apps/client/app/routes/pacing/*`.

## Uncommitted

None. The RFC and probes are in the scratchpad, not the repo.

## Held files

None until the owner approves the RFC.

## Next

1. Wait for the owner's answers to the RFC open questions (relayed by slur-supervisor).
2. If approved, claim R1 files (`packages/shared/src/pacing/route-graph.ts` + test, `analyze.ts`, one `index.ts` line) and build R1.
3. R2 per-arm metrics; R3 board, after workertwo releases `routes/pacing/*`.
4. If the owner wants the RFC in the repo, move it to `.claude/phases/`.

## Open questions

The five in RFC §9: fork threshold (25u); does difficulty bind the easiest route; fractured blocks as conditional arms; one graph or one per ship class; dead ends wanted or flagged.

## Lessons → memory

none
