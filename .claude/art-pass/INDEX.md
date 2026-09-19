# ART PASS — index & state

**Started 2026-09-18.** Single-worker (the owner). Tracked here, **not** in GitHub issues — this is one
continuous art arc with sequential composition gates, not a set of independently-schedulable tickets.

> **This is a CLEAN SLATE.** An earlier four-lane parallel art attempt (`sky` / `asteroids` / `monoliths` /
> `backdrop-only`) was deliberately reset by the owner when the consolidated `docs/art-direction/` package
> landed. Its branches are gone by intent. **Do not resurrect them, do not cite them as prior art, do not
> ask about them.** Everything here is built fresh against `docs/art-direction/`.

---

## 1. The order, and why it is this order

Everything is built **procedurally** (no DCC-authored meshes, no bitmaps) and **in isolation first**, then
composed.

> **⚠ "Procedural" is a DEFAULT, not a law — amended 2026-09-19.** It must earn its place per task against a
> player-visible outcome. Task 1 pivoted to shipping a bitmap precisely because procedural could not: the
> acceptance target *was* a bitmap we already own, so the procedural build was approximating our own asset.
> Ask before committing to procedural: *what does this buy that the authored asset does not?* If the honest
> answer is "purity", ship the asset. (Isolation-first is unaffected and still holds.) Isolation is where a variable is judged alone; composition is where it is judged against
everything else.

| # | Task | Folder | Status |
|---|------|--------|--------|
| 1 | **Background** — deep space + nebula, and its contribution to scene lighting | [`01-background/`](01-background/README.md) | **PIVOTED 2026-09-19 to the CHEAP PATH** — ship `nebula-backdrop.jpg` on the camera-locked dome; light from a separate `<Lightformer>` env + one `DirectionalLight`. Brief: `01-background/CHEAP-PATH-BRIEF.md`. Procedural work preserved on `art/procedural-bg` @ `6d52029` |
| 2 | **Track** — floor material, glowing edge rail, gaps, gap rims | [`02-track/`](02-track/README.md) | not started |
| 3 | **Scene lighting** — key/rim/fill/env, exposure, bloom budget | [`03-lighting/`](03-lighting/README.md) | not started |
| 4 | **Monoliths** — isolation → placement (track-flanking + scene filler) | [`04-monoliths/`](04-monoliths/README.md) | not started |
| 5 | **Asteroids** — isolation → placement | [`05-asteroids/`](05-asteroids/README.md) | not started |
| 6 | **Composition** — everything together, one final art validation | [`06-composition/`](06-composition/README.md) | not started |

**Why background first.** It inverts the earlier attempt's order, on purpose. Lighting flows *from* the
environment, so any silhouette or material judged under a placeholder sky has to be re-judged the moment the
real sky lands — which is precisely the deadlock the earlier attempt hit (the finished sky could not be
landed without invalidating the rock work already done against the old backdrop). Background → track →
lighting first means every later ingredient is judged **once**, under final light.

**Lighting is task 3, not task 1,** because the background *supplies* light but does not *compose* it. Task 1
delivers the emitter and proves it can light something; task 3 balances key/rim/fill/exposure against a real
track that exists by then.

---

## 2. Authority — resolve conflicts in this order

0. **`apps/client/public/textures/nebula-backdrop.jpg`** — for the **SKY / far field only**: the boards were
   *composed over this image*, so the sky they show **is** this file minus what the rocks occlude. It
   outranks the boards for sky appearance (they are this image with information removed). Slice 4 retires it
   for being a **bitmap**, not for looking wrong. Measured tuning target:
   [`01-background/README.md` §3](01-background/README.md).
1. **`docs/ART_SCALE_REFERENCE.md`** — the **sole** authority on every dimension. Overrides every number
   printed on every board, and every dimension in the handoff prose.
2. **GDD §0** — the spatial contract. `MIN_CLEAR = 7u` and `CELL = 4u` are **gameplay** contracts. Art never
   reinterprets them. (`docs/art-direction/CURRENT_STATUS.md` hedges on both — push back if pressed.)
