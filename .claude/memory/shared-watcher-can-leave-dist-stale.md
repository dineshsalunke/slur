---
name: shared-watcher-can-leave-dist-stale
description: "another session's tsc -b --watch can stamp tsbuildinfo without re-emitting dist/index.js; a new shared export then \"does not exist\" — run tsc -b --force"
metadata:
  node_type: memory
  type: project
  originSessionId: ec5ceff0-0a9b-458d-bf1c-e011a134763a
  modified: 2026-09-26T14:41:23.502Z
---

On 2026-09-24 a new `export * from './sim/bounce-contact.js'` in `packages/shared/src/index.ts` did not
reach `dist/index.js`. `bounce-contact.js` was emitted, but `dist/index.js` kept its older timestamp.
`tsc -b --verbose` said *"up to date because newest input 'src/index.ts' is older than output
'dist/tsconfig.tsbuildinfo'"*. Another session's `pnpm dev` ran `tsc -b --watch` on the same package and
had stamped the buildinfo. The server typecheck then failed with TS2305 "has no exported member".

**Why:** every session shares one `packages/shared/dist`. A watcher from another checkout-mate owns the
buildinfo, and a plain `tsc -b` trusts it.

**It also bites a live check, not only the typecheck.** On 2026-09-26 (#288) `dist/run/run-sim.js` had
the new `countdownSeconds` field in the constructor but the old `startRace()` body, with the same mtime
as the source. The gates passed, but the browser ran a 3 s countdown that the source no longer has.

**How to apply:** before a live check of a shared change, `grep` a changed line in `dist/`. After you add a shared export, `grep` it in `dist/index.js`. If it is missing, run
`pnpm exec tsc -b --force` in `packages/shared`. Do not kill the other session's watcher. Related:
[[shared-checkout-shares-one-git-index]].
