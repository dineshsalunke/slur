# Supervisor handover — session 28 (2026-09-20)

Short session, three things in it: **the PR queue got unblocked and cleaned**, **the stack got rebased
onto `dev`** (the owner's call, and he was right), and **the first bespoke ship assets arrived from
Codex** and were measured. No lane was dispatched. The cold-key lane delivered and is at a seam.

## `dev` is `244dfd4`

#157 (track lead-in) and #156 (material departures) are both in. `docs/ART_MATERIALS.md` now carries the
two lighting departures and the 92/8/0 attribution.

**#156 nearly reverted #157 and the 2-dot check caught it.** Its 3-dot diff was an innocent 91-line
docs-only addition; the 2-dot diff showed it carrying a deletion of `LEAD_SEGMENTS`, the loop starts in
`track-floor.tsx`/`track-boundary.tsx` and 40 lines of tests. Rebased onto `dev` so the two diffs agreed,
re-gated, verified `refs/pull/156/head`, merged. **That is now four branches in two weeks where the
3-dot diff was innocent and the 2-dot was not. Run it before every merge.**

## THE REBASE — the owner overruled me, correctly

I offered him a false choice: fly `:5200` without the lead-in, or rebase `art/cold-key` onto `dev` and
lose the stacking discipline. He said the rebase "could have been a good option" and he was right,
because **the version that costs nothing is rebasing the whole stack, not just its top**, and I had not
offered it.

Done, both gated, both pushed:

| PR | branch | now | base |
|---|---|---|---|
| **#155** | `art/emitter-array` @ `146f53f` | rebased onto `dev` | `dev` |
| **#158** | `art/cold-key` @ `27b3aa3` | rebased onto the new #155 | `art/emitter-array` |

Each: typecheck · lint · **78** shared + 74 client + 4 server · build. #155's 2-dot and 3-dot diffs are
now identical. #158's 2-dot came out byte-identical to pre-rebase (6 files, +88/-10).

**Two mechanics worth keeping:**

1. **`git rebase origin/art/emitter-array` on the stacked branch is WRONG after the base is
   force-pushed.** Fork-point detection cannot see through it, so git tried to replay emitter-array's own
   commits on top of themselves — surfacing as add/add conflicts on `track-rails.ts`. The correct form
   names the old base: **`git rebase --onto origin/art/emitter-array 11113e6`**.
2. The only real conflict was `track-floor.tsx`'s import block — resolved as a union, keeping `three` as
   a **value** import (the emitter array needs `new THREE.Color`; `dev` had it type-only).

`gh pr view` reported #158's head as the pre-rebase SHA right after the push; `refs/pull/158/head` was
correct. **The PR object lags. Gate on the ref, not on `gh pr view`.**

## Cold key — delivered, PR #158

Full detail in **`.claude/art-pass/03-lighting/LANE-FACTS-COLD-KEY.md`**. Headlines:

- **Bearing 0 · elevation 45 · `#c2ccd6` · intensity 1.** The owner flew it; bearing 0 confirmed,
  intensity 8 read as a wash and he landed on 1.
- **`AMBIENT_INTENSITY` 1 -> 0**, `EMITTER_SLOTS` 12 -> 24, `RAIL_EMITTER_RANGE` 400 -> 600.
- **The structural limit:** a directional light on a flat plane has constant `N.L`, so the key cannot
  vary across the deck's width AT ALL (flat to 2% across the middle 32u). Half the brief's gate is
  unmeetable by this light shape. That is why 8 read as a wash.
- **Still open and NOT the key's fault:** deck 1u from the rail reads 1.42e+1 against the marigold
  strip's own 8.53e-1 — **the deck beside the rail is ~17x brighter than the rail.** Belongs to #155.
- **Next thread:** raise deck albedo off `#14181e`, THEN take metalness to 1.0 (`#3a4149` is 1.7x better
  at the same key). `track-texture.ts`, out of scope so far.

## Ships — Codex delivered two, both measured, both exact

`docs/art-direction/vehicles/` (READ-ONLY, as ever). Measured from the GLB binaries this session:

| model | measured X x Y x Z | class | footprint | match |
|---|---|---|---|---|
| `split-crown.glb` | 2.5000 x 1.0025 x 6.0000 | Freighter | `halfW 1.25`/`halfL 3.0` | **exact** |
| `comet.glb` | 2.2000 x 0.3700 x 1.1800 | Comet | `halfW 1.1`/`halfL 0.59` | **exact** |

Identity node transforms, no embedded textures, six named material groups each, `Marigold_emission` and
`Engine_core` emissive. **Both are `scale: 1.0, lift: 0`** — every existing ship carries a derived fudge
(`imperial` is `scale 0.323, lift 0.423`). Codex built these to `ART_SCALE_REFERENCE`, which is the first
time the art side has handed over measured geometry.

**OWNER DECISION, this session: there is no team colour. Everything is marigold for now.** So the swap
deletes `tintHull` and the team beacon rather than filtering them by material name.

**Brief is written and ready to dispatch: `.claude/art-pass/08-ships/BRIEF-SPLIT-CROWN.md`.** It is
self-contained. It carries the two traps — **facing** (the GLB is -Z forward, every existing ship is +Z,
and the symmetric bbox means only an eye can settle it) and **the LFS guard**, which has only ever seen
`.gltf` strings and may not fire on a `.glb` ArrayBuffer pointer.

**One question left open in the brief, for the owner:** does the ship row stay `imperial`/"Imperial", or
get renamed to Split Crown? `shipId` is networked and shows in the lobby.

## Live state

| what | where |
|---|---|
| `:5200` / `:2600` | `slur-worktrees/emitter-array`, on `art/cold-key` @ `27b3aa3` — **lead-in + emitter array + cold key together** |
| `:5202` / `:2602` | `slur-worktrees/seam-check`, **detached at `origin/dev`** — plain dev, old lighting, for A/B and the seam |
| lanes | `emitter-array-4b` idle at ~213k, **asked to be cleared**. `track-lead-in-33` idle, its worktree already removed |

Worktrees are down to three: the shared checkout, `emitter-array`, `codex-reconcile`, plus the
throwaway `seam-check` and `rebase-emitter`. Six stale dev servers killed; `bloom-knobs` removed on the
owner's confirmation; a stray non-git `slur-worktrees/track/` directory (a lane's `.env` written to a
path whose worktree creation had silently failed) deleted.

