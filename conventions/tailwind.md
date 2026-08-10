# Tailwind CSS — styling the 2D UI

**Verified 2026-08-10** against the official docs (`tailwindcss.com/docs/installation/using-vite`) + `npm view`.
Pins: **tailwindcss 4.3.3**, **@tailwindcss/vite 4.3.3** — pin via the pnpm catalog (see `monorepo.md`).

## TL;DR / the decision

- SLUR's **2D DOM UI** — HUD overlays, lobby, landing, results, menus — is styled with **Tailwind v4**.
- **Tailwind never touches the R3F Canvas.** Three.js materials, colours, bloom, camera, and scene layout are
  JavaScript/refs (`conventions/r3f.md`), NOT CSS. Tailwind styles only the DOM that sits *over* the fixed Canvas.
- **No vanilla `.css`, CSS Modules, or styled-components for new UI.** One styling system. The existing
  `app.css` + `overlays*.css` migrate to Tailwind (issue #37); the only hand-written CSS that survives is the
  Tailwind entry (`@import "tailwindcss"` + `@theme` tokens).

## Setup (v4 — Vite plugin, CSS-first) — verified

1. Deps (catalog-pinned): `tailwindcss`, `@tailwindcss/vite`.
2. `apps/client/vite.config.ts` — add the plugin (keep `reactRouter()`; verify order vs the RR8 guide,
   `react-router.md`):
   ```ts
   import tailwindcss from '@tailwindcss/vite'
   // plugins: [ tailwindcss(), reactRouter() ]
   ```
3. CSS entry `apps/client/app/app.css` (already imported by `root.tsx`) — add at the top:
   ```css
   @import "tailwindcss";
   ```
4. v4 is **CSS-first: there is no `tailwind.config.js`.** Theme customization lives in the CSS entry via the
   `@theme` directive. **Verify the current `@theme` syntax against the Tailwind theme-variables docs before
   authoring tokens** — do not copy token syntax from memory (NN-2).

## Idiomatic patterns

- **Utilities in JSX `className`.** Compose small utilities at the point of use — that co-location is the point.
- **Repetition → a React component, NOT `@apply`.** A reused button/panel/chip becomes a component (house
  style: one component per file, `<Fragment>` not `<>`). `@apply` beyond a couple of genuinely global
  primitives just rebuilds vanilla CSS in a Tailwind costume.
- **Brand tokens, not raw hexes.** Define the locked palette — cyan `#00e5ff`, marigold `#ff9f1c`, the ~12
  player hues — as `@theme` tokens and reference `text-cyan` / `bg-marigold`, so a palette change is one edit.
- **HUD over Canvas:** the overlay root is `position: fixed` over the Canvas → `fixed inset-0`, and be
  deliberate with `z-*` and `pointer-events-none` / `pointer-events-auto` so 3D input isn't blocked.

## Anti-patterns (with WHY)

- **"Tailwinding" a `<mesh>` / the Canvas** — WHY: three renders to WebGL, not the DOM; there is no element to
  class. Scene look is JS (`r3f.md`). Tailwind is DOM-only.
- **New `.css` / CSS Modules alongside Tailwind** — WHY: two styling systems = the divergence this migration
  exists to kill. One system.
- **`@apply` everywhere** — WHY: recreates vanilla CSS, loses the co-location benefit.
- **Per-frame `className` churn from gameplay state** — WHY: toggling classes 60×/s re-renders the React tree
  (non-negotiable #4). A fast cue (e.g. the threat vignette, #38) drives an opacity ref/inline-style
  imperatively, never by class-toggling every frame.

## For this project

- Migration surface is bounded: `app.css` + `overlays.css` + `overlays-panels.css` + `overlays-hud.css` (4
  files) — issue **#37**.
- The **LCARS HUD restyle (#32)** must be done *in* Tailwind — it depends on / merges into #37. Don't restyle
  vanilla CSS that's about to be deleted.
- Pin versions via the catalog; keep this file's **verified** date current on upgrades.

## References

- Install (Vite): https://tailwindcss.com/docs/installation/using-vite
- Theme variables (v4 `@theme`): https://tailwindcss.com/docs/theme
