# LANE FACTS — sealed block (#164)

Raw first-hand facts only. Measurements carry units; claims carry `file:line`. `[unmeasured]` is a valid
entry. The supervisor writes the prose; this file is the numbers.

## Lane

- 2026-09-20 — worktree `/Users/apple/Projects/personal/slur-worktrees/sealed-block`, branch
  `art/sealed-block`, base `origin/dev` @ `cf1c98c`.
- Ports 5204 (client) / 2604 (server). Nothing was listening on either before launch (`lsof -nP -iTCP:<p>
  -sTCP:LISTEN` → empty for both).
- `.claude/lane/.gitignore` (`*`) did NOT exist; created by this lane.
- Stack launched `PORT=2604 pnpm dev > .claude/lane/dev.log 2>&1 &`. First poll at +15s:
  `curl -o /dev/null -w '%{http_code}' localhost:5204` → **200**, `localhost:2604` → **200**.
  Log: shared `tsc -b --watch` "Found 0 errors"; server "[slur] server up on ws://192.168.43.61:2604";
  Vite "Local: http://localhost:5204/".
- Issue #164 locked: https://github.com/dineshsalunke/slur/issues/164#issuecomment-5750325229

## Dimensions (read from source, not from a board)

- `BLOCK_HEIGHT = 8` — `packages/shared/src/sim/track.ts:143`. Comment: "ABOVE double-jump reach on
  purpose → UN-jumpable". FIXED forever.
- `BLOCK_DEPTH = 8` — `packages/shared/src/sim/track.ts:144`. A short discrete cube centred in the 20u
  segment, not a full-depth wall: `bz0 = z0 + (SEG_LEN - BLOCK_DEPTH)/2` (`track.ts:358`).
- Width as generated today: 4u. FREE per `docs/ART_SCALE_REFERENCE.md` §2; GDD §0's own legal examples are
  `5.5 × 5.5 × 8u` and `3.5 × 5 × 8u`.
- `MIN_CLEAR = 7u` (`MAX_SHIP_WIDTH 4u` + `CLEARANCE_MARGIN 3u`) — `ART_SCALE_REFERENCE.md` §3. Gameplay.
- Track is 64u wide (`HALF_WIDTH = 32`); widest ship 2.6u. A block at 4u wide is ~1.5 ship-widths.

## Material — already decided, not open

- `docs/ART_MATERIALS.md` M2 "Hazard metal (coated)": metalness **0.0**, roughness **0.45–0.60**, base
  colour near-black **cooler than M1**, "continuous, uninterrupted broad faces", sparse marigold seams.
- `ART_MATERIALS.md` §7 decision 1: "Obstacle blocks are coated metal (M2). Decided by the project owner,
  2026-09-19" — selected over the live alternative of engineered stone.
- M2's stated mechanism: "The separation from the deck is finish, not value" — coated dielectric (tight
  specular on a diffuse body) against the deck's broad conductor reflection.
