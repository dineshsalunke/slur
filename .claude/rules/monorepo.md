---
paths:
  - "**/package.json"
  - "pnpm-workspace.yaml"
  - "**/tsconfig*.json"
  - "apps/*/vite.config.ts"
---

# Monorepo & builds

Full research: `conventions/monorepo.md`.

- **`packages/shared` is compiled (`tsc` → `dist`), never source-consumed.** Its `@colyseus/schema`
  classes need legacy `experimentalDecorators` + `useDefineForClassFields: false`; JIT source
  consumption makes two transpilers agree on decorator config, and a silent mismatch turns `@type()`
  into a no-op and corrupts the wire format.
- **`workspace:*` for internal deps** — never a range, never a relative path.
- **`catalog:` for any third-party dep used by more than one package.** Two copies of React or of
  the schema registry is a runtime failure, not a style nit. The catalog is the single source of
  version truth — never hand-copy a version into prose or docs.
- **Resolution via `exports`, not tsconfig `paths`.** Paths aliases build a second resolution graph
  that diverges from runtime.
- **`shared` never imports from `apps/*`.** The DAG points one way.
- **`private: true` everywhere. ESM-only.** No dual publishing, no Turborepo, no speculative
  packages — add one when duplication actually hurts.
