---
name: step-the-r3f-clock-for-timed-taps
description: "To shoot a VFX at exact ages (0, 60, 150 ms…), set frameloop 'never' over CDP and advance the R3F clock by hand; import page modules by their ?t= URL"
metadata:
  node_type: memory
  type: reference
  originSessionId: d4775cd3-2298-4b03-a785-d058d6752976
  modified: 2026-09-23T15:17:32.583Z
---

Verified 2026-09-23 (#222 break sequence). A CDP screenshot cannot hit a chosen time on its own:
swiftshader frames take a variable time, and every `useFrame` VFX keys off `state.clock`. Stop the
loop and drive the clock yourself:

```
const f = await import('/node_modules/.vite/deps/@react-three_fiber.js?v=<hash>');
const store = f._roots.get(document.querySelector('canvas')).store;
store.getState().setFrameloop('never');
f.advance(store.getState().clock.elapsedTime + 1/60, true);
```

In `frameloop: 'never'`, `advance(t)` sets `clock.elapsedTime = t` (in seconds) and renders one frame.
`Page.captureScreenshot` then shows that frame. `setFrameloop('never')` resets the clock to 0. KeyP freeze
still toggles, because it is a DOM listener.

**Module URLs:** take the page's own URL from `performance.getEntriesByType('resource')`. When a module
has a `?t=` version, import that one. Another worker's edit HMRs your page (for example, `traits.ts`).
After that, a bare `/app/game/ecs/traits.ts` import is a second instance, and `queryFirst` returns
`undefined`. Same trap as [[cdp-import-of-tuning-hits-an-hmr-orphan]].

**After your own HMR, relaunch Chrome.** After the `tuning-schema.ts` edit HMRed, the fractured
block rendered with no glow and the debris had no emissive. A fresh headless Chrome rendered it
correctly. A `location.reload()` did not fix it (inferred: stale HMR state).

Related: [[place-the-ship-over-cdp]], [[headless-chrome-for-frame-taps]].
