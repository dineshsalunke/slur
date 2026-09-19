# The frame tap — photograph a route from a tab nobody is looking at

**Dev only.** Pull the rendered frame out of a lab route as a PNG on disk, over HTTP, with bloom, without
focusing the tab and without any browser automation in the path.

```
curl 'http://localhost:5203/__frame-tap?name=track-01'
```

```json
{
    "ok": true,
    "files": { "composed": "/…/.claude/art-pass/00-frame-tap/refs/track-01.png" },
    "href": "http://localhost:5203/art-lab",
    "pumped": 16,
    "firstDeltaSeconds": 41.203,
    "capturedDeltaSeconds": 0.0003
}
```

Open the file. That is the whole interface.

---

## Why this exists

Every visual review here used to need a Chrome tab to be **frontmost**. That cost two full sessions, and it
meant the owner could not switch desktops without blinding whichever lane was looking at something.

The dependency was never on focus. A backgrounded tab is `visibilityState: "hidden"` by spec, and the browser
stops calling `requestAnimationFrame` — and R3F's frameloop is nothing but `requestAnimationFrame( loop )`. No
Chrome flag, window arrangement or extension setting changes that; chasing one is the wrong problem. **The fix
is to stop being a client of the browser's clock.**

`@react-three/fiber` 9.7.0 exports `advance()`, which drives one frame on demand. Read from the installed
source (`dist/…cjs.dev.js`), it checks **neither** `frameloop` **nor** `internal.active` **nor**
`internal.frames` — `loop()` gates on all three, `advance()` gates on none. So it drives a live
`frameloop="always"` root whose rAF has merely stopped being called, and **nothing about a visible tab's
behaviour changes**. The instrument does not alter the thing it measures.

## Why the frames have bloom in them

This is the part worth being sure about, because the workaround it replaces looked fine and was not.

`gl.render( scene, camera )` + `readPixels` also works with rAF dead — the art lanes survived on it. But it
draws the raw scene straight to the default framebuffer, **bypassing `EffectComposer` entirely**. No bloom, in
an art direction where bloom is the most load-bearing thing there is. It also bypasses every `useFrame`
subscriber, so the sim, the rig and the chase camera never advance: you re-photograph one frozen pose.

`advance()` runs fiber's real `update()` — every `useFrame` subscriber in priority order, then the render — and
two facts interlock:

- `@react-three/postprocessing` 3.0.4 mounts its composer as `useFrame( …, enabled ? renderPriority : 0 )`,
  `renderPriority` defaulting to **1**.
- fiber's `update()` ends with `if (!state.internal.priority && state.gl.render) state.gl.render(…)`, and
  `internal.priority` counts subscribers with priority **> 0**.

So whenever an `EffectComposer` is mounted, **R3F suppresses its own render and the composer becomes the
renderer**. A pumped frame is the real post-processed frame — provable from source, not from squinting at an
image. `app/dev/frame-tap-interlock.test.ts` pins both halves so a dependency bump cannot quietly undo it.

To *see* the difference rather than trust it, add `&ab=1`. That writes a second file, `<name>.bloom-off.png`,
from a raw `gl.render` over the same framebuffer. The two must disagree; if they ever match exactly, the pump
is not going through the composer and the instrument is lying. It is off by default — it doubles the work per
tap to re-demonstrate what the test already guards.

## No Chrome pairing needed — and the tap measures rAF for you

A tap is an HTTP request to the dev server, and the responder is any Chrome that merely has the route
**loaded**. Not focused, not extension-paired, not driven by CDP. **A lane with no browser pairing at all can
still gate a frame**, as long as someone — the owner, in an ordinary window — has the page open.

The reported `firstDeltaSeconds` is a server-side reading of whether rAF is alive, needing no browser evaluate:

`update()` takes its delta from `state.clock.getDelta()`, which is `(performance.now() - oldTime) / 1000`,
reset on every call. So the first pumped frame's delta is **wall time since the last frame from any source**.
rAF alive → ~0.016. rAF dead for 40 s → ~41.

