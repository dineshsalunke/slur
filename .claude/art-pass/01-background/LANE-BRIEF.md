# LANE BRIEF — art-pass task 1: the procedural background

You are the lane agent for **task 1 of the SLUR art pass: the deep-space background**. You work in this
worktree (`slur-worktrees/background`, branch `art/background`) and **nowhere else**. Your stack is already
running: client on **http://localhost:5200**, server on **:2600**.

---

## 0. Read these before writing a line of code

In this order. Do not skip and do not skim the first two — they contain decisions already paid for, and
re-deriving them costs real money and gets a different answer.

1. **`.claude/art-pass/01-background/README.md`** — your task brief. **§8 "Decision" is binding**: the
   approach is already chosen and is not yours to revisit. §4 is the definition of done.
2. **`.claude/art-pass/INDEX.md`** — the arc, the authority order for resolving art conflicts, and
   §4 "Standing facts (already paid for — do not rediscover)".
3. **`.claude/art-pass/01-background/research/2026-09-18-procedural-sky.md`** — the 692-line research the
   decision came from. Read §2 (the option space), §3 (the specific technical questions — star fields
   under motion, nebula noise construction, the celestial body's terminator and rim, the IBL path end to
   end) and §4 (the recommendation). **The parallax half of §4 is superseded — see §3 of this brief.**
4. **`conventions/r3f.md`** — the project's R3F/three idioms. Landed code is judged against this, not
   against what is common elsewhere.
5. **`CLAUDE.md`** — the project non-negotiables. #4 (no per-frame React re-renders in gameplay), #8
   (`useEffect` is an escape hatch, never the default), #9 (`<Fragment>` not `<>`; one component per
   file), #10 (push every subscription down to its leaf), #13 (write to the INSTALLED stack, verify the
   mechanism before typing it), #14 (no reflexive primitive — enumerate options before choosing a
   mechanism) all bind you directly here.
6. **`docs/ART_SCALE_REFERENCE.md`** — the sole authority on dimensions. It overrides every number printed
   on any concept board.

Reference images already cropped for you: `.claude/art-pass/01-background/refs/`. Read
`12_approved_scene_marigold_depth.small.jpg` (top-precedence board) and the native-resolution crops
`12_*.R-planet-star.jpg` (the star and the rim-lit planet limb — your single most important reference)
and `12_*.L-monoliths.jpg`.

---

## 1. What you are building

A **fully procedural** deep-space background — no bitmaps — that is both the thing you see and a usable
image-based-lighting source for the far field. It replaces
`apps/client/app/game/scene/scene-backdrop.tsx`, which is today a single `nebula-backdrop.jpg` and is
marked temporary in its own header.

Per the binding decision in README §8, the architecture is:

| Layer | Mechanism |
|---|---|
| Display — sky | camera-locked shell using the existing `SkyFollow` **unchanged**: a procedural dome shader (cold gradient + restrained domain-warped FBM nebula) + drei `<Stars>` |
| Display — body | one celestial body, **camera-locked with the rest of the sky**: custom `ShaderMaterial`, `dot(N,L)` smoothstep terminator + `pow(1 - dot(N,V), k)` fresnel rim |
| Star (light) | a real `DirectionalLight` — **not** baked into the cubemap |
| Sky (light) | drei `<Environment frames={1}>` with the *same* generator as children at a brighter intensity → one-shot cube bake → `scene.environment` |

**Why the star is a real light and not baked:** PMREM's whole job is producing blurred per-roughness
radiance for diffuse/glossy reflection. It is explicitly not built to preserve a small, hard, bright
point — bake the flare in and you either smear it to nothing or, boosting it enough to survive
convolution, blow out the surrounding sky.

**You do not need to call `PMREMGenerator` yourself.** Verified this session in installed source: three's
renderer auto-PMREMs any `CubeReflectionMapping` texture assigned to `scene.environment`, caches it in a
`WeakMap`, and re-convolves when `texture.pmremVersion` changes on a render-target texture
(`three@0.185.1/src/renderers/webgl/WebGLEnvironments.js:71–140`). drei's portal path already defaults to
`frames = 1` and renders into a `HalfFloatType` `WebGLCubeRenderTarget`
(`drei@10.7.8/core/Environment.js:91, 111, 120`). So the bake is genuinely one-shot and HDR, and the
prefiltering is the renderer's job.

