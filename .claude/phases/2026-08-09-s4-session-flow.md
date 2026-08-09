# 2026-08-09 — S4: Session flow → complete Race

Slice goal: make SLUR **a game** — a full office run from *host launches* → *pack races* →
*winner on a results screen* → *play again*. Built directly on S2 networking + S3 track/finish.

## IDEATE (bird's-eye — in dialogue, not banked)

### Done-state (what "complete Race" means)
Host opens SLUR → creates a room (gets a code) → friends join by code → host hits **GO** →
countdown → everyone flies the S3 track → crossing the finish gate is recorded → when the race
ends the room shows **standings (winner first)** → host hits **Play Again** → back to a fresh run.
Late arrivals **drop in beside the pack** mid-race (the core tagline). Dropped clients reconnect
(already S2).

### What already exists (don't rebuild)
- `RunState.phase` field (0 lobby / 1 running / 2 finished) — but server only ever sets `1`.
- Per-player `finished` + `finishTime` **already stamped authoritatively** (`run-room.ts:85`).
  Finish *detection* is done; nothing *acts* on it (no room-level end, no standings).
- Spawn-beside-pack (`onJoin` staggers `x = players.size*4`).
- Reconnection window (`allowReconnection(20)`).

### The framing tension (Ideate's job to resolve)
"drop-in-anytime" vs "lobby→running→results" read as opposites but aren't: the reconciliation is a
**lightweight staging lobby** (host + early joiners pick ship/colour, host owns the GO) and
**drop-in applies to late joiners AFTER go** (they spawn beside the pack, no re-lobby). Open
questions below pin the exact model.

### OPEN QUESTIONS (resolve with user before Prep)
- Q1 Session model — lightweight-lobby+host-GO vs instant-drop-in?
- Q2 Race-end trigger — all-finish / leader-then-countdown / instant-on-first?
- Q3 Slice boundary — is the pretty ship-pick UI S4 or S6 (backlog says S6)? Colour in S4?
- Q4 Host authority — is "host" just the first client (seat 0), or a real role?

## BRAINSTORM

### MODEL CHANGE (user, this session): round-based, NOT drop-in-beside-pack
User re-specced: **room list → join/leave → host starts → everyone present races together →
late joiners SPECTATE until the round ends** (chase-cam), then join the next round. In-lobby you
pick your ship; **once the host starts, selection locks**.
**⚠ This CONTRADICTS the docs** (GDD §L7 "Join mid-run: new player spawns adjacent to the pack";
CLAUDE.md + backlog S4 "spawn-beside-pack"). It REPLACES that with a round/match model (Fall Guys /
kart-lobby). **Docs to update in Reconcile:** GDD §1/§2.1/§L38/§157, CLAUDE.md tagline, backlog S4 line.

### Resolved decisions (this + prior turn)
- Race end = **leader finishes → grace timer → results** (DNF ranked after finishers).
- Session = **staging lobby + host GO + countdown**; **full ship+colour pick screen** in S4.
- Restart → back to **lobby** (host re-hits GO). Player **names** = yes. Spectate = **chase-cam** (trimmable edge).

### Room listing — VERIFIED API (source-precedence: installed .d.ts)
- ❌ `client.getAvailableRooms()` — **REMOVED from `@colyseus/sdk` 0.17.43** (was in legacy `colyseus.js`
  0.16). Not on `Client` (checked `Client.d.ts`). Do NOT use.
- ✅ **`LobbyRoom`** — exported from `@colyseus/core` 0.17.47 (`rooms/LobbyRoom`). Client joins it, gets
  message `rooms: IRoomCache[]` (snapshot) + `'+' [roomId, IRoomCache]` (add/update) + `'-' roomId`
  (remove). **Live push, no polling.** `IRoomCache = { name, roomId, clients, maxClients, metadata }`.
- ✅ Game room pushes list changes via **`updateLobby(this)`** + `setMetadata({...})` (both verified
  exported / on `Room`). RunRoom sets `metadata = { hostName, phase, playerCount }`.
- ⇒ **No express, no `matchMaker.query` HTTP route needed.** `index.ts` just adds
  `gameServer.define('lobby', LobbyRoom)`. (`matchMaker.query()` verified as a fallback if ever needed.)

