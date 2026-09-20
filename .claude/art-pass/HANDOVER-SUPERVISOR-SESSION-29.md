# Supervisor handover — session 29 (2026-09-20)

Short and clean. **The Split Crown lane was dispatched** after the owner answered the naming question,
and **two live-flight bloom bugs were filed** with the owner's own diagnostic observation on them. `dev`
is untouched at `cf1c98c`; the PR queue is still empty.

## The naming question is answered — the ship is renamed

**`imperial`/"Imperial" -> `split-crown`/"Split Crown".** Owner's call. The row was named after a
Quaternius placeholder and keeping it would have had the lobby calling a Split Crown an Imperial.

Folded into `.claude/art-pass/08-ships/BRIEF-SPLIT-CROWN.md` as a decided section carrying the whole
rename surface: the `ShipId` union, `SHIPS`, `SHIP_ORDER`, `SHIP_VISUALS`, three occurrences in
`ship-classes.test.ts`, and the historical `halfW: 1.25` comment in the `freighter` class.

**No migration, and the brief forbids writing one.** Verified this session: nothing persists `shipId`
(`localStorage` holds only the call-sign and the audio prefs), the server's `isShipId()` rejects an
unknown id on `setClass`, and `shipOf()` falls back to `DEFAULT_SHIP`. Worst case across the deploy is a
mid-race client flying a Fighter.

## Lane `split-crown` is running — issue #159

| | |
|---|---|
| agent | `split-crown-da`, Opus 5, auto mode |
| worktree | `../slur-worktrees/split-crown` |
| branch | `art/split-crown` off `origin/dev` @ `cf1c98c` (verified with `git rev-parse`) |
| ports | 5200 / 2600 |
| herdr | workspace `w2K`, pane `w2K:p1` |

**Two dispatch-time findings the brief did not have, both written into it as amendments:**

1. **`docs/art-direction/vehicles/` is not on `dev`.** Codex's delivery is untracked in the shared
   checkout, tangled with the undecided `docs/codex-reconcile` snapshot — so the brief's
   `cp docs/art-direction/vehicles/...` line **cannot run inside a worktree**. Rather than recreate the
   read-only folder, I placed `split-crown.glb` (257,784 bytes, matching Codex's stated size) directly at
   `apps/client/public/models/ships/`. **Whether that vehicles folder ever gets committed is still the
   owner's call, and that copy is currently the only path by which the source asset reaches the repo.**
2. **Facing is settleable by geometry after all.** The brief said only an eye could, because the bbox is
   Z-symmetric — true of the bbox, not of the model. Codex's README says "four stern emitters in a 2x2
   arrangement", so the `Engine_core` meshes' mean Z names the stern. The lane measures it, acts on the
   measurement, then still eye-checks.

Also verified so the lane need not: the other ship models are **smudged correctly** in that worktree
(`imperial.gltf` opens as JSON at 4.5 MB), so the `git lfs pull` trap is not live for it.

**Correction issued to the lane mid-flight:** I told it herdr's statusline reports the shared checkout's
branch, because the pane read `⎇dev*` right after `agent start`. That was wrong — **the statusline is
simply stale for about the first minute of a lane's life**; it caught up to `⎇art/split-crown` once the
agent took its first turn. The lane skill's advice to use it as a branch check is sound, but only after
the lane is working. `git -C <worktree> branch --show-current` is authoritative at any moment.

## Two bloom bugs filed from live flight — #160 and #161

Both reported by the owner flying `dev` at `cf1c98c`, both labelled `bug`+`art`, both in the
**Backlog** milestone. Both are visual only; gameplay is unaffected.

- **#160 — the rail bloom narrows and dims as the ship strafes toward a rail.** The expectation is the
  opposite.
- **#161 — the farther rails flicker while jumping.**

**The owner's own observation is the most valuable thing in either issue**, and it is recorded on both:

> "the flicker effect feels like something that would happen if i flicker the range value on the slider"

That **demotes the aliasing theory** I led #161 with. Aliasing shimmers at the pixel level; a range wobble
pulses lit distance and brightness together, and the owner is describing the second. It is also directly
A/B-able, because `tuning.emitterRange` is a live dev slider (`track-floor.tsx:238`) — waggle it on a
stationary ship and compare.

### The structural finding both bugs share

**`range` does double duty in `feedEmitters` (`track-floor.tsx:55-61`).** It is BOTH the Z clamp on how
much of a rail run becomes the emitter tube (`z0 = max( run.z0, z - range )`, `z1 = min( run.z1, z + range
)`, halfLength `( z1 - z0 ) / 2`) AND the light's falloff radius (`emTint.w`, consumed by
`getDistanceAttenuation`). One number therefore sets both *how far the light reaches* and *how much
geometry emits it*, so spread and brightness are structurally coupled and move **together, in the same
direction** — exactly the compound signature in both bugs. **That coupling deserves questioning on its own
merits:** they are different quantities with no obvious reason to share a slider.

