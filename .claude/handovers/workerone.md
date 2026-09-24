Agent: workerone · Lane: #253 /beat-deck v1 (fly-and-record) · Updated: 2026-09-25 01:00

Older versions hold the song-lab history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- Dev-only `/beat-deck`: an empty deck. The owner picks an mp3, presses Enter and flies to the song
  (auto-cruise; A/D and Space carry the rhythm). The inputs are recorded to learn what "moving to a song" means.

## Done

- `9388a67` removes song-lab and tapper from dev and reverts c3d2a63. The archive is the local branch
  `archive/song-lab` (b64766f), **not pushed**.
- `1ab0a3f` /beat-deck v1: `apps/client/app/routes/beat-deck/**` and `apps/client/beat-deck/beat-deck-plugin.ts`
  (+ test), plus one-line hooks in routes.ts, vite.config.ts and vitest.config.ts.

## State

- Headless take (measured): 6.6 s → 17 KB, 399 ticks, 18 key events, equal column lengths, sha256 = the mp3's,
  vz 124 with no throttle key held. Key holds of 250 ms recorded as 251–253 ms. Clock: `output-timestamp`.
- Gates at 1ab0a3f: typecheck green, lint green, client 309/309. The matchmaking failures seen at 9388a67 no
  longer reproduce [not investigated].
- The sample take `take-imgaine-dragons-believer-2026-09-24T19-21-20-102Z.json` is in `apps/client/.songs/takes/`
  (ignored). It is a bot take; delete it before analysing the owner's takes.
- The deck is 3000 segments (60 000 u ≈ 8 min at 124 u/s). A longer song ends at the finish line
  (`end: 'finish'`).

## Uncommitted

- None.

## Held files

- `apps/client/app/routes/beat-deck/**` · `apps/client/beat-deck/**`.

## Next

1. The owner records real takes on `/beat-deck`.
2. Then (not approved yet) an analysis step: compare key-down songMs with the beats in
   `imgaine_dragons-believer.analysis.json`.

## Open questions

- Push `archive/song-lab` to origin? This is the owner's decision.

## Lessons → memory

- `.claude/memory/drive-beat-deck-headless.md`.
