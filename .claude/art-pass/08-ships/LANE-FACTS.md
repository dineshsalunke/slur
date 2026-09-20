# LANE-FACTS — split-crown (issue #159)

Raw first-hand facts only. One line each. `[unmeasured]` is a legitimate entry.

## Lane

- worktree `/Users/apple/Projects/personal/slur-worktrees/split-crown`, branch `art/split-crown`, base `origin/dev` @ `cf1c98c` (`git rev-parse` + `git log -1`, 2026-09-20).
- ports: `CLIENT_PORT=5200`, `VITE_SERVER_PORT=2600` in `apps/client/.env`; stack started `PORT=2600 pnpm dev`, both 5200 and 2600 free beforehand (`lsof -nP -iTCP:<p> -sTCP:LISTEN` empty).
- stack up: client `http://localhost:5200/`, server `ws://192.168.43.61:2600`; `curl -sI http://localhost:5200/art-lab` → `HTTP/1.1 200`.
- stale-Vite-cache trap did NOT fire; `rm -rf apps/client/node_modules/.vite` never needed.

## The asset — measured from the GLB binary in this worktree

`apps/client/public/models/ships/split-crown.glb`, 257,784 bytes. Parsed by reading the GLB JSON chunk
directly (node, no three.js) and taking accessor `POSITION` min/max per primitive.

- bbox min `(-1.2500, -0.0000, -3.0000)`, max `(1.2500, 1.0025, 3.0000)` → size **2.5000 × 1.0025 × 6.0000**.
- 7 nodes (`SLUR_Split_Crown_v1` + one per material), **every transform identity** — no `translation`, `rotation`, `scale` or `matrix` key on any node.
- Freighter class footprint `halfW 1.25` / `halfL 3.0` = 2.5 × 6.0 → **scale 1.0, lift 0** by the `ship-visuals.ts` derivation, exact on both axes.
- 6 materials: `Charcoal_coating`, `Recess_interior`, `Armor_panels`, `Marigold_emission`, `Recess_bezels`, `Engine_core`. 0 embedded images.
- emissiveFactor `Marigold_emission` = `[0.9131, 0.3231, 0.0176]`; `Engine_core` = `[1, 0.4621, 0.0273]`.
- baseColorFactor `Engine_core` = `[1, 0.6654, 0.2582, 1]`; the three dark families are all ~0.002–0.017 linear.

### Facing — settled by measurement, not by the README

Per-material Z extents (object space, identity transforms, so these are model coordinates):

| material | z range | mean primitive-centroid Z |
|---|---|---|
| Charcoal_coating | −3.000 … 3.000 | 0.0000 |
| Recess_interior | −2.924 … 2.983 | 0.0295 |
| Armor_panels | −2.910 … 2.910 | 0.0000 |
| Marigold_emission | −1.490 … 2.991 | 0.7505 |
| Recess_bezels | −2.928 … 2.997 | 0.0345 |
| **Engine_core** | **2.991 … 2.999** | **2.9950** |

- `Engine_core` occupies an 8mm-deep slab at z ≈ +2.995, i.e. **flush against the +Z end of the hull** → the stern is +Z, the nose is **−Z**. Codex's README ("four stern emitters in a 2×2 arrangement") is confirmed.
- The rig's convention is +Z-forward at `facing: [0,0,0]` (the four Quaternius placeholders), so split-crown takes **`facing: [0, Math.PI, 0]`**.
- Eye-check of the rotated result: see "Eye-check" below.

## The LFS guard — already correct, NO fix was needed

- `gltf-lfs-guard.ts:28-36` `isLfsPointer` already branches on `typeof data === 'string'` vs `ArrayBuffer`, and for the ArrayBuffer path compares the first 23 bytes against `'version https://git-lfs'` via `Uint8Array` + `charCodeAt`. A `.glb` is not a new path for it.
- `gltf-lfs-guard.test.ts:51` already asserts a pointer-as-bytes trips it; `:57` already asserts `bytes('glTF')` — the `.glb` magic — passes through.
- The brief's predicted two-line decode fix is therefore **not applicable**; no change made to either file.

