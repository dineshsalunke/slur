# Handover — ship hover, and the track contract (both DONE)

Superseded the 2026-09-23 brief of the same name. All three tasks shipped on `dev`; the original
brief's open questions are answered below rather than left hanging.

## Shipped

| Commit | What |
|---|---|
| `1e198a6` | `feat(game): float the ship, higher the faster it goes` |
| `a27955f` | `feat(track): generate from a contract, never from the ship roster` (ADR-013) |
| `b998e6c` | `feat(ships): double the Freighter's top speed to 124u/s` |

Gate green throughout: `pnpm typecheck` clean, 324 tests pass (shared 143 · client 177 · server 4),
`pnpm lint` at its pre-existing 8 warnings.

## 1 — Hover (visual only)

`apps/client/app/game/ecs/hover.ts`. `hoverSystem( world, dt )` adds a cosmetic lift to the render
`Group` **after** `syncRenderSystem` and `remoteInterpSystem` have written positions, so it covers
local and remote ships in one pass. `Sim.y` and `simulate()` untouched — GDD §5.5 locks model-as-hitbox.

    lift = Hover.base + Hover.speedLift * clamp01( vz / maxCruise )   eased at Hover.follow
    + sin( phase ) * Hover.bob                                        phase seeded per entity

Answers to the original brief's open questions: **always on**, not grounded-only (a constant offset
just raises the jump arc; fading it at takeoff pops). **Eased**, not instant. **Tunable** — `Hover.*`
on the panel next to `Chase.*`: base 0.35, speedLift 0.9, follow 4, bob 0.06, bobRate 0.8.

Remote ships have no `vz` on the wire; speed comes from `dz/dt` over the last two interpolation
snapshots, no schema change.

Also fixed in passing (the brief flagged it): `syncRenderSystem` banked every ship by
`DEFAULT_TUNING.strafeClamp` instead of its own class. Now `tuningForShip( net.shipId )`.

**Not yet seen in a browser.** The Chrome extension was not connected this session and a dev stack
already held `:5173`/`:2567`. Next session should look at `/test-level` and tune the five knobs.

## 2 — The track contract (ADR-013)

The generator no longer reads ship stats at all. `TRACK_CONTRACT` in `constants.ts`:
`pacingCruise 55`, and a reference weaver `62 / 65 / 118`. `weave.ts` no longer imports the roster;
`corridor.ts` and `intensity.ts` no longer read `DEFAULT_TUNING.maxCruise` (which **is** the Fighter's
tuning object — a second instance of the same bug, not in the original brief).

The owner's reason, which is stronger than the determinism one: *"if the tracks are shaped by ship
stats then what is the use of asking the user to think about his ship choice"*. A `min` over the
roster draws every course around the least capable ship.

**Conformance is a floor, not a match.** `weaveThreadSpeed( t ) = min( strafeClamp / WEAVE_SLOPE_CAP,
sqrt( strafeAccel · CELL / WEAVE_CURVATURE_CAP ) )` — the fastest speed a class can follow the racing
line, independent of its own `maxCruise`. A class need only clear `pacingCruise × 0.5 = 27.5u/s`; one
that is faster than that simply brakes for the weave. `rosterContractFailures()` throws at module load
of `ship-classes.ts`; exercised against a 5u-wide class and a strafe-12 class, both produce the
expected message.

**The contract numbers are frozen, not chosen** — bit-identical (`Object.is`) to what the roster
formulas produced, so no existing seed moved. `sim/track-contract.test.ts` pins both caps, `FZ_ROWS`,
`WEAVE_PERIOD_ROWS` and an FNV-1a digest of the racing line over 4000 rows for seeds 1 / 20260921 /
0xdeadbeef. **If that test fires, someone reshaped every track in the game** — re-pin only on purpose.

## 3 — Freighter at 124u/s

One line, and it moved zero blocks — the contract working as intended.

    weaveThreadSpeed   69.3u/s (unchanged)    scrub into a weave   44%
    0 -> top speed     4.1s                   brake 124 -> 69      0.50s
    hazard warning at full throttle  0.48s    (Fighter: 1.09s)

Straight-line ship that must read the track ahead. **Watch in playtest:** 0.48s of warning against
0.50s of braking means at full throttle in a dense section it arrives with no margin. If that plays
as too punishing the lever is `brakeDecel` (110 today, shared with `DEFAULT_TUNING` — the Freighter
would need its own value).

## Open / next

- **Look at the hover in a browser** and tune `Hover.*`. Nothing else is unverified.
- **GDD-DEVIATIONS §1.1 is deliberately untouched**: documented `MIN_CLEAR 7u` vs the shipped
  `MIN_LANE = 2·CELL = 8u`. Correcting it reshapes every seed, so it needs its own owner decision.
  §1.2 and §1.3 are marked RESOLVED.
- **GDD §5.5's class table has stale strafe numbers** against the code (doc says Freighter 105,
  Interceptor 195; code says 118 and 210). Only the Freighter's top-speed cell was corrected here.
- **Boost still does not exist.** `HeldPower = { none, bolt }`; GDD §5.3 lists Boost as an S5
  fast-follow. `maxCruise` is currently the only speed ceiling in the game.

## State

`dev` at `b998e6c`, tree clean, 92 commits ahead of `origin/dev` and unpushed. Nothing in flight.
