# Reference — cuberun (endless R3F runner)

> Source: https://github.com/akarlsten/cuberun (branch `main`, last pushed 2023-10-12, read 2026-08-06).
> Stack: `three ^0.129.0`, `@react-three/fiber ^6.2.2`, `@react-three/drei ^5.3.1`, `zustand ^3.5.2`, React 18 alpha, CRA (`react-scripts 4.0.3`).
>
> This is a **technique reference**, not a copy source. cuberun uses zustand + refs + per-component `useFrame`. SLUR uses koota ECS + a shared deterministic sim. Read the math and the "why", then re-express it in our systems. All snippets are trimmed to load-bearing lines.

---

## Overview (state model + render loop)

cuberun has **no central tick loop and no data-oriented store for hot state**. It splits state into two very different buckets:

- **`useStore` (zustand)** — cold/UI state only: `score`, `level`, `gameOver`, `gameStarted`, `controls: {left, right}`, plus `createRef()` holders for the `ship`, `camera`, `directionalLight` etc. so any component can reach the same Object3D. Changing these triggers React re-renders (used for HUD, menus). Source: `src/state/useStore.js`.
- **`mutation` (a plain exported object)** — hot per-frame state that must NOT cause React renders: `gameSpeed`, `desiredSpeed`, `horizontalVelocity`, `colorLevel`, `gameOver`, `globalColor`. This is a deliberate escape hatch — mutated directly inside `useFrame`, read by any component, zero reactivity cost.

```js
// src/state/useStore.js — two buckets
const useStore = create((set, get) => ({
  set, get, score: 0, level: 0, gameOver: false, gameStarted: false,
  controls: { left: false, right: false },
  camera: createRef(), ship: createRef(),   // shared Object3D handles
  incrementLevel: () => set(s => ({ level: s.level + 1 })),
}))
const mutation = {           // hot state — mutated in useFrame, never setState
  gameSpeed: 0.0, desiredSpeed: 0.0, horizontalVelocity: 0,
  colorLevel: 0, gameOver: false, globalColor: new Color()
}
export { useStore, mutation }
```

**Render loop:** there is no single loop. Each dynamic component registers its own `useFrame((state, delta) => …)` callback and R3F runs them all every frame. Ordering is by mount order in `CubeWorld.js`. Responsibilities are sharded:
- `GameState.js` — accelerates `gameSpeed` toward `desiredSpeed`, writes `score`.
- `Ship.js` — integrates ship position, drives camera, animates engine FX.
- `Ground.js` — recycles the two ground planes, handles level color.
- `Cubes.js` — collision + obstacle recycling, writes the instanced matrix.

**Key architectural note for us:** everything is measured in **negative Z**. The ship flies toward `-Z` forever; `ship.position.z` only ever decreases (score = `|z|`). Speed lives in `mutation.gameSpeed` (~0.8 initial, +0.2 per level) and every motion term is multiplied by `delta * 165` to normalize to a 165 fps reference (frame-rate-independent). Source: `CubeWorld.js`, `GameState.js`.

**Frame-rate normalization idiom (used everywhere):** `value += rate * delta * 165`. The `165` is just "the fps the constants were tuned at", so `delta*165 ≈ 1` on a 165Hz display and scales correctly elsewhere. We don't need this — our deterministic sim runs a fixed timestep — but it explains every magic `* 165` in their code.

---

## 1. Sense of speed — endless ground/grid

**Technique — two-plane treadmill (leapfrog).** The ground is **not** infinite and **not** scrolled by UV offset. It's exactly **two** 1000×1000 plane meshes (`PLANE_SIZE = 1000`), each textured with a repeating neon grid. The ship moves forward (−Z); when the ship has driven ~10m past the far edge of the plane behind it, that plane is teleported `MOVE_DISTANCE = 2 * PLANE_SIZE` further ahead (more negative Z), landing in front. The two planes leapfrog each other forever, so the player always stands on one and sees the next. Speed is conveyed by (a) the ship's actual Z translation past the fixed grid texels, (b) the grid texture repeating (`RepeatWrapping`, `repeat = 50×50`) giving dense reference lines, and (c) engine FX + camera. Every N leapfrogs the level increments and `desiredSpeed` rises, so the treadmill visibly quickens.