---

## 2. Nebula restraint — this is the part most likely to go wrong

The art direction is **cold, desaturated, low-contrast, dark**. The failure mode is the saturated
blue/purple "shadertoy nebula", and it is easy to land on by accident.

The research established (§3.2, with primary sources read directly) that domain-warped FBM —
`q = fBm(p)`, `r = fBm(p + q)`, `result = fBm(p + r)` — is **saturation-neutral**. Inigo Quilez's own
article on the technique never touches colour at all; it is purely a shape operation. Saturation comes
entirely from what you do downstream. The three concrete restraint levers, from a practitioner who
documented this exact failure:

1. **A narrow, hand-authored cold colour ramp** — density indexes a curated 1-D gradient. Not procedural
   HSV cycling.
2. **Subtle warp amplitude.** The pegwars "Rendering Nebulae" writeup states it directly: the warp "ended
   up needing to be very subtle, or the noise field quickly degenerates from a lovely blobby or wispy and
   cohesive image into a torrid mess."
3. **Low octave count.**

Palette: warm ramp `#FFE0A0` → `#FFB52E` → `#F59A24` is for the **playable layer**, not the sky. The sky
is blue-grey, graphite, charcoal, deep-space blue/black. **No cyan, no magenta, no red.** Note that
`01_color_lighting_moodboard` still prints superseded Alert Red / Cyan / Purple swatches — those are
excluded now; ignore them.

There is a trig-free value-noise implementation already in the repo at `packages/shared/src/sim/noise.ts`
(`valueNoise1D`/`2D` + `smoothstep`). The sky is cosmetic and **never enters `simulate()`**, so none of
the determinism constraints that shaped that file apply to you — your shader may freely use `sin`/`cos`/
`pow`. Reuse it if it helps, but you are not bound by it, and GLSL noise in the shader is fine.

---

## 3. Parallax is OUT — do not build it

The research recommended 2–3 nebula wisp layers at partial camera tracking. **That was dropped by the
owner on physics grounds.** Read README §8 "No parallax" for the full reasoning; the short version:

