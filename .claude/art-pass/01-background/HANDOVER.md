# Task 1 — background: handover after slice 1 + the four-layer rework

**Worktree:** `slur-worktrees/background`, branch `art/background`. Stack on `:5200` (client) / `:2600` (server).
**Read first:** `LANE-BRIEF.md` (governing brief), then `GATE-1-FINDINGS.md` (the failed slice-1 gate and the
histogram acceptance test). Nothing here supersedes either.

## ▶▶ STATE AS OF 2026-09-18, SESSION 4 — read this FIRST; it supersedes the session-3 section below

**Slice 1 is gated and landed. Slice 2 is landed but NOT eye-gated. The bloom blackout was never a bug.**

| Commit | What |
|---|---|
| `c9035a4` | the owner's eye-tune — slice 1's final config |
| `afe2af3` | **slice 2** — `celestial-body.tsx` + `star-light.tsx` |

### 1. ⛔ THE BLOOM BLACKOUT IS CLOSED — NOT A BUG, DO NOT FILE AN ISSUE, DO NOT "FIX" IT

Session 3 recorded it as "CONFIRMED, not suspected" and told you to file an issue. **That was wrong, and the
evidence that looked like confirmation was an artefact of the automation.** Measured this session:

- `luminanceThreshold` set to 9999, so Bloom contributes literally nothing → **still black**. Bloom was never
  the cause.
- After a cold load, toggling Bloom off *and back on* renders the scene fine **with bloom on**. It is a
  FIRST-MOUNT failure, not a bloom failure.
- The canvas was sitting at its default intrinsic **300×150**, never resized. R3F only configures and renders
  when `containerRect.width > 0 && height > 0` (verified in the installed `@react-three/fiber` 9.7.0 dist).
  Zero measurement → the R3F root never mounts → *nothing* is drawn, not even the clear colour. Confirmed by
  temporarily setting the background to pure red: the canvas stayed page-background black.
- Root cause: `document.visibilityState === "hidden"` on those loads. **The MCP/automation Chrome window sits
  behind the user's, and a hidden tab suspends rendering and ResizeObserver delivery.** The first click or
  window resize wakes it — and the first thing anyone clicks is the Bloom toggle, which is how bloom got blamed.
- **The owner confirmed `/iso-sky` renders on its own, untouched, with Bloom ON, in a foreground window.**

A hypothesis that Tailwind's stylesheet lands after first paint in dev was tested and **falsified** — it
reproduced in a production `pnpm build` + `vite preview` too. Both are the same hidden-tab artefact.

⚠ **Lesson for whoever drives Chrome next:** a blank canvas in an automated tab means the tab is hidden, not
that the renderer is broken. Check `document.visibilityState` before believing a rendering bug.

### 2. Bloom is subtle and only fires on the stars — this is ARITHMETIC, and it is correct

The owner noticed this directly. `GRID_VOID.bloom.threshold` is `0.42` on the linear buffer
(`env-config.ts:152`). The nebula's brightest *possible* pixel is its top ramp stop `#7d93ad` → linear
0.205 / 0.292 / 0.418 → BT.709 luma **≈ 0.28**, about a third below the threshold — before `opacity 0.92` and
`coreOnset 0.96` make that stop rare. **The cloud mathematically cannot bloom at the committed config.**
drei's near-white stars are the only thing that clears 0.42.

**Leave it.** A blooming sky is exactly the glow that eats obstacle silhouettes — the readability risk pass-2
item 3 defers to the slice-4 contrast check. Slice 2's rim is now the thing designed to cross the threshold
(`rimStrength 2.2`, above 1 on purpose). Judge bloom against the rim, never against a deliberately near-black
cloud.

### 3. Slice 2 — what landed, and what is still open

`apps/client/app/game/scene/celestial-body.tsx` — camera-locked sphere, soft `dot(N,L)` terminator, mottled
lit side, `pow(1 - dot(N,V), k)` fresnel rim **gated by the day term** so it fires only on the lit limb.
`apps/client/app/game/scene/star-light.tsx` — the real `DirectionalLight` on the shared bearing, with its
target rendered as a sibling inside `SkyFollow` (the default target sits at the world origin, which would
swing the direction through a wide arc over 8000u of travel).

