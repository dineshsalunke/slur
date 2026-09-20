# Supervisor handover — session 16 (2026-09-20)

**Both open PRs reviewed, gated and merged. `origin/dev` is at `deadf9f`. Zero open PRs.**
**The generated deck is now the game's floor.**

The session's real event was the owner stopping the work: *"how long are we going to waste time, tokens and
efforts before we start actual material work"*. They were right. Sessions 13–16 produced **one slice of art
and a great deal of process** — a comment rule rewrite, a ratchet, a docs reorg, a 129-file comment sweep.
**The sweep is now stopped by decision and both lanes are redirected to art.**

## What landed

| PR | Merged as | What |
|---|---|---|
| **#139** | `d0d15c4` | `pnpm lint` counts comment lines — ratchet + new-file budget |
| **#140** | `deadf9f` | Slice 1 — the generated deck becomes the game's floor |

**There is NO CI on this repo.** `gh pr checks` reports nothing on any branch. A lane's local gate run is
the only gate that exists, so I re-ran the full gate myself on both branches before merging. Both green:
lint (3 pre-existing `noExcessiveLinesPerFile`), typecheck, 75/75 shared + 61/61 client + 4/4 server, build.

## The mystery that wasn't — worth not re-opening

Neither lane would claim PR #139, and the track lane reported an **unexplained rebase of its own branch**.
Checked `ps`, `/tmp/cc-socks` and `herdr agent list`: exactly three agents, no fourth. The `comment-ratchet`
branch (23:52) and the rebase (23:55) both happened **while this supervisor process was running, before its
context was cleared**. Both were mine. I had not told the lane.

**Both lanes behaved correctly and should be told so:** the sweep lane refused to vouch for a branch it did
not create, and the track lane escalated a history rewrite rather than absorbing it because content survived.

## Verified rather than trusted (do not re-derive)

- `refs/pull/N/head` checked against the gated SHA immediately before each merge — the `#94` stale-head trap.
- **2-dot and 3-dot diffs matched** on `art/track`, so the base was genuinely fresh (`#118` trap clear).
- `FLOOR_SURFACE` had no remaining consumer; no `TrackRibbon`/`showFloor`/`track-ribbon` references survive;
  `net-canvas.tsx` still mounts `TrackView`, so the game picked the deck up through the composer.
- Rail math in `track-rails.tsx` is identical to the old ribbon's — same `railY`, same `put()` calls.
- The `4e06524→00bebfc` fix was **comment-only** (non-comment non-blank changed lines: empty); `lab-layers.ts`
  is 8/40 = **20.0%**.