## Naming surface — every `imperial` occurrence, and what happened to it

- `packages/shared/src/ship-classes.ts` — `ShipId` union, `SHIPS` row, `SHIP_ORDER` last entry, the `halfW: 1.25` feel-gate comment → renamed; the 2026-08-09 feel-gate fact kept verbatim.
- `packages/shared/src/ship-classes.test.ts` — 3 occurrences (one stun-table key, two `stunDurationForShip` calls) → renamed.
- `apps/client/app/game/scene/ship-visuals.ts` — key + url → renamed.
- `CREDITS.md` — the fleet row said all 5 glTF ships are Quaternius CC0. **Now false.** Row narrowed to the 4 placeholders and the prose says split-crown is bespoke.
- `docs/GDD.md:239` and `docs/ART_SCALE_REFERENCE.md:107` — the Freighter row's Model column → renamed. Numbers untouched.
- `CLAUDE.md:248` and `.claude/backlog.md` / `.claude/phases/2026-08-09-*` — **left alone**: historical status log, not a live reference.
- No migration written. `localStorage` holds only call-sign + audio prefs (`grep` — no `shipId` key); server `isShipId()` rejects an unknown id, `shipOf()` falls back to `DEFAULT_SHIP`.

## The team wash — removed, per the owner's "everything is marigold for now"

- `tintHull()` + `HULL_TINT_INTENSITY 0.55` deleted from `ship-model.tsx`; it did `std.emissive.set(color)` on **every** `MeshStandardMaterial` in the clone, which overwrote `Marigold_emission` and `Engine_core`.
- The team beacon (`<mesh position={[0,1,0]}>`, `sphereGeometry r=0.22`) deleted with it. Its y=1 sat inside this hull's 1.0025u roofline.
- `uEdgeColor` (derezz burn edge) now seeded once to `MARIGOLD_EMISSIVE` = `#F59A24` (`track-materials.ts:54`) in the `useMemo`, so the uniform object identity the shader binds by reference is unchanged.
- `color` prop dropped from `ShipModel` and from `ShipView`'s call; `colorHex` import dropped from `ship-view.tsx` (still used by 3 overlays).
- This affects all five ships, by the owner's decision.

## Art-lab ship picker — added, because the gate was otherwise unreachable

- `art-lab-rig.tsx` hardcoded `shipId: DEFAULT_SHIP` ('challenger'), and `/art-lab` has no room, so there was **no way to put the Freighter on screen at the review URL**.
- FIRST ATTEMPT, reverted: `shipId` as React state in the shell, prop-drilled shell → controls → canvas → rig, with `shipId` in the rig's spawn-effect deps. It worked, but every pick re-rendered the whole Canvas subtree — which `lab-state.ts:12-13` explicitly forbids for control knobs.
- SHIPPED: `labCommands.setShip` (a drained one-shot, exactly like `jumpToZ`), written by the controls button and drained in the rig's `useFrame`, which calls `entity.set( Net, … )`. `ShipView` subscribes to `Net` via `useTrait`, so ONE leaf re-renders and the scene graph is untouched. Zero props added to shell/canvas.
- `entity.set( trait, value )` verified in koota 0.6.6's own typings, `dist/types-DONaXEhM.d.ts:455`.
- The rig holds the entity in a `useRef`; the spawn effect still owns create-on-mount / destroy-on-unmount.

## A PRE-EXISTING CRASH, found and fixed: any Canvas re-render killed /art-lab under bloom

Not caused by this slice — it fires on the untouched `env` A/B/C buttons and the untouched `ships` layer
toggle. Found because the ship picker's first (prop-based) shape tripped it.

