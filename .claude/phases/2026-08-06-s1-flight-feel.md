# S1 — Flight feel (local, no network) — prep / align (FINALIZED for Implement)

**Goal:** fly ONE ship solo down a simple flat track with the constrained-flight controls, tuning until it **feels
good**. No Colyseus, no schema, no hazards, no bloom. **Acceptance = you fly it and say "feels good"** (human gate).

> Status: **IMPLEMENTED & playable at `/solo`; feel-tuning in progress (human gate). 2026-08-07.** The **code is
> now the source of truth** (`@slur/shared/src`, `apps/client/app/game/`); the reference snippets below are the
> pre-build spec, kept for rationale — where they differ, the code wins. See "Reconcile — as-built" at the bottom.

## Decisions in force
- v1 mode = **Race**; server co-located on host (N/A this slice — local only).
- **Integration = semi-implicit Euler** — motion is kinematic (accel from input, not position); clamps/impulses/respawns corrupt position-Verlet's implied velocity; `(pos, vel)` is the clean state to snapshot/replay for S2.
- **Two loops:** physics **fixed 60 Hz** (accumulator, shared with S2 server) + render on **rAF/display refresh** (not forceable to 60), bridged by **interpolation** (`alpha` from the accumulator; render lerps prev→curr into refs).
- **Energy** resolves GDD's open fuel question to **"energy gates boost only"** for now (drain while boosting, regen otherwise). Full fuel-pressure revisited later.
- **`stepShip` is split** into pure phase-mutators; `resolveCollisions` is the seam S3 swaps for real track collision.

## Load-bearing decision (makes S2 free)
`stepShip()` operates on a **plain, framework-free `SimShip`** — `{ x,y,z, vx,vy,vz, energy, grounded, jumpsUsed,
jumpHeld, coyoteTimer, bufferTimer }`, all plain number/bool. In S2 the Colyseus `PlayerState` schema declares the
**same** fields, so a Schema instance structurally satisfies `SimShip` → identical sim server-side, zero rework.
The sim never imports `@colyseus/schema`. (Banking is render-only from `vx` — **not** a sim field.)

## Physics model
Custom kinematic, fixed 60 Hz, semi-implicit Euler. Longitudinal: throttle→accel toward `maxCruise`, brake→decel,
no-input→coast drag, boost→cap×`boostMul` + energy drain. Lateral: **drifty** (accelerate on input, low damp on
release, clamp). Jumps: **jump-cut** variable height, **double jump**, **asymmetric gravity** (fall>rise), **coyote
time + jump buffering** (~100 ms).

## Controls (GDD §8)
W/↑ throttle · S/↓ brake · A/D strafe · Space jump (tap = short via cut, hold = full, double-tap = double) · Shift boost.

---
## Reference implementation — `@slur/shared` (framework-free sim)

