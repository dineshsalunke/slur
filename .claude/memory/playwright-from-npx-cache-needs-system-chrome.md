---
name: playwright-from-npx-cache-needs-system-chrome
description: "Headless Playwright driver: import playwright-core from ~/.npm/_npx and pass executablePath = system Chrome; the cached browser builds do not match"
metadata:
  node_type: memory
  type: reference
  originSessionId: e76b4654-bf19-4447-9283-89cfcf02a827
  modified: 2026-09-26T09:30:16.477Z
---

For a scratch Playwright driver, there is no playwright in the repo. Import it from the npx cache:
`PW=~/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs`. Then call
`chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ... })`.

**Why:** on 2026-09-26 (#269) a launch without `executablePath` failed. It looked for
`chromium_headless_shell-1246`, and `~/Library/Caches/ms-playwright` holds only 1194 and 1208.

**How to apply:** Playwright starts Chrome with its own pipe, so there is no debug port to collide on
([[check-the-cdp-port-is-yours]] does not apply). Still pass `--force-device-scale-factor=1 --mute-audio`
([[headless-game-tabs-starve-the-gpu]]). Call `performance.setResourceTimingBufferSize(10000)` in an
init script before you look up module URLs ([[koota-universe-reaches-the-page-world]]). The driver is in
the #269 scratch folder as `boost-check.mjs`: it has the tuning-variant reload, Held-slot boost staging and
the median frame-time loop.
