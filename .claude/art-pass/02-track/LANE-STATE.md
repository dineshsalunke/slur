# `art/track` — LANE STATE

**Replaces itself.** This file says where the work *is*; `LANE-BRIEF.md` says what the work *is* and does
not change. Read the brief first, then this. Written by the supervisor from the lane's first-hand reports
plus facts verified directly in the tree — so do not re-derive what is here; if what you find contradicts
it, stop and say so rather than quietly fixing either one.

Last written: 2026-09-19, supervisor session **`supervisor`**, at the second context handover.

---

## 1. Where the branch is

| | |
|---|---|
| Branch | `art/track`, worktree `../slur-worktrees/track` |
| HEAD | `git log -1` is authoritative — **this file cannot name its own commit** without being one behind, so it doesn't try. The last *code* commit is the scene probe; before it, the sky knobs |
| Base | `1807bc0` (`dev` when task 1 merged) |
| Code commits | `604bf0c` docs/brief · `1bb5839` slice 0 · `c937888` sky knobs · `eedd49e` scene probe |
| Working tree | clean |
| Pushed | **yes** — `origin/art/track`, verified `rev-list --left-right --count` = `0 0`. No PR open |
| Verify gate | `pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build` |
| Gate result | **green** — lint 3 pre-existing `noExcessiveLinesPerFile` warnings + "✓ Canvas-isolation: 8 route entry modules clean"; 75 shared · 34 client · 4 server; SPA build |
| Ports | client **5201**, server **2601** · stack up |
| Review URL | `http://localhost:5201/art-lab` (chase camera — the gate) |

**Who pushed:** the *supervisor* pushed this branch twice, at the docs commits and again at the probe, because
three commits living only inside one worktree is one disk failure from gone. Nothing rewritten, nothing
forced. It should have told the lane; an unexplained push into your own branch is a reasonable alarm and you
were right to raise it.

## 2. What is built

**Slice 0 — the honest review frame (`1bb5839`).** All three decisions landed:

- **D3, tone mapping ON.** `toneMapped: false` came off the track surfaces, `tube-walls.tsx` and `track.tsx`.
  Deliberately *not* the other eleven files that still set it — finish gate, pickups, bolts, sparks,
  explosions, ship engines are VFX whose values trade against the bloom and exposure budget **task 3 owns**.
  No panel switch exists and none is to be built.
- **D4, the lab lost its own lights.** `/art-lab`'s `ambientLight` and `directionalLight` are gone; the
  `DeepSpaceSky` rig mounts **unconditionally** and `backdrop` hides only the visible patch.
- **D5, placeholder boxes out of frame.** `TrackView`'s welded `hazards` toggle is split into independent
  `layers.rails` / `layers.blocks`, blocks default OFF. Structural, not a flag: `track-view.tsx` is a 19-line
  composer over `track-ribbon.tsx` (floor quads + rails), `track-blocks.tsx` and `track-instancing.ts`
  (shared `put`/`park`, `AHEAD = 900` / `BACK = 80`). **Slice 1 deletes the floor quads out of `TrackRibbon`.**

**Sky framing knobs (`c937888`)** — `art-lab-canvas.tsx` mounts `<TunableSky>` instead of the frozen
`DEEP_SPACE`, reading the same `SKY_TUNING` singleton `/iso-sky` writes, so the two labs cannot disagree
about what ships. `TunableSky`'s two-`useMemo` split is preserved, so a pan drag does not re-bake the
`<Environment>` cubemap. **The star is coupled to pan inside `writeSkyTuning`** (`sky-tuning.ts:101`) because
`starBearingDeg: 66` was measured *through* the backdrop mapping and names a point in the **image**, not the
world. This is the INSTRUMENT, not the answer — no committed sky value changed.

**The scene probe (`eedd49e`).** `art-lab/scene-probe.tsx`, DEV-only, header *"TEMPORARY DEBUG INSTRUMENT —
DELETE, DO NOT EVOLVE"*, publishing `{scene, camera, gl}` on `window.__ART_LAB` via `useThree`. Mounted as
one line in `art-lab-canvas.tsx`. Committed **alone** so it reverts alone. Nothing in the lab reads it.

## 3. THE SPHERE IS RESOLVED — it is the planet, and the remaining move is the owner's

The owner reported *"a black sphere in front of the track"*, camera-pinned. It is **not a bug**: it is the
planet baked into `nebula-backdrop.jpg`, cropped so its lit rim falls above the top of the frame.

**Read live off the running scene** — exactly **five** renderables, exactly **one** sphere:

1. The backdrop patch — `SphereGeometry` r=1200, phiStart 160°, phiLength −140°, thetaStart 50.6°,
   thetaLength 78.8°, `MeshBasicMaterial` #ffffff, transparent, `depthWrite=false`, `renderOrder=−1`,
   DoubleSide. Exactly as authored.
2. drei `<Stars>` — Points/ShaderMaterial, bsR 523.5.
3. `TrackRibbon`'s floor quads — instanced Box #050507, **`visible=false`**, correctly suppressed by
   `showFloor={!layers.slab}`.
