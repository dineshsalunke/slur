# Phase notes — index

Read this file only. Open an individual note only when this index sends you there for a specific
detail. 51 notes are summarized below (49 in `.claude/phases/`, 2 in `.Codex/phases/`).

Numeric tuning values (lighting, camera, material scalars) changed dozens of times across the
2026-09-22 sessions and are volatile by nature — `apps/client/app/dev/tunables.ts`
(`NUMBER_SPECS`/`COLOR_SPECS`) is the single source of truth for current values, not this index.
The digest below covers **mechanisms and structural decisions**, not exact numbers.

## As-built digest — what still holds today (2026-09-22)

### Track / procgen
- **Generator model = "discrete slalom + flick"** (`packages/shared/src/sim/track.ts`): a macro
  Believer-song arrangement envelope (`SECTIONS` / `intensityAt`) drives a moving weave-line
  corridor (micro layer); discrete, uncorrelated cube pillars sit outside the corridor
  (`CORRIDOR_BUFFER` keeps a clear lane each side); alternating 1-lane "flick" pillars punctuate;
  gaps come in three families — full-width, partial (floor strip), and narrow longitudinal
  "cracks" (2–4 segments, strafe-around). `intensityAt` is **not monotonic** — it rises and falls
  like a song, and never reaches 0 or 1 on a real track. Superseded the older corridor-carve /
  noise-wall / "banks" (solid tube) models; see `2026-08-10-rhythm-paced-generation.md`.
- **Slow/drag blocks are gone from the sim entirely** (2026-09-22, `2026-09-22-non-destructible-block-to-board-28.md`).
  `Block.lethal` was removed; only one lethal block family exists now. **GDD §5.7 and ADR-009 still
  describe the removed family — known doc/code divergence, unresolved.**
  Blocks render as the "sealed" art family (board 28: black coating, marigold vertical seams),
  wired 2026-09-22; the old `LETHAL_SURFACE`/`DRAG_SURFACE` placeholder boxes are gone.
- **Track descriptor**: `ProcgenDescriptor { kind, seed, tier, length, blockDensity, gapChance }`.
  `length`, `blockDensity`, `gapChance` are wired end to end (client+server, deterministic).
  **`tier` is still unwired** — reads nothing anywhere.
- **`MIN_CLEAR`/`MAX_SHIP_WIDTH`/`CLEARANCE_MARGIN` (ADR-007, `2026-08-11-continuous-generator.md`)
  do not exist in code.** What ships is `MIN_LANE = 2 × CELL = 8u`. GDD §0 documents the ADR-007
  contract as if built — it isn't. Flagged, not fixed (`2026-09-21-doc-audit-handover.md`).
- **Asteroid field is placement-only, dead code.** `asteroid-config.ts`/`asteroid-field.ts` exist
  and are tested, but nothing mounts geometry — no asteroids are visible in the game
  (`2026-09-22-asteroid-field-placement.md`).
- **Monoliths** replaced `TubeWalls` as the environment prop family (`monolith-config.ts` +
  friends): parameterized box/obelisk shapes, progression-driven spacing via `intensityAt`, placed
  flush to the rail's outer edge. Height frozen at **50u** (a departure from
  `ART_SCALE_REFERENCE.md` §5's 200–400u, sided with the art board). Metalness ships **0.3**
  against `ART_MATERIALS.md` §M3's spec of 0.0 (dielectric) — open departure, unresolved.
- **`/solo` stays removed, but its successor is `/test-level`**, a local flyable mirror that
  mounts the *same* `WorldScene` component as `/game/:roomId` (no duplicate scene, structurally
  impossible to drift — `2026-09-21-test-level.md`). CLAUDE.md's own note documents this correctly.

### Lighting and materials
- **Single tone-mapping pass.** `<Canvas flat>` on both gameplay canvases (NetCanvas,
  TestLevelCanvas) + `NeutralToneMapping` inside the `EffectComposer`, chosen because it preserves
  saturated marigold highlights better than ACES/AgX/Reinhard against the golden reference.
  `toneMapped: false` is **banned project-wide** — every material goes through the one tone map now
  (`2026-09-22-one-tone-map-and-the-emitter-wash.md`, mirrored in `conventions/r3f.md` and
  `.claude/rules/r3f-rendering.md`).
