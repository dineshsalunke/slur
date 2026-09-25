---
name: queued-message-can-sit-unread
description: A SendMessage to an idle worker can sit unread for hours; check the pane and prompt via herdr
metadata:
  type: feedback
---

A cross-session SendMessage to an IDLE worker can queue and never be acted on. On 2026-09-25 workerone
got the owner's #258 split order, showed it in its pane as `› Message from @slur-supervisor: …`, and sat
on it for hours while the rest of the day's lanes landed.

**Why:** the message drains at the receiver's next tool round, and an idle session may have none.

**How to apply:** after sending work to an idle worker, `herdr pane read <pane>` within a few minutes. If
the message is still shown as `› Message from…` and the pane is idle, send the same instruction with
`herdr agent prompt <pane> "…" --wait --until working`. See [[supervisor-clears-workers-via-herdr]].
