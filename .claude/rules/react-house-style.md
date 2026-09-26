---
paths:
  - "apps/client/app/**/*.tsx"
---

# React house style

Full rule + incidents: `conventions/r3f.md` § "House React style".

- **No fragment shorthand.** `<Fragment>…</Fragment>` imported from `react`, never `<>…</>`.
- **One component per file**, name matching the file, and **nothing else at module level**.
  Constants, helpers, scratch objects and module state move to colocated files — see
  `.claude/rules/component-files.md`. Exception: React Router route modules (`root.tsx`,
  `routes/home.tsx`, `routes/*/route.tsx`) keep their framework exports.
- **Componentize by subscription boundary.** Split wherever a distinct subscription lives — koota
  `useQuery`, a Colyseus `.listen`, a loader value, any store hook — so a change re-renders only
  that leaf, never its siblings. A parent wrapping siblings holds **zero** reactive subscriptions
  (`useWorld()`/context + `useFrame` only). Never subscribe high and prop-drill; pass the entity/id
  down and let the leaf subscribe.
- **A route module rendering a `<Canvas>` calls zero hooks.** Enforced by
  `scripts/check-canvas-isolation.mjs` in `pnpm lint`.
- **`useEffect` is an escape hatch.** Long-lived resources (the Colyseus room, sockets,
  subscriptions, timers) live on module singletons, never tied to mount/unmount.
