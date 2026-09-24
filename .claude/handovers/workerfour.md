Agent: workerfour · Lane: menu ship-picker removal #242 (plan sent, awaiting owner approval) · Updated: 2026-09-24

## Goal

#242: remove the ship picker from the main menu (`/`). The in-room lobby pick replaces it. Keep the
shared ship store. The saved ship still goes out on host, join and deep link.

## Done

- #238 results screen is complete: `1d1f9f2` build, `7943126` review fix + DESIGN.md Results, `dc856e7`
  test split, `f6d257a` handover. The supervisor confirmed these and released the claims.
- Issue #242 filed. The plan and claims went to the supervisor, who relays them to the owner.

## State (verified this session unless marked)

- The menu picker is `routes/home/ship-picker.tsx`. It renders `<ShipStepper onStep={cycleShip}/>` and
  owns a window keydown useEffect: A/D/arrows cycle the ship, and a bare Enter calls
  `requestSubmit()` on the `MENU_FORM` form.
- `routes/home/menu-strip.tsx` holds the grid `sm:grid-cols-[minmax(0,15rem)_minmax(0,17rem)_auto]
  lg:grid-cols-[15rem_17rem_auto_1fr]` with CallSignField, ShipPicker, HostButton and KeyHint.
  HINTS = [A D] Ship, [Enter] Host.
- `routes/home/host-button.tsx` is a submit `Button` that reads `useNavigation()` for "Hosting…".
- `routes/home/landing-ship.tsx` renders the saved ship via `useShipChoice()`, and banks when
  `currentShip().turn` changes. After removal that branch is dormant.
- `ShipStepper` and `cycleShip` are still used by `game/overlays/lobby-ship-picker.tsx`.
- No tests exist under `routes/home/`.

## Plan sent (build only after approval)

1. menu-strip: drop ShipPicker. Hints are [Enter] Host only. Grid is sm `[minmax(0,15rem)_auto]`, lg
   `[15rem_auto_1fr]`.
2. `git rm routes/home/ship-picker.tsx`.
3. Move the bare-Enter → `requestSubmit()` useEffect into HostButton, with its one-line comment. The
   NN #13 weighing is in the message to the supervisor (a MenuKeys leaf / autofocus / module singleton /
   native form Enter were rejected). Copy it into the commit body.
4. landing-ship: no change unless the owner asks.
5. DESIGN.md: the Menu Strip line reads "call sign, primary and key hint". The Ship Picker (signature)
   section is reframed for the lobby. Drop the menu backdrop bank line.
6. Verify: typecheck, vitest, lint, and headless menu captures at 1440 and 390 (CDP viewport).

## Uncommitted

None after this handover commit.

## Held files (claimed, pending clearance)

`routes/home/menu-strip.tsx`, `routes/home/ship-picker.tsx` (delete), `routes/home/host-button.tsx`,
`apps/client/DESIGN.md` (Menu Strip + Ship Picker sections only).

## Next

1. Wait for the supervisor to relay the owner's approval. Then build steps 1–6, commit by pathspec
   and report the SHA.

## Open questions

- Owner: is the lobby picker now the "signature" interaction in DESIGN.md?
- Owner (relayed by the supervisor): keep or drop the "Results" label above "<name> wins" (#238).
- Delete `game/net-debug-hud.tsx` (the owner must run `git rm` or allow it). Carried over.

## Lessons → memory

none this seam (the two #238 memories were committed in `f6d257a`).
