# ECS Conventions
> Source: github.com/hmans/miniplex (core README + packages/react README), github.com/pmndrs/koota, github.com/NateTheGreatt/bitECS. Versions verified 2026-08-06 via `npm view`: **miniplex 2.0.0** (core, last publish 2023-07-16), **miniplex-react 2.0.1**, **koota 0.6.6** (pmndrs, last publish 2026-05-09), **bitecs 0.4.0** (2025-12-06). API checked against published READMEs/source, not memory.

## TL;DR — the rules that matter most

1. **Entities live in a plain store; behaviour lives in systems (plain functions) run once per tick.** No logic on the entity, no per-frame React.
2. **Never render the ECS per frame.** React mounts/unmounts objects when entities are *added/removed* only. Position/rotation/health updates are written straight into the Three.js object (or a typed store) inside `useFrame` — React never sees them.
3. **A component's presence is the query key.** Model state transitions by *adding/removing components* (`dead`, `poisoned`, `networked`), not by branching on values. Value-predicate queries are non-reactive and slow (miniplex `.where` needs manual `reindex`).
4. **Add/remove components only through the library API** (`addComponent`/`entity.add`). Mutating `entity.foo = x` directly skips query re-indexing → the entity silently vanishes from systems.
5. **Colyseus is the source of truth; the local ECS is a *projection*.** Keep a `Map<networkId, entity>`. On snapshot: reconcile (spawn/despawn/patch). Split components into **networked** (overwritten by server) vs **local-only** (interpolation buffers, VFX, input prediction) so reconciliation never clobbers client state.
6. **Recommendation: koota (pmndrs) for greenfield on this stack; miniplex if you want dead-simple plain-object entities and value stability over active development.** Reasoning below.

## Library Choice (miniplex vs koota vs bitECS — recommendation + why)

**Verdict for this project (R3F + Colyseus endless-runner): use `koota`. Use `miniplex` only if the team prefers its plain-object simplicity and can accept an effectively-frozen dependency.** `bitECS` is the wrong tool here.

| | miniplex 2.0 | koota 0.6 | bitECS 0.4 |
|---|---|---|---|
| Author / status | hmans; **last publish 2023-07**, effectively maintenance-frozen | **pmndrs; active (2026-05)**, same org as R3F/drei/zustand | NateTheGreatt; active, low-level |
| Entity model | plain JS object, **object identity** | opaque entity handle + traits | **numeric eid**, data in typed arrays |
| Component data | any JS value on the object (AoS) | `trait()`, SoA *or* AoS (callback) | SoA typed arrays (AoS possible) |
| React bindings | `<Entity>/<Component>/<Entities>/useEntities` | `koota/react`: `useQuery/useTrait/useTraitEffect/useActions` | none official |
| Relations | none built-in | **first-class `relation()`** | manual |
| Change detection | manual (`reindex`) | **automatic `onChange` + `updateEach`** | manual |
| Best at | tiny, intuitive, R3F-native, plain objects | real-time React state, R3F/XR, graphs | 100k+ entities, raw throughput |

**Why koota over miniplex here.** They are close, and miniplex is genuinely excellent — but three things tip it:
- **Maintenance & ecosystem fit.** koota is the pmndrs-maintained *successor* built explicitly for "real-time state for React/R3F/XR". R3F, drei and zustand are the same org; koota is the path they're investing in. miniplex core hasn't shipped since mid-2023 and its author moved on. For a greenfield 2026 project, betting on the maintained one is the low-risk choice, not the exciting one.
- **Reactive primitives you'll actually use.** `useTraitEffect` (subscribe a mesh ref to a trait with **zero re-render**) and automatic `onChange` are exactly the R3F bridge you need; in miniplex you hand-roll the equivalent. `relation()` cleanly models combat ownership (`OwnedBy(shooter)`), pickup→holder, and ordered track segments — all of which you'd otherwise fake with id fields.
- **Networked spawn/despawn ergonomics.** `world.onAdd/onRemove` + `useQuery` make Colyseus add/remove → R3F mount/unmount a two-liner.

**The honest case *for* miniplex** (pick it if these dominate): entities are **plain objects**, which is the single most natural fit for copying Colyseus schema into the ECS (`Object.assign(entity, snapshot)`); the whole library fits in your head in ten minutes; and "frozen" here also means "stable, no churn." If the team values that over active development, miniplex is a defensible pick and the rest of this doc gives you both.

