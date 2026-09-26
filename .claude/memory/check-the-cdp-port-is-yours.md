---
name: check-the-cdp-port-is-yours
description: "A headless Chrome launched on a taken debug port fails silently, and a CDP driver then drives another agent's browser"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4df80f84-a1ec-4920-93a2-fbc002227c3f
  modified: 2026-09-26T08:19:17.935Z
---

Before driving a headless Chrome over CDP, pick a port nobody holds (`lsof -nP -iTCP:<port> -sTCP:LISTEN`
must be empty) and confirm the browser on it is yours. Its command line must name your own
`--user-data-dir` (`ps -p <pid> -o command`).

**Why:** on 2026-09-24 workerfour launched Chrome on :9333, which workerthree's Chrome already held. The
new Chrome did not bind the port and exited. The probe connected anyway and navigated workerthree's tab
for about 40 s. That reset its frozen state and made its readings suspect. There was no error on either
side.

**How to apply:** use a per-session port (for example 9400 plus a random offset), run the `lsof` check
before launch, and after launch check the `ps` command line for your profile directory.

**Recheck during a run, not only at launch.** On 2026-09-26 (#275 check) workerthree's Chrome passed both
checks on :9471. Mid-run, a page eval then found a different room (`iGzcBHiR6`, lobby, 1 player). After
the kill, :9471 was held by another session's Chrome. A long run must confirm the `/json/list` page URL
and room id before each reading, and the driver must address the target by id, not "first page".
Related:
[[headless-chrome-for-frame-taps]], [[count-draw-calls-without-repo-edits]],
[[frame-tap-may-answer-from-another-tab]].
