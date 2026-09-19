# `chore/comment-sweep` — LANE FACTS

Raw facts, written as the work happens. One line each.

## Baseline

- Measured across all 129 files in `FILES.txt` before any edit: **2,419 comment lines / 10,188 lines = 23.7%**.
- Supervisor's repo-wide baseline (`apps/` + `packages/`) was 2,555 / 10,987 = 23%, so my set is representative.
- Per-area starting counts, by absolute comment lines: `game/scene` 447/1724 · `shared/src/sim` 250/1088 ·
  `audio` 196/867 · `shared/src` 195/647 · `game/overlays` 155/710 · `apps/client` top level 147/447 ·
  `iso-lab` 135/611 · `game/` 109/349 · `routes/art-gallery` 102/526 · `routes/iso-sky` 88/611 · `net` 83/357 ·
  `dev` 79/230 · `server/rooms` 71/393 · `game/ecs` 53/202 · `ui` 52/170 · `shared/combat` 47/137 ·
  `routes/home` 40/223 · `game/net` 32/142 · `shared/race` 28/100 · `routes/iso-monolith` 18/53 ·
  `game/camera` 17/125 · `lobby` 16/109 · `routes/env-lab` 15/119 · `app/` 14/77 · `server/src` 11/45 ·
  `routes` 7/60 · `game/input` 6/41 · `routes/game` 6/35.

## Area 1 — `apps/client/app/game/scene` (20 files)

**447 → 259 comment lines (26% → 17% of the area's lines).** Gate green: typecheck, lint (3 pre-existing
`noExcessiveLinesPerFile` warnings + the Canvas-isolation line), 75 shared tests, 61 client + server tests, build.

Per file, before → after:

| file | before | after |
|---|---|---|
| `sky-config.ts` | 115 | 57 |
| `ship-model.tsx` | 40 | 28 |
| `sky-backdrop.tsx` | 39 | 24 |
| `gltf-lfs-guard.ts` | 37 | 12 |
| `env-config.ts` | 28 | 19 |
| `projectile-field.tsx` | 26 | 14 |
| `pickup-field.tsx` | 26 | 15 |
| `deep-space-sky.tsx` | 26 | 14 |
| `sky-environment.tsx` | 22 | 17 |
| `explosions.tsx` | 19 | 15 |
| `hit-spark.tsx` | 16 | 12 |
| `star-light.tsx` | 12 | 10 |
| `gradient-dome.tsx` | 9 | 7 |
| `ship-visuals.ts` | 8 | 6 |
| `environment.tsx` | 5 | 2 |
| `hit-events.ts` | 5 | 4 |
| `ship-view.tsx` | 4 | 3 |
| `sky-follow.tsx` | 4 | 2 |
| `finish-gate.tsx` | 3 | 2 |
| `ship.tsx` | 3 | 2 |

### `useEffect` justifications — tightened, never removed

Three Effects in this area, all three kept a justification:

- `gradient-dome.tsx:29` — 4 lines → 2. Brackets a GPU texture `new`'d in `useMemo` that R3F does not own.
- `projectile-field.tsx:56` — 4 lines → 2. Same shape, for `boltGeo` attached via `<primitive object>`.
- `pickup-field.tsx:59` — 9 lines → 3. Subscribes to the `pickupTaken` MapSchema. The 9-line version was the
  numbered "five mechanisms weighed" form; the surviving lines keep what matters — the map mutates over the
  wire and fires no re-render, and cleanup detaches callbacks only, never the room.

**No uncommented `useEffect` found in this area.**

### Kept under doubt — review these

