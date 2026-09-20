# Supervisor handover — session 18 (2026-09-20)

## The finding that matters

**The washed-out frame has THREE independent causes, not one.** Every previous session chased it as one
problem and tuned one knob. They are:

1. **Frame-wide bloom spread.** `BloomEffect` takes `radius` (default `0.85`) and `levels` (default `8`),
   both documented "only applies to mipmap blur" — verified in the installed typed API,
   `postprocessing@6.39.4`, `build/types/index.d.ts:5280`. All three `<Bloom>` call sites
   (`game/net-canvas.tsx`, `routes/art-lab/art-lab-canvas.tsx`, `iso-lab/iso-lab-canvas.tsx`) pass
   **neither**, and `BloomConfig` in `scene/env-config.ts` has no field for either. Eight mip levels smears
   the glow to roughly a 1/256-resolution blur before compositing it back — frame-wide spread by
   construction, from a default nobody chose.
2. **Envmap specular on the deck.** The star and planet reflected in the floor. `FLOOR_METALNESS` is NOT the
   lever (see below); `envMapIntensity` is.
3. **`<ambientLight intensity={ 1 } />`** at `game/net-canvas.tsx:115` — a full-intensity uniform fill,
   against `03-lighting/README.md` §1a: "Shadow sides go essentially black. **There is no fill.** That *is*
   the 'deep shadows' instruction."

They feed each other: a near-white deck filling the lower half of frame is the scene's single largest bloom
source, so a wide bloom fed by a white deck is a loop. **Tune them together or you chase your own tail.**

## The metalness sweep refuted its own premise

The lane ran it properly and the answer was no. Mean luminance of an identical 500×180 deck crop, at fixed
`FLOOR_ROUGHNESS` 0.42:

| `FLOOR_METALNESS` | 1.0 | 0.7 | 0.5 | 0.3 | 0.15 |
|---|---|---|---|---|---|
| deck YAVG (0–255) | **89.7** | 93.7 | 96.3 | 98.4 | 100.5 |

Monotonic the wrong way — 1.0 is the *darkest*. Grazing-angle Fresnel specular stays pinned near 1.0
regardless of metalness, so lowering it only **adds** the diffuse albedo term back on top. **Metalness is
not the lever at any value.** Frames: `s2-metal-{100,070,050,030,015}.jpg` in the **worktree's**
`.claude/art-pass/00-frame-tap/refs/`, not the shared checkout.

The lane caught the deck rendering **dark** at metalness 1.0 in the ~30–45s window before
`nebula-backdrop.jpg` loads, and going white the instant it lands — so deck brightness is essentially all
environment reflection. Hold metalness at **1.0** while sweeping `envMapIntensity`: with no diffuse term at
all, envMapIntensity becomes the only input, a single monotonic knob instead of two interacting ones.

⚠ This contradicts the standing note that the nebula is near-black (~linear 0.01) and useless as IBL. One of
the two is wrong; the planet limb is the suspect. The lane owes a one-line answer on what actually feeds
`scene.environment` and whether a multiplier is already applied.

## Owner decisions taken this session

- **Rail 2×** — `BOUNDARY_W`/`BOUNDARY_H` 0.5 → 1.0 in `scene/track-geometry.ts`. Client-only geometry (zero
  references in `packages/shared`), so no sim or 7u-clearance argument against it. 2× not 3× because
  `81000f1` only just got the strip reading as the slab's own corner rather than a rail bolted on top.
  **Standing — do not let a later tuning pass quietly restore 0.5.**
- **Camera: pitch, not height.** `lookAhead` 7 → 14, `lookAtLift` 2 → 5 in `game/camera/chase.ts`; `height`
  9, `back` 11, `fov` 60 untouched. The cam aimed at `ship.y+2` only 7u ahead — 18u ahead of the camera and
  7u below it, a ~21° downward pitch, which at 60° vertical FOV puts the horizon near 85% of frame height.
  **The two owner complaints were one number**: "not enough sky" and "track ends above centre" are the same
  pitch. Board framing proper needs a 4–5u camera, which ADR-010 defers because +9u is what lets a player
  see over the 8u pillars; at height 9 a level pitch drops the ship 39° below the view axis, outside the 30°
  half-FOV, i.e. off-screen. So we buy sky from pitch alone. `back` 11 → 9 is the only sanctioned
  compensating lever if the ship reads small.
- **No key light on the track.** Owner asked, given the right-side specular. Answer is no and
  `03-lighting/README.md` §1a already settles it — "NOT a three-point rig", the key/fill/rim/ambient draft
  "was a reflexive default, the owner caught it", the star "barely touches the track". All fixes here are
  subtractive.

## Lane state

`track-slice2-d8`, worktree `../slur-worktrees/track-slice2`, branch `art/track-slice2`, ports 5201/2601.
Camera + rail are in the tree, uncommitted at time of writing. Queue given to it:
**bloom spread → ambient fill → envMapIntensity → final frame**, shooting the deck after each, then
re-confirming there is nothing left to pick on metalness. Separate commits per subject. No PR yet.

Bloom brief: add `radius`/`levels` to `BloomConfig`, thread all three call sites, then `levels` 8 → 4 and
`radius` 0.85 → 0.6 holding everything else, then `intensity` 1.0 → ~1.6, then `threshold` 0.45 → 0.8 only
if still veiled.

