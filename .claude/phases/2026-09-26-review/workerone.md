# Review — server + networking (workerone)

Date: 2026-09-26. Read-only static review at HEAD `b8ad65b`+ (dev). Nothing was run live.
Scope: `apps/server/src/**`, `apps/client/app/net/**`, `apps/client/app/game/net/**`, and the wire types in
`packages/shared/src` (`schema.ts`, `sim/input.ts`), plus the direct callers needed to trace a path
(`game/net-loop.tsx`, `game/ecs/net-systems.ts`, `game/net-canvas.tsx`, `sim/fixed-step.ts`, `combat/*`).
Yardsticks: CLAUDE.md NN 1–15, `conventions/colyseus.md`, `conventions/netcode.md`,
`.claude/rules/colyseus-state.md`, `.claude/rules/netcode.md`, `docs/DECISIONS.md` ADR-000.
Library behaviour was read in `node_modules`: `@colyseus/core` 0.17.47, `@colyseus/schema` 4.0.30.

Counts: **P0 0 · P1 5 · P2 9**.

"Verified" means I read the code path at the lines quoted. "Inferred" means the mechanism is verified but
the size of the effect is not measured.

---

## P1

### P1-1 — The server input queue ratchets up and never drains: latency grows to 2 s

- `apps/server/src/rooms/run-room.ts:173-175`
  ```ts
  const input = this.queues.get( sessionId )?.shift();
  if ( input )
      stepRacer( this.raceWorld(), player, sessionId, input, dt, … );
  ```
- The server takes **one** input per 60 Hz tick. The client makes exactly one input per client fixed step
  (`game/ecs/net-systems.ts:40-41`, `predictor.record( input )`) and sends them in 30 Hz batches
  (`net/attach-room-to-world.ts:41`, `INPUT_SEND_MS = 1000 / 30`). The two rates are equal on average, so
  nothing pulls the queue back down. Each tick that finds the queue empty (for example after batch jitter)
  skips a step. The inputs that arrive late then stay one tick further behind, for good. The queue only
  shrinks when the client drops steps (`sim/fixed-step.ts:13`, `if ( n === maxSteps ) acc = 0;`). The only
  bound is `MAX_QUEUED_INPUTS = 120` (`room-input.ts:3`), which is 2 s of lag.
- Cost:
  - Remote players see this ship late.
  - Hits and pickups resolve against a stale position.
  - `reconcile` replays the whole unacked backlog on every patch (`net/prediction.ts:49-50`), so up to
    120 `simulate()` calls × 20 Hz.
  - Fire messages apply at the lagging server pose (see P2-6).
- Also, a ship with an empty queue does not step at all: no gravity and no timers.
- Rule: `conventions/netcode.md` §Tick Rates — *"Drain the per-player input queue inside the fixed step,
  applying each input"*. The convention's own loop uses `while ((input = player.inputQueue.shift()))`, not one
  per tick.
- Fix: in each tick, apply every queued input (each is one `FIXED_DT` step). Or apply one, plus one more
  while `q.length` > a small target such as 3. Log `q.length` in a hosted room to size the problem.
- Verified (mechanism). Inferred (magnitude). This could be P0 once measured.

### P1-2 — Reconcile starts from float32-rounded state; the server keeps float64

- `packages/shared/src/schema.ts:14-25` declares the ship state `float32`
  (`@type( 'float32' ) x = 0;` … `coyoteTimer`, `bufferTimer`), plus `stunTimer`, `respawnTimer` and
  `invulnTimer`.
- The `@colyseus/schema` 4.0.30 setter stores the raw JS number. `build/index.mjs:3488` has
  `set: function (value) {`, with no rounding. Only the encoder rounds (`_float32$1[0] = value`, `:184`).
  So the server keeps simulating in float64, and the client gets float32 copies.
- `net/prediction.ts:44` `copyShip( sim, snapshot );` then replays pending inputs from those rounded values.
  The replay therefore does not follow the server's path. Near z ≈ 8000 a float32 step is about 0.5–1 mm.
  Timer rounding can flip a threshold test (coyote, buffer, stun ≤ 0), and a position can flip an edge or
  block contact. Either gives a visible snap.
- Rule: ADR-000 invariant 4 — *"Determinism: identical materialization + identical `simulate()` across both
  JS engines"*. `conventions/colyseus.md` Gotchas — *"don't use synced floats for authoritative collision
  thresholds without epsilon."*
- Fix: after `simulate()` on the server (`room-bounce.ts:32`), round each synced float field with
  `Math.fround`. Then server state equals wire state, and both ends replay from identical numbers. The
  alternative is `float64` for the few fields that feed thresholds.
