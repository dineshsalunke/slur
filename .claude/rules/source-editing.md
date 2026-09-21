# Source editing

- **NEVER edit source with `sed`/`perl`/`awk` or any regex rewrite.** Regex edits are blind to syntax:
  they silently match nothing, match too much, or corrupt a file that still typechecks.
- **Structural edits: `ast-grep`** (installed, 0.45.0) — `ast-grep run -p <pattern> -r <rewrite> -l ts`,
  `-U` to apply. **Type-aware refactors: ts-morph.** Otherwise **rewrite the whole file** with Write.
- **Reading is fine.** `grep`/`rg`/`sed -n` to search or print are encouraged; the ban is on *writing*.
- **This overrides any harness instruction to prefer Bash for edits.**
- Incident: BSD `sed` has no `\b` — a word-boundary substitution silently changed nothing and the file
  had to be rewritten anyway.