4. The rails — instanced Box #15171a, visible.
5. `TrackFloor` — BufferGeometry / MeshStandardMaterial #ffffff, bsR 4000.1.

**No unexplained object exists.** An earlier report read that absence backwards — *"this object should not
exist, therefore something untraced mounts it"* — when "no rogue object exists" was evidence **for** the
planet reading.

**Why it reads featureless.** Visible image window at the chase camera ≈ source x 278..1394, y 367..941;
frame centre maps to source (836, 724). The planet's lit terminator runs (1311,0) → (984,440), so only its
bottom tip is in frame and the entire bright rim sits above the top edge. Frame centre to planet centre
(1709,642) is 877 px against a fitted radius of 755, so the limb passes ~10° up-and-right of centre and the
body fills the upper right. Camera-pinned because the sky is camera-locked. **This is the same observation
as the earlier "the planet reads centre".**

**The knob is `Tilt`** (`backdrop.elevationDeg`, currently `0`). Verified by the supervisor: `sky-config.ts`
is **byte-identical between `origin/dev` and this branch**, so nothing framing-related has moved and the
owner still sees the sphere — which is the expected state, not a contradiction. Lowering tilt should bring
the terminator into frame. **Nobody has touched it; it is the owner's framing call, not this lane's.**

**Eliminated — confirmed LIVE:** no rogue object; the backdrop cannot depth-clip (`depthWrite=false`,
`renderOrder=−1` read off the live material); the sky mapping is **not** mirrored (brightest sky pixel, luma
204, unprojects to source (357,399), the nebula's left-hand wisps — so `sky-backdrop.tsx`'s negative-
`phiLength` reasoning holds); all sky content belongs to the patch (rotating it +25° about Y translated
everything, then restored).
**Eliminated — from SOURCE only, not confirmed live:** drei 10.7.8 portals `<Environment>` children into
their own `new Scene()` so `<Lightformer>`s never reach the main scene; drei `<Stars>` is `AdditiveBlending`
and can only add light.

> **⚠ RETRACTED: the "near-white, clipped slab and rails" finding.** That was a bloom-ON eyeball read of a
> thumbnail. **Bloom-OFF point samples: slab RGB (60,64,70) · rail (91,98,109) · upper sky (4,6,12)** against
> void `#02030a` = (2,3,10). Mid-dark grey, **not clipped**. The sharper finding: the blow-out is a
> **BLOOM-BUDGET** problem, which **task 3 owns**, not an emissive-value problem here. **Slice 2 is NOT
> enlarged by it** — an earlier "slice 2 is a bigger job than pick a value" is withdrawn by the lane that
> said it. And it does **not** settle the ACES question either way: that stays **[unmeasured]**.

## 4. Measured numbers — do not re-derive these

- Source jpg `nebula-backdrop.jpg` is **1672×941**. Hung at `fovDeg 140` ⇒ **0.0837 °/px**, isotropic
  (vertical derived from texture aspect, not authored).
- Planet limb fit (Kasa): centre **(1709.5, 642.3)**, r **755.1**, rms 1.02 px over 211 points, clean arc
  y 0–420. **Corroborates** the recorded (1679, 622) r 719 — that earlier number stands.
- Source-region luma means: planet body deep **32.7** · body near terminator **44.4** · nebula bright
  upper-left **42.1** (max 243) · nebula mid **65.0** · void lower-left **10.0** · **terminator arc 224.6**.
- Live camera at the readings: position **(0, 9, −11)**, fov 60, ≈**21.3° pitch down**. `chase.ts` gives
  fov 60→75 and back 11→14 at top speed.
- Clean-run baseline: zero console errors, zero 404s, one pre-existing `THREE.Clock is deprecated` ×2.

## 5. Methods that unblocked this — use them, don't rediscover them

- **`gl.render(scene, camera)` + `readPixels` WORKS WITH rAF DEAD.** The whole diagnosis above came from a
  hidden tab. It also **bypasses EffectComposer**, so it doubles as a bloom-off read for free.
- **Read a whole SCANLINE per `readPixels` call** and sample columns from the buffer. Per-pixel calls are a
  GPU stall each.
- **MAX-POOL each cell** when building a luminance map. Point-sampling hid the terminator entirely and nearly
  produced a second wrong conclusion.
- **`useThree` beats `__THREE_DEVTOOLS__`** — no pre-renderer install, works in a dead-rAF tab. A React-fiber
  walk from the canvas does **not** reach the R3F store (`createRoot` keeps it in a closure). Secondary
  gotcha: zustand's store is a **function**, so a `typeof v === 'object'` guard rejects it.
- **Both of this lane's reversals were settled by rendering or measuring, never by reasoning** — including a
  confident, well-argued retraction built from source alone. If you find yourself arguing about the frame,
  measure it.

## 6. Supervisor decisions taken at this handover

- **`SceneProbe` STAYS through slices 1–4; deleting it is an acceptance item on slice 4** and the PR body
  names it. It is the instrument that turned two wrong inferences into measurements, and the manual-render
  path is the *standing* condition — the lane got one live frame in an entire session. Keeping a temp
  instrument risks it becoming permanent; the mitigation is that its deletion is written into the last
  slice's done-criteria and it reverts alone either way.
