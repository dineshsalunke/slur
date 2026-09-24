---
name: test-your-lane-against-head
description: "pnpm test in the shared tree runs other sessions' uncommitted edits; to judge your own change, test a scratch copy with their files at HEAD"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8f6395f8-20c1-444f-8027-de4859801247
  modified: 2026-09-24T11:31:51.516Z
---

`pnpm test` compiles whatever is in the working tree, and that includes other workers' uncommitted
files. On 2026-09-24 workerthree's in-progress #244 block merge (`sim/track.ts`, `sim/merge-blocks.ts`)
failed `sim/pocket.test.ts` ("the scan found only 348 pockets") during a pacing-only change. It also
moved every pacing measurement onto their track.

To isolate your change:
`cp -R packages/shared/{src,package.json,tsconfig*.json}` into `<scratchpad>/pk/shared`, symlink
`node_modules`, copy `tsconfig.base.json` to `<scratchpad>/` (the tsconfig extends `../../`), then
`git show HEAD:<their path> >` over their files and delete their new ones. Run
`npx tsc -p tsconfig.test.json && node --test "test-dist/**/*.test.js"` there. For a before/after,
make a second copy with your own files at HEAD.

A faster copy: `git archive HEAD packages/shared tsconfig.base.json package.json | tar -x -C <dir>`,
symlink the repo `node_modules` at `<dir>/node_modules`, `cp -R packages/shared/node_modules` in, then
copy your changed files over. **Never run `pnpm test` in the copy**: pnpm runs a deps check that
starts `pnpm install` through the symlinked `node_modules` (on 2026-09-24 it failed on the catalog
and left the repo untouched). Call `node_modules/.bin/tsc` and `node --test` directly.

**Why:** a failure or a number from the shared tree may belong to someone else's lane. You would
report it as yours, or "fix" their work.
**How to apply:** before you report numbers, run `git status --short packages/`. If a path you do
not hold is modified, measure in the scratch copy. Related: [[shared-checkout-shares-one-git-index]],
[[ab-an-old-sim-from-git-in-scratch]].
