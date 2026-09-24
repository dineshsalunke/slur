---
name: share-a-vi-mock-through-a-dynamic-import
description: "Share one fake Colyseus room across vitest files with vi.mock(path, async () => (await import('./test-room')).sdkMock); keep that helper free of React/overlay imports"
metadata:
  node_type: memory
  type: reference
  originSessionId: 7e74315f-39ce-4c77-a52d-e5dcbc5354fc
  modified: 2026-09-24T03:31:41.350Z
---

The overlay tests share one fake room: `apps/client/app/game/overlays/test-room.ts` (fake state, the
`send` spy, and `sdkMock`) plus `mount-overlays.tsx` (the mount harness). Each test file writes:

`vi.mock('@colyseus/sdk', async () => (await import('./test-room')).sdkMock);`

**Why:** `vi.mock` is hoisted and cannot reach file-scope bindings (vitest 4.1.10 `index.d.ts`), so
you cannot import the fake statically and hand it in. A dynamic import inside the factory works. The
factory's module is the same instance that the test imports statically, so `bus`/`send` are shared.

**How to apply:** the helper that the factory imports must not import anything that imports the
mocked module (React overlays, `Overlays`). Otherwise the mock factory would load itself in a cycle.
Put the mount harness in a separate file. Render-count mocks (`vi.mock('./roster', …)` with a
`vi.hoisted` counter) stay in each test file. Split in `dc856e7` (#238).