- Symptom: React Router error page, `TypeError: Converting circular structure to JSON … property 'parent' closes the circle`, thrown from `@react-three/postprocessing`, preceded by ~24 `THREE.Texture: Unable to serialize Texture` warnings.
- Cause, read from the installed source (`@react-three/postprocessing@3.0.4`, `dist/index.js`, the generic effect factory): each effect component does `useMemo( () => […args], [ JSON.stringify( a ) ] )` where `a` is its **rest props**. React 19 passes `ref` as an ordinary prop, so `dev-bloom.tsx`'s `ref={ effect }` lands in `a`; once mounted, `effect.current` is the live `BloomEffect` carrying R3F's circular `__r3f` — and the next render of that element throws.
- Isolation evidence, in-page, all four readings first-hand:
  - bloom ON + env A → CRASH; bloom ON + `ships` toggle → CRASH.
  - bloom OFF (EffectComposer unmounted) + env A/B/C + `ships` + `Split Crown` → all ok.
  - `ref` temporarily deleted from `<Bloom>`, bloom ON + env A/B/C → all ok. **This is the decisive one.**
  - after the fix, bloom ON + env A/B/C + `ships` + `Split Crown` + `blocks` + `env` → all ok.
- Fix: build the `<Bloom>` element ONCE via lazy `useState( () => <Bloom …/> )`, so React never re-renders it and the stringify never runs again. The `ref` is kept. Nothing is lost: `DevBloom`'s priority-0 `useFrame` overwrites all five values from `DEBUG_TUNING` every frame, so the constructor props only ever seeded frame 0. `useState` lazy-init rather than `useMemo` because it needs no dep array and no `biome-ignore`, and it is the idiom postprocessing itself uses for create-once objects.
- **Blast radius: `TunedBloom` is used by `/art-lab`, `/art-gallery` and `/env-lab`, so all three DEV labs had this.** Worth its own issue in the supervisor's judgement; fixed here because it blocked this lane's gate outright.

## Gate results — all five, 2026-09-20

- `pnpm typecheck` → Done (shared, server, client).
- `pnpm lint` → clean. 3 pre-existing warnings (incl. `packages/shared/src/sim/track.ts` 364 lines > 300); canvas-isolation ✓ 8 route entries; comment ratchet ✓ 9 changed files, none gained.
- `pnpm --filter @slur/shared test` → **78 pass, 0 fail**.
- `pnpm -r test` → client 74 pass (11 files), server 4 pass.
- `pnpm build` → Done, SPA generated.

## What I tried that failed

- First pass of `ship-visuals.ts` comments went 6 → 8 lines and **the comment ratchet rejected the lint**, twice. Fixed by folding the two-line derivation formula into one line and the two-line asset note into one; final count back at 6.
- `pnpm lint` also failed once on formatting (biome wanted `<ArtLabCanvas>` broken across lines once it gained a 5th prop); `pnpm format` fixed it.
- `grep --include=*.ts` fails under fish without quoting the glob — cost two wasted calls.

## Eye-check — PASSED, `/art-lab` chase camera, seed 1234, env C, bloom ON

- The Split Crown renders nose-forward. From the chase camera you see the **four stern emitters in their 2×2 arrangement** glowing marigold at the end nearest the camera, and the **two forward crown ports** as L-shaped marigold glints further up the hull — which is Codex's README description, seen from behind. The measured `facing: [0, Math.PI, 0]` is correct.
- Authored marigold and engine emission are intact and are the only chromatic thing on the hull. No team wash, no beacon, nothing tinted by `colorId`.
- Footprint is WYSIWYG: with the `shipBox` debug AABB on, the box silhouette's left/right edges coincide with the hull's widest points. (The debug box is opaque and fully occludes the ship, so the two cannot be judged in one frame — toggle, do not overlay.)
- Hull albedo reads mid-grey on screen rather than the near-black the baseColorFactors (0.007–0.017 linear) would suggest on their own — that is the cold key plus the rail emitters lighting it. Whether that is the intended read is an art call for the owner, NOT changed here.
- The review tab is parked on this exact view (ships on, shipBox off, env C, Split Crown selected).

## Stack traps hit

