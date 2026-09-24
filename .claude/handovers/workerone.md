Agent: workerone · Lane: #253 song lab — owner groove / Believer hook / open track · Updated: 2026-09-24 23:30

Older versions of this file hold earlier #253 and #250 history (`git log -p -- .claude/handovers/workerone.md`).

## Goal

- Owner feedback on /song-lab (~22:00): the track is one corridor and the strafing is too simple. Add variants
  with the owner groove, the Believer hook, and open stretches. Keep the old variants.

## Done

- `bcbc3d5` Variants groove, groove-tight, groove-open (`song-lab/groove.ts`), open emitter (`song-lab/open.ts`),
  tap-jump pilot mode (`pilot.ts`, `TAP_TICKS` = 4), `LabVariant.emit?: 'corridor' | 'open'` + `labEmitted()`.
  Tests: song-lab 15/15, route song-lab 9/9, client tsc clean, biome clean, comment ratchet passes.

## State

- Bundle `apps/client/.songs/lab/believer-s1.json`: 21.9 MB, 13 variants, 65 perfect + 195 human runs.
  260/260 replay to the same result from JSON; every digest matches.
- The 10 old variants are byte-identical: sha256 over their inputs+results+digests = `17f736c7…`, before and after.
- Groove `L R L R L R r l r l r r l r l r` in low/mid sections. Every second repeat is mirrored.
- Believer hook every 4 bars in high sections 28–44, 60–72, 88–96. Forms alternate: `> r l !<` (strafe, overshoot,
  settle, accented snap on beat 3 of bar 4), `J j` (full jump on beat 3 of bar 3, then a tap).
- Register gap: a backbeat is 0.96 s apart; L needs 1.05 s. So `groove` waits for the next kick/snare hit
  (strength ≥ 0.5, triplet grid). `groove-tight` hits every backbeat and cuts the calm (its label says so).
- Hook slots use the beat grid. Chorus drum hits of strength ≥ 0.5 are too sparse (one hit in bars 35–37).
- Note strings (bars 0–4 / 4–20 / 28–44):
  groove + groove-open: `L R L R L` / `L R L R L R r l r l r r l r l r R L R L R` / `> r l !< J j < l r !> J j`.
  groove-tight: `L R L R L R r` / `L R L R L R r l r l r r l r l r R L R L R L l r l r l l r l r` / same hook.
- J→j gap: 180u = 1.45 s song time (1.45–2.14 s by class). Every perfect pilot clears every tap with a 4-tick
  press (phantom's full jump is 35 ticks, the rest 32). Tap window ≈ 11–12u on interceptor/phantom.
- Human deaths pro/club/rookie: groove 0/1/6 · groove-tight 0/1/2 (rookie freighter DNF at the 450 s cap, still
  moving) · groove-open 0/0/8. Rookie tap-hole deaths: groove 2 (phantom), open 6 (interceptor 2, phantom 4).
- Open wall area is ~92% less than the corridor (91k vs 1.17M u²). 286 of 1266 segments have no blocks.
  Rookie bumps: open 573 vs groove 505.
- The owner may mean height for the Believer curve. Only the lateral shape is built [unmeasured: owner view].

## Uncommitted

- None after this handover commit.

## Held files

- `apps/client/song-lab/**` · `packages/shared/src/sim/score/*` · the pacing/score lines in shared `index.ts`.

## Next

1. workerfour checks the 3 groove variants headless (it confirmed that `emit` needs no viewer change).
2. Owner review. Options: groove vs groove-tight feel; a height version of the Believer shape; hook timing
   against the real lyric (bars are guessed: hook on bars 2–4 of each 4-bar group).
3. If taps are too hard for rookies on slow classes: a longer tap (TAP_TICKS 5–6) or a 16u hole.

## Open questions

- Owner: keep the register gap (groove) or the backbeat grid (groove-tight)?
- Owner: is the Believer curve lateral (built) or height (ramp, then drop)?

## Lessons → memory

- `.claude/memory/open-islands-can-wedge-a-ship.md`.