**VERIFIED WORKING:** terminator, surface mottle and a clean curved silhouette all render in `/iso-sky`; the
star light visibly lights the roughness probes.

**NOT GATED: the composition is a first guess and is the owner's call.** Current values are
`body { bearing 28°, elevation 15°, angularSize 44° }` against `star { 55°, 18° }`. In the last frame checked
the limb read as a clean dark arc with **no visible rim**, because the limb in frame was the one facing AWAY
from the star.

**The governing constraint — do not re-derive it.** Crescent thinness is set by the **angular separation
between the body's bearing and the star's**, not by any rim knob:
- `~0°` → star sits behind the body; every limb point is at the terminator; the rim closes into a full **ring**
  (reads as atmosphere on an airless body) and the star is occluded by the planet.
- `~90°` → a half-lit **gibbous**, no crescent at all.
- `~35°` → the look target: strongly night-side with a bright arc down one limb.
- Separation must also **exceed the body's angular radius**, or the star ends up behind the planet.
- For the lit arc to be the limb that is IN FRAME, the star must be on the **frame-centre side** of the body.
- Geometry caps `angularSizeDeg` **below 90°**: past a 45° half-angle the sphere radius exceeds its own
  distance and swallows the camera.

Body *distance* is derived, not authored — it lands inside the star shell's inner edge (`radius - depth`) so
drei's transparent-pass `<Stars>` cannot paint points over the opaque body. Apparent size is in degrees.

### 4. ⚠ Slice 2 SPOILS slice 3's falsifiable self-test — the gate must switch the light off

`/iso-sky` runs `rig={false}` precisely because "a neutral directional light makes the roughness self-test pass
on its own" (`iso-lab-canvas.tsx:60-63`). **A star light lights those probes just as happily.** `ProceduralSky`
therefore takes a `light` prop (default `true`); **slice 3's environment gate MUST run with `light={false}`**,
or "roughness 0.2 looks different from 0.9" proves nothing about the bake.

### 5. Next actions, in order

1. **Eye-gate slice 2's composition** in `/iso-sky` — it is the one thing blocking. Tune
   `body.bearingDeg` / `angularSizeDeg` / `rimStrength` / `rimPower` against the backdrop overlay, using the
   separation rule in §3. **Note the lab's default camera looks along bearing ≈ −31°, so the body at 28° is
   off-frame until you orbit.** If the composition wants the star moved instead, that is an art call on a
   value the owner already eye-tuned for the nebula — raise it, do not change it unilaterally.
2. **There are no `/iso-sky` panel sliders for the body yet.** Tuning is by editing `sky-config.ts`, which is
   HMR-live. Adding body knobs to `sky-tuning.ts` / `sky-tuning-panel.tsx` / `tunable-sky.tsx` is the obvious
   next ergonomics job if the gate turns into more than one pass.
3. **The star itself is NOT built.** Board 12 shows a bright star with a diffraction flare; the brief mentions
   "the dome's flare". Cheapest home is the dome fragment shader (a radial glow + streaks around `uStarDir`),
   which costs zero extra draw calls. Deferred deliberately — slice 2's gate is the limb, not the star.
4. **Then slice 3** (the bake) — with §4's `light={false}` requirement.
5. **Then slice 4**, then **nebula pass 2**, both unchanged.

---

## STATE AS OF 2026-09-18, SESSION 3 — superseded in part by the section above

**Two commits landed on `art/background`. Nothing is uncommitted.**

| Commit | What |
|---|---|
| `439032a` | slice 1 + the four-layer rework (everything session 2 built) |
| `275c4f4` | the scale fix: `featureSizeDeg` 10°→6°, `threshold` 0.448, stars 4500/13 |

Landed as **one** commit, not the two session 2 planned: the rework had overwritten slice 1 in the working
tree, so the intermediate state never existed in git and splitting it would have meant fabricating a commit
that was never real.

