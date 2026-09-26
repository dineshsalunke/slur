Agent: workerthree · Lane: verify #275 pickup listeners + mine glow in a hosted room (verification only) · Updated: 2026-09-26

## Goal

Measure #275 (workerone 0afbef2, 5ded0a4) live on :5173/:2567. Checks:

1. A taken pickup hides and grants its power.
2. A second client sees it taken.
3. Nothing leaks or duplicates across a route remount.
4. Mine bodies still glow after `toneMapped` was removed (fed4ac2), with one tap.

Supervisor: if the glow looks wrong, A/B before and after b706baa (workerfour, mine-shots/mine-bodies refactor).

## Done

- Earlier lanes: #281 e13f35d, power bag 842fd8c / 074ceee.
- This lane: no repo edits. Checks 1 and 2 are measured; see State.

## State

Room bgingWIWB. Host = headless Chrome (my PID 6761, now killed). Second racer = node bot (PID 7703, killed).

- Baseline in lobby: `pickupTaken` had one callback each for add, remove and change. 37 callbacks in
  total. GL memory: 103 geometries, 42 textures, 43 programs (measured).
- **Check 1, PASS (measured):**
  - Server flag and `isPickupTaken` flipped on the same rAF frame.
  - Instance scale reached 0 about 130 ms later (the shrink pose). Pickups 19 and 20: srv/cli true at
    799/2183 ms, vis false at 931/2316 ms.
  - On respawn all three flip back together.
  - The host's rack filled 0,0,0 → 2,1,0 → 2,1,3 as it took pickups.
- **Check 2, PASS (measured):**
  - The bot took 20.3rmvdi (its log: slots 2,0,0 at 93165 ms). The Chrome client showed srv=cli=true on
    one frame, then hid it.
  - The bot's log also records the host's takes (1.3rmvdi, 2.3rmvdi).
  - At 12 s into the race, the server and client taken sets matched (3.3rmvdi, 4.3rmvdi).
- The players-map add/remove callbacks went 3 → 4 at GO. Probably a component that mounts at GO
  [unmeasured]. Check it across remounts.
- **Check 3, NOT MEASURED.** The first remount eval (SPA navigate to `/beat-deck`, click Leave, navigate
  back, ×3) returned `{}`. Then `window.__T` was undefined, and the tab was in room iGzcBHiR6 (lobby,
  1 player, navigation type "navigate"). After I killed my Chrome, :9471 was held by ANOTHER session's
  Chrome (PID 11932, scratchpad 1e4684a0…; not mine, not killed). The later evals may have hit that tab.
  Cause unknown [unmeasured]. Do not read this as a #275 bug until it is rerun cleanly.
- **Check 4, NOT STARTED.**

## Uncommitted

- `.claude/memory/check-the-cdp-port-is-yours.md` (recheck during a run), committed with this handover.
- Scratch drivers (not repo): `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/9de11cd9-3a71-4a57-9b64-1146dc505c93/scratchpad/`
  `{bot.mjs, ev.mjs, setup.js, probe.js, drive.js, watch.js}`.

## Held files

None.

## Next

1. Pick a random free port (not 9471). Launch Chrome as before, DPR 1, mute. Make `ev.mjs` address the
   page target by id and print the URL and room id with every eval.
2. Host, start `bot.mjs <roomId>`, run `setup.js` (fix the `?v=` / `?t=` module URLs from the
   resource entries first), then `drive.js`, click Go.
3. Remount: `__reactRouterDataRouter.navigate('/beat-deck')`. The leave guard blocks, so click its Leave
   (the `.fixed.inset-0.z-40` panel). Then `navigate('/game/<id>')`. Do ONE hop per eval, and run
   `setup.js` again after each hop (the module handles survive, `__T` should too). After each hop,
   read `probe.js`:
   - pickupTaken callbacks stay 1/1/1
   - total callbacks come back to the same number
   - `sameRoom` is true
   - server and client taken sets match
   - geometries and textures do not grow over 3 hops
4. Mine glow: when the host rack holds a mine (3), send E (or 1–3 to select), press S to stop before it,
   wait for arm (0.5 s), and screenshot with `ev.mjs shot`. If it looks dim, A/B b706baa^ vs HEAD, and
   fed4ac2^.
5. Report to slur-supervisor. Kill Chrome and the bot by PID.

## Open questions

- Supervisor: should the Chrome on :9471 (PID 11932) belong to a current worker? It may have made my
  remount reading bogus.

## Lessons → memory

- `.claude/memory/check-the-cdp-port-is-yours.md`: added "recheck during a run".
