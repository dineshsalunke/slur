# Camera knobs, and why the deck behind the ship was black

Branch `feat/test-level`. Continues `2026-09-22-tuning-panel-and-punch.md`. Owner's complaint at the
top of the session: *"i still feel the lighting is a bit of an issue specially the area behind the
ship."*

## The diagnosis

The near-camera deck had **no light source in it**, and the cause was not a material setting.

Only two things light the deck:

- **Rail emitters.** `track-floor.tsx:206` feeds `feedEmitters` from `buildRailRuns` only. `rg` over
  `apps/client/app` finds exactly one `writeEmitter` call site — **rails, nothing else**. At
  `emitter.decay 2` / `intensity 10` three.js attenuation is 1/d², so ~30u off a rail is
  `10/900 ≈ 0.011`. Dead two lanes in.
- **The gradient IBL** at `ibl.intensity 2`. Near-camera the deck is viewed steeply, so Fresnel is at
  its weakest, and `deck.metalness 0.9` removes the diffuse floor that would otherwise hold a value.
  Measured result: ~`#0d0f10`.

### Live A/B, sim frozen with `P` so the frames shared a camera

| Change | Result |
|---|---|
| `deck.metalness` 0.9 → 0.5 | near deck unchanged — **not the lever** |
| `ibl.intensity` 2 → 12 | kills the black but washes the frame; monoliths go pale grey |
| `emitter.decay` 2 → 1 | warmth rolls inboard from both rails, closer to the reference |
| `ibl 4` · `decay 1.15` · `emitter 14` | best dial-only result I found |

### What the owner did instead, and why it is better

**The owner did not take those lighting numbers.** They pulled the camera back instead —
`cam.back` 7.3 → 12 with `cam.lookAhead` 9.5 → 14 — and lifted `ibl.intensity` 2 → 3.

That is the better fix. At `back 7.3` the deck immediately behind the ship was the steepest-incidence
part of the frame, so it had the weakest Fresnel and fell to black. At 12u the same region sits at a
shallower angle and picks the sheen back up with no extra light. Do not reach for `ibl`/`emitter`
first for a "too dark near the camera" complaint — check the camera's incidence angle on the deck.

## Reading of `docs/art-direction/golden-reference/cruise-lighting.png`

Adds to the reading in `2026-09-22-lighting-rebuild.md`. Two things the reference has in the near
deck that we do not, and **no dial reproduces either** — both are content:

1. **Amber seams running down the deck inboard of the rails**, not just the two boundary rails. They
   carry marigold across the full track width to the bottom edge of the frame. Our floor has only
   `isOuterEdge` rails; every other plate joint is dark.
2. **The ship's exhaust and the pickup reflecting in the deck** — a warm pool under the tail and a
   long streak toward camera. three.js has no SSR and an emissive material lights nothing, so this
   can only come from an analytic light.

**The cheap fix for (2) already has its mechanism:** `emitter-array.ts` is a general 12-slot line-light
array. Feeding the local player's engine position as one slot — a second `writeEmitter` in
`feedEmitters`, marigold, short range — puts a warm pool exactly where the owner said it was dark.
Not done.

## Shipped this session — camera knobs

Owner asked for debug control of the chase rig. Three edits, `pnpm typecheck` + `pnpm lint` green.

| File | Change |
|---|---|
| `dev/tunables.ts` | new `Camera` group, 8 rows: `cam.back` · `backStretch` · `height` · `lookAhead` · `lookAtLift` · `fov` · `fovStretch` · `follow` |
| `game/camera/chase.ts` | **`export const CHASE` deleted.** `updateChaseCamera` reads `num( 'cam.*' )`. `NUMBER_SPECS` is now the only source, per the panel handover's rule against a parallel constant. `CHASE` had no callers outside its own file. |
| `routes/test-level/local-loop.tsx` | the freeze guard was `if ( simFreeze.on ) return;` **above** `updateChaseCamera`, so camera knobs did nothing while frozen. It now wraps only the sim — camera keeps tracking a frozen ship, which is the point of a frozen A/B. |

Precedent for `game/` importing `dev/tunables`: seven scene modules already do
(`track-floor`, `scene-bloom`, `track-texture`, `gradient-ibl`, `track-materials`, `monolith-group`,
`track-rail`).

Verified live: `back` 7.3→24, `height` 4.7→10, `fov` 70→55 all move the camera **while frozen**.

## Owner's dialled values — NOT yet landed in `NUMBER_SPECS`

Read from `localStorage` at handover; the live store and storage agreed (no drift). Deltas from spec
default only:

```
perf.dpr          1      (spec 2)   ← see flag below
cam.back          12     (7.3)
cam.lookAhead     14     (9.5)
cam.height        5      (4.7)
cam.lookAtLift    1      (1.35)
cam.follow        20     (16)
cam.backStretch   0      (1.5)
cam.fovStretch    0      (15)
cam.fov           70     (unchanged)
ibl.intensity     3      (2)
groove.metalness  1      (0.95)
groove.roughness  1      (0.95)
groove.cavity     0.3    (0.25)
ibl.zenith        #52575b  (#26292c)
ibl.horizon       #2f3337  (#303439)
ibl.nadir         #34373c  (#1e2023)
```

Everything else sits at spec default, **including `emitter.intensity 10` / `decay 2`**.

Zeroing both speed-stretches means the framing the owner judged is the framing at every speed — a
stable target to tune against, and worth keeping while the look is being settled.

**Owner was asked whether to land these into `NUMBER_SPECS` / `COLOR_SPECS` and had not answered at
handover.** Nothing is committed.

## Flags

- **`perf.dpr 1` is a real sharpness cut.** The panel handover reverted exactly that after concluding
  perf was a non-issue; this session read **120 fps · cpu 1.2 ms** in a foreground window, which
  confirms it again. Check with the owner whether the 1 was chosen or left over from a reset.
- **A `Rail` group (6 rows) in the panel is not from this session** — concurrent work via
  `game/scene/track-rail.tsx`. At spec defaults.
- **The extension tab and the owner's own window share `localStorage`.** Writes from either side
  overwrite the other. Twice this session values moved under me. Read `localStorage` rather than
  trusting my tab's in-memory store, and say before writing to it.
- **`reset` is not an undo.** `tunables.ts` `resetTunables()` restores every key to spec default,
  including the owner's IBL colours. The owner lost their set to it once.
- Driving the panel from `window.slur.setNum` is equivalent to a slider — same module singleton. It
  is only used here because dragging a range input through the extension means guessing coordinates.

## Still open — carried forward unchanged

- Ship-exhaust emitter slot (above).
- Inboard amber deck seams (above).
- **Rail top face far wider than the reference's cord.** `BOUNDARY_W = 1.0u` against ~0.2–0.3u in
  `cruise-lighting.png`. Geometry, not a dial — `BOUNDARY_W` also feeds collision.
- `ART_MATERIALS.md` §7 decisions-and-departures entries, now eight with the camera rig moving into
  the panel.
- Panel is `/test-level` only.
- Still stripped from `2026-09-22-lighting-rebuild.md`: **fog** (`game-environment.tsx`) and the
  **sim freeze on `P`** (`dev/sim-freeze.ts`) — both revert before merge.
- Nothing committed. The tree also holds gap-teeth/rim and rail-material work from a parallel agent —
  stage by path.
