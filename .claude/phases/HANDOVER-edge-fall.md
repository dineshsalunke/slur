# Handover — ships can fall off the deck edges

Session of 2026-09-23, `slur-supervisor`. Shared checkout with `hud` (exhaust), `atmospherics`
(asteroid bands) and `rearview-mirror` (idle).

## Branch state — READ THIS FIRST

`atmospherics` created `feat/asteroid-bands`, which violates the standing policy in
`2026-09-22-block-surface-and-the-fresnel-trade.md:11` — *"all agents work directly on `dev`, no
worktrees, and no creating branches unless specifically asked"*.

Because the checkout follows one HEAD, **three sessions' commits landed off `dev`**:

    dd24d04  fix(scene): give the exhaust plume a marigold halo   hud's
    37e70e0  docs(phases): correct the halfL claim                 rearview-mirror's
    bb2d9f5  feat(scene): render the three asteroid bands (#211)   atmospherics'

`dev` was left at `dbb0245`. The fix is a fast-forward, verified safe with
`git merge-base --is-ancestor dev feat/asteroid-bands`; the tree object is identical so no working
file changes:

    git branch -f dev feat/asteroid-bands && git checkout dev
    git branch -d feat/asteroid-bands

**RESOLVED.** `atmospherics` ran it; verified this session — on `dev` at `dd953ea`, all four commits
present, `feat/asteroid-bands` deleted, only `dev`/`art/hdri-picker`/`art/rail-lights` remain. No
working file was disturbed.

**The root cause is still live and will repeat.** `CLAUDE.md:208` instructs the opposite of the
policy — *"Reach for one when that's the actual problem; otherwise **branch and commit in the
checkout like any normal repo**"* — and `:212` lists *"you need a second live stack running at once"*
as a reason to use a worktree, which is exactly the case that triggered this. The no-branch rule
appears **zero** times in `CLAUDE.md` (`grep -c` verified); it lives only in the phase note above,
which `CLAUDE.md` says is *"not loaded by default"*. So the binding rule is in a file nobody loads
and the loaded file contradicts it. **Owner's file, owner's call — flagged, not edited.**

## State: written, tested, NOT committed

Three files are dirty and all three are mine:

| File | Change |
|---|---|
| `packages/shared/src/sim/step.ts` | The feature |
| `packages/shared/src/sim/step.test.ts` | Three tests appended |
| `.claude/phases/HANDOVER-edge-fall.md` | This file |

`pnpm --filter @slur/shared test` → **98 pass, 0 fail** (was 95). Full `typecheck`/`lint`/`test`/`build`
NOT yet run. **`docs/GDD.md` is NOT yet updated — see Next #1.**

## What was built

Mechanic #3 of the three the owner announced, catalogued in
`2026-09-22-block-surface-and-the-fresnel-trade.md:158` — *"Players can fall off the deck edges."*
The owner chose "build it, skip the issue" when asked, so **no GitHub issue was filed** and
`CONTRIBUTING`'s issue-first rule is knowingly waived for this one.

**The handover's pointer was wrong and cost a wrong first move.** It cites `step.ts:74`, which is the
*definition* of `clampToEdges`. There are **two call sites**: `step.ts:71` inside `resolveFlatFloor`
(the no-track path) and the one on the track path. Deleting the function outright — the obvious
reading — would also wall-remove the trackless path, which has no floor spans and nothing to fall
into.

Three edits:

1. Extracted `deckLimit( t )` = `t.halfWidth - t.halfW`, so the number has one home.
2. **Removed the `clampToEdges` call on the track path only.** `resolveFlatFloor` keeps its clamp.
3. **`respawn()` now clamps `s.x` into `±deckLimit`** instead of restoring `lastSafeX` verbatim.

**Why #3 is not optional — it is a death loop.** `lastSafeX` is recorded on *every* grounded frame,
and `bestFloorInSeg` holds a ship up while any part of its footprint overlaps a floor span
(`s.x + t.halfW <= f.x0 || s.x - t.halfW >= f.x1` is the reject test). So a ship overhanging at
`x = 33` is grounded and records `lastSafeX = 33`. Respawn then places it there — but `respawn` calls
`floorUnder`, which tests the **centre** (`x >= f.x0 && x <= f.x1`), gets `null` past `±32`, falls
through to `?? 0`, and drops the ship at `y = 0` in the void. It falls, dies, respawns at 33 again.
Issue #6 is an existing death-loop report, so this failure mode is not hypothetical.

**No new death or respawn plumbing was needed** — the chain already existed end to end: `landingFloor`
returns `null` off the deck → `grounded = false` → gravity → `step.ts` `if ( s.y < t.deathY )` →
`markDead` → `respawn` at `lastSafeX/lastSafeZ` with `respawnSetback`. The handover's "nearly free"
claim is correct, verified this session.

**The edge now behaves exactly like a gap edge** — same `bestFloorInSeg` footprint rule, no new
concept. A ship stays supported until its whole body clears `±HALF_WIDTH`, giving a `2 * halfW`
overhang band, and can strafe back onto the deck mid-fall and land. That recovery came free.

## Next

1. **Update `docs/GDD.md` — this diverges from it today.** Two lines:
   - `:125` — *"Lateral: smooth analog strafe with a generous clamp (flying feel)"*. The clamp is now
     gone on the track path; this sentence is false as written.
   - `:148` / `:304` — the hazard vocabulary reads *"gaps (fall = death/respawn — jump)"*. Edges are
     now a second fall hazard and belong in that list.
2. **Resolve the rail against this.** `GDD.md:314` — *"Track edge rail — chamfered bar standing
   outboard of ±`HALF_WIDTH` (ADR-012). No drawn element may consume playable width"*. A ship now
   falls *through* the visual rail. Either the rail reads as a lip you slip past, or it wants art
   direction. **Not an engineering call — ask the owner.**
3. **Run the full gates and commit to `dev`** once the branch mess above is settled.
4. **Playtest it.** Untested by hand; the feel of the overhang band is the whole question and only the
   owner can judge it.
5. The other two announced mechanics are still unstarted, still unfiled: block height as a 4u–8u
   range, and block hits bouncing instead of killing. **Mechanic #1 is blocked** by the single-slice
   clearance sampler at `sim/track.ts:414` — `const zc = seg.z0 + SEG_LEN / 2;` samples one z-slice
   per segment, valid only because every block is centred and 8u deep. It must sample every block
   z-boundary, with tests, before block geometry varies in z.

## The shared tuning store cost three sessions real time today

`localStorage` key `slur.tuning.v1` on `:5173` is shared by every driven tab. An entry applies **iff
`entry.from` equals the current schema default** (`dev/tuning-persist.ts`) — so editing a default in
`tuning-schema.ts` silently kills every persisted entry for that key, and the panel will show a
dialled number the scene is not using.

`atmospherics` lost a look judgement to this and retracted two competing diagnoses. **I guessed at
their stored `from` values and was wrong**; they had the snapshot. Do not infer store contents —
read them, or clear the key and reload.

A second origin does **not** need a worktree: `apps/client/.env` takes `CLIENT_PORT` +
`VITE_SERVER_PORT` (issue #59), launched with a matching `PORT=` in the shell.

## Related

- [[2026-09-22-block-surface-and-the-fresnel-trade]] — where the three mechanics are catalogued.
- [[2026-09-22-bloom-ownership-and-the-block-maps]] — the note I misread as a live handover.
