Agent: workerone · Lane: hosted-room HUD → /test-level HUD set (#236) · Updated: 2026-09-24

This lane comes before pacing step 2. The pacing lane state is in the previous version of this file: `git log -p -- .claude/handovers/workerone.md`. Pacing is parked at "step 2 design": the owner approved the direction, and nothing is built yet.

## Goal

In countdown and racing, a hosted room (`/game/:id`) shows the `game/hud` set (RosterPanel, FlightReadout, PowerRack in HudLayer) fed by live room data. This replaces `race-hud.tsx`.

## Done

- Filed issue #236.
- Sent the plan to slur-supervisor with file claims and a screenshot pair. The build is blocked until the supervisor clears it.

## State

- Screenshots, 1600×900 headless at DPR 1, in this session's scratchpad:
  - `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/c8f8306b-0a2e-4724-a621-911a3988cb26/scratchpad/testlevel.png`
  - `…/hosted.png`
- The hosted HUD has a cyan boxed timer at top centre and a cyan standings panel at top right. It has no speed, rank or progress readout. Only the PowerRack matches, through `game/net-power-rack.tsx`.
- Collisions with the target layout:
  - LeaveButton is fixed at top-4 left-4 (`overlays.tsx`).
  - AudioToggle is fixed at bottom-4 left-4.
- `useRunView` rebuilds on every player `onChange`, which includes z. `RaceHud` therefore re-renders at patch rate.
- The HUD must mount inside `WorldProvider` because FlightReadout and PowerCell use koota hooks. `Overlays` is outside it. That is why NetHud goes in `net-canvas.tsx`.
- Headless Chrome is killed (it ran on port 9471). I started no dev server.

## Uncommitted

None.

## Held files (pending clearance)

- New: `game/net-hud.tsx`, `game/net/standings-store.ts` (+ test), `game/hud/net-roster.tsx`.
- Edit: `game/hud/flight-readout.tsx`, `routes/test-level/test-level-hud.tsx`, `routes/test-level/hud-fixture.ts`.
- Delete: `game/overlays/race-hud.tsx`, `game/net-power-rack.tsx`.
- Asked for, currently held by workerfour: 2 lines of `net-canvas.tsx`, 2 lines of `overlays.tsx`, and the LeaveButton position.

## Next

1. Wait for the supervisor to clear the plan and settle the open questions.
2. Build `standings-store.ts`. It is a `useSyncExternalStore` over schema callbacks. Its snapshot changes only on order, name, connected or field changes, and it has a per-frame `standing()` getter.
3. In FlightReadout, replace the `rank`/`field` props with a `standing` getter read in its addEffect. Update the test-level fixture to match.
4. Build `net-roster.tsx`, then `net-hud.tsx`. A spectator gets roster + SpectatorBar only.
5. Swap it into `net-canvas.tsx` and remove RaceHud from `overlays.tsx`, if cleared. Keep ThreatHud.
6. Take a fresh screenshot pair. Run typecheck, test and lint on my paths, then commit by pathspec.

## Open questions

- Roster: a 5-row window centred on self, or the whole field?
- Keep ThreatHud? I recommend yes.
- Where do Leave and the mute button go? I proposed top right.

## Lessons → memory

none