- Verified (mechanism). Inferred (how often it is visible).

### P1-3 — The client never handles the room closing or a failed reconnect

- `rg "onLeave|onDrop|onReconnect|onError" apps/client/app` finds no room handler. The only hits are
  `routes/pacing/scrub-layer.tsx` (a pointer handler) and `leave-button.tsx` (a click handler).
- `net/session.ts:4` holds the room on a module singleton, which is correct for NN-8. But nothing clears it
  when the server drops the seat: the 20 s `RECONNECT_SECONDS` expires (`run-room.ts:58`, `:312`), or the
  server restarts. The game then freezes on the last state with no message. `joinByLink` at
  `matchmaking.ts:34` (`if ( session.room?.roomId === roomId ) return Promise.resolve( session.room );`) goes
  on handing back the dead room.
- Rule: `conventions/colyseus.md` §For This Project — *"Client 0.17 auto-reconnects; cache
  `room.reconnectionToken` for manual `client.reconnect(token)` fallback."* The FOCUS list asks for
  reconnect and leave paths.
- Fix: in `enter()` (`matchmaking.ts:17`), register `room.onLeave( code => … )` once. It clears
  `session.room` when `session.room === room`, and routes to a "disconnected" state or the lobby. Add
  `onDrop`/`onReconnect` for a "reconnecting…" HUD flag.
- Verified.

### P1-4 — `useRunView` re-renders 10 overlay components at patch rate during a race

- `apps/client/app/game/net/use-run-view.ts:85` `offs.push( $( room.state ).listen( 'elapsed', rebuild ) );`
  and `:92` `perPlayer.set( sid, $( p ).onChange( rebuild ) );`. `rebuild` is
  `setView( readView( room ) )` (`:81`), a fresh object and array every time, with no equality check.
- `elapsed` changes every tick, and every racer's `onChange` fires every patch. So every hook instance calls
  `setView` about 20 × (1 + N) times per second. Each consumer installs its own full subscription set:
  `winner-card`, `countdown-overlay`, `colour-swatches`, `race-again`, `start-control`, `standings`,
  `room-title`, `roster`, `your-finish` and `spectator-bar` (`rg useRunView`).
  - Example: `countdown-overlay.tsx:6` reads only `.countdown`, yet re-renders on every ship move.
- Rule: NN-4 — *"No per-frame React re-renders in gameplay."* NN-10 — *"push every subscription DOWN to its
  leaf … so a change re-renders only that leaf."*
- Fix: copy the keyed store already built in `game/net/standings-store.ts:79-86` (`if ( nextKey === key )
  return false;`). Use one store per room with `useSyncExternalStore` plus per-field selectors
  (`countdown`, `hostId`, `phase`, roster key). Drop the `elapsed` listener unless a consumer shows a clock.
- Verified (subscriptions). Inferred (render count, not profiled).

### P1-5 — The colyseus rule and convention prescribe `@deprecated()`, which breaks this client

- `.claude/rules/colyseus-state.md:14-15` — *"Append `@type` fields, never reorder or insert … Dead fields
  get `@deprecated()`."* Also `conventions/colyseus.md:157` — *"Append only; mark dead fields
  `@deprecated()`."*
- Measured incident: `.claude/memory/deprecated-breaks-reflection-decoding.md` — *"`@deprecated()` on a
  Schema field breaks hosted rooms in this project … the reflected class leaves the deprecated field out.
  Every later field then sits one index too low on the client."* The client decodes by reflection
  (`matchmaking.ts:28`, `joinById< RunState >( roomId, { name } )`, no root class). The rule file loads
  automatically for anyone editing `schema.ts`, so the next dead field will repeat the incident.
- Live example: `schema.ts:45` `@type( 'uint8' ) heldPower = 0;` is dead (no reader or writer in
  `apps/` or `packages/`), and it is correctly kept plain.
- Rule: own judgment (the rule contradicts a measured failure).
- Fix: change the rule and the convention to *"keep a dead field as a plain `@type` field nobody writes;
  never `@deprecated()`, never delete"*, and cite the memory. Rule edits are the owner's call.
- Verified.

---

## P2

### P2-1 — `onDrop` repeats the cleanup that `onLeave` then runs anyway

- `run-room.ts:314-318`
  ```ts
  } catch {
      this.state.players.delete( client.sessionId );
      this.queues.delete( client.sessionId );
      this.reassignHost();
  }
  ```
