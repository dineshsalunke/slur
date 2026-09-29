---
name: sim-pilot-footguns
description: "Seven ways a scripted sim pilot lies about the track: PD overshoot or a single tried exit fakes a trap, a centred post makes it dither, a per-slice reachability check misses a fast sidestep, a weave pilot must steer from the run-up not the face, a proportional strafe overshoots the strafe kick, a score pilot must not lead the note, and reaction delay belongs on perception, not the control loop"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8440309d-cf86-4842-a08b-26f7235f48f1
  modified: 2026-09-29T04:05:52.226Z
---

### Escape-sweep pilot must stop

A `simulate()` pocket-escape sweep reads "trapped" for the wrong reason in two ways:

1. **PD pilot overshoot.** `strafe = err*2 - vx*0.1` reaches 55u/s on a 12u strafe, flies past x 32 off the
   deck, dies and respawns. Every long strafe fails, so even the comet reads trapped. Use a stoppable profile:
   `want = sign(err)·min(strafeClamp, √(strafeAccel·|err|))`, `strafe = clamp((want − vx)/(strafeAccel·dt·3))`.
   With it, stop windows match the geometry `gap − 2·halfL` to 0.1u (seed 20260921, z 1216–1240, 2026-09-24).
2. **One exit only.** The first fixture sweep tried only the left exit and called the phantom trapped. A right
   exit gave it a 2.3u window. Find every door from the grid, then sweep each one.

Also: count only stops after the ship has committed. A slot margin starts the pocket early, and turn-outs
before the entrance are not escapes.

**Why:** both errors report a trap that does not exist, and a fixture then encodes the error.
**How to apply:** any sim sweep that decides whether a ship can escape. See `pockets.ts`
`squeezesThrough`. Related: [[pacing-grid-ignores-ship-length]], [[a-sweep-that-hits-its-bound-fakes-a-reading]].

### Avoid pilot dithers at a centred post

A late-reacting avoid pilot (12-tick delay) that sits dead centre behind a post sees two escapes at the same
cost. Its choice flips every replan, so it strafes back and forth, brakes and stops. The result reads as
`finished: false, deaths: 0, bumps: 0` with the tick budget used up. Phrase seed 17 (Fighter) did this at a
12u post on a 96u deck; the RFC's "groove seed 5 lone post" miss is the same shape **[inferred]**.

**Why:** a no-finish with 0 deaths and 0 bumps looks like a trap. It is a pilot fault, and "fixing" the
generator for it would bend geometry around a test artefact.

**How to apply:** the shared pilot `sim/avoid-pilot.test.ts` now adds `COMMIT × |x − lastChoice|` to its cost
(since `8a4f1dd`). Before calling a stall a trap, trace x, target and brake per tick near the stop. A target that
alternates between two values means the pilot is dithering.

### Avoid pilot sidestep needs a dense check

The avoid pilot (`packages/shared/src/sim/avoid-pilot.test.ts`) checks a candidate x once per 2u slice. After a
bump, vz ≈ 0, so the whole sidestep falls inside one slice and only the endpoint is tested. The pilot then
strafed from standstill across a weave hole divider (death, seed 1) or pushed into a divider wall forever
(880 bumps, seed 17). Fix (4ca02e7): `sidestep()` samples the lateral path every 0.5u against
`openRunsAtSlice` + `floorAt`, and the fallback prefers a sidestep-safe candidate over `ranked[0]`.

**Why:** any new divider/post geometry (portal fork, parallel weave) triggers it; unit tests of the generator miss it.
**How to apply:** when the avoid pilot wedges or dies next to a divider, trace x/z/vz/target per tick before touching
the track — see [[measure-a-homing-rule-on-procgen]].

### Weave pilot must use the run-up

Since #327 (`7d52b75`) a weave has no funnel. Its lane walls start as one flat face at `z0`. The fair
entry is the open run-up before the face, `weaveRunUp(spec)` (from `simulate()`, edge of deck to the
nearest lane centre, max over classes).

A test pilot that starts steering to a lane only when its nose reaches `z0` hits the face or the
parallel divider: 3 bumps on phrase seeds 1–30 before the fix. `weaveTarget` in `weave.test.ts` now
returns the nearest lane centre from `z0 − weaveRunUp` on. Use it, or do the same, in any new weave pilot.

**Why:** the old funnel steered the ship into the lane for it, so an entry at the face was enough. A flat
face does not.

**How to apply:** when you count weave bumps, check the pilot steers during the run-up before you
blame the geometry. See [[obstacle-spacing-from-ship-physics]], [[measure-a-homing-rule-on-procgen]].

### Fractional-strafe pilots trip strafe kick

The strafe kick (#256, `0c904de`) is in `applyStrafe` in `step.ts`. When `strafeKick > 0`, any nonzero strafe
sets `vx` to at least `strafeKick × strafe` in the press direction (26–40 u/s per class). A pilot that sends
small fractional strafes every tick (`strafe = clamp((want − vx)/(strafeAccel·dt·3))`) then overshoots and
oscillates. Before the fix, pocket escape sweeps read window 0, and groove seed 13 wedged the freighter at
z 280 with 314 bumps.

The fix is `strafeToward` in `packages/shared/src/pacing/pockets.ts` (exported). It scales `s` to `goal/kick`
when the kick would pass the pilot's own ramp goal, and it releases (`s = 0`) when the goal is still on the
old side of zero. `groove.test.ts` imports it.

**Why:** a new pilot copied from the old profile reads "trapped" or "wedged" for a pilot reason, not a
track reason.

**How to apply:** a new sim pilot imports `strafeToward` from `pacing/pockets.ts`. Do not write a new
proportional profile. Keep `strafeKick` gated on `> 0`: the ungated form snapped `vx` to −0 on a reverse
press, and that moved the contract ship's `NOTE_MOVE_S`. Related: [[shared-tree-footguns]].

### Score pilot must not lead the note

On an emitted score track (`sim/score/emit.ts`), the last `SCORE_PIN_Z` (4u) of a calm before a lateral note is
a **preview** span. Its near side sits `SCORE_PIN_HALF` from the old line. A pilot that looks ahead and starts
the strafe early clips that pin. Measured 2026-09-24 (#253 song lab): a 0.15 s look-ahead gave the freighter
73 bumps on one track. Zero look-ahead (target = the line of the span under the ship's centre) gave 0 bumps
for all 5 classes on 10 tracks.

**Why:** the pin is by design. It holds the ship on its line until the onset, so the move reads as a note.

**How to apply:** any bot, pilot or test that flies a score track steers to `span.line` at `ship.z`, with no
lead. For jumps, pick the takeoff by forward simulation (`apps/client/song-lab/pilot.ts`), not by a fixed
lead. Related: [[song-tracks]].

### Delay the perception, not the loop

To make a scripted pilot human-like, delay its **perception of the course** (steer to the line at the
z it held N ticks ago), never the whole input stream. A bang-bang strafe with an N-tick loop delay
limit-cycles: on #253, a 9-tick input delay gave even "pro" hundreds of bumps per run. Also hold aim
noise for ~15 ticks (per-tick noise made 10k RLE entries per run, 26 MB bundle) and clamp the aimed
target inside the open span, or the ship pins on a wall (d29 b695).

**Why:** f98f9e5 took three measured tries on Believer to get a graded pro/club/rookie signal.
**How to apply:** any bot that stands in for a player (song lab, balance sims).
