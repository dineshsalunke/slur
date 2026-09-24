Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-24, ~13:10

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. The clear and resume steps are in memory `supervisor-clears-workers-via-herdr.md`.
The owner has given standing approval to clear workers at a seam (`herdr agent prompt <pane> "/clear"`, then re-read
the status line until it shows 0–5%; the first read after /clear can still show the old percent).

## Done this session

- #241 finish curtain `deabca3` (workerone). #238 results `7943126` `dc856e7` `ae5ec7b` (z-35, no label). #242 menu
  picker removed `0ab2cb9`, bank code removed `97df771` (workerfour).
- #231 graze `f5c8ff8` (option D, grazeDepth 0.5u). #232 pocket trap `56711c9` (a hit during stun is a plain stop).
  Both closed (workerthree).
- #243 seeker speed from the roster `1f1b0c3` at factor 1.15 (workerthree). Issue OPEN until the owner picks the factor.
- Pacing branching RFC ruled. R1 route graph + per-class pockets `2812078`. R2 per-arm metrics, easiest/hardest
  `6e67f53` (workerone). Both opt-in; /pacing unchanged.

## Workers

| Worker | Pane | Lane | Held files |
|---|---|---|---|
| workerone | w2P:pD | NEW: fractured-block shadow rule (owner: clear zone = 1 s at smashKeep × FASTEST_CRUISE; shadow = block x-span + one hull; violation → make the block sealed). Plan first; new file only; track.ts hook-up waits for #244 commit. #246 paused on the owner | packages/shared/src/pacing/*, index.ts export lines |
| workertwo | w2P:pF | /pacing lag: measured, NOT reproduced headless; waiting on the owner's repro | none claimed (routes/pacing/* proposed) |
| workerthree | w2P:pG | NEW: merge clustered blocks in the generator (owner, screenshot images/3.png in my scratchpad). Issue + RFC first | #243 files until the factor is set |
| workerfour | w2P:pH | #247 ship retune BUILDING. Owner-approved: speeds Int 84/60 · Fig 96/58 · Com 112/66 · Pha 90/52 · Fre 124/30; brakes 150/130/100/120/150; strafe keeps each class's pre-change angle (clamp 166/140/136/135/130), accel and damp scaled by the same ratio. PR #195 paused | ship-classes.ts, ship-classes.test.ts, track-contract.test.ts; GDD §5.5 waits for workerthree |

## Owner rulings this session

- Results above the curtain; drop the "Results" label; keep the winner square; remove the bank code. Orbit fallback: no change.
- Branching: fork = both arms >= 25u + one hull apart; difficulty binds the EASIEST route; a fractured block is a
  wall for viability AND a conditional arm; dead ends NOT allowed (per class). The owner sends no edited image.

## ~13:30 update: owner answered items 1–8; all four workers cleared and resumed