- Deck values as shipped: `FLOOR_ROUGHNESS = 0.4` (`track-materials.ts:11`), `FLOOR_METALNESS = 0.75`
  (`track-materials.ts:16`, itself a recorded departure from M1's bare-conductor 1.0).
- Gameplay-tier marigold reference: `MARIGOLD_REFERENCE_INTENSITY = 2.0`, `MARIGOLD_EMISSIVE = '#F59A24'`
  (`track-materials.ts:57-58`). Environmental tier is `× 0.25` (`track-materials.ts:60-61`).
- Block seams are **gameplay tier** per `ART_MATERIALS.md` §2 element map ("Standard deadly block | M2
  coated | gameplay — sparse functional seams").

## Rendering as it ships today (the integration target, NOT this lane's edit)

- `apps/client/app/game/scene/track-blocks.tsx` renders lethal + drag as two `<instancedMesh>`, each with a
  bare `<boxGeometry />` — a **unit box scaled per instance** by `put()` (`track-instancing.ts`).
  `BLOCK_LIMIT = 160` per kind.
- Consequence for authored detail: any feature authored on the unit box is scaled **anisotropically** by
  the instance (a 3% chamfer = 0.12u on a 4u axis, 0.24u on an 8u axis). World-uniform features need
  either a shader that reads the per-instance scale, or world-space (triplanar) UVs.
- `LETHAL_SURFACE` is still `emissive: '#ff2740'` (red) — `track-materials.ts:35` — with an in-file comment
  deferring the retone to "the block-design task". Red is excluded from the palette
  (`INDEX.md` §2 Palette). NOT touched by this lane; first item for the integration step.

## Open / unmeasured

- Silhouette direction: escalated to the supervisor 2026-09-20 (planted-mass w/ base seam · machined box ·
  capped mass). **No answer yet — nothing invested.**
- How the block reads at race speed against the finished deck: `[unmeasured]` — needs the chase camera in
  `/art-lab`, not the iso lab.
- Whether a base-contact seam reads as a per-block footprint marker or as a continuous route glow across
  adjacent blocks: `[unmeasured]`.

## Slice 1 — instrument + M2 body (commit `5fc6620`)

- Files added: `game/scene/sealed-block-material.ts`, `sealed-block-geometry.ts`, `sealed-block.tsx`,
  `sealed-block-geometry.test.ts`; `routes/iso-block/{route,block-family}.tsx`; one line in `routes.ts`.
  No file on the brief's §6 list was edited.
- Chosen starting values: roughness **0.52** (midpoint of M2's 0.45–0.60), metalness **0**,
  colour **`#0d1117`**. No emissive seam yet — seam placement is part of the escalated direction.
- Footprints rendered: `4 × 8`, `5.5 × 5.5`, `3.5 × 5`, all `× 8u` tall, at x = 0 / 8 / 15, z = 0.
  `<IsoLab size={8}>` so the scale ruler and the 2.6u Fighter box read directly against the 8u height.
- Verify gate, all green on `5fc6620`: `pnpm typecheck` clean · `pnpm lint` **3 warnings, all the
  pre-existing `noExcessiveLinesPerFile` baseline**, comment ratchet "7 changed source files, none gained
  comment lines" · `pnpm --filter @slur/shared test` **78 pass / 0 fail** · `pnpm -r test` client **80 pass
  / 12 files** (includes the 6 new cases), server 4 pass · `pnpm build` OK.
- `curl localhost:5204/iso-block` → **200**; no Vite error in `dev.log` after the request.
- Commit hook rejects a commit message containing the co-author trailer phrase — the first attempt was
  refused for naming it even in a note. `CONTRIBUTING.md:134` states the policy.
- **Visual gate: `[unmeasured]`.** Not yet looked at in a foreground Chrome tab; `split-crown` was busy
  and tab focus is serialised across lanes.

## Authority correction — board 28 supersedes board 10 and `handoff/04_OBSTACLES.md`

Relayed by the supervisor 2026-09-20; verified against the file. Owner's tightening: **board 28 only** —
boards 25/26/27 are history, not references.

- `docs/art-direction/blocks/28_non_destructible_blocks_SPEC.md`, first paragraph: *"This is the current
  non-destructible block art direction, superseding conflicting proposals in boards 25–27."*
- Same paragraph, on the image: *"the newly generated image has not itself been approved"*. And under
  validation: *"Illustrative proportions, apparent height and camera matching are not measured evidence."*
  The written selected direction is what is decided; `ART_SCALE_REFERENCE.md` stays the dimensional
  authority. Board 28 is a LOOK target.
- Direction as written: sealed rectangular cuboids, restrained bevels, 8u height, variable width/depth ·
  marigold seams **vertical only**, variable positions, multiple permitted · *"Top-face luminous returns
  and glowing outlines are not part of the selected direction"* · no fissures, cracks, separated plates or
  broken contours · *"Preserve generous dark face areas"* · variation carried by **broad irregular wear
  patches varying sheen and muted graphite value**, with *"Clean is a legitimate endpoint of the wear
  range"* and *"Wear strength and seam count are independent controls, not distinct gameplay classes"*.
- Authoring intent, which confirms the mechanism choice independently: *"Prefer shared parameterized cuboid
  forms and shared material variation over individually authored models or painted block textures"* —
  controls named as width/depth, restrained bevel, seam count/position/spacing, wear patch
  placement/scale/coverage/contrast, and a repeatable instance seed.
- *"Some fine surface crazing persists: this incidental texture is not authorization to reintroduce
  fissures."*

**Instrument corrected in the same commit:** `<IsoLab board>` now `28_non_destructible_blocks_FINAL_DRAFT.png`.
That board lives in `docs/art-direction/blocks/`, not `docs/art-direction/boards/`, so it needed a **second
`artRefsPlugin` mount** at `/art-refs-blocks` (`apps/client/vite.config.ts`) plus a `REFERENCE_BOARDS` entry
with a `url` override. Board 10's picker label now reads "(SUPERSEDED)". Nothing under
`docs/art-direction/` was edited.

## `ART_MATERIALS.md` M2 vs board 28 — asked for by the supervisor

**No contradiction found. Three omissions and one passage that can be misread.** M2 is our engineering
sheet; where it is silent the spec governs.

1. **Wear is absent from M2 entirely.** M2's block row lists finish, metalness, roughness, colour, seam
   language and silhouette — no wear. Board 28 makes broad wear patches *the* variation mechanism for the
   family. M2's element map row (`Standard deadly block | M2 coated | gameplay — sparse functional seams`)
   also omits it. **This is the gap that matters** — a reader of M2 alone would build a uniform family.
2. **M2 does not say seams are vertical.** It says "sparse, narrow, functional". Board 28 says vertical
   only, with variable position and multiple permitted, and explicitly excludes top-face returns. M2 is
   underspecified, not wrong.
3. **M2 names no seed / instance-variation concept.** Board 28's authoring intent requires a repeatable
   instance seed.
4. **Misread risk, not a conflict:** M2's "Destructible variant" paragraph describes broad recessed
   fractures with M7 revealed inside. Board 28 rejects fissures *"on this family"* — the non-destructible
   one — so the two do not collide, but a reader skimming M2 could carry fractures onto the sealed block.
   ADR-009 gates the destructible block anyway.
5. **Numbers:** board 28 sets none (*"this generated painting is not a working procedural system"*), so
   M2's roughness 0.45–0.60 and metalness 0 stand unopposed. Note that broad patches "varying sheen" will
   need a roughness *spread*; whether the worn end stays inside 0.60 is `[unmeasured]`.
6. **Agreements:** near-black coated metal, distinct from the bare graphite deck and from stone; generous
   dark faces; intact silhouette; localized marigold. M2 and board 28 say the same thing in both.

## Still open at this seam

- Cold-key measurement on an 8u block, centreline vs rails, under `cf1c98c`: **`[unmeasured]`** — approved
  by the supervisor, not started.
- Triplanar / world-space UV behaviour on the installed three + R3F: **`[unverified]`** — must be checked
  against the installed typed API before it goes in the PR body, not recalled.
- Visual gate in a foreground Chrome tab: **`[unmeasured]`** — Chrome was released to this lane, but the
  context seam arrived first. Nothing has been looked at on screen.
