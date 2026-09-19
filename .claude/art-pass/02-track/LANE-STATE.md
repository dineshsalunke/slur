# LANE STATE — art/track-slice2, after the seam at `4305a4d`

Written by the supervisor from the lane's own first-hand facts. **This file plus your next action is
everything you need. Do NOT read `LANE-BRIEF.md`, `SWEEP-BRIEF.md`, the task README, the research docs
or the boards** — a cold context that walks that graph hits the hard stop having touched no code. It
has happened twice.

You execute. **No docs, no handovers, no code comments.** Report facts in a short message; the
supervisor writes the prose.

## Where the branch is

`art/track-slice2` @ **`4305a4d`**, pushed, tracking `origin/art/track-slice2`, tree clean, nothing
unpushed. No PR yet. Gate green at that SHA: typecheck · lint 3 pre-existing warnings · shared 75/75 ·
client 66/66 · server 4/4 · build · comment ratchet · canvas-isolation.

| SHA | What |
|---|---|
| `a50cb3f` | camera — `lookAhead` 7→14, `lookAtLift` 2→5; height 9 / back 11 / fov 60 untouched |
| `57589dc` | bloom — `radius`/`levels` added to `BloomConfig`, threaded to every call site |
| `b5c0823` | rail — `BOUNDARY_W`/`BOUNDARY_H` 0.5 → 1.0 |
| `a37059b` | ~3u placeholder box — `shipBox` layer key, lab-only |
| `4305a4d` | live tuning panel + ambient unification |

---

# YOUR NEXT TWO UNITS, IN ORDER

## 1. Land the camera values the owner dialled — ACCEPTED, commit them

He drove the panel and landed on these. **Accept the camera block ONLY.** He explicitly rejected the
other four lines the copy-values dump produced — they came back unchanged because the knobs do not
work (unit 2), not because he chose them. Do not commit them.

```
// game/camera/chase.ts — CHASE
height: 7.5,
back: 15,
lookAhead: 9.5,
lookAtLift: 6,
fov: 70,
```

Supervisor-verified arithmetic at these values: pitch **3.50°**, `shipBelowAxis` **23.06°** against a
**35°** half-FOV → **margin 11.9°**, improving to 15.5° as `back` stretches at speed. The committed
`a50cb3f` was −0.20°, i.e. off the bottom edge. The regression is closed.

**⚠ FLAG IT IN THE PR — `height` 9 → 7.5 crosses an ADR line.** `ADR-010` deferred the art package's
4–5u camera because "+9u [is] deliberately so the player can see over 8u pillars and plan a line", and
called a low camera "a gameplay change wearing art clothing" needing its own ADR, an `/art-lab`
prototype and a human feel-gate. 7.5u is not the 4.5u that was refused, **but it is below the 8u pillar
height**, so the camera eye now sits under a pillar top and pillars can occlude. The owner gated it
live so it stands — but it must be flown **with pillars and `fly` ON**, never judged parked, and the PR
body must say plainly that it lowers the camera below pillar height and why. Do not bury it in a diff.

## 2. The other knobs do not work — diagnose and fix

Owner's report, first-hand: changing bloom, `envMapIntensity` and ambient on the panel **affects
nothing**. Only the camera responds.

**Supervisor's hypothesis — treat as a lead, verify it, do not assume it.** The one knob that works is
the one that never touches React: `updateChaseCamera` reads the `CHASE` singleton every frame directly.
All four dead knobs go through the `useSyncExternalStore` subscribe path. One broken path explains all
four at once, which is likelier than four coincidental bugs. Candidates worth ruling in or out:
a `getSnapshot` returning a fresh object each call; the rAF-coalesced notify never firing or firing
before the store is written; a material whose `envMapIntensity` is set at construction and never
flagged `needsUpdate`; `SceneLighting` reading the `AMBIENT_INTENSITY` constant rather than the store;
`<TunedBloom>` receiving a config prop that shadows the store value.

**Prove the fix by observation, not by reading the code.** A knob that "should now work" is not fixed.
You need the tab for this one — the owner is done driving; take it, and say so when you do.

---

## THE STANDING CAVEAT — attach it to every sweep result

`/game` mounts **no authored lighting rig at all**. Its complete light list is one
`<ambientLight intensity={1}>`. `<Environment>` mounts `<color>` background, linear `<fog>`,
`<GradientDome>`, drei `<Stars>`, `<TubeWalls>` — all unlit or emissive-driven, **none of them a
light**. `DeepSpaceSky`/`SkyEnvironment`/`StarLight` are imported only by `deep-space-sky.tsx` and
`iso-sky/tunable-sky.tsx`; `TunableSky` mounts only in `/iso-sky` and `/art-lab`.

