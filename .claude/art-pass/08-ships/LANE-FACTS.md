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
- Added `shipId` React state in `art-lab-shell.tsx` → prop to `art-lab-controls.tsx` (a button row over `SHIP_ORDER`, same shape as the existing env row) and to `art-lab-canvas.tsx` → `art-lab-rig.tsx`.
- `shipId` added to the rig's spawn-effect deps, so changing ship destroys and respawns the lab entity (it restarts at the lead-in). Structural, matching how `seed` already rebuilds the track.
- Canvas-isolation lint still passes: the state lives in the shell, not a route entry module.

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

## Eye-check

- [pending — see below]
