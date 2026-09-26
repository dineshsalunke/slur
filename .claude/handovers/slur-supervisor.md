Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, midday

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
- Audio direction: SCI-FI, not cartoon (#267). CC-BY and CC-BY-SA accepted.

## Landed this session

3948541 #258 graphite (closed by me: workerone's `gh issue close` was denied by its permission check) ·
2ce75a4 #265 pickup spread (closed by workerfour) · 107413c dead RearView.featherX/Y removed ·
a13fa8e memory: worker closes its issue.
Closed on owner say-so: #173 #34 #31 #253. #20 commented: mine OK in /test-level, needs multiplayer test;
shield/boost not built.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #258 done | idle, ~8%+ | none |
| workertwo | w2P:pF | none | idle, 21%: clear before reuse | none |
| workerthree | w2P:pG | none | idle, ~120k: clear before reuse | none |
| workerfour | w2P:pH | featherX/Y done | idle, fresh after clear | none |
| workerfive | w2P:pK | #267 sci-fi audio: BUILDING (owner GO: Opus .ogg no brew, Safari check by version, mp3 fallback; jump B; 3 most-distinct bolts; engine values as planned; boost unbound). Full plan text re-sent by message after its /clear | working | apps/client/app/audio/**, public/audio/**, docs/AUDIO.md, docs/DECISIONS.md (ADR-021) |

Audition page backup: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/469ab117-3ee3-402b-8588-c8760d2324fd/scratchpad/cuts/index.html`.

## Next

1. workerfive reports #267 SHA → relay to the owner; it closes #267 itself.
2. Owner to name the next issues for workerone/two/three/four (all idle; clear two + three before reuse).
3. `Bash(gh issue close:*)` added to .claude/settings.local.json (owner approved). Running workers may need a
   restart to pick it up [unverified].
4. Dev stack: server (PID 72031) auto-reloaded on the #265 dist (11:08); client (85264) needs only a browser
   reload [inferred]. No restart done.

## Open owner questions

- Server 'fizzled' mine broadcast (visible fizzle feedback). Unanswered.
- Sign-offs: #163 #170 #215 #222 #251. #20 needs a multiplayer mine test.
- Older: lint files over 300 lines; weave a/b/c; #254 class roles; #244 FRACTURE_RATE; net-debug-hud removal; review #236.

## Uncommitted

None of mine. CLAUDE.local.md edited (§2 close rule); it is not tracked by git.

## Lessons → memory

worker-closes-its-issue.md (a13fa8e).