**Why not bitECS.** SoA typed arrays and numeric eids win at 10k–1M entities. An endless-runner has *hundreds* of live entities. You'd pay bitECS's real cost — data-in-parallel-arrays instead of objects, manual eid↔networkId mapping, eid recycling hazards, no React story — for throughput you'll never need. Data-oriented cache locality is a solution to a problem you don't have.

**When a full ECS is overkill.** If you only ever have "the player + a flat list of obstacles" and no cross-cutting systems, a `zustand` store (or a plain `Map` + array) with one update function is simpler and honest. Reach for ECS once you have **multiple orthogonal systems** (movement × collision × combat × powerups) operating on **overlapping subsets** of heterogeneous entities — which this project does. That's exactly the case ECS pays off.

## Idiomatic Patterns (concise TS snippets)

Primary snippets are **koota** (the recommendation); the **miniplex equivalent** is shown for the idioms the API differs on, since both are viable.

### Define the world + component/trait types

```ts
// koota — traits are the schema. SoA scalars by default; AoS via callback for rich objects.
import { trait } from "koota"
export const Transform = trait({ x: 0, y: 0, z: 0, rot: 0 }) // SoA scalars
export const Velocity  = trait({ x: 0, y: 0, z: 0 })
export const Health    = trait({ current: 100, max: 100 })
export const Ship      = trait()                              // tag (no data)
export const Projectile= trait({ damage: 10, ttl: 2 })
export const Object3D  = trait(() => new THREE.Object3D())    // AoS: real reference, not a snapshot
export const Networked = trait({ id: "" })                   // marks server-owned entities
```

```ts
// miniplex — entity type is one plain object type; optional (?) props are components.
import { World, type With } from "miniplex"
export type Entity = {
  transform: { x: number; y: number; z: number; rot: number }
  velocity?: { x: number; y: number; z: number }
  health?: { current: number; max: number }
  ship?: true
  projectile?: { damage: number; ttl: number }
  three?: THREE.Object3D
  networked?: { id: string }
  dead?: true
}
export const world = new World<Entity>()
```

### Spawn / add / remove / has

```ts
// koota
const ship = world.spawn(Ship, Transform, Velocity, Health)      // spawn with traits
const goblin = world.spawn(Transform({ x: 10 }), Velocity)       // override defaults
ship.add(Networked({ id: "srv-42" }))
ship.remove(Velocity)
ship.has(Health)                 // boolean
const t = ship.get(Transform)    // snapshot for SoA; live ref for AoS traits
ship.set(Transform, { x: 5 })    // fires onChange
ship.destroy()
```

```ts
// miniplex — entities are plain objects; go through the world API to stay indexed.
const ship = world.add({ transform: { x: 0, y: 0, z: 0, rot: 0 }, ship: true })
world.addComponent(ship, "velocity", { x: 0, y: 0, z: 0 })
world.removeComponent(ship, "velocity")
world.remove(ship)
```

### Archetypes / queries

```ts
// koota — query returns the current matching set; modifiers Not/Or/Added/Changed.
import { Not } from "koota"
world.query(Transform, Velocity)                 // archetype: has both
world.query(Transform, Not(Velocity))            // exclusion
const player = world.queryFirst(Ship, Networked) // first match or undefined
```

```ts
// miniplex — queries are persistent, incrementally-maintained buckets. Build once, reuse.
export const moving   = world.with("transform", "velocity")
export const alive    = world.with("health").without("dead")
export const rendered = world.with("three", "transform")
// nested + non-reactive value predicate (needs world.reindex(entity) after mutation!)
const damaged = world.with("health").where(({ health }) => health.current < health.max)
```

### Adding / removing components = state transitions

```ts
// Model "dead"/"poisoned"/"boosted" as component presence, not value branches.
// koota:  entity.add(Dead)      // miniplex:  world.addComponent(e, "dead", true)
// Then a query (with "dead" / Not(Dead)) selects them for free — no per-tick filtering.
```

### React bindings — and when to stay OUT of React

