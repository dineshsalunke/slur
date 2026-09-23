# Handover — corridor composition: all five changes landed

Session of 2026-09-23, the `corridor-composition` lane. Answers
[[HANDOVER-corridor-composition]]. **All five changes are committed on `dev`.** No branch, no
worktree. Gates green after every commit: `pnpm typecheck`, `pnpm test` (301 tests across the three
workspaces, up from 276), `pnpm lint` at the ten pre-existing warnings with nothing new.

| # | Commit | What |
|---|---|---|
| 0 | `be6c95f` | clearance sampled at every z-boundary |
| 1 | `bf3ea85` | block depth in three tiers |
| 2 | `4af25f5` | gaps and blocks co-occur (+ GDD) |
| 3 | `309f007` | demands spaced by reaction time |
| 4 | `5326eb6` | rest / build / spike / release phrases |
| 5 | `5b4a8f9` | test track to 420 segments |

`ffa25fb` (atmospherics, rock) sits between 0 and 1 — another session's, untouched.

## What each change turned out to be

**0 — the sampler.** Two functions were unsound, not one. `openCenterX` read a single mid-segment
slice, as briefed; `passableCorridorWidth` read the five `CELL` row centres, so a block at
`z0+3..z0+5` was invisible to it as well. Clearance is piecewise constant in z and changes only at a
block or floor-span boundary, so both now sample the **midpoint of every interval between
consecutive boundaries** — exact, not a finer approximation. `openCenterX` additionally intersects
open runs across all slices, so a pickup cannot sit in a lane blocked elsewhere in the segment;
it falls back to the mid-slice widest run when nothing threads the whole segment. New
`packages/shared/src/sim/clearance.test.ts`, nine tests, four of which fail against the old sampler.

**1 — depth.** New `packages/shared/src/sim/block-depth.ts`. `BLOCK_DEPTHS = [4, 8, 16]` plus a
z-offset inside the segment, from a salted `mulberry32` keyed on seed/segment/lane-run. Deep tiers
get commoner as `intensityAt` rises. **Depth is capped at `SEG_LEN`, not the briefed 24u** — the
existing invariant test requires `b.z0 >= s.z0 && b.z1 <= s.z1`, and a block overhanging a segment
boundary needs a decision about which segment owns it for streaming. 20u still reads as commit-early.
`BLOCK_DEPTH` is gone; nothing else imported it.

**2 — co-occurrence.** A gap segment that keeps a full-span deck (a crack, or a partial gap) may
carry **one** block on its back half. A full-width gap carries none — only rim teeth, nothing to
stand on. Bounded generate-and-test: roll a candidate, measure `passableCorridorWidth` over the
combined segment, reroll, at most `GAP_BLOCK_ATTEMPTS = 6`, then fall back to no block. 195 of 384
gap segments carry one across seven seeds; worst combined corridor is exactly `MIN_LANE`.
`gap-crack.test.ts`'s "a crack segment carries no blocks" was the assertion this change retires —
rewritten, not deleted.

**3 — spacing.** `DEMAND_SPACING_REST_S 1.6 → DEMAND_SPACING_PEAK_S 0.5`, floored at
`REACTION_WINDOW_S 0.45`, converted to segments with `DEFAULT_TUNING.maxCruise`. The ad-hoc
one-segment guards are gone: `gapOpens()` and `flickOpens()` share one refractory that measures from
the **end** of the previous demand, so a 2–4 segment crack no longer lets the next gap open one
segment later. A flick is also suppressed inside a gap's refractory. Tightest gap-to-gap rest went
from 0.36s to 0.73s; mean 4.2–5.3s.

**4 — phrasing.** `SECTIONS` rewritten into four build/spike/release/rest phrases plus intro, bridge
and outro. Spikes are the **shortest** sections (weight 3), rests the flat held ones (weight 4).
Second half: `restScale()` scales wall density, gap probability and flick rate toward zero below
`REST_INTENSITY = 0.15`, because all three lerp from a non-zero floor and a "rest" was previously
just thinner. Seed 1234 now has a 5.5s hazard-free run and 485 blocks where it had 611 and no
breather. The ADR-006 requirements are now asserted rather than assumed: bridge valley at 69–77%,
biggest final chorus, plain finish.

**5 — length.** `TEST_LEVEL_SEGMENTS` 120 → 420. Streaming holds: worst case 62 blocks in the window
on the test descriptor, 111 on a full-density 400-segment track. `BACK` untouched at 240. The budget
test was checking the wrong window — `AHEAD + 80`, ignoring `BACK` — and now uses `BACK + AHEAD`.

