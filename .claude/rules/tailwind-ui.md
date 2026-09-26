---
paths:
  - "apps/client/app/**/*.tsx"
  - "apps/client/app/**/*.css"
---

# 2D UI styling (Tailwind v4)

Full research: `conventions/tailwind.md`.

- **Tailwind styles the DOM over the Canvas, never the Canvas.** Scene look is JS (`r3f.md`).
- **No new `.css` or CSS Modules.** One styling system. The only hand-written CSS is the Tailwind
  entry (`@import "tailwindcss"` + `@theme` tokens) — v4 is CSS-first, there is no config file.
- **`style` may set only CSS custom properties** — `style={ { '--x': v } as CSSProperties }`, read by
  a class. Nothing else, no exceptions. `pnpm lint` fails any other key
  (`biome-plugins/style-custom-properties-only.grit`, #284).
  - A value from a fixed set → `@theme` tokens + a static class table (`game/colors.ts`).
  - A number → a custom property + an arbitrary class (`w-[calc(var(--fill)*1%)]`).
  - The R3F `<Canvas>` → a `<div className="fixed inset-0">` parent; R3F's own inline style beats a
    class on the Canvas.
- **A per-frame value never drives `className`.** Keep all static styling in classes and push the
  one dynamic value through a CSS custom property written imperatively
  (`el.style.setProperty('--threat', x)`; the class reads `opacity-[var(--threat)]`).
- **Repetition becomes a React component, not `@apply`.**
- **Brand tokens, not raw hexes** — reference `@theme` tokens so a palette change is one edit.
- HUD overlay root is `fixed inset-0`; be deliberate with `z-*` and `pointer-events-none/auto`.
