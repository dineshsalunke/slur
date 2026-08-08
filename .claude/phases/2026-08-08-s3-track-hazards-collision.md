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

---

# S3 — PREP (implement spec for background agent)

Build order = 5 commits, each ends green (`pnpm typecheck && pnpm build`). Shared-first: the sim +
track land and compile before any caller changes. **Do NOT touch `/solo`** (S1) or the S2 net
substrate beyond the two `simulate()` call-sites.

## Keystone (locked): continuous x-intervals
A segment expresses floor as **x-intervals** (`{x0,x1,y}`), gaps = uncovered x, blocks = AABBs.
Movement stays S1-continuous. Rendering still instances (unit box, per-instance **scale** = span size).

## Determinism constraints (non-negotiable — a desync = the game breaks)
- **Per-segment seeding, O(1):** `segmentAt(seed,i)` seeds a *local* RNG from `hash(seed,i)` — it must
  NOT advance one global stream (that would make `segmentAt` O(i) and non-random-access). Each segment
  is independently reproducible.
- **Integer/float only — NO transcendentals in generation.** `Math.sin/cos/tan/pow` can differ by an
  ULP across JS engines (browser client vs Node server) → divergent geometry → divergent deaths. Keep
  generation to `Math.imul`/int ops/`+-*/`/compare. (mulberry32 is all int ops — safe.)
- Ship→segment index is pure: `segIndexForZ(z) = Math.floor(z / SEG_LEN)`.

## C1 — `@slur/shared` track core (pure, no callers yet)

**`sim/rng.ts`** — seeded PRNG + hash. `mulberry32` (canonical, public-domain — *verify the exact
constants against bryc's PRNG reference at implement, add a determinism unit test*; do NOT ship from
memory, per NN-2):
```ts
export function mulberry32(a: number): () => number { /* int-ops PRNG, returns [0,1) */ }
export function hash2(seed: number, i: number): number { /* mix seed+i → uint32 for per-segment RNG */ }
```

**`sim/track.ts`** — types + generator + fairness + constants:
```ts
export interface FloorSpan { x0: number; x1: number; y: number }      // solid floor over [x0,x1] at height y
export interface Block     { x0: number; x1: number; y0: number; y1: number } // lethal AABB (x×y) over the seg's z-range
export interface Segment {
  index: number; z0: number; z1: number;   // world z-range [z0, z1)
  floors: FloorSpan[];                       // gaps = x not covered by any span
  blocks: Block[];
  isFinish: boolean;
}
export interface Track {
  seed: number; finishZ: number;
  segmentAt(i: number): Segment;
  segmentAtZ(z: number): Segment;
}
export function makeTrack(seed: number): Track   // closure bound to seed — this is the `track` param
```
- **Start safe:** segments `i < START_SAFE` = full-width flat floor, no blocks (spawn/accel zone).
- **Fairness (baked in, derived tuning):** gap width ≤ `MAX_GAP` (derived from `DEFAULT_JUMP` +
  `maxCruise` air-distance × safety 0.8); height step ≤ jumpable rise; **always ≥1 continuous passable
  x-corridor** entry→exit (no block+gap combo that walls the segment). Assert in the determinism test.
- **Track constants** (commented, tunable): `SEG_LEN`, `TRACK_SEGMENTS` (→ `finishZ`), lane-width range,
  block density, height-step set.

## C2 — sim fields + collision + `simulate()` signature (compiles; callers updated minimally)

