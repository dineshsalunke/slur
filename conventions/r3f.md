# React Three Fiber (Rendering) Conventions
> Source: https://r3f.docs.pmnd.rs (fiber), https://drei.docs.pmnd.rs, https://react-postprocessing.docs.pmnd.rs, https://github.com/pmndrs/koota, https://github.com/ericdrowell/brometal
> Versions (verified 2026-08-06 via `npm view`): `@react-three/fiber` **9.7.0**, `@react-three/drei` **10.7.8**, `@react-three/postprocessing` **3.0.4** (wraps `postprocessing` **6.39.4**), `three` **0.185.1**. React **19** required (fiber 9 peer: `react >=19 <19.3`).

## TL;DR — the rules that matter most

1. **The ECS owns state; R3F owns pixels.** Never store per-frame entity state (positions, velocities) in React state. Mutate `Object3D` refs inside `useFrame`. React should re-render only on *structural* change (an entity spawns/despawns), never on movement.
2. **`useFrame` is the hot path.** No `setState`, no allocations (`new THREE.Vector3()`), no closures created per frame. Pre-allocate scratch objects at module/component scope. Keep the body slim.
3. **Instance everything repetitive.** Track segments, pickups, projectiles, stars → one `<Instances>`/`InstancedMesh` per archetype. Target a **handful of draw calls**, not thousands of meshes. Drei's soft cap: ≤ ~1000 instances per mesh is comfortable.
4. **`frameloop`: for a runner, keep `"always"` (default).** `"demand"` is for static/CAD-style scenes. You render every frame anyway, so on-demand buys nothing and complicates the loop.
5. **Neon bloom = HDR emissive + `toneMapped={false}` + one `<Bloom mipmapBlur>`.** Push emissive channels > 1.0; let bloom key off luminance. Prefer this over `<SelectiveBloom>` (simpler, cheaper) unless you truly need object-masked glow.
6. **Pin `three` to `0.185.x`.** `postprocessing@6.39.4` peer-requires `three >= 0.168.0 < 0.186.0`. Bumping three to 0.186+ silently breaks postprocessing. This is the single biggest version footgun in this stack.
7. **Reuse geometries/materials; dispose what React doesn't.** R3F auto-disposes objects it created on unmount, but manually-created shared resources and pooled objects are yours to `dispose()`.

## House React style (project rule)

Applies to **every** `.tsx` in the client, not just R3F components.