### Phase machine (server-authoritative, driven in sim loop)
`lobby(0) ──host 'start'──▶ countdown(field>0) ──0──▶ running(1) ──leader finish──▶ [grace]──▶ finished(2) ──host 'restart'──▶ lobby(0)`
- countdown: `RunState.countdown:float32`; inputs ignored until 0. Client renders `ceil()`.
- end: first finisher sets `RunState.finishDeadline = elapsed + GRACE`; running tick ends when
  `elapsed ≥ finishDeadline || all-connected-finished`.
- standings: client-derived sort `(finished desc, finishTime asc, z desc)`; no new state.

### Host authority
`RunState.hostId:string` (sessionId) — first joiner when empty; reassigned on host leave. `start`/`restart`
honored only when `client.sessionId === hostId`. Client shows GO/Play-Again when `room.sessionId===hostId`.

### Spectator (join mid-round)
`PlayerState.spectating:boolean` — set true in `onJoin` when `phase !== lobby`. Sim skips spectators
(no ship physics); client renders no ship + chase-cam on a racer (reuse `camera/chase.ts` targeting
another player). On `restart→lobby`, all spectators → active, re-pick.

### Ship/colour pick — locked outside lobby
Reuse server-auth `setClass`; add twin `setColor`. Both **rejected unless `phase===lobby`**. 3D preview
in the already-mounted `/game` Canvas (this is where "full pick screen" spends).

### Schema delta (APPEND-ONLY — wire footgun)
- `RunState +`: `hostId:string`, `countdown:float32`, `finishDeadline:float32`
- `PlayerState +`: `name:string`, `colorId:uint8`, `spectating:boolean`

### Client route map (per react-router.md "For This Project")
- `/` landing — join `LobbyRoom`, render live list + name entry + Host button (NO Three.js in bundle)
- `/host` — `client.create('run',{name})` → `navigate('/game/:id')` (event handler, NOT loader)
- `/join/:roomId` — `client.joinById(id,{name})` → `/game/:id` (or join straight from a list-row click)
- `/game/:roomId` — **layout owns `<Canvas>`**; lobby-pick / countdown / HUD / spectator / results are
  **phase-driven overlays**, NOT routes (navigating would remount Canvas — convention anti-pattern).