3. **`docs/art-direction/boards/12_approved_scene_marigold_depth.png`** — top-precedence reference for overall
   colour, depth, lighting, material and composition. Above the individual boards.
4. **`docs/art-direction/boards/13_original_mood_anchor.png`** — cosmic scale, looming scenery, cold rim
   light, deep shadows. Its oversized ship / HUD / missile are **not** specifications.
5. **`docs/art-direction/handoff/*.md`** + the per-asset boards — written direction and asset identity.
6. `docs/art-direction/boards/README.md` — per-board purpose **and limits**. Read it before trusting a board.

**What we are matching is the overall FEELING — the look and feel, not a pixel match.** The target is the
*gestalt* of the reference: mood, depth, palette, contrast, the sense of speed and cold-space scale. Judge a
result by whether the whole frame *feels* like the board at a glance, never by whether one element matches
it element-for-element. Pixel-chasing a single detail while the overall impression drifts is a **failure**,
even when that detail is "correct" — and conversely, a detail may be changed outright when the overall feel
is preserved or improved. That is within remit, not a deviation.

**Boards are a LOOK target, not physical ground truth.** They are AI-generated renders, so detail that is
imperfect or physically impossible is **expected, not a defect**. Aim to get as close to the reference as
possible; where something does not fit physics or feasibility, **evaluate it and decide with the owner** —
do not copy it blindly, and do not discard it for being unphysical (a cheap non-physical trick that matches
the look is a legitimate answer, often the right one). A board tells you the **target**, never the
**mechanism**. Worked example: [`02-track/README.md` §8](02-track/README.md).

**Boards are for LOOK, never for SIZE.** Boards `03` and `04` are the only scale-trustworthy ones; `07` and
`09` are 4–10× undersized; `10` depicts disallowed stacks. The boards will **not** be reshot — this was
requested twice, went unanswered twice, and the owner has accepted it. Stop asking.

### Palette (widened — no longer marigold-only)

Warm ramp, three steps: **`#FFE0A0` warm core → `#FFB52E` hot amber → `#F59A24` marigold falloff**.
Environment is cold and desaturated: blue-grey, graphite, charcoal, deep-space blue/black.
**No cyan, no magenta, no red.** A red hazard colour code is explicitly excluded.

### Excluded from the approved art

Slow blocks, special floors, holed asteroids, visible runtime lanes, vertical gameplay-block stacks,
automatic safe-route glow, red hazard colour. *(Their absence from the art brief does not prove the
corresponding gameplay change shipped — slow blocks are still live in the generator.)*

---

## 3. How each task runs

1. **Research** — a research agent enumerates ≥5 genuinely distinct techniques, reads original sources, names
   its source tier, verifies every API against the *installed* package versions, recommends one, defends it,
   and states **what would make it wrong**. Output lands in `<task>/research/`.
2. **Review together** — owner + Claude read the research and pick the approach. *Nothing is implemented
   before this.* The whole point of the research step is to not pay for a trial-and-error loop.
3. **Align** — the chosen approach is written into `<task>/README.md` as the decision, with the rejected
   options and why.
