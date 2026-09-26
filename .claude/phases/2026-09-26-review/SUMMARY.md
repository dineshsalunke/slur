# Code review 2026-09-26 — merged summary

Owner request: review the whole codebase against `conventions/*.md`, `.claude/rules/*.md` and CLAUDE.md
NN 1–15, plus own judgment. Read-only; no code changed. Five lanes, one report each (in this folder):

| Lane | Report | Scope | P0 | P1 | P2 |
|---|---|---|---|---|---|
| Server + networking | `workerone.md` (89d91a8) | `apps/server`, client `net/`, wire schema | 0 | 5 | 9 |
| Shared sim + build | `workertwo.md` (e9a3137) | `packages/shared`, build config | 1 | 5 | 9 |
| Scene part 1 | `workerthree.md` (23f9f8c) | `game/scene/` a*–mine-* | 0 | 3 | 9 |
| Scene part 2 | `workerfour.md` (4b68c2c) | `game/scene/` monolith*–z* | 0 | 3 | 10 |
| Client UI | `workerfive.md` (c7d52aa) | routes, lobby, UI, HUD, input, audio, dev | 6 | 1 | 13 |

After merging duplicates: **7 P0 · 15 P1 · ~48 P2.** Nothing was run in a live room. "Verified" = read at
the line (some measured in node). The supervisor re-read four P0/P1 sites at HEAD and they hold.

## P0 — bugs a player can hit