### Facts established this session, so nobody redoes them

- **`z` in `feedEmitters` is the SHIP's sim z, not the camera's** (`track-floor.tsx:254`). **A jump does
  not change it**, so a jump cannot move the selection window directly. Either the flicker is present in
  ordinary forward flight and the jump merely raises the camera enough to show the far rails where it
  happens, or the cause is in the view-space transform rather than the selection.
- **Rail runs are merged across contiguous segments** and break only at a gap or a height change
  (`track-rails.ts:buildRailRuns`). On a clean stretch there may be **far fewer than 24 runs**, so the
  slot array is not necessarily saturated — which makes my "eviction churn" hypothesis in #161 weaker
  than I wrote it. A gap-dense stretch could still saturate. **This is a count, not an argument. Measure
  it.**
- `<EffectComposer multisampling={ 0 }>` (`net-canvas.tsx:136`) — no MSAA, no TAA. Shipped bloom is
  `mipmapBlur`, `GRID_VOID.bloom = { intensity: 1.2, threshold: 0.42, smoothing: 0.2, radius: 0.6, levels: 4 }`
  (`env-config.ts:144`).

**Next move on these is instrumentation, not tuning** — an on-screen readout in `/art-lab` of runs written
vs parked, min/max `railRunDistance` of the written set, and the farthest slot's tube halfLength. Then
jump. Discontinuous count or boundary => selection; steady while the picture flickers => shader or bloom.

## The two idle lanes — why, and what to do

The owner asked why `track-lead-in-33` and `emitter-array-4b` sit idle. **Because their work is merged and
they have nothing left**, not because they are stuck:

- `track-lead-in-33` built **#157** (merged 11:51). `LEAD_SEGMENTS` is on `dev` and in use at
  `track-floor.tsx:196`. Worktree removed in s28.
- `emitter-array-4b` built **#155** then **#158** (merged 11:33 / 12:08). `emitter-array.ts` is on `dev`.
  Context cleared and worktree removed in s28 on the owner's instruction.

Both agent processes survive with no worktree, no branch, no stack.

**One thing genuinely worth acting on: delete `feat/track-lead-in`, local and remote.** It is the only one
of the two branches still existing. Its own work is on `dev`, but #157 squash-merged so git cannot see
that — `git log origin/dev..feat/track-lead-in` still shows one "unmerged" commit, and its **2-dot diff
against `dev` is +78 / -1063**, because it now predates #155/#156/#158. Merging anything from it would
delete the emitter array, the rail work and `ART_MATERIALS.md`. That is the #118 -> #119 failure exactly.
**Offered to the owner; not yet done.**

Stale herdr workspaces `emitter-array` (w2H) and `track-lead-in` (w2J) point at directories git no longer
knows about. Disposable.

## Live state

| what | where |
|---|---|
| `:5200` / `:2600` | `slur-worktrees/split-crown`, `art/split-crown` — **the lane's, it owns this stack** |
| `:5202` / `:2602` | `slur-worktrees/seam-check`, detached at `dev` `cf1c98c` — everything merged, one frame |
| worktrees | shared checkout, `codex-reconcile`, `seam-check`, `split-crown` |
| PR queue | **empty** |

## Immediately next

1. **The `split-crown` lane will need a visual gate** — the ship at true footprint, nose forward, no team
   wash, at `http://localhost:5200/art-lab` from the real chase camera. It creates its own Chrome tab.
2. **Delete `feat/track-lead-in`** (local + remote) once the owner confirms — see above for why it is
   mildly dangerous to keep.
3. **The z=0 rail seam is STILL unlooked-at.** Carried since s26. `:5202` shows it.
4. **The ~17x rail spill shipped and is unfixed** — deck 1u from the strip reads 1.42e+1 against the
   strip's own 8.53e-1. **Still no issue filed**, and it may well be related to #160.
5. Tear down the two stale herdr workspaces when convenient.

## Carried, untouched

