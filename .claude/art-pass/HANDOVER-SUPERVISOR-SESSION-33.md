# Supervisor handover — session 33 (2026-09-20)

**The lane machinery is retired.** The owner called it too wasteful, and work moves into the supervisor
session. Both lanes were stood down at clean seams with full handovers, everything they produced is merged,
every worktree and dev stack is gone, and the supervision history — 25 handover docs that existed only as
untracked files in the shared checkout — is finally committed.

`dev` at **`654177c`** before this doc lands. PR queue: **empty**. Remote branches: `dev`, `main`,
`docs/codex-reconcile` (parked).

## What changed structurally

Sessions 26–32 ran two or three lanes in parallel: a worktree, its own ports and stack, a Claude agent in a
herdr pane, a generated brief, and a supervisor coordinating them. That is over. The cost that ended it was
not any single failure but the overhead itself — briefing, clearing, re-briefing, tracking who held Chrome,
and writing a handover per lane per clear, for work that one session can now do directly.

**The lane skill and its docs are not deleted** — `~/.claude-personal/skills/lane/SKILL.md` still works and
the accumulated gotchas in it are still true. The default is simply no longer "spin up a lane".

## Merged this session

- **#175 — the sealed deadly block** → `dde1eee`, closing **#164**. Chamfer, vertical marigold seams, wear
  plumbed and shipped at strength 0. **Its branch was 27 commits behind `dev`** (merge-base `cf1c98c`), so
  its 2-dot diff showed `split-crown.glb` and all of `.claude/art-pass/08-ships/` as deletions. Rebased onto
  the then-current `dev` (`32a6b5f`) and re-gated: after the rebase the 2-dot diff had **zero** deletions and
  the Split Crown was intact. Gate green on `d1d6ced` — typecheck clean, lint at the
  pre-existing 3-warning baseline, shared 78/78 · client 93/93 · server 4/4, build OK. All three SHAs (gated,
  PR object, `refs/pull/175/head`) verified identical immediately before merging.
- **#176 — #171 measured on pixels** → `654177c`, closing **#171 as invalid**. Docs-only.

## ⚠ #171 is dead, and it was the shipBox slab for the third time

**The hull renders 0.04971 linear (8-bit 63, `#3f4348`), not the ~0.4 the issue claimed.** The surface that
estimate was taken from **was not the ship**: `ship-box.tsx` draws an unlit
`<meshBasicMaterial color="#404040" />` exactly where the ship belongs, and `DEFAULT_LAB_LAYERS` ships it ON
with `ships` OFF. It sampled `#404040` with **min = max = 64 across 6561 pixels** — zero shading variance,
which is the tell that it is unlit geometry.

**That same slab is the control that closes the issue.** `#404040` in, `#404040` out, bit-for-bit — an
identity sRGB round trip. Any tone curve is non-linear *everywhere*, so an error of 7x, let alone 50x, would
necessarily have displaced that pixel. It provably did not move. **There is no colour-management fault in
this project**, and that is now established rather than assumed.

The colour path, read from installed source: R3F 9.7.0 defaults to `ACESFilmicToneMapping`, but
postprocessing 3.0.4's `<EffectComposer>` assigns `gl.toneMapping = NoToneMapping` on mount, and the stack
carries `Bloom` only with no `ToneMappingEffect`. Output is `SRGBColorSpace`. **The inversion is the plain
sRGB EOTF and nothing else.**

Near-black arrives correctly where it can be seen to: deck far from the rails reads `#101113` = 0.00510
linear against the authored 0.00700. The residual ~7x on the *lit* hull face is rail irradiance — ship and
deck brighten and darken together toward the rails, and a transfer bug would be flat. That attribution rests
on the spatial gradient plus the identity control, **not** a forward radiometric calculation, and is marked
`[unmeasured]` in the lane's handover.

Full method and sample table: `.claude/art-pass/03-lighting/HANDOVER-FINAL-NEAR-BLACK-ALBEDO.md`.

**#170 is un-held** (comment on the issue). Its bearing table was computed against a pipeline now known to be
clean, so it stands. But see below — it may be answering the wrong question.

## The owner's chosen order, and why

