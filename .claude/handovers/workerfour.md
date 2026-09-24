Agent: workerfour · Lane: phone play — touch pad, Gamepad API, fullscreen #251 (BUILT) · Updated: 2026-09-24

## Goal

Make the game playable on a phone: an on-screen touch pad, physical controller support, and fullscreen
with a landscape lock. All inputs go through the keyboard's input seam.

## Done

- `9b365f3` feat(input): touch pad and gamepad on the one input seam (#251).
- `6bb632f` feat(ui): fullscreen toggle, rotate hint and web app manifest (#251).
- #252 filed: the server does not clamp client inputs (owner: a separate issue, not this lane).
- Neither commit is pushed. #251 stays open until the owner checks a real device.

## State (verified this session)

- Client tests 299/299, typecheck and lint pass. One lint run failed without output and the rerun
  passed [cause unmeasured, probably another worker's files].
- Headless run (844×390 mobile with touch emulation, private stack :2591/:5191, Chrome :9471, all killed):
  pointer coarse true, innerWidth = scrollWidth = 844. Pad display is flex; on desktop it is none.
  Measured on the server ship: thrust 1.5 s → vz 40.5; thrust+left 0.3 s → vx 31.5; thrust+brake
  0.3 s → vz 25 → 16; jump hold 250 ms → y 1.67, jumpsUsed 1; tap at rest → jumpsUsed 1, y 2.18 at
  +300 ms; tap at speed → jumpsUsed 1. touchInput is all zero after release. Portrait 390: the rotate
  hint is flex.
- Captures (scratchpad caps/): phone-landscape-racing.png, phone-landscape-thrust-held.png (older pad
  position), phone-landscape-lobby.png, phone-portrait-rotate-hint.png, desktop-no-pad.png.
- The lobby at 844×390 clips the GO button and the second colour row. This is outside this lane.
- The power-rack keyboard hint "E FIRE · Q CYCLE · X DROP" still shows on touch devices. This is outside
  this lane.

## Uncommitted

None.

## Held files

None after the report. Release the #251 claims.

## Next

1. The owner checks a real iPhone (Add to Home Screen, landscape, pad) and Android (fullscreen button +
   orientation lock).
2. The owner checks a real controller: stick/d-pad steer, RT/LT, A jump, X/RB fire, Y/LB cycle, Start
   = Enter, Select = mute.
3. Possible follow-ups: lobby layout at phone height, hiding the key hints on coarse pointers, a
   180×180 apple-touch-icon and manifest icons.

## Open questions

- Push both commits to origin/dev now, or after the device check?
- #195 owner calls A/B/C. GDD §5.5 table owner. Delete `game/net-debug-hud.tsx`.

## Lessons → memory

`.claude/memory/touch-test-over-cdp.md`
