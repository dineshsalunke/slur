# SLUR — Game Design Document (GDD)

> Status: **v1 — the design as it stands after S1–S6.** Mechanics still loosen where playtests haven't run.
>
> **This doc states the *current* design only** — no inline "superseded" retractions to peel back. Retired
> design intent lives in `archive/superseded-design.md` (forward-framed as **PRECEDED**); decisions +
> rationale live in `DECISIONS.md` (the ADR log); *how* it is built lives in `TDD.md`.

## 0. Spatial model & units — READ THIS FIRST (load-bearing)

**The simulation is fully continuous.** Positions, velocities, floors, and hazard blocks are all real-valued
world units (`u`). Collision is continuous float-AABB (`packages/shared/src/sim/step.ts` → `overlapsBlock`);
**nothing in the sim reads, snaps to, or requires a grid.** Ships move continuously in `u`.

**`CELL = 4u` is an AUTHORING GRID ONLY.** It is an **authoring-time snap grid** — the increment you *design*
on, exactly like grid-snapping in a level editor. It applies to **all** track authoring: the procedural
generator samples on it, and hand-authored levels snap to it. It is **NOT** a gameplay unit, **NOT** a
movement snap, **NOT** a runtime concept, and **NOT** a constraint the physics knows about. At runtime
everything is continuous `u`; the grid exists only while a track is being authored, and even then it's a
convenience an author may leave. A hazard block may legally be **any size** — `5.5 × 5.5 × 8u`, `3.5 × 5 × 8u`,
anything a track (generated or authored) emits. **Do NOT assume block sizes, positions, or clearances are
multiples of `CELL`.** When you reason about space, think in `u` and in the clearance invariant below — never
"how many cells."

**Ship-size contract (DECIDED):** the **widest ship class is ≤ 1 cell (`CELL` = 4u) full width** (GDD §5.5;
Freighter was capped at the 2026-08-09 feel-gate). Reality today: widest is the **Fighter at 2.6u = 0.65
cell**. New ships MUST honour this — it is enforced by a module-load assertion (below), not by hand.

**The ONE load-bearing spatial invariant is threadable clearance:**

> At every z-slice, the widest contiguous lethal-free floor run must be **≥ `MIN_CLEAR`**, where
> **`MIN_CLEAR = MAX_SHIP_WIDTH + CLEARANCE_MARGIN`**, `MAX_SHIP_WIDTH = CELL` (4u, the ship-size contract)
> and `CLEARANCE_MARGIN = 3u` → **`MIN_CLEAR = 7u`**.

Why a **fixed contractual ceiling**, not roster-max: a track seed must generate the **same geometry forever**.
If clearance tracked the live roster, adding/resizing a ship would silently mutate every existing seed's track.
The ceiling is the *contract* (`CELL`); the roster is only **asserted** to conform:

> **Module-load guard (dev):** `assert 2·max(halfW over ALL_CLASS_TUNINGS) ≤ MAX_SHIP_WIDTH`.

That assertion is what kills the stale-number failure mode (the historical "Freighter 3.6u" bug) — we **assert
the roster fits the contract** instead of copying a ship's width by hand. `MAX_SHIP_WIDTH` and `MIN_CLEAR` are
expressed in `u`; the only tunable is `CLEARANCE_MARGIN` (raise for easier, lower for tighter — never shrink the
ceiling to make tracks harder). Any `MIN_LANE`-style constant is *derived*, **not an axiom**.

**The same contract rule governs SPEED and AGILITY, not just width (ADR-013).** The generator reads
`TRACK_CONTRACT` (`packages/shared/src/constants.ts`) and **never the ship roster**:

| Contract field | Value | What it sizes |
|---|---|---|
| `pacingCruise` | `55u/s` | hazard spacing and pinch lead-in — how much warning a racer gets |
| `weaveCruise` · `weaveStrafeClamp` · `weaveStrafeAccel` | `62` · `65` · `118` | the racing line's slope and curvature caps |

`WEAVE_SLOPE_CAP` and `WEAVE_CURVATURE_CAP` derive from those three numbers alone. A ship's own stats
**cannot** move them, so **balancing a ship never reshapes a track**. That is the point: if the track bent to
fit the least agile ship, picking a ship would carry no consequence, because the course would already have been
drawn around the one you did not pick.