1. **#174 — fix the instrument.** `/art-lab` opens on the debug slab with the ship hidden. That default has
   now produced **three** phantom bugs and cost a lane a full stint. Everything else is judged through this
   lab, so it goes first. **The trap:** do *not* change `DEFAULT_SHIP` (`ship-classes.ts:132`, currently
   `'challenger'`) — it decides what every real player flies. This needs its own lab-only constant read by
   **both** independent seeds, or the picker's highlight will lie about what is on screen:
   `art-lab-controls.tsx`'s `useState< ShipId >( … )` drives the highlighted button and `art-lab-rig.tsx`'s
   `Net( { …, shipId: … } )` decides what mounts.
2. **#172 — the frame tap can kill the dev server.** `entry.done` in `frame-tap-plugin.ts` is the sole writer
   of the tap's response and calls `json( res, … )` with no `res.headersSent` check and no settled flag,
   while reachable from three paths: the deadline timer, the settle timer and the `slur:frame-tap:error`
   handler. Each guards itself with the `pending` map, but the map entry is not the response and `entry`
   stays captured after the delete. The second caller throws `ERR_HTTP_HEADERS_SENT` **from a timer
   callback**, where there is no request context, so Node exits and client and server go down together. Both
   lanes triggered it this round.
3. Then **#170** or **#173**, and they are in tension — see below.

## #170 vs #173 — the open question worth settling first

