---
name: leave-guard-blocks-cdp-navigate
description: "Page.navigate away from a /game room raises the leave-guard beforeunload dialog, and every later CDP evaluate hangs; open a fresh tab per run"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 3c30e912-f078-4597-ac8e-845b18df48e2
  modified: 2026-09-24T03:25:52.512Z
---

A driven tab on `/game/:roomId` cannot be reused with `Page.navigate`. The leave guard raises a
`beforeunload` dialog. The dialog blocks the page, and every later `Runtime.evaluate` hangs with no
error. The driver then dies on its timeout with no output.

**Why:** on 2026-09-24 (#239) three hosted retries in one tab each printed nothing. `/json/list` showed
the tab still on `/`.

**How to apply:** start each run in a new tab (`PUT /json/new?about:blank`) and close the old page
targets with `/json/close/<id>`, which closes without the prompt. The other fix is
`Page.handleJavaScriptDialog`. For audio checks, wrap `AudioBufferSourceNode.prototype.start/stop`
through `Page.addScriptToEvaluateOnNewDocument`, and tell samples apart by `buffer.duration`. Related:
[[drive-a-hosted-room-over-cdp]], [[two-client-check-needs-two-chromes]].