**The one qualification that makes this honest:** it measures time since the last frame, not rAF liveness
directly — and a pump *is* a frame. Two taps back-to-back both report a tiny `firstDeltaSeconds` even with rAF
stone dead, because the first tap reset the clock. **To read it as an rAF probe, leave a gap:** tap, wait ~10 s,
tap again. A second `firstDeltaSeconds` of ~10 means nothing else drew in between — rAF is dead. ~0.016 means
the tab is being painted. The counter pattern in a browser evaluate
(`window.__rafN = 0; (function tick(){ window.__rafN++; requestAnimationFrame(tick); })();`, read on a *later*
call — never `await` a frame) remains the right independent cross-check, and is worth having precisely because
the alternative is taking a new instrument's word about the condition it was built for.

## The warm-up, and why an idle tab is frozen rather than paused

`warmup` frames are pumped and discarded before the captured one. This is not hygiene, it is a correction:

A tab idle for 40 s hands that entire 40 s to the first pumped frame as its delta. The world has been **frozen,
not paused** — and the warm-up is what reconciles those. The shared `createFixedStep` caps a delta at
`maxSteps = 5` and drops the backlog, so the ship advances ~83 ms of sim rather than teleporting 2 km down the
track; but `updateChaseCamera` damps against the raw delta and snaps. Without a warm-up you photograph that
lurch.

`capturedDeltaSeconds` describes the frame actually photographed, so you can tell a settled frame from a warm
one instead of trusting that it settled. A settled capture is sub-millisecond, because the pump runs its frames
back-to-back in one synchronous turn.

## ⚠ Known intermittent failure — a tap can 504 with the page right there

**Status: not solved.** The instrument works — the frames below are real — but a tap sometimes answers 504
with a healthy, loaded page. Do not read a 504 as proof nothing is open until you have reloaded the page.

**Reload the tab and tap again.** That clears it in every case seen so far.

What the probes established, in order, each replacing a plausible guess with a measurement:

1. **The HMR channel is fine.** A probe logged the request arriving in the page, by id, on a tap that then
   timed out. Delivery is not the problem, and `server.hot` is already the `environments.client.hot` alias.
2. **The component mounts fine — and this corrects an earlier claim in this very file.** `<FrameTap/>`'s effect
   runs in a hidden tab **even with the canvas still at its unmeasured `300x150`**. The earlier note here said
   "a tab loaded while hidden never mounts R3F at all"; that was wrong, inferred from a missing log that had a
   different cause (see 3). The canvas not being *sized* and the React tree not being *mounted* are separate
   things, and only the first was ever observed.
3. **HMR updates to `frame-tap.tsx` do not re-register the listener.** Vite prunes a replaced module's custom
   listeners, and React Fast Refresh does **not** re-run the effect inside R3F's reconciler to re-register
   them. So after any edit to this file, taps silently stop working until a **full page reload** — and a probe
   added by an edit appears "never to run", which is exactly the false signal that produced the wrong claim in
   2. **Anyone debugging this must reload, not rely on HMR.**
4. **The remaining failure is downstream of the handler being called.** In the last failing run the request was
   received (twice — StrictMode double-registers the listener) and then nothing: no upload, and no error
   either, so the code neither threw nor rejected. Something between `pumpAndCapture` and the upload is
   hanging or being dropped. The StrictMode double-registration is the strongest untested lead.

The measure gate below is still real and worth knowing, it is just not the cause of the 504s:

```js
window.dispatchEvent( new Event( 'resize' ) )
```

That takes the canvas `300x150` → `3456x1926` **with rAF still dead**, without focusing the tab — which is
also what corrects the brief's note that `computer screenshot` "forces a canvas measure" by some mystery. Same
resize path. And a correctly sized canvas with rAF dead proves **sizing and rendering are independent gates**,
so canvas size tells you nothing about whether anything is rendering.

## Parameters