4. **Implement** — in a dedicated `git worktree` (non-negotiable #12), never the shared checkout.
5. **Visual gate** — the owner looks at it. Live, in **`claude-in-chrome`**, in a **shared tab** — so both of
   us are looking at the same pixels at the same time rather than trading PNG paths. **Not Playwright**
   (confirmed again 2026-09-18). Every task's README states which URL and which camera.
6. **Commit + record** — as-built notes back into `<task>/README.md`; status updated in the table above.

Tests never gate art. A green verify run means the code is sound, not that the art is right.

---

## 4. Standing facts (already paid for — do not rediscover)

**Lighting / materials**
- **The scene is emissive-first, NOT a three-point rig.** Warm near-field light comes from the gameplay
  emissives themselves (rails, seams, engines, pickups); one cold distant star rims the rocks and the planet;
  a very low cold sky ambient touches the far field only; **there is no fill** — shadow sides go black, and
  that is the direction. Evidence and the load-bearing open problem (emissive geometry does not illuminate in
  three.js) are in [`03-lighting/README.md` §1a](03-lighting/README.md). A `key/fill/rim` rig was drafted
  here once, caught by the owner, and disproved by the boards — **do not reintroduce it.**
- `envMapIntensity` is **per-material**, not global. `scene.environmentIntensity` will not save you.
- A near-black sky is a near-black **IBL source**. The old `nebula-backdrop.jpg` measures ~linear **0.01**;
  used as `scene.environment` it emits nothing and `roughness`/`metalness` stay invisible on every prop.
  **This is task 1's central tension:** the art wants a dark, low-saturation background; the scene needs the
  environment to actually light things.
- drei `<Environment>` exposes **`backgroundIntensity` and `environmentIntensity` separately** — the lever
  that lets the sky *read* dark while the lighting environment is scaled independently. Verified against the
  installed typed API.
- **drei `<Environment preset="…">` fetches from a CDN — forbidden.** This must work offline and on the
  office LAN.
- Stone is a dielectric: `metalness: 0`. Metalness with no environment map renders **black**.
- Falsifiable self-test worth reusing: *a surface that looks identical at `roughness 0.2` and `0.9` proves
  your environment is not lighting it.*

**Procedural geometry / texture**
- Compute winding from an **intended normal**, never by reasoning about it. "Away from the centroid" silently
  inverts faces on concave outlines. Pin it with a normal-sign test.
- Size texture features in **world units**, not pixels.
- Base colour **multiplies** the map.
- Module-singleton textures survive HMR; component-local ones leak on every reload.

**Reviewing**
- **Never judge an ISOLATED ingredient against a COMPOSED board.** Occlusion reads as intended faintness and
  yields confident-but-wrong conclusions. Cost a full review cycle on 2026-09-18: `/iso-sky` was judged
  against boards 12/13, whose sky is ~60% covered by rock, producing "the nebula should be nearly invisible"
  — the opposite of the truth. Find the **unoccluded** source for the ingredient first; for the sky that is
  `nebula-backdrop.jpg` (§2 entry 0).
- **Measure before asserting a tonal claim.** Eyeballing "too bright" was wrong by inspection *and* by
  direction; the means were within 17% and the real fault was dynamic range. `ffprobe` + `signalstats` +
  a `lut` threshold gives a coverage histogram in one command, no Python — recipe in
  [`01-background/README.md` §3](01-background/README.md).
- Judge emissive and lateral surfaces from the **real chase camera** in `/art-lab` — in `/art-gallery`'s orbit
  camera a side-facing glow is edge-on and reads as unlit even when it is correct.
- Bloom on **and** off. A form that only reads with bloom does not read.
- Judge at race speed, not parked.
- The boards' small surface panels **are** the spec and do **not** resolve when the whole 1536×1024 poster is
  read as one image. Crop the panel at native resolution (`make-refs.sh crop`).

**Environment gotchas**
- A fresh worktree often serves a **stale Vite dep cache**, which makes koota's `useWorld` see a null React
  and blanks the entire Canvas behind the error boundary. Fix: `rm -rf apps/client/node_modules/.vite`.
- Unsmudged git-lfs ship models 404 and take the Canvas down the same way. Fix: `git lfs pull`.

---

## 5. Mechanics of working here

**Worktree (non-negotiable #12)** — the shared checkout stays on `dev`, read/merge only:

```sh
git fetch origin
git worktree add -B art/<task> ../slur-worktrees/art-<task> origin/dev
cd ../slur-worktrees/art-<task> && pnpm install
```

**Ports** — copy `apps/client/.env.example` → `apps/client/.env`, set `CLIENT_PORT` + `VITE_SERVER_PORT`,
and launch with a matching `PORT` (tsx has no dotenv loader): `PORT=<VITE_SERVER_PORT> pnpm dev`.

**The full verify gate, verbatim** — `pnpm -r test` **silently skips `@slur/shared`** and its 75 sim tests,
so the explicit filter is *not* redundant:

```sh
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

**Review instruments** — `/art-lab` (fly the real track, no server) · `/art-gallery` (subjects at true scale
under the game's own bloom) · `/iso-*` (one ingredient in isolation, via shared `<IsoLab>`).

**References** — `./make-refs.sh` generates small JPEGs (1024px, ~100 KB, ~0.6k tokens to read) from the 2 MB
boards into each task's `refs/`, plus native-resolution panel crops. The generated files are gitignored;
regenerate rather than commit them.

---

## 6. Session log & next steps

### 2026-09-18 — arc set up, task 1 researched

**Done:** this folder structure, the six briefs, `make-refs.sh`, backlog + `CLAUDE.md` pointers. Task 1's
research completed and revised twice: `01-background/research/2026-09-18-procedural-sky.md` (692 lines).

**The correction that mattered.** An early draft of task 3 specified a `key/fill/rim` rig. The owner caught it
as a reflexive default; native-resolution crops of board 12 disproved it and produced the emissive-first model
now in §4 and in `03-lighting/README.md` §1a. This propagated into tasks 1, 2, 4 and 5 — it is the most
important thing decided this session.

**Task 1 research — the shape of it, for review:**
- Recommends **generate-once-to-cubemap → PMREM** for the light path (drei `EnvironmentPortal`), paired with
  a **layered parallax billboard/shell display stack**, both driven by **one generator instanced twice**
  (dim for display, brighter for the bake) so display and lighting cannot drift apart.
- Recommends the star be a **real `DirectionalLight`, not baked** — PMREM's roughness convolution is the
  wrong tool for preserving a small hard highlight; baking it either smears it away or blows out the sky.
- Rejects raymarching (wrong cost shape, and baking it collapses into the same recommendation), a static
  local `.hdr` (not re-parametrizable per sector at runtime), and pure-analytic-lighting (no specular
  environment reflection, which board 12's glossy floor needs).
- Measured board 12: **~55–65% of the upper frame is rock, not sky.** The report itself flags that if tasks
  4/5 fill that much of the frame anyway, a simpler dome + stars + one shader body may be right-sized — and
  says explicitly it cannot make that scope call unilaterally. **That is a question for the owner.**
- Found that **neither current code path sets `scene.environment` at all**, so there is no IBL baseline.

### 2026-09-18 (later) — task 1 decided, lane launched, slice 1 at its gate

**Decided.** Task 1's approach is settled and written into `01-background/README.md` §8. Two corrections were
made to the research's own reasoning in the process, both recorded there: its stated reason for rejecting the
analytic-lights option was wrong (it argued the glossy floor needs real reflections, but an environment
cubemap is direction-only and infinitely distant, so it *cannot* reflect the near-field rails and engines the
floor actually shows — the env map is kept on the narrower, correct ground of rock specular in the far field);
and **parallax was dropped entirely** on physics, not taste.

**Emissive-as-light research landed** at `03-lighting/research/2026-09-18-emissive-as-light.md` (743 lines).
Recommends patching `MeshStandardMaterial` through `onBeforeCompile` — the idiom drei's own
`MeshReflectorMaterial` uses, and already precedented in this repo by `ship-model.tsx`'s dissolve shader —
fed by a **fixed-size** uniform array of the K nearest emitters. Fixed-size is load-bearing: light-count churn
recompiles shaders mid-race, and an array has no count to churn. It also found board 12's floor "reflections"
are most likely **grazing-angle specular streaks** (a streetlamp on wet asphalt) rather than mirrored
geometry, which the same mechanism reproduces for free — with `MeshReflectorMaterial` (a full extra scene
render per frame) held in reserve. **That streak reading is the report's own flagged central bet**: it comes
from reading three static JPEGs, not from a rendered test. Verify it before task 2 commits to it.

**Lane `background` is live** — worktree `../slur-worktrees/background`, branch `art/background`, cut from
`origin/dev` @ `2ef0a7a`. Client `:5200`, server `:2600`. Its complete brief is
`01-background/LANE-BRIEF.md` **inside that worktree** — self-contained, needs no chat history. The
uncommitted art-pass docs plus the modified `CLAUDE.md` and `.claude/backlog.md` were copied in so they ride
into the PR; `git lfs pull` has been run there.

**Slice 1 (sky config + procedural dome + `/iso-sky` + roughness probes) is BUILT, verify gate green, NOT
committed** — holding for a human eye at `http://localhost:5200/iso-sky`. The probes render **black**, which
is the honest baseline: they cannot light up until slice 3 builds the bake.

Worth knowing: the lane added a `rig` toggle to `<IsoLab>` (default on, so `/iso-monolith` is untouched)
because the lab's default ambient+directional would have made the `roughness 0.2` vs `0.9` test pass whether
or not the sky lit anything — it would have been a decorative gate. It also added boards 12 and 13 to
`REFERENCE_BOARDS`, which were on disk but unreachable from the picker.

**~~Next~~ — SUPERSEDED by the 2026-09-19 pivot entry below; the slice plan named here no longer applies.**
*(Historical: )* look at slice 1 and gate it. Then slices 2 (celestial body + the `DirectionalLight`), 3 (the bake —
carries the falsifiable roughness test), 4 (swap in, retire `nebula-backdrop.jpg`). A request to add live
sliders for warp/threshold/ramp is pending — the lane deliberately did not guess the knob set before the
first look.

### Decisions taken at the task-1 research review (2026-09-18)

1. ~~Review the task-1 research and pick the approach.~~ **DONE** — chosen approach, rejected options and the
   reasons are recorded in `01-background/README.md` §8 "Decision". Headline: a one-shot cube bake through
   drei's `<Environment frames={1}>` supplies the cold sky IBL, the star is a **real `DirectionalLight` rather
   than baked** (PMREM's roughness convolution cannot preserve a small hard highlight), and the display sky is
   a procedural dome shader plus drei `<Stars>`.
2. ~~Scope call: is a sophisticated nebula/parallax system worth it?~~ **ANSWERED — nebula IN, parallax OUT.**
   Parallax was dropped on physics, not taste: apparent shift ≈ baseline ÷ distance, and both baselines are
   tiny — lateral strafe is capped at 64u by `halfWidth: 32`, and forward travel is 8000u over a race. At
   cosmic distance both vanish, so camera-locking the sky *is* infinite distance rather than an approximation
   of it. Full reasoning in `01-background/README.md` §8 "No parallax".
3. ~~Where does the emissive-as-light research go?~~ **ANSWERED — researched in parallel with task 1's build**,
   not queued behind it. Note the ordering rationale in §1 above ("lighting flows *from* the environment") was
   **falsified** by the corrected model in `03-lighting/README.md` §1a, which found the sky lights only the far
   rock field and the planet while the track lights itself from its own emissives. Background-first survives as
   cheap-and-harmless, not as load-bearing.

### 2026-09-18 (later still) — the floor-reflection bet, settled on the boards

The emissive-as-light research's riskiest claim — that board 12's floor "reflections" are grazing-angle
specular streaks rather than mirrored geometry — was **cross-checked and confirmed**. Full evidence,
the discriminating test, and the reproduction commands are in [`02-track/README.md` §8](02-track/README.md).

The test that decided it: a mirror reflects **dark** geometry, specular only ever **adds** light — and no
board shows a dark inverted body on the floor beneath a dark monolith. In the crop under board 12's right
monolith the bright streaks run straight through where those inverted bodies would have to be.

Consequence: **`MeshReflectorMaterial` is very likely never needed** (it costs a full extra scene render per
frame). The streaks fall out of the same patched-material emitter array task 3 builds anyway — the floor
question and the emissive-light question collapse into one mechanism.

What is **not** settled, and must be settled by rendering rather than by reading more boards: whether the
streaks need **anisotropic** specular aligned down-track, which would move the patch target from
`MeshStandardMaterial` to `MeshPhysicalMaterial`. Both the API and its recompile footgun are recorded in
§8. The boards have now given everything they can on this.

### 2026-09-18 (later still) — slice 1 gated: FAILED, re-tuning against a measured target

**Slice 1 did not pass.** The work is sound; the tuning was not, and the reference authority needed a
correction. Full findings, self-contained, in the worktree at `01-background/GATE-1-FINDINGS.md`.

**The correction.** `nebula-backdrop.jpg` is the image the **boards were composed over** (owner). So for the
sky it outranks the boards on **tone as well as structure** — the boards are that same image with rock
painted over it. It is retired in slice 4 for being a *bitmap*, not for looking wrong. Now authority entry
**0** in §2 above.

**The trap, which cost a full review cycle.** Judging the *isolated* `/iso-sky` against *composed* boards
reads occlusion as intended faintness. It produced a confident, wrong conclusion ("the nebula should be
nearly invisible") and a backwards tuning direction. Compounding it: `reference-boards.ts` lists only the 14
composed boards, so the overlay **cannot display the one correct reference** and defaults to board 12, the
most occluded of the set. Both are now standing rules in §4.

**Also wrong, and worth recording:** the first tonal read was done by eye and was wrong in *magnitude and
direction* — "too bright" when the means were within 17% and the real fault was dynamic range. Tonal claims
are now measured (`ffprobe` + `signalstats` + `lut`, no Python) before they are asserted.

**Where the lane got to meanwhile:** it independently rebuilt the dome as **four layers** (mask · emission ·
light · dust) — the large-scale mask being exactly the missing large-scale composition — added a `ridge`
knob for edge-lit filaments, and resolved the Bloom blackout as **pre-existing in `IsoLabCanvas`** (repros on
`/iso-monolith`), out of scope here. It has the findings and is re-tuning.

### 2026-09-19 — task 1 PIVOTED to the cheap path (owner decision)

**Ship `nebula-backdrop.jpg` as the display sky; light the scene from a separately-authored environment.**
Self-contained brief: [`01-background/CHEAP-PATH-BRIEF.md`](01-background/CHEAP-PATH-BRIEF.md).

**Why — the target was circular.** The boards were *composed over* that jpg, so the acceptance test for the
procedural dome was "match this JPEG", and we ship that JPEG. We were building an approximation of an asset
we already own, then measuring it against the original and finding it short. The failed slice-1 gate was a
symptom of that, not a setback inside it.

Reinforced by two facts already recorded here and ignored anyway: the "background first, because lighting
flows from the environment" rationale was **already falsified** (§ the 2026-09-18 entry — the sky lights only
the far rock field; the track lights itself from its own emissives), and the research measured **~55–65% of
the upper frame as rock**. A mostly-occluded element that does not light what the player stares at does not
justify a multi-slice procedural build.

**Only one pro-procedural argument survived scrutiny** — per-sector variation (board 06's six sectors). It is
speculative today, and six bitmaps answers it. "No bitmaps" was a *method* rule in §1 above, never traced to
a player-visible outcome; 368 KB is not a budget problem. **§1's "everything is built procedurally" is
therefore no longer absolute** — it is a default that must earn its place per task, not a law.

**The approach.** Texture on the camera-locked dome the lane already built (`SkyFollow`) — **not**
`scene.background = texture`, which is a static fullscreen fill that does not rotate on yaw, and **not**
equirect, which would distort a framed composition. Lighting comes from drei `<Environment>` +
`<Lightformer>` children plus one real `DirectionalLight`. *Verified-this-session* against drei **10.7.8**:
`Lightformer` (`form` circle/ring/rect/plane/box, `intensity`, `color`, `scale`, `target`) and `Environment`
(`children`, `frames`, `resolution`, separate `backgroundIntensity`/`environmentIntensity`/
`environmentRotation`). `preset=` stays forbidden — CDN.

**This dissolves the central tension** in `01-background/README.md` §2 ("art wants a dark sky, but a dark sky
is a dark light source"). It is only a tension if the light is derived *from the picture*. Decouple the two
sources and it evaporates — which is also why the **roughness probes matter more now, not less**: they are
how the `<Lightformer>` rig is proven to actually light, something the procedural path never achieved.

**Two constraints easy to miss:** the jpg **already contains** the rim-lit planet limb, so it comes free and
a second procedural body would double it (default: drop `celestial-body.tsx`); and the jpg has **lighting
baked in**, so the `DirectionalLight` bearing must agree with the direction the image implies or the rock
field is lit from one side while the sky implies another.

**Preserved, not deleted:** branch **`art/procedural-bg`** @ **`6d52029`**, pushed — all 8 commits
(four-layer dome, tuning, celestial body, the real light). Revisit if per-sector variation becomes real.
**Do not delete that branch.**

### ▶ NEXT — state as of 2026-09-19, read this first

**The cheap path is BUILT and the gate is green — but nothing has been seen by a human eye yet.** Lane
`background` (worktree `../slur-worktrees/background`, branch `art/background`, client `:5200` / server
`:2600`), code commit `643af5a`. Full handover:
[`01-background/HANDOVER-CHEAP-PATH.md`](01-background/HANDOVER-CHEAP-PATH.md).

**Your next action — the gate.** `PORT=2600 pnpm dev` from that worktree, then `http://localhost:5200/iso-sky`
**in a FOREGROUND tab**, bloom on **and** off, then `/art-lab` at race speed.

> ⚠ **Not an automated Chrome tab.** The lane tried: the tab reports `visibilityState: "hidden"`, so rAF never
> fires and the canvas stays black while the DOM panels render fine. That is the already-twice-paid
> `hidden-tab-blank-canvas` trap, not a render bug.

The acceptance test is the **roughness probes differentiating**, and the panel now carries the switches to run
it properly: `Star light` OFF + `Env rig` OFF must go **flat** (or something else is lighting them and the
test proves nothing), then `Env rig` ON alone must make `0.2` and `0.9` **visibly differ** — which the
procedural path never achieved. The display sky needs no histogram tuning: it *is* the reference.

**Verified without an eye:** typecheck · lint · 75 shared + 34 client + 4 server tests · build; `/iso-sky`
mounts with no console errors; and **zero external requests across 62** — the drei `<Environment>` *children*
path fetches no CDN HDR, so the office-LAN requirement holds.

**Two things the plan could not have known, both now fixed and documented:** the bearing convention had
`0 = −Z`, i.e. bearing 0 pointed **behind** the player while its comment claimed "the game's forward view" —
now `skyDirection`, `0 = +Z`, pinned by a test that projects through a real three camera. And the star bearing
is now **derived from the image** (limb circle fit + a polar sweep finding the terminator at 169° → the star
at 79° screen-azimuth from the planet, i.e. straight above it → bearing 66 / elevation 19); the old `55/28`
put it 27° to the planet's *right*, the mirror of what the jpg shows.

**Then:** task 2 (track). Its floor-reflection question is already **resolved** — grazing-angle specular
streaks, not mirrors (`02-track/README.md` §8), so `MeshReflectorMaterial` and its extra scene render are
very likely never needed. The one open sub-question there is isotropic vs **anisotropic** specular aligned
down-track, which changes whether the patched material is `MeshStandardMaterial` or `MeshPhysicalMaterial`.
Settle it by rendering, not by reading boards.

**Uncommitted in the shared checkout:** `.claude/art-pass/**` (untracked), `CLAUDE.md`, `.claude/backlog.md`,
`.claude/phases/2026-09-18-art-lanes-supervisor.md`. These must ride into the lane's PR — the pre-commit hook
blocks Claude committing in the shared checkout. They are already copied into the worktree and kept in sync.

### Still open

- **Material strategy** (raised by the owner, 2026-09-18): hand-roll a custom PBR material rather than use
  stock `MeshStandardMaterial`? Folded into the running emissive-as-light research as a first-class option,
  spanning four rungs — stock + real lights · subclass + `onBeforeCompile` (what drei's own
  `MeshReflectorMaterial` does) · `ShaderMaterial` reusing three's exported `ShaderChunk` · a fully hand-rolled
  stylized BRDF. Not decided; does not block task 1, whose dome and celestial body are custom
  `ShaderMaterial`s under every option.
- **Confirm** task 4's square-along-track / varied-filler split means the **Obelisk** family, not a fourth
  silhouette.

### Housekeeping

`.claude/art-pass/` is **untracked**, and the pre-commit hook blocks Claude committing in the shared
checkout — it needs to ride into a PR from the first worktree, along with `.claude/lane.json`.