> **Conformance, not conformity.** A class is **not** required to hold full throttle through the weave.
> `weaveThreadSpeed( tuning )` gives the fastest speed at which a class can follow the racing line — a real,
> derived class stat. A ship whose top speed exceeds it simply **lifts off the throttle for the weave**, which
> is exactly how a fast-but-sluggish class should play. The only hard floor is
> `weaveThreadSpeed ≥ pacingCruise × WEAVE_MIN_THREAD_FRACTION` (0.5 → **27.5u/s**): no ship may be forced
> below half the pacing speed.

> **Module-load guard:** `rosterContractFailures( SHIP_CLASSES )` runs at import of `ship-classes.ts` and
> **throws**, listing every class that is too wide or too sluggish. It is unconditional, not dev-only — the
> condition is a build-time constant, so a bad roster fails on the first run anywhere, never in front of a
> player.

Changing a `TRACK_CONTRACT` number is a **deliberate, one-time reshape of every existing seed**. It is fenced
by a frozen-geometry test (`sim/track-contract.test.ts`) that pins the caps, the derived periods and a digest
of the racing line for three seeds. If you meant it, re-pin it; if the test fires and you did not mean it, you
just moved every track in the game.

**Reference dimensions — informational, NOT constraints:**

| Thing | Value | Note |
|---|---|---|
| `CELL` | `4u` | **authoring snap grid only** (procgen + hand-authored) — not a runtime/gameplay unit |
| Track width | `64u` (`HALF_WIDTH 32`) | 16 lanes *in the current generator*; the width, not the lane count, is what matters |
| Segment depth | `SEG_LEN` `20u` | one segment; a gap is one segment long |
| Deadly block height | `8u` (`BLOCK_HEIGHT`) | **above double-jump reach on purpose** — strafe around, never hop |
| Deadly block width/depth | 1–3 lanes wide; depth drawn from `BLOCK_DEPTHS` `4/8/16u` at a varied z-offset | a *generation artifact*, **not** a rule — any size is legal |
| `MAX_SHIP_WIDTH` | `1 cell = 4u` | the ship-size **contract**; ceiling for `MIN_CLEAR`; roster asserted ≤ this |
| `CLEARANCE_MARGIN` | `3u` | the **only** clearance tunable (raise = easier tracks) |
| `MIN_CLEAR` | `7u` | `MAX_SHIP_WIDTH + CLEARANCE_MARGIN`; per-slice threadable-floor floor |
| Widest ship today | **Fighter `halfW 1.3` → 2.6u** (0.65c) | ≤ contract; must never exceed `MAX_SHIP_WIDTH` |

> **Why this section exists (and is first):** repeated confusion treated `CELL = 4u` as a gameplay law and
> hard-coded block sizes and clearances to it. It is not a law. Two stale hand-typed widths (`track.ts` claimed
> "Freighter 3.6u"; the widest ship is actually the Fighter at 2.6u) survived precisely because numbers were
> written by hand against the grid instead of derived. **Continuous world; cells are scaffolding; clearance is
> the only spatial contract.**

## 1. Vision statement

A fast, neon, quick-to-join ship racer you launch on the office LAN or a hosted web server and play in a 5-minute burst.
Fly a ship down a **finite track to a finish line** — courses ranging from short to long — grab
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
| **cuberun** | Neon tunnel look, escalating speed, dodge feel, R3F rendering approach | Single-player, no combat, **and its *endless* format** (we are finite-tracks only — ADR-004) |
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
- **Round-based (Race):** the field **locks at GO**. Everyone in the room at that instant races together; **late joiners spectate** the pack (chase-cam, cycle any racer) until the round ends, then join the next one.
- **Join a room anytime**, pick ship + colour in the lobby; **once the host starts, picks lock.** The room is chosen from a **live room list** (host name · player count · phase), not a typed code.

## 4. Game modes

