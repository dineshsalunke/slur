# Handover — the judder fix, and the audit pass that followed it

Session of 2026-09-23 (`slur-supervisor`). Everything below is committed; the tree is clean and
`dev` is at `c3efa3a`. Nothing is in flight.

## What landed

| Commit | What |
|---|---|
| `ec5c780` | `R` unmounts the rearview pass, for a perf A/B against the FPS readout |
| `3b50857` | **The forward judder fix** — chase camera copies z exactly + `chase.test.ts` |
| `7c1dcf2` | Handover rewrite for the judder |
| `c3efa3a` | Three audit reports, 11 handovers archived, INDEX + backlog corrections |
| `4607b2b` | Chase camera on the tuning panel (8 knobs, backtick) |
| `e64943c` | **The owner's flown camera + environment defaults** |

## The judder, and why three sessions missed it

The hunt established that frame-time variance swings the ship-to-camera z gap while x shows
`0.000`, and correctly noted x is invisible because the camera copies it exactly. It then went
looking for the variance. **The variance was never the bug — variance passing through a smoothed z
was.** `chase.ts` now does `cam.position.z = p.z - followBack`, smoothing the follow *distance*
instead of the world position. Swing over 900 frames: hitch 0.446u → 0, beat 0.145u → 0, jitter
0.184u → 0. `chase.test.ts` locks all three at < 1e-9 and fails on the old line with those exact
numbers.

The lesson worth keeping: the note already contained the fact that was the answer, written down as
a clue about *where to look* rather than as the cause.

## The camera is now tunable

Eight `Chase.*` knobs under a "Chase camera" group — back, backStretch, height, lookAhead,
lookAtLift, fov, fovStretch, follow. Backtick opens the panel. `chase.ts` reads them per frame via
`num()`; the module constants are gone.

`backStretch` and `fovStretch` still ship at 0 and have never been tried. They are the speed-stretch
levers ADD §6's framing discussion is actually about. Worth a flight.

**The owner flew it and the numbers landed (`e64943c`).** back 12→14, height 5→4, lookAhead 14→17,
lookAtLift 1→3, plus four environment values (Environment.intensity 1→1.2, sky 0.4→0.6, ground
0.22→0.5, band 0.4→0.5).

**This supersedes ADD §6 and is not in the deviations report** — it was not a deviation when that
report was written. §6's first pass argued to *"pull the ship bigger + higher via the other three
levers — shorter look-ahead, tighter base FOV, closer trail, lifted aim"*. The flown result goes the
**opposite** way on trail and look-ahead and agrees only on lift. Fold that into ADD §6 when someone
next touches it: the section's reasoning is now superseded by a flown result rather than an argued
one.

The judder fix is intact — z stays an exact copy, only the follow *distance* smooths, so changing
`Chase.back` live eases in rather than snapping.

## Open, in priority order

1. **The spectator camera has the same class of bug.** `updateSpectatorCamera` lags in z — measured
   hitch 0.340u, beat 0.097u, jitter 0.157u — and nothing tests it. **Do not just repeat the chase
   fix.** It follows *remote* ships off the network interpolation buffer, so its smoothing is
   absorbing network jitter too; copying z would hand that straight to the camera. Needs an owner
   call on the trade.
2. **The three audit reports in `.claude/reports/`** — 18 findings across GDD and ADD, 3 against the
   conventions. Backlog has the worked list. Start with `GDD-DEVIATIONS.md` §1.3 (seed stability
   does not survive a roster change) and `ADD-DEVIATIONS.md` §1 (four dead paths in the routing
   table, a pure pointer fix).
3. **Frame-time variance itself** is still unmeasured on a real GPU. It now costs smoothness of the
   *world* rather than of the ship. Fly `/test-level`, read `max` against the mean, press `R` to
   drop the rearview pass, read again. **Not in headless Chrome** (SwiftShader) and **not in an
   extension-driven tab** — both misreport frame time.
4. **`createFixedStep` discards time on a severe hitch** — `if ( n === maxSteps ) acc = 0` in
   `packages/shared/src/sim/fixed-step.ts`. Any frame over 83ms drops the accumulated remainder, so
   the ship falls behind real time. A position discontinuity, not the judder. Shared code, so it
   touches the server too.
5. **TDD, AUDIO and DECISIONS are unaudited.** ADR-009 is already known to describe a block family
   that was removed from the sim.

## State of the room

- `dev` is **83 commits ahead of `origin/dev`** and nothing has been pushed. The owner's call.
- Peers `atmospherics` and `slur-7e` both confirmed clean and idle; `atmospherics` killed its
  `:5177` dev server and CDP 9341 rig.
- Four HANDOVER notes stay live in `.claude/phases/`: three on the open #170 lighting lane, and
  `HANDOVER-block-mechanics.md`, whose `insideBody` bounce and variable `BLOCK_HEIGHT` are unbuilt.
- One worktree (the main checkout). A stale `../slur-worktrees/leva-panel/` directory was removed —
  it held no git content, only an empty Vite dep cache.
