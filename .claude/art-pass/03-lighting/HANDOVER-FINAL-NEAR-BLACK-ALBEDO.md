# HANDOVER — what the renderer actually does to a near-black surface

Written 2026-09-20 by the `fix/near-black-albedo` lane, as its final act. Assumes you have never seen the
session that produced it. Everything below was measured or read from installed source this session; where
something was not measured, it says so.

## The question, and the answer

Issue **#171** said the Split Crown's hull coating is authored near-black — `baseColorFactor`
`[0.00700, 0.00913, 0.01161]` linear — but *"renders mid-grey (~0.4 linear by eye)"*, a 50–60x gap. If that
were true it would be a colour-management fault in the render path, and because near-black is the house
palette it would mean every material decision in the project so far had been made against a moved target.

**It is not true.** The hull's lit face renders at **0.04971 linear** — 8-bit `#3f4348`. The claimed 0.4
linear would encode to 8-bit **170**; the measured value is **63**. The issue overstates by **8x**. There is
no 50x gap, there is no colour-management problem, and on the one surface far enough from a light to show it,
near-black arrives correctly. **#171 closes invalid.**

The estimate was wrong for a specific and repeatable reason, which the next section covers, because it will
happen again to someone else otherwise.

## The `shipBox` phantom — this has now fired three times

`/art-lab` has a layer toggle called `shipBox`. When it is on, `apps/client/app/routes/art-lab/ship-box.tsx`
mounts a box sized from the ship's collision half-extents and gives it `<meshBasicMaterial color="#404040" />`
— an **unlit** material at mid-grey, drawn at exactly the position the ship occupies.

The trap is the defaults. `lab-layers.ts` ships:

```
ships: false,
shipBox: true,
```

So **a freshly opened `/art-lab` hides the ship and draws the grey slab in its place.** At a glance, in a
chase-camera frame, a featureless grey block sitting on the deck reads as a ship that is untextured,
mid-grey, and half sunk into the floor. It has been mistaken for the ship three separate times, and it is the
source of the "hull renders mid-grey" estimate that became #171.

The tell, if you ever suspect it again, is variance. Sampling a 81×81-pixel patch of the slab returned
`#404040` with **min = max = 64 on every channel across all 6561 pixels**. A lit, shaded, geometrically
detailed hull cannot produce zero variance. If a patch of your "ship" has no gradient at all, it is not the
ship.

**Fixing the defaults is issue #174** (`ships: true`, `shipBox: false`, plus a lab-only default ship constant
so the lab opens on the Split Crown). Note the trap recorded on that issue: the lab default must **not** be
`DEFAULT_SHIP` in `packages/shared/src/ship-classes.ts`, which decides what every real player flies.

## The colour path, as established fact

Every stage below was read from installed source in `node_modules`, not recalled. This matters because the
conversion from a sampled 8-bit pixel back to linear radiance is wrong if any stage is guessed.

**1. React Three Fiber 9.7.0 sets a tone-mapping default of ACESFilmic.** In
`@react-three/fiber/dist/events-156d8d12.esm.js`:

```js
gl.outputColorSpace = linear ? THREE.LinearSRGBColorSpace : THREE.SRGBColorSpace;
gl.toneMapping = flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
```

The `<Canvas>` in `art-lab-canvas.tsx` passes no `gl` prop and sets neither `flat` nor `linear`, so on its own
this canvas would be ACESFilmic with sRGB output.

**2. But `<EffectComposer>` overrides it to `NoToneMapping`.** In `@react-three/postprocessing` 3.0.4,
`dist/index.js`, inside the `EffectComposer` component (minified; `_e` is the imported `NoToneMapping`, `d` is
the `gl` renderer):

```js
A(()=>{const C=d.toneMapping; return d.toneMapping=_e, ()=>{d.toneMapping=C}},[d]);
```

That is a mount-time assignment of `gl.toneMapping = NoToneMapping`, restored on unmount.

**3. The effect stack contains Bloom and nothing else.** `art-lab-canvas.tsx` renders
`<EffectComposer multisampling={0}><TunedBloom config={env.bloom} /></EffectComposer>`, and `TunedBloom`
resolves to drei/postprocessing's `<Bloom>` (or `DevBloom` in DEV, which is the same effect driven
imperatively). **There is no `ToneMappingEffect` anywhere in the chain.**

**Therefore: the composed frame carries no tone mapping at all, and the only encode between linear radiance
and the stored 8-bit pixel is the sRGB OETF.** To invert a sampled pixel, apply the plain sRGB EOTF and
nothing else:

```
c = v / 255
linear = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
```

## The control argument — why a colour-management error is impossible, not merely unlikely

This is the load-bearing reasoning of the whole investigation and it must survive without its author.

