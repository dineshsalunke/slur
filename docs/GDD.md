# SLUR — Game Design Document (GDD)

> Status: **v0 draft**. Vision captured from kickoff; mechanics deliberately loose pending playtests.

## 1. Vision statement

A fast, neon, drop-in-anytime ship racer you launch on the office LAN and play in a 5-minute burst.
Fly a ship down an endless procedural track, grab power-ups, and mess with your colleagues — dodge,
boost, shoot, shield. Easy to join, hard to master, funny to lose.

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

## 4. Match structure — **OPEN, needs a decision**

The core tension: it's an *endless* runner but also *competitive PvP*. Endless + competitive need a win condition. Candidates:

| Model | Win condition | Pros | Cons |
|-------|---------------|------|------|
| **A. Last ship flying** | Survive; others die to track/combat | Clean PvP, natural tension, matches "chaotic" pillar | Eliminated players wait (mitigate: fast respawn or spectate+heckle) |
| **B. Furthest distance / score** | Highest distance when timer/first-death ends | Everyone plays till the end, endless-native | Combat feels less decisive |
| **C. Lap/checkpoint race** | First to N checkpoints | Blur-like, clear winner | Not really "endless"; needs track goals |
| **D. Rounds of A** | Best-of-N short survival rounds | Re-entry is fast, keeps everyone in | More session state |

**Recommendation:** start with **A (last ship flying) in short rounds (D)** — fast death → fast respawn into next round, no one waits long, PvP stays decisive. Revisit after first playtest.

## 5. Mechanics

### 5.1 Movement
- Auto-forward at an escalating base speed (cuberun). Player controls **lateral** movement + **vertical** (jump/hop, SkyRoads) + **boost**.
- Track is **lane-ish** but analog (smooth lateral), with gaps/ramps/walls as hazards.
- **Fuel / energy** (SkyRoads pressure): boosting and firing drain it; pickups and clean flying refill it. *OPEN: is fuel fun or fiddly on LAN? Prototype behind a flag.*

### 5.2 Track & hazards
- Procedurally generated, seeded so **all clients share the same track** (server sends seed). Deterministic generation from seed = no per-tile sync.
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

*OPEN: exact stat values (tune in playtest), whether class is locked per-round or swappable on respawn, and
whether any class gets a unique active ability vs stats-only.*

## 6. Players & session
- **Count:** 2–12 (office LAN). Design readable at 8.
- **Identity:** pick a name + ship color on join. Ephemeral, no accounts.
- **Spectate:** dead/late players spectate the pack and can heckle (emotes/chat) — keeps them engaged.

## 7. Progression / meta — **out of scope for v1**
No unlocks, no persistence. Every session is fresh. (Revisit only if it has legs.)

## 8. Controls (draft)
Keyboard-first (office laptops). Gamepad = nice-to-have later.
- Steer: A/D or ←/→ · Vertical/jump: W / Space · Boost: Shift · Use power-up: E / LMB · (Aim-back for mine: auto)
*OPEN: full mapping after movement prototype.*

## 9. Success criteria (for the side project)
- A run of 6 people in the office produces genuine laughter.
- Join-to-flying < 10 seconds.
- Nobody asks "how do I play?" after one round.

## 10. OPEN QUESTIONS (resolve with team)
1. **Match model** — commit to §4 recommendation (rounds of last-ship-flying) or pick another?
2. **Fuel/energy** — keep the SkyRoads resource pressure, or cut for simplicity?
3. **Death penalty** — respawn into same round, wait for next round, or spectate-only until round ends?
4. **Power-up carry** — hold 1, hold 2, or slot + queue?
5. **Friendly targeting** — free-for-all only, or teams mode later?
6. **Session length** — target minutes per round / per session?
