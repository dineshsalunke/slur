# LANE STATE — near-black albedo (#171) — written by the supervisor, 2026-09-20

**Your context was cleared and you have been redirected.** The Split Crown work is DONE and MERGED — PR
#165 landed as `32a6b5f` on `dev`, #159 is closed. Do not go back to it. This file is your whole brief.

| | |
|---|---|
| worktree | `/Users/apple/Projects/personal/slur-worktrees/split-crown` |
| branch | **`fix/near-black-albedo`**, fresh off `origin/dev` @ `32a6b5f`, tree clean, not yet pushed |
| issue | **#171** |
| stack | 5200 / 2600, both up; `apps/client/.env` = `CLIENT_PORT=5200`, `VITE_SERVER_PORT=2600` |
| capture | **the frame tap — `curl 'http://localhost:5200/__frame-tap?name=<name>'`**. See below. |

The owner has ordered **#171 before #170**. #170 (add a back-fill light) is **held** until you finish,
because its premise and yours contradict each other — see *Why this is first*.

## The claim on the table, and why I do not believe it yet

Your predecessor's reading was: the Split Crown hull's authored `baseColorFactor` is `[0.00700, 0.00913,
0.01161]` linear, and it **"renders mid-grey (~0.4 linear by eye)"** — a 50–60x gap.

**"By eye" is the entire weakness of that claim, and your first job is to destroy or confirm it with a
measured pixel.** Here is the specific reason to doubt it: 0.007 linear, encoded to sRGB for display, is
`#171A1D` — roughly 9% of the 0–255 range. A patch at `#171A1D` sitting against a near-black space backdrop
under bloom will *look* like mid-grey to a human and to a vision model, because there is nothing darker in
frame to anchor against. **Perceived lightness is not linear albedo, and neither is an 8-bit sRGB
value.** If the rendered pixel turns out to be `#171A1D`, there is no bug, the ship is correct, and #171
closes as invalid — which would be an excellent outcome, not a wasted lane.

So: **do not start diagnosing a 50x gap until you have proved a 50x gap exists.**

### Step 1 — measure the pixel, do not estimate it

Tap a frame with the ship in it, read the PNG, and sample the hull's charcoal coating. Then convert properly:
undo the sRGB transfer function to get linear, and account for whatever tone mapping is in the path before
you compare against `0.00700`. Report the sampled 8-bit value, the linear value you derived, the transfer
and tone-map functions you inverted, and the ratio against authored. **Every number in that chain must be
read from installed source or from the image — none recalled.**

A useful control in the same frame: the deck. Its material constants are known (`FLOOR_METALNESS 0.75`,
`FLOOR_ROUGHNESS 0.4` in `track-materials.ts`), so a second sampled surface tells you whether any gap is
ship-specific or global.

If the gap is real, continue. If it is not, write that up, close #171 with the measurement, and tell me
immediately — because #170 un-blocks the moment you do.

## The frame tap — how you read pixels

`curl 'http://localhost:5200/__frame-tap?name=<name>'` writes the **composed frame, with bloom** to
`.claude/art-pass/00-frame-tap/refs/<name>.png` and answers with the path. Read the PNG. **No focus, no
foregrounding, no extension pairing, no CDP** — any Chrome with the route merely loaded is a valid
responder, and yours still is.

- `firstDeltaSeconds` in the response reads time since the last frame from **any** source, and a pump **is**
  a frame — two taps back-to-back both report ~0.016 even with rAF dead. Read it as an rAF probe only
  across a ~10 s gap.
- A tap that 504s means the route never mounted R3F. Reload the tab; do not retry the tap.
- Refs are gitignored (`.claude/art-pass/.gitignore:3`). A frame reproduces by re-tapping — name your taps
  meaningfully and quote the name with any finding.

**Your `/art-lab` tab is left with `ships` ON and `shipBox` OFF, which is NOT the lab's default.** A fresh
`/art-lab` comes up `shipBox` ON and `ships` OFF and draws an opaque debug AABB slab exactly where the ship
belongs. That slab has already produced one phantom bug on this very issue. **Check the toggles before
trusting any frame.**

## What your predecessor established — do not redo any of it

Read first-hand from the GLB binary, materials as authored:

| material | baseColorFactor (linear) | notes |
|---|---|---|
| Charcoal_coating | `[0.00700, 0.00913, 0.01161]` | roughness 0.48, metalness 0 |
| Recess_interior | `[0.00152, 0.00182, 0.00212]` | roughness 0.72 |
| Armor_panels | `[0.00972, 0.01298, 0.01681]` | roughness 0.43 |
| Recess_bezels | `[0.01600, 0.02029, 0.02416]` | metalness 0.3 |

Marigold_emission and Engine_core are the two emissive materials. **0 images** in the file;
`extensionsUsed` is `["KHR_materials_emissive_strength"]` only.

**Ruled out as the cause, each by direct inspection:**

