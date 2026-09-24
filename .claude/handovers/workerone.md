Agent: workerone · Lane: R4 S3 — emitter + `gen:'score'` switch (#250) · Updated: 2026-09-24 19:10

The approved RFC: `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d). Older versions of this file hold
history: 58bb78f (S3 emitter seam), 4e66705 (S2), 4eacff7 (S1), e868c04 (rev 2 numbers), 192787f (brief).

## Goal

- Hand the `gen:'score'` switch to slur-supervisor as a diff (track.ts is dirty with workerthree's #244),
  so the owner can playtest a score track in a hosted room.

## Done

- `798ac1d` RFC · `c24f2bb` S0 · `4eacff7` S1 · `4e66705` S2 · `58bb78f` S3 emitter.
- Owner rulings on S3 (via supervisor): playtest as is (914 blocks, 0.5u pin clearance OK). `JJ` is exempt
  from ADR-006 "no two gaps in a row" on `'score'` tracks only.
- This seam (SHA in the commit that carries this file):
  - Diff for the supervisor: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/91190798-1cd4-4a01-ab73-1f3a33e86834/scratchpad/gen-score-switch.diff`
    (272+ lines, 8 files). Built in the scratch copy `…/scratchpad/gen` (HEAD 58bb78f + the diff).
    - `space.ts`: `gen?: TrackGen` last on `ProcgenDescriptor`; `TRACK_GENS`, `TrackGen`, `isTrackGen`.
    - `track.ts`: `makeProcgenTrack` returns `scoreTrack( seed, length )` when `d.gen === 'score'`.
    - `schema.ts`: `@type( 'string' ) gen = 'weave'` LAST on `TrackDescriptorState`; apply/toDescriptor.
    - `track-provider.ts`: `procgenDescriptor( seed, gen = 'weave' )`.
    - `run-room.ts`: reads `SLUR_TRACK_GEN` (default weave). Playtest: `SLUR_TRACK_GEN=score pnpm dev`.
    - `track.test.ts`: `makeTrack` pins `'weave'`; the gap test is renamed "weave: …".
    - New `track-gen.test.ts`: gen round-trip, score descriptor = `scoreTrack`, and the JJ-only gap test
      (standard score tracks + a `JJ` test library).
    - `run-room.test.ts`: a client decodes a score descriptor and resolves the server track from it; a room
      without the env var hosts weave.
  - ADR-020 amendment (JJ exemption) appended to `.claude/phases/2026-09-24-adr-020-pending.md`.

## State

- Scratch copy: shared 309/309 pass, server 17/17 pass. biome: 0 errors; 2 warnings are the pre-existing
  line-count warnings on track.test.ts (432 lines at HEAD) and run-room.test.ts (437 at HEAD). No comments added.
- `git apply --check` passes on a fresh HEAD archive. On the dirty #244 `track.ts` the import hunk needs
  `git apply -C1` (#244 adds an import line in the context); checked on a copy, both hunks land.
- The standard motif library emits no `JJ` (0 of 200 seeds). The test library emits 100 `JJ` over 8 seeds.
- A score room has no pickups: `scoreTrack` gives `anchors: []` (S4 work).
- The client renders a score track through `resolveTrack( toDescriptor(...) )` [inferred; not flown]. Any
  client visual that reads `weaveLineLanes` directly would still follow the weave line [unmeasured].

## Uncommitted

None (the diff lives in the scratchpad by design).

## Held files

- `packages/shared/src/sim/score/*` · `packages/shared/src/pacing/*` + tests · the pacing and score export
  lines in `packages/shared/src/index.ts` · `apps/client/app/routes/pacing/*` · `sim/fracture-shadow.ts` + test.
- Pending the supervisor applying the diff: `sim/space.ts`, `schema.ts`, `sim/track-provider.ts`,
  new `sim/track-gen.test.ts`, `apps/server/src/rooms/run-room.ts` + test (track.ts/track.test.ts go with #244).

## Next

1. Wait for the supervisor to apply the diff. Then playtest support if asked (a hosted room with
   `SLUR_TRACK_GEN=score`).
2. S4: forks, pickups (`anchors: []` today), a smash solver (SOLID_SEALED hull for `S`).
3. S5: fly the emitted geometry with the contract ship at 55 and 124 u/s through `simulate()` with
   collisions (the 0.5u pin clearance, and `JJ` = 40u hole reach per class).

## Open questions

- Supervisor: the ADR-020 file's first Consequences bullet ("no two gaps … by construction") is now wrong.
  I appended an amendment that says it replaces that bullet. Delete the old bullet when you sequence it.
- Owner: the standard library has no `JJ`, so a playtest will show no double gaps. Add a `JJ` motif?

## Lessons → memory

- Updated `.claude/memory/test-your-lane-against-head.md` (server in the scratch copy, biome config,
  checking a diff against a dirty file).
