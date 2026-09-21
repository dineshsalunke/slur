---
paths:
  - "apps/client/app/routes/**/*.{ts,tsx}"
  - "apps/client/app/root.tsx"
  - "apps/client/app/routes.ts"
---

# React Router (framework mode, SPA)

Full research: `conventions/react-router.md`.

- **Import from `react-router`.** `react-router-dom` was removed in v8 and will not resolve.
- **The `<Canvas>` lives in a layout route and never unmounts** across in-game navigation. Putting
  it in a routed page destroys the WebGL context on every nav.
- **Never open the Colyseus room in a `loader`.** Loaders re-run on revalidation → duplicate
  connections. The room is a module singleton.
- **The router owns location, not game state.** URL = which screen. Never encode tick, score or
  positions in the URL or route state.
- **Guard the back button mid-match with `useBlocker`.**
- **`useEffect` is the last resort**, and every surviving one carries exactly one line naming the
  outside-React system it synchronizes with. The rejected cheaper idiom goes in the PR body, never
  inline. An unjustified Effect is a review failure, not a style nit.
