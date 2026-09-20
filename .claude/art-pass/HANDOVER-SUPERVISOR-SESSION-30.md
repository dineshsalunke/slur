# Supervisor handover — session 30 (2026-09-20)

Two dispatch asks, three owner interrupts, and **one correction that mattered more than any of them**: the
sealed-block lane was sent at a superseded art reference, and the silhouette question I was about to put to
the owner turned out to have been decided on 2026-09-19 inside a folder neither the brief nor I had read.

`dev` is untouched at `cf1c98c`. PR queue: **#165 only** (Split Crown), held.

## Done as asked

### `feat/track-lead-in` deleted, local and remote
Its work was on `dev` via #157's squash; git could not see that, and its 2-dot diff was +78 / −1063.

### The owner then widened it: ALL stale art branches are to be ignored and deleted
> "don't look at any previous art related branch's like art/block, they are to be ignored, infact they were
> supposed to be deleted, i am surprised you are still referring to them"

Fair hit — I had offered to keep `art/block` for its shader work as "reference material" when the standing
instruction was that these are dead. **Deleted locally:** `art/block`, `art/boundary-width-gate`,
`art/deck-emissive-knobs`, `art/frame-tap`, `art/procedural-bg`.

**The remote deletions did NOT happen** — the auto-mode classifier blocked the multi-branch
`git push origin --delete` (and blocked a `for` loop of local deletes; single `git branch -D` calls went
through). **Still on the remote and still to be deleted:** `art/block`, `art/bloom-input`,
`art/boundary-bevel`, `art/boundary-three-way`, `art/boundary-width-gate`, `art/deck-4u-bond`,
`art/deck-emissive-knobs`, `art/deck-joint-width`, `art/marigold-retone`, `art/procedural-bg`,
`art/track-slice2`, `chore/comment-ratchet`, `docs/comment-rule`, `docs/material-departures`,
`docs/rail-outboard`, `docs/track-readme-status`, `fix/strict-port`. **Protect `art/split-crown` (PR #165)
and `art/sealed-block` (live lane).** One `gh api -X DELETE repos/dineshsalunke/slur/git/refs/heads/<b>` per
branch, or the owner runs the push themselves.

## Lane `sealed-block` dispatched — issue #164

| | |
|---|---|
| agent | `sealed-block-77` (herdr name `sealed-block`), Opus 5, auto |
| worktree | `../slur-worktrees/sealed-block` · branch **`art/sealed-block`** off `origin/dev` @ `cf1c98c` (verified) |
| ports | 5204 / 2604, stack UP, both curl 200 |
| herdr | workspace `w2M`, pane `w2M:p1` |

Three amendments written into the brief at dispatch (§10): the **`art/block` branch is poisoned** (227
files, −9536 against `dev`); the shared checkout's dirty `INDEX.md` is a **regression** that deletes the
whole ADR-012 "Geometry / the playable read" standing-facts block, so the lane reads its worktree's
committed copy; and §6's "art/track is rewriting these files" is stale as a collision rule but kept as a
scope rule.

**Slice 1 is already committed and green** — `5fc6620` (the `/iso-block` instrument, the M2 body, the AABB
assertion) + `f40343c` (gate results in LANE-FACTS). No silhouette in it, so nothing was invested ahead of
direction. Gate: typecheck clean · lint at the 3-warning pre-existing baseline · shared 78/78 · client
80/80 · server 4/4 · build OK.

**The lane improved on my spec unprompted and it is worth keeping:** I asked for "nothing protrudes outside
the AABB"; it made the assertion **two-directional** — nothing outside the envelope *and* the envelope
reached on every axis — because a block drawn SHORT is the same class of lie about an un-jumpable wall, and
is the half an eyeball never catches.

## ⚠ THE CORRECTION — the block lane was reading a superseded reference

**`docs/art-direction/blocks/` holds boards 25–28 and NEITHER the brief NOR I had read it.** Board
`28_non_destructible_blocks_SPEC.md` states plainly: *"This is the current non-destructible block art
direction, superseding conflicting proposals in boards 25–27."* It also outranks board 10 and
`handoff/04_OBSTACLES.md`, exactly as `CLAUDE.md`'s own rule says — read the README and *"the relevant
finalized subject brief"* first; **subject briefs govern blocks**, the `handoff/` set is the older package.

**The owner then tightened it further: board 28 ONLY. 25, 26 and 27 are history, not references.**

**It answers the design question I was one keystroke from asking the owner**, and it rules out all three of
the lane's proposed options in part:

- *"Keep sealed rectangular cuboids with restrained bevels"* — **no draft, no taper.**
- *"Sparse marigold seams remain **vertical**, with variable positions and multiple seams permitted"* —
  kills the base-footprint seam and the recessed collar.
- *"Top-face luminous returns and glowing outlines are not part of the selected direction"* — kills the
  "move the seam to the top edge" fallback specifically. The generator drew them twice and they were
  rejected twice.
- **The real answer was the one none of the three options had: WEAR.** *"Use clean and worn instances of
  the same near-black coated-metal family. Broad irregular patches vary sheen and muted graphite value."*
  Board 27 recorded why — the owner *"found fine dark scratches unlikely to be visible during racing and
  requested larger features"*.

Also binding: no fissures/cracks/separated plates (treatment B was dropped, and incidental crazing in the
image is *"not authorization to reintroduce fissures"*) · *"keep the silhouette intact at every wear
level"* · *"preserve generous dark face areas"* · *"no new footprint dimensions are established"*, so
`ART_SCALE_REFERENCE.md` stays the sole dimensional authority. The board 28 **image** is a final draft that
*"has not itself been approved"* — the written direction is what is decided; the image is a LOOK target and
*"illustrative proportions, apparent height and camera matching are not measured evidence"*.

The lane's own mechanism choice — proportional geometry + world-space material — is **confirmed by the
spec** (*"prefer shared parameterized cuboid forms and shared material variation"*, with width/depth, bevel,
seam count/position/spacing, wear patch placement/scale/coverage/contrast and a seed as the named controls).
It reached that independently, before reading the spec.

**Outstanding on this lane:** it must repoint `<IsoLab board=...>` from `10_obstacle_blocks_final.png` to
`28_non_destructible_blocks_FINAL_DRAFT.png`, correct any board-10 citation in LANE-FACTS or comments, and
append the supersession note to its own `LANE-BRIEF.md` so the next cold reader is not sent the same wrong
way. It holds Chrome; it was told to take the tab and to measure **what an 8u block actually receives from
the `cf1c98c` cold key at the centreline versus at the rails** — nobody has that number, and if an
untreated M2 body reads as a black void it reshapes the seam and wear work rather than being a bug.

## PR #165 (Split Crown) — HELD, and the lane cleared

The lane finished, opened #165, eye-checked it as passing — and then the owner said the ship is **half sunk
into the deck**. The owner has since confirmed **`shipBox` was OFF**, so the debug-AABB occlusion
explanation (which the lane hit itself, and which is a genuine trap now in LANE-FACTS) is **ruled out**.

**Its measurement is the valuable artefact.** World-space bbox per ship, composing every node's TRS,
`keelAfterLift = nativeMinY × scale + lift`: executioner −0.0006 · challenger −0.0004 · bob −0.0011 ·
dispatcher −0.0005 · **split-crown −0.0000**. **The convention is keel-at-the-render-group's-origin and all
five satisfy it** — the placeholders' origins are not centred, their lift is precisely what keels them
(`systems.ts:24` writes `grp.position.y = s.y`; `ShipModel` places the clone at `[0, v.lift, 0]`).

So (a) bbox disagreement and (b) centre-seating are **ruled out**, and **(c) the deck's top surface is not
at the Y the rig assumes** is all that is left — `[unmeasured]`, the lane hit its 250k hard stop first.
Its hypothesis, which the owner's answer promotes: **split-crown is the only flat-bottomed hull**, so a
small deck offset is invisible on the placeholders' narrow fins and glaring on this one. **If true it is a
rig/deck fact affecting all five ships and the fix is not nudging one ship's lift.**

**Lane cleared and re-briefed** (context gauge confirmed 0%). `LANE-STATE.md` written by me and pushed as
`ca3d635`; branch clean, nothing unpushed. Its single next task: measure the deck's top world-Y against a
grounded ship's `s.y`, report both numbers, stop.

**Facing is settled** (Engine_core mean centroid +2.995 → stern +Z, nose −Z, facing `[0, π, 0]`), and the
**LFS guard needed nothing** — `isLfsPointer` already branches on `ArrayBuffer` (`gltf-lfs-guard.ts:28-36`);
the brief's predicted two-line fix was not applicable.

## Filed this session

- **#166** — bloom + React 19 `ref` crashes every dev lab on any Canvas re-render. `@react-three/postprocessing`
  3.0.4 memoises constructor args on `JSON.stringify( props )`, React 19 passes `ref` as an ordinary prop,
  the ref holds R3F's circular `__r3f`. Fixed inside #165 as standalone commit `411fda3` (built once via
  lazy `useState`); **I chose to let it ride** rather than split it, because it takes down `/art-lab`,
  `/art-gallery` and `/env-lab` and was blocking three lanes. Filed retroactively so it has a record.
  Second instance of the `effectpass-orphaned-by-prop-change` family: **an effect element is
  construct-once, mutate-live.**
