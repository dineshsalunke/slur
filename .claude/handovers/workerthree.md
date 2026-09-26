Agent: workerthree · Lane: #300 unified generator — RFC only (#292 folded in) · Updated: 2026-09-26

## Goal

Write the RFC for one track generator: weave feel + motifs + arenas + power-up set pieces, ~3 min run. Build
nothing until the owner approves.

## Done

- RFC written: `.claude/phases/2026-09-26-unified-generator-rfc.md` (SHA in the seam message).
- Memory: `.claude/memory/band-width-is-the-weave-speed-dial.md`.

## State

- Groove run time = empty-deck time for all 5 classes; clean pilot 97–99% of top (seeds 1–10, delay 200–500 ms).
- Weave band 16u: Freighter ~80, Phantom ~89; 14u: Fighter 86, Phantom ~76, Freighter ~73; 12u: long ships cannot pass.
- Race ends 20 s after the first finisher; clean class spread 29 s at 8,000u, 32–45 s at 12,000u.
- 600-segment groove: 24/25 finish; the miss is a pilot fault at a lone post [inferred].
- weave/score rows are pilot-limited (1/50 and partial finishes); not diagnosed.
- No human finish-time data exists; the mistake budget in RFC §1.4 is [guessed].

## Uncommitted

None.

## Held files

None after the seam commit.

## Next

The owner APPROVED the RFC with amendments (2026-09-26). The rulings are folded into the RFC header; the parallel weave is §2.3.
1. S1 (RFC §7): claim files with slur-supervisor BEFORE the first write. Expected set: new `packages/shared/src/sim/phrase/*`
   (+ tests), `sim/space.ts` (TRACK_GENS + 'phrase'), `sim/track.ts` (dispatch), `sim/track-provider.ts` (per-gen length 600),
   `sim/track-digest.test.ts` (phrase row; weave/groove rows unchanged), `sim/groove/open-space.ts` (per-phrase targets).
2. No hard-coded length anywhere: the sequencer derives the section count from `descriptor.length`.
3. Do NOT touch run-sim/director/race-end constants (#301, workertwo).
4. Draft ADR-023 alongside S1 (docs/DECISIONS.md: claim it first).

## Open questions

None open. #300 stays open until the build lands.

## Lessons → memory

`.claude/memory/band-width-is-the-weave-speed-dial.md`
