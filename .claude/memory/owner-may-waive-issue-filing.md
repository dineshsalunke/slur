---
name: owner-may-waive-issue-filing
description: "The owner can skip the file-an-issue-first rule for a lane; when they do, do not file one or ask again"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 05e59540-c6da-4787-b653-cfb950ce301c
  modified: 2026-09-23T20:10:46.707Z
---

On 2026-09-24 the owner approved the main-menu lane with "no need to file issues on github just ask it go ahead and do it".
The CLAUDE.md / CONTRIBUTING rule to file an issue before building is the default, but the owner's waiver for a lane overrides it.

**Why:** filing an issue as a gate slowed an approved lane the owner wanted started at once.
**How to apply:** when the owner approves a plan and says no issue, brief the worker to build without one. Do not bring the rule back up for that lane. For a new lane, file an issue as before unless the owner waives it again.
