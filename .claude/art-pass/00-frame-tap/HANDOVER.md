# frame-tap lane — handover (2026-09-19)

Branch `art/frame-tap`, worktree `../slur-worktrees/frame-tap`, ports 5203/2603. Two commits on top of
`1807bc0`. **Full verify gate green at both.** Nothing pushed, no PR opened.

| Commit | What |
|---|---|
| `ec64ac5` | The frame tap — plugin, pump, component, three test files, docs, mounts on the four lab canvases. |
| `fc29218` | The three defects the live acceptance run found. |

---

## What is built and proven

`curl 'http://localhost:5203/__frame-tap?name=x'` writes a PNG of the live lab route to
`.claude/art-pass/00-frame-tap/refs/` and answers with its path plus two deltas. Read `README.md` in this
directory first — it is written to be read cold and carries the mechanism, the parameters, and the proof.

**Proven live, not asserted** (`refs/art-lab-hidden.png`, `refs/ab-proof*.png` are on disk from the run):

- Tab `visibilityState: "hidden"`, rAF counter read on a later call at `__rafN === 1` — zero frames fired.
- Tap returned `200`, wrote a 3456×1926 / 4.3 MB PNG of the real track from the real chase camera, blooming.
- `firstDeltaSeconds: 9.17` — the rAF-liveness reading working as designed.
- `ab=1` pair disagrees at **SSIM 0.8648 / PSNR 23.6 dB**, alpha matching at ∞ (a post pass, not a different
  scene), red channel diverging most — which is what marigold bloom predicts.

**Verified from installed source, not recalled** — both claims in the lane brief held, and one strengthened:
fiber 9.7.0's `advance()` checks neither `frameloop` nor `internal.active` nor `internal.frames` (so pumping
on top of the existing loop is the *supported* path, not a workaround); and postprocessing 3.0.4's composer
sits at `useFrame(…, renderPriority = 1)` while fiber's `update()` skips its own `gl.render` when
`internal.priority` is non-zero — so the composer *becomes* the renderer. `frame-tap-interlock.test.ts` pins
both.

---

## The one thing left open — READ THIS BEFORE TOUCHING ANYTHING

**`<FrameTap/>` does not reliably mount in a hidden tab, and I did not finish characterising when it does.**

What is certain:

- A tab **loaded while hidden** never mounts R3F at all. `<Canvas>` gates on a `react-use-measure` size, which
  arrives via ResizeObserver, whose delivery is part of the rendering steps a hidden tab skips. Measured:
  canvas at its unmeasured `300×150`, no `__r3f`, no children rendered. This is the rAF problem one level
  deeper and **the pump cannot fix it — there is nothing mounted to pump.**
- `window.dispatchEvent(new Event('resize'))` from an evaluate forces the measure without focusing the tab:
  the canvas goes to `3456×1926` **with rAF still dead**. (This also corrects the brief: `computer screenshot`
  was not "forcing a canvas measure" by some mystery — same resize path. Canvas size proves nothing about
  whether anything renders.)
- After that resize, one sequence produced a working tap (the 200s above). **A later repeat of the same
  sequence did not** — canvas correctly sized at `3456×1882`, tap still `504`. So sizing the canvas is
  necessary but apparently not sufficient, and the trigger for the component's effect actually running is not
  yet pinned down.

What is *not* the problem, each ruled out by measurement rather than reasoning:

- **Not the HMR channel.** A temporary probe logged `[frame-tap] TEMP-PROBE received Object` when the server
  sent the request event — delivery works. (`server.hot` is already an alias for
  `server.environments.client.hot` in Vite 8; the typed API says so.)
- **Not `import.meta.hot` being absent.** Probe logged `hot = true`.
- **Not the 8 s timeout any more.** That was real and is fixed (45 s), but the current failures are not it.

### How to pick this up

1. Re-add the probe — two `console.log`s, one after `const hot = import.meta.hot` and one wrapping the
   `onRequest` listener — and establish **definitively** whether the effect runs in the failing case. That one
   fact splits the remaining space in half. It is ~5 lines and it is how the last three findings were got;
   theorising about this has a 100% failure rate in this lane so far.
2. If the effect is not running, the fix is probably to move the HMR listener **out of the R3F tree** into a
   module-level or DOM-level dev component that reaches the R3F store another way — then a tap against an
   unmounted Canvas can return a clear "R3F has not mounted; load this route once while visible" instead of a
   504. That is a strictly better failure message and removes the dependency on the Canvas having mounted just
   to *answer*.
3. Do not chase this in the browser for more than a couple of cycles. The `curl`-only path is the deliverable
   and it demonstrably works once the page is mounted; a lane can use it today by opening the route **while
   visible** and then hiding the tab.

---

## Constraints worth keeping

- **Never mount `<FrameTap/>` on `/game`.** Pumping advances the sim; on a server-authoritative route that
  desyncs the client from the server that owns it. Labs only.
- **Nothing ships.** `apply: 'serve'` on the plugin, `import.meta.env.DEV` gate on each mount. Verified by
  grepping `build/` for the runtime strings (`slur:frame-tap`, `x-frame-tap`, `pumpAndCapture`) — all absent.
  A 44-byte chunk *named* `frame-tap-*.js` does appear; it contains a React Router history side-effect, not
  our code. **Grep for the strings, not the filename** — the filename check gives a false positive.
- **Gate order:** `pnpm format` BEFORE `pnpm lint` (biome treats formatting as a lint error), then
  `pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build`.
- Commit without a `Co-Authored-By` trailer (the hook rejects it) and don't bundle `git add` with `git commit`.

## Unrelated observations for the supervisor

- **Chrome pairing is per-session.** This session's `list_connected_browsers` returned `[]` while the
  supervisor's returned a browser on the same machine. Second per-session browser gotcha in this project,
  after tab groups.
- **`check-canvas-isolation.mjs` does not list `ArtLabCanvas` or `IsoLabCanvas` among its discovered
  wrappers** (it reports `Canvas, NetCanvas, ArtGalleryCanvas, EnvLabCanvas, LandingScene`). Pre-existing and
  outside this lane, but if those two are genuinely not discovered, the `/art-lab` and `/iso-*` routes are not
  covered by the guard — worth a look by whoever owns #102.
- **The tapped `/art-lab` frame shows red hazard blocks**, while the art package excludes red from the palette.
  Not my call and possibly just pre-art-pass state, but it is exactly the kind of thing this instrument exists
  to surface, so flagging it for the art lanes.
