# React Router Conventions

> Source: https://reactrouter.com/start/modes, /start/data/routing, /start/data/route-object, /start/data/navigating, /start/library/installation, /how-to/middleware, /api/hooks/useBlocker — **version 8.3.0** (v8 GA shipped 2026-06-17), verified 2026-08-06.

**Version note:** The task said "v7+", but the current release is **React Router v8** (8.3.0). Everything here is v8. Two v8 facts that will bite you if you copy old tutorials:
- **`react-router-dom` no longer exists.** Import everything from `react-router`. Old snippets importing from `react-router-dom` are pre-v8.
- **ESM-only, Node 22 / React 19.2.7 minimum**, and route **middleware is on by default** (no future flag).

---

## TL;DR — the rules that matter most

1. Use **Framework mode in SPA mode** (`ssr: false` in `react-router.config.ts`). Pure client SPA — static `build/client/`, any static host — with **typed routes**, **automatic code-splitting**, and the **Route Module API** (the colocated `routes/<name>/route.tsx` pattern). Not declarative (`<BrowserRouter>`), not plain data mode.
2. **The R3F `<Canvas>` lives in a layout route and never unmounts across in-game navigations.** Route changes swap DOM overlays through `<Outlet/>`; the WebGL context is created once.
3. **The Colyseus/WebSocket connection lives in a React context provider _above_ `<RouterProvider>`** — never in a `loader`. Loaders re-run on navigation/revalidation; a socket must not.
4. **The router owns _location_, not _game state_.** URL = which screen (lobby / join / room). Real-time tick, score, positions come from Colyseus, never the URL or route state.
5. **Guard the back button during a live match** with `useBlocker` (available in **framework & data** mode; ❌ declarative only) so a stray swipe/`Esc` doesn't nuke the match.
6. Import from **`react-router`**. Not `react-router-dom`.
7. **`useEffect` is an escape hatch, not the default — and not the only way.** React's own docs file
   Effects under *"Escape Hatches"* (and *"You Might Not Need an Effect"*): they sync with systems
   *outside* React and are the last resort, not the first reach. **Never own a long-lived resource's
   lifetime in a `useEffect`** — the Colyseus room lives on a module singleton + loader, never a
   component. Tying the room to a component (`useEffect(() => () => room.leave())`) means every remount
   tears it down → a new room per render. Prefer: render-derivation → event handlers → loader/action
   data → refs → *then* `useEffect`.
   **MANDATORY JUSTIFICATION COMMENT:** every `useEffect` that survives review MUST carry a comment
   stating (a) the *external system* it synchronizes with (the only legitimate reason), and (b) which
   cheaper idiom it rejected and why (why it can't be render-derivation / an event handler / loader or
   action data / a ref / a module singleton). An `useEffect` with no such comment is a **review
   failure** — treat an uncommented Effect as a bug, not a style nit. (This rule exists because an
   unjustified Effect at a Canvas-wrapping parent re-rendered the whole scene on a one-time seed sync,
   and separately because the S2 room-in-cleanup bug hid behind an Effect nobody had to justify.)

---

## Mode Decision — **Framework mode, SPA (`ssr: false`)**

> **Correction (2026-08-06):** an earlier version of this doc recommended *data mode* and rejected framework
> mode as "SSR we don't need." **That was wrong.** SPA is a *rendering strategy*, not a mode — framework mode
> runs as a pure client SPA via `ssr: false`, and `useBlocker` is available in framework mode. Below is the
> corrected decision.

React Router v8 ships **three modes**, same library, escalating capability. **SPA is orthogonal** — any mode
can be client-only; framework mode chooses it with `ssr: false`.

| Mode | Top-level API | Routing config | Data APIs | Rendering |
|---|---|---|---|---|
| **Declarative** | `<BrowserRouter>` + `<Routes>/<Route>` | JSX elements | none | client |
| **Data** | `createBrowserRouter([...])` + `<RouterProvider>` | `RouteObject[]` | loaders, actions, `lazy`, middleware, `useBlocker` | client |
| **Framework** ← *our choice (SPA)* | `@react-router/dev` Vite plugin | `routes.ts` + Route Modules | all of Data + **typed routes / `href`** | **SPA / SSR / SSG** — we use **SPA (`ssr:false`)** |

**"Framework mode" ≠ "server-rendered."** With `ssr: false` in `react-router.config.ts`, framework mode
pre-renders only the root shell at build time and emits a static `build/client/` you serve from any static
host. Pure SPA, no server — ideal for LAN.

