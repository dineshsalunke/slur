# SLUR — Game Design Document (GDD)

> Status: **v0 draft**. Vision captured from kickoff; mechanics deliberately loose pending playtests.

## 1. Vision statement

A fast, neon, drop-in-anytime ship racer you launch on the office LAN and play in a 5-minute burst.
Fly a ship down a track — a finite course to a **finish line**, or an **endless survival run** — grab
power-ups, and **mess with your friends**: dodge, boost, shoot, shield. Easy to join, hard to master, funny to lose.

> **North star:** this is a **casual party game between colleagues**. The point is *messing with each other*,
> not competitive balance. When a design call is close, bias toward **fun chaos over fairness**.

**Pillars** (every feature must serve at least one):
1. **Instant** — from "host launches" to "I'm flying" in seconds. Zero setup, zero accounts.
2. **Social & chaotic** — the fun is the other humans. Combat and sabotage over pure skill.
3. **Readable speed** — fast, but the neon aesthetic keeps hazards and threats legible.

## 2. References & what we take from each

| Game | We take | We leave |
|------|---------|----------|
| **cuberun** | Endless neon tunnel, escalating speed, dodge-survival feel, R3F rendering approach | Single-player, no combat |
| **SkyRoads (1993)** | Track-as-hazard (gaps, jumps, tiles), fuel/resource pressure, discrete track lanes | Puzzle-y precision, slow pace |
| **Blur (2010)** | Pickup-based combat mid-race, offensive/defensive/utility power trinity, rubber-banding tension | Realistic cars, licensed tracks |

## 3. Core loop

```
Host launches game ──► Host starts a RUN ──► Players join the LIVE run, spawn beside the pack
        │                                              │
        └──────────────◄── run ends ◄──── fly · dodge track · grab pickups · fight ──┘
                              │
                      results / restart
```

- **Host-authoritative session, server-authoritative sim.** Host clicks "Start Run"; others join in progress.
- **Join mid-run:** new player spawns adjacent to the current pack (not at the origin) and is immediately alive.
- **No lobby gate:** you can be watching and then jump in without stopping anyone.

## 4. Game modes

Two modes share the same flight + combat + power-up core. Given the north star, win conditions exist to give
a round *shape*, not to be fair — pickups and combat are **sabotage tools** to mess with each other.

**A. Race (finite track) — recommended for v1.** A course with a start and a **finish line**; first across
wins. Natural round end, obvious goal, trivially re-runnable, clear winner, no "endless balancing" to solve.
(Blur.) *Optional round timer as a backstop.*

**B. Survival (endless) — fast-follow.** Procedural endless track; a **chasing derezz-wall** sweeps forward
behind the pack (camp = caught) with **distance/time as score**. Furthest/last-flying wins. (cuberun + our
chase mechanic.) This is the home of the §5.1 forward-pressure mechanism.

**Forward pressure (resolved):** Race self-pressures via the finish line (+ optional timer). Survival uses the
**chase-wall + distance/time** combo (your "1 & 3"). Both deliberately **light-touch** — casual, not punishing.

**v1 scope:** build **Race** first — it's the shortest path to a complete, fun, self-contained session;
Survival reuses the same systems. *Confirm this ordering (see §10).*

**Re-entry:** rounds are short; death → quick respawn (Race) or spectate-until-next (either). No one sits out long.

## 5. Mechanics

### 5.1 Movement — **constrained flight, player-controlled speed** (decided)
- **Model: constrained**, not free 6DOF. Lateral is **strafe, never turning**; pitch/yaw/roll are **cosmetic banking**, never control axes. Chosen for readability, low motion-sickness, party accessibility, and simpler deterministic netcode. (Closer to SkyRoads than cuberun.)
- **Player-controlled speed** (changed from auto-forward): **throttle** to accelerate up to a cruise max, **brake** to decelerate (no reverse). Speed control adds depth — brake to thread a hazard, feather speed in a dogfight, dive a straight.
- **Lateral: smooth analog strafe** with a generous clamp (flying feel). *Fallback:* discrete 3–5 lanes if playtest shows analog is too twitchy on keyboard.
- **Jump: controlled & expressive** — tap = small hop, **hold = higher jump** (variable height), plus a **double jump**. For crossing gaps, clearing obstacles, and air-dodges (SkyRoads).
- **Boost:** momentary overdrive *above* cruise max; drains energy, cooldown. Distinct from normal throttle — no permaboost.
- **Fuel / energy** (SkyRoads pressure): boosting and firing drain it; pickups and clean flying refill it. *OPEN: full fuel-pressure system, or energy only gates boost/fire? Prototype behind a flag.*

> **Forward-pressure (resolved, see §4):** Race mode self-pressures via the finish line (+ optional timer).
> Survival mode uses a **chasing derezz-wall + distance/time scoring** — camp and the wall catches you.
> Both light-touch, in keeping with the casual north star.

### 5.2 Track & hazards
- Procedurally generated, seeded so **all clients share the same track** (server sends seed). Deterministic generation from seed = no per-tile sync.
- **Two track forms:** *finite* seeded **courses with a finish line** (Race), and *endless* procedural runs (Survival). Both deterministic from seed; a finite course is just an endless generator with a defined length + finish gate.
- Hazard vocabulary: gaps (fall = death/respawn), walls (dodge), narrowings, ramps/jumps, moving obstacles, speed gates.
- Difficulty ramps with distance (speed ↑, hazard density ↑).

### 5.3 Power-ups (Blur trinity) — starter set
Pickups float on the track; drive through to collect. Hold 1 (maybe 2) at a time.

