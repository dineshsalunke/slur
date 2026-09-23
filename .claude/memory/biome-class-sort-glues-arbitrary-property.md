---
name: biome-class-sort-glues-arbitrary-property
description: "biome check --write removed the space between an arbitrary [prop:value] class and a trailing ${ className }, silently merging two classes"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8c8ac4ca-8792-4ab8-96cd-3735745a12ef
  modified: 2026-09-23T21:07:11.558Z
---

On 2026-09-24, `biome check --write` rewrote
`` `… p-0 [scrollbar-width:none] ${ className }` `` to `` `… p-0 [scrollbar-width:none]${ className }` ``.
The two classes merged into one invalid class. Typecheck, lint and tests all still passed.

**Why:** the class sorter rewrites the static part of the template and dropped the separating space
before the interpolation [inferred: only when the last static class is an arbitrary property].

**How to apply:** after `biome check --write` on a file with a template `className`, grep the line.
Put `${ className }` first in the template (`` `${ className } m-0 … [prop:value]` ``); that form
survived. Related: [[sub-pixel-geometry-drops-out-without-aa]] (another silent zsh/tool footgun).
