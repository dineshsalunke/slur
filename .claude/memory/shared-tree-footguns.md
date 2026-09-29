---
name: shared-tree-footguns
description: "Four ways a shared checkout burns a measurement or a commit: one .git/index and one HEAD are visible to every session, a pathspec commit skips new untracked files, pnpm test in the shared tree compiles peers' uncommitted edits, and a live dev-server check can read a peer's mid-save HMR state"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 153f7ede-baaa-4571-990b-1a0fa4c0473c
  modified: 2026-09-29T04:06:15.829Z
---

### Shared checkout shares one git index

Several Claude sessions working in `/Users/apple/Projects/personal/slur` share a single
`.git/index`. Staging is **not** session-local: files one session `git add`s show up as staged
in every other session's `git status`, and a bare `git commit` by any of them sweeps up the lot.

**Why:** on 2026-09-22 four sessions worked the same checkout on `feat/test-level`. One session
staged its files, and a peer preparing its own commit found them already staged and nearly
committed them under its own message.

**How to apply:** in a shared checkout, always `git commit -- <explicit pathspecs>`, never a bare
`git commit`. Announce before staging. Better, take a worktree — see
[[one-stack-dev-only]]; the one session that did had a clean branch and no collision.

**The branch moves under you the same way the index does.** A shared checkout follows one HEAD, so
a peer's `git checkout -b` silently redirects every other session's commits. On 2026-09-23 three
sessions' commits landed on `feat/asteroid-bands` instead of `dev` — the exhaust ramp fix, a phase
correction and the asteroid bands — and nobody noticed, because **`git status --short` does not
print the branch**. Recovery was a clean fast-forward only because the branch was cut from `dev`'s
exact tip. **Run `git branch --show-current` immediately before every commit.** Standing owner
policy: everyone commits to `dev`, no feature branches unless asked.

A second trap in the same shape: two sessions editing one file (`dev/tunables.ts`,
`track-materials.ts`) cannot be split by path at all, because the file's contents interleave —
`git commit -- <path>` takes WORKING-TREE content and silently steals the peer's hunks.

**Split it by hunk instead** (done 2026-09-22 on `dev/tuning-schema.ts`, which held this
session's `RearView.*` and the supervisor's `Block.*`): confirm `git diff --cached --stat` is
empty, hand-write a patch containing only your hunk into the scratchpad,
`git apply --cached --recount <patch>`, `git add` your whole-file changes, verify
`git diff --cached` shows none of theirs, then `git commit` with **NO pathspec** — a pathspec
would re-read the working tree and undo the whole point. Check their hunk survived afterwards.
`git add -p` is unavailable: interactive flags do not work in this harness.

**Simpler variant when your own hunks are few and trivial to retype** (done 2026-09-23 on
`dev/tuning-schema.ts`, three lines of mine against a peer's `Exhaust.*`/`EngineLight.*` block):
copy the mixed file to the scratchpad, `git checkout HEAD -- <file>`, re-apply only your edits with
the Edit tool, `git add <file>`, then copy the mixed file back. No patch arithmetic, and a pathspec
on the commit is then harmless. The peer's lines are missing from the WORKING TREE for the few
seconds in the middle — a peer reading the file right then sees a phantom clobber and a typecheck
failure, so say what you are doing if one is watching.

### Pathspec commit skips untracked

`git commit -- <dir>` (the explicit-pathspec rule in CLAUDE.local.md) takes only TRACKED files. A new
file under that dir stays `??` and is not in the commit. If a committed file imports it, the pushed
HEAD does not build.

**Why:** 2026-09-29, `6cb1f36` imported `block-reflections.utils.ts` but did not contain it. It was
pushed, then fixed in `7cb7e05`.

**How to apply:** before a pathspec commit, run `git status --short` and `git add -- <new files>` for
every `??` path you created. Check `git status --short` after the commit too.

### Test your lane against HEAD

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

Add `apps/server` to the same `git archive` for a server test: its `node_modules/@slur/shared` is a
relative link, so it resolves to the scratch shared. Build shared with `tsc -b` first. Biome in the
copy needs the repo `biome.json` and `.gitignore` at the copy root, or it exits with a config error.
To hand a diff over a file another worker holds dirty, `git apply --check` it on a fresh HEAD archive,
then on a copy of their file with `-C1`.

**Why:** a failure or a number from the shared tree may belong to someone else's lane. You would
report it as yours, or "fix" their work.
**How to apply:** before you report numbers, run `git status --short packages/`. If a path you do
not hold is modified, measure in the scratch copy. Related: [[sim-pilot-footguns]],
[[ab-an-old-sim-from-git-in-scratch]].

### Peer edit orphans a live check

A live /song-lab replay once read `tick 0 / 0` and DIVERGED. Another worker had saved
`song-lab/bundle.ts` one second before the screenshot. Vite HMR re-evaluated `replay-state.ts`
(it imports bundle.ts), so the page held a fresh, empty `replay` singleton. The replay logic was
fine: three reruns matched.

**Why:** the shared tree runs one dev server over files other workers are editing. A module
singleton does not survive a re-evaluation of its imports. Same family as [[tuning-over-cdp]].

**How to apply:** when a live reading looks impossible, run `stat -f '%Sm %N'` on the modules the
page imports and compare with the capture time before you debug. Rerun in a fresh tab. Headless
node checks (import the .ts directly under node 24) are immune, so use them for the verdict and
keep the browser for spot checks.

### Amend and push act on everyone's commits

In the shared tree, HEAD is often another worker's commit, so `git commit --amend` rewrites a peer's
commit. And `git push` carries every local commit on `dev`, not only yours: on 2026-09-29 workertwo's
push shipped workerthree's #389 and workerone's F1, and a worker whose own push was denied saw its work
go out anyway.

**Why:** one HEAD, one branch, several committers. A commit made seconds earlier may already be buried
under a peer's commit or already pushed.

**How to apply:** never amend; make a new commit by path. Before a push, run
`git log --oneline origin/dev..dev` and push only when every listed commit has green gates.
