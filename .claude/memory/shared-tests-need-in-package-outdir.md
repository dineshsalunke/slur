---
name: shared-tests-need-in-package-outdir
description: Compiling shared tests to a scratch outDir fails every file that imports schema.ts — node cannot resolve @colyseus/schema outside the package
metadata:
  node_type: memory
  type: feedback
  originSessionId: 574431c7-60a4-4e4a-b0eb-c811267817ca
  modified: 2026-09-26T15:09:59.189Z
---

Compiling `packages/shared` tests with `tsc -p tsconfig.test.json --outDir <scratchpad>` works only for files
that never reach `schema.ts`. Every other test fails with `ERR_MODULE_NOT_FOUND: @colyseus/schema`, because the
scratch dir has no `node_modules` above it. 36 of 60 files "failed" this way on 2026-09-26, which looked like an
import-cycle regression.

**Why:** Node resolves bare specifiers by walking up from the importing file, and the scratchpad is outside the repo.

**How to apply:** Run `pnpm test` in `packages/shared` (outDir `test-dist`, inside the package). A scratch outDir
is fine only for a pure module test. Read the first error before you suspect your change. See [[test-your-lane-against-head]].