Use React components for **one-off, lifecycle-bound entities** (the player, the camera rig) and to **mount/unmount Three.js objects** as entities appear/disappear. Use **imperative world mutation + systems** for everything spawned in bulk at runtime (projectiles, pickups, track segments, networked ships). Rule of thumb: *React owns the scene graph's existence; systems own its per-frame values.*

```tsx
// koota/react
import { WorldProvider, useQuery, useTraitEffect, useActions } from "koota/react"

<WorldProvider world={world}><Game /></WorldProvider>

function Ships() {
  const ships = useQuery(Ship, Transform)     // re-renders ONLY when the set changes
  return ships.map((e) => <ShipView key={e.id()} entity={e} />)
}
function ShipView({ entity }) {
  const ref = useRef<THREE.Mesh>(null!)
  // subscribe mesh to the trait WITHOUT re-rendering — the R3F bridge:
  useTraitEffect(entity, Transform, (t) => { if (t) ref.current.position.set(t.x, t.y, t.z) })
  return <mesh ref={ref}><boxGeometry /><meshStandardMaterial /></mesh>
}
```

```tsx
// miniplex-react — <Entities> re-renders only on add/remove; <Component> captures the ref.
import { ECS } from "./ecs" // createReactAPI(world)
const ships = world.with("ship", "transform")

const Ships = () => (
  <ECS.Entities in={ships}>
    <ECS.Component name="three">     {/* child ref is auto-captured into entity.three */}
      <mesh><boxGeometry /><meshStandardMaterial /></mesh>
    </ECS.Component>
  </ECS.Entities>
)
// spawn imperatively, elsewhere:
export const spawnShip = () => world.add({ ship: true, transform: { x:0,y:0,z:0,rot:0 } })
```

## Systems & the Tick Loop

Systems are **plain functions over a query**, called once per frame. Neither library schedules for you — that is deliberate; you drive them from R3F's `useFrame` (or a fixed-step accumulator). Order matters: run `input → spawn → movement → collision → combat → powerups → cleanup` explicitly.

```tsx
// One place drives the whole tick. Keep systems pure-ish: read query, mutate components.
function Systems() {
  useFrame((_, dt) => {
    inputSystem(dt); spawnSystem(dt); movementSystem(dt)
    collisionSystem(dt); combatSystem(dt); powerupSystem(dt); cleanupSystem(dt)
  })
  return null
}

// koota — updateEach gives you the trait values and auto-flags onChange:
const movementSystem = (dt: number) =>
  world.query(Transform, Velocity).updateEach(([t, v]) => { t.x += v.x*dt; t.y += v.y*dt })

// miniplex — for...of the query; iterates in reverse so removal mid-loop is safe:
const movementSystem2 = (dt: number) => {
  for (const { transform, velocity } of moving) { transform.x += velocity.x*dt }
}
```

**Fixed timestep for anything networked/physical.** Interpolation and server reconciliation need determinism; accumulate `dt` and step simulation at a fixed rate (e.g. 60 Hz), render at display rate.

**React to entering/leaving a query** for init/teardown instead of polling:
```ts
// koota:    world.onAdd(Projectile, (e) => sfx.play("spawn"))
// miniplex: world.with("projectile").onEntityAdded.subscribe((e) => sfx.play("spawn"))
```

## Best Practices

- **Systems mutate component *values*; the library API mutates component *presence*.** Direct value mutation (`t.x += 1`) is fine and fast. Structure changes go through `add`/`remove`.
- **Build queries once, module-scope, and reuse.** Both libs maintain them incrementally; re-creating per frame throws away the index.
- **`for...of` (miniplex) / `updateEach` (koota) over `.entities.forEach`.** The iterators handle reverse-order-safe removal; the raw array does not.
- **Tags over booleans.** `Dead` trait / `dead?: true` beats `isDead: boolean` — presence is queryable in O(1), a boolean forces per-entity branching.
- **Split networked vs local components.** e.g. `Networked{id}` + `ServerTransform` (overwritten each snapshot) vs `RenderTransform` (interpolated, client-owned). Never let reconciliation write the thing you're interpolating toward.
- **Keep one authoritative id map.** `Map<networkId, entity>` created/destroyed alongside spawn/despawn. This is your reconciliation index.
- **Co-locate the spawn function with the render component** (miniplex README pattern): `spawnEnemy()` next to `<Enemies>`. Callers spawn imperatively; the view reacts.
- **Store the Three.js object as a component** (`Object3D` trait / `three`) and write transforms into it directly in systems — the mesh *is* the render target, no diffing.

