# `art/frame-tap` — LANE STATE

**Replaces itself.** This file says where the work *is*; `LANE-BRIEF.md` says what the work *is* and does
not change. Read the brief first, then this. Written by the supervisor from the lane's first-hand fact dump
— do not re-derive what is here; if what you find contradicts it, **stop and say so** rather than quietly
fixing either one.

Last written: 2026-09-19, at the lane's first context handover (hard stop at ~268k).
`git log -1` is authoritative for HEAD.

---

## 1. Where the branch is

| | |
|---|---|
| Branch | `art/frame-tap`, worktree `../slur-worktrees/frame-tap`, base `1807bc0` |
| HEAD | `ba7319d` |
| **Pushed** | **YES** — `origin/art/frame-tap` at the same SHA, verified by `git rev-parse` on both. Tree clean, no ahead/behind |
| PR | **none opened.** GitHub offered `https://github.com/dineshsalunke/slur/pull/new/art/frame-tap` |
| Ports | client **5203**, server **2603** |
| Gate at `ba7319d` | **green** — `pnpm format` → typecheck → lint (3 pre-existing `noExcessiveLinesPerFile` warnings, all in `packages/shared/src/sim/`, none this lane's) → `--filter @slur/shared` 75 pass → `pnpm -r test` client 9 files/58 tests, server 0 fail → build. Format changed nothing |

Four commits: `ec64ac5` the instrument (plugin, pump, component, 3 test files, docs, mounts on 4 lab
canvases) · `fc29218` live-run defects (45 s timeout, upload error reporting) · `f1e0264` handover ·
`ba7319d` **the retraction** (see §4).

## 2. What it is

A DEV-only frame tap that **removes the Chrome-focus dependency** every visual gate has been paying for.
The dependency was never on focus — it is on `requestAnimationFrame`, which the browser stops calling for a
hidden page. So the instrument stops being a client of that clock and **pumps the frame itself**.

Design **A5 + B5**: a `<FrameTap/>` registering a module singleton, driven over **Vite's HMR channel**, with
a dev-only connect middleware that writes the PNG to disk. Firing a tap is an ordinary HTTP request —
`curl :5203/__frame-tap -o frame.png` — so any tab with the route open is a valid responder, extension or
not.

**It cannot ship, by construction:** `import.meta.hot` is undefined in a production build. Verified by
grepping `apps/client/build/` for `slur:frame-tap`, `x-frame-tap`, `__frame-tap`, `bloom-off`,
`recordDelta`, `capturedDelta` — **all absent**. A 44-byte chunk *named* `frame-tap-*.js` exists and is a
React Router history side-effect, not this code. **Grep strings, never the filename.**

## 3. The acceptance demo — passed, all four steps

1. `document.visibilityState: "hidden"`; `__rafN === 1` read on a **later** call — rAF fired zero times.
2. `GET :5203/__frame-tap?name=art-lab-hidden` → `200`. `refs/art-lab-hidden.png`, **3456×1926 RGBA,
   4,324,611 bytes** (`file(1)`). `firstDeltaSeconds: 9.1657`, `capturedDeltaSeconds: 0.0169`, `pumped: 3`.
3. The image is the real materialized track from the real chase camera, **with bloom**. Viewed, not inferred.
4. **The A/B disagrees numerically.** SSIM R 0.7949 · G 0.8730 · B 0.9265 · **all 0.8648**; PSNR average
   23.645, **alpha `inf`**.

**Why that A/B is evidence and not just a number** — this is the standard to hold: **alpha matches at ∞
while colour does not**, which is the signature of a *post pass* rather than a different scene; and the
**red channel diverges most** (R 0.795 vs B 0.926), which is what a marigold-primary bloom predicts. Either
alone proves nothing. Together they identify *which* disagreement it is.

## 4. ⚠ THE RETRACTION — read this before citing anything about hidden tabs

**"A tab loaded while hidden never mounts R3F at all" was WRONG** and was written into the README as a
measured finding. The effect **does** run in a hidden tab with the canvas still at 300×150 (`PROBE effect
ran, hot = true`), and the request **is** received (`PROBE request received <id>`).

**Why the wrong claim happened, and it is a trap with teeth: HMR updates to `frame-tap.tsx` do not
re-register the listener.** Vite prunes a replaced module's custom listeners, and Fast Refresh does not
re-run an effect inside R3F's reconciler. **So a probe added by editing the file looks like it never ran.**
Confirmed by correlation afterwards: **every successful tap followed a full page reload; every failure
followed an HMR-only update.** Full reload required — always.

The supervisor's standing note: the A/B held and the mount claim didn't because one had an **adversarial
step** and the other didn't — "how could this number be wrong?" was asked of the SSIM and not of the missing
log. Treat that as a **procedure applied to anything about to be written down as fact**, not as an instinct.

## 5. The open failure — exactly where the boundary is

Channel delivers → handler is entered → **nothing**. No upload reaches the server, no error event is sent;
the code neither throws nor rejects.

- **Strongest lead, untested:** the request is logged **received TWICE for one tap** — two identical lines,
  same id, same timestamp. **StrictMode double-registers the listener**, so two pumps and two uploads race
  on one id.
- `[unmeasured]` whether a StrictMode dedupe **alone** clears it.
- `[unmeasured]` whether the hang is in `pumpAndCapture`, `toDataURL`, or the upload fetch — the inner probe
  never loaded, per the HMR trap above, so there is **no reading past handler entry**.

**Ruled out by measurement, not reasoning:** the HMR channel itself (a probe logged delivery; `server.hot`
is the `environments.client.hot` alias in Vite 8), `import.meta.hot` availability (`hot = true`), and the
old 8 s timeout.

**DECIDED — dedupe FIRST, move the listener out of the R3F tree SECOND.** The move changes registration
lifetime as a side effect, so doing it first would fix the bug without anyone learning which change did it —
fix-by-accident. Test the dedupe in isolation. **This is the next slice and nothing else is.**

**Practically the instrument is usable by the art lanes TODAY**: open the lab route while the tab is
visible, then hide it and tap forever. A 504 against a healthy page clears on reload. That is the real
workflow anyway, and the README leads with the caveat rather than the success.

## 6. The four supervisor conditions — all met

1. **Fail loudly** — zero responders → 504 (fired for real during the demo); multiple → 409 naming every
   responder by URL and writing nothing (keyed on distinct href, so an `ab=1` tap's two uploads are not
   mistaken for two tabs); a page that throws → 502. Also fixed a case where it *couldn't*: `void post(…)`
   dropped upload failures into an unhandled rejection, so a page that had given up looked exactly like a
   page that was never there.
2. **Labs only, never `/game`** — mounted on art-lab, art-gallery, env-lab and the shared iso-lab canvas,
   with the reason in the code at each site. Pumping advances a server-authoritative simulation.
3. **Warm-up tunable and reported** — `warmup`/`frames` query params; both `firstDeltaSeconds` and
   `capturedDeltaSeconds` returned. Defaults changed on measurement: **45 s** timeout (8 s was too tight for
   16 frames at 3456×1926 plus a `toDataURL` of a 4 MB PNG, and worse, reported that as "nobody answered"),
   **6 warm-up + 2 kept**.
4. **A/B behind `ab=1`, default off**, with the composer disagreement pinned in tests — fiber's
   `!internal.priority` render guard, its priority>0 counting, postprocessing's `renderPriority = 1`, and
   that the default pump path **never calls `gl.render`**. The test file states plainly that a GPU-less test
   cannot compare pixels; that is the live A/B's job.

## 7. Upstream facts — read from installed source, do not re-derive

- fiber 9.7.0 `advance(timestamp, runGlobalEffects=true, state, frame)` calls `update()` with **no** check of
  `frameloop` / `internal.active` / `internal.frames` — `dist/events-b1bdeb1a.cjs.dev.js:16275`. `loop()`
  gates on all three; `advance()` does not. Pumping a live `frameloop="always"` root is the supported path.
- fiber `update()`: `if (!state.internal.priority && state.gl.render) state.gl.render(...)` — line 16196.
- fiber subscribe: `internal.priority += (priority > 0 ? 1 : 0)` — line 1146. A priority-0 subscriber is inert.
- postprocessing 3.0.4 `EffectComposer`: `renderPriority: n = 1`, `useFrame(..., enabled ? n : 0)`. **So the
  composer becomes the renderer and a pumped frame is the post-processed frame, bloom included.**
- three `Clock.getDelta()` = `(performance.now() - oldTime)/1000`, `oldTime` reset **on every call**.
- `createFixedStep(dt, maxSteps = 5)` **drops the backlog** — a 40 s delta runs 5 steps, not 2400.

**⚠ THE DELTA-AS-rAF-PROBE QUALIFICATION.** The reported delta is "time since the last frame **from any
source**" — and a pump *is* a frame. Two taps back-to-back both report a tiny delta even with rAF stone
dead, because the first tap reset the clock. **To read it as an rAF liveness probe you must leave a gap:
tap, wait ~10 s, tap again.** Without this a lane taps twice, sees 3 ms, and concludes rAF is alive.

**Corrected by the lane against itself:** the claim that a ~40 s first delta would send the ship 2 km down
the track was overstated — `maxSteps = 5` caps it at ~83 ms. The warm-up is still needed, on its real
justification: `updateChaseCamera` damps against the raw delta and snaps.

## 8. Findings handed off elsewhere — not this lane's work

- **`check-canvas-isolation.mjs` is broken and `/art-lab` + every `/iso-*` route are outside the #102
  guard.** `strip()` removes string literals **before** comments, so a possessive apostrophe in prose opens
  a fake string; on an **odd** apostrophe count the mispairing eats the file's own `<Canvas`. Measured:
  `art-lab-canvas.tsx` 39 (odd) → stripped `<Canvas` **false**; `iso-lab-canvas.tsx` 29 (odd) → **false**;
  `art-gallery-canvas.tsx` 20 (even) → true. **The failure is silent and inverted** — such a file is
  reported *clean*. **Filed as issue #127.** Diagnostic scripts stayed in the lane's scratchpad; nothing in
  `scripts/` was touched.
- **Chrome pairing is per-session**, like tab groups — second independent confirmation.
- **Red hazard blocks appear in the tapped `/art-lab` frame** while the art package excludes red. Expected
  pre-art-pass state (`track-materials.ts`'s own header calls its values a shipped-TRON retone, not the
  handoff palette) and the block lane is building the replacement. Flagging it was still correct — the
  instrument surfacing it on its first frame is the instrument working.
- **Refines the standing canvas-size gotcha:** a canvas at the right size with rAF dead proves **sizing and
  rendering are independent gates**, so canvas size tells you nothing about whether anything is rendering.
  `computer screenshot` "forcing a measure" is just the same resize path, nothing mysterious.

## 9. Next actions, in order

1. **The StrictMode dedupe, tested in isolation**, and whether it alone clears the hidden-tab tap.
2. Only if it does not: **move the HMR listener out of the R3F tree**, so a tap against an unmounted Canvas
   answers "R3F has not mounted, load this route once while visible" instead of a 504 — a strictly better
   failure that also drops the dependency on the Canvas having mounted just to *answer*.
3. **A PR** — the branch is pushed and none is open.
