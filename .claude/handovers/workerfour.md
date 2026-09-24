Agent: workerfour · Lane: #242 menu ship-picker removal + #238 results follow-ups · Updated: 2026-09-24 09:40

## Goal

#242: remove the ship picker from the menu. The lobby picker is the signature Ship Picker. Results
follow-ups (owner): results above the finish curtain, drop the "Results" label.

## Done

- `ae5ec7b`: results root z-[2] → z-35 (above the z-30 curtain, below the z-40 LeaveGuard). The
  "Results" label is dropped, and the winner's colour square moves to the time row.
- `0ab2cb9` (#242): ShipPicker deleted. The menu strip is call sign, Host and [Enter] Host.
  Bare-Enter hosting lives in the new `routes/home/use-enter-hosts.ts`, called by HostButton.
  DESIGN.md has the lobby Ship Picker (signature), the Menu Strip, the layout grid, the room
  stacking order and the winner card.

## State (verified this session)

- Client typecheck exits 0. Vitest 279/279. Biome, ls-lint, canvas isolation and the comment ratchet
  pass.
- Live headless run on a scratch server (:2612/:5222, CDP :9491):
  - menu 1440 and 390: no picker; scrollWidth equals innerWidth.
  - A bare Enter on body hosts: it navigated to /game/<id>.
  - After the finish, at curtain opacity 0.654, the scene dims and the results stay at full
    strength. Computed z-index: results 35, curtain 30. The card text has no "Results".
- A still with the curtain pinned to opacity 1 by hand did not render black. It is inconclusive and
  was not used as evidence. The mid-curtain still is the proof.
- Stills: session 0a02f5e1 scratchpad `srv/shots/` (menu-1440, menu-390, results-mid-curtain,
  results-1440, results-390).
- Chrome, the scratch server and the client are killed.

## Uncommitted

None.

## Held files

None after this seam. The claims can be released.

## Next

1. Owner review of the stills.
2. No other work queued.

## Open questions

- Owner: keep the winner's colour square on the time row, or drop it?
- `routes/home/landing-ship.tsx` still has the bank-on-change branch. It is dormant now that the menu
  cannot change the ship. Remove it? (It was left alone per the approved plan.)
- Delete `game/net-debug-hud.tsx` (the owner must run `git rm` or allow it). Carried over.

## Lessons → memory

`.claude/memory/moving-a-useeffect-trips-the-comment-ratchet.md`