**The session-2 eye gate failed on "the blobs are too big."** Cause was NOT the missing branching hierarchy
that the pass-2 section below predicts. With amplitude halving per octave the **base octave carries ~51% of
the field**, so the bright structure *was* the base scale; detail octaves cannot restructure it.
`featureSizeDeg` 10°→6° fixed it, using an existing config value and no shader change.

⚠ **A ridged multifractal (Musgrave weight feedback) was built and measured FIRST and is REJECTED — do not
rebuild it.** The theory was that it would give branching hierarchy. It does the opposite: weight feedback
suppresses child octaves wherever the parent is weak, so it *removes* fine structure and renders chunkier
than the baseline. Measured, not argued — see the contact sheets described under "Measurement tooling".
This does not refute pass-2 item 1 (a second band warped BY the coarse field is still untried), but it does
mean "multifractal" is not the way to get there.

**Histogram after the change** (headless mirror, 12 angles, median):

| | landed 10° | now 6° | target |
|---|---|---|---|
| mean | 22.8 | 22.2 | 22.4 |
| >24 | 27.6% | 28.6% | 27.4% |
| >48 | 9.9% | 10.0% | 9.9% |
| >80 | 1.75% | 2.04% | 2.98% |
| >120 | 0.76% | 0.71% | 0.75% |

Closer to target on nearly every band. `>80` still deliberately short — planet limb, slice 2's job.

**Verify gate green** at `275c4f4`: typecheck · lint (3 pre-existing `packages/shared/src/sim/*` file-length
warnings) · 75 shared + 27 client + 4 server · build.

### Open, in priority order

1. **The large DARK cells — SWEPT, and the answer is "one lever only". RESOLVED: `featureSizeDeg` stays 6.**
   The owner judged 6 correct and live-tuned the *other* emission dials instead —
   `warp 0.45→0.55 · threshold 0.448→0.38 · softness 0.42→0.5 · coreOnset 0.95→0.96 · opacity 1→0.92`
   (commit `TUNE`). That config runs **`>24` ~6pp hot** (33.6% vs a 27.4% target) with every other band on
   target or deliberately under. **That divergence is ACCEPTED, not an oversight** — it is an eye-tune against
   the backdrop overlay, and the eye outranks the headless mirror on the art call. Do not "fix" it back toward
   the histogram without asking. The f5/f4 data below is kept because it is still the answer if cell size is
   ever revisited.

   ⚠ **Correction to an earlier claim in this doc: the dark cells are NOT the mask and dust layers.** Measured:
   sweeping mask 80/50/35 × dust 25/14 produces six visually IDENTICAL frames. The **mask barely fires** at its
   committed settings — its 80°/2-octave field runs p25 0.327 against a 0.18→0.34 threshold window, so the
   smoothstep is already ~0.93 at the 25th percentile and only the darkest ~10% of sky is touched. Dust at
   `strength 1.6` is likewise minor (2.8 changes almost nothing). The dark cells are the **emission field's own
   voids**, intrinsic to a ridged filament network.

   **Making the mask actually carve is unaffordable and should not be retried without a new plan.** At
   `mask {40°, threshold 0.42}` the composition looks good but `>24` collapses to **12.1%** against a 27.4%
   target, and the per-angle spread blows out to **4–30%** — some camera angles read as empty sky. Pulling
   emission `threshold` down to 0.40 only recovers to 16.5%. This independently reproduces the session-2 note
   that a voiding mask puts the target out of reach no matter how the emission dials move.

   **Histogram cost of the affordable lever** (headless mirror, 12 angles, median):

   | | >24 | >48 | mean |
   |---|---|---|---|
   | f6 (committed) | 28.6% | 10.0% | 22.2 |
   | f5 | 29.4% | 10.6% | 23.9 |
   | f4 | 28.0% | 11.1% | 23.3 |
   | target | 27.4% | 9.9% | 22.4 |

   f5 and f4 both hold the gate. **If f4 is chosen, pair it with `octaves` 6→5** — at 4° the sixth octave lands
   near 0.1°, which is sub-pixel and will sparkle under camera rotation for no visible gain.