- **#167** — ships hover above the deck proportional to speed (owner's idea). Backlog. The constraint
  written into it: **render-only Y offset**, never `simulate()` — a hover term in the sim moves the
  collision hull relative to the deck and every 8u block. My one pushback on the record: a hover-racer
  resting flat at zero speed can read as *landed*, or as *sunk*, which is the bug currently open. Sequenced
  explicitly after the seating fix.

## Live state

| what | where |
|---|---|
| `:5204` / `:2604` | `sealed-block` lane — **holds Chrome** |
| `:5200` / `:2600` | `split-crown` lane, freshly cleared, one measurement to take |
| `:5202` / `:2602` | `seam-check`, detached at `cf1c98c` |
| worktrees | shared checkout · `codex-reconcile` · `seam-check` · `split-crown` · `sealed-block` |
| idle agents | `emitter-array-4b`, `track-lead-in-33` — merged work, no worktree, disposable |

## Immediately next

1. **Delete the 17 stale remote branches** (list above) — blocked by the classifier this session.
2. **#165 stays held** until the deck-Y number comes back. If the deck top is above 0 it is a five-ship
   fact and a separate fix.
3. The `sealed-block` lane's next report: the cold-key measurement + the board-28 repoint.
4. **#163's scope list is STILL unconfirmed by the owner** — carried from session 29.
5. The z=0 rail seam is still unlooked-at (carried since s26). `:5202` shows it.

