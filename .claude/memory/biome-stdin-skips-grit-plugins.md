---
name: biome-stdin-skips-grit-plugins
description: biome lint --stdin-file-path reports no GritQL plugin diagnostics; probe a plugin with a real file under its includes
metadata:
  node_type: memory
  type: feedback
  originSessionId: 12eda9d8-02a7-4ea8-8012-f181e8d58ecd
  modified: 2026-09-26T08:02:23.488Z
---

`biome lint --stdin-file-path=<path>` does not run the `biome-plugins/*.grit` plugins. A snippet that
breaks a plugin rule shows only a format note, so the rule looks dead when it is fine.

**Why:** in #284 (2026-09-26) a stdin probe of `style-custom-properties-only.grit` showed no error. A
temporary, unimported `.tsx` under `apps/client/app/` then showed the plugin error.

**How to apply:** to prove a plugin fires under the repo config, write an unimported probe file that
matches the override `includes`, run `pnpm exec biome lint <file>`, and delete it at once. Prototype
new rules in the scratchpad with a local `biome.json` (`{"plugins":["./rule.grit"]}`). Related:
[[biome-class-sort-glues-arbitrary-property]].
