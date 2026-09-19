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
  terminator, star at 79° screen-azimuth, mapping to bearing 66°/elevation 19°. **RESOLVED — not outstanding.**
  The supervisor owns this and is writing the method into `01-background/CHEAP-PATH-BRIEF.md` directly.
  Recorded here only so a later reader knows the file's conclusion has a derivation living in that doc.
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
  **Ruled on and upheld** — see ruling 2 below. This is now the standing rule, not a judgement call.

### Restored after supervisor review of `e95e3a2` (three over-cuts, all mine)

- `sky-config.ts:1` — the **palette exclusion** ("cold, desaturated, low-contrast, dark; the warm ramp
  #FFE0A0 / #FFB52E / #F59A24 belongs to the PLAYABLE layer and never appears up here"). I cut it believing
  `starLight.color` carried it. It does not: that line governs the *light's* colour, not a rule about what may
  enter the file, and it has no hex triple. Nothing lets the next agent infer marigold is forbidden up here.
- `sky-config.ts:3` — the **`art/procedural-bg` branch pointer**. I read it as history. It is a live external
  constraint: that branch is deliberately kept while other stale art branches are slated for deletion, and
  this comment is the only thing in the tree saying why. Restored with "do not prune it" made explicit.
- `sky-config.ts` `fovDeg` — the 70 rejection was restored, then **reverted back out**. It now stands at two
  lines: the accepted margin and the `ACCEPTED_EDGE_MARGIN` pointer. The 70 rejection and the drei `<Stars>`
  0.008% detail live in the PR body instead. "Canonical keeper" means a rejected alternative survives the
  cut, **not** that it earns a length exemption — four lines on one numeric field is the thing the rule
  exists to stop. For the record, I had flagged this block myself as one line over the bound before it grew,
  and should have held that rather than taking the exemption when it was offered.

**Lesson for the remaining areas:** a rule about what may NOT enter a file reads like prose and dies in a
sweep, because there is no code under it to check it against. Treat "never do X here" as a keeper on sight.

### Stale comments corrected — REVIEW THESE FIRST

**These are the part of the sweep that a diff cannot review.** A deletion is self-evidently safe; a
correction is a fresh claim about what the code does, and if the claim is wrong nothing catches it. Both
readings are given so the new one can be checked against the code without reconstructing the old one.

**`ship-model.tsx:182`** — the beacon.
- Was: *"team-colour beacon (emissive, blooms) so local=cyan vs remote=magenta stays legible — an unlit mesh,
  NOT a pointLight, to avoid the many-dynamic-lights perf cliff."*
- Now: *"Team-colour beacon, emissive so it blooms and stays legible at race distance. An unlit mesh, NOT a
  pointLight, to avoid the many-dynamic-lights perf cliff."*
- Why: the mesh takes `emissive={ color }`, the owner's team colour, with no local/remote branch anywhere in
  the file. A sibling comment in the same file also recorded magenta as retired from the palette. **The new
  line asserts the beacon is per-owner, not per-locality — check that claim.**

**`explosions.tsx:25`** — the `CYAN` shard tint.
- Was: *"local ship tint (matches ship.tsx beacon)"*
- Now: *"local ship tint"*
- Why: two errors in the parenthetical. The beacon is in `ship-model.tsx`, not `ship.tsx`, and it no longer
  uses this constant. The surviving half ("local ship tint") is true — `CYAN`/`MAGENTA` do still branch on
  locality here, which is why only the cross-reference was cut and not the whole line.
- **Related art finding, not acted on:** `MAGENTA = '#ff2bd6'` is still a live shard tint while the palette
  has retired magenta. That is a colour decision, not a comment one — routing it, not fixing it.

**`sky-follow.tsx:5`** — the follow group's children.
- Was: *"…its children (the gradient dome + the drei star field) stay centred on the viewer… parallax comes
  from their radius, not from tracking angle."*
- Now: *"A group that rides the camera each frame, so its children stay centred on the viewer and the sky
  never runs out as the ship travels. Position only, not rotation, so the sky still swings as the ship turns."*
- Why: it enumerated children it no longer has — the backdrop patch is what rides it now. Rewritten without
  the enumeration so it cannot rot the same way twice.

### Rulings from the supervisor — standing, apply to all remaining areas

**1. Rotted-into-false comments: correct, don't delete — but only when the corrected line would pass the
keeper bar on its own.** A comment that has rotted into a falsehood is strictly worse than no comment, so it
can never survive as written; that part is not a judgement call. What is a judgement call is what replaces
it. The test: *would I write this line today, on a fresh file, knowing what the code says?* Yes → correct it.
No → delete it, because the reason it was written has evaporated and you would be preserving a sentence for
its own sake.

**Obligation attached:** every corrected comment gets called out in this file with `file:line` and **both
readings**, as above. In a diff a correction is indistinguishable from a sweep, and it is really a claim
about behaviour. The deletions are safe to review at a glance; the corrections are not.

**2. The `constants.ts` tuning exception extends by purpose, not by file path.** It exists so the owner can
tune live without reading the sim. `env-config.ts`, the `DISSOLVE_*` block, and the explosion/spark constants
serve exactly that purpose, so their per-field lines stay intact. Reading the exception as being about one
file path would be the literal-minded answer that defeats the rule. **Per-field tuning lines in any
tune-live data block stay.**

**3. A restoration is an addition, and pays the same 1–2 line bar as anything else.** Putting a line back
does not exempt it from the standard the sweep is applying, and "it was there before" is not a length
permit. A comment that grows during a comment sweep is the sweep quietly turning into a rewrite — check the
direction of the line count on every file you touch, restorations included. The `fovDeg` block reached four
lines by exactly this route and is back to two.

**4. Direction check, per area.** Net comment lines must go DOWN in every file touched. If a file gains
lines, that is a finding to report, not a result to ship. Measured for `game/scene`: −189 across 20 files,
and no individual file gained.

### The lesson worth carrying past this lane

**A rule about what may not enter a file has no code under it to check it against, so it reads as prose and
dies in a sweep.** That is why prohibitions need a checkable artefact attached — the hex triple in
`sky-config.ts`'s palette line is what makes "the warm ramp never appears up here" verifiable instead of
merely stated. Treat "never do X here" as a keeper on sight.

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