## Where the research changed the plan

`.claude/research/procgen-level-design.md` (`7a945a6`) was read before 3 and 4, as instructed. It
**supplies no number** for either: it says plainly that no game-design source gives a
reaction-time-to-spacing figure, and none gives a phrase length for a racer. What it does supply is
the shape, and both changes follow it — Compton & Mateas make jump success depend on approach speed
and reaction time (so spacing in seconds against a reference speed is right), the racing track-design
source argues a track should assume the player rides near a target speed band rather than braking
(so `maxCruise` is the right reference, the same one `jumpReach()` uses), and L4D's Build Up / Peak /
Relax — named by Dead Cells as its own model — plus Redout's "space and time to recover" back the
phrase shape. **The seconds and the weights are design choices to playtest, not cited constants.**
Nothing in it applied to 0, 1 or 2.

Heights stayed at 8u throughout, so the missing vertical-reach check in the validator never became
load-bearing. Flagging it rather than assuming, as asked: **it is still missing**, and the first
change that makes any block clearable makes it a blocker.

## On-screen check — partial, and here is exactly how far it got

Ran on its own origin (`CLIENT_PORT=5181` / `VITE_SERVER_PORT=2581` with a matching `PORT=`), so the
shared `:5173` leva store could not pollute it. The stack is stopped and `apps/client/.env` removed;
ports are back to defaults. The `/test-level` tab is left open, per [[leave-the-browser-tab-open]].

What the screenshot showed: the scene renders, blocks ahead have visibly different footprints, and a
block stands on the floor immediately beside a gap rim — change 2, on screen. What it did **not**
show: the mid-track phrasing. The driven tab is backgrounded and the sim advanced roughly ten times
slower than real time, so the ship reached 3 u/s in six seconds of held throttle and never left the
start apron. **The rest/build/spike/release shape is verified numerically, not visually** — density
profile, longest breather, spike-to-rest ratio, all asserted in `phrasing.test.ts`. Someone should
fly 420 segments by hand before this is called finished.

## Left undone

- The visual playtest above.
- `packages/shared/src/sim/track.ts` is now **612 lines** against biome's 300-line warn threshold. It
  warned before this work and still warns — no new warning — but changes 2 and 3 both went into it
  because extracting the sampler or the gap-block code creates an import cycle with `track.ts`'s
  spatial constants. The clean fix is to move `HALF_WIDTH`/`SEG_LEN`/`LANES`/`MIN_LANE`/`ZCELLS`/
  `BLOCK_HEIGHT` into their own module and re-export from `index.ts`; it is mechanical, safe from
  collisions (nobody else is in `packages/shared`), and worth doing before the file grows again.
- The block budget headroom narrowed: worst case 111 against `BLOCK_LIMIT` 160, where the brief
  recorded 71. Phrasing concentrates blocks into spikes. Not a problem yet; it is the number to watch
  if spike intensity rises.

## Still out of scope, unchanged

The 4u jumpable block (the research strengthens the case for deferring it — never generate a height
in the ambiguous zone between two known-good ones), bounce-instead-of-kill
([[HANDOVER-block-mechanics]]), and the tuning-panel retirement.

## Addendum — 2026-09-23, the refactor item is closed

`1fc678c` splits `track.ts` into `space` / `weave` / `intensity` / `gaps` / `gap-blocks` /
`clearance`, leaving `track.ts` at 216 lines. All 301 tests pass unchanged — the seed-specific
phrasing and density assertions are what make it checkable as a pure move. Lint is at nine warnings,
down from ten; the one that went is `track.ts`'s own.

One signature changed: `gapBlocks()` takes `intensity` instead of `length`, so it no longer reaches
back into `intensityAt`. `buildSegment` already held the value.

**Collision during the work.** `slur-supervisor` started the same extraction at 01:39 and overwrote
this session's in-flight `space.ts` and `clearance.ts` before either was committed. Untracked files,
so nothing to recover from — the reconstruction was merged forward rather than re-clobbered. The
lesson is not "use a worktree": it is that **two sessions read the same "Left undone" list and both
started**. A claim belongs in the lane before the first file is written.

Still undone: the human playtest, and the missing vertical-reach check in the validator.
`slur-supervisor` found the tab freeze clears by activating Chrome natively from the shell
(`osascript -e 'tell application "Google Chrome" ... activate'`) — 44-46 fps after that — but a
throttle-only run stalls on the first block and a crude autopilot took 16 deaths in 20s. It needs
hands.