```js
// src/components/Ground.js — the leapfrog
const MOVE_DISTANCE = PLANE_SIZE * 2
const moveCounter = useRef(1)

useFrame((state, delta) => {
  // "has the ship gone ~10m past the trailing edge of plane #moveCounter?"
  if (Math.round(ship.current.position.z) + PLANE_SIZE * moveCounter.current + 10 < -10) {
    // guard so a single pass only fires the move once
    if (moveCounter.current === 1 || Math.abs(ship.current.position.z) - Math.abs(lastMove.current) <= 10) {
      if (moveCounter.current % 6 === 0) {            // every LEVEL_SIZE(6) planes → next level
        incrementLevel(); mutation.desiredSpeed += GAME_SPEED_MULTIPLIER // +0.2 speed
        if (++mutation.colorLevel >= textures.length) mutation.colorLevel = 0
      }
      // alternate which of the two planes jumps ahead by 2*PLANE_SIZE
      if (moveCounter.current % 2 === 0) { groundTwo.current.position.z -= MOVE_DISTANCE; lastMove.current = groundTwo.current.position.z }
      else                               { ground.current.position.z    -= MOVE_DISTANCE; lastMove.current = ground.current.position.z }
    }
    moveCounter.current++
  }
})
```

Texture setup (once, in `useLayoutEffect`): `texture.wrapS = wrapT = RepeatWrapping; texture.repeat.set(TEXTURE_SIZE, TEXTURE_SIZE)` where `TEXTURE_SIZE = PLANE_SIZE * 0.05 = 50`. The neon grid + `emissiveMap` (interpolated `emissiveIntensity`) is what makes it read as glowing and fast in the dark.

**Source:** `src/components/Ground.js` — https://github.com/akarlsten/cuberun/blob/main/src/components/Ground.js · raw: https://raw.githubusercontent.com/akarlsten/cuberun/main/src/components/Ground.js. Constants in `src/constants/index.js`.

