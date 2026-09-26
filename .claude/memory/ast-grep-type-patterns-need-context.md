---
name: ast-grep-type-patterns-need-context
description: "a bare `Room<RunState>` pattern parses as an expression and matches nothing; a no-match exits non-zero and kills a `set -e` loop"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 66dbe386-268d-46c7-b5ce-1c9e9159f8e5
  modified: 2026-09-26T14:27:39.772Z
---

To rewrite a TypeScript type with ast-grep, give the pattern a type context and select the node:
`ast-grep run -l ts -p 'let a: Room<RunState>' --selector generic_type -r 'RunRoomLike' -U <file>`.
A bare `-p 'Room< RunState >'` parses as a comparison expression and silently matches nothing.

ast-grep exits non-zero when a file has no match. A `set -e` loop over many files stops at the first
file without a match, and reports nothing.

**Why:** #288 slice 3a — the first 28-file run changed no file; both causes together.
**How to apply:** probe the pattern on one file first; no `set -e` in a per-file loop; grep for the old
text after `-U`. Related: [[ast-grep-drops-semicolons]], [[ast-grep-trailing-comma-matches-nothing]].