So a value dialled on `/art-lab` is judged against the **full authored rig** while `/game` runs
ambient-only. **A number that reads right in the lab is not proven right in the game.** Say so in
every result. Where a knob's judgement depends on which rig is mounted, flag it rather than picking a
number — **`envMapIntensity` is the clear case**: it scales the cubemap `/game` does not mount, so its
lab reading may be meaningless for the game.

**Owner ruling: do NOT mount the sky rig in `/game` on this branch.** It visibly changes the shipped
game, which makes it 03-lighting's subject, not track art's. `SKY_TUNING` is seeded from the frozen
`DEEP_SPACE` via `committed()`, so when 03-lighting takes it the values are already agreed — the work
is mounting, not tuning. Do not re-litigate; do not do it "while you're in there".

## Settled — do not re-litigate or revert

- **`FLOOR_METALNESS` stays 1.0.** The sweep refuted its own premise: deck-crop mean luma went
  89.7 → 100.5 as metalness fell 1.0 → 0.15, i.e. *lowering* it brightens the deck — grazing Fresnel
  stays pinned near 1.0 and dropping metalness only adds the diffuse term back.
- **Rail stays at 1.0u.** Standing owner decision. If a later pass wants it thinner, stop and ask.
- **No key light on the track, ever.** `03-lighting/README.md` §1a: "NOT a three-point rig"; the star
  "barely touches the track". Every fix here is subtractive.
- **The envmap is NOT the nebula jpg** — it is drei `<Environment frames={1} resolution={128}>` baking
  three `<Lightformer>`s in `sky-environment.tsx`. Question closed.
- **`SceneLighting` stays mounted in both canvases** at `AMBIENT_INTENSITY = 1`, so the lab matches the
  game exactly and the ambient sweep no longer needs a hosted room.

## What shipped in `4305a4d`

- `dev/debug-tuning.ts` — module singleton + `useSyncExternalStore`, notifies coalesced to one rAF.
  Seeds from `GRID_VOID.bloom`, `FLOOR_ENV_MAP_INTENSITY`, `AMBIENT_INTENSITY`, `CHASE`. Exports
  `shipBelowAxisDeg`/`pitchDeg` and `debugTuningSource` (the copy-values dump, labelled per file).
- `dev/debug-panel.tsx`, `dev/debug-slider.tsx`, `dev/tuned-bloom.tsx`.
- `game/scene/lighting.tsx` — new; `AMBIENT_INTENSITY = 1` + `<SceneLighting>`, in both canvases.
- `game/camera/chase.ts` — `CHASE` now exported; no camera value moved.
- `game/scene/track-materials.ts` — `FLOOR_ENV_MAP_INTENSITY = 1` added; `floorSurface()` untouched.
- `game/scene/track-floor.tsx` — material now takes `envMapIntensity`; DEV reads the panel, prod reads
  the constant.
- `routes/art-lab/ship-box.tsx` + `shipBox` layer key, default ON, unlit `#404040` so it sits under the
  0.42 bloom threshold and contaminates neither sweep.
- Both canvases render `<TunedBloom>` in place of an inline `<Bloom>`.

Dev gate is `import.meta.env.DEV` (Vite dead-code-eliminates it), verified: zero panel strings in
`apps/client/build`.

## Open and unmeasured

- **The panel's non-camera knobs are BROKEN** — see unit 2. That supersedes the earlier "panel shipped,
  ready to sweep" framing: nothing can be swept until they respond.
- The camera readout is **derived arithmetic, not a measurement of the rendered frame**. It agreed with
  the owner's eye at the dialled values, which is weak corroboration, not verification.
- Untested by eye: panel layout at the lab's window size; whether the `radius`/`levels` key-remount
  flashes.
- The bloom spread at `57589dc` (`levels 4` / `radius 0.6`) is **still never captured or judged**.

## Gotchas already paid for

- Stack: `PORT=2601 pnpm dev`, client `:5201`, `/art-lab`. **Check whether one is already up before
  starting another.** You own your stack — background it to a log, don't stream it into context.
- **Frame-tap is dead** — "nobody answered", focused and unfocused. Use Chrome screenshots; don't debug it.
- **Backdrop takes 30–45s after every reload.** Before it lands the deck renders dark and the sky black —
  a loading state, not your change.
- **HMR does not rebuild an already-mounted material.** Every sweep frame needs a full reload.
- The tab must be the **focused** Chrome window or `visibilityState` goes hidden, rAF stops, canvas black.
  Chrome tabs are per-session — make your own; you cannot adopt a predecessor's.
- Blank Canvas: stale Vite cache (`rm -rf apps/client/node_modules/.vite`, restart) or unsmudged LFS
  models (`git lfs pull`).