The `shipBox` slab is an **unlit** `meshBasicMaterial` authored as `#404040`. Three interprets that hex as an
sRGB colour and converts it to linear on assignment. The material is unlit, so nothing scales it. It is then
tone mapped (or not), encoded to the output colour space, and written to the framebuffer.

Sampled out of the composed PNG, it reads **`#404040` — bit for bit, min = max = 64, across 6561 pixels.**

An exact identity round trip is only possible if the transfer chain is itself identity: sRGB decode in,
sRGB encode out, with **no** tone map and **no** exposure scale in between. Any tone-mapping curve is
non-linear everywhere, so ACESFilmic — or AgX, or Reinhard, or any exposure multiplier other than exactly
1.0 — would have moved this pixel. It did not move.

So the measured identity is not weak evidence that the colour path is probably fine. It **rules out** a
transfer-function or exposure error of any magnitude, 7x and 50x included, because such an error would
necessarily have displaced a pixel that provably was not displaced. Whatever brightness the hull carries is
**light in the scene**, not a broken pipeline.

## The measurement, reproducibly

**Lab state.** `/art-lab`, seed **1234**, ship **Split Crown**, layers: `floor` ON, `boundary` ON, `blocks`
OFF, `backdrop` ON, `env` OFF, **`ships` ON**, **`shipBox` OFF**, `finish` OFF, **bloom ON**. Camera is the
lab's own chase rig at its defaults, ship stationary at the start line (`z 0 / 8000`, `seg 0/400`). Until
#174 lands you must set `ships` and `shipBox` by hand after every page load — they are `useState` with no
persistence, so a reload silently returns you to the slab.

**Capture.** The frame tap, which writes the *composed* frame including bloom:

```
curl 'http://localhost:5200/__frame-tap?name=<name>'
```

It answers with the path and writes to `.claude/art-pass/00-frame-tap/refs/<name>.png`. Those refs are
gitignored (`.claude/art-pass/.gitignore:3`), so a frame reproduces by re-tapping, never by reading a
committed file. The frame these numbers come from was tapped as `relay-probe`. Read the *port* section below
before you trust any tap.

**Decode.** No image library is installed and none was added; ImageMagick is not on this machine. The PNG was
decoded with a ~60-line Node script using only built-in `node:zlib` — parse IHDR, concatenate IDAT, `inflateSync`,
then undo the per-scanline PNG filters (None/Sub/Up/Average/Paeth). The tap writes 8-bit non-interlaced
RGBA (colour type 6), which is the only case that needs handling. Per sample it averages a square patch and
also reports per-channel min and max — **the min/max is not decoration, it is how the slab was identified**,
and any re-take should keep it.

**Convert.** Apply the sRGB EOTF above. No tone-map inversion, for the reason established in the previous
two sections.

### The samples

Authored material values, read directly from the GLB binary (the file contains **0 images**; `extensionsUsed`
is `["KHR_materials_emissive_strength"]` only):

| material | `baseColorFactor` (linear) | other |
|---|---|---|
| `Charcoal_coating` | `[0.00700, 0.00913, 0.01161]` | roughness 0.48, metalness 0 |
| `Recess_interior` | `[0.00152, 0.00182, 0.00212]` | roughness 0.72 |
| `Armor_panels` | `[0.00972, 0.01298, 0.01681]` | roughness 0.43 |
| `Recess_bezels` | `[0.01600, 0.02029, 0.02416]` | metalness 0.3 |

Measured, from `relay-probe.png` (3456×1994):

| sample | 8-bit | linear (R) | ×`0.00700` | ×`0.00972` |
|---|---|---|---|---|
| hull top plate | `#3f4348` | **0.04971** | 7.10x | 5.11x |
| hull left pod | `#3f4449` | 0.05002 | 7.15x | 5.15x |
| hull body, shadow side | `#25282c` | 0.01841 | 2.63x | 1.89x |
| deck beside the ship | `#2a2e34` | 0.02355 | 3.36x | 2.42x |
| **deck far from the rails** | `#101113` | **0.00510** | **0.73x** | 0.52x |
| `shipBox` slab (control) | `#404040` | 0.05127 | — | — |

### Reading the table

The row that closes the issue is **deck far from the rails: `#101113`, 0.00510 linear.** An authored `0.00700`
encodes to 8-bit 20, which is `#171A1D`. That is what a correctly-rendered near-black surface looks like when
no emitter is near it, and it is what the deck actually shows. Near-black arrives.