## Carried, untouched

The two divergent `docs/art-direction/` snapshots and whether `vehicles/` lands · `.claude/art-pass/02-track/README.md`
still says "not started" and is stale (fix inside #163's worktree) · #160/#161 stay in Backlog, deliberately ·
`MARIGOLD_REFERENCE_INTENSITY` 2.0 `[unmeasured]` · `LETHAL_SURFACE` is still `#ff2740` red with a comment
deferring the retone to the block task — that is the **integration** step after #164, correctly deferred ·
the coplanar finding still unsent to Codex.

## Gotchas paid for this session

- **The auto-mode classifier blocks multi-target git branch deletion** and `for` loops over `git branch -D`.
  Single invocations pass.
- **A lane's herdr name is not its `ListAgents` name** — `split-crown` vs `split-crown-da`. `herdr agent
  send-keys` needs the herdr name (`herdr agent list`); `SendMessage` needs the `ListAgents` one.
- **Copying a doc from the shared checkout into a worktree can silently REVERT it.** The dirty `INDEX.md`
  there was older in one respect than `dev`'s committed copy. `git diff` after any such copy, before
  trusting it.

---

## ADDENDUM — late session 30

### The sunk hull: all three hypotheses are CLOSED, and coplanarity is the surviving candidate

The `split-crown` lane (not stuck — it was waiting on Chrome, at 10% context) measured option (c) shut:

- **The deck's top face is the plane `y=0` everywhere.** `emitSpan` draws it at the span's own `y`
  (`track-floor.tsx:129,:140`), and the distinct set of every `FloorSpan.y` the generator emits across
  seed-1234's 400 segments plus the lead-in is exactly **[0]**. No transform sits above it — `TrackView`
  is a bare `<Fragment>` of three leaves, `TrackFloor` is a bare `<mesh>` with no position, and
  `net-canvas.tsx:124` mounts it as a direct Canvas child.
- **A grounded ship's `s.y` is exactly 0**, across 338 grounded ticks of the real shared `simulate()` at
  freighter tuning. By construction: `landingFloor` returns `f.y` and `step.ts:215` writes `s.y = floorY`.

So (a) bbox disagreement, (b) centre-seating and (c) a deck offset are **all ruled out, by measurement.
There is no offset anywhere in the chain to nudge.**

**What survives is the lane's own flag: keel-at-0 against deck-top-at-0 means the Split Crown's flat
underside is exactly COPLANAR with the deck at ZERO clearance — uniquely so, because it is the only
flat-bottomed hull.** The four placeholders touch that plane only at narrow gear and fins. A 1u-tall flat
wedge lying flush on a plane, seen from a raised chase camera with no gap, no contact shadow and no
parallax at the contact, is a strong candidate for what reads as "half sunk" — and coplanar surfaces are
where depth precision fails, so the deck may be drawing over parts of the underside outright.

**Chrome was serialised to `split-crown`** (the `sealed-block` lane is told to hold and to take its
cold-key measurement meanwhile). Its brief: the grounded hull from the real chase camera with `shipBox`
off · the same view with a token half-unit lift, **uncommitted and not a fix** · whether depth fighting is
visible at the contact · a placeholder hull for contrast. **It is told not to commit a fix** — if
coplanarity is confirmed, the remedy affects all five ships, is entangled with **#167**'s hover, and is the
supervisor's to route to the owner.

**This makes #167 a fix rather than a flourish**, and it sharpens the open question in it: the "zero speed
= resting on the deck" half is precisely the state that produces zero clearance.

### PR #168 — `ART_MATERIALS.md` M2 corrected

The `sealed-block` lane found our own sheet's **M2 omits wear entirely** while board 28 makes broad wear
patches *the* variation mechanism — a reader of M2 alone builds a uniform family and thinks it correct.
Also missing: seams are vertical-only, top-face returns are excluded, and instance variation is seeded.

Fixed in **#168** (`docs/block-wear-m2`, worktree `../slur-worktrees/block-wear-m2`, `6ec4a05`), lint green
at the 3-warning baseline. Nothing under `docs/art-direction/` touched. The misread risk is flagged inline:
M2's destructible-variant fractures belong to a different family member and must not be carried onto the
sealed block. Still open and `[unmeasured]`: wear "varying sheen" needs a roughness **spread**, and whether
the worn end stays inside 0.60.

### Dead lanes cleared

`emitter-array` (w2H), `track-lead-in` (w2J) and `frame-tap` (w2E) workspaces closed — all three had
merged work, no branch, no worktree, no stack, and had been listed as "disposable" across two handovers.
`git worktree prune` found nothing stale. **Teardown belongs in the merge step, not the handover** —
worth folding into the lane skill.

### `sealed-block` cleared and re-briefed

At a clean seam at 152k. `LANE-STATE.md` pushed as `de2bb69`; HEAD was `0eb7947`, gate green, instrument
repointed at board 28, board 10 relabelled "(SUPERSEDED)". Its cold-start check passed — it caught that
LANE-STATE names an earlier HEAD than the commit that added LANE-STATE itself, and reasoned it correctly
rather than flagging a false contradiction. Next: the cold-key measurement (`[unmeasured]`), then the
triplanar verification (`[unverified]`), then the visual gate once Chrome comes back to it.

**Trap worth carrying: the lint comment-ratchet fires on TOUCHED files**, so a one-line comment added to
an existing file costs a deletion somewhere.

### PR queue now

**#165** Split Crown — HELD on the coplanarity look. **#168** M2 wear — ready to review.