- The MCP Chrome tab reported `document.visibilityState === "hidden"` for most of the session while the canvas measured 3456×1994 and R3F was fully mounted — the canvas paints black and rAF never runs. It flipped to `"visible"` on its own later. Canvas SIZE is not the test; read `visibilityState`.
- Closing the other tab in the MCP group destroyed the whole tab group (Chrome auto-removes a group at its last tab), invalidating the tab id. Re-created it and carried on.
- `git checkout <sha> -- <paths>` was refused by the permission classifier, so the "is it pre-existing" question was settled in-page (the bloom-off / ref-removed A/B above) instead of against the base commit.

## Seating — origin-to-keel measured across all five ships (owner reported "half sunk")

World-space bbox per ship, composing every node matrix (not just accessor min/max), then applying the
SHIPPED `scale`/`lift` from `ship-visuals.ts`. `keelAfterLift` = `nativeMinY × scale + lift`.

| ship | nativeMinY | nativeMaxY | scale | shipped lift | derived lift (−minY·s) | keelAfterLift | topAfterLift |
|---|---:|---:|---:|---:|---:|---:|---:|
| executioner | −0.7748 | 1.0724 | 0.1996 | 0.154 | 0.1546 | **−0.0006** | 0.3681 |
| challenger | −0.8215 | 2.2006 | 0.2476 | 0.203 | 0.2034 | **−0.0004** | 0.7479 |
| bob | −0.8742 | 1.1611 | 0.2095 | 0.182 | 0.1831 | **−0.0011** | 0.4253 |
| dispatcher | −1.4219 | 1.6644 | 0.4898 | 0.696 | 0.6965 | **−0.0005** | 1.5112 |
| split-crown | −0.0000 | 1.0025 | 1.0 | 0 | 0.0000 | **−0.0000** | 1.0025 |

**The convention in force is "keel at the render group's origin", and all five satisfy it** — the four
placeholders land within 0.0011u of zero, split-crown lands exactly on it. The placeholders' origins are
NOT centred; their `lift` is what keels them, and it matches the derived value in every case.

`syncRenderSystem` (`apps/client/app/game/ecs/systems.ts:24`) writes `grp.position.y = s.y` directly, and
`ShipModel` places the clone at `[0, v.lift, 0]` inside that group. So a grounded ship's keel is at world
`y = s.y = 0`, for every hull.

### Which of (a)/(b)/(c) — and the honest answer

- **(a) node-local vs scene-graph bbox — RULED OUT.** The walker above composes every node's TRS and
  transforms all 8 corners of each primitive; split-crown's 7 nodes are all identity, so the two agree.
- **(b) renderer places the CENTRE at a hover height — RULED OUT.** It places the keel at the group
  origin, and the other four only sit right BECAUSE their lift keels them. Nothing is centred.
- **(c) the deck's top surface is not at the Y the rig assumes — NOT RULED OUT, and [unmeasured].** I did
  not get a first-hand reading of the deck's top world-Y before hitting the context seam.

**So no compensating translate is warranted by anything I can measure, and I have not added one.** By the
convention the other four ships satisfy, split-crown is seated correctly to 0.0000u.

**Most likely explanation, and I hit it myself this session:** the `shipBox` debug AABB is an OPAQUE grey
volume that completely occludes the hull, and from the chase camera it reads exactly like a flat slab
half-buried in the deck. I mistook it for the ship earlier in this session before toggling it off. If the
owner's frame had `shipBox` lit, that is what they saw. The parked tab has it OFF.

**If it is genuinely sunk with `shipBox` off, the next measurement is the deck's top world-Y versus a
grounded ship's `s.y`** — and if the deck top is above 0, that is a rig/deck fact affecting ALL five
ships, not a Split Crown asset fault, and not something to fix by nudging one ship's lift.

## Seating — the visual check, 2026-09-20 (frame tap; no Chrome extension available this session)