**One mode: Race (finite track).** A course with a start and a **finish line**; first across wins. Given the
north star, the win condition exists to give a round *shape*, not to be fair — pickups and combat are
**sabotage tools** to mess with each other. Natural round end, obvious goal, trivially re-runnable, clear
winner. (Blur.) *Optional round timer as a backstop.*

**Track length is a spectrum, not a mode.** Courses range **short → long**; a long course is the home of the
difficulty **arc/progression** (§5.2), replacing what "endless" used to provide. No separate endless generator.

**Forward pressure:** the finish line (+ optional timer) self-pressures the round — deliberately **light-touch**,
casual, not punishing.

**Re-entry:** rounds are short; death → quick respawn. No one sits out long.

**Join policy (Race-always):** the field **locks at GO** — joining a live race → you **spectate** the current
round (chase-cam, cycle any racer) and race the next. One server seam (`shouldSpectateOnJoin`); the planned
Survival "drop-in" branch of that seam is not built (ADR-004).

## 5. Mechanics

### 5.1 Movement — **constrained flight, player-controlled speed** (decided)
- **Model: constrained**, not free 6DOF. Lateral is **strafe, never turning**; pitch/yaw/roll are **cosmetic banking**, never control axes. Chosen for readability, low motion-sickness, party accessibility, and simpler deterministic netcode. (Closer to SkyRoads than cuberun.)
- **Player-controlled speed** (changed from auto-forward): **throttle** to accelerate up to a cruise max, **brake** to decelerate (no reverse). Speed control adds depth — brake to thread a hazard, feather speed in a dogfight, dive a straight.
- **Lateral: smooth analog strafe** with a generous clamp (flying feel). *Fallback:* discrete 3–5 lanes if playtest shows analog is too twitchy on keyboard.
- **Jump: controlled & expressive** — tap = small hop, **hold = higher jump** (variable height), plus a **double jump**. For crossing gaps, clearing obstacles, and air-dodges (SkyRoads).
- **Boost is NOT a base mechanic** *(decided — was a Shift-held overdrive)*. It moves to a **pickup power-up** (§5.3) — grab it, spend it. This keeps the base flight model clean and makes overdrive a *contested resource* you fight over, per the north star.
- **No fuel/energy meter** *(resolved — §10 Q2 closed)*. The energy pool existed only to gate boost; with boost gone it's cut. Pickups carry their own charge/duration.

> **Forward-pressure (resolved, see §4):** Race self-pressures via the finish line (+ optional timer) —
> light-touch, in keeping with the casual north star.

### 5.2 Track & hazards

The `Track` a room holds is **physics + gameplay anchors**, materialized locally from an opaque **descriptor**
(the seed is one field inside it, owned by the procgen provider — never synced tile-by-tile); **visuals are
resolved separately, client-side, never synced** (ADR-002, the 3-layer model). See `docs/DECISIONS.md`.

- **All clients share the same track**, materialized identically on both ends from the room's **descriptor**
  (procgen `{seed, tier}` or authored `{levelId}`) — never a per-tile sync. The sim depends on the `Track`
  interface, not on how it was produced.
- **One track form:** *finite* **courses with a finish line**, length ranging **short → long**. (The old
  "*endless* procedural run" form is dropped — ADR-004.)
- **The `Track` is gameplay data only** — floors/walls/gaps (physics) + **anchors** (pickup/hazard/drop/checkpoint
  placements). Pickup/hazard *layout* is a track anchor; per-anchor *availability* is thin synced state
  (`pickupTaken` generalised); runtime-spawned things (bolts/drops/active hazards) are synced entities. Visuals
  are a separate client-side concern (ADR-002 — the 3-layer model).
