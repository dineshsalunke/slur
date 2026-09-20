# Supervisor handover — session 23 (2026-09-20)

## The one thing waiting on a human

**The owner asked to be pinged when the boundary A/B is up on a port.** The lane has been told to
message this session the moment `http://localhost:<port>/art-lab` returns 200 with all three variants
switchable — *before* it finishes the gate, because he'd rather look early than wait for a green build.
**When that ping arrives, relay it to him immediately**: the port, and how to switch A/B/C on the panel.

Two gates of his are also still unpaid, both on **`:5205`** (`../slur-worktrees/bloom-knobs`, branch
`art/boundary-bevel`) — the only dev server still running:

- **PR #149** — the corner bevel. `a2bbb6b`. Changes visuals; must not merge before his eye.
- **PR #150** — the bloom knobs. `9ec40f8`. Gate green, prod path untouched.

Order matters: #149 first, then #150, so he judges one variable at a time.

## `dev` is at `bb59350`. Nothing merged this session.

## What this session actually established

### The rail eats the deck by construction — the owner was right twice

`emitBoundary` (`apps/client/app/game/scene/track-boundary.tsx:28,32`) sets the bevel's top edge to
`const i = x0 + w` / `x1 - w` — **inward** from ±`HALF_WIDTH`. At any `w`, `w` units per side of floor
are repainted as edge trim. Committed `BOUNDARY_W = 1.0`; he last dialled 3.

`BOUNDARY_W`/`BOUNDARY_H` are client-only and the sim floor spans ±`HALF_WIDTH` regardless, so nothing
is taken from the player — **the deck is lying about where it ends.** Dialling `w` down shrinks the lie
without fixing it. I had spent two sessions treating this as a number to tune; it is not.

### The outboard visibility bound, corrected twice

For a camera at (cx, H, 0) and a point (32+w, −h, D): the sight line crosses x = 32 at
t = (32−cx)/(32+w−cx), and requiring y > 0 there gives **h·(32 − cx) < H·w**. `D` cancels.

- **Distance-independent.** A previous session recorded this as a "near-field cross-section, down-track
  not characterised". That was wrong — there is one bound at every distance.
- **On-axis** (cx = 0): h < 0.234·w at the dialled H = 7.5, so w = 4 buys h ≈ 0.94.
- **Far rail** (cx = −32): h < 0.117·w — **exactly half**. At w = 4, h < 0.47.

**The far-rail case is the honest one**: at speed the near rail is half out of frame and the far rail is
what you read lateral position from. The lane derived the off-axis case; I re-derived it before
accepting it. It makes the flush outboard flare markedly more likely to fail than the on-axis figure
suggested, and that is why the task became a three-way rather than one shape.

### The bloom knobs — cause was structural, and it was store → pixels

A slider change makes `wrapEffect` recompute `args` via `useMemo(…, [JSON.stringify(props)])`, R3F 9.7
sees `args` fail `===` and constructs a **brand-new `BloomEffect`**, and `EffectComposer`'s layout
effect — deps `[composer, children, camera, normalPass, downSamplingPass]`, where `children` is React
*element identity* — never rebuilds its `EffectPass`. The live pass keeps rendering the old, disposed
instance. **The reconstruction is the bug, not the cure.** Verified in the installed dist, not recalled.

The `key={radius:levels}` remount in `tuned-bloom.tsx` was inert for the same reason and is deleted in
#150. Fix shape: `dev-bloom.tsx` holds a ref and writes all five values in a **priority-0** `useFrame`.
Priority 0 is load-bearing — fiber drops its own `gl.render` once any subscriber has priority > 0, so a
positive priority would steal ownership and kill bloom for everyone. Memory:
`effectpass-orphaned-by-prop-change`.

### The trailer ban is enforced, but not where anyone looks

`CONTRIBUTING.md:134` says *"The repository's commit hook rejects it"*. `.githooks/` holds only
`pre-commit` (the shared-checkout guard) and `install-hooks.sh` — **no `commit-msg` hook**. The actual
enforcement is a Claude Code **`PreToolUse` hook on the personal profile**,
`~/.claude/hooks/no-coauthored-by.sh`, wired in `~/.claude-personal/settings.json`.

Consequences: it protects **only that config dir** — a human at a plain terminal, or mahendra's fork,
hits nothing. It **over-blocks**, regexing the trailer name against the whole Bash command, so prose
*describing* the rule is denied (that is how it was found — write such prose with the Write tool). And
a lane that greps `.githooks/` will report the ban unenforced; it is not. Memory updated.