## Immediately next

1. **Owner flies `:5200` and gates #155 + #158** — now one frame with everything. Carried since s26.
2. **The z=0 rail seam is STILL unlooked-at** — is the apron's rail continuous with the first real
   segment's, and does the apron light at the same intensity? `:5202` or `:5200`, either shows it now.
3. **Clear `emitter-array-4b`** (`herdr agent send-keys emitter / c l e a r enter`) — its facts are in
   `LANE-FACTS-COLD-KEY.md`, so nothing is lost.
4. **Dispatch the Split Crown brief to a lane**, once the naming question is answered.
5. `rebase-emitter` and `seam-check` worktrees are disposable — remove when the flying is done.

## Carried, untouched

The two divergent `docs/art-direction/` snapshots, neither on `dev` (shared checkout's dirty 17 files vs
`docs/codex-reconcile` @ `84291fb`) — **still the owner's call, and a `git pull` in the shared checkout
will collide.** · Fly 7.5u through 8u pillar fields (ADR-011, #142) · `MARIGOLD_REFERENCE_INTENSITY` 2.0
`[unmeasured]` · rail breaks over full gaps · the rail's channelled cross-section stays PARKED · the
coplanar finding still unsent to Codex.

**Shared checkout is still `1807bc0` and dirty across 17 files. Read from a worktree or
`git show origin/dev:<path>`.**

## Commit trailers

The repo hook rejects the co-author trailer outright, including the form the session system-reminder
asks for, and it fires on the literal string anywhere in a heredoc. Write around it.

---

## Late additions — end of session 28

### BOTH PRs MERGED. `dev` is `cf1c98c`. The queue is EMPTY.

On the owner's instruction ("if there is no more work for any lane then lets merge their work back and
clean up the worktrees"), #155 then #158 were merged. `dev` now carries lead-in + emitter array + cold
key together, and **no pull requests are open**.

**The squash merge broke the stack, exactly once, and this is the shape of it.** After #155 squash-merged,
`dev` held its ten commits as ONE squashed commit while `art/cold-key`'s parents were the ten originals —
no shared lineage, so `gh pr merge 158` refused with merge conflicts. Fix was the same `--onto` form:
`git rebase --onto origin/dev 146f53f`, re-gate, force-push, merge. **Expect this on every stacked PR
whose base squash-merges. Rebase the child immediately after the parent lands, before trying to merge it.**

**Mistake worth recording:** I ran `git ls-remote refs/pull/158/head` and `gh pr merge 158` in the SAME
command chain. The ref returned the pre-force-push SHA, and I merged anyway — the exact stale-head trap.
It happened to be fine (`git diff origin/dev origin/art/cold-key` came back empty afterwards, proving the
real tip merged), but the check is worthless when it cannot gate the action. **Separate the verify call
from the merge call.**

### Cleanup done

- `art/emitter-array` and `art/cold-key` deleted, local and remote; both worktrees removed.
- `rebase-emitter` (throwaway) removed.
- **Worktrees are now three:** the shared checkout, `codex-reconcile` (the owner's undecided art-direction
  snapshot), and `seam-check`.
- **One stack runs: `:5202` / `:2602`**, `slur-worktrees/seam-check`, **detached at `dev` `cf1c98c`** —
  everything merged, in one frame. `shared/dist` rebuilt after the checkout moved; **hard-reload the tab.**
- `:5200` / `:2600` killed with the worktree that served them.
- Lane `emitter-array-4b` cleared (`herdr agent send-keys emitter / c l e a r enter`). Its facts survive
  in `03-lighting/LANE-FACTS-COLD-KEY.md`. It has a fresh context and NO worktree — brief it with one.

### Still owed an eye, now on `dev` and unblocked

1. **The z=0 rail seam** — apron rail continuous with the first real segment's? Apron lit at the same
   intensity? Never looked at. `:5202` shows it.
2. **The ~17x rail spill SHIPPED.** Deck 1u from the strip reads 1.42e+1 against the marigold strip's own
   8.53e-1 — the deck beside the rail is brighter than the rail. It is on `dev` now, unfixed, and it may
   be the first thing the eye lands on. **No issue filed yet.**
3. The cold key at intensity 1 is `[unmeasured]` beyond "8 was too much".

### Next work, ready to dispatch

**`.claude/art-pass/08-ships/BRIEF-SPLIT-CROWN.md`** — self-contained, needs a worktree and a lane.
**Blocked on one owner answer:** does the ship row stay `imperial`/"Imperial" or get renamed to Split
Crown? `shipId` is networked and shows in the lobby.

---

## Resolved in session 29 — the naming question, and the dispatch

**The owner renamed the ship: `imperial`/"Imperial" -> `split-crown`/"Split Crown".** The row was named
after a Quaternius placeholder; keeping it while the model renders as a Split Crown is a lie the lobby
tells. Folded into the brief as a decided section, with the full rename surface (the `ShipId` union,
`SHIPS`, `SHIP_ORDER`, `SHIP_VISUALS`, three occurrences in `ship-classes.test.ts`, and the historical
`halfW: 1.25` comment).

**No migration, and the brief forbids writing one.** `shipId` is networked but rooms are ephemeral and
nothing persists it — `localStorage` holds only the call-sign and the audio prefs (verified). Two guards
already cover a stale wire value: the server's `isShipId()` rejects an unknown id on `setClass`, and
`shipOf()` falls back to `DEFAULT_SHIP`. Worst case across the deploy is a mid-race client flying a
Fighter.

**Issue #159 filed**, and **lane `split-crown` dispatched** — worktree
`../slur-worktrees/split-crown`, branch `art/split-crown` off `origin/dev` @ `cf1c98c`, ports
**5200/2600**, agent `split-crown-da`.

**Two dispatch-time findings the brief did not have:**

1. **`docs/art-direction/vehicles/` is not on `dev`** — Codex's delivery is untracked in the shared
   checkout, tangled with the undecided `docs/codex-reconcile` snapshot. So the brief's
   `cp docs/art-direction/vehicles/... ` line **cannot run in a worktree**. The supervisor placed
   `split-crown.glb` (257,784 bytes, matching Codex's stated size) directly at
   `apps/client/public/models/ships/` instead, rather than recreating the read-only folder. **Whether
   that folder gets committed at all is still the owner's call.**
2. **Facing is settleable by geometry after all.** The brief said only an eye could, because the bbox is
   Z-symmetric — true of the bbox, not of the model. Codex's README says "four stern emitters in a 2x2
   arrangement", so the `Engine_core` meshes' mean Z names the stern. The lane measures it, then still
   eye-checks.

**Gotcha worth keeping: `herdr agent read`'s statusline is STALE for roughly the first minute of a
lane's life.** The `split-crown` pane read `⎇dev*` immediately after `agent start` while its worktree
was already correctly on `art/split-crown`; it caught up to `⎇art/split-crown` once the agent took its
first turn. The lane skill's advice to use that statusline to catch a lane on the wrong branch is sound,
but **only after the lane is working** — at dispatch time it will lie to you. Confirm with
`git -C <worktree> branch --show-current`, which is authoritative at any moment.

**Stale herdr workspaces:** `emitter-array` (w2H) and `track-lead-in` (w2J) still exist with idle agents,
pointing at worktree paths git no longer knows about. Disposable — tear down when convenient.
