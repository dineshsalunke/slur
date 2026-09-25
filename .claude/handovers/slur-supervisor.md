Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-25, ~17:30 IST

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.
A queued SendMessage can sit UNREAD in an idle pane (workerone sat on the #258 split for hours). After
sending to an idle worker, check the pane; if the message shows as `› Message from…`, prompt it via herdr.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). A one-off song-lab worktree was allowed and is torn down.
- WIDTH 96u (24 lanes). MATERIAL: dark graphite pitted metal everywhere; the deck adds the 4×4u plate grid.
- Graphite #4a4d52. Hosted rooms default to GROOVE (ed3ef39).
- #258 option (c): push arch leg + groove bevel sign + #4a4d52 + lint now; pits + grain later (fewer, smaller pits).
- #259 ember ends at 1.0 s (cf09c55).
- #261 mine: stun 1.5 s + speed cut ×0.6, a bolt clears a mine, same look for everyone, ratio 0.20, arm 0.5 s,
  trigger +3u, jump clears at 2u, ttl 20 s, 3 per owner. EVERY power fires forward (E) or back (separate key = F).
  Mine back = at the ship; mine forward = 8u ahead. A back seeker flies −z and does not turn.
- Workers commit to local dev by explicit pathspec and push dev without asking.
- The song work is a lens, not a rhythm game. Freighter-only while experimenting.

## Landed today (after the morning list)

cf09c55 #259 meteor ember · ed3ef39 groove hosted default · 71b64c4 #261 mine + forward/back fire ·
f5804af #262 groove fractured smash blocks (10/18/23 per seed, 100% shadow-clear), per-seed pickup ids, bolt-break flake fixed.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #258 REDIRECT: scratched cast iron (owner ref .claude/frame-tap-refs/owner-refs/scratched-cast-iron.png; the pits still read as raindrops). Plan first, captures, HOLD push | cleared + assigned ~18:30 | dev/tuning-schema.ts, track-texture(.test).ts, pit-field(.test).ts, docs/ART_MATERIALS.md |
| workertwo | w2P:pF | none (#263 landed 5e2ccab: 0.8 s forward lead, own armed mine hits, back mine behind the tail) | idle 16% | none |
| workerthree | w2P:pG | #260 cartoon audio: proposal ready, waiting on the owner | idle | none |
| workerfour | w2P:pH | NEW bug: blocks with no longitudinal seam, near invisible in the dark. Suspect #262 smash blocks [inferred]. Plan first | cleared + assigned ~18:30 (audit done: 19 closed, table in its 08f6f8f5 scratchpad) | none yet |

## Next

1. workerone scratched-cast-iron plan → relay; then captures → owner OK → push. workerfour seam-bug cause → relay.
2. Owner: a mine can land INSIDE a block (floorUnder ignores blocks), 1.1% fwd / 0.6% back; it holds a slot 20 s. Fizzle it like a gap? Audit owner calls: close #31 #34 #253 #257? Sign-offs #163 #170 #173 #215 #219 #222 #251. (F key, gap = lose: answered.)
3. Owner answers on #260 audio (4 decisions): the tone split vs AUDIO.md §1 (needs an ADR), option A–G (rec E hybrid), lobby/run music, CC-BY SFX allowed or CC0-only. Audition page: workerthree scratchpad audition/index.html (path in #260). A #260 comment says checkThreat must use proj.dir.
4. Owner flies: #259 meteor, #261 mine (restart pnpm dev first; shared + schema changed), #262 groove smash blocks.

## Open owner questions

- Weave pickup ids are still String(seg) (fixed order per seed; ADR-002 pins them). Noted on #262.
- Lint: 3 files over the 300-line warning (run-room.ts 314, seeker.ts 315, seeker.test.ts 345).
- Weave a/b/c. Width feel at 96. #254 class roles. #244 FRACTURE_RATE. #251 device check. Score rooms have no pickups.
- Older: `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Owner's dev stack

Server :2567 (PID 17267), client :5173 (PID 85264).

## Uncommitted

none of mine. docs/art-direction/* changes are ChatGPT's; never touch them.

## Lessons → memory

A queued peer message can sit unread in an idle pane → recorded above under Goal; no memory file yet.