### Why framework mode (SPA)
- **Route Modules + `routes.ts`** are exactly our colocated route-module structure (`routes/<name>/route.tsx` + colocated `components/`/`utils/`) — native, not hand-rolled.
- **Automatic intelligent code-splitting** keeps the heavy Three.js/koota bundle off the lobby with zero manual `route.lazy` wiring.
- **Typed routes / params / `href`** — real bug prevention.
- `useBlocker` (✅ framework, ✅ data, ❌ declarative) guards the back-button mid-match.
- SPA build = trivial static hosting; no hydration-of-live-data model to fight.

### The one real trade
Framework mode's Vite plugin co-owns the build. For a standard Vite + React + R3F app this costs nothing (add
Vite plugins as normal). If a later WebGPU/brometal shader spike needs exotic build steps, add a Vite plugin
then — it's still Vite underneath. **Fallback:** if day-one total control of the Vite config were a hard
requirement, **data mode** (`createBrowserRouter`, explicit `RouteObject[]`, manual `route.lazy`) trades typed
routes + auto-splitting for full build control.

### SPA caveats (`ssr: false`)
- Only the **root route** may have a build-time `loader`; other routes use **`clientLoader`/`clientAction`** at runtime (we barely use either — our data is the live Colyseus socket).
- Initial render must be **SSR-safe** (no `window` at module top / first render) — the root shell pre-renders at build time.
- Configure the static host to route all URLs → `index.html`.

---

## Idiomatic Patterns

> ⚠ **Code samples below are data-mode-era and illustrative only.** The client was scaffolded in **framework
> mode** — the real boilerplate lives in **`apps/client/`** (`app/root.tsx`, `app/routes.ts`,
> `react-router.config.ts` with `ssr:false`, `vite.config.ts`). The *principles* below still hold (socket
> provider above the router, Canvas in a layout that never remounts, router owns location-not-game-state); the
> `createBrowserRouter`/`router.tsx` snippets do **not** reflect our setup — read `apps/client/` for that.

**Router setup — socket provider wraps the router, canvas does not remount:**

```tsx
// main.tsx
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { router } from "./router";
import { ColyseusProvider } from "./net/ColyseusProvider";

createRoot(document.getElementById("root")!).render(
  <ColyseusProvider>              {/* socket lives ABOVE the router */}
    <RouterProvider router={router} />
  </ColyseusProvider>
);
```

**Route table — lobby is eager, the heavy in-game route is lazy and sits under a Canvas-owning layout:**

```tsx
// router.tsx
import { createBrowserRouter } from "react-router";
import LobbyLayout from "./LobbyLayout";
import Landing from "./Landing";

export const router = createBrowserRouter([
  {
    Component: LobbyLayout,          // layout route: no `path`, renders <Outlet/>
    children: [
      { index: true, Component: Landing },
      { path: "host", lazy: () => import("./routes/host") },
      { path: "join/:roomCode?", lazy: () => import("./routes/join") },
    ],
  },
  {
    path: "game/:roomId",
    lazy: () => import("./routes/game-shell"),   // ← splits Three.js off the lobby bundle
  },
]);
```

**`route.lazy` — a route module exports the props the route needs:**

```tsx
// routes/game-shell.tsx  (this file + its Three.js imports are their own chunk)
import { GameCanvasLayout } from "../game/GameCanvasLayout";
export const Component = GameCanvasLayout;    // lazy() returns { Component, ErrorBoundary, ... }
export const ErrorBoundary = GameErrorScreen;
```

**Persistent Canvas via a layout route + `<Outlet/>` — canvas mounts once, overlays swap:**

```tsx
// game/GameCanvasLayout.tsx
import { Canvas } from "@react-three/fiber";
import { Outlet } from "react-router";

export function GameCanvasLayout() {
  return (
    <div className="game-root">
      <Canvas>{/* WebGL context created ONCE for the whole /game/:roomId subtree */}
        <Scene />
      </Canvas>
      <Outlet />          {/* HUD / pause / scoreboard overlays swap here, canvas untouched */}
    </div>
  );
}
```

**Params (shareable location only):**

```tsx
import { useParams } from "react-router";
const { roomId } = useParams();   // room identity is fine in the URL; tick/score is NOT
```

**Navigation:**

