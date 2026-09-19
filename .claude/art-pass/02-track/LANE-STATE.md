# `art/track` — LANE STATE

**Written by the supervisor from `LANE-FACTS.md` plus the tree, at the session-10 clear. Replaces the
previous state doc wholesale** — a log is not a state doc.

Read order for a fresh agent: `LANE-BRIEF.md` (intent, immutable) → **this file** (where the work is) →
`LANE-FACTS.md` (evidence, one line each, and the authority for every number).

**Numbers are deliberately NOT duplicated here.** They live in `LANE-FACTS.md`. A number copied into two
files is a fork with a delay fuse. Cite the fact line; do not restate it.

Do not re-derive what is here. If what you find contradicts it, **stop and say so** rather than quietly
fixing either one.

---

## 1. Position

| | |
|---|---|
| Branch | `art/track`, worktree `../slur-worktrees/track`, base **`639a2f2`** (= `origin/dev`, re-based past the #131/#135/#136 merges; the old `1807bc0` is long superseded) |
| HEAD | see `git log -1`. `0e48d1f` landed the slice-1 measurements; a comment-pass commit sits on top of it |
| Tree | **clean**, pushed, `0 0` against `origin/art/track`. No PR open |
| Verify gate | `pnpm format && pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build` |
| Gate result | **GREEN at `441a2d9`** — shared 75/75 · client 37/37 · server 4/4 · build; lint = 3 pre-existing `noExcessiveLinesPerFile` + "✓ Canvas-isolation: 8 route entry modules clean" |
| Ports | client **5201**, server **2601** · stack up at the clear |
| Review URL | `http://localhost:5201/art-lab` — chase camera, which IS the gate |

**The supervisor has pushed this branch.** Nothing rewritten, nothing forced — commits living only inside one
worktree are one disk failure from gone. An unexplained push into your own branch is a reasonable alarm and
raising it is correct; this is the explanation.

## 2. What is built

**Slice 0 — the honest review frame (`1bb5839`) — BUILT, NOT YET GATED.** All three decisions landed:

- **D3, tone mapping ON.** `toneMapped: false` came off the track surfaces, `tube-walls.tsx` and `track.tsx`.
  Deliberately *not* the other eleven files that still set it — finish gate, pickups, bolts, sparks,
  explosions and ship engines are VFX whose values trade against the bloom and exposure budget **task 3
  owns**. No panel switch exists and none is to be built.
- **D4, the lab lost its own lights.** `/art-lab`'s `ambientLight` and `directionalLight` are gone; the
  `DeepSpaceSky` rig mounts **unconditionally** and `backdrop` hides only the visible patch.
- **D5, placeholder boxes out of frame.** `TrackView`'s welded `hazards` toggle is split into independent
  `layers.rails` / `layers.blocks`, blocks default OFF. Structural, not a flag: `track-view.tsx` is a 19-line
  composer over `track-ribbon.tsx` (floor quads + rails), `track-blocks.tsx` and `track-instancing.ts`
  (shared `put`/`park`, `AHEAD = 900` / `BACK = 80`).

**Sky framing (`c937888`, `e339381`, `b00c91f`, `441a2d9`) — BUILT.** The knobs, the far-plane fix, the fov
slider floor, the owner's frozen framing (tilt −2 / fov 120) and the three assertions that pin what that
framing accepts. `art-lab-canvas.tsx` mounts `<TunableSky>` reading the same `SKY_TUNING` singleton
`/iso-sky` writes, so the two labs cannot disagree about what ships; `TunableSky`'s two-`useMemo` split is
preserved so a pan drag does not re-bake the `<Environment>` cubemap.

**The scene probe (`eedd49e`).** `art-lab/scene-probe.tsx`, DEV-only, header *"TEMPORARY DEBUG INSTRUMENT —
DELETE, DO NOT EVOLVE"*, publishing `{scene, camera, gl}` on `window.__ART_LAB` via `useThree`. Committed
**alone** so it reverts alone. Nothing in the lab reads it.

## 3. Next: slice 1 — the floor swap (D1)

`TrackFloor` becomes the floor; **delete `TrackView`'s instanced floor quads out of `TrackRibbon`**; retire
`showFloor` and the `slab` toggle. **Compare against the instanced floor BEFORE deleting it.**

**Slice 1 is NO LONGER GATED on the slice-0 verdict — supervisor decision, session 10.** Slice 0 is
*framing* (sky tilt/fov over the existing flat surfaces); slice 1 *replaces the floor surface*. Building
slice 1 cannot invalidate a framing verdict. Holding it only converted the owner's eye — the scarcest
resource in this arc — into one verdict per sitting instead of two, and the slice-0 verdict has now slipped
past **three** sittings. **The next sitting gates both.**

**Read `07-blocks/SESSION-9-ADDENDUM.md` §1 before designing D1, and do not re-derive it.** The `art/block`
lane measured that the block renders **~85–90% non-diffuse**, so every albedo-only feature dilutes below JPEG
noise, and that **roughness variation is the lever that actually paints a face**. `FLOOR_SURFACE` has the
same shape of problem — no map, no roughness, no procedural term: a mathematically uniform surface with
nothing for light to catch (`LANE-FACTS.md` § "Floor material"). **The owner said this week that the track's
material treatment "is still not what we want", and this is why.** That finding transfers; spend it rather
than rediscovering it.

⚠ **The slice order below was REVERSED after this file was written.** The owner's call (`02-track/README.md`
§7, D7) is that dark metal carries no information until something warm reflects off it, so judging the
deck's finish before the rail lights it judges it under light the finished scene will not have. The order
is now:

