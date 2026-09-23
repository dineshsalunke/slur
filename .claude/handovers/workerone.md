Agent: workerone · Lane: hosted-room HUD → /test-level HUD set (#236) · Updated: 2026-09-24

This lane comes before pacing step 2. The pacing lane state is in the version of this file before 383b1d4: `git log -p -- .claude/handovers/workerone.md`. Pacing is parked at "step 2 design": the owner approved the direction, and nothing is built yet.

## Goal

In countdown and racing, a hosted room shows the `game/hud` set fed by live room data. This replaces `race-hud.tsx`.

## Done

- `b255460`:
  - NetHud replaces NetPowerRack.
  - New `standings-store.ts` + test.
  - New leaves: NetRoster (5 rows centred on self), NetPilotReadout, SpectatorGate.
  - FlightReadout reads rank and field from a `standing()` getter.
  - `race-hud.tsx` is deleted and ThreatHud is kept.
  - Leave + mute sit top-right in countdown and racing.
  - The #91 block of `overlays.test.tsx` is rewritten.

## State

- Client typecheck exits 0. Vitest 257/257 passes. Biome is clean on my paths. ls-lint, canvas-isolation and the comment ratchet pass.
- Live check, two tabs in one hosted room at 1600×900. The HUD reads "2 CONNECTED / 1 RACER (self, marigold) / 2 RACER", "124 u/s", "1 / 2  6%  00:13", and the rack BOLT×3. Leave and mute are top right. Still: `…/scratchpad/hosted-new.png` in session c8f8306b's scratchpad.
- /test-level still reads "4 / 8" from the fixture: `…/scratchpad/testlevel-new.png`.
- [unmeasured] Whether the readout fills during countdown. The countdown sample came from a background tab and showed a blank speed and rank, and that tab's rAF was likely throttled.
- `--color-debug` stays. `net-debug-hud.tsx` still uses it; deleting that file is the owner's job.
- Headless Chrome is killed. I started no dev server.

## Uncommitted

None.

## Held files

None after this seam. The lane is done pending owner review.

## Next

1. Owner review of the hosted-room look. Possible follow-ups, owner's call:
   - The LeaveButton `hud` tone (magenta box) against the readout style; the `ghost` tone would match it better.
   - The cyan CountdownOverlay.
2. Check the countdown readout in a foreground tab.
3. Then resume pacing step 2.

## Open questions

- Should Leave use the `ghost` tone in the race to match the readout HUD?

## Lessons → memory

none
