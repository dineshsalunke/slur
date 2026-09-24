Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-24, ~16:55

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. The clear and resume steps are in memory `supervisor-clears-workers-via-herdr.md`.
The owner has given standing approval to clear workers at a seam (`herdr agent prompt <pane> "/clear"`, then re-read
the status line until it shows 0–5%; the first read after /clear can still show the old percent). Grep the status
line with `│ [0-9]*%`: a bare `[0-9]*%` matches pane text.

## Done this session (afternoon)

- #247 ship retune `821a78a` (workerfour). Owner-approved: speeds Int 84/60 · Fig 96/58 · Com 112/66 · Pha 90/52 ·
  Fre 124/30. Brakes 150/130/100/120/150. Strafe keeps each class's pre-change top-speed angle (clamp
  166/140/136/135/130); accel and damp scaled by the same ratio (Comet accel 290 for the armour-inverse test).
  Every class angle ≥ 46.4° = TRACK_CONTRACT 65/62. Freighter now threads 98 u/s (0.79 of top), not 69 (owner told).
- #249 filed: flaky bolt test run-room.test.ts:323 (1 in 8 at HEAD). Not fixed.
- #248 fracture-shadow check `b0a3977` (workerone). NOT wired: it seals 76% of fractured blocks. Owner: HOLD; solve in
  the score model. Hook-up diff in workerone's scratchpad (5b01310f…/hookup-248.diff).
- R4 score RFC rev 2 APPROVED in full; committed `.claude/phases/2026-09-24-r4-score-rfc.md` (798ac1d).
  Owner model: the track is a score of notes (L/R/J/JJ/held/SMASH/rest), tempo = distance grid, motif library +
  variation. Register gap: 0.5 s of calm after the END of every move at registerCruise 124, every note pair.
  Adherence 75% (owner, not 90%), accents 100%, calm tube ±5u, motifs seeded from the n3–n5 transcriber list.
- ADR-020 text parked at `.claude/phases/2026-09-24-adr-020-pending.md` (9db0be4). It goes into docs/DECISIONS.md
  after #244's ADR-019 lands.
- R4 S0 transcriber + /pacing Notes lane `c24f2bb` (#250). Today's tracks: 54% of notes breach the gap; adherence 37%.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | R4 S1 LANDED 4eacff7 (pilot = RFC §3; 15/15 motifs pass; motif digest 1779460072; forks J|R not parsed yet; motif weights are placeholders for the owner). S2 composer LANDED 4e66705 (35–47 notes/track, median 42; cross-phrase gap test; fixed S1 dead-reckoning bug). S3 emitter LANDED (handover 58bb78f): adherence 1.000 on seeds 1–30, 914 blocks/track vs 466 (preview pins + gates at 2.5u). Owner: PLAYTEST AS IS; EXEMPT JJ from "no two gaps in a row" on score tracks only. gen:'score' switch DIFF READY (884fa0e handover; diff at scratchpad 91190798…/gen-score-switch.diff, 8 files; shared 309/309, server 17/17 on HEAD 58bb78f + diff; apply with `git apply -C1` over #244's track.ts). Playtest: `SLUR_TRACK_GEN=score pnpm dev`. IDLE. S4 open item: the reference path treats fractured blocks as solid, so S notes get stuck | switch paths: space.ts, track.ts, schema.ts, track-provider.ts, run-room.ts, track.test.ts, new track-gen.test.ts, run-room.test.ts | constants.ts, sim/fracture-shadow.*, pacing/score.*, pacing/ngrams.*, index.ts export lines, sim/track-contract.test.ts, new sim/score/*, routes/pacing/* |
| workertwo | w2P:pF | none | idle at 15% (clear before assigning) | none |
| workerthree | w2P:pG | #244 block merge | built, UNCOMMITTED; commit waits for the owner's approval in its pane | sim/track.ts, sim/merge-blocks.*, sim/pocket.test.ts, docs/GDD.md, docs/DECISIONS.md |
| workerfour | w2P:pH | #251 BUILT 9b365f3 + 6bb632f, LOCAL, NOT PUSHED (owner checks on a real iPhone, Android and controller first). #252 filed (server input clamp). Follow-ups BUILT, LOCAL: 97dc750 icons, b58923f lobby fit (844×390 and 667×375 fit), a5cd9a2 key hint; handover 3c4a8c7. Client 299/299. IDLE | claims released | none |

## Sequenced behind #244's commit

0. Apply + commit workerone's gen:'score' switch diff (it touches track.ts).
1. ADR-020 into DECISIONS.md (parked text + workerone's JJ Amendment; delete the old "no two gaps … by construction" Consequences bullet).
2. GDD §5.5 class table for #247 (workerfour, or whoever is free).
3. The #248 hook-up is superseded by R4 (a test on score tracks), so do not apply it to weave tracks.

## Open owner questions

- Approve workerthree's #244 commit in pane w2P:pG. It blocks the score playtest.
- Add a JJ motif? The standard library has 0 JJ over 200 seeds, so a score playtest shows no double gaps.
- Score rooms have no pickups (S4). Client visuals that read weaveLineLanes may follow the weave line [unmeasured].
- #251: a maskable icon variant? Landscape notch safe-area padding in the lobby? Device check still pending.
- #246 is folded into R4. There is no separate choice left.
- PR #195: sync and A/B/C calls (see git log -p of this file for the detail). Paused.
- Older: owner-run `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Blocked on permission

`git merge origin/dev` was denied earlier (auto-mode classifier). Local dev may be behind origin/dev.

## Uncommitted

none of mine.

## Next

1. When #244 commits: have workerone apply + commit the switch diff, then the owner playtests score.
2. Then S4 (pickups on score tracks, fractured blocks in the reference path) for workerone.

## Lessons → memory

none new.