2. **Stars read but are still modest** at 4500 / size 13. Easy to push. The headless mirror does **not** model
   stars, so any change there is screenshot-verified only, never mirror-verified.
3. ~~**The bloom blackout is CONFIRMED, not suspected.**~~ **WRONG — RETRACTED, see session 4 §1.** It is not a
   bug at all: the automation tab was `visibilityState: "hidden"`, which suspends rendering and ResizeObserver
   delivery, so the R3F root never mounted. Bloom was innocent; the toggle was just the first thing clicked.
   **No issue to file.**
4. **Then slice 2**, unchanged.

### Measurement tooling (session 3 additions)

Session 2's `histo.mjs` (headless mirror of the full composite) was re-validated this session: its `f10`
row reproduces the committed table exactly. Trust it as the search tool; a screenshot + ffprobe is still the
authority. Session 3 added, in the scratchpad (node, NN-1 clean):

- `branch.mjs` — value-distribution percentiles for the emission field; `FS=<deg>` env arg.
- `sheet.mjs` — renders the **full composite** for several candidate configs and tiles them into a PPM
  (→ PNG via `ffmpeg`). **Each tile's `threshold` is re-derived by PERCENTILE MATCHING against the baseline**,
  otherwise the tiles differ by coverage and the structure comparison is worthless. This is what made the
  multifractal rejection obvious in one look instead of three shader round-trips.

Both are scratchpad-only and die with the session — reconstruct from this description if needed.

## Where the work got to (2026-09-18, session 2)

**The shader is now FOUR layers, each with one job** — the single-field version could not produce a
composition (no scale above its base frequency) or a dark clump (brightness was a monotone function of
density), and read as a uniform lattice:

| Layer | Job | Off switch |
|---|---|---|
| mask (80°, 2 oct) | WHERE there is nebula; multiplies density, only ever carves voids | `mask.threshold: 0` |
| emission | the cloud itself — the slice-1 warped ridged field | `opacity: 0` |
| light | brightens toward the star, off the shared bearing | `lightContrast: 0` |
| dust (25°, 3 oct) | extinction `exp(-k·dust)`, so clumps silhouette | `dust.strength: 0` |

**Two knobs were added and they are the ones that matter:**
- **`coreOnset`** — density at which the ramp climbs to the hot top stop. Was hard-coded at `0.5`, which put a
  third of all cloud into the hot blend and collapsed the >48/>80/>120 bands together (the "milky" failure).
  **This is the peak-contrast dial; `threshold` is the coverage dial. They are independent — move both.**
- **`starBearingDeg` / `starElevationDeg`** on `SkyConfig` — hoisted from slice 2 deliberately, so the cloud
  and the celestial body cannot disagree about where the light is.

**Free performance:** the domain-warp q/r lookups dropped from 6 octaves to 2. Measured over 40k directions
the final field moves <0.002 at every percentile (p50 0.536→0.537, p99 0.862→0.861) while removing ~55% of
the shader's hash evaluations. That saving pays for the mask and dust layers.

**The ramp ceiling was the real bug behind "no hot cores".** The old top stop `#5d7189` has luma 110, so
`>120` was unreachable **at any density** — that, not the thresholds, is why both earlier configs measured
0% there. Ramp stop luma is now chosen against the gate's own thresholds (`#101620`=20 below the >24 line,
`#374757`=69, `#7d93ad`=143).

### Measurement tooling (node, NN-1 clean)
`scratchpad/histo.mjs` is a headless mirror of the **full composite** — layers, hex→linear, no ACES
(`toneMapped={false}`), linear→sRGB, BT.709 luma — so a candidate config can be histogrammed without a
screenshot round-trip. `search.mjs` grid-searches it. **Validated:** its slice-1 reproduction reads mean 28.3
/ >24 30.7 / >48 16.0 / >80 9.17 against the owner's measured 30.9 / 35.2 / 18.4 / 10.8, and its prediction
for the landed config matches a real ffprobe'd screenshot to ~0.3 on mean. Treat it as the search tool; the
screenshot + ffprobe is the authority.

