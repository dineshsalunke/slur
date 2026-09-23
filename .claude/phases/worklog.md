# Work log — multi-agent harness

Last summarised: e656f1820326403f5bcc4e3b57d6e09a1c8dcc24 · 2026-09-23

Newest run first. Each run covers handover commits after the previous `Last summarised` SHA.
Source of truth for any detail: `git log -p -- .claude/handovers/<agent>.md`.

## Run 1 — 2026-09-23 (covers d595f9b..e656f18)

The harness (`.claude/handovers/`, `CLAUDE.local.md`) went live at `d595f9b`. Four workers ran in
herdr panes under `slur-supervisor`: workerone (perf), workertwo (#214 fractured blocks), workerthree
(#219 homing seeker), workerfour (main menu art).

### workerone — fps regression bisect + parked #213 leftovers
- Landed: memory note on headless Chrome starving the GPU (`042db00`).
- Earlier #213 work cited in the handover: respawn probe on gap edges (`7928739`), spark on predicted
  bounce (`afb2642`), marigold hit sparks (`8b4d950`). Parked-work handover:
  `.claude/phases/handover-bounce-leftovers.md` (`6efa656`).
- Decided: no code regression caused the sub-15fps report. Frame time at HEAD (`38b4fb8`) is 20.3ms,
  against 20.1/21.0/21.6ms at three earlier commits (`a50049f`, `ec5c780`, `c47c532`) — flat. Cause is
  GPU contention from agents' own uncapped headless Chrome tabs plus DPR-2 fill cost (HEAD alone 20.7ms,
  with one rival tab 40ms). DPR 1 is 8ms, DPR 2 is 20ms: the frame is fill-bound, not JS-bound.
- State at last seam:
  - All headless Chrome instances and scratch dev servers (ports 5181-5185) killed.
  - Suspected-but-cleared meshes (pickups, embers, hit spark, fractured/debris/sealed blocks) each cost
    ≤2ms hidden — noise, not the cause.
  - Scratch perf harness (`<scratchpad>/perf/*.mjs`) was not committed; rebuild if needed via a GL draw
    hook on `WebGL2RenderingContext.prototype` plus `window.__THREE_DEVTOOLS__`.
- Open: owner to pick among DPR cap 1.5 / adaptive DPR, a lower-res rearview (~4ms), and
  `Environment frames={Infinity}` → 1. Owner go-ahead still needed for an ADR-014 note (bounce vs. death
  cost) and two new issues (graze randomness in `step.ts`; a pocket trap at seed 1, z≈6019). #213
  leftovers not yet assigned: no bounce spark broadcast for remote ships; spark width/brightness look
  pending; `explosions.tsx` death burst still off-palette (cyan/magenta).

### workertwo — fractured blocks (#214)
- Landed: shared sim + server smash-through and swept bolt-vs-block (`523d63c`); client prediction and
  `/test-level` combat via shared `combat/combat-step.ts`, issue #217 (`b6f1f45`); fractured-block
  geometry/shader, second instanced mesh, falling debris (`8c9afaf`); a dev-panel DPR slider used across
  `/test-level` and hosted rooms (`248096d`); docs — ADR-015 (accepts ADR-009 with two amendments), the
  ADR-009 status line, GDD updates (`215159e`).
- Decided: ADR-009 was edited in its Status line only, per precedent at `docs/DECISIONS.md` line 144;
  body unchanged. workerone's fps verdict cleared `8c9afaf` of causing the frame drop.
- State at last seam:
  - Client tests 198/198 passing at `248096d`.
  - DPR slider verified: canvas buffer 3200→800→2000→3200 for dpr 2/0.5/1.25/2 at device ratio 2.
  - Crack reads at ~20-50u in headless stills; race-speed readability `[unmeasured]`. Smash cost ~0.2s,
    calculated not played, `[unmeasured]`.
- Open: step 5 is an owner eyes-on gate — play `/test-level` at race speed, judge sealed vs. fractured
  readability in ~0.5s, then smash/shoot one in a hosted room. Also open: do sealed blocks stop a bolt
  (built as yes); one `smashKeep` value for all ships or cheaper for Freighter (built as one value); add
  a marigold ember burst on break, or is the crack glow enough.

### workerthree — homing seeker (#219)
- Landed: ADR-017 draft plus issue #219 filed (`d0b2e61`); shared sim — `combat/seeker.ts`
  (`lockTarget`/`lineOfSight`, `aimSeeker`, `stepSeeker(s)`, `inTerminalWindow`), pickup-power hashing,
  `seekerGate`, `Seeker` schema, `SimConfig` seeker fields, `HeldPower.seeker` (`5771ee3`); server wiring
  — `fireSeeker`, `stepSeekers` in `stepWorld`, hit/miss/blocked event handling, seeker clear on reset,
  two new tests (`dfae252`).
- Decided (recorded in ADR-017): a no-lock fire is wasted; a block in the dive destroys the seeker (and
  a fractured block with it); only `/test-level` is tunable, hosted rooms stay on `DEFAULT_SIM_CONFIG`;
  one seeker in flight at a time; target is the nearest visible ship ahead with a line-of-sight test;
  speed 120 / turn 40 / TTL 6s, all tunable; dodge is a jump or a last-moment strafe; owner wants it
  "harder to shake"; marigold colour, not the board's red-orange (a possible Claude-side departure note
  for Codex may be needed, ART_MATERIALS.md §7 shape).
