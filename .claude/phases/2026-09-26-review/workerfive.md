# Code review — client outside the scene and net (workerfive, 2026-09-26)

Scope: `apps/client/app/routes/**`, `root.tsx`, `lobby/`, `ui/`, `ship/`, `audio/`, `dev/`,
`game/{hud,overlays,input,finish,ecs,camera}/`, `game/*.ts(x)`. Read-only review at HEAD `29b9cea`.
I read every non-test file in scope. `net/` and `game/net/` are outside scope. I read them only where a
finding in scope depends on them.

Totals: **P0 6 · P1 1 · P2 13**.

"Verified" means I read the code path at the lines quoted. No finding was reproduced in a browser.

---

## P0 — bugs

### P0-1 · Leave mid-race disconnects before the leave guard asks
`game/overlays/leave-button.tsx:8-11`
```ts
const onLeave = () => {
    leaveRoom();
    navigate( '/' );
};
```
`overlays.tsx:27` shows this button in countdown and racing. `leave-guard.tsx:9` blocks navigation when
racing: `const blocker = useBlocker( racing );`. So `leaveRoom()` runs first, and then `navigate('/')`
is blocked. The modal asks "Leave the race in progress?", but the room is already gone. **Stay** calls
`blocker.reset()` and leaves the player on `/game` with a dead room.
- Rule: own judgment (bug).
- Fix: navigate first and leave the room only after the navigation commits. For example, call
  `leaveRoom()` when the guard proceeds, or on entry to the home loader (see P0-2).
- Verified.

### P0-2 · Leaving by the back button (or guard "Leave") leaves the room connected. Host/join then leaks it.
`net/matchmaking.ts:51-54` has the only `leaveRoom()`. Its only caller is `leave-button.tsx:9`
(`grep leaveRoom`). `routes/home.tsx:19-23` (`clientLoader`) does not leave `session.room`.
`matchmaking.ts:17-21`:
```ts
function enter( room: Room< RunState > ): Room< RunState > {
    session.room = room;
```
`hostRoom`/`joinRoom` overwrite `session.room` and do not leave the old room. Back button → guard
**Leave** (`blocker.proceed()`) → home: the old room stays connected, and the player stays in the room as
a ghost. Host again, and the old connection leaks for the life of the tab.
- Rule: NN-8, *"keep long-lived resources … OUTSIDE React on module singletons"*. The singleton exists,
  but no route transition releases it.
- Fix: call `leaveRoom()` in `home.tsx` `clientLoader` (the one place every exit lands). Also make
  `enter()` leave any other `session.room` before it replaces it.
- Verified by reading. The server-side ghost behaviour is inferred.

### P0-3 · Keyboard keys stick after the window loses focus
`game/input/keyboard.ts:17-33`: `attachKeyboard` listens to `keydown`/`keyup` only. It has no `blur` or
`visibilitychange` reset. Hold D, alt-tab or click outside the window, then release D. No `keyup`
arrives, so `down` keeps `KeyD`, and the ship strafes until D is pressed again. Touch has this guard
already: `touch-state.ts:47` `addEventListener( 'blur', releaseAllTouch );`.
- Rule: own judgment (bug).
- Fix: in `attachKeyboard`, add `blur` (and `visibilitychange`→hidden) handlers that clear `down` and
  call `recompute()`.
- Verified by reading.

### P0-4 · Gamepad Start ("Enter") never reaches any Enter handler
`game/input/gamepad.ts:24` maps `[ 9, 'Enter' ]`. `game/input/synth-key.ts:2`:
```ts
dispatchEvent( new KeyboardEvent( 'keydown', { code, bubbles: true } ) );
```
This is `window.dispatchEvent`, so `e.target === window`. Every Enter consumer gates on
`ship/ship-keys.ts:17`:
```ts
return e.code === 'Enter' && e.target === document.body;
```
The sites are `use-enter-hosts.ts:9`, `lobby-ship-picker.tsx:18` and `race-again.tsx:21`. So a pad
cannot host, start or restart. `gamepad.test.ts:61` tests only the edge emit, not the delivery.
- Rule: own judgment (bug).
- Fix: dispatch synthesized keys on `document.body` (it bubbles to `window`). Alternatively,
  `isBareEnter` can also accept `e.target === window`.
- Verified by reading.