```tsx
import { Link, NavLink, useNavigate } from "react-router";

<Link to="/host">Host a game</Link>
<NavLink to="/join" className={({ isActive }) => isActive ? "active" : ""}>Join</NavLink>

const navigate = useNavigate();
navigate(`/game/${roomId}`);   // after Colyseus room is joined
navigate(-1);                  // back to lobby
```

**Back-button guard during a live match (`useBlocker`, data-mode only):**

```tsx
import { useBlocker } from "react-router";

function useLeaveMatchGuard(inMatch: boolean) {
  const blocker = useBlocker(inMatch);          // block SPA nav while the match is live
  return blocker; // blocker.state: "unblocked" | "blocked" | "proceeding"
}
// in UI: blocker.state === "blocked" → show confirm → blocker.proceed() / blocker.reset()
```

---

## Best Practices

- **Explicit route-object table in one file.** Keep the `createBrowserRouter([...])` config as plain data; it stays greppable and each entry can be lazily loaded independently.
- **One layout route per persistent concern.** The `/game/:roomId` layout owns the `<Canvas>`; the lobby layout owns lobby chrome. Child routes are overlays, not new trees.
- **Lazy-load the in-game route, eager-load the lobby.** Players hit the lobby first; the multi-MB Three.js/R3F chunk must not be in the landing bundle. `lazy: () => import(...)` per route is the lever.
- **Socket + game store in React context above the router.** The connection outlives every navigation; expose the room via `useContext`, not `useLoaderData`.
- **Room code in the URL, everything real-time out of it.** `/join/:roomCode` is shareable and deep-linkable; that's the correct use of routing.
- **Use middleware (baseline in v8) for cross-cutting route concerns** like "must have a live room to enter `/game`," redirecting to the lobby otherwise — cleaner than guarding inside components:

```tsx
import { redirect } from "react-router";
{ path: "game/:roomId", middleware: [requireRoomMiddleware], lazy: () => import("./routes/game-shell") }
```

- **Provide `ErrorBoundary` on the game route** so a Three.js/init failure shows a recoverable screen instead of a white page.

---

## Anti-Patterns & Bad Practices (each with WHY)

- **❌ Adopting framework mode "to be safe."** WHY: it exists to add SSR/streaming/file-routing; a LAN canvas SPA renders no HTML on a server. You'd take on a server entry, hydration model, and `.data` request lifecycle that actively complicate a socket-driven WebGL app, for zero benefit.
- **❌ Putting the `<Canvas>` inside a routed page component (e.g. rendered by the `/game` route itself rather than a parent layout).** WHY: any navigation among in-game sub-routes (pause, scoreboard) unmounts/remounts the component, destroying and recreating the WebGL context — GPU resources, camera, and scene graph are lost, causing a visible black flash and a full asset reload mid-match.
- **❌ Opening the WebSocket/Colyseus room in a `loader`.** WHY: loaders run on initial match **and re-run on revalidation** (param change, action, `useRevalidator`). You'd get duplicate connections and torn-down rooms on every nav. Sockets are long-lived side effects; loaders are for idempotent data fetches — a game has neither the fetch shape nor the idempotency.
- **❌ Encoding game state in the URL or route state** (`/game/42?score=17&tick=9001`). WHY: real-time state changes 30–60×/sec; every change would push history entries, thrash the address bar, and make the back button rewind score. The URL is a slow, user-facing, history-tracked channel — wrong tool for a 60fps stream.
- **❌ Using `<BrowserRouter>` (declarative) for the game.** WHY: `useBlocker` doesn't exist in declarative mode (verified), so you cannot cleanly guard the back button during a match, and you lose config-based `route.lazy`.
- **❌ Importing from `react-router-dom`.** WHY: the package was **removed in v8**. It won't resolve; even if a stale copy is installed, you're mixing versions.
- **❌ Remounting `<RouterProvider>` or recreating the router on renders.** WHY: `createBrowserRouter` must be called once at module scope; recreating it resets history and blows away the whole tree including the canvas.
- **❌ Reaching for `useEffect` first, or tying a resource's lifetime to it.** WHY: `useEffect` is an escape hatch (React's own categorization — *"Escape Hatches"* / *"You Might Not Need an Effect"*), meant for synchronizing with systems *outside* React — not for data flow, derived state, or owning connections. `useEffect(() => () => room.leave(), [])` couples the Colyseus room to the component: **any remount fires the cleanup and disposes the room**, so every render creates a fresh room and two clients never share one. **This is the real S2 bug — it cost hours of debugging a failure this very file already warned about** (see the "socket in a loader / above the router" rules above). Own long-lived resources (socket, room, subscriptions, timers) OUTSIDE React on a **module singleton + loader**; reach for `useEffect` only after ruling out render-derivation, event handlers, loader/action data, and refs. "The majority of React code uses an Effect here" is not a reason — it's usually the mediocre default; the framework authors built the idioms deliberately, so follow them and know *why* before deviating.