- State at last seam (`903d3a5`): shared 189 tests pass, server 9 tests pass, `pnpm typecheck` clean
  across all three packages. Biome flags a new line-limit warning: `run-room.ts` is 323 lines (limit
  300), pending a split into a new file. Server fires/steps/resolves seekers; client does not render
  them yet; `/test-level` still uses `OPEN_SEEKER_GATE` and does not step seekers.
- Landed after that seam (post-harness, still lane #219, not itself a handover commit):
  `e656f18` moved power-firing and seeker events out of `run-room.ts` into `room-combat.ts`, addressing
  the line-limit split flagged above.
- Open: client needs `onMessage` handlers for `SEEKER_HIT_MESSAGE`/`SEEKER_MISS_MESSAGE`
  `[unmeasured]` whether the SDK warns without them; a bigger impact burst needs `hit-spark.tsx`, which
  is not workerthree's file (ask first).

### workerfour — main menu art (blocked)
- No commits landed. Blocked on the "impeccable" Claude Code plugin: marketplace added, plugin not
  installed. Waiting on the owner to run `/plugin install impeccable@impeccable` or say "go without it".
- Held files (read-only until unblocked): `ui/button.tsx`, `ui/panel.tsx`, `lobby/room-list.tsx`,
  `routes/home/*`. Target: match `docs/art-direction/golden-reference/cruise-lighting.png`.

### slur-supervisor — coordination
- Landed: initial harness handover at `d595f9b` documenting how supervision works (herdr pane mapping,
  context-watchdog thresholds 150k warn / 250k hard stop, the seam→clear→resume cycle); a follow-up
  update (`2b091e3`) recording each worker's state after being cycled through `/clear`.
- Decided: workerone and workertwo were cleared and resumed from their handovers (`8ff52bd`, `cbf3de6`)
  once idle and committed. ADR-015 reserved for workertwo (#214); ADR-016 reserved for workerone if the
  #213 retune proposal proceeds. `docs/art-direction/` confirmed read-only for every agent.
- State at last seam: workerthree's seeker step 2 files were uncommitted at write time
  (`packages/shared/src/combat/*`, `sim-config.ts`, `schema.ts`, `ship-classes.ts`, `index.ts`) — landed
  moments later as `5771ee3`.
- Open owner decisions carried in the supervisor's handover: death-explosion colour (cyan/magenta vs.
  marigold or per-player hue, `game/scene/explosions.tsx:21-22`); the #213 retune verdict (no retune
  proposed); `PICKUP_RESPAWN_S = 3` making the respawn invisible to the leader; mounting `<HitSpark/>`
  on `/test-level`; whether to push `dev` (not pushed as of this run); issue #216 (respawn can land
  inside a block) still unassigned; whether to change the context-watchdog hook text to point
  non-lane sessions at `CLAUDE.local.md` §5 instead of "tell the user to /clear".