### `constants.ts`
```ts
export const TICK_RATE = 60;
export const FIXED_DT = 1 / TICK_RATE;
export interface FlightTuning {
    accel: number; brakeDecel: number; coastDrag: number; maxCruise: number;
    boostMul: number; boostAccel: number; energyMax: number; energyDrain: number; energyRegen: number;
    strafeAccel: number; strafeClamp: number; strafeDamp: number; halfWidth: number;
    riseGravity: number; fallGravity: number; jumpImpulse: number; doubleJumpImpulse: number;
    jumpCutFactor: number; maxJumps: number; coyoteTime: number; jumpBuffer: number;
}
export const DEFAULT_TUNING: FlightTuning = { // starting values — tuned live in playtest
    accel: 70, brakeDecel: 110, coastDrag: 18, maxCruise: 55,
    boostMul: 1.6, boostAccel: 50, energyMax: 100, energyDrain: 45, energyRegen: 22,
    strafeAccel: 70, strafeClamp: 26, strafeDamp: 1.8, halfWidth: 16,
    riseGravity: 52, fallGravity: 88, jumpImpulse: 21, doubleJumpImpulse: 17,
    jumpCutFactor: 0.42, maxJumps: 2, coyoteTime: 0.1, jumpBuffer: 0.1,
};
```
### `sim/input.ts`
```ts
export interface PlayerInput { seq: number; throttle: number; brake: number; strafe: number; // 0..1, 0..1, -1..1
    jump: boolean; boost: boolean; usePowerUp: boolean; }
export function emptyInput(seq = 0): PlayerInput { return { seq, throttle: 0, brake: 0, strafe: 0, jump: false, boost: false, usePowerUp: false }; }
```
### `sim/types.ts`
```ts
export interface SimShip { x: number; y: number; z: number; vx: number; vy: number; vz: number; energy: number;
    grounded: boolean; jumpsUsed: number; jumpHeld: boolean; coyoteTimer: number; bufferTimer: number; }
export function spawnShip(x = 0, z = 0): SimShip { return { x, y: 0, z, vx: 0, vy: 0, vz: 0, energy: 100,
    grounded: true, jumpsUsed: 0, jumpHeld: false, coyoteTimer: 0, bufferTimer: 0 }; }
```
### `sim/step.ts` — phase-split (order: intents → velocity → gravity → integrate → collide)
```ts
export function applyLongitudinal(s, input, t, dt) {
    if (input.throttle > 0) s.vz += t.accel * input.throttle * dt;
    if (input.brake > 0) s.vz -= t.brakeDecel * input.brake * dt;
    if (input.throttle === 0 && input.brake === 0) { const d = t.coastDrag * dt; s.vz = s.vz > d ? s.vz - d : 0; }
    let cap = t.maxCruise;
    if (input.boost && s.energy > 0) { cap = t.maxCruise * t.boostMul; s.vz += t.boostAccel * dt; s.energy = Math.max(0, s.energy - t.energyDrain * dt); }
    else s.energy = Math.min(t.energyMax, s.energy + t.energyRegen * dt);
    s.vz = Math.min(Math.max(s.vz, 0), cap);
}
export function applyStrafe(s, input, t, dt) {
    if (input.strafe !== 0) s.vx += t.strafeAccel * input.strafe * dt; else s.vx -= s.vx * Math.min(1, t.strafeDamp * dt);
    s.vx = Math.min(Math.max(s.vx, -t.strafeClamp), t.strafeClamp);
}
export function applyJump(s, input, t, dt) {
    s.coyoteTimer = s.grounded ? t.coyoteTime : Math.max(0, s.coyoteTimer - dt);
    s.bufferTimer = Math.max(0, s.bufferTimer - dt);
    if (input.jump && !s.jumpHeld) s.bufferTimer = t.jumpBuffer;
    if (!input.jump && s.jumpHeld && s.vy > 0) s.vy *= t.jumpCutFactor;
    if (s.bufferTimer > 0) { const canGround = s.grounded || s.coyoteTimer > 0;
        if (canGround && s.jumpsUsed === 0) { s.vy = t.jumpImpulse; s.jumpsUsed = 1; s.grounded = false; s.coyoteTimer = 0; s.bufferTimer = 0; }
        else if (!canGround && s.jumpsUsed < t.maxJumps) { if (s.jumpsUsed === 0) s.jumpsUsed = 1; s.vy = t.doubleJumpImpulse; s.jumpsUsed += 1; s.bufferTimer = 0; } }
    s.jumpHeld = input.jump;
}
export function applyGravity(s, t, dt) { s.vy -= (s.vy > 0 ? t.riseGravity : t.fallGravity) * dt; }
export function integrate(s, dt) { s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; }
export function resolveCollisions(s, t) { // S3 replaces with real track collision
    if (s.y <= 0) { s.y = 0; if (s.vy < 0) s.vy = 0; s.grounded = true; s.jumpsUsed = 0; } else s.grounded = false;
    if (s.x < -t.halfWidth) { s.x = -t.halfWidth; if (s.vx < 0) s.vx = 0; }
    else if (s.x > t.halfWidth) { s.x = t.halfWidth; if (s.vx > 0) s.vx = 0; }
}
export function stepShip(s, input, dt, t) { applyLongitudinal(s, input, t, dt); applyStrafe(s, input, t, dt);
    applyJump(s, input, t, dt); applyGravity(s, t, dt); integrate(s, dt); resolveCollisions(s, t); }
```
### `sim/fixed-step.ts` — accumulator, returns interpolation `alpha`
```ts
export function createFixedStep(dt, maxSteps = 5) { let acc = 0;
    return function advance(elapsedSeconds, step) { acc += elapsedSeconds; let n = 0;
        while (acc >= dt && n < maxSteps) { step(dt); acc -= dt; n++; }
        if (n === maxSteps) acc = 0; return acc / dt; }; }
```
*(Types elided in step/fixed-step for brevity; add back when implementing.)*

---
## Reference implementation — `@slur/client`
**Deps to add:** `@react-three/fiber@^9.7.0`, `@react-three/drei@^10.7.8`, `koota@^0.6.6`, `three` (catalog). ⚠ **verify at implement:** koota world constructor (`createWorld()`?) and `<primitive object=…>{children}` child-attach.

