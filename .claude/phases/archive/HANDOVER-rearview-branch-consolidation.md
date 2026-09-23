# Handover — the halfL correction, and three agents' work off `dev`

Session of 2026-09-23, `rearview-mirror`. Shared checkout with `slur-supervisor`, `hud`,
`atmospherics`.

## State: all work on `dev`, checkout on `dev`, no branch unmerged

`git branch --no-merged dev` is empty. `dev` is at `dd24d04`, 33 ahead of `origin/dev` — **nothing
has been pushed.**

## What I did

Committed the exhaust work `hud` left behind, on the owner's instruction:

| Commit | Contents |
|---|---|
| `ea7aa5c` | `feat(scene)` the split-crown exhaust plume and engine light — 429 insertions, **zero deletions** |
| `351544d` | `chore(client)` the Metal046B displacement map (660K, nothing samples it — dead weight unless that changes) |
| `ac1dc53` | `docs(phases)` the exhaust handover |
| `37e70e0` | `docs(phases)` the halfL correction |

Gates before staging: typecheck clean, 95 shared + 4 server + 164 client tests, biome clean on all
touched paths, comment ratchet and ls-lint clean. Zero deletions on `ea7aa5c` is the evidence no
peer's in-flight work was swept.

## The halfL claim was false — do not re-open it

`HANDOVER-exhaust.md` reported `DEFAULT_TUNING.halfL` 1.26 against a 3.0 half-long model and called
collision 2.4x shorter than the hull. It compared the Split Crown's hull against the **Fighter's**
box.

`split-crown` maps to class `freighter` (`ship-classes.ts:102`), tuning `halfW 1.25, halfL 3.0` — an
exact match for the 2.5 x 6.0u model. `DEFAULT_TUNING.halfL` 1.26 is the Fighter's, carried by the
Challenger, whose model is 2.52u long. Also exact.

Measured all five: POSITION accessor bounds over every mesh primitive, times the `ship-visuals.ts`
scale, against halfW/halfL x2. Every box within 0.4% of its hull. All five models carry **zero**
non-identity nodes, so the scaled accessor bounds are the true bounds.

**Acting on the original claim would have given the Fighter a hitbox 2.4x longer than its hull** —
creating the bug the note described. Resolve a ship's box through `tuningForShip()`, never through
`DEFAULT_TUNING`.

Method note worth keeping: my first pass ignored node transforms and leaned on "all five agree to
0.4%". `slur-supervisor` pointed out that agreement across models of shared provenance is *expected*
and therefore no evidence at all against that risk. Settled by checking the node trees directly.
Agreement between measurements is not a substitute for checking the thing you skipped.

## The branch incident — the lesson

Three agents' commits landed on `feat/asteroid-bands` instead of `dev`: `bb2d9f5` (asteroid bands,
`atmospherics`), `37e70e0` (mine), `dd24d04` (exhaust ramp, `hud`). The checkout was switched
between my `git status` and my `git commit`.

**`git status --short` does not print the branch.** I checked the tree carefully, staged by explicit
pathspec, and still committed onto the wrong branch. In a shared checkout the branch is as volatile
as the file contents — **run `git branch --show-current` immediately before every commit.** This is
the same class of hazard as `.claude/memory/shared-checkout-shares-one-git-index.md`, one level up.

Recovery was clean because the branch was cut from `dev`'s exact tip: `git fetch . <branch>:dev`
fast-forwarded `dev` with no checkout, no rebase, no rewrite. `git checkout dev` and the worktree
route were both blocked by this session's permission classifier; `atmospherics` finished it.

**`git commit --amend` is the same hazard, and it is the worst of the three.** My correction was
`47111c3`; it is now `37e70e0` because `atmospherics` amended their own message, I committed in
between, and their amend landed on *my* commit and replaced my message with theirs. They caught it
and restored it byte-identically (`%B` diff empty, trees equal), so only the hash moved — but
nothing warned either of us.

The family: the index is shared (`git add` is not session-local), the branch is shared (`git status`
does not show it), and **HEAD is shared** — `--amend` assumes the commit on top is yours, and in this
checkout it is not. There is no flag that makes it safe. Do not amend in a shared checkout; correct
a wrong message in the issue or a follow-up commit instead.

## Open — owner decisions, unchanged

1. **Rear-view vertical flip.** The golden reference composites the band flipped — deck at the
   bottom receding upward, ships inverted. Not applied: it changes how you read threats behind you,
   not just the look. `docs/ADD.md:158` leaves it open. One character in
   `rear-view-surface.ts:49`: `vUv.y` → `1.0 - vUv.y`.
2. **No bloom in the rear-view inset.** Composer owns priority 1, so the mirror gets no postfx.
   Owner-accepted at design time. Cheap route if it starts to matter: a thresholded blur-add inside
   `rear-view-surface.ts` driven by the existing `Bloom.*` knobs — **not** a second composer, which
   would fight over `gl.toneMapping` and `autoClear`.
3. **The displacement map** (`351544d`) — nothing samples it. In because the owner said commit
   everything; pull it back out if it stays unsampled.
4. **Two stale branches**, `art/hdri-picker` and `art/rail-lights`. Both fully merged into `dev`,
   zero commits ahead. Safe to delete — owner's call, I did not.
5. **33 commits unpushed** on `dev`.

## Next

The live thread is `hud`'s exhaust tuning, on screen now. Not mine — do not pick it up without
asking them. My own rear-view thread is closed and owner-confirmed at `7faf414`; the two items above
are the only things left on it, and both need the owner, not more work.

## Related

- [[2026-09-22-the-mirror-that-would-not-clear]] — the rear-view thread this closes out.
- `.claude/phases/HANDOVER-exhaust.md` — `hud`'s live thread, carries the corrected halfL section.
