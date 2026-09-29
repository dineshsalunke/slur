---
name: headless-game-tabs-starve-the-gpu
description: "Headless Chrome driving practice: every open tab rendering the game shares the GPU with the owner, so curl the frame-tap in a separate DPR-1 muted headless Chrome (never the extension tab) and kill it after; launch Playwright with executablePath = system Chrome; a 390px capture needs CDP viewport emulation, not --window-size; and two live clients need two separate Chrome processes"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b06ba10c-bcbb-4b0f-90a2-8c269ab0fee5
  modified: 2026-09-29T04:07:06.423Z
---

### Headless game tabs starve the GPU

A second tab rendering the game at DPR 2 doubled the frame time of the first one. Measured on
2026-09-23: 20.7 ms alone, 40 ms with one rival, and still 40 ms when that rival was vsync-capped,
because at DPR 2 it never reaches vsync. The owner's "<15 fps regression" was this effect, not code.
Today's commits measured flat at 20–22 ms.

**Why:** at DPR 2 the frame is fill-bound (DPR 1 is 8 ms), so any tab that renders the game
saturates the GPU. Because other tabs come and go, the same code read 20, 40 or 66 ms.

**How to apply:** launch headless Chrome with `--force-device-scale-factor=1 --mute-audio`, unless
the measurement needs DPR 2. Kill it the moment the measurement is done. Before you call anything a
perf regression, list the browsers rendering the game (`ps` for headless and GPU processes). Then
A/B the two builds back to back, alone on the GPU. Related: [[extension-tab]].

### Headless Chrome for frame taps

To look at a rendered SLUR frame, launch a **separate headless Chrome** on the dev-server URL and
`curl` the frame tap. Do not screenshot the extension-driven tab.

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --user-data-dir=<scratchpad>/chrome-profile --window-size=1600,900 \
  --remote-debugging-port=9333 --enable-unsafe-swiftshader \
  --force-device-scale-factor=1 --mute-audio <url>/test-level &

curl -s '<url>/__frame-tap/?name=shot&warmup=60&frames=3&timeout=40000'
```

**Rule (supervisor, 2026-09-23):** always pass `--force-device-scale-factor=1 --mute-audio`, and kill
the Chrome as soon as the measurement ends. Never leave a game tab rendering. Also kill any scratch
dev server you started. The owner's sudden drop below 15 fps was GPU contention from agents'
leftover headless tabs plus DPR 2 fill cost. It was not a commit.

It writes `.claude/frame-tap-refs/shot.png`, which `Read` renders. `--enable-unsafe-swiftshader` is
what gets WebGL up with no GPU context. Only one page may answer — the plugin refuses two.

**Why:** the extension backgrounds its tab, and that is worse than [[extension-tab]] records. `rAF`
stops entirely, so screenshots keep returning the *same stale frame* while the DOM HUD counts on —
edits HMR into a canvas that never repaints and nothing looks wrong. After a reload the canvas does
not come back at all: r3f measures before mounting its children and the ResizeObserver never
delivers in a hidden tab, so the whole R3F tree including `FrameTap` stays unmounted
(`document.querySelector('canvas')` reads 300×150, the default unsized element). Headless renders
offscreen, so `document.hidden` is false and all of that works.

**How to apply:** use it for every look judgement, and pair it with the clean-origin rule in
[[tuning-over-cdp]] — a second port gives a clean `localStorage`, headless gives a live canvas.
`FrameTap` must be mounted inside the `<Canvas>` of the route you are shooting; it lost its only
mount sites when the `/art-lab` routes were deleted and is now in `TestLevelCanvas`. Always pass
`warmup=60`: the first frames are not the scene, because drei `<Environment frames={Infinity}>` has
not converged and shows a near-white deck.

### Playwright from the npx cache

For a scratch Playwright driver, there is no playwright in the repo. Import it from the npx cache:
`PW=~/.npm/_npx/9833c18b2d85bc59/node_modules/playwright-core/index.mjs`. Then call
`chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ... })`.

**Why:** on 2026-09-26 (#269) a launch without `executablePath` failed. It looked for
`chromium_headless_shell-1246`, and `~/Library/Caches/ms-playwright` holds only 1194 and 1208.

**How to apply:** Playwright starts Chrome with its own pipe, so there is no debug port to collide on
([[check-the-cdp-port-is-yours]] does not apply). Still pass `--force-device-scale-factor=1 --mute-audio`
(above). Call `performance.setResourceTimingBufferSize(10000)` in an init script before you look up
module URLs ([[koota-universe-reaches-the-page-world]]). The driver is in the #269 scratch folder as
`boost-check.mjs`: it has the tuning-variant reload, Held-slot boost staging and the median frame-time loop.

### Narrow headless captures need a CDP viewport

`chrome --headless=new --window-size=390,844 --screenshot` does NOT give a 390-wide layout. The page
lays out wider (text runs off the right edge), and the capture is cropped to 390. The frame looks
plausible, so a positional reading taken from it is wrong. A finish reviewer rejected one on
2026-09-24.

**Why:** Chrome enforces a minimum window width [inferred ~500px]. Only the viewport emulation
changes the layout width.

**How to apply:** for any phone-size capture, launch headless Chrome with
`--remote-debugging-port` and send `Emulation.setDeviceMetricsOverride` (width, height,
deviceScaleFactor 1, mobile true) before `Page.navigate`. Then `Page.captureScreenshot`. Probe
`innerWidth` and `document.documentElement.scrollWidth` in the same run. Both must equal the target
width. For reduced motion, add `Emulation.setEmulatedMedia` with
`prefers-reduced-motion: reduce`. Check the port is free first ([[check-the-cdp-port-is-yours]]).
Kill the Chrome afterwards (above).

### Two-client check needs two Chromes

For a live check with two clients, launch **one headless Chrome per client**, each on its own debug port
and `--user-data-dir`. Two tabs in one Chrome do not work: only the front tab makes frames. The
background tab still gets network messages, but its `useFrame` work waits until something forces a
frame, for example a `Page.captureScreenshot`. `--disable-renderer-backgrounding` and the other
background flags do not change this.

To count calls to a client function without a repo edit, set a CDP logpoint. Call `Debugger.enable`, and
on `scriptParsed` for the module URL read `Debugger.getScriptSource`. Find the line and call
`Debugger.setBreakpoint` with the condition `(console.log('TAG', …), false)`. Read the output from
`Runtime.consoleAPICalled`. Add `new Error().stack` to get the caller. Put the breakpoint on a line
where the variables you log are already bound. A breakpoint on a `for (const e of …)` header runs
before `e` exists, so the condition throws and nothing is logged.

**Why:** on 2026-09-24 the #233 check put A and B in one Chrome. A's remote spark reached `pushHit` on
time but drained 3.4 s late, at the screenshot. That looked like a render bug. With two Chrome
processes both clients drained in the same frame.

**How to apply:** use this with [[drive-a-hosted-room-over-cdp]] and [[check-the-cdp-port-is-yours]].
Check both ports before launch, and kill both Chromes after. A fresh profile keeps
`localStorage` separate. The console of a reused tab replays old logs on `Runtime.enable`, so ignore
events from before the run starts.
