---
name: ast-grep-trailing-comma-matches-nothing
description: an ast-grep pattern for one array element with its trailing comma parses as an ERROR node and silently rewrites nothing; use Edit for list inserts
metadata:
  node_type: memory
  type: feedback
  originSessionId: 5fa4d776-636d-40e4-84d1-41aa764fa45d
  modified: 2026-09-24T13:37:47.883Z
---

`ast-grep run -p "seeded( 'n3-5', 'l r J', N3 )," -r "..." -U` on 2026-09-24 printed "Pattern contains an
ERROR node" and "matched nothing", and left the file unchanged. The trailing comma makes the pattern
not a valid expression on its own.

**Why:** the no-sed rule (CLAUDE.md #15) pushes structural edits to ast-grep, but an element-plus-comma
pattern fails quietly, the same failure mode the rule exists to avoid.
**How to apply:** to insert an element into an array literal, use the Edit tool (exact string, not a
regex) on the neighbouring lines. If you use ast-grep, drop the comma and check `git diff` after `-U`.
Related: [[bash-tool-runs-fish]].
