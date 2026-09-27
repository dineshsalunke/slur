# Backlog

Project **SLUR**. Slice roadmap — see `docs/` (GDD/TDD/ADD/AUDIO) and `.claude/phases/2026-08-06-setup.md`.
Working model: pick one slice → arc (ideate → brainstorm → prep → align) collaboratively → implement in a
background agent → reconcile; design the next slice while the current one builds.
Dependency note: **S1→S2→S3→S4 are sequential** (each builds on the prior's code); S5–S7 layer on S4.

**Scope of this file: the SLUR roadmap** — slices, arcs, and decisions the project pipeline
needs visible. It is committed on purpose. Loose parked scraps do NOT belong here; they go to
the global parking lot at `~/.claude/backlog.md` (the `backlog` skill writes both).

## Pending

- [ ] 2026-09-23 [task] [docs] **Work the three audit reports in `.claude/reports/`** — written 2026-09-23, none acted on
  why: three audits ran in one pass and produced findings, not fixes. Each needs a doc-moves-or-code-moves
  call from the owner. Read the report, not this summary — each finding quotes its source and its
  contradicting file and line.
  1. [ ] **`GDD-DEVIATIONS.md`** — 11 findings. Take **§1.3 first**: GDD §0 argues for a fixed clearance
     ceiling because *"if clearance tracked the live roster, adding/resizing a ship would silently mutate
     every existing seed's track"*, and `sim/weave.ts:15-16` derives `SLOPE_CAP`/`CURV_CAP` from
     `ALL_CLASS_TUNINGS` — the live roster. The seed-stability promise does not hold across a roster change.
     Then §1.1 (`MIN_CLEAR`/`MAX_SHIP_WIDTH`/`CLEARANCE_MARGIN` exist in no source file; `MIN_LANE = 8u`
     ships instead of the documented 7u) and §2.1 (slow blocks are gone from the sim; GDD §5.2 and ADR-009
     still ship them).
  2. [ ] **`ADD-DEVIATIONS.md`** — 7 findings. §1 is a free win: four rows of §0's authority table and one
     §7 reference point at `docs/art-direction/handoff/` and `boards/`, both deleted in the 2026-09-20/21
     reorg. Resolve through `docs/art-direction/README.md`. The monolith departures (§2.1 scale 200–400u
     documented vs 50u shipped, §2.2 metalness) are corrections for the owner to hand to ChatGPT — never an
     edit inside `docs/art-direction/`.
  3. [ ] **`CONVENTION-VIOLATIONS.md`** — 1 non-negotiable, 0 convention, 2 arguable. The real one is a
     two-line prose comment at `apps/client/app/game/scene/sealed-block-shader.ts:137-138`, which
     `check-comment-ratio.mjs` cannot catch because it only ratchets files as they change. Worth deciding
     whether the ratchet should get a one-off full-tree sweep. The arguable pair (the 30Hz input
     `setInterval` bound to `NetCanvas`'s mount; `CELL` imported into rim/floor geometry) both plausibly
     sit inside their rules' own carve-outs — read the report's reasoning before touching either.

- [ ] 2026-09-23 [task] [docs] **The audits only covered GDD, ADD and the conventions** — TDD, AUDIO and DECISIONS are unaudited
  why: the same doc-vs-code drift that produced 18 findings across GDD and ADD almost certainly exists in
  `docs/TDD.md`, `docs/AUDIO.md` and `docs/DECISIONS.md` — ADR-009 is already known to describe a removed
  block family. Run the same pass over them before trusting any of the three.

- [x] 2026-09-23 → 2026-09-23 [bug] [client] **Forward judder — the chase camera's axis split** — **DONE; `3b50857`; issue #212 closed**
  why: the ship "kept juddering back and forth" flying forward while strafing stayed smooth. Three sessions
  of hunting treated the axis split as a clue about *where the variance was*; it was the cause. `chase.ts`
  copied the ship's x exactly but smoothed its z, so the camera lagged in z by a frame-rate-dependent amount
  and every wobble in frame time read as the ship sliding. Now `cam.position.z = p.z - followBack`, with the
  follow *distance* smoothed instead. Ship-to-camera z swing over 900 frames: hitch 0.446u → 0, vsync beat
  0.145u → 0, jitter 0.184u → 0. `chase.test.ts` locks all three at < 1e-9.
  **Still open, separately:** the frame-time variance itself, which now costs smoothness of the *world*
  rather than of the ship. `R` unmounts the rearview pass (`ec5c780`) to A/B the loudest suspect against
  the FPS readout's `max` field. Needs the owner's own browser — not headless Chrome (SwiftShader) and not
  an extension-driven tab; both misreport frame time.
  **Also found, not fixed:** the spectator camera lags in z, and no test covers it → #313.
  **Also found, not fixed:** the fixed step drops accumulated time on a hitch → #312.

- [~] 2026-09-23 [feature] [procgen] **De-quantise the silhouette — nothing in the field may repeat one size**
  why: the owner flew the track and said the blocks read as *"a vertical grid with a block and space"* — a
  4u block, a 4u gap, repeating. Measured (seed 12345, 400 segments): 44% of blocks fell in 2.6–4u and the
  ceiling was 12u. Three stacked quantisers, each in a different file. The [x] item is the first one closed;
  the others are the same bug at other layers.
  1. [x] **Wall blocks** — `fbd1165`. `WALL_NOISE_FZ_LANE` was 1.0, so `valueNoise2D` sampled the lane axis
     on its lattice nodes and adjacent lanes were uncorrelated → runs one lane long. Plus a
     `BLOCK_MAX_LANES` chop at 12u and a ≤18% inset. Now lane frequency 4.0, no chop, and `carveRun`
     splits a run into continuous 4–20u chunks with continuous 2–9u gaps. Measured after: continuous
     4–20u, no width above 3.4% of the field, 21.6% at 12u or wider (was 0%). Guarded by two tests in
     `block-depth.test.ts`.
  2. [ ] **Gap-deck blocks never got the carve** → #311.
  3. [x] **Every monolith in the field was the same object** — `568c523`. One shape (`shapes: [ 'box' ]`,
     `width: 12, depth: 12, height: 50`) and mirrored pairs pushed at the same z with no spacing jitter.
     Each side now walks its own sequence, phase-offset by half a spacing; spacing takes a 0.55–1.6
     jitter; one in seven is dropped; each monolith draws its own width/height/depth multiplier and a
     push back off the rail; the unused `obelisk` shape joined the mix. Sizing rides the instance
     transform through a new `placedShape`, so instancing and the seam are unchanged.
     **Still owed: the flythrough gate** — the headless frame tap only proves the start-line view.
  4. [ ] **Block height is the last fixed axis** — every block exactly 8u. Gated: the vertical-reach check
     is still missing from the validator, and GDD §0 puts 8u *"above double-jump reach on purpose"*. Build
     the check before varying it. Carried from `HANDOVER-corridor-closing.md`, now folded into `.claude/phases/worklog.md` (Legacy handovers; `git show 11b74ca:.claude/phases/archive/HANDOVER-corridor-closing.md`).
  **Budget note:** the carve freed a lot of headroom — worst case per streaming window went **224 → 136**
  against `BLOCK_LIMIT` 320 (measured, 9 seeds). The handover's "headroom is thinner than it looks" warning
  no longer holds, so `WALL_DENSITY_MAX` or a smaller `BLOCK_SPLIT_GAP_MIN` are affordable if the field
  wants to be denser.
  **Method that worked, keep using it:** measure the width histogram before touching anything. Every
  quantiser here was invisible to reasoning and obvious to a histogram — same lesson as the handover's
  *"every design belief here was wrong until measured."*

- [x] 2026-09-21 → 2026-09-21 [feature] [art] Test level setup — a fixed scene for doing art work in — **DONE; #192; visual gate PASSED 2026-09-21** (renders + flies + finish gate in view; console clean)
  why: the four art items below all need somewhere to look at the thing being built. `/art-lab`,
  `/art-gallery` and the `/iso-*` routes were deleted 2026-09-21 and stay deleted; `/env-lab` and a hosted
  `/game/:roomId` room are what is left. A procgen-seeded race track is the wrong surface for judging a
  block finish or an exhaust — it changes under you and you cannot park the camera. **Prerequisite: do this
  first.**
  **RESOLVED:** neither of the two options in the original open question. `/test-level` is a local flyable
  mirror of the real game scene with the netcode removed. The room-independent half of `NetCanvas` was
  extracted to `<WorldScene track>`, which **both** canvases mount — so there is no second renderer to
  drift, which is what killed `/solo` (`52f5a04` removed it as a duplicate scene, not for being local; the
  CLAUDE.md line needs amending to say so). Track = fixed procgen seed `20260921`, `length: 40` → finishZ
  800, 67 blocks, 2 gaps, 8 plain segments. `d.length` IS wired (`sim/track.ts:337`); `tier` is not — the
  ADR-001 note below is half stale. The authored provider stays unbuilt and belongs to #24. Dead
  `flightSystem` (no track → no collision) replaced by `localFlightSystem`. As-built:
  `.claude/phases/2026-09-21-test-level.md`.
  **Still owed:** the CLAUDE.md `/solo` wording amendment (owner).
  **Updated 2026-09-23:** the two placeholder block families are gone — `LETHAL_SURFACE`/`DRAG_SURFACE` no
  longer appear anywhere in `apps/client/app`; blocks render as the sealed art family. `/env-lab` is also
  gone (deleted 2026-09-22 with the lighting strip, issue #196), so `/test-level` and a hosted
  `/game/:roomId` room are what is left to look at art in.

- [ ] 2026-09-21 [feature] [art] Scene lighting to the new golden reference
  why: `docs/art-direction/golden-reference/` now carries two approved lighting states —
  `action-lighting.png` and `cruise-lighting.png` — and `README.md` says of the action image:
  *"Reconcile hue and tonal balance against the newly approved background board; cruise HUD accents still
  need matching."* Also *"the background board governs the newly approved hue and tonal balance;
  golden-reference colour reconciliation remains pending."* So the lighting target moved and the in-game
  scene has not followed. Depends on the test level.

- [ ] 2026-09-21 [feature] [art] Track art — deck surface, wear, rails
  why: `docs/art-direction/README.md` Track row: *"The owner's explicit attachment governs deck detail and
  wear. The featureless clean diagnostic was not selected. Subject boards await reconciliation."* Confirmed
  set is `golden-reference/action-lighting.png` (detailed deck) + `track/flush-border-rails.png` ·
  `surface-wear.png` · `material-baseline.png`. Current in-game deck is the near-black floor from the S6
  polish pass (art issue #1) — flat, not the approved detailed/worn deck. Materials map through
  `docs/ART_MATERIALS.md`; widths and clearances through GDD §0, never the boards.

- [ ] 2026-09-21 [feature] [art] Vehicle art — Split Crown first
  why: Split Crown is the developed one — `vehicles/split-crown/` has both a concept sheet and an
  **approved material study** ("Selected design and dark coated-metal finish"), where Comet has only a
  concept sheet. Two blockers named in the package before a proposal is even drafted:
  `README.md` — *"Scene integration and exhaust remain unresolved"*; and the draft workflow says
  *"consult the open vehicle issues and review checks: Split Crown exhaust attachment and colour drift are
  unresolved. Existing integration drafts are not approved for rollout."* Ships today are the CC0 Quaternius
  models; a bespoke Split Crown has to keep the per-ship AABB footprint contract
  (`halfW`/`halfL` in `@slur/shared/ship-classes.ts`) or collision changes with the art.

- [ ] 2026-09-21 [feature] [art] Non-destructible block art
  why: `ingredients/blocks/non-destructible/surface-details.png` "governs the current non-destructible
  finish"; `v1-context.png` is explicitly *"historical context only: its destructible family, tall/stacked
  examples and superseded forms are not current non-destructible construction instructions"* — so the V1
  board must not be read as a spec. In-game these are still the S3 open-scatter instanced cubes. Blocks may
  be any size (CLAUDE.md #11); the load-bearing constraint is threadable clearance at every z-slice, so the
  art must not grow the collision box.

- [x] 2026-08-06 → 2026-08-07 [feature] [slice] S1 — Flight feel (local, no network) — **DONE; human gate passed 2026-08-07 ("controls are good")**
  Code is source of truth (`@slur/shared/src`, `apps/client/app/game/`); spec + as-built reconcile: `.claude/phases/2026-08-06-s1-flight-feel.md`. Jump = derived (GDC "Building a Better Jump").
- [x] 2026-08-06 → 2026-08-08 [feature] [slice] S2 — Networked flight (server-authoritative) — **DONE; human gate passed 2026-08-08 (two browser windows, both players visible + smooth)**
  Code is source of truth (`@slur/shared` schema + `simulate()`; `apps/server/src/rooms/run-room.ts`; `apps/client/app/net/` + `app/game/net-canvas.tsx`). Spec + as-built reconcile: `.claude/phases/2026-08-07-s2-networked-flight.md`. Reconnection (`allowReconnection(20)`) landed here, not S4.
- [x] 2026-08-06 → 2026-08-09 [feature] [slice] S3 — Track, hazards, collision — **DONE; obstacle redesign + AABB + 5-class ships (commit `12049bd`); 18 shared tests GREEN; feel-gate playtested (Freighter capped)**
  why: built on the shared sim → auto-networked, no port. Deterministic seeded track (**4u cell grid**) + finish gate, **open-scatter cube fields + gaps**, **AABB collision** + death/respawn; client instanced track/cubes + edge-rails + bloom + per-class Quaternius models.
  As-built: S3 arc `.claude/phases/2026-08-09-collision-aabb-jump-vfx.md` (pt.1–5) + original `.claude/phases/2026-08-08-s3-track-hazards-collision.md`. Design captured this session: GDD §5.5 (5-class matrix), §5.2/§5.7 (straight-ribbon + no-moving-geometry constraints; hand-authored levels + two-floor validator; mechanic menu + BC1–8). **Next: S4.**
- [x] 2026-08-09 [feature] [task] AABB collision + obstacle redesign + 5-class ship matrix — **DONE; typecheck/build/18 shared tests GREEN; human feel-gate ACTIVE**
  Landed together (one arc): **4u cell grid** (16-lane/64u track, 5-cell segments); **open-scatter cube fields** (discrete 1×1-cell un-jumpable pillars — strafe/destroy, never hop) replacing track-wide walls; **platform archetype cut** (clean gap→jump / block→strafe split); **AABB×AABB collision** (Minkowski, footprint = model box) + generous grounded rule; **per-ship FlightTuning** resolved server + client from a shared `ship-classes.ts` registry (Class = mechanics group, Ship = cosmetic variant); **5 classes wired** (Interceptor/Fighter/Comet/Phantom/Freighter) with the 5 CC0 models (WYSIWYG scale/lift) + dev **hot-swap keys 1–5** (`setClass` message, server-authoritative). GDD §5.5 rewritten; full as-built in `.claude/phases/2026-08-09-collision-aabb-jump-vfx.md` (pt.1–4). **Feel-gate findings:** imperial/Freighter too big → capped (2026-08-09).
- [x] 2026-08-10 → 2026-09-26 [idea] [procgen] Audio-driven track generation — a SONG as a beat-timeline source — **DONE as #253** (song-shaped tracks: beat analysis + `/tapper` recorder). The track-as-score direction continues in ADR-020 and #300.
- [ ] 2026-08-09 [feature] [infra] Ship-content pipeline: code registry → JSON → DB → #23.
- [x] 2026-08-09 [feature] [infra] Track provider + anchors + grammar + validator (post-S4) — **ADR-001 and ADR-002 shipped; ADR-003 superseded by ADR-006; ADR-005 validator → #24**
  Build order is dependency-driven, NOT ADR-number order (see the DECISIONS "Build sequence"):
  1. [x] **ADR-001** provider decoupling — **SHIPPED (PR #46, 2026-08-10).** `RunState.seed` → nested
     `TrackDescriptorState`; `resolveTrack(descriptor) → Track`; seed procgen-internal; ADR-004 comment
     cleanup folded in. Geometry byte-identical. **Corrected 2026-09-23:** `length` is wired end to end;
     only `tier` is still unwired — it is carried on the wire (`schema.ts:56`) and hardcoded to 0 at
     `sim/track-provider.ts:16`, read by no generator code.
  2. [x] **ADR-002** anchors — **SHIPPED (PR #47, 2026-08-10).** `Track.anchors: Anchor[]` (procgen emits;
     pickups = `anchors.filter(kind==='pickup')`; `corridorCenterX` internalised). **Visual seam FROZEN**
     (rule only, ADD.md §12; §6 points to it). `pickupTaken` keys unchanged.
  3. [ ] **ADR-005** `validateTrack()` FIT + GAP-REACH → #24.
- [x] 2026-08-06 → 2026-08-09 [feature] [slice] S4 — Session flow → complete Race — **DONE; human gate passed 2026-08-09** (two-tab playtest: full lobby→race→results→Play Again + spectate; commits `fc0418f`/`d155481`/`e5eb5f9`)
  **Polish deferred:** reconnection under the phase machine → #14. Spectator drop/reconnect and empty-room
  dispose mid-navigation → #15.
  why: makes it "a game". **Round-based** (superseded drop-in-beside-pack for Race): server 4-phase lifecycle
  (lobby→countdown→racing→finished; host GO / Play-Again; finish + grace-timer→standings incl. DNF; restart);
  **join policy is per-mode** — Race locks the field at GO (late join → spectate the round, cycle-any-racer),
  Survival keeps drop-in-beside-pack (S7, via the `shouldSpectateOnJoin` seam); live **room list** (built-in
  `LobbyRoom` + `enableRealtimeListing()`); client landing → `/game/:roomId` (phases are OVERLAYS over one
  persistent Canvas, not routes); lobby ship/colour pick + hero-orbit 3D preview (reuses main scene), results.
  **Status:** B1–B3 DONE + committed (`fc0418f`; typecheck + 28 shared tests + headless E2E GREEN) = shared race
  director + schema (+name/colorId/spectating/hostId/countdown/finishDeadline), server lifecycle + host authority
  + room list, client shell/routing. **B4** (overlays/spectator/preview/leave-guard) building in a subagent.
  **B5** = docs reconcile (GDD §1/§3/§4 + CLAUDE.md tagline + this line — DONE). Full spec:
  `.claude/phases/2026-08-09-s4-session-flow.md` + `…-s4-batch4-spec.md`. (Reconnection landed in S2 — verify/harden.)
- [x] 2026-08-06 → 2026-08-10 [feature] [slice] S5 — Combat & power-ups — **DONE; human gate passed 2026-08-10** (two-tab: fire → bolt → hit → spark + stun-flicker). Functionality locked; visuals polish deferred.
  why: the "mess with your friends" payload — after the loop works. shared: pickups + roster (Bolt/Mine/Shield/**Boost**…), server-authoritative hit detection, disruption (stun/spin), auto-lock-nearest; client: instanced pickups, combat VFX + threat-warning HUD, held-powerup HUD. **Includes the rearview mirror camera** (2nd render pass → RenderTexture on a HUD inset; main Loop takes render priority) — needed to see tracking projectiles from behind. Design note in S1 phase doc.
  **NOTE (2026-08-09):** Boost was REMOVED from base flight (was Shift-held overdrive) and the energy meter cut — Boost is now a S5 **pickup** with its own charge/duration (the `E`/`usePowerUp` input is reserved for it). Don't rebuild base-flight boost.
  **NOTE (2026-08-09):** **BC1 (server-sim dynamic entities — projectiles/mines/drops/decoys) is the KEYSTONE** that unlocks the whole "mess" half. Full curated mechanic menu + base-capabilities BC1–BC8 in **GDD §5.7**. Design locks: straight-ribbon (no turning), no autonomous moving geometry (switches OK), balance is playstyle-level. **Tractor REDEFINED** = momentum leech (drain targets' speed, add to self — the Freighter's signature tool).
  **Shipped (C1–C4c, `dev`):** BC1 server-sim projectiles (`MapSchema<Projectile>`, interp-only) + **Bolt** (dumb forward, owner-immune AABB) → **stun** (BC2; `stunTimer` SimShip field, predicted) → the track does the killing; track-placed **pickups** (deterministic, hazard-aware, single held slot, `E` = discrete `USE_POWERUP` message); server-authoritative `stepWorld` hits + pickup grab/respawn + race-boundary clear; client instanced+interpolated bolts/pickups, `heldPower` chip, **hit-spark**, on-ship **stun-flicker**, **threat-warning HUD**. Opening move: room→world bridge extracted to `net/attach-room-to-world.ts`. Full as-built + reconcile: `.claude/phases/2026-08-09-s5-combat-powerups.md`.
  **Deferred fast-follows:** auto-lock-nearest (BC8) → #18. Wider `BOLT_HALF`/aim-assist → #21. Done: rearview
  mirror (#19), Mine/Shield/Boost pickups (#20), S5 hardening (#22).
- [x] 2026-08-06 → 2026-09-26 [feature] [slice] S6 — Identity: ship classes + audio + juice — **DONE**; remaining items closed as #7, #8, #9, #10, #31; the feel-gate #11 was replaced by per-feature checks on `/test-level`. Comfort sliders → #33. Pick-UI combat stats never shipped under #8 → #314.
  why: makes it feel like SLUR. **5 classes + per-ship flight/size/models ALREADY wired (S3 pull-forward; dev hot-swap keys 1–5).** S6 remainder = **`armour`/combat stats + a real lobby ship-pick UI** + audio pass (engine/hit/positional + synthwave) + art pass (TRON derezz, trails).
  **NOTE (2026-08-09):** ship taxonomy IMPLEMENTED — `@slur/shared/ship-classes.ts` (Class = mechanics group, Ship = cosmetic variant); per-ship `FlightTuning` incl. AABB footprint (`halfW`/`halfL`), resolved server+client by networked `shipId`. 5 classes + 5 models wired (footprints model-derived; Freighter capped) — GDD §5.5. S6 adds `armour`/`powerAffinity` to `ShipClass` + the pick-screen. Ship-content pipeline (code→JSON→DB) is the milestone above.
  **ARC (2026-08-10):** ideate+brainstorm DONE → `.claude/phases/2026-08-10-s6-identity.md`. Decisions LOCKED: **armour = per-class stun-duration multiplier** (sidegrade, agility⊥armour; `powerAffinity` DEFERRED); **audio** = three.js `PositionalAudio` singleton-outside-React + synth engine + Kenney CC0 SFX + CC-BY MacLeod in-run / Cynic CC0 lobby; **pick-UI** = upgrade existing lobby picker to show identity stats; **derezz** = dissolve-shader + keep burst; **environment pass** (pulled into S6) = Grid Void variant, **hybrid ribbon+tube-walls**, conservative post, `COLOR_COUNT` 8→12; **aesthetic** = TRON colour × Trek-Wars **de-rounded** geometry, palette **cyan × marigold** (magenta→player hue). `/solo` REMOVED; `/env-lab` prototype landed. Implement kicked off via 3 parallel worktree agents: **audio · landing-UI · procgen** (2026-08-10). Procgen plan: `…-procgen-weave-width-DRAFT.md`; env prototype: `…-env-lab-DRAFT.md`.
  **IMPLEMENT pt.1 DONE (2026-08-10, GREEN — 51 shared tests/typecheck/lint/build):** 3 worktree agents merged → **landing UI** (`15229e8`), **procgen v2** (`b54b837`, carved-corridor + variable-width walls, 40→51 tests), **audio** (`0471d02`), **integration fixes** (`b827f54`, pickups→racing-line corridor ~6→~60/track). LAN config (`93ec151`). As-built + deviations in the phase doc. **IMPLEMENT pt.2 DONE (2026-08-10, GREEN — typecheck/lint/build):** visual-polish pass closing art issues #1–#5 → **derezz dissolve** now shows on death (`cf397ab`, stopped hard-hiding the ship group; temp diagnostics stripped) · near-black track floor (#1) · readable in-game starfield (#3) · no stray origin cube (#2, pool parked at mount via callback ref) · **landing hero ship + TRON grid** (#5, new `landing-ship.tsx`); screenshot `slur.png` → new **root `README.md`**. As-built in the S6 phase doc.- [ ] 2026-08-06 [feature] [slice] S7 — hardening: LAN discovery → #16, reconnection → #14, perf for 8–12
  ships → #17, web hosting → #12.

- [x] 2026-08-07 → 2026-08-08 [research] [assets] Find CC-licensed X-wing-style / low-poly space-fighter GLBs — **DONE.** Chose **Quaternius "Ultimate Spaceships Pack" (CC0)**; 5 gltf ships added under `apps/client/public/models/ships/` (Git LFS-tracked). Poly Pizza X-wing/TIE results excluded as Lucasfilm IP; one Sketchfab CC-BY-NC excluded (non-commercial). `bob.gltf` wired into `/run`. Remaining: per-class assignment + neon material/team-colour pass (S6).

## Done
- [x] 2026-08-06 → 2026-08-06 [decision] [netcode] v1 mode = **Race** (finite, finish-line). Survival deferred to S7.
- [x] 2026-08-06 → 2026-08-06 [decision] [infra] Colyseus server **co-located on host laptop** (zero-setup office play).