## Legacy handovers (pre-harness, folded 2026-09-23)

Folded from 22 `HANDOVER-*`/`handover-*` notes, deleted in the same commit. Recover any one with
`git show 11b74ca:<path>` (PRE = `11b74ca2a94d1f2d20f09feb787e1e2503b88798`).

### Fractured blocks — `HANDOVER-fractured-blocks.md` (#214) · live
- Landed: shared sim smash + swept bolt-vs-block (`523d63c`); client prediction + `/test-level`
  combat via `combat/combat-step.ts` (`b6f1f45`); fractured-block geometry/shader + pooled debris
  (`8c9afaf`); dev-panel DPR slider on both canvases (`248096d`); step 6 docs (ADR-015, GDD §5.7,
  INDEX) landed, no SHA recorded in the note itself.
- Decided: sealed blocks eat a bolt (built as yes); one `smashKeep` value for the whole roster, not
  per class; ADR-015 accepts ADR-009 with two amendments (slow blocks gone, ADR-014 bounce).
- Open at hand-off: step 5 — owner plays `/test-level` at race speed, judges sealed vs. fractured
  readability, then smashes/shoots one in a hosted room; verdict goes in ADR-015's readability gate.

### Back-fill — `HANDOVER-back-fill.md` (#170) · live
- Landed: `SEALED_BLOCK_METALNESS` 0.9 → 0 (`e45bdaf`), unblocking block diffuse and the wear dial.
- Decided: the back-fill light was already correctly aimed — it was never the bug; metalness was.
- Open at hand-off: raising `Fill.intensity` enough to read as cold light costs the asteroid field's
  look, an owner call across two lanes (priced next in `HANDOVER-fill-cross-lane.md`); the same
  measurement on monolith/deck was still unrun (run next in `HANDOVER-deck-vs-rail.md`).

### Deck vs rail — `HANDOVER-deck-vs-rail.md` (#162) · done, recommends closing
- Landed: none — measurement only, no source change.
- Decided: #162 does not reproduce and the ratio is inverted — the rail is 1.9-8.2x the deck, not
  the reverse; 78% of the monolith face's apparent light is bloom spill, disproving the back-fill
  note's band-mirror theory.
- Open at hand-off: recommends #162 close as not-reproducing, left for the owner; the open half of
  #170 (cold light on player-facing faces) still unresolved.

### Fill cross-lane pricing — `HANDOVER-fill-cross-lane.md` (#170) · done
- Landed: none — measurement only, no source change.
- Decided: raising `Fill.intensity` to buy ~10 levels of blue on a block face also pushes asteroid
  rubble to 2x the deck's brightness, crossing over at `Fill` ~0.8; recommends `Fill` 1 as the
  honest ceiling on this knob alone. Built a zero-camera-drift lighting A/B rig (live `setNum()`
  over CDP, no reload), SSIM 0.99992.
- Open at hand-off: the Fill-vs-asteroid tradeoff is still the owner's to call; `NearFill` at
  intensity 40 measured to contribute nothing to the deck, worth its own issue, unfiled.

### Block mechanics briefing — `HANDOVER-block-mechanics.md` · live
- Landed: none — briefing only, "nothing below is started."
- Decided: tuning-panel retirement ask was superseded — the panel was deleted then rebuilt on leva
  instead (`2026-09-22-lighting-strip.md`, `d44d324`).
- Open at hand-off: block collisions bounce-and-stop instead of killing was not yet built (shipped
  later as ADR-014, `6678600` — see `handover-block-bounce.md` below); organic 4u-8u block heights
  still not built, blocked on the single-slice clearance sampler at `sim/track.ts:414`.

### Block bounce, ADR-014 — `handover-block-bounce.md` (#213) · shipped
- Landed: blocks bounce instead of killing (`6678600`) — `blockPush`/`bounceOffBlock` in `step.ts`;
  `markDead` now fires only on `y < deathY`; `bounceBack`/`bounceStun` added to `FlightTuning`.