**1** the floor swap → **2** the rail + the emitter array → **3** floor surface *and* board 25's wear, in
one shader → **4** gaps, and `SceneProbe`'s deletion.

Board 25's wear is world-position noise inside the same `onBeforeCompile` patch the emitter array adds, not
a second `roughnessMap` — `track-texture.ts` repeats every 16×20u and a tile cannot hold a feature larger
than itself (`02-track/README.md` §7, D8).

**`LANE-FACTS.md` ALREADY EXISTS and is ~160 lines of sky-lane evidence — APPEND to it, never write it.**
This session opened it as a new file before noticing, and restored 162 lines from `HEAD`. It looks new
because nothing in the read order says it is not.

## 4. Decisions in force, with the reasoning

- **`SceneProbe` STAYS through slices 1–4.** Deleting it is an **acceptance item on slice 4** and the PR body
  must name it. It is the instrument that turned two confident wrong inferences into measurements; the
  manual-render path is the standing condition, not the exception.
- **The D3 emissive re-tune rides slice 2, not before slice 1.** Tuning emissive against the white
  placeholder slab is tuning against a surface about to be replaced. It must **not** be used to fix the
  bloom blow-out — see §6.
- **Isotropic vs anisotropic (slice 3) stays settled by rendering**, not by argument.
- **The owner block for the sitting is the SUPERVISOR's**, committed on `art/block` at `1527d19`. Do not
  edit it; it was corrected at session 10 for fov 120.
- **A test built on a false premise is an ACTIVE source of false confidence, and gets REPLACED, not added
  beside.** `radius < 2000` passed while the far-plane bug shipped underneath it. Option C replaced the
  coverage assertion on the same principle, and its `ACCEPTED_EDGE_MARGIN` comment records that raising the
  budget is an **art decision, not a fix**.

## 5. Retracted — loudly. Do not cite the originals.

- **"A rogue object mounts the black sphere" — WRONG.** Exactly five renderables, one sphere; nothing
  unexplained existed.
- **⚠ "The black sphere is the baked planet in `nebula-backdrop.jpg`, cropped" — WRONG, and it was measured,
  argued and confident.** The owner's own falsification test killed it: they dragged `Tilt` and **the dark
  body did not move with the sky**. The real cause was a **far-plane clipping hole** — a camera-locked patch
  at `radius` 1200 against R3F's default `far` 1000 clips a circular hole centred on the **camera axis**,
  which is exactly why tilt never moved it. Shipped fix: `radius` 1200 → 800, confirmed by a far 1000→5000
  toggle and then **visually** (hole gone, sky continuous, planet limb and terminator legible).
  **⚠ `HANDOVER-SUPERVISOR-SESSION-9.md` §3 and the PREVIOUS version of this file both state the opposite and
  are WRONG** — they read the owner's report as the planet diagnosis *passing*. Corrected at session 10. If
  you meet an older copy, **this file wins**.
- **"Near-white, clipped slab and rails" — WRONG.** A bloom-ON eyeball read of a thumbnail. Point samples
  retracted it: the surfaces are mid-dark grey, not clipped.
- **"Planet at top right of the parked frame" — WRONG.** Patch-visible/hidden differencing proved that
  region is void.
- **"Zero stars in the void" — a 1-px scanline sampling artefact**, caught before it was reported and
  re-measured as a 2D block. A scanline cannot census sparse points.
- **Coverage need ≈138.5° — WRONG**, and the supervisor relayed it as authoritative. It mixed rest-pose yaw
  with top-speed frame width — two speeds in one number. The test always computed 134.297.
- **fov-120 margin ≈7% — WRONG**, supervisor again, and **wrong in the unsafe direction**: angle-to-screen-
  width grows as `sec²θ`, the tangent-correct figure is **11.6%**, and 0.07 would have set
  `ACCEPTED_EDGE_MARGIN` *below the very thing it exists to permit*.

> **Every reversal in this lane was settled by rendering or measuring, never by reasoning** — including the
> confident, well-argued retractions that were themselves built from source alone. **If you find yourself
> arguing about a frame, measure it.**

## 6. Caveated right now — re-check before relying on these

- **The fov-120 numbers are calibrated arithmetic, NOT pixels**, labelled as such in the test comment and the
  commit body. The model is calibrated against this lane's fov-70 *pixel* measurements and runs 1–2% of frame
  width **conservative** — the safe direction. `[unmeasured]`: fov 120's actual patch span in pixels, which
  rides free at the owner's sitting.