- **Core hazard vocabulary (implemented):** *cube fields* (**un-jumpable** pillars — strafe-weave) and *gaps* (fall = death/respawn — jump), plus *pads* (forced-flat breather/landing). **A block is solid, not lethal — you bounce off it** (ADR-014): the hit shoves you back off the face and stuns you for a moment, so a block costs time and position while the *gap* keeps the only death in the game. Jump answers gaps; blocks are **strafe-or-destroy** — **and the two now overlap**: a gap segment that keeps a floor deck (a crack, or a partial gap) may carry one block on its **landing side**, so crossing it is one decision with two parts — clear the hole *and* be somewhere specific laterally when you land. A **full-width** gap never carries a block: there is nothing to stand on. Block height stays **8u** (above double-jump reach, ADR-007), so a block is never the thing you jump. Threadable clearance is measured over the **combined** floor-and-block result, so the deck a block sits on still keeps a ≥ `MIN_CLEAR` run. The fuller candidate menu (teleports, pads, fields, switches, destructibles, forks…) is catalogued in **§5.7**.
- **Fractured blocks (implemented, ADR-015 amending ADR-009).** A block is **sealed** or **fractured**. A
  fractured block has a cracked shell with marigold energy inside. Shoot it with one bolt to break it, or
  fly through it and keep 45% of your forward speed. A sealed block bounces you (ADR-014) and stops a bolt.
  So the cost order is: weave (free) < shoot (a bolt) < smash (~0.2s) < bounce (~1.45s). The fracture rate
  rises with track intensity, from 15% to 35%. Broken state is networked (`RunState.blockBroken`) and lasts
  for the run. Three primitives remain: gaps · sealed · fractured. Slow blocks are gone. The readability gate
  (can you tell sealed from fractured at 55 u/s?) is still open. See `docs/DECISIONS.md` ADR-015.
- **Locked constraints:** straight ribbon · strafe-only lateral · no autonomous moving geometry ·
  impulse-only verticality. Stated once, in full, in **§5.7** — they bound the whole mechanic catalog, not
  just the track.
- **Procgen vs authored is now an OPEN choice** *(ADR-004 — "procgen is PRIMARY" was justified by endless
  Survival, which is dropped; recommendation: **hybrid, ruleset grammar as the pivot**)*. Both feed the same
  `Track` interface, so the sim is unchanged either way. **Fairness = two hard floors only:** **FIT** (a
  connected corridor ≥ the widest ship links entry→exit) and **GAP-REACH** (every gap ≤ the worst jumper's
  reach). **Weave difficulty is *uncapped*** — it self-balances via the speed dial. A **validator**
  (z-monotonic flood-fill + per-gap reach) enforces the two floors on *any* track, authored or generated —
  plus the **WYSIWYG-collision** gate (ADR-002) for authored visuals. (Balance is playstyle-level — §5.5, §5.7.)
