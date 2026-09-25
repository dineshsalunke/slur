---
name: bash-tool-runs-fish
description: "The Bash tool's shell here is fish or zsh depending on the session; neither runs the other's syntax; wrap loops and chains in `bash -c '...'`"
metadata:
  node_type: memory
  type: reference
  originSessionId: 827c397a-120c-4055-877b-f51d367f7a9b
  modified: 2026-09-25T03:35:25.029Z
---

The Bash tool's shell in this checkout is not always the same. On 2026-09-24 it ran **fish**: a bash
`for … do … done` loop with `set -- $x` failed. On 2026-09-25 (workerfour) it ran **zsh**, although the
environment line said fish: a fish `for …; end` loop failed with `(eval):1: parse error near 'end'`, and
`; and` failed with `command not found: and`. In both cases the errors look like the tool's fault. On
2026-09-24 sips said "not a valid file" and od said "No such file", and the real cause was the shell.

**Why:** on 2026-09-24 three sips/od errors read as a sips bug and cost several turns. On 2026-09-25 a
`cd …; and npx tsc -b --force` silently skipped the dist rebuild inside a longer command.

**How to apply:** use `bash -c '…'` for any loop or conditional chain. Use `&&` for chains; fish 3 and
zsh both accept it. Plain one-line commands are fine in either shell. To sample a pixel without Python,
use `sips -c 40 40 --cropOffset y x`, then `sips -s format bmp`, then read the first pixel with `od` at
the offset stored in bytes 10–13 (the bytes are BGRA).