- **Lighting rig = gradient IBL (procedural equirect DataTexture) + one camera-following point
  "fill" light.** No directional key, no hemisphere light, no per-player point lights — all deleted
  during the from-black rebuild (`2026-09-22-lighting-rebuild.md`,
  `2026-09-22-owner-numbers-and-the-ship-glow.md`). `ambientLight`/`hemisphereLight` cannot light a
  metal in three.js — an env map is mandatory for metal surfaces, not optional.
- **The rail emitter array (`emitter-array.ts`) is a module singleton patched onto every emissive
  surface** (deck, ship hull, monoliths, rail) via `onBeforeCompile`, not just the deck — one light
  source, many consumers. It transforms in **world space**, not view space (a same-frame camera
  staleness bug was fixed by removing the camera dependency entirely). Diffuse and specular use
  different closest-point solves (Karis split) — a single "camera-mirror" point was wrong for
  diffuse and caused "light disappears near the edge."
- **The rail is its own mesh** (`track-rail.tsx`), not part of the deck slab — it owns and feeds
  its own emitter slots, and parks them (`clearRailEmitters`) on unmount so removing the rail
  removes its light too. Flush with the deck (not raised), 2u wide with a narrower lit "cord" strip
  inboard, dark metal margins either side. **The rail must not light itself** — patching the
  emitter shader onto the rail's own material saturates it and erases the margins (bug found+fixed
  `2026-09-22-rail-as-its-own-object.md`).
- **Inboard deck seams exist** (`seam-inserts.ts`/`track-seams.tsx`) — short, sparse, irregular
  marigold inserts across the track width, per `ART_MATERIALS.md` §M7/§2, added
  2026-09-22 to answer "the reference has marigold across the full deck width, we only had edge
  rails" (`2026-09-22-rail-light-diagnosis-and-the-deck-seams.md`).
- **Gap rims are lit, extruded cylinder cords** tracing the true stepped silhouette of a gap
  (including "teeth" — partial floor protrusions into a gap for visual/gameplay variety),
  not flat inset strips (`2026-09-22-gap-shape-and-rim.md`).
- **Deck texture is parameterized** (`track-texture.ts` `surfaceMaps(SurfaceParams)`) — 4u×4u
  square plates in straight bond (NOT the offset/breaking-bond pattern `ART_MATERIALS.md` used to
  specify — that read as a brick wall and was struck), with albedo/normal/roughness/metalness(packed
  ORM) maps, wear layers (finish patches > scuff > rub, roughness-only per §M1), and a cavity mask
  so joint bevels don't flare under grazing rail light. Reworked repeatedly through 2026-09-22;
  `track-materials.ts`/`dev/tunables.ts` are the live source of every material scalar.
- **A DOM tuning panel (backtick to toggle) is the live-editing mechanism for the whole look** —
  `apps/client/app/dev/tunables.ts` (module-singleton store, `useSyncExternalStore` subscriptions,
  zero Canvas re-renders) + `tuning-panel.tsx`. Built 2026-09-22
  (`2026-09-22-tuning-panel-and-punch.md`) to replace an earlier, narrower debug panel. **Its
  `NUMBER_SPECS`/`COLOR_SPECS` ARE the shipped look** — there is no second place to change a
  material/lighting constant. Mounted on `/test-level` only (not `/game/:roomId`).
- **Frame rate was investigated and closed as a non-issue** — the app is GPU-bound at ~1.4ms CPU;
  a suspected regression was the browser extension backgrounding its driven tab (rAF throttles to
  0). `perf.dpr` (render-scale slider) and an emitter-loop shader optimization
  (`uEmitterCount` early-exit, 24→12 slots) are real, kept wins with no look change.
- **`accent.ts`** is a module-singleton mutable `THREE.Color` ("bind the reference, never copy it")
  driving every marigold surface — built so the hue can shift live/per-level later. A "vermilion"
  hue trial is **active but not decided** as of the last note.
- **Camera far/near plane**: `near: 1, far: 1000` on both gameplay canvases, fixing a depth-buffer
  precision flicker on thin geometry (gap rim cords) at distance — durable engine-level fix
  (`2026-09-22-depth-precision-and-exposure-order.md`).
- **Open, unresolved as of the last note**: rail top face (`BOUNDARY_W`≈1.0u/2u) is much wider than
  the reference's ~0.2–0.3u cord and also feeds collision — a real decision, not a dial. Block wear
  texture has been rewritten twice and **never actually seen on screen**. `ART_MATERIALS.md` §7
  owes roughly ten decisions-and-departures entries that are named across notes but not yet
  written. `docs/art-direction/` stays read-only for Claude — corrections go in a Claude-owned doc
  for the owner to paste into ChatGPT, never a silent edit.

