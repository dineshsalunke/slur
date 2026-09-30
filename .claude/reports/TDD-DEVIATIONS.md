# TDD deviations — doc against code

Audit of `docs/TDD.md` against the shipped code, 2026-09-30. First audit of this doc. Every finding
quotes the doc wording it relies on and the file and line that contradicts it. Nothing here is fixed —
this is the list.

Verified this session by reading the code at committed `HEAD` (`3973813b`). One agent has uncommitted
work moving the **tug** power-up into `features/tug/` folders and adding feature registries (see `git
status`); findings that touch tug are checked against `HEAD` and noted as "mid-move," not reported as a
missing feature.

## Summary

| Severity | Count |
|---|---|
| (a) The doc describes a contract/mechanism that does not exist | 2 |
| (b) The doc describes behaviour the code no longer has, or the code has an architecture the doc lacks | 7 |
| (c) Stale pointer, path, version or number | 3 |

---

## 1. The doc describes a contract or mechanism that does not exist

### 1.1 `PlayerState` is not a hand-authored class "implementing SimShip"

TDD §5:

> *"`PlayerState (implements SimShip → the server runs the shared simulate() on the schema instance
> directly)`"*

followed by a fixed ASCII field list (24 fields).

In code, `PlayerState` is not a class at all. `packages/shared/src/schema.ts:13` (committed):

    export const PlayerState = schema( PLAYER_FIELDS, 'PlayerState' );

`PLAYER_FIELDS` is `composePlayerFields( CORE_PLAYER_FIELDS, SIM_FEATURES )`
(`packages/shared/src/player-fields.ts:81`) — a **factory that merges a 41-field core object with
whatever fields the active `SIM_FEATURES` registry contributes**, and throws if a feature redeclares a
core field name (`player-fields.ts:75`). There is no `implements SimShip` anywhere in `schema.ts`.

**Impact:** the doc describes a static, hand-written schema. The real mechanism is a runtime
composition step keyed off a feature registry (RFC-349 §3/§4.3, landed as `conventions/features.md`,
S0). A reader trying to add a field would edit the wrong file (`schema.ts` instead of
`player-fields.ts` or a feature's own `fields.player` spec) and not find the merge step that actually
builds the wire schema.

**Suggested resolution:** doc moves — TDD §5 needs a short paragraph on `composePlayerFields` /
`SIM_FEATURES` before the field diagram, pointing at `conventions/features.md`.

### 1.2 `heldPower` is documented as the live power-holding mechanism; it is dead code

TDD §5:

> *"`heldPower: uint8 // held slot (0 none / 1 bolt); schema-only, the sim never reads it`"*

This describes `heldPower` as *the* representation of what a player is holding. In code,
`heldPower` still exists on the schema (`player-fields.ts:36`) but has **zero non-test references** —
`grep -rn "\.heldPower" packages/shared/src apps/client/app apps/server/src` (excluding `*.test.*`)
returns nothing. The actual mechanism is a **3-slot power rack**, `player-fields.ts:38-41`:

    slots: {
        array: 'uint8',
        default: new ArraySchema< number >( ...Array< number >( POWER_SLOTS ).fill( HeldPower.none ) ),
    },

`POWER_SLOTS = 3` (`packages/shared/src/combat/constants.ts:19`), holding one of **8** `HeldPower`
values — `none, bolt, seeker, mine, boost, shield, portal, portalB, tug`
(`packages/shared/src/combat/constants.ts:30-40`) — not the binary "0 none / 1 bolt" the doc describes.
`apps/server/src/rooms/run-room.test.ts:490` and `:507` exercise "lowest empty slot" / "full rack"
semantics that only make sense for an array, never a single scalar.

**Impact:** anyone reading TDD §5 to understand power-ups will look for a single held-power flag that
no longer does anything, and miss the actual 3-slot rack and 8-power system entirely.

