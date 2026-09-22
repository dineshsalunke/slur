---
paths:
  - "apps/client/app/game/**/*.{ts,tsx}"
  - "apps/client/app/dev/**/*.{ts,tsx}"
  - "apps/client/app/routes/**/*.{ts,tsx}"
  - "apps/client/app/audio/**/*.{ts,tsx}"
  - "apps/client/app/net/**/*.{ts,tsx}"
---

# Rendering (R3F) — hard rules

Full research + rationale: `conventions/r3f.md`. Read it before non-trivial work here.

- **ECS owns state; R3F owns pixels.** Never hold per-frame entity state (position, velocity) in
  React state. Mutate `Object3D` refs in `useFrame`. React re-renders on *structural* change only.
- **`useFrame` is the hot path.** No `setState`, no allocation (`new Vector3()`, array literals,
  inline closures). Hoist scratch objects to module scope; reuse with `.set()`/`.copy()`.
- **Instance every repeated archetype** — projectiles, pickups, track props, stars. One
  `<Instances>` per archetype, `limit` sized for worst case, vary `range` not `limit`.
- **Never a recurring `setInterval`/`setTimeout` touching live game state.** Inside the Canvas use
  `useFrame`; outside it use R3F's `addEffect`. Rejected on sight (non-negotiable: no reflexive primitive).
- **`frameloop="always"`** — `"demand"` buys nothing in an action game.
- **Every material is tone mapped — `toneMapped={false}` is banned.** Removed project-wide
  2026-09-22. Neon = `emissiveIntensity` raised until linear luminance × intensity clears
  `bloom.threshold`, plus one global `<Bloom mipmapBlur>`. Not `<SelectiveBloom>` unless you must
  mask specific surfaces.
- **`three` has a ceiling:** `postprocessing` peer-requires `three < 0.186`. Bumping three breaks
  EffectComposer at *runtime*, not install time. Versions live in the pnpm catalog — read it.
- **Dispose what React didn't create.** Pooled/shared geometries and materials are yours.