⚠ **Target-mean discrepancy, unresolved.** `GATE-1-FINDINGS.md` §2 gives the target mean as **26.5**;
re-measuring `nebula-backdrop.jpg` with that section's own command and crop gives **22.4**. Both sides were
re-measured with the identical pipeline so the comparison is sound, but the absolute figure needs a re-check
before anyone treats 26.5 as authoritative.

---

## What exists now

| File | What it is |
|---|---|
| `apps/client/app/game/scene/sky-config.ts` | Tuning data module. `DEEP_SPACE` is the one sky. Knobs are derived (feature size in **degrees**, hex ramp stops). |
| `apps/client/app/game/scene/procedural-dome.tsx` | BackSide sphere + `ShaderMaterial`: cold 3-stop vertical gradient + domain-warped FBM nebula. Takes `gain` (display/bake split) and an optional `materialRef` (lab only). |
| `apps/client/app/game/scene/procedural-sky.tsx` | `SkyFollow` + dome + drei `<Stars>`. **This is what slice 4 drops into `environment.tsx`.** |
| `apps/client/app/routes/iso-sky/route.tsx` | `/iso-sky`. `<IsoLab rig={false}>` + `<TunableSky>` + `<RoughnessProbes>`, with `<SkyTuningPanel>` as a DOM sibling. |
| `apps/client/app/routes/iso-sky/tunable-sky.tsx` | Renders the REAL `<ProceduralSky>` and pushes `SKY_TUNING` into its uniforms in `useFrame`. |
| `apps/client/app/routes/iso-sky/sky-tuning.ts` | `SKY_TUNING` module singleton + `resetSkyTuning()` + `skyConfigSnippet()`. |
| `apps/client/app/routes/iso-sky/sky-tuning-panel.tsx` | Sliders + colour swatches + Copy config / Reset. |
| `apps/client/app/routes/iso-sky/roughness-probes.tsx` | The falsifiable self-test: `roughness` 0.2 vs 0.9, `metalness: 0`, explicit `envMapIntensity`. |

**Edits to shared files** (small, all justified in-comment):
- `routes.ts` — one line for `/iso-sky`.
- `iso-lab/reference-boards.ts` — boards **12 and 13 were on disk but missing from the picker**. Added.
- `iso-lab/iso-lab.tsx` · `iso-lab-canvas.tsx` · `iso-lab-controls.tsx` — new optional **`rig`** prop (default `true`, so `/iso-monolith` is unchanged). Off ⇒ no neutral ambient+directional, no scale ruler. Needed because a neutral directional light makes the roughness self-test pass on its own.

---

## Facts established this session — do not re-derive

- **Bare `ShaderMaterial` output.** `resolveIncludes` runs on every material's shaders
  (`three@0.185.1` `WebGLProgram.js:790/794`); `linearToOutputTexel` is **always** emitted in the fragment
  prefix (`:779`); `TONE_MAPPING` is defined only when `material.toneMapped` (`WebGLPrograms.js:176-186`).
  So `#include <tonemapping_fragment>` + `#include <colorspace_fragment>` are both safe and correct in a
  hand-written fragment shader. The dome does this.
- **`new THREE.Color('#hex')`** converts sRGB → linear working space via `setStyle` → `setHex` →
  `colorSpaceToWorking`. No manual `convertSRGBToLinear` needed. `Color.set(string)` does the same and
  mutates in place (safe in `useFrame`, but it re-parses the string every call — `TunableSky` only pushes
  changed stops).
- **drei `<Stars>` is `transparent: true`** (`Stars.js:95`), so it draws in the transparent pass, after the
  opaque dome. That is why an opaque `depthWrite: false` dome does not erase the stars.