- Decided (owner): hit cost = bounce + brief stun, not pure bounce or N-hits-then-derez; falling
  still kills and respawns; bounce feel = hard stop + small shove, not a real ricochet.
- Open at hand-off: no VFX on a bounce (fixed next in `handover-bounce-leftovers.md`, `afb2642`);
  9u/s and 0.25s never played, both guesses; `respawn.test.ts` lost its block coverage
  (`blockDensity: 0`).

### Bounce leftovers — `handover-bounce-leftovers.md` (#213) · done, retune declined
- Landed: respawn probe on gap edges with blocks present (`7928739`); predicted bounce spark around
  `simulate()` (`afb2642`); hit sparks recoloured marigold with velocity-stretched streaks
  (`8b4d950`).
- Decided: measured a head-on bounce at 1.45s vs. the old death's 1.50s — recommend no intensity
  retune, record the numbers in ADR-014 (retune declined, pending owner sign-off at hand-off).
- Open at hand-off: graze outcome is random (sub-tick phase decides glance vs. stop, needs a
  threshold fix in `step.ts`); a pocket trap at seed 1, z≈6019 stun-locks a throttle-holder; remote
  ships get no bounce spark; `explosions.tsx` death burst still cyan/magenta, off-palette.

### Bolt art — `handover-bolt-art.md` (#218) · idle, awaiting assignment
- Landed: bolt pickup art, streak/embers and pickup-pose animation (`38b4fb8`); collect animation
  cut 0.32s → 0.13s on owner request (`9017e0f`).
- Decided: the fps scare was cleared — not a code regression, GPU contention from agents' own
  headless Chrome tabs at DPR 2.
- Open at hand-off: `PICKUP_RESPAWN_S = 3` respawns ~300u behind the player, effectively invisible
  (supervisor took the balance call); `/test-level` doesn't mount `<HitSpark/>`; the bolt look was
  only judged in frozen frames, never at speed.

### Ship hover and the track contract — `HANDOVER-hover-and-freighter.md` · done
- Landed: ship hover (`1e198a6`); track generates from a fixed contract, never the ship roster,
  ADR-013 (`a27955f`); Freighter top speed doubled to 124u/s (`b998e6c`); chase camera stopped
  cancelling the hover (`a50049f`).
- Decided: hover is always-on (not grounded-only), eased, and tunable; the contract's numbers are
  frozen bit-identical to the old roster-derived values, so no existing seed moved.
- Open at hand-off: GDD-DEVIATIONS §1.1 (`MIN_CLEAR` 7u vs. shipped `MIN_LANE` 8u) deliberately
  untouched, needs its own owner decision; GDD §5.5's class table has stale Freighter/Interceptor
  strafe numbers; Boost still doesn't exist.

### Metal and ship shadow — `handover-metal-and-ship-shadow.md` · shipped
- Landed: one metal family (`metal.ts` replaces `graphite.ts`, metalness 1.0 / roughness 0.25) and
  the ship contact shadow (`ship-shadow.tsx`), both at `c291941` (per `handover-block-bounce.md`,
  written the same session); `ART_MATERIALS.md` revision 7 records the departures.
- Decided (owner): shadow mechanism = blob decal per ship, not shadow maps or `ContactShadows`;
  metal scope = deck/rail/monolith/block/ship hull, asteroids stay stone; obstacle blocks confirmed
  as the same object as sealed blocks (metalness moved 0 → 1.0) — flagged as worth re-confirming.
- Open at hand-off: `Shadow.opacity` 0.8 / `Shadow.softness` 1.2 never re-verified against the
  `slur.tuning.v1` store — still unverified per `handover-block-bounce.md`; `ART_MATERIALS.md` §4
  criterion 2 re-gate not run; height fog still unbuilt, no issue filed.

### Session audit — `HANDOVER-session-audit.md` · done
- Landed: rearview perf A/B toggle (`ec5c780`); the forward-judder fix, chase camera copies z
  exactly (`3b50857`); 11 handovers archived plus INDEX/backlog corrections (`c3efa3a`); chase
  camera moved onto the tuning panel, 8 knobs (`4607b2b`); the owner's flown camera and environment
  defaults (`e64943c`).
