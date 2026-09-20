# Queued brief — start the track ~8–10u behind the spawn point

**Owner's request, 2026-09-20:** *"can we start track 8-10u behind the start point."*

**Not yet briefed to a lane.** Written up because it needs a decision taken before anyone builds it.

## Why he is asking

The chase camera sits **`back: 15`, `height: 7.5`, `fov: 70`, `lookAtLift: 6`** (`CHASE`, committed).
At spawn the ship is at the track's first segment, so the camera is ~15u *behind* the track's own start
and the bottom of frame looks past it into empty space. It is visible in his screenshots as a hard black
band across the bottom with stars showing through.

## The reason that is NOT about the camera, and matters more

`DEFAULT_TUNING.respawnSetback` pushes a respawning ship **back in world-z from the last safe point** —
by design, *"re-approach the hazard, don't teleport past it."* **Die near the start and that setback has
nowhere to put you.** Either it clamps (and the stake quietly vanishes for early deaths) or it places the
ship behind the first segment, where there is no floor, and falling kills. **Verify which before building
anything** — if it is the second, this is a live gameplay bug and the lead-in is its fix, not a visual
tidy-up.

## The decision to take FIRST — two different changes wearing the same words

**Option A — a cosmetic lead-in apron.** Client-side deck geometry behind z0, drawn but absent from the
`Track` abstraction. Cheap, touches no shared code, cannot desync.
*Fails if* the player can ever reach it — then two clients disagree about whether there is floor there,
which is exactly the litmus in the load-bearing contract: *"would two clients disagreeing on this field
desync the game?"* **Check whether reverse throttle / respawn setback can put a ship at negative z.**
If either can, A is wrong and quietly introduces a desync class.

**Option B — the track genuinely starts earlier.** The generator emits segments from `z = -10`. Correct
by construction, deterministic on both ends, and it fixes the respawn case for free.
*Costs:* it is in the shared sim path, so it moves whatever is measured from the track's origin —
progress %, finish distance, `TRACK_SEGMENTS` accounting, any test with a hard-coded z. Those are
findable, not risky, but it is a real change rather than a render tweak.

**Recommendation: B**, unless the respawn check comes back clean AND reverse motion is impossible — in
which case A is the cheaper honest answer. A lead-in that the sim does not know about is a special case
waiting to be forgotten; the contract's whole point is that the sim depends on the `Track` abstraction and
never on how the track was produced, so *adding* 10u to the abstraction is the move it is designed for.

**Also settle:** is the lead-in **flat and hazard-free** (a start apron — recommended, nobody should meet a
pillar before GO), and does the **rail run along it** so the frame reads continuous? Rails are the only
thing lighting the deck, so an unrailled apron renders as a black slab and looks worse than the void it
replaced.

## Sizing is arithmetic, not a guess

8–10u is his eyeball figure. The camera is 15u back and 7.5u up with `fov 70` looking at `lookAtLift 6`.
**Compute where the bottom of frame actually intersects `y = 0` at spawn** and size the apron to cover it
with margin, rather than shipping 10u and re-checking by eye. Report the number before building.

---

## DECISION — Option B. Taken by the owner, 2026-09-20.

**The track genuinely starts ~10u before the spawn point.** Not a client-side apron. The reasoning he
accepted: the load-bearing contract exists so the sim depends on the `Track` *abstraction* and never on
how the track was produced, so *extending the abstraction* is the move it is designed for. A lead-in the
sim does not know about is a special case waiting to be forgotten by whoever next touches respawn.

Option A is closed. Do not re-propose it as an optimisation.

## What this makes buildable

**Own worktree and branch, off fresh `origin/dev`** — this is shared-sim work and must not ride the
`art/emitter-array` lane, which is a client render branch.

1. **Check the respawn case FIRST and report before building.** Does `DEFAULT_TUNING.respawnSetback`
   currently clamp near the start, or does it place a ship behind the first segment where there is no
   floor? That answer decides whether this is a bug fix or a framing fix, and it changes the PR. Do not
   assume it clamps.
2. **Size it by arithmetic, not by the owner's eyeball 10u.** Camera is `back: 15`, `height: 7.5`,
   `fov: 70`, aiming at `lookAtLift: 6`. Compute where the bottom of frame meets `y = 0` at spawn, add
   margin, and **report the number before laying geometry.** If it comes out well above 10u, say so — the
   figure came from looking, not measuring.
3. **The lead-in is flat and hazard-free.** A start apron: no pillars, no gaps, no slow blocks. Nobody
   meets geometry before GO.
4. **The rail runs along it.** Rails are the only thing lighting the deck, so an unrailled apron renders
   as a black slab and looks worse than the void it replaces. Its runs must feed the emitter array like
   any other segment.
5. **Both ends must materialize it identically.** It is in the descriptor → `resolveTrack` path, so the
   determinism rules apply as they do everywhere: integer/IEEE-754 basic ops only, no transcendentals in
   the shared path.

## What this moves — find these rather than trusting the list

Anything measured from the track's origin: progress %, finish distance, `TRACK_SEGMENTS` accounting,
respawn/last-safe-point maths, the finish gate's placement, and any test carrying a hard-coded z. **Grep
for hard-coded zeroes and segment-index-to-z conversions rather than assuming this list is complete.**
Decide explicitly — and state it in the PR — whether **z = 0 stays the spawn point** with the track
extending to negative z, or whether **everything shifts** so the track starts at 0 and spawn moves to
+10. The first keeps every existing z meaning what it meant and is almost certainly right; the second
touches less generator code but silently changes what every recorded z means. **Do not let this be
decided implicitly by whichever is easier to type.**

Full gate, and this one genuinely needs the shared tests — it is the first change in a while that touches
the sim path rather than the render path.