- `@colyseus/core` 0.17.47 `build/Room.mjs:1060-1070`: when the reconnection rejects,
  `#_onAfterLeave( client, code, isDrop = true )` runs `if (isDrop && this.onLeave) { await this.onLeave(client, code); }`.
  `onLeave` (`run-room.ts:326-330`) does the same three things again. It is harmless today because each step
  is idempotent.
- Rule: `.claude/rules/colyseus-state.md:21-22` — *"If `onDrop` is defined, `onLeave` fires only for consented
  leaves — don't duplicate cleanup across both."* (The rule text is also stale: 0.17.47 calls `onLeave`
  after a failed reconnection too, as `conventions/colyseus.md:164` says.)
- Fix: make the `catch` empty and leave all cleanup to `onLeave`. Also `onDrop:313` `if ( p ) p.connected =
  true;` duplicates `onReconnect:322-323`. Keep one.
- Verified.

### P2-2 — A dropped host blocks START and RESTART for up to 20 s

- `run-room.ts:310` sets only `p.connected = false`. `reassignHost` (`:332-333`) keeps the host while
  `players.has( hostId )`, and START/RESTART are host-only (`:110`, `:113`).
- Rule: own judgment.
- Fix: in `reassignHost`, skip a host whose `connected` is false, and call it from `onDrop` and
  `onReconnect`.
- Verified.

### P2-3 — `'hit'` is a bare string literal on both ends; every other message has a shared constant

- Sites: `run-room.ts:212` `this.broadcast( 'hit', strike );` · `room-combat.ts:81`, `:98`, `:103` ·
  `net/attach-room-to-world.ts:226` `room.onMessage( 'hit', … )`. The payload type is also re-declared inline
  at `:226`.
- Rule: own judgment. It is the one message that `MINE_BURST_MESSAGE`/`BOUNCE_MESSAGE`-style constants do
  not cover, so a typo desyncs it silently.
- Fix: add `HIT_MESSAGE` and a `HitMessage` type to `@slur/shared` next to `BOUNCE_MESSAGE`.
- Verified.

### P2-4 — Game state is mutated from message handlers, outside the sim loop

- Sites: `run-room.ts:101` (`p.shipId = shipId`), `:106`, `:110` (`startRace()`), `:113`, `:128`
  (`firePower` spawns projectiles, seekers and mines), `:133` (`dropPower`).
- Rule: `.claude/rules/colyseus-state.md:20` — *"Mutate state only inside the sim loop."*
  `conventions/colyseus.md` Best Practices — *"Buffer inputs, apply in the loop."*
- The lobby-only ones (class, colour, start) cost nothing. The combat ones do cost something: see P2-6.
- Fix: push combat intents to a per-player command queue that `fixedStep` drains. Leave lobby messages as
  they are.
- Verified.

### P2-5 — Firing a mine where it cannot land spends the power and lays nothing

- `room-combat.ts:47` `spendPower( p, slot );` runs before `layMine`, which returns early at `:69` when
  `aimMine` fails. `combat/mine.ts:71`: `if ( y === null || insideStandingBlock( … ) ) return false;`
  (drop point over a gap or inside a block). No test asserts that this is intended
  (`mine-sync.test.ts`, `mine-drop.test.ts`).
- Rule: own judgment (gameplay). Check the intent with the owner.
- Fix: aim first, then spend on success only. Or broadcast a fizzle so the player sees why.
- Verified.

### P2-6 — Fire messages carry no input seq, so they apply at the server's lagging pose

- `net-canvas.tsx:48` `fire: ( slot, dir ) => room.send( USE_POWERUP_MESSAGE, { slot, dir } )` sends no seq.
  `run-room.ts:128` fires from `p` as the server has it now, which is `q.length` inputs behind the client's
  predicted pose (P1-1). With a deep queue, bolts and mines spawn behind where the player sees their ship.
