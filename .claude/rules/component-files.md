---
paths:
  - "apps/client/app/**/*.tsx"
  - "apps/client/app/**/*.constants.ts"
  - "apps/client/app/**/*.utils.ts"
  - "apps/client/app/**/*.state.ts"
---

# Component file layout (issue #283)

Full rule: `conventions/r3f.md` § "House React style", item 2.

- A `.tsx` holds its one component and nothing else at module level: no `const`/`let`, no helper
  function, no class, no scratch object.
- Move each module-level item to a colocated file named after the component:
  - constants, scratch THREE objects, shared geometries and materials → `<name>.constants.ts`
  - pure helpers → `<name>.utils.ts`
  - mutable module state (pools, queues, caches) and the functions that drive it → `<name>.state.ts`
  - a hook → `use-*.ts`, one per file
- A component with any sibling file lives in `<name>/`. No `index.ts`; import the file by name.
- Types and interfaces may stay in the `.tsx`. A `lazy()` component binding may stay.
- Route modules (`root.tsx`, `routes/home.tsx`, `routes/*/route.tsx`) keep their framework exports
  (`loader`, `clientLoader`, `action`, `meta`, `links`, `headers`, `handle`, `shouldRevalidate`).
- `pnpm lint` warns: `biome-plugins/component-module-scope.grit`. A moved file is a move only — no
  behaviour change in the same commit.