## Anti-Patterns & Bad Practices (each with WHY)

- **Rendering entities per frame / driving position through React state.** WHY: every moving entity re-renders the tree each frame → GC pressure and jank. React should only see *add/remove*; per-frame values go into the Object3D/store. This is the #1 ECS-in-R3F mistake.
- **Mutating structure by hand: `entity.velocity = {...}` / `delete entity.health`.** WHY (miniplex, explicit in README): skips re-indexing, so queries never learn the entity changed shape — it silently disappears from or fails to appear in systems. Always `addComponent`/`removeComponent` (koota: `add`/`remove`).
- **Value-predicate queries as if reactive** (miniplex `.where`). WHY: not reactive; changing a value does not re-file the entity unless you call `world.reindex(entity)`, which is O(queries) and easy to forget. Model the condition as a component instead (`add(Damaged)` when it crosses the threshold).
- **Putting behaviour/methods on entities (OOP `entity.update()`).** WHY: kills the whole point — data and logic recouple, you lose batch iteration and cross-cutting systems, and you can't compose behaviour by component combination.
- **Letting the Colyseus snapshot overwrite local-only components.** WHY: blows away interpolation buffers, input prediction, and VFX state every network tick → visible stutter. Reconcile only the networked component set.
- **One giant `everything()` query filtered with `if`s inside the loop.** WHY: throws away archetype indexing; you iterate all entities every system. Make narrow queries; let the index do the filtering.
- **Recreating queries or the React API inside components/render.** WHY: allocates and re-subscribes every render; queries are meant to be long-lived singletons.

## Gotchas / Footguns

- **miniplex is on `latest 2.0.0` but development is effectively frozen (2023).** `miniplex-react` latest is `2.0.1`. There are `next` tags (`2.0.0-next.20`) that never became `latest` — pin exact versions and don't chase `next`.
- **koota is pre-1.0 (0.6.6).** API is stable enough for production use in the pmndrs orbit but *can* break on minors — pin the version and read the changelog before bumping.
- **koota `get()` on an SoA trait returns a *snapshot*, not a live reference; AoS (callback) traits return the live object.** Mutating a snapshot does nothing to the store — use `set()` or `updateEach` for SoA. This bites people constantly.
- **koota change detection has a cost.** For hot inner loops that don't need `onChange`, pass `{ changeDetection: 'never' }` to `updateEach`, or use `useStores` for raw array access. Conversely, mutating a nested field inside a trait won't auto-flag — call `entity.changed()`.
- **Removing components during iteration:** safe with miniplex `for...of` (reverse order) and koota `updateEach`; **not** safe iterating `.entities` directly.
- **bitECS eid recycling:** numeric ids are reused after `removeEntity` — a stale eid can point at a *different* entity. (Another reason to avoid it for networked entities with their own ids.)
- **Ref capture timing (miniplex `<Component>` with a child):** the component value is `undefined` until the child mounts and its ref resolves. Systems must null-check `entity.three` before using it for the first frame or two.
- **Entities can live in multiple miniplex worlds** (by design). Handy, but means `world.remove` doesn't mutate the object — don't assume removal "destroys" it.

## For This Project (ECS ↔ R3F bridge, ECS ↔ Colyseus reconciliation)

**The three-layer flow: `Colyseus room state → local ECS → R3F render`. Data flows one way per frame; input flows back up as intents to the server.**

### ECS → R3F bridge (no per-frame re-renders)

1. React renders one view per entity, keyed by entity id, via `useQuery`/`<Entities>`. This re-renders **only** when ships/pickups/projectiles are added or removed.
2. Each view registers its mesh: koota `useTraitEffect(entity, RenderTransform, …)`, or miniplex `<Component name="three">` ref capture.
3. Systems in `useFrame` write world-space values **straight into the Object3D** (`mesh.position.set(...)`, `mesh.quaternion.setFromEuler(...)`). React is never notified — R3F just renders the mutated scene graph next frame.