- **The measured noise distribution.** Density is mapped with `smoothstep(threshold, threshold+softness, raw)`,
  and that window must sit on the field's real range or nothing renders. Measure with `scratchpad/fbm2.mjs`
  (node, mirrors the GLSL exactly; args = `<featureSizeDeg> <octaves>`). At the shipped
  `ridge 1 · feature 10 · octaves 6`: **p50 0.54 · p75 0.65 · p90 0.74 · p95 0.79 · p99 0.86 · max 0.96**.
  At `ridge 0` the tail is much shorter (p99 0.73). **Re-measure whenever `ridge`, `featureSizeDeg` or
  `octaves` moves** — they all reshape the distribution.
- **Feature size must be judged against the FOV, not the sphere.** At 80° one wisp is wider than a 45° frame
  and the nebula reads as a flat gradient.
- **Three shape failures already walked into, in order** — don't repeat them:
  1. `smoothstep(threshold, 1.0, …)` → top ramp stop unreachable, cloud invisible.
  2. Smooth fBm → round blobs lit at their CORES. The reference is lit at the EDGES; that needs `ridge`.
  3. A NARROW softness with ridge on → binary mask, every visible pixel pinned to the top ramp stop, reading
     as torn paper. The dark-dominant look needs a WIDE window (dim base + rare bright ridges), not a tight one.
- **Cost.** 2 draw calls (dome + stars), **0 bytes texture memory**, nothing regenerates per frame. Measured
  8.3 ms median / 9.4 ms worst at a 1728×1882 buffer — but that is vsync-locked at 120 Hz, so it proves
  headroom exists, not how much. **That measurement predates `octaves 4 → 6`**, which raised the dome from
  ~224 to ~336 hash evaluations per pixel (7 FBM calls × octaves × 8 corners). Re-measure in `/art-lab` at
  slice 4, where depth rejection also kicks in — and treat `octaves` as the first dial to drop if it costs.

---

## Landed config — measured (2026-09-18, session 2)

Real screenshots of `/iso-sky`, bloom OFF, canvas cropped `910:840:260:0`, measured with the **same** ffprobe
command as the target (`GATE-1-FINDINGS.md` §2). The crop still contains the two black probes, which deflates
these slightly.

| | angle A | angle B | headless, 12 angles (median [min–max]) | TARGET |
|---|---|---|---|---|
| mean | 22.5 | 20.2 | 22.8 [19.8–27.8] | 22.4 *(re-measured; §2 says 26.5)* |
| >24 | 28.70% | 23.36% | 27.6% [23.1–35.2] | 27.39% |
| >48 | 7.81% | 5.49% | 9.9% | 9.94% |
| >80 | 0.78% | 1.32% | 1.75% | 2.98% |
| >120 | 0.46% | 0.07% | 0.76% | 0.75% |
| >160 | 0.00% | 0.00% | 0.02% | 0.21% |

`>24` and `>48` land on target; `>80` and `>160` **undershoot deliberately** — §4.3 warns that part of the
reference's bright tail is the PLANET LIMB, which slice 2 supplies, so driving the nebula alone to hit it
would overshoot once the body lands.

**Config:** `ramp ['#101620','#374757','#7d93ad'] · coreOnset 0.95 · threshold 0.46 · softness 0.42 ·
mask {80, 0.18, 0.16} · dust {25, 0.55, 0.2, 1.6} · lightContrast 0.5 · star 55°/18°`.

## Open at the gate

1. **The art call itself** — is the nebula restrained/cold enough? Committed default is
   `threshold 0.54 · softness 0.18 · featureSizeDeg 28 · warp 0.45 · octaves 4 · opacity 1`.
   **The noise field is not uniform**: at a fixed threshold one camera angle can look empty and another
   crowded. Judge across several orbit angles before settling. Sliders make that cheap; `Copy config` emits a
   paste-ready `sky-config.ts` fragment.
2. ~~**⚠ THE COMMITTED DEFAULT IS DERIVED, NOT SEEN.**~~ **RESOLVED, session 3** — it was seen, judged, and
   failed on scale; see the session-3 section at the top. The `threshold 0.52 · softness 0.34` quoted here
   was never landed either. Ignore this item.
