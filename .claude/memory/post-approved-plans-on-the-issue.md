---
name: post-approved-plans-on-the-issue
description: "When a worker's plan is approved, the supervisor posts the full plan plus the approval line as a comment on the issue, so a cleared worker can rebuild from it"
metadata:
  node_type: memory
  type: feedback
  originSessionId: a38d3dae-8594-4ef8-a215-57334722eac7
  modified: 2026-10-17T10:49:04.142Z
---

When the owner (or the supervisor under a go-ahead) approves a worker's plan, post the whole plan as a
comment on the issue. Start it with one line naming who approved which choices. Then tell the resumed
worker "the approved plan is the latest comment on #N".

**Why:** on 2026-10-17 workers seamed at ~150k after nearly every half-stage, often right after sending a
plan. A worker's handover held only "plan sent, waiting", not the plan text, so a cleared session could not
build from it. The issue comment became the durable record for F4d–F4f and survived every /clear.

**How to apply:** do this before clearing the worker. Also tell workers to run every test suite, client
included, before each push. A shield sim-half commit once left `dev` red on a client test.
Related: [[supervisor-clears-workers-via-herdr]], [[claim-the-lane-before-the-first-write]].