Apparent shift ≈ baseline ÷ distance, and both baselines are tiny. Lateral strafe is capped at 64u by
`halfWidth: 32` (`packages/shared/src/constants.ts:91`); forward travel over a whole race is 8000u
(`TRACK_SEGMENTS = 400`, and that constant's own comment states `finishZ = TRACK_SEGMENTS·SEG_LEN =
8000u`, `packages/shared/src/sim/track.ts:131`). At genuine cosmic distance both vanish. **Camera-locking
the sky is not an approximation of infinite distance — it IS infinite distance**, exactly, and for free.

Consequences you must respect:

- **`SkyFollow` is used completely unchanged.** No `tracking` prop, no new shared-file surface. It copies
  camera *position* but not *rotation* — that stays correct, because the sky must still swing as the ship
  turns.
- **The celestial body is camera-locked too.** At any renderable distance a world-placed body would
  visibly loom across 8000u of travel.
- Depth is delivered by the rock layers in *front* of the sky (tasks 4 and 5), never by the sky.

---

## 4. Build it in four slices, and stop at each gate

Do not build all four and then ask. Each slice ends with a human looking at it.

**Slice 1 — sky config + procedural dome.**
`sky-config.ts` (a plain typed data module, not a component) plus `procedural-dome.tsx` (BackSide sphere,
`ShaderMaterial`, cold gradient + restrained domain-warped FBM). Plus the `/iso-sky` route and the
roughness probes described in §5.
Tuning knobs must be **intuitive and derived** — palette stops, warp amplitude, octave count, star bearing
and elevation **in degrees**. A compass bearing is something a human can reason about; a raw xyz position
vector is not. Comment every tuning field. This is a standing project rule about tuning surfaces.
*Gate: is the nebula restrained, cold and low-saturation?*

**Slice 2 — celestial body + the star light.**
`celestial-body.tsx`: `dot(N,L)` smoothstep terminator (a soft band, not a hard clip) plus a
`pow(1 - dot(N,V), k)` fresnel rim. The rim is **not** optional decoration — a physically-correct diffuse
sphere's night side is simply dark, so the rim glow visible on boards 05, 12 and 13 has to be an added
term. Stay cold and desaturated: no marigold surface colour on the body by default.
The `DirectionalLight`'s bearing must be the **single source of truth**, shared by the body, the dome's
flare and the bake. If the light points somewhere the visible flare isn't, the render desynchronises from
its own background.
*Gate: does it read like board 12's upper-right rim-lit planet limb?*

**Slice 3 — the bake.**
`<Environment frames={1}>` with the same generator as children, at a brighter content-level intensity.
Same generator instanced twice — display dim, bake brighter — so the two cannot drift apart.
*Gate — the falsifiable one, see §5.*

**Slice 4 — swap in, retire the bitmap.**
`environment.tsx` consumes the new sky. `scene-backdrop.tsx` and `public/textures/nebula-backdrop.jpg` are
no longer referenced.
*Gate: `/art-lab`, real chase camera, at race speed, bloom on and off, side by side with the board.*

---

## 5. Definition of done

- Renders in isolation at `/iso-sky` with live controls, and in `/art-lab` behind the real track.
- **Zero bitmap dependency.** `nebula-backdrop.jpg` no longer referenced.
- **The falsifiable self-test:** a probe at `roughness 0.2` must look visibly different from one at
  `roughness 0.9`. If they look identical, your environment is not lighting anything and the task is not
  done. **Run this on a rock-like matte material out at far-field distance — NOT on a probe sitting on
  the track.** The research is explicit that testing it trackside risks concluding "the sky is too dim to
  light anything," which board 12 says is *correct*, not a bug: the sky's lighting job is only the far
  rock field and the planet's terminator. The track lights itself from its own emissives.
- Background reads cold and desaturated; nothing in the far field competes with the playable layer.
- **Zero parallax** — the sky is camera-locked and shows no relative motion (§3).
- Stable at race speed: no crawling, aliasing or shimmer in the star field under motion.
- Costs stated in your PR: draw calls, texture memory, and whether anything regenerates per frame.

**Out of scope — do not build these.** The track, floor, rails and gaps (task 2). Final lighting balance,
exposure and bloom tuning (task 3). Asteroid and monolith meshes (tasks 4/5) — board 12's asteroid wall
is *their* job, so **do not fake it in the backdrop**. Per-sector A/B/C variants — build the language so
they are parameters, but do not author six sectors now.

---

## 6. The verify gate — run it in full before you commit

```sh
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

`pnpm -r test` **silently skips `@slur/shared`** and its 75 sim tests, so the explicit `--filter` is not
redundant. Run the whole chain. Green tests do not mean the art is right — tests never gate art — but red
tests always block.

---

## 7. How it is judged — a human eye, on a live tab

Use the **`claude-in-chrome`** tools. **Never Playwright or Puppeteer**, even though a scripted browser
would give you more deterministic viewports. The reason is the human loop: when you and the owner look at
the same live tab, they review by glancing at it. Screenshot files force them to hunt a path in Finder,
open it, comment, and wait for a re-shoot — a slow, irritating round-trip for work whose entire gate is a
human eye.

**Create your OWN tab** with `tabs_create_mcp` and pass its `tabId` explicitly on every subsequent call.
Other lanes may share this Chrome; without an explicit tabId you will fight over one.

1. `http://localhost:5200/iso-sky` — the sky alone, with the roughness probes visible.
2. `http://localhost:5200/art-lab` — from the **real chase camera**, moving, at race speed. Not the
   `/art-gallery` orbit camera: there a side-facing glow is edge-on and reads as unlit even when it is
   correct.
3. **Bloom on AND bloom off.** A form that only reads with bloom does not read.
4. Side by side against `.claude/art-pass/01-background/refs/12_approved_scene_marigold_depth.small.jpg`.

---

## 8. Traps already paid for — do not rediscover these

- A fresh worktree often serves a **stale Vite dep cache**, which makes koota's `useWorld` see a null
  React and blanks the entire Canvas behind the error boundary. Fix: `rm -rf apps/client/node_modules/.vite`
  and restart the stack. *(Your stack is already up and `git lfs pull` has already been run here.)*
- **`<Environment preset="…">` fetches from a CDN** (`raw.githack.com/pmndrs/drei-assets`). Forbidden —
  this must work offline and on the office LAN. Use `children` (the portal path) or a local `map`.
- **`envMapIntensity` is per-material, not global.** `scene.environmentIntensity` will not save you. Every
  `MeshStandardMaterial` that should be lit by your environment needs it set.
- **Metalness with no environment map renders black.** Stone is a dielectric: `metalness: 0`.
- **Compute winding from an intended normal**, never by reasoning about it — "away from the centroid"
  silently inverts faces on concave outlines. Pin it with a normal-sign test.
- **Size texture features in world units, not pixels.** Base colour **multiplies** the map.
- **Module-singleton textures survive HMR**; component-local ones leak on every reload.
- **drei `<Sky>` is not a candidate** — it is Preetham/Nishita atmospheric scattering for a planet's
  *daytime* sky and cannot be made to read as cold deep space.
- The boards **will not be reshot.** This was requested twice and went unanswered; the owner has accepted
  it. Do not ask. Boards are for LOOK, never for SIZE.

---

## 9. Rules of engagement

- **All edits and commits happen in THIS worktree.** Never the shared checkout at
  `/Users/apple/Projects/personal/slur` — a pre-commit hook blocks Claude committing there anyway.
- **No Python.** Not for scripts, parsing, validation or tooling. Use `jq`/`yq` for structured data,
  `fish`/`bash` for text, `node` for JS work. This is a hard project rule.
- **Never regex-edit source code** — no `sed -i`, `perl -pi`, `awk` rewrites. Use the `Edit` tool, or
  `ast-grep` for genuinely structural changes. Shell text tools stay legal for *reading*.
- **No `Co-Authored-By` trailer** in commits — this repo's hook rejects it. Also do not bundle `git add`
  and `git commit` into one Bash call; a hook rejection kills the whole call.
- **Comments: terse, and only what the code cannot say.** Document the non-inferable — a rejected
  alternative, an external constraint — in one or two plain lines. No multi-paragraph justification
  blocks; that volume buries the comments that matter. Longer reasoning goes in the PR body.

---

## 10. Escalation — you ask ME, never the user

You must **never** ask the user directly, and never guess at human taste.

**Escalate:** art and taste judgements ("does this read right", "which variant"); anything that
contradicts or reopens a frozen decision or an ADR; anything touching gameplay (camera, collision, scale,
hazard readability — art-only changes are fine); anything costly to undo; a genuine fork with real
trade-offs.

**Do NOT escalate:** naming, file layout, code structure; anything the project docs or this brief already
answer; and anything settleable by **verifying** — an API's behaviour, a measured value, whether something
renders. Verify, don't ask.

Use exactly this shape:

```
NEEDS-DECISION: <one line, specific, answerable>
CONTEXT: <2-4 lines: what you are doing, why this fork exists>
OPTION A — <label>: <what it means> / consequence: <what it costs or commits us to>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why — a recommendation without a defence is just a preference>
IF NO ANSWER: <what you do meanwhile, or that you are genuinely blocked>
```

Two to four real options, no padding. If the decision is visual, **park your Chrome tab on it and say
so**, so the owner can just look. Carry on with unblocked work or stop cleanly rather than spinning.
**Never treat silence as approval.**

---

## 11. One open decision that does NOT block you

The owner is weighing whether to hand-roll a custom PBR material instead of using stock
`MeshStandardMaterial`. That question belongs to tasks 2 and 3 (the track's emissive lighting), and
research on it has just landed. **It does not block you**: your dome and your celestial body are custom
`ShaderMaterial`s under every option on the table. Build them. Do not wait, and do not try to solve the
track's lighting here.

---

**Start with slice 1.** Report back when it is ready to look at, with the `/iso-sky` URL and your Chrome
tab parked on it.
