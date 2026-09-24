---
name: bash-tool-runs-fish
description: "The Bash tool's shell here is fish; bash loops and `set --` fail with odd errors; wrap them in `bash -c '...'`"
metadata:
  node_type: memory
  type: reference
  originSessionId: 827c397a-120c-4055-877b-f51d367f7a9b
  modified: 2026-09-24T13:27:37.362Z
---

The Bash tool in this checkout runs **fish** (`/opt/homebrew/bin/fish`), not bash. A bash `for … do …
done` loop with `set -- $x` fails. The resulting errors look like the tool's fault: sips "not a valid
file" and od "No such file". The real cause is that fish never ran the commands the way bash would.

**Why:** on 2026-09-24 I read three sips/od errors as a sips bug and lost several turns. The same
commands worked at once inside `bash -c '…'`.

**How to apply:** use `bash -c '…'` for any multi-line or loop shell script. Plain one-line commands
are fine in fish. To sample a pixel without Python, use `sips -c 40 40 --cropOffset y x`, then
`sips -s format bmp`, then read the first pixel with `od` at the offset stored in bytes 10–13 (the
bytes are BGRA).