**`sim/types.ts`** — append to `SimShip` + `spawnShip()`:
`dead:boolean`, `respawnTimer:number`, `invulnTimer:number`, `lastSafeX:number`, `lastSafeZ:number`,
`finished:boolean`. (Not `finishTime` — that's server-stamped, PlayerState-only.)

**`constants.ts`** — new commented tuning: `deathY` (below lowest floor), `RESPAWN_DELAY`,
`INVULN_TIME`, `respawnSetback` (z back-step), `respawnVz`, + the derived `MAX_GAP`/`MAX_STEP` used by
the generator. Difficulty = a config edit (project convention).

**`sim/step.ts`** — the S3 swap:
```ts
export function resolveCollisions(s: SimShip, track: Track, t: FlightTuning): void {
  const seg = track.segmentAtZ(s.z);
  // FLOOR: highest span covering s.x with span.y <= s.y + STEP_TOL (can't clip up through a ledge)
  //   found & s.y <= floorY → land (y=floorY, vy<0→0, grounded, jumpsUsed=0, update lastSafeX/Z) else grounded=false
  // DEATH: s.y < t.deathY (fell through a gap)  → markDead(s,t)
  // DEATH: any seg.block AABB overlaps (s.x,s.y) → markDead(s,t)   [skip while invulnTimer>0]
  // EDGE: keep S1 ±halfWidth stop (edges don't kill)
  // FINISH: seg.isFinish && s.z >= track.finishZ && !s.finished → s.finished = true
}
function markDead(s, t){ s.dead = true; s.respawnTimer = t.RESPAWN_DELAY; s.vx=s.vy=s.vz=0 }
function respawn(s, t){ s.dead=false; s.x=s.lastSafeX; s.z=s.lastSafeZ - t.respawnSetback; s.y=…; s.vz=t.respawnVz; s.invulnTimer=t.INVULN_TIME; s.grounded=true; s.jumpsUsed=0 }

export function simulate(s, input, dt, t, track): void {   // ← track param added
  if (s.dead) { s.respawnTimer -= dt; if (s.respawnTimer <= 0) respawn(s,t); return }
  if (s.finished) { /* freeze or coast — TBD trivial */ }
  applyLongitudinal; applyStrafe; applyJump; applyGravity; integrate;
  resolveCollisions(s, track, t);
  if (s.invulnTimer > 0) s.invulnTimer -= dt;
}
```
Death is **predicted locally + reconciled** — deterministic track + inputs ⇒ client & server kill on the
same tick, so no rubber-band. Server stays authority (can't cheat a wall).

**`schema.ts`** — ⚠ **APPEND ONLY** (declaration order = wire format). After `connected`, append:
`dead:boolean`, `respawnTimer:float32`, `invulnTimer:float32`, `lastSafeX:float32`, `lastSafeZ:float32`,
`finished:boolean`, `finishTime:float32` (server-stamped; extra field beyond SimShip — structural match
allows extras). `RunState.seed` already exists — no change.

## C3 — server wire-in (`apps/server/src/rooms/run-room.ts`)
`const track = makeTrack(this.state.seed)` once at room init; pass `track` into every `simulate(...)`
call in the fixed-step loop. When a player's `finished` flips true, stamp `finishTime` from the room's
authoritative elapsed/tick. (Multiplayer standings/results = S4 — S3 only sets the per-player flag+time.)

## C4 — client predict/reconcile wire-in (`apps/client/app/net/prediction.ts` + `game/net-canvas.tsx`)
Build `const track = makeTrack(room.state.seed)` (seed already synced). Pass `track` into `simulate()`
in **both** the predict tick and the reconcile **replay** loop. Remote ships: unchanged (interpolated) —
but read `dead` to hide/ghost a derezzed remote.

## C5 — client rendering (`apps/client/app/game/scene/…`) + deps
**Deps to add first** (VERIFY exact versions at implement via `npm view … peerDependencies`, respect
three `<0.186`, honor the `minimumReleaseAge` gate): `@react-three/postprocessing` (≈3.0.4, wraps
`postprocessing` ≈6.39.4, peer three `>=0.168 <0.186`). Add both to the catalog + client dep.
- **`TrackView`** — each frame (imperative `useFrame`, NO React state): compute visible Z-window
  `[camZ-BACK, camZ+AHEAD]` → segment indices → gather `floors`/`blocks` → drive two pooled
  `<Instances limit=…>` (floors, blocks); per-instance **position + scale** from span/AABB. Pool by
  `range`, never remount per frame (r3f.md hot-path rules).
- **`FinishGate`** — one emissive arch/plane at `track.finishZ`.
- **First Bloom** — single global `<Bloom mipmapBlur>` in `<EffectComposer multisampling={0}>`; neon via
  HDR `emissive`+`emissiveIntensity>1`+`toneMapped={false}`. All glowing surfaces opt in.
- **Death VFX** — minimal for core loop (hide/derezz-flash local ship while `dead`); full TRON derezz = S6.
- Reuse S1 chase camera. Track is **local-only** (from seed) — never reconciled.

## Verification the agent must run (report results)
1. **Determinism test** (shared): `segmentAt(seed,i)` stable across calls; two `makeTrack(seed)` byte-identical
   for i∈[0,N); fairness invariants hold (gap≤MAX_GAP, ≥1 passable corridor) for many seeds. `pnpm typecheck && pnpm build` green after EACH commit.
2. Boot server + **two** clients on `/run`: both see the **same** track layout (determinism across
   client/server); can **die** on a gap and on a block; **respawn** at last-safe; **cross the finish** →
   `finished=true` + `finishTime` set. Remotes render each other's death.
3. **Do NOT touch `/solo`.** Report: files changed, deviations, exact dep versions installed, what
   remains for the human feel-gate.

## Out of scope for the agent (do NOT build)
Moving hazards, ring-gates, curves, extra obstacle shapes (S3.5/S5); lobby/results/standings/restart
(S4 — S3 sets only the per-player `finished`/`finishTime`); lag comp/hermite/error-blend (out per S2);
full TRON derezz VFX (S6); Survival endless (S7 — but `segmentAt` already supports unbounded `i`).

---

# S3 — RECONCILE (as-built, 2026-08-08)

**Status: core loop IMPLEMENTED + a heavy bug/feel-fix pass. typecheck + build + 11/11 shared tests
GREEN. Human feel-gate NOT yet signed off** (resume: confirm gaps render on a *fresh* load + jump/feel,
then tune). The background agent built C1–C5 (commits `520f675..bec32fd`); the fixes below came from
live playtesting in this session and are uncommitted-at-time-of-writing (grouped into the commits noted).

## The bugs playtesting surfaced (and their fixes)

1. **Client/server TRACK DESYNC — the root cause of "ship falls at ~120 with no visible gap."**
   `NetCanvas` built the track from `room.state.seed` read *during render*. But (a) Colyseus state
   mutations do NOT re-render React, and (b) decoded state arrives *after* the join handshake
   (`colyseus.md`). So the client captured a **stale seed**, built a track that DIDN'T match the
   server's, never rebuilt it (until an unrelated HMR re-render — hence "gaps only appear after HMR"),
   and the server authoritatively killed the ship at hazards the client never drew. **Fix:** the seed
   is now acquired in the **route `clientLoader`** (awaits decode via `$(room.state).listen('seed')`)
   and passed to `NetCanvas` as a **stable prop** → track built once, matches server, ZERO reactive
   subscriptions at the Canvas-wrapping parent. `schema.seed` default → `0` (unseeded sentinel).
   *This was THE bug; the render tweaks below are real improvements but were not the cause.*

2. **"Height steps" were invisible death-traps → redesigned to JUMP-ONTO PLATFORMS (user's call).**
   The generator made steps up to `MAX_STEP`(0.8) tall while `stepTol`=0.3 only let you climb 0.3, and a
   step segment had NO floor at y=0 — so you fell into the void under a barely-visible ledge. Now a
   platform is a **full-width solid block** (`blocks:[{-HW,HW,0,H}]`) + a landable **top floor** at `H`;
   hit the face low → derezz, clear the lip → land on top. Block-death upper bound made **strict**
   (`s.y < b.y1`) so standing *on* the top is safe. Added `kind` to `Segment`; fairness test exempts
   platforms (passable-by-jump, not by corridor). Renders for free (existing block+floor instancing).

3. **Gap legibility + instanced-mesh vanishing.** Gaps rendered correctly (missing slabs) but
   foreshortened to nothing at the shallow chase angle; worse, **all instanced meshes were being
   frustum-culled** past ~z=120 (three caches an InstancedMesh bounding sphere once; we move instances
   every frame → stale volume). **Fix:** `frustumCulled={false}` on floor/block/rail/scenery + added
   **cyan edge-rails** that break at gaps (frame the track, make holes read).

4. **Ship model.** Loaded Quaternius CC0 `bob.gltf` via drei `useGLTF` + `<Clone>`. Scale + lift are
   DERIVED from measured accessor bounds (wingspan 10.5→~3.5u via `TARGET_WINGSPAN`; hull bottom lifted
   to y=0). Team-colour emissive beacon for local(cyan)/remote(magenta) legibility. **OPEN: confirm nose
   orientation** — `SHIP_FACING` is identity; flip to `[0,Math.PI,0]` if the nose faces the camera.

5. **Feel tuning** (`constants.ts`, all live-tunable): **jump** height 1→2.4, apex 0.42→0.34, descent
   0.3→0.26 (punchier + de-floated), and fixed a **dead variable-jump** (`minHeight` 1.5 > `height` made
   early-release never fire → every jump was max height; now 0.8). **strafe** accel 120→300, clamp
   200→80, damp 1→8 (snappier). `MAX_GAP` re-derives to 26.4 ≥ `SEG_LEN` 20 → fairness holds.

6. **`useEffect` audit + convention.** All 5 client effects reasoned 5× and justified in-place; the
   dev-HUD effect was refactored from `setState` to an imperative `textContent` ref write (zero
   re-renders). New rule in `react-router.md`: every `useEffect` MUST carry a justification comment.

## What remains (next session)
- **S3 human feel-gate** — fresh-load gaps visible? jump/strafe feel? platforms clearly jumpable?
- Tune: jump `JumpDesign`, strafe, platform frequency/height, `SHIP_FACING` orientation.
- Then S4 (session flow / lobby→results). Ship-model team-colour material pass belongs to S6.