**Suggested resolution:** doc moves — replace the `heldPower` bullet with the `slots` array and the
`HeldPower` enum, and add a line in §6 naming the power types (see 2.3 below).

---

## 2. The doc describes behaviour the code no longer has, or the code has an architecture the doc lacks

### 2.1 The frame-scheduler / feature-module architecture (RFC-349) is entirely absent from the TDD

TDD §3 describes rendering as plain R3F/koota:

> *"R3F reads entity transforms in `useFrame` via **refs/instancing — no per-frame React re-renders**"*

with no mention of ordering. In fact `docs/RFC-349-ARCHITECTURE.md` §7 records stages **S0, S1, S2, S3,
S8, S14–S20 as Landed** (`docs/RFC-349-ARCHITECTURE.md:861-890`), shipping:

- A real **scheduler** with declared phases (`input`, `simulate`, `sync`, `view`, `render`, `cleanup`,
  `react`) — `game/frame/schedule.ts` (S16, `docs/RFC-349-ARCHITECTURE.md:886`).
- A **feature-module** system: `packages/shared/src/features/registry.ts`,
  `packages/shared/src/features/define-sim-feature.ts`, and client-side
  `apps/client/app/features/client-features.ts` (verified — `CLIENT_FEATURES` array + `ClientFeature`
  type), landed as `conventions/features.md` (S0, `docs/RFC-349-ARCHITECTURE.md:861`).
- **One render system** (`SceneEffects`, S18) replacing `PlainRender`/`QualityGate(post)`
  (`docs/RFC-349-ARCHITECTURE.md:888`).
- **Quality hooks** (S19) and a **dial-sync** react-phase system (S20)
  (`docs/RFC-349-ARCHITECTURE.md:889-890`).
- An **input action map** (S2) and an **event-queue helper** (S3)
  (`docs/RFC-349-ARCHITECTURE.md:862-863`).

None of this appears in TDD §3/§4/§7. §3's "Client architecture" section still describes an undifferentiated
`useFrame` model with no scheduler, no phases, and no feature-module boundary.

**Impact:** this is the single largest gap in the doc. A reader following TDD §3 to add a new system
would not learn that systems must declare a phase, that there is one scheduler per route
(`NetLoop`/`DeckLoop`/`LandingRig`), or that a new power-up belongs in a feature folder, not scattered
across central files (the exact problem RFC-349 §0 was written to fix).

**Suggested resolution:** doc moves — TDD needs a new §3a "Frame scheduler and feature modules"
summarizing RFC-349 §5 and §3, with a pointer to `conventions/features.md` and `conventions/r3f.md`.

### 2.2 §6 "server systems" documents only bolts and pickup-grab; the game has 8 power types plus breakable blocks

TDD §6 describes `stepWorld` as:

> *"advances bolts (shared `stepProjectiles`) → owner-immune AABB `boltHits` → victim `stunTimer` …
> pickup grab-on-overlap → `heldPower` + server-plain respawn timer; `USE_POWERUP` spawns a bolt from
> the authoritative pose"*

`packages/shared/src/run/combat.ts` (committed) shows `firePower()` dispatching on `HeldPower`:
`portal`/`portalB` → `placePortal`, `tug` → `fireTug`, `seeker` → `fireSeeker`, `mine` → `layMine`,
`bolt` → `fireBolt`, `boost` → `startBoost`, `shield` → `raiseShield`
(`packages/shared/src/run/combat.ts:44-55`). The schema carries dedicated `MapSchema` collections the
TDD's §5 wire diagram never lists: `seekers: MapSchema<Seeker>`, `mines: MapSchema<Mine>`,
`portals: MapSchema<Portal>`, and `blockBroken: MapSchema<boolean>` (`packages/shared/src/schema.ts`,
committed, `RunState` class). Breakable/fractured blocks (ADR-009/ADR-015), the homing seeker
(ADR-017), and the portal pickup (ADR-022) are each the subject of an accepted ADR with no TDD update.

