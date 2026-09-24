Agent: workerfour · Lane: results screen redesign #238 (done) → next: menu ship-picker removal · Updated: 2026-09-24

## Goal

#238: build the PHASE.finished overlay to comp B "Winner card". Done. Next is the queued menu-picker lane.

## Done

- `1d1f9f2` feat(results): the comp B build. Shell `results-overlay.tsx` with zero subscriptions. Leaves:
  `winner-card`, `standings`, `standing-row` (props only), `your-finish`, `race-again` (host Enter =
  RESTART), and `results-format.ts` + test. The NN #13 weighing is in the commit body.
- `7943126` fix(results): the finish review found one material fix, the winner title scale. It is now
  64px on phones and clamp(56px,8vw,112px) from sm. Also adds the DESIGN.md "Results" section.
- `dc856e7` test(overlays): the supervisor asked for this split. The fake room is in
  `game/overlays/test-room.ts`, the harness in `game/overlays/mount-overlays.tsx`, and the results tests
  in `results-overlay.test.tsx`.
- Memories: `seed-a-finished-room-with-a-scratch-server.md`, `share-a-vi-mock-through-a-dynamic-import.md`.

## State (verified this session unless marked)

- vitest `app/game/overlays`: 4 files, 27/27. Client typecheck clean. Biome on overlays: no warnings.
  ls-lint and the comment ratchet are clean.
- Repo-wide `pnpm lint` fails on biome errors in the untracked `.claude/skills/`, which is not lane code.
- Headless (private stack :2611/:5211, Chrome :9483, all killed): 1440x900 and 390x844, host and
  guest. scrollWidth equals innerWidth. At 390 with 6 rows the card top is at 292px and the header
  ends at 56px. Host bare Enter moves phase 3 to 0.
- Reviewer's owner note, not a fix: the "Results" label above "<name> wins" is repetitive, and the
  craft floor bans labels above headings. The owner approved the label, so it stays unless they change it.
- `HudPanel`, `HudButton` and `ColorDot` still have users (leave-button, spectator-bar, leave-guard),
  so none were deleted.

## Uncommitted

None after this handover commit.

## Held files

None. Release the #238 claims.

## Next

1. Queued lane: remove the ship picker from the main menu (`/`). The in-room pick replaces it. Keep
   the shared ship store; the saved ship still goes out on host, join and deep link. Decide what the
   menu backdrop ship shows (probably the saved ship). File an issue first. Send the supervisor a
   plan plus claims (`routes/home.tsx`, `routes/home/*`, maybe the DESIGN.md menu section). Write
   nothing before clearance.

## Open questions

- For the owner, via the supervisor: keep or drop the "Results" label above the winner title?
- Delete `game/net-debug-hud.tsx` (the owner must run `git rm` or allow it). Carried over.

## Lessons → memory

`.claude/memory/seed-a-finished-room-with-a-scratch-server.md`,
`.claude/memory/share-a-vi-mock-through-a-dynamic-import.md`.
