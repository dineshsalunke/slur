---
name: supervisor-clears-workers-via-herdr
description: The supervisor can /clear and resume a worker session itself through herdr; no need to ask the owner to type it
metadata:
  node_type: memory
  type: reference
  originSessionId: 9510520b-595a-4c60-9aba-692fe0097207
  modified: 2026-09-23T11:20:54.126Z
---

Worker sessions run in herdr panes. `herdr pane list` maps names to pane ids (worker names show in
`terminal_title`). The full handover cycle is scriptable:

1. Worker hits the context watchdog (`~/.claude-personal/hooks/context-watchdog.sh`, warn 150k / hard 250k),
   writes `.claude/phases/HANDOVER-<lane>.md`, messages the supervisor "AT A SEAM at ~Nk".
2. Supervisor confirms the worker is idle: `herdr pane read <pane> | tail`.
3. `herdr agent prompt <pane> "/clear"` — it reports `agent_prompt_stalled` because /clear changes no
   agent status; that is success. Verify the status line shows 0%.
4. `herdr agent prompt <pane> "Resume ... from <handover path> ..." --wait --until working`.

**Why:** the owner pointed out herdr can send the keys; asking them to type /clear was an unneeded
handoff (2026-09-23, workertwo on #214).

**How to apply:** when a worker reports a seam, do steps 2–4 yourself. Related: [[claim-the-lane-before-the-first-write]].