3. **⚠ Bloom blacked the whole lab out once.** With `Bloom` ON the canvas rendered pure black — stars and
   probes included, which rules out the dome shader — and **turning Bloom OFF restored everything.** No
   console errors. At the time the canvas CSS size (1728×997) did not match the viewport (1456×840), so the
   prime suspect is an **EffectComposer render-target size mismatch after a window resize**, which would be
   pre-existing and not specific to this route. **Not confirmed.** Repro: resize the window, then toggle Bloom.
   Check `/iso-monolith` too — if it blacks out the same way, the bug belongs to `IsoLabCanvas`, not here.
4. ~~**Slice 1 is not committed.**~~ **DONE, session 3** — `439032a` + `275c4f4`. The commit hygiene still
   applies to future work: no `Co-Authored-By` trailer; do not bundle `git add` and `git commit` in one
   Bash call.

**Settled 2026-09-18 — WIDENED at the slice-1 gate, see `GATE-1-FINDINGS.md` §1:**
`apps/client/public/textures/nebula-backdrop.jpg` — the placeholder this task retires — is the look target for
the sky on **tone as well as structure**. The owner confirmed **the boards were COMPOSED OVER it**: the sky
visible in boards 12/13 *is* this file with rock painted on top, i.e. the same image with information removed.
So for the **sky / far field** it is authority entry **0** and outranks the boards. Board 12 still outranks it
for **overall scene** colour, depth, composition and material — different subjects, both true.

An earlier version of this note called it "a nebula-**structure** reference only". That was too narrow, and the
narrowness cost a full review cycle: judging the isolated `/iso-sky` dome against a *composed* board reads
occlusion as intended faintness, producing the confident and backwards conclusion that the nebula should be
nearly invisible. **Never judge an isolated ingredient against a composed board.**

The bitmap also contains a rim-lit planet limb (bright thin crescent, upper right) — that is **slice 2's**
subject, not slice 1's, and the slice-1 histogram target is measured with it cropped out.

## ⚠ NEBULA PASS 2 — deferred until after slice 2, deliberately

The owner brought a second art read (ChatGPT, 2026-09-18) that is sharper than what the current shader
implements. Scored honestly against what is built:

| Observation | Status |
|---|---|
| "Large cloud bands and empty regions" | **DONE** — the mask layer |
| "Smaller **branching** structures within those bands" | **MISSING — the main gap** |
| "Dark dust cutting through luminous areas" | **Wired, not reading** (`dust.strength 1.6` barely visible) |
| "Subtle cold highlights, **lower gameplay region kept quiet**" | **Re-scoped — see below. NOT a shader knob.** |