- **The material path.** `ship-model.tsx` never writes `.color`. `tintHull` is gone (deleted in #165).
  `<Clone deep="materialsOnly">` only clones.
- **Ambient.** `AMBIENT_INTENSITY = 0`.
- **The cold key.** A single `directionalLight`, `KEY_INTENSITY = 1`, colour `#c2ccd6`, elevation 45,
  bearing 0. At N·L ≤ 1 against a 0.007 albedo this cannot produce mid-grey.
- **The `/art-lab` `env` LAYER toggle.** Flipping it off changed the hull **not at all**.

**Failed approach — do not repeat it.** The R3F scene graph is **not reachable from the DOM fiber**:
`canvas.__r3f` is undefined, and walking the fiber tree up 42 hops and down 325 fibers finds no `isScene`.
R3F runs its own reconciler root. Any live scene measurement needs a different hook than the DOM.

## Where your predecessor stopped — the live hypotheses

Both are `[unmeasured]`. Neither is a conclusion.

1. **The IBL.** `sky-config.ts:103` describes the lighting environment as *"three `<Lightformer>`s baked to
   a cubemap by drei `<Environment>`"* — so there **is** an image-based lighting path, and the `env` layer
   button may only control the **visible backdrop** rather than `scene.environment`. A toggle that changed
   nothing is therefore evidence about the toggle, not about the IBL. Find out what that button is actually
   wired to before drawing anything from it.
2. **Tone mapping and exposure.** Nothing in `apps/client/app` sets `toneMapping`, `toneMappingExposure` or
   `outputColorSpace` on any Canvas — I grepped this session and found no hit. **So every Canvas is running
   R3F's defaults, and you must read what those defaults are from the installed `@react-three/fiber` 9.7.0
   source rather than recalling them.** Whatever they are, they are in the path between `0.007` and the
   pixel, and step 1's conversion is wrong if you guess them.

A third the predecessor did not raise, worth holding: **bloom**. It is a global postprocess, the composer is
the renderer, and a dark hull adjacent to the marigold emissive and the engine core can pick up bleed.
The tap captures the composed frame, so what you sample already includes it.

## Why this is first, and what #170 is waiting on

`sealed-block` computed, against three 0.185.1's own fragment math with every formula cited to installed
source, that the block's player-facing (−Z) face receives **rgb(0,0,0)** — direct `0.00e+0`, env diffuse
`4.81e-5`, env specular `2.91e-4`, `dotNV` 0.928 so no grazing rescue. That computation is what #170 exists
to fix, by adding a low fill from behind the player.

You measured the opposite sign of error on a different asset. **Both lanes computed correctly and they
disagree about what the renderer actually does to a dark surface.** If we add fill light to compensate for
a darkness that is not really there, we over-light the whole scene and then re-tune every material a second
time. The owner's call, this session: **#171 first, #170 held.**

**So your deliverable is not only a fix. It is an answer to "what does the renderer actually do to a
near-black surface, measured on pixels?"** — because the deck, the block and the hull were all authored
near-black, and if that arrives wrong then every material decision so far was made against a moved target.
Near-black is the house palette; this is load-bearing.

## Boundaries

- **Touch no lighting values as a fix** until you have the measurement. Diagnosis first. If the fix turns
  out to be a light, stop and tell me — that overlaps #170 and I will re-scope rather than let two lanes
  write the same file.
- **`docs/art-direction/` is read-only.** Never edit, move or "correct" anything under it.
- Do not touch `LETHAL_SURFACE`'s red (`track-materials.ts:35`) — its retone is deliberately deferred.
- Do not touch the sealed-block work; `art/sealed-block` is another live lane.
- Ship boundary is moot now that #165 merged, but #167 (ships hover proportional to speed) stays in Backlog
  and is **not** yours.

## House rules that apply to whatever you write

- Full verify gate before reporting done: `pnpm typecheck`, `pnpm lint`, `pnpm -r test`, `pnpm build`.
- **No `Co-Authored-By` trailer** — the commit hook rejects it.
- Comments: terse, only what the code cannot say. No multi-paragraph rationale blocks; the weighing goes in
  the PR body.
- Any mechanism decision gets at least five candidates weighed, with the winner's one-line rationale in the
  code and the full weighing in the PR.
- The lint comment-ratchet fires on **touched** files: a comment added to an existing file costs a deletion
  somewhere. Budget for it.

## Loose ends from the ships lane, recorded so they are not lost

- **Chrome quits when a lane closes its last tab** — the owner reported this. Leave your tab group open.
- The machine IP moved `192.168.43.61` → `10.20.2.48` mid-session and the dev stack died once and was
  restarted. If a listener drops, that is the likely cause.
- The reason there is no z-fighting between the hull underside and the deck top, which is written nowhere
  else: the deck top faces **up** and the hull underside faces **down**, so the coplanar pair is never both
  front-facing and cannot fight. It is recorded here because it is the fact that closed the "half sunk"
  geometric hypothesis for good.