### Rendering hierarchy & subscription rules (per review — avoids stutter)
- **Root (`GameCanvas`/`Loop`): ZERO reactive subscriptions** — only `useWorld()` (context, no re-render) + `useFrame`.
- **Each archetype view owns its own leaf-local `useQuery`** — re-renders only on *its own* spawn/despawn. Never subscribe in a parent that wraps siblings.
- **Per-frame values never via subscription** — always ref/imperative mutation in a local `useFrame`/system.
- **`Scenery` is pure-imperative** — local `useFrame` mutating `InstancedMesh` matrices, **no** subscription, zero re-renders during play.

### `ecs/traits.ts`
```ts
import { trait } from 'koota'; import * as THREE from 'three'; import { spawnShip } from '@slur/shared';
export const Sim = trait(() => spawnShip());         // AoS live SimShip; stepShip mutates it
export const Prev = trait({ x: 0, y: 0, z: 0 });      // physics transform before the last step (interp source)
export const Render = trait(() => new THREE.Group()); // render node the mesh parents to
export const LocalPlayer = trait();                   // tag
```
### `ecs/world.ts`
```ts
import { createWorld } from 'koota'; export const world = createWorld(); // ⚠ verify export
```
### `input/keyboard.ts` — key state → one reused PlayerInput (no per-frame alloc)
```ts
import { emptyInput } from '@slur/shared';
const input = emptyInput(); let seq = 0; const down = new Set<string>();
const has = (...c: string[]) => c.some((x) => down.has(x));
function recompute() { input.throttle = has('KeyW','ArrowUp')?1:0; input.brake = has('KeyS','ArrowDown')?1:0;
    input.strafe = (has('KeyD','ArrowRight')?1:0) - (has('KeyA','ArrowLeft')?1:0);
    input.jump = has('Space'); input.boost = has('ShiftLeft','ShiftRight'); input.usePowerUp = has('KeyE'); }
export function attachKeyboard() { const on = (e: KeyboardEvent) => { down.add(e.code); recompute(); };
    const off = (e: KeyboardEvent) => { down.delete(e.code); recompute(); };
    addEventListener('keydown', on); addEventListener('keyup', off);
    return () => { removeEventListener('keydown', on); removeEventListener('keyup', off); }; }
export function currentInput() { input.seq = ++seq; return input; }
```
### `ecs/systems.ts`
```ts
import { DEFAULT_TUNING, stepShip } from '@slur/shared';
import { LocalPlayer, Prev, Render, Sim } from './traits'; import { currentInput } from '../input/keyboard';
export function flightSystem(world, dt) { const input = currentInput();
    world.query(Sim, Prev, LocalPlayer).updateEach(([s, prev]) => { prev.x=s.x; prev.y=s.y; prev.z=s.z; stepShip(s, input, dt, DEFAULT_TUNING); }); }
const lerp = (a, b, t) => a + (b - a) * t;
export function syncRenderSystem(world, alpha) {
    world.query(Sim, Prev, Render).readEach(([s, prev, grp]) => {
        grp.position.set(lerp(prev.x,s.x,alpha), lerp(prev.y,s.y,alpha), lerp(prev.z,s.z,alpha));
        grp.rotation.z = -(s.vx / DEFAULT_TUNING.strafeClamp) * 0.5; }); } // cosmetic bank
```
### `scene/ship.tsx` — mesh parented to the entity's Render group (leaf-local useQuery)
```tsx
import { useQuery } from 'koota/react'; import { LocalPlayer, Render } from '../ecs/traits';
export function Ships() { const ships = useQuery(LocalPlayer, Render); // re-renders only on spawn/despawn
    return ships.map((e) => (<primitive key={e.id()} object={e.get(Render)}>
        <mesh><coneGeometry args={[0.6, 2, 6]} /><meshStandardMaterial emissive="#00e5ff" emissiveIntensity={2} toneMapped={false} /></mesh>
    </primitive>)); }
```
### `scene/track.tsx` — 2-plane leapfrog grid floor (cuberun technique; leaf-local, no re-render)
```tsx
import { useFrame } from '@react-three/fiber'; import { useRef } from 'react'; import * as THREE from 'three';
import { useWorld } from 'koota/react'; import { LocalPlayer, Sim } from '../ecs/traits';
const SIZE = 400;
export function Track() { const world = useWorld(); const a = useRef<THREE.Mesh>(null!); const b = useRef<THREE.Mesh>(null!);
    useFrame(() => { const e = world.queryFirst(LocalPlayer, Sim); if (!e) return; const z = e.get(Sim).z;
        for (const m of [a.current, b.current]) if (m && z - m.position.z > SIZE) m.position.z += 2 * SIZE; });
    return (<>{[0, SIZE].map((z, i) => (
        <mesh key={i} ref={i ? b : a} rotation-x={-Math.PI / 2} position={[0, 0, z]}>
            <planeGeometry args={[SIZE, SIZE]} />
            <meshStandardMaterial /* neon grid CanvasTexture, RepeatWrapping */ emissive="#0a2540" emissiveIntensity={1.4} toneMapped={false} />
        </mesh>))}</>); }
```
### `scene/scenery.tsx` — recycled instanced side-boxes, PURE IMPERATIVE (zero subscriptions)
```tsx
import { useFrame } from '@react-three/fiber'; import { useMemo, useRef } from 'react'; import * as THREE from 'three';
import { useWorld } from 'koota/react'; import { LocalPlayer, Sim } from '../ecs/traits';
const SPAN = 400, MARGIN = 30;
function mulberry32(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function Scenery({ count = 50 }) { const world = useWorld(); const ref = useRef<THREE.InstancedMesh>(null!);
    const rng = useMemo(() => mulberry32(1234), []);
    const boxes = useMemo(() => Array.from({ length: count }, (_, i) => ({ z: (i / count) * SPAN, side: i % 2 ? 1 : -1, off: 14 + rng() * 10, h: 2 + rng() * 20 })), [count, rng]);
    const m = useMemo(() => new THREE.Object3D(), []);
    useFrame(() => { const e = world.queryFirst(LocalPlayer, Sim); if (!e) return; const z = e.get(Sim).z;
        for (let i = 0; i < boxes.length; i++) { const b = boxes[i];
            if (z - b.z > MARGIN) { b.z += SPAN; b.off = 14 + rng() * 10; b.h = 2 + rng() * 20; } // recycle ahead (seeded)
            m.position.set(b.side * b.off, b.h / 2, b.z); m.scale.set(2, b.h, 2); m.updateMatrix(); ref.current.setMatrixAt(i, m.matrix); }
        ref.current.instanceMatrix.needsUpdate = true; });
    return (<instancedMesh ref={ref} args={[undefined, undefined, count]}>
        <boxGeometry /><meshStandardMaterial emissive="#ff2bd6" emissiveIntensity={2} toneMapped={false} /></instancedMesh>); }
```
### `camera/chase.ts` — behind + look-ahead + **rubberband** (exp ease) + speed-FOV. Called from Loop (not its own useFrame → auto-render stays on)
```ts
import { DEFAULT_TUNING } from '@slur/shared'; import { LocalPlayer, Render, Sim } from '../ecs/traits';
export function updateChaseCamera(cam, world, dt) { const e = world.queryFirst(LocalPlayer, Render, Sim); if (!e) return;
    const p = e.get(Render).position; const speed = e.get(Sim).vz;
    const k = 1 - Math.exp(-8 * dt);                 // rubberband: frame-rate-independent lag-follow
    const back = 13 + (speed / DEFAULT_TUNING.maxCruise) * 6; // speed trail-stretch (tuning knob)
    cam.position.x += (p.x - cam.position.x) * k;
    cam.position.y += (p.y + 5 - cam.position.y) * k;
    cam.position.z += (p.z - back - cam.position.z) * k;     // forward = +z, trail behind
    cam.lookAt(p.x, p.y + 1, p.z + 8);                       // look-ahead
    const fov = 70 + (speed / DEFAULT_TUNING.maxCruise) * 20;
    if (Math.abs(cam.fov - fov) > 0.1) { cam.fov = fov; cam.updateProjectionMatrix(); } }
```
### `game-canvas.tsx` — the ONE loop (all at default priority → auto-render on)
```tsx
import { Canvas, useFrame } from '@react-three/fiber'; import { createFixedStep, FIXED_DT } from '@slur/shared';
import { WorldProvider, useWorld } from 'koota/react'; import { useEffect, useMemo } from 'react';
import { world } from './ecs/world'; import { LocalPlayer, Prev, Render, Sim } from './ecs/traits';
import { flightSystem, syncRenderSystem } from './ecs/systems'; import { attachKeyboard } from './input/keyboard';
import { updateChaseCamera } from './camera/chase'; import { Ships } from './scene/ship';
import { Track } from './scene/track'; import { Scenery } from './scene/scenery';
function Loop() { const world = useWorld(); const advance = useMemo(() => createFixedStep(FIXED_DT), []);
    useFrame((state, delta) => { const alpha = advance(delta, (dt) => flightSystem(world, dt));
        syncRenderSystem(world, alpha); updateChaseCamera(state.camera, world, delta); }); return null; }
export function GameCanvas() { useEffect(attachKeyboard, []);
    useEffect(() => { const ship = world.spawn(Sim, Prev, Render, LocalPlayer); return () => ship.destroy(); }, []);
    return (<WorldProvider world={world}><Canvas camera={{ fov: 75, position: [0, 5, -13] }}>
        <color attach="background" args={['#05060a']} /><ambientLight intensity={0.5} />
        <Loop /><Track /><Scenery count={50} /><Ships />
    </Canvas></WorldProvider>); }
```
### `routes/solo/route.tsx` + `routes.ts`
```tsx
import { GameCanvas } from '../../game/game-canvas'; export default function Solo() { return <GameCanvas />; }
// routes.ts: add route('solo', 'routes/solo/route.tsx'); link from home.
```

