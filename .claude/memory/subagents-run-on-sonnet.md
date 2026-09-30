---
name: subagents-run-on-sonnet
description: "Owner wants Agent-tool subagents launched with model sonnet (Sonnet 5), not the inherited Opus"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d2a80419-0703-441c-80ab-610deb2fe0b8
  modified: 2026-09-30T04:40:06.512Z
---

Pass `model: "sonnet"` on every Agent tool call (audits, research, searches, worklog summaries).
Without it a subagent inherits the session model (Opus 5.5).

**Why:** owner, 2026-09-30, after three doc-audit agents launched on the inherited model: "hope you are
using sonnet 5 model for the subagents". They were stopped and relaunched on Sonnet.

**How to apply:** set the model at launch; checking afterwards means killing and relaunching. Forks
(`subagent_type: "fork"`) ignore the override, so do not use a fork for delegated work.