- workertwo: Web Worker + scroll paint delay ("scrolling left/right, content shows up late"); then release routes/pacing/*.
- workerone: X = stop window < ship length; hull z-length 6u; hardest = Viterbi cost; pickups in R4. Generator
  regenerate-on-trap HELD until #244 lands. R3 after workertwo.
- workerthree: #243 factor 1.5 (retime fixture), then #244 WAITS on the owner's option (5 vs 3), still unasked-answered.
- workerfour: merge PR #195 (only open PR) in a detached worktree; conflict list + plan first.
- #244: OWNER PICKED OPTION 5; sent to workerthree (builds after #243 closes). When it lands, release workerone's
  regenerate-on-trap step. workertwo claims routes/pacing/* (issue first, headless GPU raster only); workerone
  claims pacing X rule + 6u hull (cleared).
- PR #195 (workerfour, worktree ../slur-worktrees/merge-195): only 5 of 33 commits are the PR's. HELD: its base
  origin/dev 74a7b89 lacks this checkout's 40 unpushed commits. Needs owner: sync (merge origin/dev + push dev),
  then call A (drop rail bounce; the deck edges are fall-off now), B (port the engine glow only, retune for bloom
  threshold 0.6), C (push to dev and close #195).
- #243 CLOSED f9e0373 (factor 1.5). #244 built, UNCOMMITTED: workerthree's commit was classifier-denied; the owner
  must approve it in pane w2P:pG. Owner call: FRACTURE_RATE ×1.2 (94 fractured lost, 17%) or accept.
- workerone 1e7160c: X rule (window < 2·halfL) + 6u hull; the solver now uses legalMask (diagonal jump exits).
  Trapped pockets per class per seed are 9–56, measured on PRE-#244 track.ts. Next: re-measure after #244 commits,
  then the owner picks regenerate-per-segment vs avoid-at-source. workerone idle, holds pacing/*.
- #245 /pacing lag DONE 20caf85 (workertwo, idle): chunked polylines, Worker, report via context. routes/pacing/*
  released; R3 sent to workerone. Owner to retest /pacing scrolling.
- R3 board LANDED 85077ca (workerone, idle; stills in its scratchpad 0f01f9f0…/r3-*.png). Owner questions: count a
  zero-demand tie as a dodge? Add quiet bands and trapped pockets to the board? Next pacing step: R4 phrase RFC.
- R3 BUG (owner, images/4.png in my scratchpad): the hardest route near F4 climbs almost vertically, breaking the
  strafe clamp. Sent to workerone: find the cause, assert the clamp on every emitted route, issue + fix.
- #246 (workerone): the slope bug is a MODEL gap. The solver has no strafe acceleration (0 → 65 u/s in one row;
  sim strafeAccel 165). F4 hardest takes 0.49 s where a ship needs >= 0.62 s. Owner to pick: 1 velocity state in the
  solver (recommended, ~10× states) · 2 diagnostic only · 3 lower the solver rate.
The items below are the pre-13:30 queue; only item 9 remains open.

## Open owner questions (relay in this order)

0. #244 block merge (workerthree RFC, relayed): option 5 (in-segment guarded union + boundary abut; close pairs
   1,577 → 143, blocks −7%, clearance loss 0, ~10% of fractured blocks become sealed) vs option 3 (−29% blocks,
   needs cross-segment block ownership across sim, client streamer and pacing). Claims (option 5) are clear:
   sim/track.ts, new sim/merge-blocks.ts(+test), track.test.ts, DECISIONS/GDD lines. It may dissolve workerone's
   seed 20260921 z 1200–1278 pocket fixture: tell workerone to pin a hand-built fixture then.

1. My proposal awaiting a yes: workertwo moves the analyzer into a Web Worker now (analysis with R1+R2 on may near
   1 s [inferred]), then hands routes/pacing/* to workerone for R3. R4 phrase RFC after the owner sees the board.
2. Pocket trap threshold X (now 2u). Suggested: trapped when the stop window < that ship's length (traps phantom +
   freighter at the owner's z 1200–1278 fixture).
3. Generator on a trap: suggested regenerate the segment.
4. Contract hull z-length: suggested the Freighter's 6u.
5. Seeker factor: 1.15 (landed) or 1.5 (the lowest that catches a Freighter from 500u inside the 20 s TTL; one
   fixture needs retiming).
6. "Hardest route" ranking (suggested: keep Viterbi cost); pickups as a reward axis (suggested: yes, in R4).
7. /pacing lag repro: which action, browser, game tab open?
8. A lane for workerfour. Options: the perf fixes, the PR 195 rebase.
9. Older: owner-run `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; click Copy link; review #236.

## Blocked on permission

`git merge origin/dev` was denied (auto-mode classifier). Local dev may still be behind origin/dev: check
`git rev-list --left-right --count HEAD...origin/dev`. The owner runs it, or allows it.

## Uncommitted

none of mine.

## Next

1. Relay workerthree's block-merge RFC. Claim-check it against workerone (pacing reads the generator, does not write it).
2. On the owner's answers, dispatch items 1–8 above.

## Lessons → memory

none new. (Re-read a pane's status line after /clear; the first read can be stale.)
