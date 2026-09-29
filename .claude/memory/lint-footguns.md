---
name: lint-footguns
description: "Four lint/format gaps: biome check --write can glue an arbitrary-property class onto a trailing interpolation, biome lint --stdin-file-path skips GritQL plugins, ls-lint 2.3 ignores unlisted sub-extensions like .constants.ts, and moving a useEffect's mandatory comment into a comment-free file trips the per-file comment ratchet"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 8c8ac4ca-8792-4ab8-96cd-3735745a12ef
  modified: 2026-09-29T04:06:29.831Z
---

### Biome class sort glues arbitrary classes

On 2026-09-24, `biome check --write` rewrote
`` `… p-0 [scrollbar-width:none] ${ className }` `` to `` `… p-0 [scrollbar-width:none]${ className }` ``.
The two classes merged into one invalid class. Typecheck, lint and tests all still passed.

**Why:** the class sorter rewrites the static part of the template and dropped the separating space
before the interpolation [inferred: only when the last static class is an arbitrary property].

**How to apply:** after `biome check --write` on a file with a template `className`, grep the line.
Put `${ className }` first in the template (`` `${ className } m-0 … [prop:value]` ``); that form
survived. Related: [[sub-pixel-geometry-drops-out-without-aa]] (another silent zsh/tool footgun).

### Biome stdin skips Grit plugins

`biome lint --stdin-file-path=<path>` does not run the `biome-plugins/*.grit` plugins. A snippet that
breaks a plugin rule shows only a format note, so the rule looks dead when it is fine.

**Why:** in #284 (2026-09-26) a stdin probe of `style-custom-properties-only.grit` showed no error. A
temporary, unimported `.tsx` under `apps/client/app/` then showed the plugin error.

**How to apply:** to prove a plugin fires under the repo config, write an unimported probe file that
matches the override `includes`, run `pnpm exec biome lint <file>`, and delete it at once. Prototype
new rules in the scratchpad with a local `biome.json` (`{"plugins":["./rule.grit"]}`).

### ls-lint skips unlisted sub-extensions

ls-lint 2.3.1 matches a file by its longest extension. `Bad.constants.ts` passed with only `.ts: kebab-case`
configured. It failed only after `.constants.ts: kebab-case` was added. `.test.ts` names have the same gap.
Verified 2026-09-26 in a scratch copy of `.ls-lint.yml` (#283).

Related: a custom lint rule needs no new dependency. Biome 2.5 runs GritQL plugins (`.grit`) through
`overrides[].plugins`. `$filename` is the absolute path. A regex with a capture group errors out ("matched 1
variables"). `register_diagnostic(..., severity="warn")` works. Biome also formats `.grit` files, so run
`biome format --write` on them. Example: `biome-plugins/component-module-scope.grit`.

### Moving a useEffect trips the comment ratchet

`comments.md` requires a one-line comment on every `useEffect`. `scripts/check-comment-ratio.mjs`
fails any EXISTING file that ends with more comment lines than at the merge-base. A deleted file's
comments do not count. So moving an effect from a deleted file into an existing, comment-free file
fails `pnpm lint` (`host-button.tsx gained comment lines: 0 → 1`, #242, 2026-09-24).

**Why:** the ratchet compares each file only with its own merge-base version. A new file is judged
on its ratio instead (it passes at ≤ 6 comment lines, or ≤ 20%).

**How to apply:** put the effect in a new `use-<name>.ts` hook file (hooks may share a file with
their component, but a new file resets the ratchet). Never drop the mandatory comment to pass.
