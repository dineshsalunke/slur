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
