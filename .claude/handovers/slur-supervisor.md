Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, afternoon

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.
After sending to an idle worker, check the pane (`herdr pane read <pane> | grep -E "Message from|⏺"`); a queued
message can sit unread. Use `bash -c '…'` for herdr loops (the Bash tool shell varies).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE (2026-09-26): the worker who fixes an issue closes it with a SHA comment (CLAUDE.local.md §2,
  memory `worker-closes-its-issue.md`). Put it in every lane brief.
- WIDTH 96u (24 lanes). MATERIAL: dark graphite pitted metal everywhere; the deck adds the 4×4u plate grid.
- Hosted rooms default to GROOVE. The song work is a throwaway lens, freighter-only.
- #261 mine rules (stun 1.5 s, ×0.6, arm 0.5 s, trigger 3u, ttl 20 s, 3/owner). Every power fires forward (E) or back (F).
- Workers commit by explicit pathspec and push dev without asking.
- Audio direction: SCI-FI, not cartoon. CC-BY and CC-BY-SA accepted.
- Ship trails (#10) parked until after beta, in the polish pass.

## Landed this session

ab12a98 #267 sci-fi audio (closed by workerfive) · 84a2ff7 #252 server input validation (closed by workerfour)
· #227 closed by workerone: a–c were already in c99c40d; sky bake ≈112 ms per re-bake at DPR 1 (≈98 ms field,
13.6 ms relight); old/new still skipped on owner say-so.
Closed on owner say-so: #163 #170 #215 #222 #251 #264 (sign-offs), #20 (split), #10 and #109 (not planned).
Filed: #269 Boost pickup, #270 Shield pickup (both Backlog; each lists owner questions before build).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #227 done | idle, ~9%+ | none |
| workertwo | w2P:pF | none | idle, 21%: clear before reuse | none |
| workerthree | w2P:pG | none | idle, ~120k: clear before reuse | none |
| workerfour | w2P:pH | #252 done | idle, ~7%+ | none |
| workerfive | w2P:pK | #267 done | idle, cleared to 0% | none |

## Next

1. Owner to name the next lanes. Candidates: #6 respawn death-loop, #246 pacing accel, #172 frame-tap crash,
   #138/#127 canvas guard (may be stale: names deleted routes), #269/#270 once the owner answers their questions.
2. #267 follow-ups: owner ear check in a hosted room (pass-by, remote engine, lock loop unheard in play); a new
   issue for the 16 unchosen sound events and Q4–Q6 — owner has not said yes to filing it.

## Open owner questions

- File the #267 follow-up issue?
- Server 'fizzled' mine broadcast (visible fizzle feedback). Unanswered.
- Older: lint files over 300 lines; weave a/b/c; #254 class roles; #244 FRACTURE_RATE; net-debug-hud removal; review #236.

## Uncommitted

None of mine.

## Lessons → memory

none
