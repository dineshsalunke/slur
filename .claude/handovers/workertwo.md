Agent: workertwo · Lane: perf-skill key fix (done) + RFC-349 §8 Q10 measurement (done) · Updated: 2026-09-29 18:40

## Goal
Idle; waiting for the next lane from slur-supervisor.

## Done
- e5f71a16: perf-analysis perf.mjs/tune.mjs/SKILL.md drive with ArrowUp (throttle since #368). /test-level 1.5 s hold: KeyW dz 0 u, ArrowUp dz 29.7 u.
- Q10 answered (no source edits; scratchpad q10/bench.js bundled with esbuild, run in headless Chrome, median of 9, ns per world.query call):
  - (A,B): inline 257–334, hoisted createQuery 155–226 → saves ~105 ns/call, flat in N (hash + Map lookup only).
  - (A,Not(C)): inline 575–644, hoisted 147–207 → saves ~430 ns/call (Not() modifier alloc + hash).
  - Hoisted still grows ~0.27 ns/entity (0→256: 155→226): `runQuery` still does `query.entities.dense.slice()` + `createQueryResult` on both paths (koota dist chunk-ZWIGMIL4.js:2085, :2764-2798). createQuery removes the hash only, not the copy.
- a50cd135 + 393e7480 #391 S19 (closed). Earlier: 80b9e8ef + 9b5f38f2 #388, a3ee47ad S17, 8681e05 S8, f3382cb S3, cf8f95e S2.

## State
- Bench footgun: an esbuild IIFE bundle of koota needs `--banner:js='"use strict";'` — sloppy mode boxes `this` in koota's Number.prototype.add and addTrait throws "reading 'add'".
- Owner /test-level check of S19 not done [unmeasured].

## Uncommitted
none.

## Held files
none.

## Next
1. Wait for the supervisor's next lane.

## Open questions
- Owner (from #373): incoming-bolt button on /test-level? phone tick/seeker overlap fix?

## Lessons → memory
- none (strict-mode footgun is bench-only; recorded here).
