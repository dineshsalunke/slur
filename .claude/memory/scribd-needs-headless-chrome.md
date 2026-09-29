---
name: scribd-needs-headless-chrome
description: Scribd (and GameFAQs/PCGamingWiki) block WebFetch and curl; read the text with headless Playwright + system Chrome
metadata:
  type: reference
---

WebFetch and curl on a Scribd document return a "Client Challenge" page, and GameFAQs and PCGamingWiki return 403.
A headless Playwright page with a desktop Chrome user agent loads the Scribd document. Wait about 12 s, then read
`document.body.innerText`. The driver is [[playwright-from-npx-cache-needs-system-chrome]] (use the npx-cache
playwright-core and set executablePath to the system Chrome).

**Why:** on 2026-09-29 (#358) this was the only way to quote the Blur PC manual controls table.

**How to apply:** use it when a claim needs a verbatim quote from a Scribd-hosted manual. Close the browser in a
`finally` block ([[headless-game-tabs-starve-the-gpu]]).