**#173's claim:** nothing in this game casts a shadow and nothing ever has. Zero hits under
`apps/client/app/` for `shadows`, `castShadow`, `receiveShadow`, `shadowMap`, `ContactShadows`,
`AccumulativeShadows`, `SoftShadows`. The deck is lit from its own emissives (#155) and an emissive material
is not a light in three — it cannot cast. The cold key (#158) is the only real light and is not configured to
cast. So a correctly-seated ship has no contact cue and reads as sunk.

**The albedo measurement supports #173 over #170 for that symptom:** the hull's lit face at 0.0497 against
the deck beside it at 0.0236 is a **2.1x step**, so tonal separation at the seam already exists. A back-fill
raises both and adds no contact cue.

**#170's own premise stays true** — the player-facing face of everything receives essentially zero light
(direct `0.00e+0`, env diffuse `4.81e-5`, env specular `2.91e-4`, `dotNV` 0.928 so no grazing rescue) — and is
worth fixing on its merits. It is just no longer the leading explanation for the sunk read.

**#173 is deliberately unprescribed** and carries non-negotiable #14 in full: five candidates listed on the
issue (shadow map on the key · drei `<ContactShadows>` · a blob shadow parented to the ship · SSAO in the
existing chain · a fresnel rim on the lower edge), explicitly not a recommendation. **The constraint most
likely to eliminate an attractive option: the deck is not continuous, so check the chosen mechanism over a
GAP early.** A floor-plane trick that floats over a hole is worse than no cue at all.

## Escalated by the block lane and not yet decided

**No block in the family presents a seam on its −Z face — the face an approaching player sees.** That face
receives rgb(0,0,0) (total `3.39e-4` against a marigold yardstick of `8.530e-1`), `N·L` is 0.000 from both
lights, and the chamfer recovers exactly one lit vertical edge (0.3388 / 0.4646) while every other
presented-face facet is 0.0000. So the emissive seam is the only thing that can carry information there, and
with 1–3 seams over the full perimeter it lands there only by chance.

Whether placement should be **biased toward the presented face** is beyond board 28's "variable positions"
and is the owner's call. The lane's own note: it interacts with #170 and may be worth deciding **after** a
fill lands rather than before.

## What the block lane left `[unmeasured]`

Named with the frame that settles each, in `.claude/art-pass/07-blocks/HANDOVER-FINAL.md`. The most important
by its own assessment: **`/iso-block-wear` has never been looked at.** The route returns 200 and sweeps
strength 0 → 0.6 → 1, but no frame has ever been captured, so the value noise and both shader hooks are
unproven on pixels. It ships at strength 0, pinned by a test, so nothing it computes reaches a shipped frame
— but nothing would tell you if the noise is wrong either.

Also still unmeasured: race-speed read in `/art-lab`, the in-game read of the vertical chamfer strip carrying
0.3388 on the presented face, whether a base-contact seam reads per-block or as a continuous route glow, and
`MARIGOLD_REFERENCE_INTENSITY` at 2.0.

## Teardown, as done

- Both lanes wrote final self-contained handovers and stood down: `.claude/art-pass/07-blocks/HANDOVER-FINAL.md`
  and `.claude/art-pass/03-lighting/HANDOVER-FINAL-NEAR-BLACK-ALBEDO.md`, both merged.
- **All dev stacks killed** — ports 5200/2600, 5202/2602 and 5204/2604 all verified free. The seam-check stack
  was still running and was killed by explicit PID after confirming every process path lay inside that
  worktree (`pkill -f` is blocked by the permission classifier; kill by PID).
- **All four worktrees removed** — `sealed-block`, `split-crown`, `seam-check`, `codex-reconcile` — and
  `slur-worktrees/` is empty.
- **Branches deleted:** `art/sealed-block` and `fix/near-black-albedo` (merged this session), plus the stale
  `art/split-crown` (#165) and `docs/block-wear-m2` (#168). Note that squash-merged branches always look
  unmerged to `git log dev..branch`; the authoritative check is the PR's merge state, not history.
- **`docs/codex-reconcile` is pushed and parked** — one commit, *"adopt Codex's 2026-09-19 reconciliation,
  keep the engineering sheets"*. It had existed only in an unpushed worktree for several sessions; it is now
  safe on origin and still needs a PR decision.
- **No Chrome tab was closed by anyone.** Both lanes confirmed it explicitly.

## ⚠ The shared checkout — what was fixed and what is still divergent

It was 27 commits behind `1807bc0` with 55 untracked entries and 23 modified tracked files.

**Fixed:** 36 Claude-owned docs existed *only* as untracked files there — 25 supervisor handovers (sessions
7, 8, 10–32; **9 is missing and appears never to have been written**), 8 `02-track` briefs, 2 `03-lighting`
briefs, and one phase note. Only session 6 had ever been committed. **The entire supervision history of the
art pass was one `git clean` from gone.** It is committed in this PR.

**Still divergent and needing the owner:** the checkout still carries modifications to 23 tracked files, of
which **8 conflict with `dev`** — `CLAUDE.md`, `docs/ART_SCALE_REFERENCE.md`, `.claude/art-pass/INDEX.md`,
`.claude/art-pass/02-track/README.md`, and four under `docs/art-direction/`. Against `dev` they are net
**deletions** (90 insertions, 421 deletions), which reads as an older snapshot that later merged PRs
superseded — but that is an inference, not a verified fact, and two of those files are Claude-owned while
four belong to ChatGPT's workspace. **Nothing was discarded.** `git pull` in that tree will conflict until
someone decides, and until then a file read from it can be stale — exactly what misled session 32 into
reporting the frame-tap source as absent.

A further **65 untracked files under `docs/art-direction/`** are ChatGPT's divergent snapshot of a folder
`dev` already has. **Not touched, not committed** — that folder is read-only for Claude. Also untracked and
ignorable: `.playwright-mcp/` output and a `.Codex/` directory, neither of which is ours.

## Carried forward, still unresolved

**#163's scope list has never been confirmed by the owner** — carried from sessions 29, 30, 31 and 32. It is
the track slice: gaps and gap rims, rail breaks over gaps, and the z=0 seam. Worth asking directly rather
than carrying a fifth time.

The z=0 rail seam is still unlooked-at (since session 26; the `seam-check` worktree that was parked for it is
now removed, and it was only ever a detached checkout of `cf1c98c`) · `.claude/art-pass/02-track/README.md`
still says "not started" · #160/#161 stay in Backlog deliberately · `LETHAL_SURFACE` is still `#ff2740` red
with the retone deferred · the coplanar finding is still unsent to Codex · whether `vehicles/` lands.

## Gotchas paid for this session

- **A branch cut before a merge shows that merge's work as deletions.** #175's 2-dot diff claimed to delete
  `split-crown.glb` and all of `08-ships/`; its 3-dot diff was clean. Neither diff alone tells you it is
  safe — rebase onto current `dev` and confirm the 2-dot diff has zero deletions.
- **`pnpm -r test` output is easy to misread.** `apps/client` runs vitest and prints `Test Files` / `Tests`;
  `packages/shared` and `apps/server` run `node --test`, which prints `ℹ tests` / `ℹ pass` / `ℹ fail`. A grep
  for `Test Files` silently reports only the client and looks like a pass.
- **`pkill -f` is blocked by the permission classifier.** Trace the process tree with
  `ps -o pid,ppid,command -p <pid>` and kill by explicit PID, confirming each path lies in the intended
  worktree first.
- **`git worktree remove` needs the worktree gone before its branch can be deleted** — carried and
  reconfirmed.
- **Squash-merged branches always look unmerged by history.** `git log origin/dev..origin/<branch>` lists
  every original commit even when the content is fully in `dev` under one squashed commit. Check the PR's
  merge state via `gh`, never the log.