The hull's residual ~7x over the authored charcoal is **not** distributed like a material fault. The hull's
own shadow side is 2.63x while its lit face is 7.10x, and the deck immediately beside the ship is 3.36x while
the same deck far away is 0.73x. **Ship and deck brighten and darken together as a function of distance from
the rails.** A transfer-function error is a constant multiplier and would be flat across the frame; a
spatial gradient that tracks the light is irradiance. The rail emitter array runs `intensity 40`, `range 600`
(`/art-lab`'s own tuning panel), and the ship sits between two of them.

For a Lambertian surface, outgoing radiance is albedo × irradiance / π, which is unbounded above — a bright
enough emitter close enough makes a 0.007 albedo read well above 0.007. Nothing in these numbers requires a
bug to explain.

This is also consistent with, not contradicted by, the `sealed-block` lane's separate computation that a
sealed block's player-facing −Z face receives rgb(0,0,0): that face has **no emitter in range**, which is the
same physics as this handover's far-deck row.

## What was NOT measured

**Whether the hull's albedo is right for the art direction.** This lane measured the *renderer*, not the
*design*. The finding is that `0.00700` linear is transported to the screen correctly and that the surface's
on-screen brightness is explained by scene lighting. Whether a charcoal coating at that albedo, lit by that
rail array, is what the art package wants the Split Crown to look like is an open artistic question that
nobody has answered and that no measurement in this document bears on. Do not cite these numbers as approval
of the material.

## Bearing on #173 (the missing contact shadow)

#173 proposes that the ship reads as sunk because nothing in this game casts a shadow, so there is no cue
marking where the hull meets the deck. These measurements support that reading over the albedo one.

The hull's lit face is **0.04971** and the deck immediately beside it is **0.02355** — a **2.1x step in
linear radiance at the seam**. Tonal separation between ship and deck therefore *does* exist; the two
surfaces are not rendering at the same value. What is absent is **contact darkening** — the local occlusion
that would normally sit in the gap under the hull. That is a missing cue, not a missing contrast.

## The frame tap as an instrument — what this session paid to learn

**A dead port serves a live-looking page, and the tap blames the wrong half.** For a long stretch of this
session the lab looked perfect in Chrome — the track rendered, the tuning panel worked, the console logged
`[vite] connected` — while **nothing was listening on port 5200 at all.** The page had been served from
Chrome's cache after the dev server died, and the HMR socket had later reconnected to a *different* server. A
tap in that state returns *"frame-tap: nobody answered... it does need to be loaded, and its HMR socket
connected"*, which points at the tab and sends you to debug visibility, mounting and R3F roots — none of
which is wrong. **The real check is the port:**

```
lsof -nP -iTCP:5200 -sTCP:LISTEN
```

If that prints nothing, no amount of tab work will help. `curl -s -o /dev/null -w "%{http_code}"` returning
`000` is the same signal. Restart with `PORT=2600 nohup pnpm dev > .claude/lane/dev.log 2>&1 &` from the
worktree root, then force a genuine fetch with a cache-busting query (`/art-lab?cb=<n>`) rather than trusting
a plain reload.

**Never use a tap as a cheap "is anything open?" probe — it can kill the dev server.** This is issue **#172**.
In `apps/client/frame-tap-plugin.ts`, `entry.done` writes the HTTP response through a `json()` helper with no
`res.headersSent` guard and no settled flag, and it is reachable from three places: the deadline timer, the
settle timer, and the `slur:frame-tap:error` handler. A second call throws `ERR_HTTP_HEADERS_SENT` from
inside a timer callback, where nothing catches it, and **Node exits**. The crash signature in
`.claude/lane/dev.log` is:

```
Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client
    at json (...vite.config.ts.timestamp-....mjs)
    at Object.done (...)
    at Timeout._onTimeout (...)
```

followed by `Exit status 1`. **This lane triggered it**, with a five-iteration retry loop of taps against an
unresponsive page. A previous stack death in this worktree was wrongly blamed on the machine's IP changing
and was very likely the same bug. Check the port, then the tab, and tap **last**. The default tap budget is
generous — `DEFAULT_TIMEOUT_MS = 45_000` — so a single tap that appears to hang is usually just waiting out
its deadline, not stuck.

**The intermittency is unexplained and is the one loose end.** After the restart, with the page freshly
served, visible, mounted and HMR-connected, a tap named `relay-probe` answered normally and produced the
frame all of this document's numbers come from. The very next tap, against the same page with nothing changed
between them, returned *"nobody answered"* and timed out. Both conditions were identical as far as anything
observable goes. **No explanation was found.** Anyone relying on the tap should expect to retry — but
carefully, one at a time and not in a loop, given #172 above.

**Never close a Chrome tab.** `tabs_close_mcp` is forbidden on this lane permanently. Closing the last tab
quits Chrome and breaks the next agent's browser tools, with the failure appearing somewhere that gives no
hint of the cause. It has bitten twice. Let tabs accumulate; the owner closes them.

**A tab is per-session and cannot be inherited.** `tabs_context_mcp` answers *"No tab group exists for this
session"* for any tab a previous session opened, so a handover must never record a tab id as state. Open your
own, and make it **visible before you rely on it** — R3F's root creation gates on a measured size, so a tab
that has never been visible never mounts and its tap responder does not exist to answer.