### Camera
- Chase camera lives in the tuning-panel store (`cam.*` keys in `dev/tunables.ts`), not a
  standalone `CHASE` constant (that export was deleted — `2026-09-22-camera-knobs-and-the-dark-deck.md`).
  Current owner-approved framing (landed as spec defaults
  `2026-09-22-owner-numbers-and-the-ship-glow.md`): pulled back and higher than the original S1
  framing, chosen because a too-close camera put the near deck at grazing (Fresnel-weak) incidence
  and it read as black — pulling back fixed it with no extra light needed.
- Rearview mirror / spectator-cam / lobby hero-orbit camera modes (`updateSpectatorCamera`,
  `updateLobbyCamera`) shipped in S4 and are unrelated to the 2026-09-22 chase-cam retuning.

### Netcode / sim
- **Load-bearing contract (ADR-000, `2026-08-10-track-provider-decoupling.md`) holds**: a room
  syncs a descriptor + sequenced inputs + a thin dynamic-state slice; both ends materialize an
  identical `Track` locally and run the one shared `simulate()` over it. Never sync geometry
  tile-by-tile.
- **S1–S5 substrate is live and unchanged in shape**: semi-implicit Euler flight sim in
  `@slur/shared`, predict-and-reconcile-by-replay for the local ship, ~100ms buffered interpolation
  for remotes, AABB (Minkowski) collision, per-ship-class `FlightTuning` registry
  (`ship-classes.ts`), bolt/stun/pickup combat pipeline (S5), 4-phase round model
  (lobby→countdown→racing→finished) with host authority and spectate-on-late-join (S4).
- **Endless Survival mode is fully dropped** (ADR-004) — all tracks are finite
  (`TRACK_SEGMENTS`-bounded), `mode` plumbing was never built, and stale "Survival will branch
  here" comments were swept in the ADR-004 cleanup pass.
- **`ADR-001`'s `TrackDescriptor`/`resolveTrack` provider indirection has since landed** (visible
  via the `ProcgenDescriptor` type in current code) — the 2026-08-10 status audit calling it "0%
  built" is stale; no later note documents the actual implementation session, but the code exists.
- **Ship-feel work (rail bounce, `railBounce` field on `FlightTuning`)** shipped on a separate
  branch (`feat/ship-feel`, `controls` session) and needed a rebase into `feat/test-level`; it
  **contradicts GDD §11's "walls stop+slide, non-lethal"** — doc/code conflict, owner's call,
  unresolved as of the last note referencing it.
