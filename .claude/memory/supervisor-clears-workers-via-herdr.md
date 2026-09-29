---
name: supervisor-clears-workers-via-herdr
description: "Driving worker panes through herdr: the supervisor can /clear and resume a session itself, herdr agent prompt is the only way to actually submit a typed prompt, an idle worker's queued SendMessage can sit unread, and a pane's context percent is of the 1M window"
metadata:
  node_type: memory
  type: feedback
  originSessionId: e4aeb333-55e9-44fc-ad07-db2ed1a9e60b
  modified: 2026-09-29T04:04:39.946Z
---

### Supervisor clears workers via herdr

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

**How to apply:** when a worker reports a seam, do steps 2–4 yourself. Related:
[[claim-the-lane-before-the-first-write]].

### herdr send-keys does not submit

A worker pane had a prompt typed but never sent. `herdr pane send-keys <pane> enter` and `... Enter` both
left it sitting in the input box (2026-09-29). `herdr agent prompt <pane> "<text>" --wait --until working`
worked: it appended to the typed text and submitted both. Start the appended text with a separator so the
joined prompt still reads.

### Queued message can sit unread

A cross-session SendMessage to an IDLE worker can queue and never be acted on. On 2026-09-25 workerone
got the owner's #258 split order, showed it in its pane as `› Message from @slur-supervisor: …`, and sat
on it for hours while the rest of the day's lanes landed.

**Why:** the message drains at the receiver's next tool round, and an idle session may have none.

**How to apply:** after sending work to an idle worker, `herdr pane read <pane>` within a few minutes. If
the message is still shown as `› Message from…` and the pane is idle, send the same instruction with
`herdr agent prompt <pane> "…" --wait --until working`.

### Pane percent is of 1M

The context bar in a worker's herdr pane status line counts against the **1M** window. The context
watchdog warns at **150k**, which is **15%** on that bar, and hard-stops at 250k (25%).

**Why:** on 2026-09-23 the supervisor read workertwo at "16%" as idle with room to spare and gave it the
sky-review lane. workertwo was already past the warning, took no new work and seamed. The lane lost a
clear/resume cycle.

**How to apply:** before giving a lane to a worker, read its bar. **Under 10%** is fit for a real lane.
**10–15%** is fit for a small task only. **15% or more** means clear it first: ask for a seam, then
/clear and resume.
