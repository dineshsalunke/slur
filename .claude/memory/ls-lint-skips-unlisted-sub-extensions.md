---
name: ls-lint-skips-unlisted-sub-extensions
description: "ls-lint 2.3 does not check `x.foo.ts` names at all unless `.foo.ts` has its own rule; Biome GritQL plugins are a no-dependency way to add lint rules"
metadata:
  node_type: memory
  type: reference
  originSessionId: 7602243a-1c02-4352-9728-eb359c1ee67e
  modified: 2026-09-26T07:41:08.270Z
---

ls-lint 2.3.1 matches a file by its longest extension. `Bad.constants.ts` passed with only `.ts: kebab-case`
configured. It failed only after `.constants.ts: kebab-case` was added. `.test.ts` names have the same gap.
Verified 2026-09-26 in a scratch copy of `.ls-lint.yml` (#283).

Related: a custom lint rule needs no new dependency. Biome 2.5 runs GritQL plugins (`.grit`) through
`overrides[].plugins`. `$filename` is the absolute path. A regex with a capture group errors out ("matched 1
variables"). `register_diagnostic(..., severity="warn")` works. Biome also formats `.grit` files, so run
`biome format --write` on them. Example: `biome-plugins/component-module-scope.grit`.