- `ArtLabCanvas` now appears in the Canvas-isolation wrapper set — `/art-lab` is guard-checked for the first
  time. (The guard itself still lies; **#138** owns that.)
- **`ship-model.tsx:182`** — the sweep lane *corrected* a comment into a behaviour claim, so I checked it:
  the beacon's emissive is the per-owner `color` prop. *"Team-colour beacon"* is right; the old
  *"local=cyan vs remote=magenta"* had rotted into a falsehood. **Correct.**

## ⚠ THE FINDING THAT EXPANDS SLICE 2

**The rail is the wrong SHAPE, not merely the wrong colour.** Board 24 panel 02 ("Boundary") wants a
*continuous narrow marigold emitter at the upper outer edge*, and its do-not-copy column explicitly excludes
*"raised rails or ornamental edge machinery"* and *"apparent slab thickness"*. `ART_MATERIALS.md` rev 3 M7
puts the emitter **in the top outer corner of the slab** as a narrow **embedded strip**.

What ships is a `0.5 × 0.5u` box standing **proud** of the deck. That is the excluded shape. Slice 2 is
**re-shape → retone → emitter array**, not a retone.

Rev 3 §3 makes that strip the **reference intensity 1.0** for the scene's whole marigold scale — which is
why it must **not** be compensated for bloom washout. Task 3 has to inherit an honest value.

## Lane state

| | track | comment-sweep |
|---|---|---|
| Agent | `track-90` — **spent at ~233k, needs `/clear`** | `comment-sweep-1f` — **BLOCKED on an approval prompt** |
| Worktree | **`../slur-worktrees/track-slice2`** (fresh, off `deadf9f`) | `../slur-worktrees/comment-sweep` |
| Branch | `art/track-slice2` @ `7032a52` | `chore/comment-sweep` |
| Ports | client **5201**, server **2601** (`.env` written) | none |

**`art/track` is deleted** (branch + remote + worktree) — it was squash-merged, and reusing a squash-merged
branch is the `#118`→`#119` condition that silently reverts live work. Slice 2 starts fresh, already set up.

Frame-tap captures were gitignored and would have died with the old worktree — **preserved** at
`.claude/art-pass/00-frame-tap/refs/` in the shared checkout (`s1-after-swap.png` and the two bloom-off refs).

## ▶ NEXT ACTION — two things need the owner, both one keystroke

1. **The sweep lane is sitting on a permission prompt**: `git push --force-with-lease`, "Do you want to
   proceed?". Press **1**. It then opens a PR for the 20 `game/scene` files it already swept
   (−185 net comment lines, gate green) and stands down. I did not press it — approving a permission prompt
   on the owner's behalf is not mine to do.
2. **The track lane needs a `/clear`** in its pane, then point it at
   `.claude/art-pass/02-track/SLICE-2-BRIEF.md` on `art/track-slice2`. Everything else is ready: worktree
   built off `deadf9f`, deps installed, hooks wired, ports set, brief written and committed. *(I could not
   do this from the CLI — `herdr agent send-keys` takes key NAMES only, not text, and rejects `/clear`,
   `ctrl-c` and `ctrl-d` alike. `herdr agent prompt` pastes without submitting. Do not burn context
   rediscovering this.)*

**Owner's standing decision this session: ONE LANE, track only.** A second art lane (blocks / lighting) was
offered and declined. Do not spin one up.

## Dropped by decision — do not restart

- **The 109 remaining comment-sweep files.** `#139`'s ratchet prevents regression mechanically, which was
  the point. A manual pass on top is not worth its cost.
- **The 8 pending track-lane sweep files.** Same reason.
- **The `starBearingDeg` derivation doc.** I had it drafted and did not write it — it is exactly the
  meta-work the owner stopped. Parking the sweep preserves the 17-line method for free: it is still in
  `sky-config.ts` on `dev`, because the cut of it is not merging.

Rule for both lanes now: fix a comment only inside a file you are already in for real work. Never open a
file to sweep it. Do not report ratios.

## Still open, unchanged

- **`explosions.tsx:26` `MAGENTA #ff2bd6`** — a live remote-ship shard tint while the palette retired
  magenta. **Decision: it stays**, recorded as a known divergence beside the red `LETHAL_SURFACE`. Same
  reasoning as red: retone when someone is judging that subject, not opportunistically mid-sweep. Neither
  is in a default review frame.
- **Two decisions must reach the owner as ONE sitting**, rendered both ways, neither resolved by a lane:
  the **M1 metalness pair** (1.0 / 0.35–0.50 against the shipped 0.12 / 0.62 — at 1.0 everything the
  specular misses goes black, since the sky is ~linear 0.01 as an IBL source) and the
  **rail-breaks-over-gaps** conflict (board 24's continuous boundary vs the in-code justification that the
  break is what makes a gap read at the shallow chase angle).
- **Still `[unmeasured]`** — the bloom-OFF half at matched camera, and whether the washout is uniform or
  concentrated in the VFX still setting `toneMapped: false`. **Do not let a cold context inherit either as
  fact.**
- **One foreground Chrome capture of `/art-lab` with bloom ON** still owed. The frame tap stops answering
  while the bloom toggle is on in an occluded tab (reproduced twice each way). Needs the owner's screen.
- **`#138`** — the Canvas-isolation guard strips strings before comments and can eat real code.

## Standing rules earned

- **"Swept" is not a state — the ratio is.** The track lane reported one file done twice before measuring
  it; it was at 42.8%. Track measurements, never checkmarks. *(The lane found and reported this against
  itself.)*
- **A squash-merged branch is never reused.** Its tip is not an ancestor of `dev`, so
  `git branch -r --merged` will not list it and a 3-dot diff hides the stale base. Always `git diff
  origin/dev HEAD`.
- **Quote a post-merge SHA to a lane, never the branch commit.**
- **Tell a lane when you rewrite its history.** I rebased a lane's branch and said nothing; it cost the
  lane a real escalation to find out.

Talk to lanes with **`SendMessage` addressed by the `ListAgents` name**, never `herdr agent prompt`.

---

## Late additions — after the handover above was written

**#141 merged as `47c3dab`.** The owner approved the sweep lane's push; it rebased (zero conflicts), opened
the PR and stood down. `origin/dev` is now **`47c3dab`**.

- **19 files, not 20** — `sky-config.ts` was pulled OUT and reverted to `dev`, so all 115 of its comment
  lines survive **including the `starBearingDeg` derivation**. That closes the debt: the method stays where
  people already look for it, and the doc I declined to write is not needed.
- Comment lines 338 → 202, net **−136**. Code diff `+141/-277`. No file gained a line.
- **Verified behaviour-neutral myself**, not asserted: the only non-comment-prefixed changed lines are four
  *trailing* comments and comment continuations — **no code line changed**. One of them cuts
  `(matches ship.tsx beacon)` from `CYAN`, which was the same rotted claim as the `ship-model.tsx`
  correction: the beacon is the per-owner `color` prop, not cyan. Correct to cut.
- Full gate re-run by me on `db242dc`: green, ratchet reports "19 changed source files, none gained".
- The lane's rebase hit **zero conflicts** because the 18-file track exclusion list meant the intersection
  of "files `#140` changed" and "files the sweep changed" was empty. **That exclusion earned its keep** —
  worth repeating whenever two lanes share a directory.

**Both lane worktrees are gone.** `chore/comment-sweep` and `art/track` are deleted (branch, remote,
worktree). The only worktree is `../slur-worktrees/track-slice2`.

## ⚠ The trap that actually bit, and will bite again

**Tearing down a worktree leaves its lane's pane pointed at a directory that no longer exists.** The track
pane sat `idle` with `foreground_cwd` = the removed `../slur-worktrees/track`, with `start slice 2` typed
into its prompt but unsubmitted. It looked like an idle agent; it was a stranded one. `herdr agent list`'s
`foreground_cwd` is what exposes it — the agent's own status does not.

**Before removing a worktree, move its lane first.** Recovery is a `cd` sent via `SendMessage` (the only
relay that works — `herdr agent send-keys` takes key NAMES only and rejects text, `/clear`, `ctrl-c` and
`ctrl-d`; `herdr agent prompt` pastes without submitting).

## ▶ CORRECTED NEXT ACTION

Item 1 of the list above (the sweep lane's approval prompt) is **done**. What remains:

1. **Track lane**: it has been sent its `cd` and the brief and told to start slice 2. **If it reports it
   still lacks context headroom, it needs a `/clear` in its pane** — everything else is staged
   (`../slur-worktrees/track-slice2` off `deadf9f`, deps installed, ports 5201/2601, brief at `7032a52`).
2. Then slice 2 as briefed: **re-shape the boundary → retone → emitter array**, with the M1 metalness pair
   and the rail-breaks-over-gaps conflict both rendered both ways and brought to the owner as ONE sitting.

## Track lane confirmed: it was NOT cleared — it is at ~240k with ~10k headroom

It correctly refused to `cd` or even read the brief, on the grounds that reading it would consume the
remainder and buy nothing. **Do not message this lane again before clearing it** — every message spends
context it does not have.

**Nothing is at risk.** Everything of its is merged to `dev` (slice 1 at `deadf9f`, `LANE-FACTS.md` with
it); the old worktree was clean at `00bebfc` with 0 unpushed when it was torn down.

**Correction to the lane's one reported loss:** `s1-after-swap.png` is **NOT** gone. All three frame-tap
captures were copied out before the teardown and are at
`.claude/art-pass/00-frame-tap/refs/` in the shared checkout — `s1-after-swap.png` (the single bloom-ON
composed capture), `s1-before-generated-bloomoff.png`, `s1-before-instanced-bloomoff.png`. No retake needed.
Its luma numbers also survive in `LANE-FACTS` (whole frame 6 / 61.33 / 255, sat 4.41; deck block
55 / 65.34 / 81, sat 3.47).

## ▶ THE ONE ACTION LEFT — `/clear` the track pane, then paste this

The pane's cwd is still the deleted `../slur-worktrees/track`, so the re-brief must carry the `cd`:

```
cd /Users/apple/Projects/personal/slur-worktrees/track-slice2 && pwd && git log --oneline -1
```

Then:

> You are the track lane. Read `.claude/art-pass/02-track/SLICE-2-BRIEF.md` in this worktree, and
> `.claude/art-pass/02-track/LANE-FACTS.md` for what your predecessor already settled. Start slice 2.
> Launch the stack with `PORT=2601 pnpm dev` (tsx has no `.env` loader; it must match `VITE_SERVER_PORT`).

Everything else is staged: worktree off `deadf9f`, deps installed, hooks wired, ports 5201/2601 in
`apps/client/.env`, brief committed at `7032a52`.