---
## Cameras — chase now, rearview later
- **Chase (S1):** above — rubberband (exp ease) + speed trail-stretch + look-ahead + speed-FOV. Tuning knobs: `k`, trail-stretch, optional spring overshoot.
- **Rearview mirror (forward req, mainly S5 tracking-projectiles):** second render pass — a rear-facing camera → `RenderTexture`, mirrored horizontally, shown on a HUD inset. When added, the main `Loop` takes render **priority** and issues both passes manually (r3f.md: positive priority disables auto-render). Not built in S1. Tracked in backlog.

## Sense of speed (from `docs/references/cuberun.md`)
Recycled instanced side-boxes (primary parallax cue) + 2-plane leapfrog grid floor + speed-FOV/trail. Real growing
world-Z (not a treadmill) so S2 can place ships at different Z. All cosmetic/local, seed-deterministic recycling.

## References
- **cuberun** → `docs/references/cuberun.md` (endless ground = 2-plane leapfrog; scenery = recycled instanced pool; movement = pure kinematics; camera = offset snap → we rubberband).

## Verify (before the human gate)
`pnpm typecheck` + `build` green · `pnpm dev` · I drive the app (screenshot + console) to confirm it renders and the
ship responds. **Then you fly it** and we tune `FlightTuning` + camera live until it feels right.

