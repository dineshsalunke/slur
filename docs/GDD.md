# SLUR — Game Design Document (GDD)

> Status: **v0 draft**. Vision captured from kickoff; mechanics deliberately loose pending playtests.

## 1. Vision statement

A fast, neon, quick-to-join ship racer you launch on the office LAN and play in a 5-minute burst.
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
Host a room ──► players join & pick ship/colour ──► host hits GO ──► 3·2·1 ──► RACE
     ▲                                                                            │
     └──── back to lobby ◄── host "Play Again" ◄── RESULTS ◄── finish / grace ◄────┘
   (join a room anytime; if a race is already live you SPECTATE until it ends, then race the next round)
```

- **Host-authoritative session, server-authoritative sim.** The host owns GO / Play-Again; the server owns positions, hits, standings, and the phase machine (lobby → countdown → racing → finished).
- **Round-based (Race):** the field **locks at GO**. Everyone in the room at that instant races together; **late joiners spectate** the pack (chase-cam, cycle any racer) until the round ends, then join the next one. *(Superseded the old "spawn beside the pack" — that's now the Survival policy; see §4.)*
- **Join a room anytime**, pick ship + colour in the lobby; **once the host starts, picks lock.** The room is chosen from a **live room list** (host name · player count · phase), not a typed code.

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

**Join policy — per mode (decided S4):** **Race** locks the field at GO — joining a live race → you **spectate**
the current round (chase-cam, cycle any racer) and race the next. **Survival** keeps **live drop-in** — a late
joiner **spawns beside the pack** (an endless track has no start line to gate on). This is one server seam
(`shouldSpectateOnJoin`), so the policy is a per-mode branch, not two code paths.

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
- **Core hazard vocabulary (implemented):** *cube fields* (1×1-cell **un-jumpable** pillars — strafe-weave) and *gaps* (fall = death/respawn — jump), plus *pads* (forced-flat breather/landing). Jump is **gaps-only**; blocks are **strafe-or-destroy** — the two never overlap. The fuller candidate menu (teleports, pads, fields, switches, destructibles, forks…) is catalogued in **§5.7**.
- **Locked constraints (2026-08-09):** **straight ribbon** — the track *never turns/curves* (no loops/corkscrews/banked corners); **strafing is the only lateral movement** (reaffirms §5.1). **No autonomous moving geometry** (no crushers / moving cubes / conveyors) — obstacles are static; the challenge is *your* motion through them. Verticality is **impulse-only** (a launch pad pops you up; you land back on the flat ribbon — no multi-level terrain/ceilings/gravity-flip). Player-*triggered* changes (a switch) are allowed — an event, not autonomous motion.
- **Levels will be hand-authored** (procedural gen is filler/endless — both feed the same `Track.segmentAt()`, so the sim is unchanged). **Fairness = two hard floors only:** **FIT** (a connected corridor ≥ the widest ship links entry→exit) and **GAP-REACH** (every gap ≤ the worst jumper's reach). **Weave difficulty is *uncapped*** — it self-balances via the speed dial (any ship crawls through at a time-cost). A **validator** (z-monotonic flood-fill + per-gap reach) enforces the two floors on *any* level, authored or generated. (Balance is playstyle-level, not geometry-equal — §5.5, §5.7.)
- **Difficulty progression:** authored levels are hand-paced; the procedural source uses a difficulty scalar `D(z)` → a **trend** (linear/ease-out for finite Race so the whole field finishes; exponential for endless Survival) **+ a deterministic triangle-wave** for tension-release pacing (NOT `Math.sin` — determinism forbids it in the generator). `D` drives the knobs (`ROW_FILL`, gap probability, cube density).

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

*OPEN: full roster + cooldowns. **S5 resolved:** v1 roster = **Bolt** (fire→stun); **single held slot** (no stacking); owner-immune only — everyone else is a target (teams / friendly-fire are a later mode). Mine/Shield/Boost = fast-follows.*

> The **full curated power-up + combat roster** (offensive / defensive / mobility / status-verbs, incl. the redefined **Tractor** and **Mines**) lives in the master menu **§5.7**. This trinity is just the starter set.

### 5.4 Combat & interactions
- **Server-authoritative hit detection** (never trust client for hits — see TDD / `conventions/netcode.md`).
- Getting hit = disruption (stun, spin, brief control loss), rarely instant death — deaths should mostly come from the *track* while disrupted. Keeps it funny, not punishing.
- **As-built (S5):** server-sim bolts (`stepWorld`) → owner-immune AABB hit → `stunTimer` (predicted `SimShip` field) freezes control while momentum coasts → you drift into a hazard and derezz. Client feedback: hit-spark + on-ship stun-flicker + threat-warning HUD. Spin/slow/reverse/blind verbs still open (BC2).

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
| Track — deterministic-from-seed, **4u cell grid** (16-lane / 64u), 4 archetypes | **LIVE** | plain / block (open-scatter cube field) / gap / finish; *platform cut* |
| Hazards + collision — **AABB** (footprint = model box), swept land + swept body-kill | **LIVE** | gap = fall/jump · cube = strafe-weave (un-jumpable); generous grounded rule; WYSIWYG |
| Death → shard-burst VFX → respawn (position-scoped grace) | **LIVE** | 1s derezz, setback + re-approach |
| Netcode — authoritative, predict+reconcile, interp, drop-in | **LIVE** | inputs-not-positions, 60Hz sim / 20Hz patch |
| **Boost** | **PLANNED (S5 fast-follow)** | *removed from base flight → pickup power-up; v1 shipped Bolt only* |
| Power-ups + combat — **Bolt** (fire→stun) + pickups + hit-spark + stun-flicker + threat HUD | **LIVE (S5)** | server-authoritative hits; `E` = discrete `USE_POWERUP`; Mine/Shield/Boost/auto-lock = fast-follows |
| Ship classes — 5 classes, per-ship `FlightTuning` + AABB footprint, dev hot-swap | **LIVE** | flight / size / models wired (§5.5); `armour` / combat stats → S5/S6 |
| Session flow (lobby→race→results, standings, restart) | **PLANNED (S4)** | one seeded track runs today |
| Survival mode (endless + chase-wall) | **PLANNED (S7)** | Race is the v1 mode |

### 5.7 Mechanic catalog — master menu (pick one at a time) — 2026-08-09

The curated backlog of candidate mechanics from the 2026-08-09 ideation, serving both playstyles:
**[R]** Race-clean · **[M]** Mess-with-people · **[B]** both. Each item tags the **base capability
(BC#)** it needs — deciding a BC unlocks its whole family. `⚡` = **no base change** (authored content /
render only). Implement one at a time; the BC changes are called out so they're decided deliberately.

**Locked design constraints (bound the whole catalog):**
- **Straight ribbon only** — never turns/curves; no loops/corkscrews/banked corners. **Strafing is the only
  lateral movement** (§5.1). Verticality is **impulse-only** (launch pads pop you up; you land on the flat
  ribbon) — no multi-level terrain, ceilings, or gravity-flip.
- **No autonomous moving geometry** — no crushers, sliding/moving cubes, or conveyors. Obstacles are static;
  the challenge is *your* motion through them. **Player-triggered** changes (a switch arms/opens something)
  ARE allowed — that's an event, not autonomous motion.
- **Balance is playstyle-level, not geometry-equal** — two hard fairness floors only (**FIT** + **GAP-REACH**);
  weave is uncapped and self-balances via speed. Levels will be hand-authored (§5.2).

**Base capabilities (decide → unlock a family):**

| BC | Capability | Status | Note |
|----|-----------|--------|------|
| **BC1** | Dynamic entities — server-sim projectiles/mines/drops/decoys (MapSchema + client interp) | **LIVE (S5)** | keystone shipped — bolts server-simmed + client-interpolated; mines/drops/decoys ride the same pipe |
| **BC2** | Status effects — networked per-ship modifiers the sim + client read | **partial (S5: stun)** | the disruption "verbs" — `stunTimer` shipped (predicted); spin/slow/reverse/blind still open |
| **BC3-trig** | Player-triggered world events (a switch arms/toggles a hazard or gate) | candidate | NOT autonomous motion |
| **BC4** | Position discontinuity — sim handles teleport/blink/grapple + prediction replays it | candidate | |
| **BC5** | Floor/zone metadata — a floor/zone carries a type that modifies the sim | candidate | cheap, high value |
| **BC6-imp** | Vertical **impulse only** — launch pads add `vy`; land on the flat ribbon | candidate | NO terrain/ceiling/gravity |
| **BC7-lite** | Track shape — width change + parallel branches + lap-repeat; **never turns** | candidate | straight-ribbon-preserving |
| **BC8** | Proximity/targeting — server distance queries | candidate | slipstream, near-miss, homing |

#### A) Track features / world hazards

| Mechanic | Play | BC | What it does |
|---|:--:|:--:|---|
| **Teleports** | B | BC4 | Paired portals (level data); enter A → exit B (deterministic set of x/z, prediction replays it). Forward pair = shortcut; backward pair = a grief trap. |
| **Boost pads** | R | BC5 | Floor strip that adds forward speed on contact — rewards the optimal line. |
| **Slow fields** | B | BC5 | Zone/floor that caps + bleeds speed and softens handling (tar/ice) — route around or power through. |
| **Launch pads** | B | BC6-imp | Impart upward `vy` (pop over a wall / reach an air pickup); you land on the flat floor. |
| **Wind / push zones** | B | BC5 | Zone applying a constant lateral (or fore/aft) force — fight the drift while weaving. |
| **Switches → route hazards** | B | BC3-trig | Passing/shooting a switch arms or opens something downstream (drop a gate, open a gap, arm a hazard). Co-op or troll (arm it as a rival nears). *(user-favored)* |
| **Destructible cubes** | B | BC1 | Cube with HP; shoot to clear a path (or leave it as a wall for chasers). Networked destroyed-state. |
| **Shrinking track** | B | BC7-lite | `HALF_WIDTH` narrows over a section (fewer lanes) → escalating weave crescendo. |
| **Split paths / forks** | R | BC7-lite | Ribbon branches into parallel straight lanes (risky-short vs safe-long), then rejoins. Route choice, no turning. |
| **Fog / vision zones** | M | ⚡ render | Reduced draw distance in a band → react later. Render-only, but seed/level-driven so all clients agree where. |
| **Chicanes / narrowing / cube patterns** | R | ⚡ authored | Pure authored cube arrangements — the bread-and-butter of a designed level. |
| **One-way membranes** | M | ⚡+BC2 | Pass forward freely, blocked going back. Only matters once knockback/teleport can push you backward. |
| **Explosive barrels** | M | BC1 | Static until shot/bumped; detonate → radial disrupt + chain to nearby barrels. Placed area-denial. |
| **Pre-placed mines** | M | BC1 | Environmental mines seeded into the track (vs player-dropped, §B) — a static-position hazard entity. |

#### B) Offensive pickups — all **BC1** (+**BC2** for the status payload)

| Mechanic | Play | What it does |
|---|:--:|---|
| **Bolt / blaster** | M | Forward shot; hit → a status verb (stun/spin). The bread-and-butter weapon. |
| **Homing seeker** | M | Locks the nearest ship ahead and chases; dodge-able; cloak/decoy counter it (BC8). |
| **Mines (dropped)** | M | Drop behind you; a trailing ship within proximity is disrupted. |
| **Wall drop** | M | Spawn a temporary solid cube behind you to block/crash chasers (expiring block entity). |
| **Oil slick / caltrops** | M | Drop a floor hazard behind; whoever crosses spins out / slows. |
| **Proximity EMP / shockwave** | M | Radial burst disrupting all ships in a radius (BC8) — strong in a pack. |
| **Tractor beam** *(REDEFINED)* | M/R | **Momentum leech** on the nearest ship(s): *their* speed drains and *yours* rises. A Freighter tractoring 1–2 Fighters slows them and speeds itself up — the heavy ship's signature "mess + self-advance" tool and its answer to being a poor weaver. **NOT** a yank-into-hazard. Knobs: leech rate, max targets, range, duration. (BC8) |
| **Boomerang** | M | Thrown forward, returns to you; can hit on both passes. |
| **Lightning chain** | M | Hits the nearest ship, arcs to further nearby ones (BC8). |
| **Ink / blind bomb** | M | Black out / smear a target's screen briefly (networked `blinded` status → victim's client renders the overlay). |
| **Reverse-controls hex** | M | Invert a target's strafe (± throttle) for a few seconds (BC2). |

#### C) Defensive / utility pickups — **BC2** (+BC1)

| Mechanic | Play | What it does |
|---|:--:|---|
| **Shield** | B | Absorb one hit (a window or one-shot). |
| **Reflect / parry** | B | Timing-bounce an incoming projectile back at the shooter. |
| **Cloak** | B | Untargetable by homing/lock for a window (still physically present). |
| **Decoy hologram** | B | Spawn a fake ship (BC1) that baits seekers/mines. |
| **Ghost-dash** | R | Phase intangibly through ONE obstacle — a single-use collision-skip burn (must not skip a fairness floor). |
| **Cleanse** | B | Strip your active negative status effects. |

#### D) Mobility pickups (Race verbs)

| Mechanic | Play | BC | What it does |
|---|:--:|:--:|---|
| **Boost** | R | sim (S5) | Burst of forward speed — the planned starter. |
| **Blink / dash** | R | BC4 | Short instant reposition forward or lateral (dodge / gap-cross / cut a weave). |
| **Air-brake / hard-stop** | R | sim | Instant strong decel to nail a tight weave entry (a tuning, not necessarily a pickup). |
| **Grapple** | R | BC4/BC8 | Fire at a point/pickup ahead and pull yourself to it — a skill-shot shortcut. |

#### E) Status verbs (the composable payloads for A/B/C) — **BC2**

`stun` (no input, brief) · `spin-out` (rotate / lose heading feel) · `slow` · `reverse-controls` · `blind` ·
**`grow-hitbox`** (footprint inflates → easier to crash — evil) · **`speed-lock`** (can't brake → forced fast
through a weave) · `heavy` (↑gravity → jumps fall short) · `magnetize` (drawn toward the nearest hazard).

#### F) Modes & scoring

Race (finite) ✓ · **Lap race** (repeat the ribbon N times — a "lap" is a length re-run, no turning) ·
**Checkpoint race** (ordered checkpoints, BC3-trig) · **Survival** (chase derezz-wall, last alive) ·
**Elimination** (last place cut each interval/lap) · **Battle/arena** (no finish — pure disrupt/kill score,
BC1) · **Team modes** (2 teams; combined race/elimination/battle scoring).
*(Coin-grab and Tag — dropped.)*

#### G) Catch-up & party-glue (keep all ~12 players in it)

| Mechanic | Play | BC | What it does |
|---|:--:|:--:|---|
| **Rubber-band pickups** | B | scoring | Worse position → better item odds (Mario-Kart) — the main equalizer. |
| **Slipstream / drafting** | R | BC8 | Riding close behind a ship grants a speed pull — rewards pack play, gives trailers a lever. |
| **Near-miss boost** | R | BC8 | Grazing a cube *without* hitting grants speed (Burnout) — rewards risky tight lines. |
| **Style / combo meter** | R | BC8 | Chain near-misses / clean weaves → build a boost charge. |
| **Spectator meddling** | M | BC1 | Eliminated/dead players occasionally drop a hazard onto the live track — keeps out-players engaged. |
| **Emotes / taunts · ping-a-hazard** | M | ⚡ | Spam reactions; mark a hazard/pickup for teammates. |
| **Bounty** | M | scoring | Disrupting/killing the current leader pays a bonus — everyone gangs the front-runner (self-balancing lead). |

#### H) Wild cards (experimental — straight-ribbon-safe only)

- **Polarity lanes** [R] (BC2/BC3-trig) — Ikaruga-style: some cubes are solid only on your current "channel";
  toggle your channel to pass matching ones. A whole skill layer; still straight-ribbon. Validate the fun first.

#### Parked (kept, not selected now)

- **Rewind / self time-slow** — great, but **much later**; per-player time dilation fights the shared
  fixed-step sim (needs careful design). Backlog.
- **Extra-jump charge** — uncertain utility; revisit if jump-heavy tracks want it.
- **Bumpers (pinball)** — kinetic-reaction props, adjacent to the rejected moving-geometry family — parked.

#### Dropped (out of scope)

Coin-grab mode · Tag mode · Loops / corkscrews · Gravity-flip / ceiling-running · autonomous moving
geometry (crushers / moving cubes / conveyors).

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
1. ~~**v1 mode** — Race or Survival first?~~ **RESOLVED: Race-to-finish is v1** (finite, finish-line); Survival is S7. (§4, backlog.)
2. ~~**Fuel/energy** — keep the SkyRoads resource pressure, or cut for simplicity?~~ **RESOLVED: cut.** Energy only gated boost; boost is now a pickup (§5.1, §5.3), so the meter is gone. Pickups carry their own charge.
3. **Death penalty** — respawn into same round, wait for next round, or spectate-only until round ends?
4. **Power-up carry** — hold 1, hold 2, or slot + queue?
5. **Friendly targeting** — free-for-all only, or teams mode later?
6. **Session length** — target minutes per round / per session?