The two divergent `docs/art-direction/` snapshots, neither on `dev` (shared checkout's dirty 17 files vs
`docs/codex-reconcile` @ `84291fb`) — **still the owner's call, and now also the question of whether
`vehicles/` ever lands.** · Fly 7.5u through 8u pillar fields (ADR-011, #142) ·
`MARIGOLD_REFERENCE_INTENSITY` 2.0 `[unmeasured]` · rail breaks over full gaps · the rail's channelled
cross-section stays PARKED · the coplanar finding still unsent to Codex · the cold key at intensity 1 is
`[unmeasured]` beyond "8 was too much".

**Shared checkout is still `1807bc0` and dirty across 17 files. Read from a worktree or
`git show origin/dev:<path>`.**

## Commit trailers

The repo hook rejects the co-author trailer outright, including the form the session system-reminder asks
for, and it fires on the literal string anywhere in a heredoc. Write around it.

## Shell gotcha, paid for this session

**Backticks inside an inline `gh ... --body "..."` get command-substituted by fish.** A cross-reference
comment posted to #160 with every backticked identifier silently stripped to nothing. Always write issue
and comment bodies to a file and use `--body-file`; repair a mangled one with
`gh api -X PATCH repos/<owner>/<repo>/issues/comments/<id> -F body=@<file>`.

---

## THE ALPHA — the owner set the target (late session 29)

> "for now we will be focusing on finishing all the remaining slices for the track and then add ship and
> then build the non-destructible block. that this will complete a alpha milestone of the core gameplay
> with art."

**Milestone created: `Alpha — core gameplay with art`** (milestone 4). Three items, in the owner's order:

| # | issue | state |
|---|---|---|
| 1 | **[#163](https://github.com/dineshsalunke/slur/issues/163)** — gaps, gap rims, rail breaks over gaps, the z=0 seam | filed, not started |
| 2 | **[#159](https://github.com/dineshsalunke/slur/issues/159)** — the Split Crown on the Freighter | **IN FLIGHT**, lane `split-crown` |
| 3 | **[#164](https://github.com/dineshsalunke/slur/issues/164)** — the sealed deadly block | brief written s? and never dispatched |

Plus **[#162](https://github.com/dineshsalunke/slur/issues/162)** — the ~17x rail spill, **finally filed**
after being carried unfiled across three handovers.

**#160 and #161 are Backlog and stay there.** The owner was explicit: they were filed to be *recorded*, not
picked up. They are in `Backlog — deferred/infra`, which is where they were already put, so nothing needed
moving — but do not let a lane wander into them because they touch the same files as #162 and #163.

### Why #163 is first and what "remaining track slices" actually means

Task 2's spec is *"floor material, glowing edge rail, gaps, gap rims"*. The floor and the rail have shipped
across #131/#140/#142/#145/#147/#151/#155/#157. **Gaps and gap rims have never been art-passed at all** —
gaps exist as gameplay but have no treatment, no rim, nothing that says "edge" as you approach at speed.
That plus the two carried items (rail breaks over full gaps; the never-inspected z=0 seam) is the whole of
what is left. That is the list I reconstructed from the merge log, and **the owner has not confirmed it** —
put it to him before a lane starts #163.

### The documentation was lying, and I fixed it

**`.claude/art-pass/INDEX.md`'s status table said task 2 was "not started" and task 3 "not started"** while
the deck, rails, boundary, lead-in, emitter array and cold key had all merged. That table is the documented
cold-start entry point for the whole art arc (`CLAUDE.md` points at it), so it was actively misleading.
Rewritten: task 2 → MOSTLY BUILT with the shipped list and the remaining work, task 3 → PARTLY BUILT with
the cold key and its structural `N·L` limit, task 7 → linked to #164. Its header also claimed the arc is
tracked "**not** in GitHub issues"; amended to say the alpha scope now is, while the reasoning stays in the
file.

**`.claude/art-pass/02-track/README.md` is STILL STALE** — its own status header says "not started" and
"DECIDED, NOT YET BUILT (2026-09-19)". I did **not** touch it, because it is dirty in the shared checkout
and rewriting it there risks the `docs/codex-reconcile` tangle. Its §7 decisions D1–D5 are live and
binding; only its status line is wrong. **The INDEX now warns about this explicitly**, and #163's body
repeats the warning. Fix it inside the #163 worktree.

### Not in the alpha, deliberately

Tasks 4 (monoliths), 5 (asteroids) and 6 (composition) are out. They stay untracked in the INDEX, in the
arc's own order. Nothing about the alpha changes the fact that composition is judged last.

## Next action when this session resumes

1. **Put the #163 scope list to the owner for confirmation** — it is reconstructed, not authoritative.
2. **The `split-crown` lane will need its visual gate** (ship at true footprint, nose forward, no team
   wash, `/art-lab`, real chase camera).
3. **#164's brief is ready to dispatch** the moment there is a free lane; it runs parallel to track work by
   design, in its own isolation route.
4. Still unconfirmed: deleting `feat/track-lead-in` (see above for why keeping it is mildly dangerous).
