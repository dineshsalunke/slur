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
- **Boost is NOT a base mechanic** *(decided — was a Shift-held overdrive)*. It moves to a **pickup power-up** (§5.3) — grab it, spend it. This keeps the base flight model clean and makes overdrive a *contested resource* you fight over, per the north star.
- **No fuel/energy meter** *(resolved — §10 Q2 closed)*. The energy pool existed only to gate boost; with boost gone it's cut. Pickups carry their own charge/duration.

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

### 5.5 Ship classes (asymmetric) — **LOCKED 5-class matrix (2026-08-09)**
You pick a class at join. Five classes trade along multiple axes so none dominates; properties are pure data
(`FlightTuning` per class in `@slur/shared`, server-authoritative) so balancing is a config edit.

> **How per-ship flight works (architecture — already in place):** `simulate()` takes a `FlightTuning` struct
> as an argument, not a global. Today all ships pass `DEFAULT_TUNING` (the **Fighter/baseline** preset in
> `@slur/shared/constants.ts`); a class simply supplies its own `FlightTuning` — including its own `JumpDesign`
> (→ `deriveJump`) and its `halfW`/`halfL` size. **Per-ship flight is a data swap, not a code change** — the
> "ship stats are data, server-authoritative" non-negotiable.

**The world is a 4u cell grid (LOCKED 2026-08-09).** Track = **16 lanes** wide (64u, `HALF_WIDTH 32`); a segment
is **5 z-cells** deep (`SEG_LEN 20`); an obstacle cube is **1×1 cell** (4u) and **2 cells (8u) tall** —
**un-jumpable** (strafe around or destroy, never hop). The ship is a **~1-cell craft**. Authoring snaps to the
grid; **movement stays continuous** (no lane-snapping) — the cuberun contract. **Jump is only for gaps; blocks
are only strafe-or-destroy** — the two mechanics never overlap.

