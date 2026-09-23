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
