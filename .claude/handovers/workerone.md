Agent: workerone · Lane: #269 Boost pickup · Updated: 2026-09-26 (context seam at ~191k)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Ship the Boost power: +40% of class top speed for 2 s with a 0.2 s ease-out. A second use resets the timer,
and a stunned racer is refused and keeps the charge. Owner decisions: `gh issue view 269 --comments`. The
effect runs in the shared simulate(). Pickup form: marigold double chevron. Active form: twin broad thrust
streaks. Bind boost_thrust.ogg.

## Done

- ce01c2d — plumbing: HeldPower.boost=4 / shield=5, boostRatio+shieldRatio in SimConfig (both 0), generic
  bagCounts (bolt takes the rest, zero-count kinds dropped), explicit bolt branch in server firePower and
  test-level fire(). Unblocked workerthree (#270).
- 3b466ea — sim: SimShip.boostTimer (+ SIM_SHIP_KEYS, spawnShip; PlayerState field APPENDED last, plain).
  step.ts boostCap/boostThrust; applyLongitudinal(cap, push). Push = gain·maxCruise/riseS (0.4·top/0.25 s)
  unless stunned or braking. Coast drag is off while pushing. The timer keeps ticking through a stun.
  markDead/respawn clear it. combat-step startBoost(). Server + test-level call it. Constants BOOST_GAIN 0.4,
  BOOST_S 2, BOOST_EASE_S 0.2, BOOST_RISE_S 0.25, BOOST_RATIO **0** (held at 0 until the visuals land).
- (this seam) apps/client/app/game/scene/boost-look.ts — chevron shell/glyph/core geometry + streak
  plane + streak constants. Nothing mounts it yet.

## State (measured)

- Gates at 3b466ea: typecheck ✓ · lint ✓ (warnings only) · shared 400/400 · server 35/35 · client 401/401.
- Tests: packages/shared/src/sim/boost.test.ts (8 tests: every class reaches 1.4× top, no-throttle push,
  duration + ease, reset-not-add, stunned refusal, stun stops push, death clears, mid-boost copy replays
  identically). run-room.test.ts: boost timer set + no projectile + reset, stunned refused and charge kept.
- Prediction: activation stays on the usePowerUp message. boostTimer reaches the predicted ship by
  reconcile (copySimShip). The local feel lags one RTT [unmeasured]. The supervisor approved no optimistic set.
- Nothing seen in a browser yet.

## Uncommitted

None.

## Held files

Released by the supervisor for commit 2, and still mine until the visuals commit is pushed:
- new: game/scene/boost-look.ts, boost-pickups.tsx, boost-streaks.tsx, boost-streak-material.ts
- game/scene/seeker-pickups.tsx, pickup-field.tsx, routes/test-level/local-pickup-field.tsx,
  game/scene/world-scene.tsx, audio/bind-room-audio.ts, game/hud/power-gem.tsx
- BORROWED from workerthree (hand back after push): game/ecs/traits.ts, net/attach-room-to-world.ts
- packages/shared/src/combat/constants.ts: one line only, BOOST_RATIO 0 → 0.15 (plus power-bag.test.ts
  default counts → 5/6/6/3). Confirm with the supervisor first, since the shared files went back to
  workerthree at 3b466ea.

## Next

1. Tell the supervisor 3b466ea landed (done at this seam) and wait for the resume.
2. boost-streak-material.ts: additive ShaderMaterial. Plane uv.y = along (0 at the ship). Fade
   pow(1-along, falloff), soft across-width edge, hot→accent tint, uIntensity (BOOST_STREAK_INTENSITY 5).
   Include tonemapping_fragment. Never toneMapped false.
3. boost-streaks.tsx: one InstancedMesh, 2 per ship (MAX 24), useFrame at priority 0.25 like ExhaustField.
   Level = min(1, boostTimer/BOOST_EASE_S). Local reads Sim.boostTimer. Remote reads the last Interp snapshot `.boost`.
   Compose group.position/quaternion, then offset x = ±BOOST_STREAK_SPREAD·halfW, y = LIFT, z = -halfL. Scale
   (WIDTH, 1, LENGTH·level). Mount in world-scene.tsx.
4. traits.ts Snapshot.boost:number; attach-room-to-world.ts pushRemote `boost: p.boostTimer`.
5. seeker-pickups.tsx splitPickupLayout: add `boosts` and `shields` buckets. boost-pickups.tsx copies
   mine-pickups.tsx using boost-look geometry. Mount <BoostPickups layout={layout.boosts}> in pickup-field.tsx
   and local-pickup-field.tsx.
6. Audio: bind-room-audio.ts, local player: playSfx('boost') when boostTimer rises (> prev + 0.05). In
   test-level local-combat.ts fire(), playSfx('boost') on the boost branch.
7. power-gem.tsx: double chevron polygons for HeldPower.boost.
8. Flip BOOST_RATIO to 0.15 (after the supervisor confirms). Gates. Look in /test-level with a headless
   capture (DPR 1, mute, kill after). Commit, push, hand traits/attach back to workerthree.
9. `gh issue close 269 -c "<shipped + SHAs; proposed bag shares 6/4/4/3/3 or current 5/6/6/3 — owner picks>"`.
   Report the SHA and gates to slur-supervisor.

## Open questions

- Owner: final bag shares. Proposals: bolt .30/seeker .20/mine .20/boost .15/shield .15 (6/4/4/3/3), or keep
  seeker/mine at .30 and take boost from bolts (5/6/6/3).
- Owner: should a brake cancel the boost push? It does now (push = 0 while braking). The cap stays raised.

## Lessons → memory

none (nothing durable beyond the repo record this seam)