### P0-5 · Spectator bar names one racer while the camera follows another
`game/overlays/spectator-bar.tsx:12`:
```ts
const target = racers.find( ( p ) => p.id === spectatorCam.targetSessionId ) ?? racers[ 0 ];
```
`game/camera/chase.ts:97`: `const e = target ?? leader;`. `spectatorCam.targetSessionId` starts as
`null` (`spectator.ts:5`) and is set only by `cycleSpectatorTarget`. So by default the bar shows the
first racer in the map, and the camera follows the leader. The first ▶ press then selects `racers[0]`:
the bar does not change and the camera jumps. The id is also never reset between runs.
- Rule: own judgment (bug).
- Fix: one resolver for both sides, e.g. `resolveSpectatorTarget(racers)` in `spectator.ts` with a
  leader fallback, which writes `targetSessionId`. Reset it on phase → lobby.
- Verified by reading.

### P0-6 · A late joiner hears lobby music during the race
`audio/game-audio.tsx:29-31`:
```ts
const unbind = bindRoomAudio( room );
playMusic( MUSIC.lobby.name );
void preloadAudio().then( () => playMusic( MUSIC.lobby.name ) );
```
`bind-room-audio.ts:148` uses `$( room.state ).listen( 'phase', … )`. In `@colyseus/schema` 4.0.30,
`listen(prop, callback, immediate = true)` (`build/index.mjs:5164`, verified). It fires at once with
`racing` and calls `playMusic(run)`. Then line 30 replaces it with lobby music, and line 31 does so again
after the preload. The music stays wrong until the next phase change.
- Rule: own judgment (bug).
- Fix: remove the two hard-coded `playMusic(lobby)` calls. Let the phase listener choose, and call it
  again after the preload resolves (`playMusic` is idempotent on name, `audio-engine.ts:220`).
- Verified by reading. Not reproduced by ear.

---

## P1 — convention or NN violations with real cost

### P1-1 · `useRunView` re-renders every consumer on every server patch. Each consumer has its own full listener set.
`game/net/use-run-view.ts:66-106` (a hook outside scope, but every consumer is in scope). Each call
registers its own `listen` on phase/countdown/elapsed/finishDeadline/hostId, plus a per-player
`onChange`. Each callback calls `setView( readView( room ) )`, which is always a new object. The server
does `this.state.elapsed += dt;` every tick (`apps/server/src/rooms/run-room.ts:182`), and `readView`
copies every player's `z`. So each patch re-renders every mounted consumer.
- The racing cost: `spectator-bar.tsx:9` re-renders at the patch rate during gameplay. That breaks NN-4,
  *"No per-frame React re-renders in gameplay"*.
- Duplicate listener sets: lobby has `room-title.tsx:7`, `roster.tsx:9`, `colour-swatches.tsx:8` and
  `start-control.tsx:14` (four copies). Results has `winner-card.tsx:8`, `standings.tsx:7`,
  `your-finish.tsx:9` and `race-again.tsx:13` (four copies). Countdown has `countdown-overlay.tsx:6`.
- Rule: NN-4 and NN-10, *"a change re-renders only that leaf"*. Each leaf re-renders on changes it
  does not read (z, elapsed).
- Fix: copy the pattern that `game/net/standings-store.ts` already uses. Make one per-room store
  (`WeakMap<Room, Store>`) with key-compared snapshots and narrow selector hooks
  (`useRunHost`, `useRunPlayers` without `z`, `useCountdown`). Drop `z`/`elapsed` from the lobby and
  results view.
- Verified by reading. The render count was not measured.

---

## P2 — cleanup

### P2-1 · Dead code
- `game/net-debug-hud.tsx` — `NetDebugHud` has no importer (`grep NetDebugHud` matches only itself).
  It also has a truncated `JUSTIFIED EFFECT` comment at `:44`.
- `ui/color-dot.tsx` — `ColorDot` has no importer.
- `ui/tag.tsx` — `Tag` has no importer.
- `dev/from-user.ts` — `fromUser` has no importer.
- Fix: delete them. Verified by grep plus reading.

### P2-2 · Truncated one-line Effect comments (the first line of old multi-line blocks)
The rule, `conventions/react-router.md` TL;DR 7: *"one line naming the outside-React system it
synchronizes with"*. These lines stop mid-sentence, so they read as broken prose, and lint counts only
lines:
- `game/net-canvas.tsx:56` `…→ ECS, plus`
- `game/overlays/threat-hud.tsx:31` `…to this component's mount, which is`
- `game/overlays/leave-guard.tsx:11` `…(hard tab close/reload),`
- `game/overlays/spectator-bar.tsx:17` `…→ the spectator-target`
- `audio/game-audio.tsx:39` `…the engine's mute (office needs a`
- `audio/remote-engine-audio.tsx:59` `…(parenting the shared`
- `audio/remote-engine-audio.tsx:71` `…attach a positional loop to`
- `audio/remote-engine-audio.tsx:76` `…disconnect every`
- `routes/test-level/local-ship.tsx:16` `…(module singleton), which needs`
- `dev/frame-tap.tsx:11` `…Vite's HMR`
- `game/net-debug-hud.tsx:44` (dead, P2-1)
- Fix: rewrite each as one complete clause that names the system. Drop the `JUSTIFIED EFFECT —` prefix
  to match `use-enter-hosts.ts:6`. Verified.