- **Source-editing rule**: regex/`sed`/`awk` edits to source are banned project-wide
  (`.claude/rules/source-editing.md`, CLAUDE.md #15) — use `ast-grep`, ts-morph, or a whole-file
  rewrite.

### UI / HUD
- Landing page, room list, lobby ship/colour pick, race HUD, results screen, spectator bar all
  shipped in S4/S6 and are stable in shape. Palette is **cyan (local) × marigold-amber (remote)**,
  not the original cyan×magenta (S6 environment/palette pass).
- The debug tuning panel (above) is the one active DOM overlay actively evolving; it is dev-only
  and `/test-level`-only.

### Repo / process
- **Comment rule is mechanical, not judgement-based**: no comments at all except one line each on
  `setTimeout`/`setInterval`/`useEffect` (CLAUDE.md #14, rewritten 2026-09-21). Enforced by
  `scripts/check-comment-ratchet.mjs` via `pnpm lint`.
- **Worktree mandate is gone.** Worktrees are optional, used only when work would actually
  collide (concurrency), not as ceremony for small changes (CLAUDE.md, rewritten 2026-09-21).
- **Project memory lives in the repo** at `.claude/memory/`, git-tracked, set via
  `autoMemoryDirectory` in the gitignored `.claude/settings.local.json` — a fresh worktree must
  `cp` that file in, or its memories silently fall back to the default (non-shared) store.
- **`art-lab`, `art-gallery`, `iso-*` routes and `.claude/art-pass/` are permanently deleted**
  (2026-09-21). `/env-lab` remains as the one throwaway visual lab; `/test-level` is now the real
  art-review instrument (see Track/procgen above). Recover any of it with
  `git show e56f643 -- .claude/art-pass` or `git show fe00b5b -- apps/client/app/routes/art-lab`.
- **`docs/art-direction/` was re-organized 2026-09-20/21** into subject folders
  (`golden-reference/`, `background/`, `track/`, `ingredients/blocks/`, `vehicles/<ship>/`,
  `progression/`) — the older `handoff/`/`boards/NN_*` layout referenced by several ADRs and by
  `ART_SCALE_REFERENCE.md`/`ART_MATERIALS.md` is **stale**; treat any such reference as needing
  resolution through `docs/art-direction/README.md`.
- **Multiple sessions sharing one checkout is a real hazard.** `.git/index` is not session-local —
  `git add` from one session stages files for every other session in the same working tree, and a
  bare `git commit` can sweep up unrelated work. Always `git commit -m "…" -- <explicit paths>`,
  never a bare `git add … && git commit`. (`.claude/memory/shared-checkout-shares-one-git-index.md`
  records this as a durable memory.)
- All the 2026-09-22 lighting/rail/deck-seam/sealed-block/asteroid-placement work across ~20 phase
  notes eventually landed on `dev` via PR #193 ("corridor rail and deck seams, sealed blocks,
  asteroid placement") — the extended "landing blocked" coordination drama in
  `2026-09-22-the-landing-and-the-shared-index.md` resolved itself; the permission-classifier
  denial it describes was later found to be **flaky, not session-specific** (see that note's own
  correction, and `2026-09-22-non-destructible-block-to-board-28.md`'s addendum).

## Per-file table

| Date | File | Decided / changed | Status |
|---|---|---|---|
| 2026-08-06 | `2026-08-06-s1-flight-feel.md` | S1 solo flight feel: semi-implicit Euler sim, fixed 60Hz physics + rAF render interpolation, cuberun-style scenery/camera. Playable, human gate passed. | LIVE (jump model later upgraded to derived-from-height, see next row) |
| 2026-08-06 | `2026-08-06-setup.md` | Initial monorepo scaffold: Colyseus+RR8+R3F+koota stack locked, blank runnable skeletons for shared/server/client. | LIVE (historical foundation; stack choices still current) |
| 2026-08-07 | `2026-08-07-s2-networked-flight.md` | S2 networked flight: schema-IS-the-SimShip, predict+reconcile-by-replay (local), buffered interpolation (remote), `/run` route, reconnection built early. Human gate passed. | LIVE (netcode substrate unchanged in shape) |
| 2026-08-08 | `2026-08-08-s3-track-hazards-collision.md` | S3 track/collision: seed-derived `segmentAt` track function, floor/gap/block collision, respawn, first Bloom pass. Core loop shipped, playtest fixes (track/server desync fix, platform→jump-onto redesign). | SUPERSEDED by `2026-08-10-track-provider-decoupling.md` (Track abstraction reframed) and `2026-08-10-rhythm-paced-generation.md` (generator rewritten); AABB collision model persists |
| 2026-08-09 | `2026-08-09-collision-aabb-jump-vfx.md` | Collision hardening (swept floor/platform tests), jump/strafe retune, death VFX, boost removed → later pickup, ship footprint locked, then 5-class ship matrix + CELL=4u grid + AABB collision + server-authoritative class registry. Landed. | LIVE (ship-classes registry, AABB collision); specific tuning superseded by later playtests |
| 2026-08-09 | `2026-08-09-procgen-flow-progression.md` | Proposed "carved corridor + noise walls" generator design, validated in a headless ASCII proto. Not built yet at time of writing. | SUPERSEDED by `2026-08-10-rhythm-paced-generation.md` (adopted, then further evolved into discrete-slalom+flick) |
| 2026-08-09 | `2026-08-09-s4-batch4-spec.md` | Spec for S4 client overlays/spectator-cam/lobby-preview/leave-guard (subagent build brief). | SUPERSEDED by its own as-built record in `2026-08-09-s4-session-flow.md` |
| 2026-08-09 | `2026-08-09-s4-session-flow.md` | Full S4 arc: round-based session model (host GO, countdown, spectate-on-late-join replaces spawn-beside-pack), live room list via `LobbyRoom`, 4-phase schema, ship/colour pick, results. Closed, human gate passed. | LIVE (session/round architecture); `/run` route retired later, superseded by `/game/:roomId` |
| 2026-08-09 | `2026-08-09-s5-combat-powerups.md` | S5 combat: Bolt projectile (interp-only, server-owned), stun status effect, track-placed pickups, threat-warning HUD. Thin-vertical slice, closed, human gate passed. | LIVE (combat substrate); unrelated slow/drag-block removal came later |
| 2026-08-10 | `2026-08-10-adr-001-prep.md` | ADR-001 plan: seed → `TrackDescriptor` + `resolveTrack` provider indirection, `length`/`tier` reserved unwired. | LIVE as design record; implementation landed later in code (no dedicated as-built note found) |
| 2026-08-10 | `2026-08-10-adr-002-prep.md` | ADR-002 plan: `Track.anchors` (pickup placements) built; physics/visual split frozen (not built, kept as a documented WYSIWYG rule only). | LIVE (anchors concept in use; visual split still frozen per this design) |
| 2026-08-10 | `2026-08-10-env-lab-DRAFT.md` | `/env-lab` atmosphere prototype: 3 variants (deep-space / neon-canyon / grid-void), bloom-only post-FX. Grid Void chosen later in S6. | SUPERSEDED — TubeWalls deleted 2026-09-21, sky dome replaced by `scene.background` 2026-09-22; `/env-lab` itself still exists but its content has moved on |
| 2026-08-10 | `2026-08-10-procgen-weave-width-DRAFT.md` | Draft: coherent weave line + block-width variety via corridor-carve, RLE-merged noise walls. | SUPERSEDED by `2026-08-10-rhythm-paced-generation.md` (its own text: "Supersedes the S6 value-noise difficulty model") |
| 2026-08-10 | `2026-08-10-rhythm-paced-generation.md` | ADR-006: Believer-song arrangement envelope + banks→discrete-slalom+flick micro model (evolved across live playtests same session). Ships tuned for flicks; camera raised to see over pillars. | SUPERSEDED (block placement internals) by `2026-08-11-continuous-generator.md` (ADR-007); macro envelope (`intensityAt`/`SECTIONS`) still LIVE |
| 2026-08-10 | `2026-08-10-s6-identity.md` | S6 arc: armour stat, lobby pick-UI upgrade, full audio subsystem, art/juice checklist, environment pass. Landing UI + procgen v2 + audio shipped; armour stat, pick-UI identity card, hull-colour/COLOR_COUNT, trails not yet built at time of writing. | LIVE (partial — audio/landing/procgen shipped; remaining S6 items tracked in backlog) |
| 2026-08-10 | `2026-08-10-status-vs-baseline.md` | Read-only audit: ADR-000 anchor holds, ADR-001/002 0% built, ADR-003 correctly not built, ADR-004 accepted but comments stale. | SUPERSEDED — ADR-001 has since landed in code; snapshot is historical only |
| 2026-08-10 | `2026-08-10-track-provider-decoupling.md` | ADR-000..004 narrative: load-bearing contract reframed around the `Track` abstraction (not "seed"), descriptor/Track split, 3-layer mechanics model, macro-grammar deferred, endless Survival dropped. | LIVE (foundational architecture, still the governing model) |
| 2026-08-11 | `2026-08-11-continuous-generator.md` | ADR-007: block geometry decoupled from `CELL` grid (arbitrary continuous size), `MIN_CLEAR = MAX_SHIP_WIDTH + CLEARANCE_MARGIN` contract, switchable `pillars`/`noise` block placer. Greenlit and implemented. | SUPERSEDED in practice — `2026-09-21-doc-audit-handover.md` found `MIN_CLEAR` etc. exist nowhere in code; actual code still uses `MIN_LANE = 8u` |
| 2026-09-19 | `.Codex/phases/2026-09-19-art-reconciliation.md` | Consolidated art-direction docs into one entry point (`docs/art-direction/README.md`), retired stale handoff pointers, moved 19 superseded files into subject history. | LIVE (describes the still-current docs/art-direction structure) |
| 2026-09-20 | `.Codex/phases/2026-09-20-art-consistency.md` | Art audit process agreed with owner; `cruise-lighting.png` accepted into `golden-reference/` as the quieter companion to the action reference. | LIVE (`cruise-lighting.png` remains the governing lighting reference used throughout 09-22) |
| 2026-09-18 | `2026-09-18-supervisor-cost-and-art-consolidation.md` | Tore down 4 parallel Opus lane agents (cost blowup), consolidated `art-handoff-v1`/`v2` into `docs/art-direction/{boards,handoff,source}`, cost-control agent defs + context watchdog added. Flagged art-vs-GDD conflicts (camera height, slow blocks). | SUPERSEDED (folder structure) — `docs/art-direction/` re-organized again 2026-09-20/21 into subject folders; cost-control tooling and camera-height finding still relevant |
| 2026-09-18 | `2026-09-18-track-art-pass.md` | Adopted ADR-008/ADR-010 art package; built `/art-lab`+`/art-gallery`; track floor rebuilt as one generated mesh (not instanced tiles) with a world-unit-sized procedural texture. Edge rail identified as next task. | SUPERSEDED — `/art-lab`/`/art-gallery` deleted 2026-09-21; floor texture rewritten from measured reference 2026-09-22 |
| 2026-09-19 | `2026-09-19-track-vibrato-generation.md` | Brainstorm: rejected "audio waveform as the racing line" (would make it a rhythm game or an expensive PRNG); counter-proposal is a ship-tuning (`strafeDamp`) + forcing-rate change, framed as a possible new ship class. Nothing decided. | LIVE (open brainstorm; no evidence the counter-proposal was ever acted on) |
| 2026-09-21 | `2026-09-21-camera-framing-and-origin-blocks.md` | Camera retuned to match `action-lighting.png` deck-edge-slope cue (height 4.7/back 7.3); fixed a long-standing "glowing box at spawn" bug (`InstancedMesh.count`, not `park()` high-water tracking). | SUPERSEDED (camera numbers) by `2026-09-22-owner-numbers-and-the-ship-glow.md`; origin-block `.count` fix is durable/LIVE |
| 2026-09-21 | `2026-09-21-comment-rule-and-route-cull.md` | Comment rule rewritten to be mechanical (CLAUDE.md #15, later renumbered #14); `art-lab`/`art-gallery`/`iso-*` routes + `.claude/art-pass/` + `.claude/comment-sweep/` deleted (132 files total across 3 PRs). | LIVE (both the comment rule and the route deletions are current state) |
| 2026-09-21 | `2026-09-21-density-knobs-handover.md` | `ProcgenDescriptor` gains `blockDensity`/`gapChance` multipliers (wired to 3 roll sites each); debug panel deleted once monolith numbers were frozen; source-editing (no-sed) rule codified. | LIVE (density knobs); debug-panel deletion SUPERSEDED — a much larger tuning panel was rebuilt 2026-09-22 |
| 2026-09-21 | `2026-09-21-doc-audit-handover.md` | CLAUDE.md/TDD/GDD de-bloated and corrected (3725→2366 words). Found GDD §0's `MIN_CLEAR` contract was never built, GDD §5.5 flight stats disagree with `ship-classes.ts`, ADD cites dead art-direction paths. | LIVE (findings still open per this session's own verification) |
| 2026-09-21 | `2026-09-21-monolith-field-handover.md` | First monolith field built (replacing `TubeWalls`), sky backdrop finally mounted (`SkyBackdrop`/`DeepSpaceSky`), density driven by `intensityAt`. Monolith height/seam values frozen provisionally. | SUPERSEDED (specific numbers, sky mounting mechanism) by 2026-09-22 monolith parameterization and the later scene.background rewrite; monolith-as-TubeWalls-replacement concept is LIVE |
| 2026-09-21 | `2026-09-21-test-level-handover.md` | Status handover: `/test-level` shipped (#192), art backlog reorganized into 5 items (PR #191), next task is scene lighting against a still-undetermined golden reference. | SUPERSEDED — status-only, overtaken by the 2026-09-22 lighting work |
| 2026-09-21 | `2026-09-21-test-level.md` | `/test-level` built as a local flyable mirror of the real game scene; `WorldScene` extracted so `NetCanvas`/`TestLevelCanvas` share one component (drift structurally impossible, unlike the old `/solo`). | LIVE (foundational architecture, still governs `/test-level` and `/game/:roomId`) |
| 2026-09-21 | `2026-09-21-worktree-mandate-and-repo-memory.md` | Worktree mandate removed (CLAUDE.md non-negotiable #12 gone, `.githooks/` removed); project memory redirected into `.claude/memory/` via `autoMemoryDirectory`. | LIVE (both reflected in current CLAUDE.md) |
| 2026-09-22 | `2026-09-22-accent-colour-and-deck-wear.md` | `accent.ts` module-singleton hue-shift pipeline for the marigold accent (linear-vs-sRGB hue trap documented); deck wear roughness layers (finish/scuff/rub) fixed per spec; a "vermilion" hue trial made active. | LIVE (accent.ts mechanism); vermilion trial unresolved/open |
| 2026-09-22 | `2026-09-22-asteroid-field-placement.md` | Asteroid field placement logic shipped (polar bands, streaming window, size classes from `ART_SCALE_REFERENCE.md`); explicitly dead code — no geometry/renderer mounted. | LIVE (still dead code as of the last note referencing it) |
| 2026-09-22 | `2026-09-22-camera-knobs-and-the-dark-deck.md` | Diagnosed "dark deck behind ship" as camera grazing-incidence, not a lighting bug; owner fixed it by pulling the camera back rather than raising IBL/emitter; camera moved into the tuning-panel store. | SUPERSEDED (specific dialled numbers) by `2026-09-22-owner-numbers-and-the-ship-glow.md`; camera-in-tunables mechanism LIVE |
| 2026-09-22 | `2026-09-22-corridor-lighting-bisect.md` | Documented 4 probing traps (stale object handles, irreversible mutations, moving camera, contested tree) that invalidated a session of lighting bisects; decided to strip all lighting and rebuild from black. | SUPERSEDED by `2026-09-22-lighting-rebuild.md` (the rebuild itself); the 4 probing-trap lessons remain good practice |
| 2026-09-22 | `2026-09-22-deck-detail-and-metalness.md` | Built a PNG-measurement method (`deck-survey.mjs`) against the golden reference; found the deck was too flat not too dark; rail emitter turned on; monolith metalness fixed to spec (0). | SUPERSEDED (specific values) by later 09-22 passes; the measurement-not-eyeball method is LIVE and durable |
| 2026-09-22 | `2026-09-22-deck-material-from-reference.md` | Deck texture rebuilt from PNG measurements: 4u×4u square plates (breaking-bond pattern removed — read as a brick wall), normal map added, metalness/roughness corrected toward measured values. | SUPERSEDED (specific texture code) by `2026-09-22-tuning-panel-and-punch.md`'s parameterized `SurfaceParams`; plate/joint layout concept LIVE |
| 2026-09-22 | `2026-09-22-depth-precision-and-exposure-order.md` | Fixed gap-seam flicker (depth-buffer precision: camera `near` was 0.1, raised to 1) and "bloom doesn't show on the rail" (exposure was applied after the bloom threshold in the composer — reordered). | LIVE (both fixes are durable, engine-level) |
| 2026-09-22 | `2026-09-22-emitter-reach-and-groove-flare.md` | Rail emitter made a true module singleton lighting all surfaces (was deck-only); diffuse/specular closest-point split fixed ("light hides near the edge"); lead-in deck rail-less bug fixed; inverted normal map fixed; cavity mask added for joint flare. | LIVE (all four are durable shader/mechanism fixes) |
| 2026-09-22 | `2026-09-22-gap-shape-and-rim.md` | Gap silhouettes given irregular "teeth" (partial floor protrusions, real/landable); gap rim now an extruded cylinder cord tracing the true void edge, not flat inset strips. | LIVE (both shipped as the current gap-rendering mechanism) |
| 2026-09-22 | `2026-09-22-gap-widths-and-deck-measurement.md` | Added a third gap family, "crack" (narrow longitudinal slot, 2–4 segments); rim cord thinned; deck lighting re-measured against reference (metalness scalar was the real contrast lever, not IBL). | LIVE (crack gap family, deck-survey script shipped) |
| 2026-09-22 | `2026-09-22-lighting-rebuild.md` | Stripped all lighting to black and rebuilt from a gradient-IBL-only rig (no directional key); settled `FLOOR_METALNESS` at 0.7 (coated metal, not raw conductor) after a challenge from the owner. | SUPERSEDED (specific numeric values) by later 09-22 passes; the IBL-only rig and metalness reasoning are LIVE |
| 2026-09-22 | `2026-09-22-monolith-and-corridor-lighting.md` | Monoliths first parameterized (box/obelisk shapes, configurable seam); a hemisphere+4-point-light "corridor light" rig built as an interim lighting solution. | SUPERSEDED — the corridor-light rig was deleted wholesale in `2026-09-22-lighting-rebuild.md` ("owner: remove all the lighting"); monolith parameterization itself is LIVE |
| 2026-09-22 | `2026-09-22-non-destructible-block-to-board-28.md` | Wired the already-authored "sealed block" art (board 28 styling) onto the track via one instanced mesh + per-instance seam/wear attributes; removed slow/drag blocks from the sim entirely; wear layer rewritten twice. | LIVE (final block art + sim-level slow-block removal, merged via PR #193); wear look flagged as never actually seen on screen |
| 2026-09-22 | `2026-09-22-one-tone-map-and-the-emitter-wash.md` | Adopted `<Canvas flat>` + Neutral tone mapping (single pass, was double ACES+Reinhard); found the "over-bloom wash" was the emitter array's range, not bloom/rail; replaced the spherical sky "dome" patch with `scene.background`; banned `toneMapped: false` project-wide. | LIVE (major durable pipeline decision) |
| 2026-09-22 | `2026-09-22-owner-numbers-and-the-ship-glow.md` | Owner's dialled camera/IBL/groove numbers landed as spec defaults; built a "ship exhaust glow" emitter slot, then explicitly unwired/deleted it on request; added directional+point "Fill" lights, then removed the directional one and kept the point light; gave gap rim cords a bloom-reaching intensity knob. | LIVE (Fill point light, rim bloom knob, landed camera numbers); ship-glow explicitly reverted |
| 2026-09-22 | `2026-09-22-rail-as-its-own-object.md` | Rail split out of the deck into its own mesh (`track-rail.tsx`), flush 2u wide with an emissive "cord" inset; found and fixed a self-lighting bug (the rail's own metal was being lit by its own emitter, erasing the metal margins). | SUPERSEDED (share/config values) by `2026-09-22-rail-ownership-and-slab-depth.md`; "rail is its own object" architecture is LIVE |
| 2026-09-22 | `2026-09-22-rail-light-diagnosis-and-the-deck-seams.md` | Root-caused "rail lighting issue" as a grazing-light diffuse falloff (1/d³ effectively — the light barely touches the deck); narrowed the emissive share to read as a cord; added inboard deck seam inserts to carry marigold across the full track width per the art direction. | LIVE (deck seams shipped; emitter-share narrowing shipped) |
| 2026-09-22 | `2026-09-22-rail-ownership-and-slab-depth.md` | Moved the emitter-feed ownership fully into `TrackRail` (parks its own light on unmount — fixes "unmounting the rail doesn't remove the glow"); found and explained the double-tone-map bug (fixed properly later by `<Canvas flat>`); raised `SLAB_THICKNESS` 2u→24u per the owner. | LIVE (rail owns its light, SLAB_THICKNESS=24u); double-tone-map issue itself SUPERSEDED by `2026-09-22-one-tone-map-and-the-emitter-wash.md` |
| 2026-09-22 | `2026-09-22-the-landing-and-the-shared-index.md` | Coordinated landing of 4 parallel sessions' work; documented a shared-`.git/index` near-miss (one session's `git add` swept another's staged files) and a flaky permission-classifier denial blocking a commit. Flagged unresolved owner decisions (GDD/ADR-009 doc debt, block lighting, tone-exposure defaults). | SUPERSEDED as a coordination log — the landing completed (PR #193 on `dev`); the shared-index lesson is now `.claude/memory/shared-checkout-shares-one-git-index.md` and remains LIVE |
| 2026-09-22 | `2026-09-22-tuning-panel-and-punch.md` | Built the hand-rolled DOM tuning panel (module-singleton store) as the mechanism decision for live-editing scene values; resolved 6 owner-reported lighting/material issues in one pass; investigated and closed out a frame-rate scare as an extension-throttling artifact (real GPU cost is fine). | LIVE (the tuning panel is the current live-tuning mechanism; its specs are the shipped look) |
| 2026-09-22 | `2026-09-22-leva-reversal-and-the-lighting-knobs.md` | leva 0.10.1 adopted, reversing the earlier hand-rolled-panel decision; lighting-scoped tuning knobs built (PR #202). | LIVE (leva is the current tuning mechanism; its defaults now seed from `scene/graphite.ts`) |
| 2026-09-22 | `2026-09-22-leva-palette-and-the-marigold-split.md` | Supervisor session: `app.css` palette up to ADR-008, lighting stack cleared, and marigold found inconsistent by *brightness* not hue — five surfaces at five intensities unified through `MARIGOLD_REFERENCE_INTENSITY`. | LIVE (findings); its open PRs #202/#205 both landed 2026-09-22 |
| 2026-09-22 | `2026-09-22-graphite-family-and-the-hdri-plan.md` | Split Crown made default ship; deck/rail/monolith/block/ship collapsed to one `scene/graphite.ts` (albedo `#303c45`, metalness 0.9, roughness 0.4); found #202's leva defaults were about to silently revert #205; HDRI picker specified but not built. | LIVE |