## To verify at Implement
- koota `createWorld()` export; `<primitive object=…>{children}` child-attach; koota `updateEach`/`readEach` SoA write-back semantics.

## Out of scope (later slices)
Netcode/schema (S2) · real track+hazards+finish+collision+bloom (S3) · lobby/rooms/results (S4) · combat + **rearview camera** (S5) · classes/audio/juice (S6).

## Reconcile — as-built (2026-08-07)
**S1 is implemented and playable at `/solo`; feel-tuning is ongoing (the human gate).** Commits: `969a08e` (feat —
via a background agent that died mid-handoff but had already committed), `78ac023` (fixes). **The code is the source
of truth** now (`@slur/shared/src`, `apps/client/app/game/`); reference snippets above are the pre-build spec — where
they differ, the code wins.

Deltas from the reviewed spec:
- **Jump model upgraded to derived** (GDC *"Building a Better Jump"*, Pittman): tune `DEFAULT_JUMP`
  (`height/apexTime/descentTime/doubleHeight/minHeight`); `deriveJump()` computes gravity/impulse. **`minJumpVel`
  (min-height cap) replaced `jumpCutFactor`.** `applyJump` extracted a `consumeBufferedJump` helper.
- **Left/right fixed:** chase cam faces **+z**, so world **+x renders screen-left** — `keyboard.ts` maps physical keys
  to screen direction. *If banking ever looks reversed, flip the `grp.rotation.z` sign in `syncRenderSystem`.*
- **Verify-at-implement resolved:** `createWorld()` is koota's constructor ✓; `<primitive object={group}>{mesh}` child-attach works ✓.
- `FlightTuning` fields fully commented (what each is + which direction changes feel). Some starting values changed during playtest.
- **Verified:** typecheck/build/lint green; runtime rendered + responded (user playtest — Chrome automation was declined, so runtime confidence is the fly-through).

**S1 DONE — human gate passed 2026-08-07** ("controls are good"). Next: S2 (networked flight).
