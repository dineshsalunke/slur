Agent: workerfour · Lane: phone play — touch pad, Gamepad API, fullscreen #251 (BUILT + follow-ups) · Updated: 2026-09-24 19:10

## Goal

Make the game playable on a phone: an on-screen touch pad, physical controller support, and fullscreen
with a landscape lock. All inputs go through the keyboard's input seam.

## Done

- `9b365f3` feat(input): touch pad and gamepad on the one input seam (#251).
- `6bb632f` feat(ui): fullscreen toggle, rotate hint and web app manifest (#251).
- `97dc750` feat(ui): app icons 192/512 in the manifest and a 180 apple-touch-icon in root.tsx (#251).
  Source: `docs/art-direction/vehicles/split-crown/concept-sheet.png` (tracked), CHASE panel crop.
- `b58923f` fix(ui): lobby fits 844×390 and 667×375 (#251).
- `a5cd9a2` fix(hud): the "E Fire · Q Cycle · X Drop" hint hides on a coarse pointer (#251).
- Nothing is pushed. Owner ruling: no push until the owner checks real devices.

## State (verified this session)

- Client tests 299/299, client typecheck passes, `pnpm lint` has 0 errors (8 warnings, not from my files).
- Headless run (private stack :2591/:5191, Chrome :9471, all killed afterwards):
  - Lobby before the fix, at 844×390: the stack was 424 px, GO bottom at 404, second swatch row at 404.
  - Lobby after the fix: 844×390 and 667×375 give scrollHeight = innerHeight. GO bottom is at 370 and 355.
    The SpecTag hides and the stepper legend "Class · Freighter" shows. At 1280×720 and 1280×560 the
    layout is unchanged (SpecTag shown, legend hidden). At 390×844 portrait the layout is unchanged.
  - Race: the key hint is display none with touch emulation and block on desktop.
  - `/manifest.webmanifest` and the three icon PNGs return 200 image/png.
- Icons: the ship does not fit the maskable safe zone, so the icons declare purpose "any" only.
- Captures in this session's scratchpad `caps/`: before-*, after-*, final-race-phone.png.

## Uncommitted

None.

## Held files

None. Release the #251 follow-up claims.

## Next

1. The owner checks a real iPhone (Add to Home Screen icon, landscape, pad, lobby fit) and Android
   (fullscreen button, orientation lock, install icon).
2. The owner checks a real controller: stick/d-pad steer, RT/LT, A jump, X/RB fire, Y/LB cycle,
   Start = Enter, Select = mute.
3. After approval, push by the merge-in-a-detached-worktree route (`.claude/memory/merge-prs-in-a-detached-worktree.md`).

## Open questions

- Does the owner want a maskable icon variant (the ship smaller, about 60%) for Android adaptive icons?
- The lobby does not pad for the landscape notch (safe-area-inset-left). It was not measured on a device.
- #195 owner calls A/B/C. GDD §5.5 table owner. Delete `game/net-debug-hud.tsx`.

## Lessons → memory

`.claude/memory/bash-tool-runs-fish.md`
