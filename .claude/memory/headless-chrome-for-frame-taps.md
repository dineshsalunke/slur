---
name: headless-chrome-for-frame-taps
description: "Judge scene look by driving a separate headless Chrome and curling the frame tap, never by screenshotting the extension tab"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: fe21d7b6-4f47-431b-89f6-c97c1b7f4032
  modified: 2026-09-22T20:36:39.099Z
---

To look at a rendered SLUR frame, launch a **separate headless Chrome** on the dev-server URL and
`curl` the frame tap. Do not screenshot the extension-driven tab.

```
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --user-data-dir=<scratchpad>/chrome-profile --window-size=1600,900 \
  --remote-debugging-port=9333 --enable-unsafe-swiftshader <url>/test-level &

curl -s '<url>/__frame-tap/?name=shot&warmup=60&frames=3&timeout=40000'
```

It writes `.claude/frame-tap-refs/shot.png`, which `Read` renders. `--enable-unsafe-swiftshader` is
what gets WebGL up with no GPU context. Only one page may answer — the plugin refuses two.

**Why:** the extension backgrounds its tab, and that is worse than
[[browser-extension-throttles-fps]] records. `rAF` stops entirely, so screenshots keep returning the
*same stale frame* while the DOM HUD counts on — edits HMR into a canvas that never repaints and
nothing looks wrong. After a reload the canvas does not come back at all: r3f measures before
mounting its children and the ResizeObserver never delivers in a hidden tab, so the whole R3F tree
including `FrameTap` stays unmounted (`document.querySelector('canvas')` reads 300×150, the default
unsized element). Headless renders offscreen, so `document.hidden` is false and all of that works.

**How to apply:** use it for every look judgement, and pair it with the clean-origin rule in
[[the-tunables-store-is-shared]] — a second port gives a clean `localStorage`, headless gives a live
canvas. `FrameTap` must be mounted inside the `<Canvas>` of the route you are shooting; it lost its
only mount sites when the `/art-lab` routes were deleted and is now in `TestLevelCanvas`. Always
pass `warmup=60`: the first frames are not the scene, because drei `<Environment frames={Infinity}>`
has not converged and shows a near-white deck.
