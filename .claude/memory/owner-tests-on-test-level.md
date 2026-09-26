---
name: owner-tests-on-test-level
description: "OWNER RULE — the owner feel-tests every change on /test-level, not in a hosted room; brief and verify there"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e0d9738a-ceae-4ae7-8eea-d9c8997f4e41
  modified: 2026-09-26T13:34:22.359Z
---

The owner tests everything on `/test-level` (:5173/test-level), not in a hosted `/game/:roomId` room.

**Why:** owner said so on 2026-09-26, after a #269 brief told a worker to measure in a hosted room.

**How to apply:** every lane brief says "measure and verify on /test-level". A feature is not done
until it works there. Hosted-room checks are only for server/sync work. Related: [[one-stack-dev-only]].