- Decided: the judder's root cause was frame-time variance passing through a smoothed z, not the
  variance itself — fixed by copying z exactly and smoothing the follow distance instead.
- Open at hand-off: the spectator camera has the same class of bug but follows remote ships off the
  network interpolation buffer, so copying z would leak network jitter — needs an owner call; frame-
  time variance itself still unmeasured on a real GPU; `createFixedStep` discards accumulated time
  on a >83ms hitch, unfixed; TDD/AUDIO/DECISIONS unaudited.

### Atmospherics — `archive/HANDOVER-atmospherics.md` (#210) · closed 2026-09-23
- Landed: scene fog graded to the backdrop's horizon colour (`24bf931`, `03a28c8`).
- Decided: fog colour must track the backdrop image's measured horizon value, not an arbitrary dark
  colour — lives as `BACKDROP_HORIZON` beside `BACKDROP_URL`.
- Open at hand-off: asteroid belt renderer not yet built (shipped next, see below); rails fogged
  like everything else, an open look call; `Fog.far` 420 vs. 600 tradeoff open.

### Asteroids — `archive/HANDOVER-asteroids.md` (#211) · closed 2026-09-23
- Landed: faceted rock geometry via a displaced icosahedron (`ffa25fb`), fixing "reads as a sphere"
  and above-only floating; size cut and bands pulled inward; `fog={false}` on the asteroid material
  (root cause of "dark/flat" was `meshStandardMaterial`'s default `fog: true` against `Fog.far` 420).
- Decided: every band now sits below its printed size class in `ART_SCALE_REFERENCE.md` §5 — an
  open departure, flagged for the owner.
- Open at hand-off: "#211 should not close before #170" (rig gives player-facing faces zero light —
  addressed next in the back-fill/fill-cross-lane notes above); density/size still a taste call;
  whether the three bands read as three depth layers unanswered.

### Corridor composition briefing — `archive/HANDOVER-corridor-composition.md` · superseded
- Landed: none — briefing only, fully answered by the next note.
- Decided: five changes prioritized in dependency order (fix the clearance sampler first, vary
  block depth, let gaps and blocks co-occur, space demands by reaction time, phrase rest/build/
  spike/release, lengthen the test track).
- Open at hand-off: none — see `archive/HANDOVER-corridor-composition-done.md`.

### Corridor composition, done — `archive/HANDOVER-corridor-composition-done.md` · superseded
- Landed: all five briefed changes (`be6c95f`, `bf3ea85`, `4af25f5`, `309f007`, `5326eb6`,
  `5b4a8f9`) plus a `track.ts` module split (`1fc678c`).
- Decided: block depth capped at `SEG_LEN`, not the briefed 24u; a gap segment may carry one block
  on its back half via bounded generate-and-test.
- Open at hand-off: the visual playtest — the composed track still read boring on the owner's
  flight, root-caused next in the corridor-closing note; `track.ts` at 612 lines, near the warn
  threshold.

### Corridor closing — `archive/HANDOVER-corridor-closing.md` · done
- Landed: `track.ts` split into six modules (`1fc678c`); the corridor closes — open band, pinch
  gates, re-phrasing (`c47c532`); ADR-006 as-built note (`3562406`); block width/depth made
  continuous (`7e27250`).
- Decided: root cause of "boring" was `laneState` leaving every open lane un-blockable, so blocks
  were pure scenery — fixed with a real, briefly-solid pinch wall with one hole.
- Open at hand-off: the playtest itself, numbers say the corridor closes but feel is unverified;
  vertical-reach check still missing from the validator; `BLOCK_LIMIT` 320 headroom thinner than it
  looks.

### De-quantising — `archive/HANDOVER-de-quantising.md` · done
- Landed: wall blocks carve into continuous 4-20u chunks (`fbd1165`); backlog note on the four-
  layer bug (`4d938d1`); every monolith gets its own size, sides stop mirroring (`568c523`).
- Decided: three stacked quantisers caused the "grid with a block and a space" look — lane-frequency
  aliasing, a hard 12u chop, and a clamp-not-rerange width draw.
- Open at hand-off: gap-deck blocks never got the same carve, still exactly 3 widths in
  `gap-blocks.ts` — flagged as the next small task; block height still the one fixed axis (8u); only
  the start-line view was verified, no flythrough.

### Edge fall — `archive/HANDOVER-edge-fall.md` · done (mechanic 3 of 3)
- Landed: ships fall off deck edges — `deckLimit()`/`clampToEdges` removed on the track path,
  respawn clamped into `±deckLimit` (landed as `fc65986` per INDEX; this note itself predates that
  commit). Also fast-forwarded `dev` back after a 3-session branch mixup on `feat/asteroid-bands`.
- Decided: the no-branch policy lived only in a phase note `CLAUDE.md` didn't load — flagged, not
  fixed, at hand-off.
- Open at hand-off: `docs/GDD.md` needed two lines updated (the strafe-clamp sentence, edges added
  to the hazard list); the rail's visual meaning is an owner call, not engineering; the overhang
  band still needed a playtest.

### Exhaust — `archive/HANDOVER-exhaust.md` · shipped, judged on screen
- Landed: split-crown exhaust plume and engine light (`ea7aa5c`); the colour-ramp fix — colour now
  driven by intensity, not axial position (`dd24d04`), verified on screen.
- Decided: `BackSide` + `abs(dot(N,V))` chosen over billboards/particles/drei `Trail`/post-chain
  shafts/emissive-only, because the rear-view is a second camera pass over the same scene graph;
  `ExhaustField`/`EngineLight` moved to `useFrame` priority 0.25, fixing a lag bug caused by a
  stable-sort mount-order race at equal priority.
- Open at hand-off: `EngineLight` (deck streak/pool) tuning still unmeasured; the mirror-bloom
  question deferred.

### Forward judder — `archive/HANDOVER-forward-judder.md` (#212) · closed
- Landed: chase camera copies ship z exactly instead of smoothing it (`3b50857`); tuning-panel real
  mount/unmount toggle (`1294cca`); `FpsReadout` mounted, showing max-of-last-500ms (`4945b38`).
- Decided: the bug was variance passing through a smoothed z, not the variance itself — x was
  already copied exactly and so never showed jitter.
- Open at hand-off: the spectator camera has the same bug but follows remote ships off the network
  interpolation buffer, so copying z would leak network jitter — needs an owner call;
  `createFixedStep` discards accumulated time on a >83ms hitch, unfixed.

### HUD — `archive/HANDOVER-hud.md` (#209) · closed 2026-09-23
- Landed: the four-corner HUD (`hud-layer`/`roster-panel`/`flight-readout`/`power-slot`/
  `power-gem`) matching both approved golden-reference boards (`7996fc5`).
- Decided: per-frame values go through one `addEffect` writing `textContent` via refs, not React
  state/`useFrame`/`setInterval`/a koota query — weighed and recorded in the commit body.
- Open at hand-off: `/game/:roomId` still had the older cyan-panel HUD, not reconciled onto these
  components (the other half of #209); `» BOOST ACTIVE` and the threat HUD out of scope; the power
  gem is a flat SVG stand-in.

### Rearview branch consolidation — `archive/HANDOVER-rearview-branch-consolidation.md` · done
- Landed: committed `hud`'s in-progress exhaust work on the owner's instruction (`ea7aa5c`,
  `351544d`); corrected a false halfL/hitbox-mismatch claim in `HANDOVER-exhaust.md` (`37e70e0`,
  itself reset once after a shared-HEAD `--amend` collision, `47111c3`).
- Decided: `git commit --amend` is unsafe in a shared checkout — HEAD is shared, not just the index.
- Open at hand-off: the rear-view vertical flip is still an open owner decision; two stale, fully-
  merged branches (`art/hdri-picker`, `art/rail-lights`) safe to delete, owner's call; 33 commits
  unpushed on `dev`.