- Keep `/solo`. Retire `/run` into this flow. `requireRoom` guard on `/game` → redirect `/` if no session room.
- **Inherited fix:** join moves OUT of the clientLoader (S2's documented-anti-pattern-with-guards) INTO
  the Host/Join event handlers — the convention's preferred shape. Room lives on `session` singleton.

### Scope note (plan wide, ship narrow)
Big slice but coherent (user enumerated: list, join/leave, host-start, spectate, in-lobby pick). Trimmable
edge if it runs long: **spectator chase-cam** (user said "probably"). Everything else is core to "a game".

## PREP

### Locked semantics (this session)
- **4 phases:** `0 lobby · 1 countdown · 2 racing · 3 finished`. (Reassigns S2's 0/1/2 — safe pre-launch,
  atomic rebuild. Audit client `phase===1` readers.) Default `phase=0`.
- **GO is the single lock line.** `start` (host, phase must be lobby) → snapshot racers, reset them,
  `phase=countdown`, `countdown=COUNTDOWN_SECONDS`. Ships/picks frozen from this instant.
- **Countdown = prep only.** Sim decrements `countdown`; NO ship integration, NO input applied. At `≤0`:
  `phase=racing`, `countdown=0`.
- **Racing.** Only racers (non-spectating) simulated. First finisher sets `finishDeadline=elapsed+GRACE`.
  End when `elapsed≥finishDeadline` OR all racers finished OR `elapsed≥MAX_RACE` (safety). → `phase=finished`.
- **Join policy = per-mode seam.** Race: `phase!==lobby` ⇒ `spectating=true` (no ship). Survival (S7):
  spawn-beside-pack (keep `onJoin` stagger). One function `shouldSpectateOnJoin(phase)` marks the branch.
- **Restart** (host, phase finished) → reset all, `spectating=false` for everyone present, `phase=lobby`.
- **Seed:** ONE per room (onCreate), same track every round for S4. Per-round reseed = explicit follow-up
  (avoids mid-session client track rebuild / ECS reset risk).
- **Mode field:** NOT added to schema yet (one mode). Seam = server policy fn + comment. Revisit S7.

### Schema delta — APPEND-ONLY (packages/shared/src/schema.ts)
```
RunState  +  @type('string')  hostId = ''            // sessionId; '' until first join
          +  @type('float32') countdown = 0          // >0 only during phase 1; client renders ceil()
          +  @type('float32') finishDeadline = 0     // 0 until first finisher; elapsed-clock deadline
   (phase default 1→0; meaning reassigned to 4-phase — comment the change)
PlayerState + @type('string')  name = ''             // join option; shown in list/standings
            + @type('uint8')   colorId = 0           // palette index; cosmetic, synced for peers
            + @type('boolean') spectating = false    // joined mid-round (Race) → not simulated
```

### BATCH 1 — Shared contract (+ headless tests)  ← testable core, no room needed
- `constants.ts`: `COUNTDOWN_SECONDS=3`, `RACE_GRACE_SECONDS=20`, `MAX_RACE_SECONDS=180`, `COLOR_COUNT=8`.
- `messages.ts` (or existing message-const home): `START_MESSAGE='start'`, `RESTART_MESSAGE='restart'`,
  `SET_COLOR_MESSAGE='setColor'`, `isColorId(n)` guard. (Alongside existing INPUT/SET_CLASS.)
- `race/director.ts` (NEW, framework-free, PURE — the testable brain the room calls as glue):
  - `computeStandings(players): Ranking[]` — sort `(finished desc, finishTime asc, z desc)`; DNF flagged.
  - `raceShouldEnd(state, now): boolean` — deadline OR all-racers-done OR MAX_RACE.
  - `resetPlayerForRace(p, index)` — start-stagger x/z, zero vel/timers/finished/dead, lastSafe=spawn.
  - `shouldSpectateOnJoin(phase): boolean` — Race policy; comment marks Survival branch.
- `schema.ts`: append the 6 fields above; keep `implements SimShip` compile-guard.
- **Tests** (`race/director.test.ts`): standings order incl. DNF; end-conditions (deadline / all-done /
  max / not-yet); reset zeroes state & staggers; spectate-policy truth table. Determinism unaffected.

### BATCH 2 — Server lifecycle (apps/server)
- `run-room.ts`:
  - `onCreate`: `phase=0`; `setMetadata({ hostName:'', phase:0, players:0 })`.
  - `onJoin(client,{name})`: set `p.name`; `p.colorId = players.size % COLOR_COUNT`; hostId if empty;
    `p.spectating = shouldSpectateOnJoin(phase)`; racer spawn-stagger only if not spectating; `updateLobby`.
  - `onMessage START` (host+lobby only): snapshot racers, `resetPlayerForRace` each, `phase=1`,
    `countdown=COUNTDOWN_SECONDS`, refresh metadata+updateLobby.
  - `onMessage RESTART` (host+finished only): reset all, `spectating=false`, `phase=0`, clear deadline.
  - `onMessage SET_CLASS / SET_COLOR`: reject unless `phase===0`; validate; set; (color) validate isColorId.
  - `fixedStep`: `switch(phase)` — countdown: tick down → racing; racing: simulate racers only, stamp
    finishTime, `if raceShouldEnd → phase=3` + metadata; else no-op.
  - host migration in `onLeave`/drop-evict: reassign hostId + hostName + updateLobby.
  - Metadata refreshed (+updateLobby) on every phase change / join / leave / host change.
- `index.ts`: `import { LobbyRoom } from '@colyseus/core'; gameServer.define('lobby', LobbyRoom);`

### BATCH 3 — Client shell + routing (apps/client)
- `net/session.ts`: add `lobby: Room | null`.
- `routes.ts`: `index('routes/home.tsx')` = **landing**; keep `solo`; add
  `route('game/:roomId','routes/game/route.tsx')`; **delete `run`**.
- `routes/home.tsx` → **Landing**: name input (localStorage-persist) + Host button
  (`client.create('run',{name})` → session.room → `navigate('/game/'+roomId)`) + **RoomList**.
- `routes/game/components/RoomList.tsx`: landing clientLoader joins `LobbyRoom` (idempotent, session.lobby,
  mirrors S2 run-loader guard); component bridges `onMessage('rooms'|'+'|'-')` → React list state via ONE
  justified effect (external push stream → state; not derivable). Row click → `joinById` → `/game/:id`.
- `routes/game/route.tsx`: `clientLoader` = requireRoom (redirect `/` if `!session.room` or id mismatch);
  renders `<RoomProvider><GameShell/></RoomProvider>`. **GameShell owns the ONE `<Canvas>`** (lift from
  net-canvas) + phase-driven overlays; Canvas never remounts across phase changes.

### BATCH 4 — Client overlays + leave guard (one component per file)
- `LobbyOverlay` — player list (name/colour/ship/host badge), ship picker (reuse `setClass`), colour picker
  (`setColor`), 3D ship preview in Canvas, host-only GO button. Disabled once `phase!==0`.
- `CountdownOverlay` — big `ceil(countdown)` / “GO”. `RaceHud` — timer + live positions (computeStandings).
- `ResultsOverlay` — standings table (DNF marked) + host-only Play Again (`restart`).
- `SpectatorView` — “Spectating — next round” banner; chase-cam retargeted to leader (reuse `camera/chase.ts`
  with a non-local target). **Trimmable edge** (user “probably”).
- Leave: `useBlocker(phase===racing)` + `beforeunload` + explicit Leave button (`room.leave()`+`navigate('/')`
  — deliberate teardown, the S2 lesson). Audit any client `phase===1` assumption from S2.

### BATCH 5 — Docs (folded into RECONCILE)
- GDD: join-policy as a **mode** column (Race=spectate-next-round · Survival=drop-in); §L38 reframed; new
  session-flow + 4-phase state diagram; ship/colour pick + results.
- CLAUDE.md tagline → “join anytime — race the next round” (Survival keeps live drop-in). backlog S4 line.

### Verification gates (per batch)
typecheck + shared tests (B1) · headless two-tab: host+join, GO, finish→standings, Play Again, join-mid-race
⇒ spectate (B2–4). No new lint debt beyond known net-canvas item.

### Open risks to accept at Align
(a) phase-enum reassignment vs S2 client readers (audit in B3/B4); (b) same-seed-per-room (no per-round
variety in S4); (c) spectator cam is the trim edge; (d) landing joins LobbyRoom in a clientLoader (same
idempotent-singleton pattern S2 uses for the game room — acceptably within the convention, not a new bug).

**STATUS: Prep drafted — awaiting Align greenlight.**

## ALIGN
_(pending)_

## IMPLEMENT

### Batch 1 — Shared contract ✓ (typecheck + 28 shared tests GREEN; +10 director tests)
- `constants.ts`: COUNTDOWN_SECONDS=3, RACE_GRACE_SECONDS=20, MAX_RACE_SECONDS=180, COLOR_COUNT=8, START_STAGGER=CELL.
- `race/director.ts` (NEW): PHASE{lobby,countdown,racing,finished}; START/RESTART/SET_COLOR msgs + isColorId;
  shouldSpectateOnJoin (mode seam); resetPlayerForRace (in-place); computeStandings; raceShouldEnd; RunMetadata.
- `schema.ts`: PlayerState +name/+colorId/+spectating; RunState +hostId/+countdown/+finishDeadline; phase 1→0.
- `index.ts`: export race/director. `director.test.ts` (NEW): 10 tests.
- Note: `RunMetadata.phase` + `shouldSpectateOnJoin` param typed `number` (mirror schema uint8, no casts).

### Batch 2 — Server lifecycle ✓ (server typecheck GREEN; LobbyRoom join smoke GREEN)
- `run-room.ts`: 4-phase fixedStep (countdown bleed → racing sim racers-only → finished); startRace/resetToLobby;
  host-only START/RESTART; SET_CLASS/SET_COLOR lobby-gated; spectator-on-join; hostId assign + reassignHost on
  leave/evict; `refreshMetadata()` via setMetadata → auto LobbyRoom push (verified RegisteredHandler chain).
- `index.ts`: `gameServer.define('lobby', LobbyRoom)`.

### Batch 3 — Client shell + routing ✓ (client typecheck + lint GREEN; headless E2E GREEN)
- `session.ts` +lobby; `net/matchmaking.ts` (NEW: hostRoom/joinRoom/joinLobby/waitForSeed — join in HANDLERS,
  not loaders); `lobby/lobby-store.ts` (NEW: module store + `useLobbyRooms` via useSyncExternalStore — catches
  the initial `rooms` snapshot, no lifecycle effect); `lobby/room-list.tsx` (NEW); `routes.ts` (index landing +
  `game/:roomId`, retired `run`); `routes/home.tsx` (Landing: name + Host + list); `routes/game/route.tsx`
  (NEW: requireRoom + seed-wait → NetCanvas). Deleted `routes/run/`.
- **GOTCHA FOUND + FIXED (durable):** the LobbyRoom sees a room ONLY if its handler opts in —
  `gameServer.define(ROOM_NAME, RunRoom).enableRealtimeListing()`. The create/join/metadata-change/dispose →
  updateLobby hooks live INSIDE `enableRealtimeListing()` (off by default). Without it the list stays empty.
  (This corrects the Brainstorm assumption that setMetadata alone suffices — it does, but ONLY once listing is enabled.)
- **E2E verified headlessly** (node + @colyseus/sdk, NN-1): live list shows `{hostName, phase}`; host authority;
  lobby→START→countdown(2.65…)→racing; list metadata tracked the phase to `[2]` live.

### Batch 4 — Client overlays + spectator + lobby-cam preview + leave guard ✓ (built in subagent; INDEPENDENTLY reviewed + verified)
Full spec: `…-s4-batch4-spec.md`. Delivered: 14 new files (`colors.ts`, `spectator.ts`, `net/use-run-view.ts`,
`game-shell.tsx`, `overlays/{overlays,roster,lobby-overlay,countdown-overlay,race-hud,spectator-bar,results-overlay,leave-guard,leave-button}.tsx`,
`overlays/overlays.css`) + 8 edits (`routes/game/route.tsx`, `net-canvas.tsx`, `net-loop.tsx`, `ecs/traits.ts`,
`ecs/net-systems.ts`, `camera/chase.ts`, `scene/ship-view.tsx`, `net/matchmaking.ts`).
- **Preview = REUSE main scene** (user call): `updateLobbyCamera` hero-orbits the real local ship (no 2nd Canvas).
- **Spectator = cycle-any-racer** (Tab/←/→/◀▶); target + local-role + phase on module singletons read by NetLoop.
- Local player always a LocalPlayer entity; spectating toggles predict-skip + camera + hide — no re-spawn on
  Play-Again flip (the `localRole.spectating` onChange seam, guarded `isLocal`).
- **I re-verified (not trusting the subagent):** all 7 gates by code-reading; net-canvas complexity still 24
  (not raised); typecheck + 28 shared tests + lint (only pre-existing debt) + full SPA build GREEN.
- Deviations (all benign): RaceHud drops unused `room` prop; LeaveGuard.proceed() doesn't leaveRoom (spec-literal
  — teardown is the explicit Leave button); Roster shows a "waiting" placeholder when empty.
