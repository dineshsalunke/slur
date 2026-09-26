Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, night (seam at ~150k)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.
SendMessage and a worker's own message often cross; if a worker says it is still waiting, send the answer
straight to its pane with `herdr agent prompt <pane> "..."`. Use `bash -c '…'` for herdr loops.
Never brief a worker to build or serve an old commit: that is a scratch stack (owner rule).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- WIDTH 96u (24 lanes). MATERIAL: dark graphite pitted metal everywhere; the deck adds the 4×4u plate grid.
- Hosted rooms default to GROOVE. The song work is a throwaway lens, freighter-only.
- #261 mine rules (stun 1.5 s, ×0.6, arm 0.5 s, trigger 3u, ttl 20 s, 3/owner). Every power fires forward (E) or back (F).
- Audio: SCI-FI, not cartoon. CC-BY and CC-BY-SA accepted.
- Ship trails (#10) parked until after beta.
- #269 Boost: now +75% (owner, 9be7439), 2 s, rise 0.25 s, ease 0.2 s. Owner wants motion blur and a camera
  pull-back with it (plan below). #270 Shield: 5 s, absorbs one hit.
- Bag 6/4/4/3/3. Review decisions: dead schema fields plain · dev routes dev-only · remove dead invuln (done).

## Closed this session

#172 4a8e1a8 (workerfive) · #273 c3ab18d · #275 fed4ac2 c2b9ac4 0afbef2 5ded0a4 (workerone) · #281 e13f35d
(workerthree) · #284 9d9779c · #285 7325f12 (workertwo).
#277: every slice is in. workerfour b7df188 62f663f 1b111b6 d342d6d 8ad39b0 e7ce4e7 b706baa bb433b0 47cce3e
5505ed8 6b0fc62 acdffa9 50c6e17; workertwo fc008d0 b06bd73. CLOSED by workerfour after the look check PASSED
(workertwo 446aa95, HEAD taps only). DEFAULT_TRACK_GEN is split out and waits for the owner (below).
#283: B1/B7 492e8d2, test-level 6ad8055. B4/B5 (game/scene moves) released to workertwo after the look check.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | none | cleared, idle | none |
| workertwo | w2P:pF | none (#283 moves done; last step handed to workerfive) | idle | none |
| workerthree | w2P:pG | none (#169 stopped: owner says #160/#161/#169 already done; closed) | idle | none |
| workerfour | w2P:pH | #287 remove /pacing + DEFAULT_TRACK_GEN=groove, closes #246 | resumed | claim pending |
| workerfive | w2P:pK | none. #269 blur + pull-back SHIPPED f0056b3 (open for owner feel test); #283 CLOSED, grit rule at error | idle | none |

## Open owner questions

1. #160 #161 #169 were already done (owner); closed with a comment. Stale open issues exist: check before assigning.
2. Idle: workerone, workertwo, workerthree. Candidate left: #248 (procgen shadow rule).
3. Older: #269 brake-cancel + streak length; #270 dome opacity; #280 derezz zap as fizzle.

## Next

1. On boost approval: tell workerfive to build. Its files are free; keep workertwo's B4/B5 out of them.
2. On the look-check result: close #277, or route a deviation to workerfour.
3. On the workerthree report: note the #275 result on the issue (it is already closed).
4. On the /pacing answer: workerfour does DEFAULT_TRACK_GEN (its claim was in cb704b2's handover).

## Uncommitted

None of mine.

## Lessons → memory

none (the IPv4/IPv6 CDP port note is already in check-the-cdp-port-is-yours.md, per workertwo)
