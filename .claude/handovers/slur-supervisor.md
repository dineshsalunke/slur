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
| workerfive | w2P:pK | #267 sci-fi audio: plan sent, WAITING on owner's 5 answers. Handover 1214ee8 | idle, fresh after clear | claims (not yet written): apps/client/app/audio/**, public/audio/**, docs/AUDIO.md, docs/DECISIONS.md (ADR-021) |

Audition page backup: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/469ab117-3ee3-402b-8588-c8760d2324fd/scratchpad/cuts/index.html`.

## Next

1. Owner answers #267: (1) Opus after Safari test, or brew vorbis-tools; (2) jump A or B (worker recommends B);
   (3) which 3 of bolt shots 9/57/61/75 s; (4) engine class pitch/bright values; (5) ship boost cue unbound.
   Relay to workerfive → build.
2. Owner to decide: add `Bash(gh issue close:*)` to allow list so workers can close issues. Do not edit
   permissions on a peer's request.
3. Owner must restart pnpm dev (shared + pickup id change from #265).

## Open owner questions

- #267 five asks (above). gh issue close permission (above).
- Server 'fizzled' mine broadcast (visible fizzle feedback). Unanswered.
- Sign-offs: #163 #170 #215 #222 #251. #20 needs a multiplayer mine test.
- Older: lint files over 300 lines; weave a/b/c; #254 class roles; #244 FRACTURE_RATE; net-debug-hud removal; review #236.

## Uncommitted

None of mine. CLAUDE.local.md edited (§2 close rule); it is not tracked by git.

## Lessons → memory

worker-closes-its-issue.md (a13fa8e).