- **Generation — rhythm-paced (ADR-006).** The core game is **three primitives only: gaps + deadly blocks +
  slow blocks** (all else is feathering); there is deliberately no multi-beat macro grammar to wait on.
  Two layers: **(macro)** a difficulty **arrangement envelope** — a staircase of escalating waves modelled
  on *Imagine Dragons "Believer"* (tense verse breathers → building pre-choruses → chorus **slams** →
  a **bridge breakdown valley ~75%** → biggest **final chorus** → quick **outro** to a plain finish). The
  music is **hidden pacing scaffolding only — the surface stays continuous, never a rhythm game.**
  **(micro)** **discrete slalom + flick** — short cube pillars OUTSIDE a moving safe corridor placed by
  uncorrelated noise (sparse, never clumped), plus a **flick pillar** that juts into the corridor to force
  a sharp sidestep; **slow blocks = grace-notes ON the line**; **gaps are varied** (full-width jump +
  partial floor-strip). Fairness is the derived ceiling — weave speed ≤ `SLOPE_CAP`/`CURV_CAP` ("the peak is
  exactly what the worst weaver can just barely thread"), a `≥ MIN_LANE` corridor per slice, gaps ≤ the
  worst jumper's reach. Dimensions and the as-built shape live in **TDD §4**; the design argument in
  **ADR-006**. *(Prior generators are retired to `archive/superseded-design.md`.)*

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
- **As-built (S5):** server-sim bolts (`stepWorld`) → owner-immune AABB hit → `stunTimer` (predicted `SimShip` field) freezes control while momentum coasts → you drift into a wall and lose the time, or off the deck and derezz. Client feedback: hit-spark + on-ship stun-flicker + threat-warning HUD. Spin/slow/reverse/blind verbs still open (BC2).
- **Bolt feel (design target — issue #55):** the Bolt is a **near-instant fast projectile**, not literal hitscan — it snaps forward almost immediately, but a short travel window keeps it **dodgeable by weaving** (preserving the agility ⊥ armour axis, §5.5) and keeps the threat cue (threat HUD / #38) meaningful. Near-instant speed **requires swept collision** (segment-vs-AABB per tick) so a fast bolt never tunnels through a short-hulled ship (Comet/Interceptor). Visually it reads as an **elongated energy streak/tracer**, not a sphere. *(Was `BOLT_SPEED 120` u/s + a `sphereGeometry` bolt.)*

### 5.5 Ship classes (asymmetric) — **LOCKED 5-class matrix (2026-08-09)**
You pick a class at join. Five classes trade along multiple axes so none dominates; properties are pure data
(`FlightTuning` per class in `@slur/shared`, server-authoritative) so balancing is a config edit.

> **How per-ship flight works (architecture — already in place):** `simulate()` takes a `FlightTuning` struct
> as an argument, not a global. Today all ships pass `DEFAULT_TUNING` (the **Fighter/baseline** preset in
> `@slur/shared/constants.ts`); a class simply supplies its own `FlightTuning` — including its own `JumpDesign`
> (→ `deriveJump`) and its `halfW`/`halfL` size. **Per-ship flight is a data swap, not a code change** — the
> "ship stats are data, server-authoritative" non-negotiable.

**Spatial rules come from §0 — that section governs.** In brief: the runtime is continuous, `CELL = 4u` is
an authoring snap grid, blocks are `BLOCK_HEIGHT 8u` tall (above double-jump → **un-jumpable**) but of
arbitrary width/depth (ADR-007), and the ship is **≤ 1 cell** wide. **Jump is only for gaps; blocks are only
strafe-or-destroy** — the two mechanics never overlap.

**Model = hitbox (WYSIWYG, LOCKED).** Each class is one of our five CC0 models, **uniform-scaled** so its visible
box IS its AABB collision footprint — you hit exactly when the ship touches. Height is cosmetic (bodies are solid
ground-up; Y doesn't change collision logic), so all visual flair lives in the vertical/overhang budget and cannot
affect fairness. Footprints are **derived from the measured model proportions**, not hand-set. *(Verified
2026-08-14: each model's rendered box equals its footprint to the millimetre — no node-transform surprises. So
how **big a ship reads on screen** is set by the **chase-camera framing** (ADD §6) and by the class's footprint
size — never a scale bug. The Comet/`bob` reads smallest because its footprint is deliberately the tiniest; that
is data, not an error.)*

| Class | Model | Footprint W × L (cells) | W × L (u) | Weave | Gap | Fantasy |
|---|---|:--:|:--:|:--:|:--:|---|
| **Interceptor** | executioner | 0.50 × 0.46 | 2.0 × 1.8 | ●●●●● | ●●○○ | flat sleek scalpel — best weaver, twitchy at gaps |
| **Fighter** (baseline) | challenger | 0.65 × 0.63 | 2.6 × 2.5 | ●●●○ | ●●●○ | square all-rounder / default |
| **Comet** | bob | 0.55 × 0.29 | 2.2 × 1.2 | ●●●○ | ●●○○ | tiny wide-wing glass rocket — fastest, weak jump |
| **Phantom** | dispatcher | 0.60 × 1.26 | 2.4 × 5.0 | ●●○○ | ●●●●● | long courier — triple-jump air/gap master |
| **Freighter** | split-crown | 0.62 × 1.5 | 2.5 × 6.0 | ●○○○ | ●●●● | long cruiser — worst weaver (sluggish handling), gap-tank |

**A "class" is a group; a "ship" is a variant inside it (architecture for growth).** A **ShipClass** owns all
*mechanics* (the `FlightTuning` incl. footprint) — the balance unit, few and carefully tuned. A **Ship** is a
*cosmetic* variant within one class (its own model + name), inheriting the class's mechanics wholesale — ships
in a class are mechanically **identical**, so the class stays the honest balance unit. Today each class has
exactly **one** ship (the model above); `@slur/shared/ship-classes.ts` supports **many** later — adding a ship
is a model + a `classId` (balance for free), adding a class is a new archetype. The networked field is the
**`shipId`** (set once at join/hot-swap); the sim resolves `shipId → class → tuning` identically on client and
server (the netcode "one shared `simulate()`" requirement). Model/scale live client-side under the same id.

**Flight stats (S6 target spec).**
> ⚠ **STALE — do not code against this table.** All five classes are wired in
> `packages/shared/src/ship-classes.ts`, and playtest tuning moved **strafe power and grip** past these
> numbers on every class. Top speed, accel and jump match. The source of truth is the code; reconciling the
> table is parked in the global backlog `~/.claude/backlog.md` (2026-09-21, tagged `slur`).

| Class | Top speed | Pickup (accel) | Strafe pwr / cap | Grip (damp) | Jump h / air |
|---|:--:|:--:|:--:|:--:|:--:|
| Interceptor | 48 | 45 | 195 / 95 | 12 (snap) | 3.0 / 2 |
| **Fighter** | 55 | 40 | 150 / 80 | 8 (neutral) | 3.2 / 2 |
| Comet | **70** | 52 | 165 / 85 | 4 (drifty) | 2.8 / 2 |
| Phantom | 50 | 38 | 135 / 75 | 8 (neutral) | 4.2 / **3** |
| Freighter | **124** | 30 | 105 / 65 | 5 (drifty) | 3.6 / 2 |

The Freighter's top speed is **not** a top speed it can use everywhere. It follows the racing line at
**69.3u/s** (`weaveThreadSpeed`), so holding 124 costs it a **44% scrub** into every weave, and at full throttle
a mid-difficulty hazard gives it **0.48s** of warning against **0.50s** of braking. It is a straight-line ship
that must read the track ahead — top speed for the open sections, paid for in the dense ones. Raised 62 → 124 on
2026-09-23; under ADR-013 this moved **no track geometry**.

**Two governing constraints (why the matrix stays fair):**
1. **Widest class ≤ 1 cell** (`MAX_SHIP_WIDTH`; widest is now Fighter 0.65c) and the generator **guarantees a
   contiguous open floor ≥ `MIN_CLEAR = 7u`** (= `MAX_SHIP_WIDTH 4u + CLEARANCE_MARGIN 3u`) at every z-slice →
   every legal ship threads with margin. See §0 for the full contract + the roster-conformance assertion.
   (Replaces the old `MIN_CORRIDOR 6` / "≥2 lanes = 8u".) NB: the Freighter's *weave* penalty comes from its
   sluggish strafe, not a wide hitbox — so its footprint stays ≤ contract while it remains the longest (gap-tank).
2. **One shared server-authoritative track for all players (drop-in)**, generated to the **contract**, never to
   the roster (ADR-013). It is sized for `TRACK_CONTRACT`'s reference weaver and pacing speed; each class is only
   *asserted* to clear the floor. A track shaped by the least-capable live ship would cancel out ship choice —
   the course would already have been drawn around the ship you did not pick. **Class differences are margin &
   style, never pass/fail** — the floor (`weaveThreadSpeed ≥ 27.5u/s`, no sub-3.0 jumper) is what keeps a
   Freighter on a gap-heavy seed from being simply dead, not a track that bends to it.

**Emergent identity (not hand-tuned):** gap skill falls out of **length** (generous grounded rule — a longer ship
takes off later and lands earlier, so it clears gaps more forgivingly), weave skill out of **width**. The short
models (Comet, Interceptor) are naturally twitchy at gaps; the long ones (Phantom, Freighter) tank them — the
models were assigned to *match* the intended identity, so the geometry does the balancing.

**Armour / combat (S6 — LOCKED 2026-08-10):** `armour` is a per-class **stun-duration multiplier**
(`effectiveStun = STUN_SECONDS × (1 − armour)`). **As-built 2026-08-10:** it lives on `ShipClass` **beside**
`tuning`, not inside `FlightTuning` — `FlightTuning` is the *flight* identity, and folding a combat stat into
it would drag `armour` through `DEFAULT_TUNING` and every `deriveJump` spread. The earlier "resolved both ends
so the predicted `stunTimer` stays byte-identical" rationale **does not apply**: the server is the only writer
of `stunTimer` (`run-room.ts`), and the client receives the value and only decays it in `simulate()`, so armour
cannot desync prediction. It stays server-authoritative shared data for the real reasons — ship stats ARE data
(non-negotiable #6), and the lobby pick-UI reads it. It is a **sidegrade, NOT a free stat**: the axis is
**agility ⊥ armour** — agile ships (Interceptor/Comet) are **fragile** (long stun), heavy ships
(Freighter/Phantom) are **tanky** (short stun). Agile dodges bolts easily but pays when caught; heavy eats bolts
but shrugs them off. Armour resists *combat* disruption but **never** a fall into a gap (a large hitbox still
makes track hazards deadlier — armour isn't free). **`powerAffinity` DEFERRED** until the pickup roster grows
past one item (meaningless over Bolt alone). Combat-specialist niches (old Gunship/Scout ideas) fold into the S5
pickup layer, not new models. *Chose the multiplier over an N-hits-to-stun threshold (rejected: adds per-ship
hitpoint state for no gain while bolts are single-shot).*

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
| Track — deterministic from a descriptor; **rhythm-paced generator** (ADR-006): arrangement envelope + discrete slalom/flick + varied gaps | **LIVE** | plain / block / gap / finish; fairness caps asserted in `sim/track.test.ts` |
| Hazards + collision — **AABB** (footprint = model box), swept land + swept body-bounce | **LIVE** | gap = fall/jump · cube = strafe-weave (un-jumpable), hit = bounce + stun (ADR-014); generous grounded rule; WYSIWYG |
| Death → shard-burst VFX → respawn (position-scoped grace) | **LIVE** | falling only; 1s derezz, setback + re-approach |
| Netcode — authoritative, predict+reconcile, interp, drop-in | **LIVE** | inputs-not-positions, 60Hz sim / 20Hz patch |
| **Boost** | **PLANNED (S5 fast-follow)** | *removed from base flight → pickup power-up; v1 shipped Bolt only* |
| Power-ups + combat — **Bolt** (fire→stun) + pickups + hit-spark + stun-flicker + threat HUD | **LIVE (S5)** | server-authoritative hits; `E` = discrete `USE_POWERUP`; Mine/Shield/Boost/auto-lock = fast-follows |
| Ship classes — 5 classes, per-ship `FlightTuning` + AABB footprint, dev hot-swap | **LIVE** | flight / size / models wired (§5.5); **`armour` (stun-multiplier sidegrade) is LIVE** on `ShipClass`, with invariant tests. Lobby pick-UI identity stats still REMAINING |
| **Audio** — singleton engine, synth hum (pitch∝speed), CC0 SFX + CC-BY music, positional, event-bound | **LIVE (S6)** | `app/audio/**`; `M`=mute; `RemoteEngineAudio` not hear-verified |
| **Front-of-house UI** — angular neon landing over Grid-Void | **LIVE (S6), palette PENDING** | Art direction re-frozen by `docs/art-direction/` (**ADR-008**): marigold-primary, TRON-*influenced*. The shipped palette is still the old cyan×marigold retone — recolour is the next art pass. Lobby pick-UI stats + in-game env integration REMAINING |
| **Art review instruments** — `/art-lab`, `/art-gallery`, `/iso-*` | **REMOVED 2026-09-21** | Nothing replaces them. What is left: `/env-lab` and a hosted room. Restore: `git show e56f643 -- apps/client/app/routes/art-lab` |
| **Track surface** — generated slab (`TrackFloor`): one mesh from real `FloorSpan` data, procedural graphite + 16×20u panel texture | **LIVE** | It **is** the game floor — `scene/track-view.tsx` renders `TrackFloor` + `TrackBoundary` + `TrackBlocks` |
| **Track edge rail** — chamfered bar standing **outboard** of ±`HALF_WIDTH` (ADR-012) | **LIVE** | No drawn element may consume playable width; the deck's top face ends at exactly ±`HALF_WIDTH`. Final height + material tier still open |
| Session flow (lobby→race→results, standings, restart) | **LIVE (S4)** | round lifecycle + room list + spectator + host migration |
| ~~Survival mode (endless + chase-wall)~~ | **DROPPED (ADR-004)** | replaced by longer finite tracks; Race is the only mode |

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
| **Destructible cubes** | B | BC1 | **Built as fractured blocks (ADR-015).** No HP: one bolt breaks one. Shoot it to clear a path, smash through it for a speed tax, or leave it as a wall for chasers. Networked broken state. |
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
**Checkpoint race** (ordered checkpoints, BC3-trig) · ~~**Survival** (chase derezz-wall, last alive)~~ *(dropped — ADR-004)* ·
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
- **Count:** 2–12 (office LAN or web). Design readable at 8.
- **Identity:** pick a name + ship color on join. Ephemeral, no accounts.
- **Spectate:** dead/late players spectate the pack and can heckle (emotes/chat) — keeps them engaged.

## 7. Progression / meta — **out of scope for v1**
No unlocks, no persistence. Every session is fresh. (Revisit only if it has legs.)

> Note: this is **meta** progression (unlocks/persistence across sessions), still out of scope. It is
> distinct from **in-track difficulty progression** — the beat/arc a single (longer) course walks you through
> — which is now a live design axis (§5.2, ADR-003) and is *how* a long finite track replaces what endless used to give.

## 8. Controls (constrained model)
Keyboard-first (office laptops). Gamepad = nice-to-have later. No pause (live multiplayer).

| Action | Key | Notes |
|--------|-----|-------|
| Throttle / accelerate | W or ↑ | Hold to speed up toward cruise max |
| Brake / slow | S or ↓ | Hold to decelerate (no reverse) |
| Strafe left/right | A / D or ← / → | Lateral, **not turning**; smooth analog (lanes fallback) |
| Jump | Space | Tap = small hop · hold = higher · double-tap = double jump |
| Use power-up | E | Uses held power-up (incl. **Boost**, now a pickup — Shift is unbound; LMB is not bound) |
| Mute | M | Someone always needs to mute fast |
| Leave run | Esc | No pause; leaving drops you to spectate/menu |

- **Aiming (design intent — NOT built).** Offensive power-ups should **auto-lock the nearest target in a
  forward cone** — combat is disruption, not precision, so no aim skill-wall. **As built the Bolt is dumb
  and fires straight forward**; auto-lock needs BC8 (proximity/targeting) and is a fast-follow. Mines drop
  behind automatically.
- Chords needed simultaneously (strafe + boost + hop + fire) use common non-ghosting keys; verify on real laptops.

*OPEN: rebind support, gamepad mapping — after movement prototype.*

## 9. Success criteria (for the side project)
- A run of 6 people in the office produces genuine laughter.
- Join-to-flying < 10 seconds.
- Nobody asks "how do I play?" after one round.

## 10. OPEN QUESTIONS (resolve with team)

1. **Procgen vs authored** — an open choice again since ADR-004 removed the endless necessity. Hybrid with
   the ruleset grammar as pivot? Where does the split land?
2. **Beat vocabulary + when to build the macro grammar** (ADR-003) — which BC5-family beats land first
   (boost/slow/launch), and how long does the difficulty arc of a "long" track run?
3. **Death penalty** — respawn into the same round, wait for the next, or spectate-only until it ends?
4. **Power-up carry** — hold 1, hold 2, or slot + queue?
5. **Friendly targeting** — free-for-all only, or teams mode later?
6. **Session length** — target minutes per round / per session?
7. **Slow vs breakable blocks** — ADR-009 is PROPOSED and gated on a readability test; slow blocks stay live
   in the generator until it is accepted (§5.2).

*Resolved and folded in:* v1 mode = finite **Race** (endless Survival dropped — ADR-004) · fuel/energy
**cut** (it only gated boost, which is now a pickup — §5.1/§5.3) · descriptor shape shipped as
`TrackDescriptorState` (ADR-001; fields in TDD §5).

---

## History

Retired design intent is **not** kept inline here — it lives in **`docs/archive/superseded-design.md`**,
forward-framed as **PRECEDED** (what it was → what it became → the ADR that moved us). Decisions + rationale:
**`docs/DECISIONS.md`** (the ADR log).
