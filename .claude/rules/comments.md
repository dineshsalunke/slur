---
paths:
  - "**/*.{ts,tsx,mjs}"
---

# Comments

- **No comments at all, except on `setTimeout`, `setInterval` and `useEffect`** — one line each,
  saying why it exists. For `useEffect`, that line names the outside-React system it synchronizes
  with.
- **Nothing else gets one.** No file headers, no section banners, no unit notes, no "why" blocks, no
  `//` above a function, no JSDoc.
- **Functional directives are exempt** — `biome-ignore`, `@ts-expect-error`, `/// <reference`, `#!`.
- Anything a reader cannot get from names, types and control flow — a rejected alternative, an
  external constraint, a non-obvious consequence, a unit — goes in the **PR body**, where someone
  reading the change wants it, never in the file, where everyone reading the function pays for it.
- **"Match the surrounding code" never applies here.** The bar is absolute, and an over-commented
  file is not licence to keep writing at that rate — strip what you touch.
- `pnpm lint` enforces it (`scripts/check-comment-ratio.mjs`): a file you touch may not come out
  with more comment lines than it went in with; a new file may not exceed 20% comments.
