---
name: bulk-ast-edits-via-ast-grep-json
description: "TypeScript 7 has no classic JS compiler API and ts-morph is not installed; for a many-file move, read node ranges from `ast-grep scan --json` and splice bytes in node"
metadata:
  node_type: memory
  type: reference
  originSessionId: 8d786ebd-860d-4d72-b830-746599220448
  modified: 2026-09-29T10:40:28.273Z
---

The `typescript` package here is 7.0.2 (the native port). `require('typescript')` exports only
`version`. There is no `createSourceFile`, and ts-morph is not installed. CLAUDE.md #15 names ts-morph, but
it is not available.

For a many-file structural move (#380, 76 files on 2026-09-29), this works:

1. `ast-grep scan --inline-rules '<yaml rule>' --json=compact <files>` gives each match's `text`,
   `range.byteOffset.{start,end}` and `metaVariables.single.$N.text`. A nested `has:` rule can capture
   `$N` from a deep node, for example the `variable_declarator` name inside an `export_statement`.
2. Run the rule twice: `language: typescript` for `.ts` and `language: tsx` for `.tsx`. A `typescript`
   rule silently matches nothing in a `.tsx` file.
3. A node script splices the replacement text at those byte offsets, highest offset first, and writes
   each whole file. Keep the script in the scratchpad.
4. Run `biome check --write` on only the touched files. It sorts the imports. It does NOT restore a blank
   line that the splice removed between the imports and the body, so grep for
   `from '...';\nexport` afterwards.

**Why:** `ast-grep run -r` cannot split one import's specifiers between two modules, and regex rewrites are
banned.
**How to apply:** dry-run the script to stdout first, read every new file, then write. Related:
[[ast-grep-footguns]], [[bash-tool-runs-fish]].