## Open with the owner, none of it started

- **The `CONTRIBUTING.md` wording** — either soften it to "convention", or add a real `commit-msg` hook
  so the claim becomes true.
- **Two divergent `docs/art-direction/` snapshots, neither on `dev`.** The shared checkout's working
  tree carries uncommitted changes across 17 tracked files; `docs/codex-reconcile` @ `84291fb`
  (worktree `../slur-worktrees/codex-reconcile`, unpushed since session 17) holds **89 files / ~1723
  lines more**, including a reorganisation of `docs/art-direction/track/` into `history/`. They are not
  the same snapshot. `docs/art-direction/` is read-only for Claude — **his call, and a `git pull` in the
  shared checkout will collide with it.**
- **The design conflict, deliberately unresolved.** His position: the trim must never affect the
  playable read. The package's: not a rail, must not stand proud of the floor. A **raised** outboard
  band satisfies him and violates the package — kept off the build list on purpose. If neither B nor C
  reads, this escalates to him and Codex. **Do not resolve it unilaterally in either direction.**

## ⚠️ The shared checkout is 18 commits behind and dirty

HEAD `1807bc0` vs `origin/dev` `bb59350`, with uncommitted changes across 17 tracked files. **Anything
read there may be stale** — it already produced a wrong citation this session (`CONTRIBUTING.md:117`,
actually `:134` on `origin/dev`). Read from a worktree, or from `git show origin/dev:<path>`.

## Worktrees and ports

Only **`:5205`** is listening (client 53056 / server 2605) — `../slur-worktrees/bloom-knobs` on
`art/boundary-bevel`. Badly named for what it holds; worth renaming once #149 lands.

`:5202` and `:5204` were torn down this session with their worktrees (`deck-emissive-knobs`,
`boundary-width-gate`) — both were clean and pushed, branches left intact and recoverable.

Remaining: `bloom-input` (`art/bloom-input`, #150), `bloom-knobs` (#149), `codex-reconcile` (unowned),
`marigold-retone`, and `track-slice2` — **`track-slice2` must stay, it is the lane's herdr shell cwd.**
Never reuse or rebase off `art/track-slice2`, `art/marigold-retone`, `art/deck-emissive-knobs`,
`art/deck-4u-bond`, `art/deck-joint-width` — all squashed away.

## Lane

`track-slice2-d8`, herdr name **`track`**. Cleared twice this session. Its live brief is
`.claude/art-pass/02-track/BRIEF-BOUNDARY-THREE-WAY.md` (three-way boundary A/B: A inboard control,
B outboard flare, C inboard with no hard inner edge — **C is the bet**). Earlier briefs in the same
folder: `BRIEF-BLOOM-INPUT-PATH.md`, `BRIEF-BOUNDARY-WIDTH-GATE.md`, `BRIEF-MARIGOLD-RETONE.md`,
`LANE-STATE.md`.

**Clearing a lane loses corrections written after its last read.** It walked into the exact trap the
trailer memory was written to prevent, because the memory landed after its context was cleared. Put
live corrections in the brief, not only in memory.

## Still owed, carried forward, untouched again

- **Fly 7.5u through 8u pillar fields with `fly` ON** — unpaid gate, ADR-011 and #142 both demand it.
- **`MARIGOLD_REFERENCE_INTENSITY = 4.0`** — judged against a working slider, frozen then reverted so
  the bevel gate isolates one variable. One line in `track-materials.ts`. **Hold until the boundary
  shape is settled.**
- **Slice 2's emitter array** — fixed-size K-nearest via `onBeforeCompile`, unstarted. Fixed size is
  load-bearing: a varying light count recompiles the shader mid-race.
- **Occlusion at 7.5u** — wants a brainstorm, not an issue.
- **Owner-parked pair, once both are rendered:** the M1 metalness pair, and rail breaks over full gaps.
- **Slice 3** — floor finish, specced and unbriefed.

## Method notes worth keeping

**Check a lead before relaying it into a brief.** Three times now a stated fact has reversed on
measurement. This session: my `env.bloom` dismissal was wrong reasoning that happened to reach a right
conclusion; my on-axis bound was materially incomplete; the lane's "enforcement no longer exists" was
"absent where I looked" mistaken for "absent".

**Never cite code or its comments as art direction.** Standing rule from session 22, not broken this
session. Read code to learn what it currently does, never what it should be.