**Model = hitbox (WYSIWYG, LOCKED).** Each class is one of our five CC0 models, **uniform-scaled** so its visible
box IS its AABB collision footprint — you die exactly when the ship touches. Height is cosmetic (bodies are solid
ground-up; Y doesn't change kill logic), so all visual flair lives in the vertical/overhang budget and cannot
affect fairness. Footprints are **derived from the measured model proportions**, not hand-set:

| Class | Model | Footprint W × L (cells) | W × L (u) | Weave | Gap | Fantasy |
|---|---|:--:|:--:|:--:|:--:|---|
| **Interceptor** | executioner | 0.50 × 0.46 | 2.0 × 1.8 | ●●●●● | ●●○○ | flat sleek scalpel — best weaver, twitchy at gaps |
| **Fighter** (baseline) | challenger | 0.65 × 0.63 | 2.6 × 2.5 | ●●●○ | ●●●○ | square all-rounder / default |
| **Comet** | bob | 0.55 × 0.29 | 2.2 × 1.2 | ●●●○ | ●●○○ | tiny wide-wing glass rocket — fastest, weak jump |
| **Phantom** | dispatcher | 0.60 × 1.26 | 2.4 × 5.0 | ●●○○ | ●●●●● | long courier — triple-jump air/gap master |
| **Freighter** | imperial | 0.62 × 1.5 | 2.5 × 6.0 | ●○○○ | ●●●● | long cruiser — worst weaver (sluggish handling), gap-tank |

**A "class" is a group; a "ship" is a variant inside it (architecture for growth).** A **ShipClass** owns all
*mechanics* (the `FlightTuning` incl. footprint) — the balance unit, few and carefully tuned. A **Ship** is a
*cosmetic* variant within one class (its own model + name), inheriting the class's mechanics wholesale — ships
in a class are mechanically **identical**, so the class stays the honest balance unit. Today each class has
exactly **one** ship (the model above); `@slur/shared/ship-classes.ts` supports **many** later — adding a ship
is a model + a `classId` (balance for free), adding a class is a new archetype. The networked field is the
**`shipId`** (set once at join/hot-swap); the sim resolves `shipId → class → tuning` identically on client and
server (the netcode "one shared `simulate()`" requirement). Model/scale live client-side under the same id.

**Flight stats (S6 target — Fighter/`DEFAULT_TUNING` is wired today; the rest are the balancing spec):**

| Class | Top speed | Pickup (accel) | Strafe pwr / cap | Grip (damp) | Jump h / air |
|---|:--:|:--:|:--:|:--:|:--:|
| Interceptor | 48 | 45 | 195 / 95 | 12 (snap) | 3.0 / 2 |
| **Fighter** | 55 | 40 | 150 / 80 | 8 (neutral) | 3.2 / 2 |
| Comet | **70** | 52 | 165 / 85 | 4 (drifty) | 2.8 / 2 |
| Phantom | 50 | 38 | 135 / 75 | 8 (neutral) | 4.2 / **3** |
| Freighter | 62 | 30 | 105 / 65 | 5 (drifty) | 3.6 / 2 |

**Two governing constraints (why the matrix stays fair):**
1. **Widest class ≤ 1 cell** (widest is now Fighter 0.65c) and the generator **guarantees ≥ 2 contiguous open
   lanes (8u)** at every z-slice → every ship threads with margin, and any future class ≤ 1.5c still fits.
   (Replaces the old `MIN_CORRIDOR 6`.) NB: the Freighter's *weave* penalty comes from its sluggish strafe, not
   a wide hitbox — so its footprint can stay moderate while it remains the longest (gap-tank).
2. **One shared server-authoritative track for all players (drop-in)**, so it is generated to the **least-capable
   class per hazard**: gaps sized for the worst gap-clearer (short Interceptor/Comet — offset by their speed),
   corridors for the widest (Freighter). **Class differences are margin & style, never pass/fail** — this caps
   how far jump may vary (no sub-3.0 jumper), so a Freighter on a gap-heavy seed is never simply dead.

**Emergent identity (not hand-tuned):** gap skill falls out of **length** (generous grounded rule — a longer ship
takes off later and lands earlier, so it clears gaps more forgivingly), weave skill out of **width**. The short
models (Comet, Interceptor) are naturally twitchy at gaps; the long ones (Phantom, Freighter) tank them — the
models were assigned to *match* the intended identity, so the geometry does the balancing.

**Armour / combat (S5+):** `armour` (hits-to-disrupt) and `powerAffinity` (pickup slots / potency) stay per-class
data. A large hitbox makes track hazards deadlier, so "armour isn't free"; armour resists *combat* disruption but
**never** a fall into a gap. Combat-specialist niches (the old Gunship/Scout ideas) fold into the S5 pickup/combat
layer rather than adding models now.

*OPEN: exact flight values (tune in playtest); class locked-per-round vs swappable on respawn; whether any class
gets a unique active ability vs stats-only. **Freighter length 2.16c is the extreme** — may cap ~1.5c (minor tail
overhang) if it plays unwieldy.*

### 5.6 As-built status (ingredient snapshot)

Where each mechanic actually stands in code. Exact tuned values live in `@slur/shared/constants.ts`
(source of truth) — this table is the *design-level* checklist, not the numbers.

| Ingredient | Status | Notes |
|---|---|---|
| Throttle · brake · coast · cruise cap | **LIVE** | player-controlled speed (§5.1) |
| Strafe (analog, drifty→snappy) + corridor walls | **LIVE** | walls stop+slide, non-lethal |
| Jump — variable (tap/hold) + double + coyote/buffer | **LIVE** | derived from a jump-feel spec (GDC "Building a Better Jump") |
| Track — deterministic-from-seed, 5 archetypes | **LIVE** | plain / block / platform / gap / finish |
| Hazards + collision (swept land + swept body-kill) | **LIVE** | gap=fall, block=dodge/jump, platform=land-or-crash; **center-point today → AABB next** |
| Death → shard-burst VFX → respawn (position-scoped grace) | **LIVE** | 1s derezz, setback + re-approach |
| Netcode — authoritative, predict+reconcile, interp, drop-in | **LIVE** | inputs-not-positions, 60Hz sim / 20Hz patch |
| **Boost** | **PLANNED (S5)** | *removed from base flight → pickup power-up* |
| Power-ups + combat (Bolt/Mine/Shield/Boost/…) | **PLANNED (S5)** | `E` reserved; server-authoritative hits |
| Ship classes (per-class `FlightTuning` + hitbox/armour) | **PLANNED (S6)** | architecture ready — data swap, see §5.5 |
| Session flow (lobby→race→results, standings, restart) | **PLANNED (S4)** | one seeded track runs today |
| Survival mode (endless + chase-wall) | **PLANNED (S7)** | Race is the v1 mode |

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
| Use power-up | E or LMB | Uses held power-up (incl. **Boost**, now a pickup — Shift is unbound) |
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
2. ~~**Fuel/energy** — keep the SkyRoads resource pressure, or cut for simplicity?~~ **RESOLVED: cut.** Energy only gated boost; boost is now a pickup (§5.1, §5.3), so the meter is gone. Pickups carry their own charge.
3. **Death penalty** — respawn into same round, wait for next round, or spectate-only until round ends?
4. **Power-up carry** — hold 1, hold 2, or slot + queue?
5. **Friendly targeting** — free-for-all only, or teams mode later?
6. **Session length** — target minutes per round / per session?