```tsx
// koota render + bridge
function Projectiles() {
  const shots = useQuery(Projectile, RenderTransform)   // re-render on spawn/despawn only
  return shots.map((e) => <Shot key={e.id()} entity={e} />)
}
function Shot({ entity }) {
  const ref = useRef<THREE.Mesh>(null!)
  useTraitEffect(entity, RenderTransform, (t) => t && ref.current.position.set(t.x, t.y, t.z))
  return <mesh ref={ref}><sphereGeometry args={[0.1]} /><meshBasicMaterial /></mesh>
}
```

### ECS ↔ Colyseus reconciliation (server-authoritative)

Model two transform components: **`ServerTransform`** (written verbatim from snapshots, the reconciliation target) and **`RenderTransform`** (what the mesh reads; interpolated toward `ServerTransform`). Keep local-only entities (VFX, predicted local player) unmarked by `Networked` so reconciliation ignores them.

```ts
const byNetId = new Map<string, Entity>()

// Called on each Colyseus state change (room.state.ships.onAdd/onRemove/onChange).
function reconcile(snapshot: ShipState[]) {
  const seen = new Set<string>()
  for (const s of snapshot) {
    seen.add(s.id)
    let e = byNetId.get(s.id)
    if (!e) {                                   // ADD: server introduced an entity
      e = world.spawn(Ship, Networked({ id: s.id }),
                      ServerTransform(s), RenderTransform(s), Health(s.health))
      byNetId.set(s.id, e)
    } else {                                    // PATCH: overwrite ONLY networked components
      e.set(ServerTransform, s)                 // never touch RenderTransform here
      e.set(Health, { current: s.health, max: s.maxHealth })
    }
  }
  for (const [id, e] of byNetId)                // REMOVE: gone from snapshot
    if (!seen.has(id)) { e.destroy(); byNetId.delete(id) }
}

// Interpolation system (runs every render frame): ease RenderTransform → ServerTransform.
const interpSystem = (dt: number) =>
  world.query(RenderTransform, ServerTransform).updateEach(([r, s]) => {
    const k = 1 - Math.exp(-15 * dt)            // frame-rate-independent smoothing
    r.x += (s.x - r.x) * k; r.y += (s.y - r.y) * k; r.z += (s.z - r.z) * k
  })
```

**Conventions for this project:**
- **Networked components** (owned by server, overwritten on snapshot): `ServerTransform`, `Health`, powerup/combat status flags. Never mutate these in local systems — they're inputs.
- **Local-only components** (client-owned, survive reconciliation): `RenderTransform` (interp buffer), `Velocity`/prediction for the local player, VFX/trail state, input intents.
- **Client prediction (local player only):** run movement locally into `RenderTransform` immediately for responsiveness; when the authoritative `ServerTransform` arrives, snap/blend and reconcile. For remote ships, pure interpolation (above) — no prediction.
- **Spawning is server-driven** for networked entities: the client *never* `spawn()`s a networked ship directly; it sends an intent, the server updates room state, and `reconcile()` materialises the entity. Local-only entities (muzzle flashes, screen-space UI ghosts) may be spawned client-side freely.
- **Endless-runner track segments:** treat as networked if the server owns level generation (deterministic seed → segments in state, reconciled like ships), or local-only if generation is deterministic client-side from a shared seed. Prefer the shared-seed local approach to keep bandwidth low; use koota `relation()` (`FollowsSegment`) or an ordered list to chain them.

## References

- miniplex core — https://github.com/hmans/miniplex (v2.0.0, README verified 2026-08-06)
- miniplex-react — https://github.com/hmans/miniplex/tree/main/packages/react (v2.0.1)
- koota — https://github.com/pmndrs/koota (v0.6.6, pmndrs, verified 2026-08-06)
- koota/react bindings — `koota/react` subpath of the `koota` package
- bitECS — https://github.com/NateTheGreatt/bitECS (v0.4.0, functional API: `createWorld`/`addEntity`/`addComponent`/`query`/`observe(onAdd/onRemove/onSet)`; `defineQuery`/`enterQuery`/`defineSystem` removed in 0.4)
- Sander Mertens, ECS FAQ — https://github.com/SanderMertens/ecs-faq (referenced by the miniplex README as the canonical ECS primer)
- Colyseus state sync — https://docs.colyseus.io (schema `onAdd`/`onRemove`/`onChange` callbacks drive `reconcile()`)