- **The bloom blow-out is a BLOOM-BUDGET problem and task 3 owns it** — not an emissive-value problem here.
  **Slice 2 is not enlarged by it**; the earlier "slice 2 is a bigger job than pick a value" is withdrawn by
  the lane that said it. The ACES prediction remains `[unmeasured]` either way.
- **`[unmeasured]`: WHERE tone mapping happens.** `gl.toneMapping` reads `NoToneMapping` live while R3F's
  source sets ACESFilmic absent `flat`; most likely the postprocessing `EffectComposer` takes it into the
  chain. **Confirm this before judging the rail's hue at slice 3's gate.** Every luminance number in
  `LANE-FACTS.md` comes from `gl.render()`, which bypasses the composer — pre-bloom, pre-tone-map.
- **`[unmeasured]`: `starBearingDeg 66` is conditional on pan never having moved** during the owner's sitting.
  `writeSkyTuning` couples `starBearingDeg` to `backdropBearingDeg` (`sky-tuning.ts:101`) because 66 was
  measured *through* the backdrop mapping and names a point in the **image**, not the world — so pan-only
  edits must go through `writeSkyTuning`, and a value hand-typed into `DEEP_SPACE` carries no coupling.
- **`SKY_TUNING` is an in-memory module singleton and nothing persists it.** Run `skyConfigSnippet()` before
  any reload if a sitting's values matter.

## 7. Standing operational constraints

- **⚠ THE CHROME FREEZE IS ON.** Take no frames, run no `osascript`, raise no tab — **ask the supervisor for
  a frame slot and say why.** `computer screenshot` forces a canvas measure *and* forces the window forward;
  that is the focus steal, and it pulled the owner out of their typing three times inside one sentence.
  Three of those calls were this lane's, two on the same parked frame, one of which bought nothing.
- **`javascript_tool` reads DOM — panel toggles, slider values, config — at ZERO focus cost. Only *pixels*
  need the window.** Use it first, always.
- **`visibilityState` is the only reliable hidden-tab test.** Canvas size proves nothing: 3456×1926, mounted,
  rAF dead.
- **Tab groups are PER-SESSION.** You cannot adopt your predecessor's tab. Record URLs, never tab ids.
- **Never `await` a frame through `javascript_tool`** — it hangs the CDP evaluate to its 45 s timeout, and the
  hang *is* the diagnosis. Use a free-running counter read on a LATER call.
- **Composed screenshots cannot be posed** — a forced render re-runs the Loop and `updateChaseCamera` resets
  the camera.
- **`gl.render(scene, camera)` + `readPixels` works with rAF dead** and bypasses the composer, which is a free
  bloom-off read. Read a whole **scanline** per call; per-pixel calls are a GPU stall each.
- **`pnpm format` before `pnpm lint`** (biome treats formatting as a lint error), and `pnpm -r test` silently
  skips `@slur/shared` — the explicit `--filter @slur/shared` is **not** redundant.
- **The commit hook rejects a `Co-Authored-By` trailer**, and do not bundle `git add` and `git commit` into
  one Bash call — a hook rejection kills the whole call.
- **`art/frame-tap` stays OUT of this branch.** It reaches here through `dev` after its own PR, and it is
  what eventually lifts the freeze.
- **Maintain `LANE-FACTS.md` continuously**, committed with the code it describes — never written at handover
  time, because by then the conversation that knew the facts is the thing being thrown away. `[unmeasured]`
  is a legitimate entry; **refusing to reconstruct a reading you cannot source first-hand is correct** and is
  worth more than the reading would have been.

## 8. Open

- **Slice 0 is UNGATED — no owner verdict, three sittings running.** Judged **moving**, chase camera, bloom
  ON *and* OFF. Panel: slab ON, rails ON, blocks OFF, backdrop ON, env/ships/finish OFF.
- **No open escalations from this lane.**
- The deferred `/iso-sky` gate is not this lane's to run; its roughness self-test needs **`Star light` OFF as
  well as `Env rig` off** — a star light lights the probes exactly as a neutral rig light does, which is the
  whole reason `/iso-sky` drops the lab rig.
- `iso-lab-canvas.tsx` is the only Canvas in the app that sets `far` (`max(4000, dist*12)`) — which is why
  `/iso-lab` never showed the far-plane hole. Tracked as issue **#128**.

## 9. Escalation contract

Escalate to the **supervisor**, never to the owner, in this shape:

```
NEEDS-DECISION: <one line, specific, answerable>
CONTEXT: <2-4 lines: what you are doing, why this fork exists>
OPTION A — <label>: <what it means> / consequence: <what it costs or commits us to>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why — a recommendation without a defence is a preference>
IF NO ANSWER: <what you do meanwhile, or that you are genuinely blocked>
```

Escalate art/taste calls, anything reopening a frozen decision or ADR, anything touching gameplay, anything
costly to undo, and **your design recommendation before you implement it**. Do **not** escalate naming, file
layout, code structure, anything the docs already answer, or anything settleable by verifying. **Verify,
don't ask.** Never treat silence as approval, and a declared fallback that does not fire is worse than no
fallback — it reads as handled while nothing moves.
