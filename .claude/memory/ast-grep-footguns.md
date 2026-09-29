---
name: ast-grep-footguns
description: "Three ast-grep failure modes that silently do nothing or corrupt output: a trailing-comma array pattern, a dropped semicolon on a statement rewrite, and a bare type pattern with no selector"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 66dbe386-268d-46c7-b5ce-1c9e9159f8e5
  modified: 2026-09-29T04:04:09.648Z
---

### ast-grep trailing comma matches nothing

`ast-grep run -p "seeded( 'n3-5', 'l r J', N3 )," -r "..." -U` on 2026-09-24 printed "Pattern contains an
ERROR node" and "matched nothing", and left the file unchanged. The trailing comma makes the pattern
not a valid expression on its own.

**Why:** the no-sed rule (CLAUDE.md #15) pushes structural edits to ast-grep, but an element-plus-comma
pattern fails quietly, the same failure mode the rule exists to avoid.
**How to apply:** to insert an element into an array literal, use the Edit tool (exact string, not a
regex) on the neighbouring lines. If you use ast-grep, drop the comma and check `git diff` after `-U`.
Related: [[bash-tool-runs-fish]].

### ast-grep drops semicolons

`ast-grep run -p 'const A = 6' -r 'const A = 9' -U` matched the full lexical declaration and wrote the
rewrite without its `;`. Biome would flag it, and it is easy to miss.

**Why:** the pattern matches the whole statement node, semicolon included, and the rewrite text has none.

**How to apply:** put the `;` in both the pattern and the rewrite, or match only the value (`-p '6'` scoped
with `--selector`). Grep the changed lines after `-U`.

**Also (2026-09-26, #270):** a `function f($$$A): T { $$$B }` → `…: U { $$$B }` rewrite re-emitted the
body unindented and glued its first statement onto the signature line. It still typechecked. Run
`biome check --write <file>` after any ast-grep rewrite that spans a block.

### ast-grep type patterns need context

To rewrite a TypeScript type with ast-grep, give the pattern a type context and select the node:
`ast-grep run -l ts -p 'let a: Room<RunState>' --selector generic_type -r 'RunRoomLike' -U <file>`.
A bare `-p 'Room< RunState >'` parses as a comparison expression and silently matches nothing.

ast-grep exits non-zero when a file has no match. A `set -e` loop over many files stops at the first
file without a match, and reports nothing.

**Why:** #288 slice 3a — the first 28-file run changed no file; both causes together.
**How to apply:** probe the pattern on one file first; no `set -e` in a per-file loop; grep for the old
text after `-U`.