- `mcp__claude-in-chrome` was UNUSABLE: `tabs_context_mcp` → "Browser extension is not connected", `list_connected_browsers` → `[]`. Not tab contention — zero extension instances on the relay.
- Fell back to the frame tap. `curl localhost:5200/__frame-tap?name=split-crown-seating` → 200, wrote `.claude/art-pass/00-frame-tap/refs/split-crown-seating.png` (3456×1994) — so a page WAS mounted visible.
- **Frame A (shipped `lift: 0`, shipBox OFF, chase camera): the hull does NOT read as sunk.** The full 1.0025u hull height is visible; the stern face and its 2×2 emitter block read down to the deck line; the two forward L-ports glint. Nothing is buried.
- **Zero visual separation at the contact** — the flat underside meets the deck with no gap, no contact shadow and no parallax. Coplanar exactly as predicted, but it reads as "pressed flat", not "half sunk".
- **No depth fighting in this frame** — no tear line along the underside, no deck drawing across the hull. Static frame only; a moving camera was not available, so flicker is NOT ruled out.
- Hull reads near-white/light-grey, brighter than the mid-grey previously noted and far from the near-black the 0.007–0.017 linear baseColorFactors suggest. The known open art call, unchanged.

### What could NOT be measured, and why

- **The lift A/B did not produce a frame.** Probe edit `lift: 0 → 0.5` in `ship-visuals.ts:20` (uncommitted); every tap after it returned 504, and the tap stayed 504 after the edit was reverted. The probe is fully reverted, `git status` and `git diff` clean. The live page was lost at the HMR update and could not be remounted without extension control. `[unmeasured]`
- **Placeholder-hull contrast: `[unmeasured]`.** Switching ships needs a click on the art-lab picker (`labCommands.setShip`); there is no non-Chrome route to drive it.

## Seating — the lift A/B, with the extension live, 2026-09-20

Extension reconnected mid-session (`list_connected_browsers` → `Browser 1`, local). Own tab, `/art-lab`, seed 1234, env C, bloom ON, chase camera, `ships` ON, `shipBox` OFF throughout.

- **The tab came up `visibilityState: "hidden"` with `document.querySelector('canvas') === null`** — R3F had not mounted at all. It flipped to `"visible"` on its own ~9s later and the canvas mounted 3456×1882. Canvas ABSENCE, not just size, is the tell for a never-visible tab.
- **`shipBox` was ON by default in a fresh lab, and `ships` was OFF** — so the opaque grey AABB slab was the ONLY thing drawn where the ship should be. That is almost certainly the frame behind the original "half sunk" report.
- **A (shipped `lift: 0`): hull rests with its bottom edge exactly on the deck line.** Full hull height visible, nothing buried. Zero separation — no gap, no contact shadow, no parallax.
- **B (probe `lift: 0.5`, uncommitted): the hull visibly detaches and the "pressed into the deck" read disappears.** It reads as hovering — at 0.5u on a 1.0025u hull, arguably too much.
- **A' (after revert): identical to A.** So the change in B is the lift, not drift. Probe fully reverted, `git status` and `git diff` clean.
- **No depth fighting, at any of four z positions** (`start`/`build`/`chorus` waypoints, z 0 -> 3600): no tear line, no flicker, no deck drawing across the hull. Consistent with the coplanar faces never competing — the deck top faces up, the hull underside faces down, so only one is ever front-facing.
- **Placeholder contrast (Challenger, Dispatcher): they read as RESTING ON the deck.** Both show a dark under-body/gear band at the contact that separates hull from deck. The Split Crown has no such band — its flat, brightly-lit underside edge meets the deck directly. That difference, not depth, is the read.
- **Albedo, side by side: the Split Crown is dramatically brighter than every placeholder** — near-white against their dark navy/gold. Unresolved open art call, NOT changed.
- Keyboard input did not drive the sim (`w` x50 left speed at 0.0 u/s); the `jump to` waypoints were used instead. Continuous-motion flicker therefore remains `[unmeasured]`.
- Tab parked: Split Crown, grounded, z 3600, `shipBox` OFF, `ships` ON.
