---
name: check-the-cdp-port-is-yours
description: "A headless Chrome launched on a taken debug port fails silently, and a CDP driver then drives another agent's browser"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 4df80f84-a1ec-4920-93a2-fbc002227c3f
  modified: 2026-09-26T08:19:46.629Z
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

**Check IPv4 AND IPv6.** On 2026-09-26 workertwo's Chrome bound only `[::1]:9471`, because
workerthree's Chrome already held 127.0.0.1:9471. Its probe fetched `127.0.0.1` and drove workerthree's
Chrome for ~25 s: it opened a tab, hosted `/game/iGzcBHiR6` and pressed GO. `lsof -iTCP:<port>` must be
empty for both families. After launch, match `/json/version` to your own PID. A driver must address its
page target by id, not "first page", and print the URL and room with every reading.
Related:
[[headless-chrome-for-frame-taps]], [[count-draw-calls-without-repo-edits]],
[[frame-tap-may-answer-from-another-tab]].
