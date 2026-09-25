---
name: tune-headless-captures-via-own-localstorage
description: "For A/B captures, write slur.tuning.v1 into the headless profile's localStorage and reload; this avoids the HMR orphan and never leaks into the owner's tabs"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d6ebc3ab-36ec-4063-9ee5-e104e67ccc37
  modified: 2026-09-25T04:06:30.110Z
---

To capture tuning variants (lights, colours, chase camera) on the owner's live stack, do not call
`setNum`/`setCol` over CDP. Navigate the headless tab to any same-origin URL (for example
`/favicon.ico`). Write `localStorage['slur.tuning.v1']` as `{ "<key>": { "value": v, "from": <current default> } }`,
then navigate to `/test-level`. `restore()` ignores an entry whose `from` does not equal the current
schema default, so `from` must match the value that is in `tuning-schema.ts` now.

**Why:** the headless Chrome has its own `--user-data-dir`, so its localStorage never reaches the
owner's browser. A fresh page load has no HMR module instance, so the orphan problem of
[[cdp-import-of-tuning-hits-an-hmr-orphan]] cannot occur. Used for #258 (5 variants on one Chrome, 2026-09-25).

**How to apply:** use one Chrome and reload per variant. Add `Page.addScriptToEvaluateOnNewDocument` for a
draw-call hook ([[count-draw-calls-without-repo-edits]]). Kill Chrome by PID afterwards
([[kill-by-pid-never-pkill]]). See also [[shared-tunables-storage]].