- `sky-config.ts:112` (`starBearingDeg`) — I cut a 17-line Kasa-fit derivation (threshold the jpg at luma ≥ 210,
  circle-fit the planet limb, polar-sweep to the terminator at 169°) down to the conclusion: measured from the
  terminator, star at 79° screen-azimuth, mapping to bearing 66°/elevation 19°. **The full method is not
  recorded anywhere else** — `01-background/CHEAP-PATH-BRIEF.md` has the decision (display and light are
  separate sources; the Lightformer must match the image's implied direction) but not the measurement. If a
  second sky image is ever authored, that procedure is how its bearing gets derived. Worth moving into the
  background brief rather than losing; not my file to edit.
- `sky-config.ts:139` (`fovDeg`) — kept 3 lines, one over the bound. 120 is an owner framing decision against a
  computed 134.3°, and the third line records why widening the star field is not an alternative (drei `<Stars>`
  lights 0.008% of its pixels, so the margin reads flat black, not starfield). Two rejected alternatives on one
  field; I judged the second worth its line. Cut it if you disagree.
- `sky-backdrop.tsx:44` — the negative `phiLength` note. Kept at 3 lines because it is the only record of why
  the material is `DoubleSide`, and winding has silently inverted faces in this repo before.
- `env-config.ts` per-field trailing comments (`StarConfig`, `FogConfig`, `WallConfig`) — left entirely intact.
  This file is a tuning surface in the same sense `constants.ts` is, even though the brief only names
  `constants.ts`. Same call made for the `DISSOLVE_*` constants in `ship-model.tsx:27-30` and the
  `MAX`/`SPEED`/`DRAG`/`GRAV`/`BRIGHT` blocks in `explosions.tsx` and `hit-spark.tsx`.

### Restored after supervisor review of `e95e3a2` (three over-cuts, all mine)

- `sky-config.ts:1` — the **palette exclusion** ("cold, desaturated, low-contrast, dark; the warm ramp
  #FFE0A0 / #FFB52E / #F59A24 belongs to the PLAYABLE layer and never appears up here"). I cut it believing
  `starLight.color` carried it. It does not: that line governs the *light's* colour, not a rule about what may
  enter the file, and it has no hex triple. Nothing lets the next agent infer marigold is forbidden up here.
- `sky-config.ts:3` — the **`art/procedural-bg` branch pointer**. I read it as history. It is a live external
  constraint: that branch is deliberately kept while other stale art branches are slated for deletion, and
  this comment is the only thing in the tree saying why. Restored with "do not prune it" made explicit.
- `sky-config.ts` `fovDeg` — **"70 was rejected, it cannot reach the frame edge in ANY condition"**, carried
  in one clause. A rejected alternative is the canonical keeper; only its five-line form was the problem.

**Lesson for the remaining areas:** a rule about what may NOT enter a file reads like prose and dies in a
sweep, because there is no code under it to check it against. Treat "never do X here" as a keeper on sight.

### Stale comments corrected (comment-only; no code changed)

- `ship-model.tsx:186` — said the beacon keeps `local=cyan vs remote=magenta` legible. The code washes the
  beacon in the **owner's team colour**, and a sibling comment in the same file said magenta had been retired
  from the palette. Rewritten to describe the team-colour beacon; the pointLight-perf reason kept.
- `explosions.tsx:27` — `CYAN` was annotated "matches ship.tsx beacon". Two errors: the beacon is in
  `ship-model.tsx`, not `ship.tsx`, and it no longer uses this constant. Trimmed to "local ship tint".
- `sky-follow.tsx:5` — named its children as "the gradient dome + the drei star field"; it now carries the
  backdrop patch. Rewritten without the enumeration so it cannot rot the same way again.

### Forward references deleted

- `explosions.tsx:11` — "This is the quick playtest-legibility pass; the full TRON derezz is S6." The derezz
  has since shipped, in `ship-model.tsx` in the same directory.
- `env-config.ts:70-74` — a `── The three variants ──` section header restating the `name:` field of each of
  the three objects immediately below it.

### Findings outside my set — routed, not edited

- `packages/shared/src/sim/track.ts:27` — "gaps stay full-width (positional = Slice 2)" is a forward reference.
  That file is mine (`shared/src/sim` area) and it will be swept there; noting it here so it is not lost.
- Nothing noticed in the 18 excluded `art/track` files this pass. I did not open them.

### Observations

- Density is a bad target in this area and the table shows why: `gltf-lfs-guard.ts` fell 37 → 12 because it was
  a 30-line mechanism enumeration on a 44-line module, while `ship-model.tsx` only fell 40 → 28 because most of
  its comments are shader and uniform-binding footguns that the code genuinely cannot say (the empty dep list
  on `uniforms`, the `needsUpdate` recompile, the post-tonemap add that survives into bloom).
- The "callback ref at mount, not `useFrame`, or the pool flashes identity-matrix instances at the origin for
  one frame" note appears in four files. Kept in all four — it is the reason the code is shaped that way — but
  reduced to two lines each, and `hit-spark.tsx` now just defers to `ExplosionField` rather than restating it.
- `env-config.ts:19` claimed the star props were "verified against drei 10.7.8 Stars.d.ts". Dropped the
  version: the `.d.ts` is the authority, and a pinned version inside a comment rots without anyone noticing.