### P2-3 · Player colours are raw hexes passed through `style={{ background }}`
`game/colors.ts:3-16` repeats the palette as hexes outside `@theme`. Sites: `roster.tsx:26`,
`standing-row.tsx:29`, `winner-card.tsx:21`, `colour-swatches.tsx:22` (and the dead `ui/color-dot.tsx:2`).
Also `spec-tag.tsx:28` `style={ { width: \`${…}%\` } }`.
- Rule: `.claude/rules/tailwind-ui.md`, *"Brand tokens, not raw hexes"* and *"push the one dynamic value
  through a CSS custom property"*.
- Fix: add `--color-player-0..11` to `@theme` and use a static class map (`bg-player-3`). For the stat
  bar, use `style={{'--fill': n}}` + `w-[calc(var(--fill)*1%)]`, which is the precedent at
  `standing-row.tsx:25`. Verified.
- **Cleared, not a finding:** `<Canvas style={{ position:'fixed', inset:0 }}>` ×4 (`net-canvas.tsx:63`,
  `landing-scene.tsx:34`, `test-level-canvas.tsx:46`, `beat-deck-canvas.tsx:20`). R3F 9.7.0 writes
  `position: 'relative'` as an inline style (`react-three-fiber.esm.js:128`), so a `fixed` class would
  lose. The `style` prop is the right tool here. An optional cleanup is to share one `CANVAS_STYLE`
  constant.

### P2-4 · Parents that hold a subscription and wrap siblings (NN-10)
- `game/overlays/overlays.tsx:18` `const phase = useRunPhase( room );` wraps every overlay.
- `game/net-hud.tsx:12` `useRunPhase( room )` wraps `NetRoster` + `NetPilotReadout` + `TouchPad`.
- `game/hud/net-pilot-readout.tsx:9-10` spectating/finished wrap `FlightReadout` + `PowerRack`.
- Rule: NN-10, *"A parent that wraps siblings holds zero reactive subscriptions"*. The cost is low
  because these change only on phase changes.
- Fix: one gate leaf per branch, e.g. `<PhaseGate is={PHASE.lobby}><LobbyOverlay/></PhaseGate>`.
  Verified.

### P2-5 · `useRunPhase` starts at `lobby`, so a mid-race joiner briefly mounts the lobby overlay
`game/net/use-run-view.ts:55` `useState< number >( PHASE.lobby )`. The loader has already waited for
state (`waitForDescriptor`). The first commit mounts `LobbyOverlay`: 4× `useRunView` listener sets plus
`LobbyShipPicker`'s Enter→START handler. Then the listener fires. Fix: seed from `room.state.phase`, or
fold this into the P1-1 store. Verified by reading.

### P2-6 · A Colyseus room is opened in loaders, against the rule. `joinLobby` has no in-flight dedupe.
`.claude/rules/react-router.md`: *"Never open the Colyseus room in a `loader`."*
`routes/home.tsx:20` `await joinLobby();` and `routes/game/route.tsx:15` `await joinByLink(…)`.
`conventions/react-router.md` TL;DR 7 says the opposite: *"the Colyseus room lives on a module
singleton + loader"*. The code follows the later text and guards the join. `joinByLink` dedupes
(`matchmaking.ts:33-42`), and the game route has `shouldRevalidate() { return false; }`. `joinLobby`
does not dedupe: it sets `session.lobby` only after the `await` (`matchmaking.ts:44-48`), so two
overlapping home loads join two lobbies.
- Fix: store the in-flight promise the way `linkJoin` does. Ask the owner which rule text wins, and fix
  the other file. Verified. The race is inferred.