- **REMAINING human gate:** two-tab browser playtest (host→pick→GO→race→results→Play-Again; join-mid-race→spectate→cycle).

### Batch 5 — Docs reconcile ✓
GDD §1/§3/§4 (round model + per-mode join-policy column), CLAUDE.md tagline, backlog S4 line — all updated to
the round-based model. Procgen (separate thread) captured in `…-procgen-flow-progression.md` (post-S4).

## RECONCILE (arc close: planned vs done)
**All 5 batches shipped.** S4 = a complete office Race: live room list → host/join → lobby ship+colour pick
(hero-orbit preview) → host GO → 3·2·1 → race → leader+grace → standings (DNF) → Play Again; mid-race joiners
spectate (cycle any racer) then join next round; host authority + migration; leave guard.

**Deviations from the original Prep (all deliberate, captured above):**
- `getAvailableRooms` removed in SDK 0.17 → built-in **`LobbyRoom` + `enableRealtimeListing()`** (verified).
- 3D preview: planned 2nd Canvas → **reuse main scene via lobby camera** (user; simpler + WYSIWYG + no 2nd ctx).
- **Full ship+colour pick pulled forward** into S4 (user); spectator upgraded to **cycle-any-racer** (user).
- Model: **drop-in-beside-pack → round-gated, per-mode** (Race spectate-next / Survival drop-in via seam).

**Verified:** typecheck (all 3 pkgs) · 28 shared tests · lint (only pre-existing net-canvas debt) · full SPA
build · headless E2E (server lifecycle + room list) · full code-review of all 7 client gates · **HUMAN GATE
PASSED 2026-08-09** (two-tab playtest, full loop + spectate). One regression found & fixed at the gate: lobby
ship jitter (gating netFlightSystem stranded the Prev trait → stale-Prev lerp; fixed by `freezeLocalPrev`,
commit `e5eb5f9`). Polish deferred to S7 (reconnection under the new phase machine — see backlog). **S4 CLOSED.
NEXT: S5 (combat & power-ups).**

## RECONCILE
_(pending)_
