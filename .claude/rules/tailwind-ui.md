---
paths:
  - "apps/client/app/ui/**/*.tsx"
  - "apps/client/app/lobby/**/*.tsx"
  - "apps/client/app/**/*.css"
---

# 2D UI styling (Tailwind v4)

Full research: `conventions/tailwind.md`.

- **Tailwind styles the DOM over the Canvas, never the Canvas.** Scene look is JS (`r3f.md`).
- **No new `.css` or CSS Modules.** One styling system. The only hand-written CSS is the Tailwind
  entry (`@import "tailwindcss"` + `@theme` tokens) — v4 is CSS-first, there is no config file.
- **No hand-rolled `style={{}}` object where classes would do.** Arbitrary-value classes cover the
  exotic cases (`bg-[radial-gradient(...)]`, `z-20`, `[transition:opacity_120ms_linear]`).
- **A per-frame value never drives `className`.** Keep all static styling in classes and push the
  one dynamic value through a CSS custom property written imperatively
  (`el.style.setProperty('--threat', x)`; the class reads `opacity-[var(--threat)]`).
- **Repetition becomes a React component, not `@apply`.**
- **Brand tokens, not raw hexes** — reference `@theme` tokens so a palette change is one edit.
- HUD overlay root is `fixed inset-0`; be deliberate with `z-*` and `pointer-events-none/auto`.