| # | Finding | Site | Fix |
|---|---|---|---|
| 1 | `isShipId` uses `id in SHIPS`, so `'constructor'`/`'toString'` pass; `tuningForShip` then throws every tick. One lobby message can crash a room. Throw verified in node; room crash inferred. | `packages/shared/src/ship-classes.ts:127` | `Object.hasOwn( SHIPS, id )` in `isShipId` and `shipOf`; test the four keys. (two) |
| 2 | The room is never left on back-button or guard "Leave"; `hostRoom`/`joinRoom` overwrite `session.room` without leaving it. Ghost players, leaked socket. | `net/matchmaking.ts:17-21`, `routes/home.tsx:19-23` | `leaveRoom()` in the home `clientLoader`; `enter()` leaves any other room first. (five) |
| 3 | Leave mid-race calls `leaveRoom()` before `useBlocker` asks; "Stay" leaves the player in a dead room. | `game/overlays/leave-button.tsx:8-11` | Navigate first; leave when the guard proceeds (folds into #2). (five) |
| 4 | Keys stick after alt-tab: keyboard has no `blur`/`visibilitychange` reset. | `game/input/keyboard.ts:17-33` | Clear `down` on blur/hidden, as `touch-state.ts:47` does. (five) |
| 5 | Gamepad Start is dead: `synthKey` dispatches on `window`, `isBareEnter` requires `target === document.body`. | `game/input/synth-key.ts:2`, `ship/ship-keys.ts:17` | Dispatch on `document.body`. (five) |
| 6 | Spectator bar names `racers[0]`; the camera follows the leader. | `game/overlays/spectator-bar.tsx:12`, `camera/chase.ts:97` | One `resolveSpectatorTarget` for both; reset on lobby. (five) |
| 7 | A late joiner hears lobby music mid-race: `listen('phase')` fires at once, then two hard-coded `playMusic(lobby)` override it. | `audio/game-audio.tsx:29-31` | Remove the two hard-coded calls; let the phase listener choose. (five) |

## P1 — rule breaks with real cost

**Netcode**
- **Input queue ratchet** (one). Server takes one input per tick; client makes one per step. A jitter tick adds
  lag that never drains, up to 2 s (`run-room.ts:173`). Hits and fires resolve at the stale pose. Mechanism
  verified; size unmeasured; may be P0. Fix: drain extra when `q.length` > ~3. Measure first.
- **No `room.onLeave`/`onDrop` on the client** (one). A server restart or a failed 20 s reconnect freezes the
  player; `joinByLink` keeps returning the dead room. Pairs with P0-2.
- **float32 reconcile vs float64 server** (one). Server keeps unrounded values; client replays from float32.
  Fix: `Math.fround` synced floats after `simulate()` on the server.
- **`useRunView` re-renders ~10 overlays at patch rate** (one + five, same finding). Every consumer holds its
  own listener set and re-renders on `elapsed` and every ship move. NN-4/NN-10. Fix: one per-room store with
  narrow selectors, like `standings-store.ts`.

**Determinism / track (two)**
- **Track materialization reads the ship roster**: `FRACTURE_SHADOW_Z` (groove, the server default),
  `MERGE_POCKET_Z`, pickup margins. GDD §0: *"never the ship roster"*. Retuning a ship silently reshapes every seed.
- **Groove has no frozen-geometry test**, so the roster leak above cannot be caught.
- **`**` pow in `block-depth.ts:19,45`** breaks ADR-000 inv. 4 (*"no transcendentals in the shared path"*). Weave only.
- **Weave `segmentAt` uncached**: 18 µs per call, on the tick path. Also flagged by three (`debris-ground`) and
  four (`TrackBlocks` 57 segments/frame). Fix: materialize once via `segmentsTrack`.
- **`simulate()` ignores its `SimConfig`**. A dead parameter that invites a client/server mismatch.

**Rendering (three, four)**
- **`toneMapped: false` is back** in `mine-bodies.tsx:37` and `mine-shock.tsx:32` (#261), banned 09-22.
- **Exhaust saturates at 55 u/s**: divides by `DEFAULT_TUNING.maxCruise`, but the freighter cruises at 124, so the
  plume and engine light stop responding at 44% speed.
- **GPU leaks**: TrackBlocks geometries never disposed; rear-view `ShaderMaterial` re-made per FBO change and
  never disposed (checked against R3F 9.7.0). Ship `Clone` materials unconfirmed.
- **Nebula noise volume: ~335 ms main-thread stall per sky mount** (measured in node). Build once at module scope.
- **AsteroidBand allocates ~11k objects/s** (inferred) rebuilding every placement at each spacing line.
- **`PickupField` holds Colyseus listeners in a `useEffect`** (NN-8). Move to `attach-room-to-world.ts`.

## Owner decisions needed

1. **`@deprecated()` rule** (one). `.claude/rules/colyseus-state.md:15` and `conventions/colyseus.md:157` prescribe
   it; memory `deprecated-breaks-reflection-decoding.md` shows it breaks our client. Change both to "keep dead
   fields plain"?
2. **Room in a loader** (five). `.claude/rules/react-router.md`: *"Never open the Colyseus room in a `loader`."*
   `conventions/react-router.md`: *"module singleton + loader"*. Code follows the second. Which wins?
3. **Dev routes in production** (five). `/test-level` and `/pacing` ship unconditionally; `/beat-deck` is gated.
4. **Mine spent on a failed aim** (one). The power is spent before `aimMine` can fail. Refund, or broadcast a fizzle
   (this is the open "fizzled" question).
5. **Post-respawn invulnerability is dead** (two). It is cleared on the first block-clear tick, and ADR-016
   makes respawn points block-clear. Remove or rename?
6. **Late joiner during countdown spectates** (one). CLAUDE.md says the field locks at GO.

## P2 — cleanup (see each report)

Dead code (~20 exports/files, incl. `net-debug-hud.tsx`, the old `environment.tsx` chain, accent setters,
`ColorDot`, `Tag`) · per-frame closures, `Color.set(string)` and template strings in `useFrame` · idle VFX
pools uploading full buffers · duplicated pools/builders (`explosions`/`hit-spark`, pickup builders, `isDead`,
rail mask ×2) · truncated `useEffect` comments ×10 · raw player hexes in `style={{}}` · `'hit'` message
has no shared constant · host drop blocks START for 20 s · shared tests not typechecked · `CELL` used as
the start-grid unit · two different default track generators · file names `explosions.tsx`/`ship.tsx`.

## Suggested fix lanes

| Lane | Contents | Size |
|---|---|---|
| A — Room lifetime | P0-2, P0-3 (Leave), client `onLeave`/`onDrop`, `joinLobby` dedupe | M |
| B — Input + small P0s | P0-1 `isShipId`, P0-4 blur, P0-5 gamepad, P0-6 spectator, P0-7 music | S |
| C — Netcode | queue ratchet (measure first), `Math.fround`, fire seq | M |
| D — Run-view store | `useRunView` → per-room store; phase gates (NN-10) | M |
| E — Render P1s | toneMapped, exhaust, GPU dispose, nebula once, asteroid band, PickupField listeners | M |
| F — Track contract | roster → `TRACK_CONTRACT`, groove digest test, drop `**`, weave materialize-once | M; reshapes weave seeds |
| G — P2 sweep | dead code, per-frame allocs, dupes, comments | S–M, low priority |
