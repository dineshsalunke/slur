---
name: check-the-cdp-port-is-yours
description: "A headless Chrome launched on a taken debug port fails silently, and a CDP driver then drives another agent's browser"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4df80f84-a1ec-4920-93a2-fbc002227c3f
  modified: 2026-09-23T20:17:18.113Z
---

Before driving a headless Chrome over CDP, pick a port nobody holds (`lsof -nP -iTCP:<port> -sTCP:LISTEN`
must be empty) and confirm the browser on it is yours. Its command line must name your own
`--user-data-dir` (`ps -p <pid> -o command`).

**Why:** on 2026-09-24 workerfour launched Chrome on :9333, which workerthree's Chrome already held. The
new Chrome did not bind the port and exited. The probe connected anyway and navigated workerthree's tab
for about 40 s. That reset its frozen state and made its readings suspect. There was no error on either
side.

**How to apply:** use a per-session port (for example 9400 plus a random offset), run the `lsof` check
before launch, and after launch check the `ps` command line for your profile directory. Related:
[[headless-chrome-for-frame-taps]], [[count-draw-calls-without-repo-edits]],
[[frame-tap-may-answer-from-another-tab]].
