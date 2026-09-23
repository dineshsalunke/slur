---
name: drive-the-live-module-not-a-reload
description: "A lighting A/B needs no reload and no frozen pose — import the page's own live module over CDP and call setNum; the camera never moves"
metadata:
  type: feedback
---

To A/B a tunable, do **not** reload with a `localStorage` override. Every lighting tunable is
`rebuild: false` and is read each frame by `useFrame`, and `setNum` is a live module export
(`apps/client/app/dev/tuning.ts`). Vite dev dedupes modules by URL, so the page can import its own
live graph over CDP:

```
node cdp.mjs "(async () => { const t = await import('/app/dev/tuning.ts');
  t.setNum('Fill.intensity', 2); })()"
```

Every frame in the sweep is then **bit-identical except the light**. Measured **SSIM 0.99992** run
to run — against 0.906 for a timed flight and 0.995 for the spawn-pose fix in
[[freeze-the-sim-to-ab-a-light]]. Drift stops being something to manage.

**Why:** a reload re-runs `restore()`, re-converges `<Environment frames={Infinity}>` and re-lands
the camera somewhere slightly different. None of that is needed to change a number the render loop
re-reads anyway.

**How to apply:**
- **A dynamic `import()` can get a DIFFERENT module instance.** `/app/game/ecs/traits.ts` and
  `/app/game/ecs/traits.ts?t=1790136001058` are two modules with two different `trait()` objects,
  so `world.query(tr.Sim)` silently returns **empty**. Read the URL the app actually loaded out of
  `performance.getEntriesByType('resource')` and import that exact string, HMR timestamp and all.
- **Writing `Sim` under `KeyP` freeze does nothing visible** — `LocalLoop` skips `syncRenderSystem`
  while frozen. Set `Sim` *and* `Prev`, unfreeze ~0.9s, re-freeze. That gives arbitrary camera
  placement: resolve the descriptor in-page off
  `/@fs/.../packages/shared/dist/index.js`, walk `segmentAt(i).blocks`, teleport 40u behind one.
  Needed because `/test-level`'s spawn pose has no sealed block near the camera at all.
- Restore with `forget()` from `tuning-persist.ts` **and** set the touched tunables back to their
  schema defaults — `forget()` clears storage but not the in-memory values.

Related: [[headless-chrome-for-frame-taps]], [[probe-by-feature-not-by-pixel]].