| Type | Example | Effect |
|------|---------|--------|
| Offensive | **Bolt** | Fire forward; hit ship = stun/knock/brief loss of control |
| Offensive | **Mine** | Drop behind; trailing ship that hits it is disrupted |
| Defensive | **Shield** | Absorb one hit for a few seconds |
| Utility | **Boost** | Burst of speed |
| Utility | **Warp/Blink** | Short teleport/dodge (also SkyRoads-y gap crosser) |
| Chaos | **Scramble** | Invert/blur a nearby rival's controls or view briefly |

*OPEN: exact roster, cooldowns, whether powers stack, friendly-fire rules.*

### 5.4 Combat & interactions
- **Server-authoritative hit detection** (never trust client for hits — see TDD / `conventions/netcode.md`).
- Getting hit = disruption (stun, spin, brief control loss), rarely instant death — deaths should mostly come from the *track* while disrupted. Keeps it funny, not punishing.

### 5.5 Ship classes (asymmetric)
You pick a class at join. Classes trade along a **stat triangle** so none dominates. Properties are pure data
(`ShipClass` config in `@slur/shared`, server-authoritative — see TDD) so balancing is a config edit.

**Tunable properties:** `topSpeed`, `acceleration`, `handling` (lateral agility), `armour` (hits-to-disrupt),
`boost` (reserve/fuel), `hitbox` (size), `powerAffinity` (slots / cooldown / potency).

| Class | Speed | Handling | Armour | Hitbox | Signature |
|-------|:-----:|:--------:|:------:|:------:|-----------|
| **Fighter** | ●●●○ | ●●●● | ●○○○ | small | The agile all-rounder / default. Dogfighter. |
| **Freighter** | ●○○○ | ●○○○ | ●●●● | **large** | Tank. Big boost reserve. Large hitbox = track hazards are deadlier — armour isn't free. |
| **Interceptor** | ●●●● | ●●○○ | ●○○○ | small | Straight-line speed demon; twitchy to steer, paper armour. |
| **Gunship** | ●●○○ | ●●○○ | ●●●○ | medium | Combat specialist — power-ups hit harder / extra offensive slot. |
| **Scout** | ●●●○ | ●●●○ | ●●○○ | small | Utility — extra power-up slot or faster pickup cooldown. Jack-of-trades. |

**Design rule (the tension):** in a dodge-runner the *track* does most of the killing, so armour only earns
its cost if combat is punishing **and** armour carries a downside. Levers that keep it honest: (a) hitbox size
scales with armour (tanks can't thread gaps), (b) armour resists *combat* disruption but **not** falling in a
gap, (c) speed/handling classes dodge the track that kills the tanks. Roster is extensible — add classes only
when they occupy a genuinely new corner of the triangle, not just re-skins.

**v1 scope: ship 3 classes** — **Fighter** (balanced/agile), **Freighter** (tank, large hitbox), **Interceptor**
(pure speed, fragile). This trio spans the speed↔armour axis with maximum felt difference for minimum balancing.
**Gunship** and **Scout** are a later wave.

*OPEN: exact stat values (tune in playtest), whether class is locked per-round or swappable on respawn, and
whether any class gets a unique active ability vs stats-only.*

## 6. Players & session
- **Count:** 2–12 (office LAN). Design readable at 8.
- **Identity:** pick a name + ship color on join. Ephemeral, no accounts.
- **Spectate:** dead/late players spectate the pack and can heckle (emotes/chat) — keeps them engaged.

## 7. Progression / meta — **out of scope for v1**
No unlocks, no persistence. Every session is fresh. (Revisit only if it has legs.)

## 8. Controls (constrained model)
Keyboard-first (office laptops). Gamepad = nice-to-have later. No pause (live multiplayer).

| Action | Key | Notes |
|--------|-----|-------|
| Throttle / accelerate | W or ↑ | Hold to speed up toward cruise max |
| Brake / slow | S or ↓ | Hold to decelerate (no reverse) |
| Strafe left/right | A / D or ← / → | Lateral, **not turning**; smooth analog (lanes fallback) |
| Jump | Space | Tap = small hop · hold = higher · double-tap = double jump |
| Boost | Shift (hold) | Overdrive above cruise max; drains energy; cooldown |
| Use power-up | E or LMB | Uses held power-up |
| Mute | M | Someone always needs to mute fast |
| Leave run | Esc | No pause; leaving drops you to spectate/menu |

- **Aiming:** offensive power-ups (Bolt) **auto-lock the nearest target in a forward cone** — combat is disruption, not precision, so no aim skill-wall. Mines drop behind automatically.
- Chords needed simultaneously (strafe + boost + hop + fire) use common non-ghosting keys; verify on real laptops.

*OPEN: rebind support, gamepad mapping — after movement prototype.*

## 9. Success criteria (for the side project)
- A run of 6 people in the office produces genuine laughter.
- Join-to-flying < 10 seconds.
- Nobody asks "how do I play?" after one round.

## 10. OPEN QUESTIONS (resolve with team)
1. **v1 mode** — §4 lands two modes (Race / Survival). Confirm **Race-to-finish first** for v1, or start with Survival?
2. **Fuel/energy** — keep the SkyRoads resource pressure, or cut for simplicity?
3. **Death penalty** — respawn into same round, wait for next round, or spectate-only until round ends?
4. **Power-up carry** — hold 1, hold 2, or slot + queue?
5. **Friendly targeting** — free-for-all only, or teams mode later?
6. **Session length** — target minutes per round / per session?
