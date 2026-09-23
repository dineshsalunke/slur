# Handover — ship hover, and the Freighter speed change that is not a one-line edit

Owner asked for two things on 2026-09-23. **Neither is started** — the session ran out of context
before implementation. This note is the brief, including one finding that changes how the second
task must be approached.

## Task 1 — the ship should hover, proportionally to speed

Owner's words: *"the ship should hover in the air a bit and it will be cool if it hover
proportional to the speed in some way."*

**The hard constraint: this must be visual-only.** GDD §5.5 locks model-as-hitbox — *"Each class is
one of our five CC0 models, **uniform-scaled** so its visible box IS its AABB collision footprint —
you die exactly when the ship touches."* A hover that moves the simulated `y` changes ground
contact, the grounded rule, jump takeoff and gap death. **Do not touch `Sim.y` or `simulate()`.**

The place to do it is `syncRenderSystem` in `apps/client/app/game/ecs/systems.ts:18-23`, which
already writes the interpolated render transform and is where the cosmetic bank lives:

    grp.position.set( lerp( prev.x, s.x, alpha ), lerp( prev.y, s.y, alpha ), lerp( prev.z, s.z, alpha ) );
    grp.rotation.z = -( s.vx / DEFAULT_TUNING.strafeClamp ) * 0.5;

Add a cosmetic y-offset there, driven by `s.vz / maxCruise` the same way the bank is driven by
`s.vx / strafeClamp`. Note that line uses `DEFAULT_TUNING` rather than the entity's own class — a
pre-existing bug worth fixing in passing (use `tuningForShip( net.shipId )`, as `chase.ts` does).

Open design questions for the owner, none answered yet:
- Hover only when grounded, or always? A hover that persists mid-jump will read oddly against the
  jump arc.
- Does it ease in, or track speed instantly? Instant will jitter with `vz`; a smoothed follow is
  probably wanted, and the chase-camera fix (`3b50857`) is the cautionary tale about *where* you
  put the smoothing.
- Should it be a tunable? Every other feel knob now is — add `Hover.*` to
  `apps/client/app/dev/tuning-schema.ts` and a panel group, matching `Chase.*` (`4607b2b`).

## Task 2 — "Freighter max speed should be doubled" ⚠ NOT a data edit

Owner's words: *"freighter max speed should be doubled."* The value is
`packages/shared/src/ship-classes.ts:84`, `maxCruise: 62`. Doubling it to 124 is one character.

**It would silently change the geometry of every existing track seed.** `packages/shared/src/sim/weave.ts:15-16`:

    export const SLOPE_CAP = deriveWeaveSlopeCap( ALL_CLASS_TUNINGS );
    export const CURV_CAP = deriveWeaveCurvatureCap( ALL_CLASS_TUNINGS, CELL );

Both caps are a **min over the live roster**, and both are functions of `maxCruise` —
`constants.ts:114` takes `min( strafeClamp / maxCruise )`, and the curvature cap divides by
`maxCruise²`. Raising the Freighter's number *lowers* both caps, which slackens the weave corridor,
which changes what every seed generates. `FZ_ROWS` and `WEAVE_PERIOD_ROWS` derive from those caps in
turn.

**This is exactly the finding in `.claude/reports/GDD-DEVIATIONS.md` §1.3**, and this task is the
first time it costs something real. GDD §0 promises the opposite:

> *"a track seed must generate the **same geometry forever**. If clearance tracked the live roster,
> adding/resizing a ship would silently mutate every existing seed's track."*

So the owner needs a decision **before** the edit lands:
1. **Accept it** — seeds are roster-versioned, and `/test-level`'s fixed seed 20260921 renders a
   different track after this change. Then GDD §0's rationale must be rewritten to stop promising
   permanence.
2. **Build the fixed ceiling §0 describes** — derive the caps from a contractual constant rather
   than the roster, so ship balancing stops reshaping tracks. This is the documented design, just
   never built.
3. **Check first, then decide** — measure whether doubling actually moves `SLOPE_CAP`/`CURV_CAP`
   enough to change output. Cheap: compute both caps before and after in a node harness and diff a
   seed's segments. Do this first regardless; it sizes the problem.

Second, smaller concern: GDD §5.5 lists the Freighter as *"long cruiser — worst weaver (sluggish
handling), gap-tank"* at 62, below only the Comet's 70. At 124 it becomes by far the fastest ship in
the game while keeping the tankiest armour (0.4) and the best gap reach — that is not a sidegrade,
and §5.5's *"Class differences are margin & style, never pass/fail"* stops holding. Worth confirming
the owner wants a dominant class rather than, say, a Freighter that accelerates poorly to a high
cap.

## State

`dev` at `70fafc7`, tree clean, 89 commits ahead of `origin/dev` and unpushed. Nothing in flight.