**Why this is deferred and not fixed now.** Two of the four points ("illuminated edges", "subtle cold
highlights") are *relationships to a light source that is not in frame yet*. The light layer is currently a
hemispheric `dot()` against a bearing with nothing visible at it. Tuning edge-lighting with no source on
screen repeats the exact error that failed gate 1 — judging a thing against something you cannot see.
The histogram is also holding `>80`/`>160` short on purpose because the planet limb supplies them, so
re-tuning the nebula before slice 2 means tuning against a hole slice 2 fills.

**The technical shape of pass 2, so it is not re-derived:**

1. **Branching is NOT more octaves.** FBM octaves give self-similar *detail*; branching is *hierarchy* — a
   large filament that splits into smaller ones. The fix is separate frequency **bands as distinct layers**,
   where the small-scale field is domain-warped **by the large-scale field** so small filaments follow the
   big ones. Today every layer is warped independently by the same field, which makes them siblings, not
   children. This is what "several scales of noise, distorted by additional noise" actually asks for.
2. **Dust must be made to read** — it silhouettes against emission, so re-judge only once emission has the
   branching structure. The reference's dark knots *inside* the bright band are this ingredient.
3. **"Lower gameplay region kept quiet" — RE-SCOPED, do NOT build a `dir.y` knob.** (Owner call, 2026-09-18.)
   An elevation `smoothstep` was the first proposal and it is the wrong mechanism: straight down is already
   dark and already occluded — `sky-config.ts` says so on the nadir stop ("Effectively void; the track
   occludes most of it in play"), so the knob would quiet something nobody sees.

   **But the requirement underneath it is real and is about CONTRAST, not elevation.** "Lower gameplay
   region" means the lower part of the FRAME — the band around the horizon where the ribbon, the obstacles
   and the threading are, roughly `dir.y` −0.2 to +0.1 looking forward. That is not nadir, and it is not
   occluded: SLUR's track is a finite-width ribbon suspended in space, not a ground plane, so sky shows
   beside it, below its edges, and through every gap — and gaps are a core mechanic, so the player looks
   THROUGH the track at the sky deliberately. A bright nebula core behind a dark obstacle costs silhouette
   readability exactly when it is needed, which is the thing the lighting principle already forbids (the sky
   lights the far rock field and the planet; the track lights itself from its own emissives).

   **Therefore: not a slice-2 or pass-2 item. It is a SLICE 4 composition check**, when the sky lands in
   `environment.tsx` — verified in `/art-lab` (flies the real track), which is the only place it is
   observable. It may pass for free: the landed config is dark-dominant with bright cores at 0.46% of pixels.
   The failure mode is rare-but-real, so look for it rather than assuming it.
4. **Re-baseline the histogram after slice 2** against the UNCROPPED backdrop — once the planet is in frame
   the `crop=980:941:0:0` target no longer describes the scene.

## Next actions, in order

1. **Owner calls the histogram gate** on the table above. If it passes, land **two** commits (slice 1, then
   the four-layer rework) — no `Co-Authored-By` trailer, and do not bundle `git add` with `git commit`.
2. **Re-gate visually** per §4.4: `/iso-sky`, bloom **on and off**, several angles, backdrop overlay in
   Split or Wipe. ⚠ Bloom-on currently renders BLACK — that is the pre-existing `IsoLabCanvas` bug below,
   not a sky fault, but it does block the bloom-on half of §4.4 until it is fixed.
3. **File the Bloom blackout as its own issue.** Reproduces identically on `/iso-monolith` at a canvas
   matching the viewport, which rules out the EffectComposer resize/render-target hypothesis. Pre-existing in
   `IsoLabCanvas`, agreed out of scope for this task.
4. **Then slice 2** — celestial body + the real `DirectionalLight`, both reading `starBearingDeg` /
   `starElevationDeg` from `sky-config.ts` rather than choosing their own. Let it supply the >120/>160 tail;
   do not re-tune the nebula upward to chase it.
5. **Then NEBULA PASS 2** — see the section above. Branching hierarchy and dust made to read; the
   "gameplay-quiet" point is re-scoped to a slice-4 contrast check, NOT a knob. Ordering was the lane's
   call on the owner's delegation (2026-09-18): slice 2 goes
   first so the nebula's light-dependent qualities can be judged against a light source actually on screen.
   The owner has not vetoed it, but has not independently endorsed it either — reopen if it looks wrong.
6. **Slices 3 and 4 after that**, unchanged from the brief — plus, at slice 4, the **sky-vs-obstacle contrast
   check in `/art-lab`** described in pass-2 item 3. It is the only point in the arc where it is observable,
   and it is easy to forget because nothing in the shader represents it.

## Next slices (unchanged from the brief)

2. `celestial-body.tsx` — `dot(N,L)` smoothstep terminator + `pow(1-dot(N,V),k)` rim, camera-locked, plus the
   real `DirectionalLight`. **The light's bearing must be the single source of truth**, shared by the body,
   the dome's flare and the bake — add `starBearingDeg` / `starElevationDeg` to `sky-config.ts` then.
3. `<Environment frames={1}>` with the same generator as children at a higher `gain`. `ProceduralSky` already
   accepts `gain`, so this is instancing it twice, not new shader work.
4. Swap into `environment.tsx`; retire `scene-backdrop.tsx` + `nebula-backdrop.jpg`.

## Verify gate

```sh
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

Green as of this handover: typecheck · lint (Canvas-isolation clean, 3 pre-existing warnings in
`packages/shared/src/sim/track.ts`) · 75 shared · 27 client + 4 server · build.