1. **No fragment shorthand.** Write `<Fragment>…</Fragment>` (imported from `react`), never `<>…</>`.
   Named fragments read explicitly and diff cleanly. *(Not lint-enforceable — Biome has no "prefer long-form
   fragment" rule — so it's an author/review gate.)*
2. **One component per file.** A file exports exactly one React component; its name matches the file
   (`ship-model.tsx` → `ShipModel`). Module-scope **helpers, hooks, constants, and scratch objects are NOT
   components** and may share the file. Split colocated sub-components into their own files and import them.
   - **Exception — React Router route modules** (`root.tsx`, `routes/*`): the framework mandates multiple
     exports in one module (default component + `Layout` / `ErrorBoundary` / `loader` / `action`). Those stay
     together — they're route slots, not free-standing components.
3. **Componentize by subscription boundary — push every subscription DOWN to its leaf.** Split a component
   wherever a distinct data subscription lives — a koota `useQuery`, a Colyseus `.listen`, a React Router
   loader value, any store hook — so that when that data changes React re-renders **only that leaf, never its
   siblings**. Concretely: a parent that wraps siblings holds **zero** reactive subscriptions (only
   `useWorld()`/context + `useFrame`); each archetype/panel view owns its own subscription and re-renders
   only on *its* change. **Never subscribe high and prop-drill the value down** — that re-renders the whole
   subtree (see Anti-Patterns: "Subscribing to a store/query in a high-level component that wraps siblings").
   Pass the *entity/id* down and let the leaf subscribe. Per-frame values are **never** a subscription —
   mutate refs in a local `useFrame`; purely cosmetic pooled objects go fully imperative (no subscription at
   all). This is the composition rule *behind* "The ECS owns state; R3F owns pixels" (§ top) and CLAUDE.md
   non-negotiable #4 — components are split so each re-render boundary is as small and as low as possible,
   not for cosmetic tidiness. The S3 track-desync (`colyseus-state-not-reactive`) and the general re-render
   discipline (`think-rerender-subscription-impact`) are the incidents this rule distills.

## Idiomatic Patterns (concise TSX snippets)

**Slim, allocation-free `useFrame`** (scratch objects hoisted out of the loop):
```tsx
const _v = new THREE.Vector3() // module scope — reused every frame

function Ship({ entity }: { entity: Entity }) {
  const ref = useRef<THREE.Group>(null!)
  useFrame((_state, delta) => {
    const p = entity.get(Position)          // read from ECS
    ref.current.position.set(p.x, p.y, p.z) // mutate ref, no setState
    ref.current.rotation.z += delta * 0.5
  })
  return <group ref={ref}><ShipModel /></group>
}
```

**Instancing many similar objects** (drei `<Instances>` / `<Instance>`):
```tsx
<Instances limit={1000} range={pickups.length}>
  <icosahedronGeometry args={[0.4, 0]} />
  <meshStandardMaterial emissive="#00e5ff" emissiveIntensity={3} toneMapped={false} />
  {pickups.map((p) => (
    <Instance key={p.id} position={[p.x, p.y, p.z]} color="#00e5ff" />
  ))}
</Instances>
```
`limit` = buffer size (fixed), `range` = how many to actually draw this frame (cheap to vary → object pooling). Per-instance `position`/`rotation`/`scale`/`color` supported. Custom per-instance data via `<InstancedAttribute name="foo" defaultValue={1} />`.

**Animating instances imperatively** — grab the `InstancedMesh` ref and set matrices, or mutate `<Instance>` refs; do NOT re-map the array every frame.

**Merged static geometry** (drei `<Merged>`) — for many copies of an imported GLTF mesh that share material, when you want instancing ergonomics over loaded assets.

**Neon material:**
```tsx
<meshStandardMaterial emissive="#ff2bd6" emissiveIntensity={2.5} toneMapped={false} />
```
`toneMapped={false}` keeps values above 1.0 from being clamped, so bloom sees them.

**Postprocessing for the synthwave look:**
```tsx
<EffectComposer multisampling={0}>
  <Bloom mipmapBlur intensity={1.2} luminanceThreshold={0.6} luminanceSmoothing={0.2} />
</EffectComposer>
```

## Performance Rules (the hot path)

- **`useFrame(cb, priority?)`** signature: `(state, delta, xrFrame)`. `delta` is seconds. A **positive `priority`** hands you control of rendering — you must then call `state.gl.render(state.scene, state.camera)` yourself (needed when you have >1 composer/pass). Negative/zero priorities only order callbacks (ascending), they don't disable auto-render.
- **Never `setState` in `useFrame`.** A state update re-renders the React tree and reconciles the whole scene graph — catastrophic at 60fps. Mutate refs/`Object3D` instead.
- **Zero allocation per frame.** `new Vector3/Quaternion/Matrix4/Color`, array literals, and inline arrow closures all create garbage → GC stalls → frame hitches. Hoist scratch instances; reuse them with `.set()`/`.copy()`.
- **Read from ECS, write to three.** One system pass per frame: `world.query(Position, Mesh).readEach(([p, mesh]) => mesh.position.set(p.x, p.y, p.z))`. This keeps React uninvolved entirely.
- **Instancing math:** each distinct mesh+material = one draw call. 500 projectiles as 500 `<mesh>` = 500 draw calls + 500 reconciler nodes; as one `<Instances>` = 1 draw call. Keep per-archetype instance counts ≤ ~1000.
- **`useThree` selectors** to avoid re-renders: `useThree((s) => s.camera)` subscribes only to camera, not every state change. Use `state.get()`/`state.set()` for non-reactive reads/writes inside callbacks.
- **`useLoader` caches by URL** — same URL is the same cached asset. Call `useLoader.preload(...)` at module scope for anticipatory loading.
- **Adaptive quality (optional):** drei `<PerformanceMonitor onDecline>` + `<AdaptiveDpr pixelated>` + `<AdaptiveEvents>` degrade DPR/effects under load. `regress()` + reading `state.performance.current` lets you drop pixel ratio during heavy action. Good insurance for a 60fps target on weak GPUs.
- **`multisampling={0}` on EffectComposer** when bloom is your main effect — MSAA on the composer target is expensive; the bloom blur hides most aliasing on glowing edges anyway. Measure both.

## Best Practices

- **Structure:** ECS (miniplex/koota) = simulation source of truth. R3F components = thin views that mount a mesh per entity and sync transforms in `useFrame`/systems. One system reads ECS → writes three each frame.
- **Store the three object on the entity.** koota callback-trait `const Object3DRef = trait(() => new THREE.Object3D())` lets a system mutate the live object directly (Array-of-Structures storage returns a stable ref).
- **Pooling via `range`:** allocate `<Instances limit={MAX}>` once; grow/shrink the visible set with `range` and reposition freed slots. Cheaper than mount/unmount churn for projectiles/particles.
- **Share resources:** define shared geometries/materials once (module scope or `useMemo`) and reuse across meshes. Enable `THREE.ColorManagement` (on by default in modern three) for correct neon colors.
- **LOD** with drei `<Detailed distances={[0,15,40]}>` for track props/scenery that recede fast in an endless runner.
- **`<BakeShadows>`** if you use shadows on static geometry — renders the shadow map once instead of every frame.
- **`<Bvh>`** (drei) to accelerate raycasting if you do CPU picking; for a runner most collision should live in the ECS/physics layer, not three raycasts.
- **Drei helpers worth using here:** `Instances`/`Instance`, `Merged`, `Detailed`, `PerformanceMonitor`, `AdaptiveDpr`, `AdaptiveEvents`, `Preload`, `useTexture`, `shaderMaterial` (typed custom shaders for track/tunnel FX), `Trail` (ship motion trails — use sparingly).

## Anti-Patterns & Bad Practices (each with WHY)

- **`setState` per frame** — WHY: triggers React reconciliation of the scene graph 60×/s; the framework was explicitly built to avoid this. Mutate refs.
- **Allocating inside `useFrame`** (`new Vector3()`, `[x,y,z]`, inline closures) — WHY: garbage per frame → GC pauses → visible jank in a fast racer. Pre-allocate and reuse.
- **One `<mesh>` per projectile/pickup/star** — WHY: N draw calls + N reconciler nodes + N JS objects; kills both GPU and React. Instance them.
- **`frameloop="demand"` for an action game** — WHY: you render every frame regardless, so demand mode adds `invalidate()` bookkeeping for zero benefit and can cause missed frames if you forget to invalidate. Use `"always"`.
- **Emissive without `toneMapped={false}`** — WHY: tone mapping clamps color to [0,1], so bloom's luminance threshold never triggers and neon looks flat. Values must exceed 1.0.
- **`<SelectiveBloom>` by default** — WHY: requires wiring `lights` + `selection` refs and an extra layer/render; for a scene where *everything* glowing should bloom (synthwave), a single global `<Bloom>` keyed on HDR luminance is simpler and faster. Reach for selective only to exclude specific bright-but-non-glowing surfaces.
- **Deep React trees driven by ECS data via props** — WHY: prop changes re-render subtrees. Bridge through refs/imperative sync, not prop drilling of positions.
- **Subscribing to a store/query in a high-level component that wraps siblings** — WHY: a change re-renders the whole subtree (all siblings), causing frame stutters. **Colocate every subscription at the leaf that consumes it:** each archetype view owns its own `useQuery` (re-renders only on *its* spawn/despawn); the root/canvas holds *zero* reactive subscriptions (only `useWorld()` context + `useFrame`). Per-frame values are never a subscription — mutate refs in a local `useFrame`. Purely cosmetic pooled objects (side-scenery, particles) should be **fully imperative** (a local `useFrame` mutating the `InstancedMesh` matrices, no subscription at all).
- **Bumping `three` past 0.185** — WHY: breaks the `postprocessing@6.39.4` peer range (`< 0.186`).

## Gotchas / Footguns

- **Version lock:** `three 0.185.1` is the ceiling for `postprocessing 6.39.4`. Pin it. Upgrading three blind will break EffectComposer at runtime, not install time.
- **React 19 required.** fiber 9 peer is `react >=19 <19.3` — a monorepo pinned to React 18 will not work; 19.3+ is also excluded.
- **`<Instances>` `limit` is a hard buffer cap.** Exceeding it silently drops instances. Size it for worst case; vary `range`, not `limit`.
- **Instance color needs a color-capable material** and `<Instance color=…>`; forgetting makes all instances share the base material color.
- **`useFrame` with positive priority disables auto-render** — if you set a priority and forget `gl.render(...)`, you get a black screen.
- **Disposal:** R3F disposes objects it created when the JSX unmounts, but pooled/shared geometries+materials and anything you `new`'d manually must be `.dispose()`d by you to avoid GPU memory leaks over a long session.
- **`toneMapped={false}` everywhere** turns off ACES/tone mapping for that material — intentional for neon, wrong for realistic PBR surfaces; apply per-material, not globally.
- **koota mutation + React:** mutating a callback-trait object does NOT notify React (that's the point). If a React component *should* react to a change, call the entity's change flag (`entity.changed(Trait)`); otherwise it stays silent — great for the render loop, surprising if you expected reactivity.
- **Effect order matters** in `<EffectComposer>`: children run top-to-bottom. Bloom generally goes late; put tone-mapping/output considerations accordingly.

## For This Project (neon runner: instancing, bloom, ECS→R3F bridge)

**Instancing plan (one `<Instances>` per archetype):** track segments, pickups, projectiles, background stars/grid, enemy ships-if-identical. Each is a single draw call; drive per-instance transforms from the ECS in a per-frame system. Use `limit` = pool max, `range` = live count for pooling.

**Bloom plan:** single global `<Bloom mipmapBlur intensity≈1.0–1.5 luminanceThreshold≈0.5–0.7>` inside `<EffectComposer multisampling={0}>`. All glowing surfaces (ship trails, neon track edges, pickups, projectiles) use `meshStandardMaterial`/`meshBasicMaterial` with `emissive` and `emissiveIntensity > 1`, `toneMapped={false}`. Reserve `<SelectiveBloom>` for the rare case of masking specific objects out.

**ECS→R3F bridge (koota):**
```tsx
const Position = trait({ x: 0, y: 0, z: 0 })
const Object3DRef = trait(() => new THREE.Object3D()) // callback trait → stable per-entity object

// One system, runs each frame, zero React involvement, zero allocation:
function SyncTransforms() {
  const world = useWorld()
  useFrame(() => {
    world.query(Position, Object3DRef).readEach(([p, obj]) => {
      obj.position.set(p.x, p.y, p.z)
    })
  })
  return null
}
```
React mounts/unmounts a mesh only when an entity is spawned/despawned (drive that from `useQuery(...)`), never for movement. For instanced archetypes, the system writes into the `InstancedMesh` matrix buffer instead of individual `Object3D`s. This keeps the reconciler idle during gameplay — the whole point of pairing an external ECS with R3F.

**miniplex note:** same shape — miniplex archetypes ≈ koota queries; iterate the archetype in a `useFrame` system and mutate three objects held on the entity. Both avoid per-frame React state by design.

## Experimental: brometal

**What it actually is (verified from the repo, 2026-08-06):** despite older descriptions of it as "a minimal WebGL/3D library," the current `ericdrowell/brometal` is a **compile-time TypeScript→WGSL shader compiler for WebGPU** — not a scene-graph/3D engine like three.js. You write vertex/fragment shaders as typed TS via a `shader({ attributes, uniforms, varyings, vertex(){}, fragment(){} })` DSL; `npx brometal dev|prod` compiles `*.shader.ts` → `*.shader.gen.ts` containing finished WGSL + typed metadata. Runtime is ~19 KB min / ~7 KB gz, WebGPU-only (Chrome/Edge 113+, Firefox 141+, Safari 26+). Philosophy: "decide everything it can at compile time, so the runtime executes a precomputed plan" — attribute locations, buffer layouts, uniform upload, dead-code elimination all happen at build; shader errors surface as `file:line:col` diagnostics instead of black screens.

**Runtime flow:** `createProgram(renderer, shader)` builds pipeline + bind groups once; the draw loop just sets uniforms and draws, never allocating or touching DOM layout.

**How to spike it later (secondary track):** brometal is not a drop-in R3F replacement — it's a lower-level WebGPU shader layer. A spike would be a standalone WebGPU canvas rendering the neon track/tunnel with a hand-written brometal shader (instanced quads for track segments, a fullscreen bloom-ish pass), fed transforms from the same ECS. Value to evaluate: raw WebGPU throughput + tiny bundle vs. losing three.js's ecosystem (loaders, postprocessing, drei). Keep it as a rendering-backend experiment behind the ECS boundary; R3F stays primary.

## References

- React Three Fiber — scaling performance: https://r3f.docs.pmnd.rs/advanced/scaling-performance
- React Three Fiber — hooks (`useFrame`, `useThree`, `useLoader`): https://r3f.docs.pmnd.rs/api/hooks
- drei — Instances/Instance/Merged (performance): https://drei.docs.pmnd.rs/performances/instances
- react-postprocessing — Bloom: https://react-postprocessing.docs.pmnd.rs/effects/bloom
- react-postprocessing — SelectiveBloom: https://react-postprocessing.docs.pmnd.rs/effects/selective-bloom
- koota (ECS) — README/API: https://github.com/pmndrs/koota
- brometal (WebGPU shader compiler): https://github.com/ericdrowell/brometal
- cuberun (reference project): https://github.com/akarlsten/cuberun
- Version/compat data: `npm view @react-three/{fiber,drei,postprocessing} three postprocessing` (2026-08-06)
