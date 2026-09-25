Agent: workertwo · Lane: track width 64u → 80u trial (#257) · Updated: 2026-09-25

Older versions hold the material-regression lane (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Audit every consumer of the track width. Build an 80u trial in a worktree. The owner flies 64 and 80
side by side. Nothing lands on dev until then.

## Done

Worktree `../slur-worktrees/width-80`, branch `feat/width-80` off origin/dev 93121c6 (owner-approved). Not pushed.

- fef094f — one width source. `FlightTuning.halfWidth` removed. `step.ts` `deckLimit` and
  `respawn-point.ts` read `HALF_WIDTH`. Green at 32 (shared 331/331).
- 7266c68 — `HALF_WIDTH = 40`. Re-pins the weave contract. Makes fixtures width-relative. Moves the
  pocket fixture.

## State

- Tests at 80: shared 331/331, server 17/17, client 340/340. Typecheck and lint green at fef094f.
- Of 10 shared failures at 80, 6 were clearance fixtures with hand-typed x edges (20, 26, 28, 29). Now `HALF_WIDTH - n`.
- 1 was the weave contract. Weave amplitude is `LANES`, so `FZ_ROWS` 49→55 and `WEAVE_PERIOD_ROWS` 67→82. The weave swings take 22% more z. The slope and curvature caps are unchanged. 3 digests re-pinned.
- 1 was `arms.test.ts`: a wall ended at x 32, the old edge. At 80 that left an 8u slot. Now `HALF_WIDTH`.
- 2 were the phantom pocket on seed 20260921 z 1200–1278. It is gone at 80. The new box is z 6818–6837, x 10–16. The stop window is 6837.3–6840.4 (3.1u), toX 3.
- Latent: `route-graph.test.ts` had ±32 walls and floors that still passed. Now `HALF_WIDTH`.
- No pinned score sha in the suite. `motifDigest` is unchanged at 80.
- Flyability. Pilot `fly2.mjs` in this session's scratchpad: workerone's avoid pilot with the kick-aware `strafeToward`.
  - groove 64: 150/150 finish, 0 deaths, 41 bumps. 60 blocks per seed. Open floor 98.0%. Widest run 61.2u.
  - groove 80: 150/150 finish, 0 deaths, 29 bumps. 60 blocks per seed. Open floor 98.4%. Widest run 76.5u.
  - Groove keeps its obstacle count, so obstacles per unit area fall by 20% at 80.
  - weave 64: 31/150 finish. weave 80: 9/150. This pilot is not valid on weave (8/30 at 64 for the interceptor). Read it as relative only.
  - Weave scales with lanes: blocks per km 60.4→77.7 (+29%), closed area per m 83→118 (+42%).
- Edge exposure (ticks within 4u of the deck limit): groove 0–0.9% at both widths. Weave 2–7% at 64, 0.4–3.4% at 80.
- Pocket scan at 80: many phantom and freighter pockets sit against the deck edge (x ≈ −38.8), the new outer strip.
- Client consumers derive from `HALF_WIDTH`: rails, rail glow, monoliths (`RAIL_OUTER`), asteroid corridor, finish gate (16→20 columns), seams, meteors, pacing strip.
- Deck texture tiles on `TEX_SPAN_X` = 16u, with RepeatWrapping. 80u is 5 whole tiles, as 64u is 4.
- Camera [inferred, not captured]: vfov 70, back 14, 16:9 gives a half-width of about 1.245 × distance. From x 0 the rails at ±32 enter the frame about 11u ahead of the ship. At ±40 they enter about 18u ahead.
- Stack for the owner (80u): client http://localhost:5174 (node PID 94656), server ws :2568 (node PID 94657), `pnpm dev` parent PID 94568. Log: `../slur-worktrees/width-80-dev.log`. No `SLUR_TRACK_GEN` on either server, so both hosted rooms use weave. `/test-level` defaults to groove.
- `:5173` / `:2567` is the main checkout. It has uncommitted work (`ship-classes.ts` and others), so it is not a clean 64 baseline [unmeasured by how much].

## Uncommitted

None in the worktree. `apps/client/.env` there is gitignored.

## Held files

None on dev. The worktree is mine.

## Next

1. Owner flies :5173 against :5174 (`/test-level` for groove, a hosted room for weave).
2. On a decision to keep 80: rebase `feat/width-80` onto dev and fix GDD §0 ("Track width | 64u"). If weave stays live, decide whether its block count should scale with lanes. Then merge.
3. Kill the stack when the owner is done: `kill 94568 94656 94657`.

## Open questions

- Owner: 80 or 72? Groove holds its encounters per metre at any width, so it only gets roomier. Weave gets 29% more blocks at 80.
- Owner: should weave keep its block count per metre (density ∝ 1/width), or keep its density per area as today?

## Lessons → memory

`.claude/memory/fixtures-must-be-width-relative.md`
