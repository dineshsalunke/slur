---
name: preview-a-constant-by-route-rewrite
description: "Render a code-constant variant (hex, intensity) on /test-level with no repo edit: Playwright page.route rewrites the Vite module response"
metadata:
  node_type: memory
  type: reference
  originSessionId: c62984f8-3ab5-4d3b-9cc2-9a36f78da769
  modified: 2026-09-26T19:06:30.843Z
---

To show the owner variants of a constant that is not a tuning key (a brand hex, `MARIGOLD_REFERENCE_INTENSITY`),
use Playwright `page.route( url => /accent\.ts|app\.css/.test( url.pathname ), ... )`. Call `route.fetch()`,
rewrite the text, then `route.fulfill( { response, body } )`. Vite dev serves `app.css` as `/app/app.css`,
and that module has the Tailwind theme values in its text, so a hex rewrite there reaches the HUD.

**Why:** #302 (2026-09-27). Five variants were rendered with no repo edits and no HMR on the owner's stack.
Each launch has a clean profile, so `tuning-schema` defaults can be rewritten too.

**How to apply:** launch a fresh browser for each variant. Log which paths were rewritten, and read one
computed colour back to prove that the rewrite applied. The driver is `marigold-variants.mjs` in the #302
scratchpad. Related: [[headless-game-tabs-starve-the-gpu]],
[[tuning-over-cdp]].

### Same trick over raw CDP: drop a feature to count its draws

No Playwright needed. Before navigating, send `Fetch.enable` with
`{ urlPattern: '*features/client-features.ts*', requestStage: 'Response' }`. On `Fetch.requestPaused`, read the
body with `Fetch.getResponseBody` (it may be base64), remove the `\n\tmineClient,` line from Vite's served array,
and answer with `Fetch.fulfillRequest` (base64 body, `Content-Type: text/javascript`). Log whether the replace
matched. F4c #403 (2026-10-17): /test-level drew 76 with mine and 72 without, so mine's slot views own 4.
Driver: scratch `draws.mjs` with `DROP=1` (draw counter as in [[gpu-timing-without-repo-edits]]).