- Rule: `conventions/netcode.md` §Combat — *"Client sends a fire intent: `{ type: "fire", aimVector/targetDir,
  clientTick, inputSeq }`."*
- Fix: stamp `seq` on the fire message and apply it when that seq is drained (this folds into P2-4).
  P1-1 alone shrinks most of the gap.
- Verified (mechanism). Inferred (visible offset).

### P2-7 — Stale pending inputs are replayed over the lobby and countdown pose

- At GO the server clears queues (`run-room.ts:148-150`, `:268-270`). At race end it stops draining, so the
  last one or two sent inputs are never acked. `net/prediction.ts:47-50` keeps them and replays them on
  every later patch. In lobby and countdown the `onChange` → `reconcileLocal` path still runs
  (`attach-room-to-world.ts:136`), so the local ship is replayed a few steps away from its slot until the
  next race's acks pass those seqs.
- Rule: own judgment.
- Fix: clear `pending` when `runPhase` leaves `racing`, or have reconcile skip replay when the phase is
  not racing.
- Verified (path). Inferred (visible only with throttle or strafe held at the finish).

### P2-8 — A backgrounded tab freezes its ship on the server, and the timer comment misleads

- `attach-room-to-world.ts:234` — *"Wall clock, not useFrame: sends must hold 30Hz when a backgrounded tab
  throttles rAF."* Inputs are only made inside `useFrame` (`net-loop.tsx:50-51` → `netFlightSystem`), so a
  throttled tab makes none, and the interval sends nothing. Together with the empty-queue skip
  (`run-room.ts:174`), the ship hangs mid-air with no gravity and frozen timers until focus returns.
- Rule: own judgment. NN-14 asks that the one allowed comment say truthfully why the timer exists.
- Fix: decide the rule for a player with no input (step with the last input, or with `emptyInput`, after
  N empty ticks) and correct the comment.
- Verified.

### P2-9 — Small lifecycle edges

- `schema.ts:120` `descriptorReady` is `state.seed !== 0`, but the server seed is
  `( Math.random() * 0xffffffff ) >>> 0` (`run-room.ts:82`). A zero seed (odds 1 in 2³²) makes
  `waitForDescriptor` (`matchmaking.ts:56-66`) wait forever. Fix: draw from `[1, 2³²)`. Verified.
- `matchmaking.ts:37-41`: if `leaveRoom()` runs while `joinByLink`'s join is pending, `enter()` (`:18`) still
  sets `session.room = room` when it resolves. That leaves an orphan room that nobody leaves. Fix: after the
  await, leave and discard the room if `linkJoin` no longer points at this attempt. Inferred.
- `race/director.ts:15-16` `shouldSpectateOnJoin` returns `phase !== PHASE.lobby`, so a player who joins
  during the countdown spectates. CLAUDE.md says *"the field locks at GO and late joiners spectate."*
  Fix: align one or the other (the doc or `phase >= PHASE.racing`). Verified.
- Input validation (seq monotonic per player, seq ≤ 2³²−1 to fit `uint32` `lastProcessedInput`, message
  rate) is left to workerfour's #252 lane. Not duplicated here.

---

## Checked and clean

- NN-1: clients send inputs only. `sanitizeInputs` clamps axes and rejects non-finite values
  (`room-input.ts:5-18`).
- Sim and patch rates are independent: `patchRate = 50` (`run-room.ts:88`), and `setSimulationInterval` is
  fed through `createFixedStep( FIXED_DT )` with a max-steps clamp (`sim/fixed-step.ts:3-13`).
- The descriptor is in state; the client materializes via `resolveTrack( descriptor )`
  (`net-canvas.tsx:37`). No geometry goes over the wire (ADR-000 inv. 1).
- `@colyseus/sdk` with `getStateCallbacks` is used everywhere. `onLeave( client )` ignores the code, which is
  correct because it never branches on it.
- NN-8: the room lives on the module singleton `session` (`net/session.ts`). `attachRoomToWorld` inside
  `useEffect` only binds callbacks and returns a full unbind (`attach-room-to-world.ts:240-259`).
- Collections are bounded and pruned: projectiles, seekers and mines are cleared per race
  (`run-room.ts:248-260`); `blockBroken`/`pickupTaken` are bounded by track content.
- The remote interp buffers are capped (`attach-room-to-world.ts:66`, `:73`). `RENDER_DELAY_MS = 100`
  (`net-systems.ts:35`) matches the convention's ~2× patch interval.

## Not covered

- Timing and behaviour on a live hosted room (no stack run, by lane rule).
- `packages/shared/src/combat/*` internals beyond the fire and mine entry points, `race/director.ts` beyond
  `shouldSpectateOnJoin`, and the server test files (read only for intent checks).

## Top 5

1. **P1-1** input queue ratchet: fixes latency, hit accuracy and replay cost together.
2. **P1-3** client has no `room.onLeave`: a server restart or a lid-close past 20 s strands the player.
3. **P1-2** float32 reconcile start: one `Math.fround` pass on the server restores ADR-000 inv. 4.
4. **P1-4** `useRunView` patch-rate re-renders: NN-4/NN-10; the keyed store pattern already exists.
5. **P1-5** `@deprecated()` rule: a one-line owner fix that prevents a repeat of the #223 decode break.