| Query | Default | Meaning |
|---|---|---|
| `name` | `frame` | Output basename. `/^[a-z0-9][a-z0-9-]{0,63}$/i` — one segment, no dots or separators, so traversal is impossible by construction. Re-tapping a name overwrites it. |
| `warmup` | `6` | Frames pumped and discarded first. |
| `frames` | `2` | Further frames pumped; the last one is captured. |
| `ab` | off | `ab=1` also writes `<name>.bloom-off.png` via a composer-bypassing `gl.render`. |
| `timeout` | `45000` | Milliseconds to wait for a page to answer. A hidden tab's GPU work is throttled; an 8 s budget failed every time and reported it as "nobody answered". |

Files land in `.claude/art-pass/00-frame-tap/refs/`, already gitignored via `.claude/art-pass/.gitignore`
(`*/refs/`).

## When it fails, it says so

The failure modes here are silent by nature, and a tap that quietly returned a stale or someone-else's frame
would be worse than no instrument — every downstream art judgement would inherit it.

- **504, nobody answered.** No tab has a lab route loaded on this port, or its HMR socket is not connected (a
  tab left open across a dev-server restart is not). Reload the page.
- **409, several tabs answered.** Three lanes share one Chrome, so this is likely rather than hypothetical. The
  response **names every responder by URL and writes nothing** — there is no last-write-wins. Close all but
  one, tap again.
- **502, the page failed to tap.** The page raised mid-pump and said so, rather than leaving you to read its
  silence as "no tab open".

## Proof it works, and that the frames have bloom

Demonstrated 2026-09-19 on `:5203/art-lab`, in a tab that was **never focused**:

- `document.visibilityState` — `"hidden"`. rAF counter installed, then read on a **later** call: `__rafN === 1`,
  i.e. rAF had fired **zero** times since. (Never `await` a frame — the hang is the diagnosis.)
- Tap returned `200` and wrote a `3456x1926`, 4.3 MB PNG. `firstDeltaSeconds: 9.17` — nine seconds since the
  last frame from any source, the rAF-liveness reading behaving exactly as predicted.
- The image shows the real materialized track from the real chase camera, blooming.
- `ab=1` wrote both images. They **disagree**, numerically, as they must:

  | metric | value | identical images would be |
  |---|---|---|
  | SSIM (all) | **0.8648** | 1.0 |
  | PSNR (avg) | **23.6 dB** | ∞ |
  | PSNR (alpha) | ∞ | ∞ |

  Alpha matching exactly while colour does not is the signature of a post-processing pass rather than a
  different scene. And the **red channel diverges most** (SSIM R 0.795 vs B 0.926), which is what a
  marigold-primary bloom predicts — the disagreement is bloom, not noise.

## Where it is mounted, and where it must never be

`<FrameTap/>` is mounted inside the Canvas on the lab routes only — `/art-lab`, `/art-gallery`, `/env-lab`, and
every `/iso-*` via the shared `iso-lab-canvas`.

**Never on `/game`.** Pumping *advances the simulation* — that is exactly why it beats a bare `gl.render` — and
on a server-authoritative game route that means stepping the sim outside the netcode's clock, desyncing the
client from the server that owns it. The labs run `simulate()` with no room in the path, so stepping them costs
nothing.

## Shipping

Nothing here reaches production. The server half is `apply: 'serve'`, and the client half is guarded by
`import.meta.hot`, which is **undefined in a production build** — dev-only by construction rather than by a
flag someone has to remember. `pnpm build` output contains neither.

## Files

| File | What |
|---|---|
| `apps/client/frame-tap-plugin.ts` | Server half: the HTTP endpoints, the responder arbitration, the file write. Carries the five-mechanism record for how the PNG reaches disk. |
| `apps/client/app/dev/frame-tap-pump.ts` | The pump, pure and injectable. Carries the composer-interlock proof. |
| `apps/client/app/dev/frame-tap.tsx` | The `<FrameTap/>` component: HMR listener, priority-0 delta observer, upload. |
| `apps/client/app/dev/frame-tap-interlock.test.ts` | Pins the upstream mechanism against a dependency bump. |
| `apps/client/app/dev/frame-tap-pump.test.ts` | Pins pump order — notably that the default path never calls `gl.render`. |
| `apps/client/frame-tap-plugin.test.ts` | Pins the name whitelist and the fail-loudly arbitration. |
