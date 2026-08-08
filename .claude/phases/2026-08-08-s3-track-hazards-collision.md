# S3 — Track, hazards, collision — IDEATE + BRAINSTORM

**Slice goal / done-when:** race a deterministic 3D hazard track from a seed — jump gaps, jump onto
height steps, dodge blocks, don't fall — die on mistakes, respawn, and cross a finish gate to win.
Built on the S2 substrate: collision runs inside the shared `simulate()`, so it **auto-networks with
no wire-protocol change**.

---

## IDEATE — locked (2026-08-08)

1. **Full 3D = variant (a): 3D world, global −Y gravity.** Genuine verticality (height steps, gaps),
   forward racing, gravity always world-down. **S1's tuned flight/jump model survives intact.**
   Rejected (b) track-relative / 6DOF tube-flying — it discards S1's global-gravity jump + camera and
   is really its own slice, not S3.
2. **Determinism via seed, not synced geometry.** Room state carries *one seed* (already present from
   S2). The entire track is *computed* from it by a seeded PRNG in `@slur/shared`, identically on
   client + server. Bandwidth = one integer. "Nothing computed unless it gives the same result on
   every client" → everything is computed, *deterministically*.
3. **Respawn on death** — the game is about enjoying + fighting while running; death is a setback, not
   a game-over. (Exact stakes/where/invuln → prep.)

---

## BRAINSTORM — decisions (2026-08-08)

### Ground truth (verified-this-session from `packages/shared/src/sim/step.ts`)
- Axes: **+Z forward** (throttle→`vz`), **+X lateral strafe** (continuous, `vx`, clamped to `±halfWidth`),
  **+Y up** (jump/gravity −Y).
- `resolveCollisions(s, t)` is a pure mutator with a literal `// S3 replaces this` marker (line 69). It
  models an *infinite* floor at `y=0` + edge walls, and **owns the `grounded`/`jumpsUsed` reset that
  makes jump work** — the S3 replacement MUST preserve that contract or jump breaks.

### D1 — Track = a PURE FUNCTION `segmentAt(seed, i)`, not a materialized array
An ordered sequence of segments, each deterministically derived from `(seed, index)`. **No stored
geometry** — collision and rendering both call `segmentAt` on demand.
- *Why a function, not an array:* **S7 Survival (endless) falls out for free** — finite Race = indices
  `0..N`, endless = unbounded `i`. A pre-built array would force an S7 rewrite. Costs nothing now.
- *Rejected:* spline path (curving fights global-down gravity + messy collision); continuous noise
  field (collision-nasty, can't author *fair* hazards). The segment function is trivially
  deterministic, O(1) to query, and maps 1:1 to instanced rendering.

### D2 — The load-bearing signature change
`simulate()` and `resolveCollisions()` gain a `track` param (the `segmentAt` closure / a `Track`
handle bound to the seed):
```
resolveCollisions(s, t)         → resolveCollisions(s, track, t)
simulate(s, input, dt, t)       → simulate(s, input, dt, t, track)
```
Client predicts with its track; server authorities with the *identical* track. Same seed + same
generator + same inputs ⇒ **same deaths** → reconcile just works. This is *why* determinism is
non-negotiable, made concrete.

### D3 — Collision model (arcade, high-stakes)
Ship `z → segmentIndex` (O(1)); check only the 1–2 overlapping segments — no spatial hash.
- **Floor per-tile:** where the segment has floor at the ship's lateral position, land at the tile
  height → reset `grounded`/`jumpsUsed` (preserve S1 contract). Height steps = tiles at different `y`.
- **Gap (no floor tile here):** no floor → ship keeps falling → **DEATH** below `deathY`.
- **Obstacle block:** AABB overlap → **DEATH / derezz** (user call: high stakes).
- **Track edge:** **STOP / slide along** (keep S1's `±halfWidth` behavior) — edges don't kill, else
  strafing is punishing.
- **Finish gate** at `z = trackLength`: crossing → `finished` + `finishTime`.

### D4 — Death = server-authoritative, client-PREDICTED
Because collision is deterministic + input-driven, the client predicts death and it reconciles exactly
(no rubber-banding), while the server stays authority (can't cheat through a wall). New **sim fields**
(added to `SimShip`, mirrored in `PlayerState` schema per the S2 structural-match contract):
`dead`, `respawnTimer`, `finished`, `finishTime`.

### D5 — Respawn
On death: reposition to the last safe segment (center of a guaranteed-passable lane), brief invuln,
respawn timer; velocity reset (fraction). **Stakes = the time you lost.** Exact numbers = tuning (prep).

### D6 — Generation fairness (deterministic AND always-completable)
Pure-random `segmentAt` will eventually emit an impossible segment (gap > max jump, or blocks filling
every lane). The generator carries constraints, baked in regardless of scope:
- gap width ≤ derived max-jump distance (from S1's `DEFAULT_JUMP`),
- always ≥1 laterally-passable lane,
- no all-lane wall.
Keep these as **derived tuning** (like S1's jump) so difficulty is a config edit, not a code change.

### D7 — Rendering (per `conventions/r3f.md`)
- **Instanced** tiles + one `<Instances>` per hazard archetype; drive per-instance transforms from a
  windowed set of segments around the camera (only render/cull a Z-window — LOD-friendly for a long
  track).
- **First bloom pass:** single global `<Bloom mipmapBlur>` in `<EffectComposer multisampling={0}>`;
  neon via HDR `emissive` + `emissiveIntensity>1` + `toneMapped={false}`.
- Reuse S1's chase camera. Track segments are **local-only** (generated client-side from
  `room.state.seed`), never reconciled tile-by-tile (per `ecs.md`).

---

## SCOPE

**IN (Core loop):** straights, gaps, height steps, edge walls, obstacle blocks, finish gate,
death + respawn, instanced rendering, first global Bloom, generation fairness constraints.

**OUT (deferred):** moving hazards, ring-gates, curved/banking track, multiple obstacle shapes
(→ S3.5 / S5 combat); full standings/results/lobby (→ S4); lag compensation / hermite interp
(explicitly out per S2). Survival endless mode (→ S7) — but D1's `segmentAt` keeps the door open.

---

## OPEN FOR PREP (decide before code)

1. **Lateral model:** S1 strafe is *continuous* x. How does a segment express floor coverage — x
   intervals (`floor spans x∈[-3,1]`) vs. discretized lanes mapped to x-ranges? Shapes the schema.
2. **Segment schema:** exact fields of `segmentAt(seed,i)` output (floor spans, floor height,
   hazards[], isFinish). Segment length; track length N.
3. **PRNG choice** — pin the exact seeded generator (candidate: mulberry32; confirm at prep, not from
   memory) + where it lives (`@slur/shared/src/sim/track.ts` or `rng.ts`).
4. **New sim fields** wiring: `dead`/`respawnTimer`/`finished`/`finishTime` in `SimShip.spawnShip` +
   the `PlayerState` schema mirror; how prediction/reconcile handle the `dead` transition.
5. **Tuning constants:** `deathY`, respawn point rule, invuln duration, respawn velocity, derived
   max-jump-distance for gap constraint. All commented tuning fields (per project convention).
6. **Render windowing:** `<Instances limit>` sizing + the Z-window cull range.
