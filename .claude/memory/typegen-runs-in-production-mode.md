---
name: typegen-runs-in-production-mode
description: "react-router typegen evaluates routes.ts with NODE_ENV=production, so a dev-gated route gets no +types unless typecheck sets NODE_ENV=development"
metadata:
  node_type: memory
  type: project
  originSessionId: 86654d16-bc49-41e4-8b14-744ee59348ef
  modified: 2026-09-26T07:24:28.631Z
---

`react-router typegen` evaluates `apps/client/app/routes.ts` with `NODE_ENV=production`. A route behind
the `process.env.NODE_ENV === 'production' ? [] : [...]` gate gets no `./+types/route`, and `tsc` fails
with TS2307 in any gated route that imports it. `/beat-deck` never hit this because it has no `+types`
import. The client `typecheck` script now runs `NODE_ENV=development react-router typegen && tsc`
(888049a, #279).

**Why:** gating `/test-level` and `/pacing` broke `pnpm typecheck` while the build looked fine.

**How to apply:** keep that env var on the typecheck script. If you add a dev-only route, check
`.react-router/types/app/routes/<name>` exists after `pnpm --filter @slur/client typecheck`.