### How this maps to SLUR
- **Adopt the leapfrog idea, invert the direction if needed.** cuberun moves the *ship* and teleports *planes* back into view — this is already the "moving ship + recycled scenery" model, NOT a parked-ship treadmill (the ship's Z genuinely marches to −∞). That matches SLUR's real-world-Z ship. Good: no coordinate reset needed on the ship.
- **Recycling rule → ECS system.** Replace the `moveCounter`/leapfrog with a deterministic tiling system: for each ground tile entity, `if (tile.z - ship.z) > threshold: tile.z -= N * TILE_SIZE`. Because our sim is deterministic and shared, base the recycle decision purely on ship Z and tile index (integer math), not on accumulated float counters — that keeps every client identical. Avoid cuberun's `moveCounter.current++` stateful guard; derive tile position as `f(shipZ)` so it's stateless and reproducible.
- **Two planes is the minimum; pick tile count from view distance / fog.** cuberun gets away with 2 planes because of aggressive fog/skybox hiding the seam. Choose SLUR tile count so the far edge is always inside fog before it recycles.
- **Grid texture repeat is free speed.** A tiling emissive grid (`RepeatWrapping`, repeat ≈ size×0.05) is the cheapest speed cue; carry that over regardless of ECS.

---

## 2. Obstacles / scenery streaming & recycling

cuberun has **two** obstacle systems:

**(A) Random instanced cubes (`Cubes.js`) — the streaming filler.** One `instancedMesh` of `CUBE_AMOUNT = 60` boxes. Positions live in a plain JS array `cubes[]` (x,y,z), NOT in the scene graph. Each frame it (1) checks collision against the ship, (2) if a cube is now *behind* the ship (`cube.z - ship.z > 15`) it recycles that cube far ahead with a fresh random x, and (3) writes every cube into the instance matrix via a shared `Object3D` dummy. Recycled cubes spawn at `y = -CUBE_SIZE` (below ground) and **rise** into place (`cube.y += delta*100` up to `CUBE_SIZE/2`) so they appear to grow out of the grid instead of popping in — a cheap, effective streaming illusion. There's a "diamond" carve-out region where spawn distance changes so cubes don't overlap the hand-authored set-pieces.

```js
// src/components/Cubes.js — pooled, recycled, instanced
const dummy = useMemo(() => new Object3D(), [])
const cubes = useMemo(() => Array.from({length: CUBE_AMOUNT}, () => ({
  x: randomInRange(negativeBound, positiveBound), y: 10, z: -900 + randomInRange(-400, 400)
})), [])

useFrame((state, delta) => {
  cubes.forEach((cube, i) => {
    // cheap reject, then real distance check → game over
    if (cube.z - ship.current.position.z > -15) {
      if (distance2D(ship.current.position.x, ship.current.position.z, cube.x, cube.z) < 12) {
        mutation.gameSpeed = 0; mutation.gameOver = true
      }
    }
    // recycle once behind the ship: teleport far ahead, new lane, start below ground
    if (cube.z - ship.current.position.z > 15) {
      cube.z = ship.current.position.z - PLANE_SIZE + randomInRange(-200, 0)
      cube.y = -CUBE_SIZE
      cube.x = randomInRange(negativeBound, positiveBound)
    }
    // rise out of the floor so it doesn't pop in
    if (cube.y < CUBE_SIZE/2) cube.y = Math.min(CUBE_SIZE/2, cube.y + delta*100)

    dummy.position.set(cube.x, cube.y, cube.z)
    dummy.updateMatrix()
    mesh.current.setMatrixAt(i, dummy.matrix)   // one draw call for all 60
  })
  mesh.current.instanceMatrix.needsUpdate = true
})
```

**(B) Fixed set-pieces (`generateFixedCubes.js`, rendered by `FixedCubes`/`CubeTunnel`/`Walls`).** Hand-authored formations — a pyramid "wall" with a gap, a tunnel of paired cubes, and a "diamond" — generated as coordinate arrays by pure functions (`makeWall`, `makeTunnel`, `makeDiamond`, composed by `generateDiamond`). These are deterministic given `level` (positions are offset by `-(level * PLANE_SIZE * LEVEL_SIZE)`), so every level lays down the same designed obstacle at a new Z.

```js
// src/util/generateFixedCubes.js — deterministic authored formation (pyramid wall w/ gap)
export function makeWall(hasGap = true, gapSize = 3) {
  const coords = [...Array(segments)].map((_, i) => ({
    x: negativeBound + i * CUBE_SIZE,
    y: CUBE_SIZE / 2,
    z: i <= segments/2 ? -(i*CUBE_SIZE) : -(segments*CUBE_SIZE) + i*CUBE_SIZE, // pyramid V shape
  }))
  if (hasGap) coords.splice(segments/2 - Math.floor(gapSize/2), gapSize)      // punch a passable gap
  return coords
}
```

**Collision** is 2D only (X/Z, ignoring Y) via `distance2D`, gated behind cheap bounding rejects so the sqrt runs rarely. `randomInRange(from,to) = Math.floor(Math.random()*(to-from+1)) - to` (note: their impl is quirky/biased — don't copy it verbatim).

**Source:** `src/components/Cubes.js`, `src/util/generateFixedCubes.js`, `src/util/distance2D.js`, `src/util/randomInRange.js` — e.g. https://github.com/akarlsten/cuberun/blob/main/src/components/Cubes.js.

### How this maps to SLUR
- **Adopt object pooling + recycle-behind, express as an ECS system.** Keep a fixed pool of obstacle entities; a `recycleObstacles` system reads ship Z and moves any entity with `z - shipZ > margin` to `shipZ - spawnDistance`. This is exactly the "moving ship + recycled scenery" model the task called out — cuberun already does this, so it's a direct fit.
- **Determinism is the hard difference.** cuberun uses `Math.random()` for lane placement — unacceptable for our shared deterministic sim. Replace with a **seeded PRNG keyed on obstacle index + recycle count** (or precompute a shared spawn table) so all clients and the server agree on every obstacle position. The fixed set-pieces are already deterministic-by-level — mirror that: derive positions as `f(level, index)`.
- **Adopt the "rise out of the floor" reveal** — cheap and hides pop-in; trivially an ECS lerp on Y.
- **Instanced rendering is a render concern, keep it out of the sim.** In koota, store obstacle transforms as components; a render system pushes them into an `InstancedMesh` matrix exactly like cuberun's dummy loop. One draw call for the whole field.
- **Collision: 2D X/Z distance with cheap rejects is a fine model** for a ground-plane runner. But run it in the deterministic sim (authoritative), not in the render `useFrame`.

---

## 3. Ship movement

**Technique — direct kinematic integration, no physics engine.** The ship is a single `group` whose transform is written every frame. Forward motion is constant (speed-driven); lateral motion is a velocity that eases toward a target based on held keys; turns are faked with cosmetic rotations; idle "jitter" via sines keeps it alive.

```js
// src/components/Ship.js (useFrame) — trimmed
const accelDelta = 1 * delta * 2
const { left, right } = controlsRef.current   // read from zustand.subscribe, not React state

ship.current.position.z -= mutation.gameSpeed * delta * 165          // constant forward march (−Z)
ship.current.position.x += mutation.horizontalVelocity * delta * 165 // lateral = velocity * dt

// turn feel is purely cosmetic rotation of the model:
ship.current.rotation.z = mutation.horizontalVelocity * 1.5          // bank/roll into the turn
ship.current.rotation.y = Math.PI - mutation.horizontalVelocity * 0.4// slight yaw
ship.current.rotation.x = -Math.abs(mutation.horizontalVelocity)/10  // slight pitch

// idle life: small sine bob + roll so it never looks static
const slow = Math.sin(time*5)
ship.current.position.y -= slow/200
ship.current.rotation.z += Math.sin(time*4)/100

// input → velocity easing
if ((left && right) || (!left && !right)) {   // no net input → decay velocity toward 0
  if (v < 0) v = Math.min(0, v + accelDelta)
  if (v > 0) v = Math.max(0, v - accelDelta)
}
if (left  && !right) v = Math.max(-0.7, v - accelDelta)   // accelerate left, clamped
if (!left &&  right) v = Math.min( 0.7, v + accelDelta)   // accelerate right, clamped
// (v is mutation.horizontalVelocity)
```

Notable choices: input is read via `useStore.subscribe(... state.controls)` into a ref (`controlsRef.current`) so keypresses never re-render the R3F tree. Lateral velocity is clamped to ±0.7 and eased both ways (accel while held, decel to zero when released) — this ease is the whole "feel". Banking is *not* physical, just `rotation.z ∝ velocity`. Forward speed comes entirely from `mutation.gameSpeed`. Keys map A/←, D/→ (`KeyboardControls.js`).

**Source:** `src/components/Ship.js` (movement block) + `src/components/KeyboardControls.js` — https://github.com/akarlsten/cuberun/blob/main/src/components/Ship.js.

### How this maps to SLUR
- **Adopt the velocity-easing model, move it into the deterministic sim.** `position += velocity * dt`, `velocity` eased toward a target from input, clamped — this is a great, tunable "flight feel" and is trivially deterministic under a fixed timestep. Keep accel/decel/clamp as sim constants.
- **Separate sim state from cosmetic pose.** cuberun conflates them (rotation.z is computed in the same block). For SLUR: the sim owns `position` + `velocity`; the **banking/pitch/jitter is a client-side render flourish** derived from velocity and should live in a render system, not the authoritative sim (it must not affect collision or netcode). This cleanly splits "flight feel physics" (shared) from "flight feel juice" (local).
- **Input path:** cuberun's subscribe-into-ref avoids React churn; our ECS already decouples input from rendering, so just feed key state into an input component each tick. Keep the "both keys / no keys → decay to zero" rule; it feels good.
- **Do NOT copy the `* 165`** — under our fixed timestep, express constants in real units (m/s, m/s²).
- **Idle sine jitter is pure juice** — safe to add locally for liveliness; keep it out of the sim.

---

## 4. Camera follow

**Technique — hard-locked offset, not a spring.** The camera is a `PerspectiveCamera` (fov 75) that is **snapped** every frame to a fixed offset behind and above the ship. There is no smoothing/lerp and no lookAt in the loop — orientation is a fixed `rotation.y = Math.PI` (facing −Z, same as the ship) set once, re-asserted each frame. Because the ship's own motion is already smooth, the rigidly-attached camera reads as a stable chase cam. Initial framing is set in `useLayoutEffect`; the per-frame block just tracks position.

```js
// src/components/Ship.js
useLayoutEffect(() => {                    // one-time initial framing
  camera.current.position.set(0, 4, -9)
  camera.current.lookAt(ship.x, ship.y, ship.z + 10) // aim slightly above/ahead of ship
  camera.current.rotation.z = Math.PI
}, [])

useFrame(() => {                           // per-frame: rigid offset follow
  camera.current.position.z = ship.current.position.z + 13.5  // trail 13.5 behind (+Z = behind, since travel is −Z)
  camera.current.position.y = ship.current.position.y + 5     // 5 above
  camera.current.position.x = ship.current.position.x         // stay centered on ship X (no lateral lag)
  camera.current.rotation.y = Math.PI                         // keep looking down −Z
})
```

Key point: X follows the ship **instantly** (`camera.x = ship.x`), so strafing does not swing the camera — the world slides under a centered ship. The camera and ship refs are shared through `useStore` so other systems (lights, FX) can read them.

**Source:** `src/components/Ship.js` (`useLayoutEffect` + camera lines in `useFrame`).

### How this maps to SLUR
- **Start with the rigid offset — it's the right default for a runner** and it's cheap. Snap camera to `ship + (0, +5, +trail)` each render frame.
- **This is a pure render/client concern — keep camera entirely out of the deterministic sim.** Camera never affects gameplay; each client can frame it however it likes (important for multiplayer: everyone follows *their own* ship).
- **Consider adding what cuberun lacks: light positional/X smoothing.** cuberun's instant X-follow means the ship is always dead-center; a small lerp on camera X (or a slight look-ahead toward velocity) gives more speed sensation and turn readability. Adapt, don't just adopt — cuberun deliberately kept it rigid for arcade simplicity.
- **Look-ahead by velocity** (aim the camera slightly toward where the ship is heading) is a cheap upgrade over cuberun's fixed `rotation.y = π`, and pairs well with our velocity-based movement.

---

## How this maps to SLUR (summary — adopt vs adapt)

| Topic | cuberun approach | SLUR: adopt / adapt |
|---|---|---|
| **State split** | zustand (cold) + plain `mutation` object (hot, non-reactive) | **Adapt.** koota ECS *is* our hot store; keep UI/menu state in a light reactive store. cuberun's "don't setState in the loop" lesson still holds. |
| **Render loop** | sharded per-component `useFrame`, order = mount order | **Adapt.** One deterministic sim tick (fixed dt) is authoritative; R3F render systems read ECS and draw. Don't shard authoritative logic across `useFrame`. |
| **Endless ground** | 2 planes leapfrog by `2*PLANE_SIZE` when behind ship | **Adopt** the moving-ship + recycled-tile model (already our model). Make recycle stateless `f(shipZ)`, seeded, fog-hidden seam. |
| **Obstacles** | 60 instanced cubes, recycle-behind + rise-from-floor; authored set-pieces per level | **Adopt** pooling + recycle + instancing. **Adapt** RNG → seeded/deterministic; run collision in sim, not render. |
| **Movement** | `pos += vel*dt`, eased clamped lateral velocity, cosmetic banking | **Adopt** velocity easing (in sim). **Split** banking/jitter into local render juice. Drop `*165`, use real units + fixed dt. |
| **Camera** | rigid offset snap, instant X follow, fixed heading | **Adopt** as default; **adapt** with slight X-lerp + velocity look-ahead. Keep 100% client-side (per-player). |

**The one big structural difference to keep in mind:** cuberun already uses a *moving ship in real −Z* (not a parked-ship treadmill), so its scenery-recycling model transfers directly to SLUR's real-world-Z design. The only true rewrites are (1) making every recycle/spawn **deterministic + seeded** for our shared sim, and (2) **separating authoritative sim state from cosmetic render juice**, which cuberun freely mixes because it's single-player and non-networked.

---

## Source files read (paths + URLs)

Branch `main`, commit state as of push 2023-10-12, read 2026-08-06. Raw base: `https://raw.githubusercontent.com/akarlsten/cuberun/main/`.

- `package.json` — dep versions — https://github.com/akarlsten/cuberun/blob/main/package.json
- `src/state/useStore.js` — zustand store + `mutation` hot object — https://github.com/akarlsten/cuberun/blob/main/src/state/useStore.js
- `src/constants/index.js` — `PLANE_SIZE`, `CUBE_*`, speeds, bounds — https://github.com/akarlsten/cuberun/blob/main/src/constants/index.js
- `src/components/CubeWorld.js` — Canvas + component graph (loop composition) — https://github.com/akarlsten/cuberun/blob/main/src/components/CubeWorld.js
- `src/components/GameState.js` — speed accel + score, per-frame globals — https://github.com/akarlsten/cuberun/blob/main/src/components/GameState.js
- `src/components/Ground.js` — two-plane leapfrog treadmill — https://github.com/akarlsten/cuberun/blob/main/src/components/Ground.js
- `src/components/Cubes.js` — instanced obstacle pool, recycle + collision — https://github.com/akarlsten/cuberun/blob/main/src/components/Cubes.js
- `src/util/generateFixedCubes.js` — authored set-piece generators — https://github.com/akarlsten/cuberun/blob/main/src/util/generateFixedCubes.js
- `src/components/Ship.js` — movement + camera + engine FX — https://github.com/akarlsten/cuberun/blob/main/src/components/Ship.js
- `src/components/KeyboardControls.js` — key → `controls` state — https://github.com/akarlsten/cuberun/blob/main/src/components/KeyboardControls.js
- `src/util/distance2D.js`, `src/util/randomInRange.js` — helpers (note: `randomInRange` is biased; don't copy)
