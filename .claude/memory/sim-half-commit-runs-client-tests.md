---
name: sim-half-commit-runs-client-tests
description: A shared-only commit can break client tests; run client vitest before pushing any sim half
metadata:
  node_type: memory
  type: feedback
  originSessionId: 62b26883-c972-4a20-b65b-d6169bfe7cc3
  modified: 2026-10-17T08:59:11.075Z
---

Before pushing a commit that touches only `packages/shared`, run the client tests too
(`pnpm --filter @slur/client exec vitest run`, or `pnpm test` from the root).

**Why:** F4e sim half (24e4df3e, 2026-10-17) passed shared and server tests and typecheck, but left
`pickup-layout.utils.test` red. Shield joined `FEATURE_POWERS`, so the client test counted shield pickups
twice. Dev stayed red until the client half landed. The supervisor asked for this gate.

**How to apply:** Any change to a shared export a client test reads (`FEATURE_POWERS`, the registry,
`HeldPower`, schema fields) needs the client run, even if the client compiles unchanged. Related:
[[shared-watcher-can-leave-dist-stale]].