---

## Gotchas / Footguns

- **`useBlocker` is data-mode only.** Confirmed against the API docs. Reason #1 to pick data mode over declarative for a game.
- **`useBlocker` blocks _SPA_ navigations, not a full tab close/reload.** For "are you sure you want to leave the match?" on browser close, you still need a `beforeunload` handler; `useBlocker` only covers in-app back/forward/`<Link>` nav.
- **`blocker.proceed()` / `blocker.reset()` must both be wired.** A `"blocked"` state that never calls one of them freezes navigation permanently.
- **`route.lazy` returns route _properties_, not a component directly.** The lazy module must export `Component` (and optionally `loader`, `ErrorBoundary`, `middleware`, `shouldRevalidate`) — returning a bare default component silently renders nothing.
- **Client middleware runs on _every_ client navigation** (v8 baseline). Keep guard middleware cheap and synchronous-ish; don't do socket work there.
- **`shouldRevalidate` defaults to revalidating on param/search change.** With no loaders you won't notice, but if you add one to a `/game/:roomId` route, changing the id re-runs it — don't let that reconnect the socket.
- **A `<Canvas>` under a layout route survives child navigation, but navigating _out_ of the layout (lobby ↔ game) does unmount it** — that's correct (game over → free the GPU), just be deliberate about where the layout boundary sits.
- **Stale-cache trap:** several data-mode doc pages still show `react-router-dom` imports copied from framework-mode examples. In v8 the package is `react-router`. Trust the v8 install page, not inline snippets.

---

## For This Project (lobby/host/join/in-game flow + persistent Canvas & socket)

**Flow → route map:**

| Screen | Route | Loading | Notes |
|---|---|---|---|
| Landing / lobby | `/` (index under `LobbyLayout`) | eager | first paint, no Three.js |
| Host | `/host` | `lazy` | creates Colyseus room via context, then `navigate('/game/:id')` |
| Join | `/join/:roomCode?` | `lazy` | `roomCode` deep-linkable/shareable |
| In-game | `/game/:roomId` (layout owns `<Canvas>`) | `lazy` | Three.js chunk; overlays as children |
| ↳ HUD / pause / scoreboard | children of game layout via `<Outlet/>` | — | swap over the persistent canvas |

**Tree shape:**

```
<ColyseusProvider>                 ← socket + game store (React context), survives all nav
  <RouterProvider router={router}>
    LobbyLayout   (/, /host, /join/:roomCode?)     ← lobby chunk, no WebGL
    /game/:roomId  → GameCanvasLayout               ← lazy Three.js chunk
        └── <Canvas> (mounts ONCE) + <Outlet/>      ← HUD/pause/scoreboard overlays
```

**Rules for this codebase:**
1. **Socket above router, canvas inside a layout route, game state in neither.** These three separations are the whole architecture.
2. **`navigate()` fires only on connection lifecycle events** — room joined → `/game/:id`; match ended/left → `/`. Never on gameplay ticks.
3. **`useBlocker(matchIsLive)` on the game layout** + a `beforeunload` handler for hard closes.
4. **Split at the `/game` boundary**: lobby bundle must not import R3F/Three; enforce via the per-route `lazy` import so the bundler splits it.
5. **Middleware `requireRoom` on `/game/:roomId`** redirects to `/` if there's no live room (e.g. someone deep-links `/game/xyz` without joining).

---

## References

- Modes overview: https://reactrouter.com/start/modes
- Data mode routing: https://reactrouter.com/start/data/routing
- Route object (`Component`, `loader`, `lazy`, `shouldRevalidate`): https://reactrouter.com/start/data/route-object
- Data mode navigating: https://reactrouter.com/start/data/navigating
- Library/declarative install: https://reactrouter.com/start/library/installation
- Middleware (v8 baseline): https://reactrouter.com/how-to/middleware
- `useBlocker`: https://reactrouter.com/api/hooks/useBlocker
- Changelog: https://reactrouter.com/changelog
- v8 GA / breaking changes: https://github.com/remix-run/react-router/discussions/14468