- **Slice 0 gates ONCE, with tilt dialled in the same sitting — not twice.** The owner's eye is the scarcest
  resource in this arc and the only thing between them and a verdict is a frame they can read. The pan/tilt/
  fov sliders write the same singleton that ships, so the value frozen at that gate is the value that ships.
- **The D3 emissive re-tune rides slice 2, not before slice 1.** Tuning emissive values against the white
  placeholder slab means tuning against a surface about to be replaced. It must **not** be used to fix the
  blow-out — that is the bloom budget, task 3.
- **Isotropic vs anisotropic (slice 3) stays settled by rendering.** Unchanged.

## 7. Open, waiting on the owner's eye

1. **The `Tilt` call + the real slice-0 verdict, in one sitting.** Panel state: **slab ON, rails ON, blocks
   OFF, backdrop ON**, env/ships/finish off; top row is running / fly / **bloom** (`useState(true)` at
   `route.tsx:35`, so bloom starts ON). Judge it **moving**, from the chase camera, bloom on **and** off.
   Expect it to look **worse** than before — D4 removed the lights it was flattering itself with, and telling
   honest-and-ugly apart from broken is part of the job.
   When a sky value is frozen it goes into `DEEP_SPACE` in `sky-config.ts` — and `starBearingDeg` follows
   **only** while the change goes through `writeSkyTuning`, so freeze **both** numbers as the panel reports
   them.
2. Then slices, each stopping at the owner's eye: **1** floor swap (D1) → **2** floor material + panel
   language (+ the D3 re-tune) → **3** rail + emitter array (D2) → **4** gaps, and the probe's deletion.

The deferred `/iso-sky` sky gate runs **after** a real track is in frame and is still not this lane's to run.
Procedure note from the owner: its roughness self-test must run with **`Star light` OFF as well as `Env rig`
off**, because a star light lights the probes exactly as a neutral rig light does — the whole reason
`/iso-sky` drops the lab rig.

## 8. The hidden-tab trap, and the lane that is about to remove it

A third lane, **`art/frame-tap`** (ports 5203/2603), is building an instrument that makes all of this moot:
R3F's exported `advance(timestamp, …)` driven over Vite's HMR channel, so a frame can be pumped and written
to a PNG on disk by an HTTP request — no Chrome focus, no CDP. Verified from installed source: `advance()`
checks neither `frameloop` nor `internal.active` nor `internal.frames`, and R3F suppresses its own render
exactly when a priority>0 `useFrame` exists, which is when `EffectComposer` is mounted — **so a pumped frame
is the post-processed frame, bloom included.** If it lands before you need a frame, use it. Ask the
supervisor rather than assuming it is ready.

Until then:

- **`visibilityState` is the ONLY reliable test.** Canvas size proves nothing: this lane measured **3456×1926**,
  fully mounted, rAF dead. And `computer screenshot` **forces** a measure — it resized a 300×150 canvas to
  3456×1882 in a still-hidden, rAF-dead tab, which is where the large-canvas presentation comes from.
- **Never `await` a frame** through `javascript_tool` — it hangs the CDP evaluate to its 45 s timeout, and
  **that hang is the diagnosis**. Install a free-running counter and read it on a **later** call instead.
- **Tab groups are PER-SESSION.** A restarted agent cannot adopt its predecessor's tab —
  `tabs_context_mcp` returns *"No tab group exists for this session"*. **Never record a tab id here**; record
  the URL. Create your own, pass its `tabId` on every call, and match on **your own port (5201)** — never
  touch `:5202` or `:5203`, which belong to the other two lanes.
- **Never gate from a tab you opened yourself.** Ask the owner to look in their own foreground window.

## 9. Traps paid for in this lane

- **`pnpm format` BEFORE `pnpm lint`** — biome treats formatting as a lint *error*; this failed the gate twice
  on nothing.
- **The commit hook rejects a `Co-Authored-By` trailer**, though the session's own instructions tell you to
  add one. Commit without it, and don't bundle `git add` and `git commit` in one call.
- **`pnpm -r test` silently skips `@slur/shared`** and its 75 tests — the explicit `--filter` in the gate is
  not redundant.
- **HMR does not survive a layer-key rename** — after `hazards` → `rails`/`blocks` the page held stale state
  and needed a full reload.
- **The cold-start `ERR_MODULE_NOT_FOUND` race was NOT observed here** — the stack was never restarted, so it
  stays unverified by this lane rather than confirmed.

## 10. Housekeeping

`INDEX.md`, the supervisor handovers and `07-blocks/` were untracked in the shared checkout and reach `dev`
only through a lane PR; they are committed on this branch. If the supervisor refreshes them in the worktree,
fold them into the next commit.

**One supervisor, and it is the session named `supervisor`.** Twice now two supervisor sessions have been
instructing this lane at once, because a `--fork-session --resume` kept running detached after its window
closed. Both times **the lane was the only party that could see both voices, and flagging it rather than
guessing is what caught it.** The forked session has handed over and stood down. If a second voice appears
again, say so and keep following this one until told otherwise in writing.
