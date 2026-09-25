---
name: ast-grep-drops-semicolons
description: "an ast-grep rewrite of a whole `const X = …` statement drops the trailing semicolon; grep the result"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 6d89e290-fd55-4c34-ad41-c6f4f7d2a72d
  modified: 2026-09-25T12:54:02.534Z
---

`ast-grep run -p 'const A = 6' -r 'const A = 9' -U` matched the full lexical declaration and wrote the
rewrite without its `;`. Biome would flag it, and it is easy to miss.

**Why:** the pattern matches the whole statement node, semicolon included, and the rewrite text has none.

**How to apply:** put the `;` in both the pattern and the rewrite, or match only the value (`-p '6'` scoped
with `--selector`). Grep the changed lines after `-U`. See [[ast-grep-trailing-comma-matches-nothing]].