Open question handed to the lane: **does `/art-lab` mount its own lights?** If the lab and the game light
differently, every judgement made in the lab is suspect.

## Mechanics learned this session

**The supervisor can clear a lane's context itself** — `herdr agent send-keys <name> / c l e a r enter`
(every character is a key name; the old skill text claiming text could not be sent this way was wrong and is
what made clearing expensive). The session survives: same process, same socket, same `ListAgents` name, so
the next `SendMessage` lands in the fresh context. No kill, no `herdr agent start`, no new name. Done to the
track lane at 250k → 0%, working again in under a minute. `~/.claude-personal/skills/lane/SKILL.md` updated
(five edits) and memory written.

The other half: **a cold agent will walk the whole reachable document graph** — a 346-line brief, a README, a
743-line research doc — and hit the hard stop having touched no code. Name what NOT to read, and for a narrow
task write a self-contained brief instead. That is now in the skill too.

## Still owed

- **Frame-tap is dead**, twice-confirmed this session — "nobody answered" on 5201, before and after focusing
  the tab. Captures are Chrome screenshots. Not the lane's problem; someone should own it.
- Stale dev stacks were swept at session start (5173/2567, 5203, and two duplicates in the track worktree).
- `docs/codex-reconcile` @ `84291fb` still committed, unpushed, no PR, from session 17.

---

## Update — the lane's first seam, and two corrections to the above

**`art/track-slice2` @ `b5c0823`**, three commits pushed, tree clean, **full gate green** (typecheck · lint
3 pre-existing warnings · shared 75/75 · client 66/66 · server 4/4 · build). No PR yet.
`a50cb3f` camera · `57589dc` bloom threading · `b5c0823` rail 2×.

**Correction 1 — six `<Bloom>` call sites, not three.** Beyond `net-canvas` / `art-lab-canvas` /
`iso-lab-canvas` there are `env-lab-canvas.tsx`, `home/landing-scene.tsx` and
`art-gallery/gallery-bloom.tsx`. All six are threaded; doing three would have forked the config.

**Correction 2 — live bloom values are variant C**, `GRID_VOID` = `intensity 1.2`, `threshold 0.42`,
`smoothing 0.2`. The 1.0 / 0.45 quoted earlier are variant A's.

**Correction 3 — the envmap question is closed, and the standing note was right.** `scene.environment` is
drei `<Environment frames={1} resolution={128} background={false}>` baking three `<Lightformer>`s to a
cubemap in `sky-environment.tsx` (key 3.2 / fill 0.35 / ambient 0.12, `sky-config.ts`). **Not** the nebula
jpg. The lane's backdrop-correlation was the whole sky subtree mounting as a unit. `sky-config.ts:103`
records why the procedural dome was retired: "a sky dark enough to look right was too dark to light
anything." No `envMapIntensity` is set on any track material — sweeping it means **adding** the prop,
per-material, since `scene.environmentIntensity` does not cover it.

**The lab/game lighting split is worse than a quirk.** `<ambientLight intensity={1} />` exists **only** at
`net-canvas.tsx:115` — in the game. `/art-lab` mounts **no lights at all** by design
(`art-lab-canvas.tsx:45`: "NO lab-only lights"). So **every frame shot in the lab this session and last
omits the ambient fill** — lab judgements are not invalid but are systematically *optimistic*; the game is
washed more than anything measured. The owner's ruling: labs and game must share **one** rig, which
`03-lighting/README.md` §1 already specifies. Unify toward *no fill* (§1a: "There is no fill"), not toward
the game's ambient 1 — which also un-blocks the ambient sweep from needing a hosted room.

## The camera regression, and a supervisor error to not repeat

The owner reports the ship leaving the bottom of frame after `a50cb3f`. It does:

- `pitch = atan2(height − lookAtLift, back + lookAhead)` = `atan2(4, 25)` = **9.1°** — the ~12° estimate in
  the section above was wrong.
- `shipBelowHorizontal = atan2(height, back)` = `atan2(9, 11)` = **39.3°**.
- `shipBelowAxis = 30.2°` against a **30°** vertical half-FOV. Off the edge.

**The `back` 11 → 9 compensating lever quoted above is BACKWARDS.** Closing the distance at the same height
steepens the ship below horizontal (`atan2(9,9)` = 45°). The levers that help are raise `back`, lower
`lookAtLift`, or lower `height` (forbidden — ADR-010). Two candidates are in `02-track/LANE-STATE.md`; the
owner picks between them on screen.

**Lesson:** a framing prediction that lands within ~1° of the FOV edge is not a prediction, it is a coin
flip. Compute `shipBelowAxis` against half-FOV *before* proposing camera constants, and target ≥5° margin —
`back` stretches to 14 at speed and the ship has size.

## Lane state now

Cleared at the seam (0% context) and re-pointed at **`.claude/art-pass/02-track/LANE-STATE.md`** (139 lines,
self-contained, its "⚠ SUPERSEDES" section reorders the rest). Order:
**camera fix + ~3u placeholder box → shared lighting rig → bloom spread capture → intensity → threshold →
`envMapIntensity` → ambient value → PR.**

The bloom values `levels 4` / `radius 0.6` are **shipped but never captured or judged** — that is still an
open unit, not a finished one.