### P2-7 · Game route: `shouldRevalidate` is always `false`, and `waitForDescriptor` never times out
`routes/game/route.tsx:23-25`: returning `false` also suppresses the loader on a `/game/A`→`/game/B`
param change. No in-app link does this today (inferred from RR's `defaultShouldRevalidate` on param
change; recalled, not verified this session). `net/matchmaking.ts:57-69`: the promise never rejects, so
a room that never sends a ready descriptor hangs the navigation on "Hosting…".
- Fix: `({ currentParams, nextParams }) => currentParams.roomId !== nextParams.roomId`, plus a timeout
  → `redirect('/?run=closed')`.

### P2-8 · Dev tools ship in production routes
`routes.ts:5-6` registers `test-level` and `pacing` unconditionally. Only `beat-deck` is gated
(`routes.ts:8`). `/pacing` builds a Web Worker that runs `analyzeDescriptor` on every seed. Decide
whether production needs them. If not, gate them like beat-deck. Owner question: CLAUDE.md names
`/test-level` as the art-view route. Verified.

### P2-9 · Module-level listeners that outlive their route
- `routes/beat-deck/take-recorder.ts:160-177`: a DEV-only window `keydown` for Enter/Escape. Once
  `/beat-deck` has loaded a song, Enter in a game lobby also calls `startTake()` (inferred; it is guarded
  only by `idle()`).
- `dev/frame-meter.ts:17-36`: `addEffect`/`addAfterEffect` register at import and are never removed.
  After one visit to `/test-level`, they run on every R3F frame, in-game too. The cost is small.
- Fix: register on route mount through the existing Effect-bracket pattern (`flight-readout.tsx:29`),
  or gate on `location.pathname`. Verified.

### P2-10 · Gameplay code depends on `dev/`
`game/input/power-select.ts:3` imports `dev/typing-target`. `game/ecs/hover.ts`, `attitude.ts`,
`camera/chase.ts` and `camera/shake.ts` read `num()` from `dev/tuning`, which restores from
`localStorage` in production too (`dev/tuning-persist.ts:10-19`). `ship/ship-keys.ts:3-8` has a second
copy of `typingTarget`.
- Fix: move `tuning*` and `typing-target` out of `dev/` (for example `game/tuning/`, `ui/keys.ts`) and
  remove the copy in `ship-keys.ts`. Verified.

### P2-11 · The spectator bar takes Tab
`spectator-bar.tsx:20-22`: `if ( e.code === 'Tab' || … ) e.preventDefault();` on `window`. While
spectating, keyboard focus cannot reach Leave, Mute or Fullscreen. Fix: drop Tab and keep ←/→.
Verified.

### P2-12 · `root.tsx` ErrorBoundary is unstyled and cannot scroll
`root.tsx:48-56` renders a bare `<main><pre>`. The body has `overflow-hidden` (`root.tsx:21`), so a
long stack is cut off, on the dark default. Fix: Tailwind classes plus `overflow-auto` on the `<pre>`,
and a link home. Verified.

### P2-13 · The audio voice pool retunes sounds that are still playing
`audio/audio-engine.ts:155-158`: `nextVoice` reuses one of 24 `GainNode`s. It calls
`voice.gain.disconnect()` and sets `gain.value` while an earlier source may still be playing through
that node. When more than 24 SFX overlap, an older sound gets cut or re-gained. Fix: one `GainNode` per
`play()`, disconnected in `onended` (as `trackCut` does). Inferred from reading. Not heard.

---

## Checked and cleared
- **NN-13 timers:** there is no `setInterval`/`setTimeout`/rAF in scope. Frame work uses `addEffect`
  (`flight-readout.tsx:30`, `threat-hud.tsx:33`, `gamepad.ts:87`) or `useFrame`.
- **Per-frame DOM writes:** the threat HUD and flight readout write `textContent` and CSS custom
  properties through refs, as `tailwind-ui.md` asks.
- **Room lifetime:** no component leaves the room in an unmount cleanup (the S2 bug). Audio/ECS
  bindings (`game-audio.tsx:26`, `net-canvas.tsx:57`) follow the room and unbind on unmount. That is
  acceptable, and music stopping on exit is correct.
- **Fragments and one-component-per-file:** no violations found in scope.
- **`pacing/`:** all derived through context and refs, with no Effects. Clean.

## Top 5
1. **P0-2** — leave the room on every exit, and in `enter()`. Ghost players and leaked sockets.
2. **P0-1** — Leave button mid-race disconnects before the guard asks.
3. **P0-3** — keys stick after blur (stuck strafe or throttle in a real race).
4. **P1-1** — `useRunView` → one per-room store with narrow selectors (NN-4 in the spectator bar,
   8 duplicate listener sets).
5. **P0-4** — gamepad Start is dead: dispatch synthesized keys on `document.body`.
