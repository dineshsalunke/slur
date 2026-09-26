Agent: workerthree · Lane: #300 phrase generator — S1 built, S2 next · Updated: 2026-09-26

## Goal

Build the approved #300 RFC (`.claude/phases/2026-09-26-unified-generator-rfc.md`) slice by slice. S1 is done
except the draw-call/build-ms measurement.

## Done

- `8a4f1dd` S1: `'phrase'` gen (`packages/shared/src/sim/phrase/` plan · line · phrase-track · open-space · test),
  `TRACK_GEN_SEGMENTS` (phrase 600), dispatch, digest row, `/test-level` uses 600 for `?gen=phrase`.
  groove `segmentOf` exported; the avoid pilot moved to `sim/avoid-pilot.test.ts` with a commit bias.
- `bbb44b4` ADR-023 (Proposed) in `docs/DECISIONS.md`. Both pushed to origin/dev.
- Memory: `.claude/memory/avoid-pilot-dithers-at-a-centred-post.md`.

## State

- 493/493 shared tests pass; lint and typecheck clean (all workspaces). weave/groove digests unchanged.
- 5 classes × 30 seeds at 600 segments: 150/150 finish, 0 deaths. Mean s: Interceptor 143.6, Fighter 125.9,
  Comet 108.1, Phantom 134.3, Freighter 99.1 (same as an empty deck: S1 has no weave yet).
- The committed flight test flies seeds 1–5 + 17 (~14 s); the 30-seed sweep took 72 s (run by hand).
- Seeds 1–30 meet every groove open-space target; every arena fully open.
- Draw calls and build ms at 600 on /test-level: [unmeasured].
- S1 slots: `set` = arena 280u, `weave` = motif phrase. Section ≈ 1,952u; sections = round(usable / 1952).

## Uncommitted

None (after the handover commit).

## Held files

None. Re-claim before S2.

## Next

1. Measure draw calls + build ms: headless Chrome (DPR 1, mute, own CDP port, kill by PID) on
   `http://localhost:5173/test-level?gen=phrase` vs `?gen=groove`; recipe in memory
   `count-draw-calls-without-repo-edits`. Record in ADR-023 consequences (claim DECISIONS.md).
2. Ask the owner (via supervisor) to fly `/test-level?gen=phrase` and log real finish times (RFC §1.4).
3. S2 (RFC §3): per-run motif vocabulary 4–6 from `MOTIF_LIBRARY`, teach/repeat/twist, gate posts. Accept:
   adherence ≥ 75%, line pilot not slower than avoid pilot. Claim `sim/phrase/*` again first.
4. Then S3 (weave band + parallel weave + per-kind open-space exemptions), S4–S7.

## Open questions

None. #300 stays open until S7.

## Lessons → memory

`.claude/memory/avoid-pilot-dithers-at-a-centred-post.md`