**Impact:** TDD §5's wire-format diagram and §6's per-tick description cover roughly one of eight
power types and omit four `RunState` collections. Anyone using the TDD as the wire-format reference
(its own §5 header: *"declaration order = wire format"*) will build against a schema that is missing
most of the state that actually crosses the wire.

**Suggested resolution:** doc moves — expand §5's `RunState`/`PlayerState` diagrams to the real field
set and add the `Seeker`/`Mine`/`Portal` classes; expand §6 to name all `HeldPower` branches.

### 2.3 §4 still claims "three primitives only: gaps + deadly blocks + slow blocks"

TDD §4:

> *"Track generator — rhythm-paced (ADR-006). Three primitives (gaps · deadly blocks · slow blocks)."*

This is the same claim the GDD audit already flagged (`GDD-DEVIATIONS.md` §2.1). ADR-009/ADR-015
merged slow blocks and destructible blocks into one *breakable block* primitive
(`docs/DECISIONS.md:393` "Merge slow blocks and destructible blocks into one breakable block
primitive"; `docs/DECISIONS.md:829` "amended for ADR-014"). There is no slow/drag block left in
`packages/shared/src/sim`.

**Impact:** same as GDD 2.1 — two of the three documented primitives are one primitive in code. This
finding is listed here too because TDD §4, not just GDD, repeats the stale claim; fixing one doc without
the other leaves them disagreeing with each other.

**Suggested resolution:** doc moves — TDD §4's primitive list should read "gaps + solid/breakable
blocks" and link ADR-009/ADR-014/ADR-015.

### 2.4 §9 lists gamepad as a v1 non-goal; gamepad input is shipped and wired into every schedule

TDD §9:

> *"Non-goals (v1): Matchmaking across networks, persistence/accounts, mobile/touch, gamepad, spectator
> replays."*

`apps/client/app/game/input/gamepad.ts:79` (committed):

    export const GAMEPAD_SYSTEM = { id: 'input.gamepad', phase: 'input', run: pollGamepads } as const;

RFC-349 records this as landed: *"S17 … `input.gamepad` in all 3 schedules"*
(`docs/RFC-349-ARCHITECTURE.md:887`), i.e. gamepad input runs in the `NetLoop`, `DeckLoop`, and
`LandingRig` schedules alike, with its own test file (`apps/client/app/game/input/gamepad.test.ts`).

**Impact:** a v1 non-goal that already shipped. Anyone reading §9 to scope new work would assume
gamepad support needs to be built from scratch.

**Suggested resolution:** doc moves — drop "gamepad" from §9 and add one line to §3 or §6 documenting
the gamepad input system.

### 2.5 §9 lists mobile/touch as a v1 non-goal; a touch D-pad HUD ships

Same TDD §9 sentence lists `mobile/touch` as a non-goal. In code:
`apps/client/app/game/hud/touch-pad/touch-dpad/touch-dpad.tsx` plus
`touch-dpad.constants.ts`/`touch-dpad.utils.ts`/`touch-dpad.state.ts` implement a touch D-pad, and
`apps/client/app/game/input/touch-latch.ts` implements axis-latching (`STRAFE_ON`/`STRAFE_OFF`/
`BRAKE_ON`/`BRAKE_OFF` thresholds) specifically for touch input. CLAUDE.md's own art-direction section
also documents iPhone/`navigator.standalone` handling (`CLAUDE.md`, "iPhone has no element Fullscreen
API"), which only matters if touch/mobile play is a real target.

**Impact:** same shape as 2.4 — a documented non-goal that has already been built, so the doc
undersells the client's actual input surface.

**Suggested resolution:** doc moves — drop "mobile/touch" from §9, or narrow it to a specific
unsupported claim (e.g. "no mobile matchmaking/UI polish") if that's what was actually meant.

### 2.6 §9's anti-cheat framing predates ADR-026, which already ships the limits it defers

TDD §9:

> *"Anti-cheat stays light for LAN/trusted-crew play; **public web hosting will need it revisited** (the
> server is already authoritative, which is the foundation)."*

`docs/DECISIONS.md:1438` — **ADR-026 — Public-server limits: room cap, per-IP quota, message caps,
deploy from pushed code** — is an accepted ADR. In code: `apps/server/src/create-quota.ts` implements
the per-IP quota (imported at `apps/server/src/index.ts:5` and `apps/server/src/rooms/run-room.ts:42`),
and `apps/server/src/rooms/run-room.ts:52` sets `maxClients = 12` as the room cap.

**Impact:** §9 phrases the public-hosting hardening as a thing "revisited" later; it was revisited, and
landed. Someone scoping public-hosting risk from TDD §9 alone would not learn the quota/room-cap system
already exists, or think to check whether it is sufficient rather than starting from zero.

**Suggested resolution:** doc moves — §9 should name ADR-026 and its three limits, and narrow the
"needs revisiting" language to whatever's still actually open (e.g. message-cap tuning, if unmeasured).

### 2.7 §8's "remaining gap" already has a test covering half of it

TDD §8:

> *"The remaining gap is the full round lifecycle (lobby→countdown→racing→finished) with standings
> order and join-mid-race → spectate."*

`apps/server/src/rooms/run-room.test.ts:105` (committed):

    test( 'a countdown joiner races from a clean grid slot; racing and finished joiners spectate', async () => {

This test exercises exactly the join-mid-race → spectate path the doc calls a gap, for all three
post-lobby phases (countdown/racing/finished). `packages/shared/src/race/director.test.ts` separately
unit-tests the phase transitions the "full round lifecycle" clause refers to. Standings order is the
one piece of §8's claim with no test found.

**Impact:** minor — the doc overstates the test gap. Someone reading §8 to decide what to test next
would duplicate coverage that exists and might still miss standings order, the one part of the claim
that's still true.

**Suggested resolution:** doc moves — narrow §8's sentence to "standings order is untested"; drop the
join-mid-race/spectate and phase-lifecycle clauses.

---

## 3. Stale pointers and numbers

| TDD says | Reality | Where |
|---|---|---|
| §3 routes: `/`, `/test-level`, `/game/:roomId` only | `routes.ts` also has a dev-only `/beat-deck` route and a `/test-level/edit` child route, gated by `process.env.NODE_ENV === 'production'` | `apps/client/app/routes.ts:1-13` |
| §5 `TrackDescriptorState` = `{ kind, seed, tier, length, levelId }` | class also carries `blockDensity`, `gapChance`, `gen` (`TrackGen`) — three fields the doc's shape omits | `packages/shared/src/schema.ts` (committed), `TrackDescriptorState` class |
| §5 `PlayerState` ASCII diagram lists ~24 fields | `CORE_PLAYER_FIELDS` alone has 41 keys (`slots`, `boostTimer`, `shielded`, `shieldTimer`, `tugTimer`, `slowTimer`, `towTimer`, `tugAnchorZ`, `portalHops`, `strafeHeld`, `kickLeft`, `kicking`, `glideTimer`, `bestZ` are all missing from the doc), before any feature-registry additions | `packages/shared/src/player-fields.ts:13-56` |

---

## What to do with this

Nothing here is fixed. 2.1 is the one worth taking first: TDD §3/§4 describe a client architecture that
predates the whole RFC-349 frame-scheduler/feature-module system, which is now mostly landed
(S0–S3, S8, S14–S20). Everything else in this list — the power-up roster (1.2, 2.2), the primitive
count (2.3), and the non-goals that already shipped (2.4, 2.5, 2.6) — reads like drift from the same
underlying cause: **the TDD was last written for the pre-power-up, pre-scheduler client**, and nothing
has folded the RFC-349 work or the power-up ADRs (009/014/015/017/022/026) back into it since.
