Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-28 ~23:50 (seam 10)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"`; loop reads
until 0%. Use `bash -c '…'` for herdr loops. Reply to a worker's cross-session message with SendMessage to its
`from=` socket. Older history: `git log -p -- .claude/handovers/slur-supervisor.md` (seam 9 = 9210735).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh` (refuses dirty tree / unpushed HEAD).
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- #352 decisions: background = nebula-backdrop.jpg (flat); HDRI lights only, never the background; default
  self-hosted 1k kloppenheim_02_puresky; paste field dev-only; rocks lit by HDRI only; landing loses near fill.
- 2026-09-28: marigold env band comes back (#356). Low-tier sky should follow tone-mapping dials: "try to" (#357).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #354 fake deck reflections. PRIORITY sent: 3c576aa blacks the /test-level main view at quality=high (workerthree measured luma 85→0.4 at the commit; workertwo saw it too). Told: stop pickups/exhausts, bisect rail-sheen vs block-reflections, clamp the NaN, commit fix alone, report SHA; >30 min → I ask owner about reverting 3c576aa. Then pickups/exhausts, then part 2 (Wear + anisotropy) | FIXING BLACK | deck-reflection/*, block-/pickup-/exhaust-reflections/*, track-floor.tsx, track-blocks.tsx, pickup-field.tsx, exhaust-field(+utils,+constants), tuning-schema.ts, deck-breakup.ts, DECISIONS, ART_MATERIALS; later track-materials.ts |
| workertwo | w2Z:p3 | #350 DONE 16275c6 (closed). Cleared + resumed. Now #357 low-tier sky tone-mapping (scene-backdrop/*); claim list pending. Then #356 marigold band, needs scene-environment.tsx after workerthree releases it | BRIEFED #357 | (claim pending) |
| workerthree | w2Z:p5 | #355 Environment.intensity: scene path works (luma 17/85/147 at 0/1.2/5); per-material Deck/Rail/Rock/Ship.envMapIntensity dials do nothing (WebGLRenderer.js:2694 overwrites when material.envMap null). Blocked on high-black; told to write up fix meanwhile. THEN deck albedo match (measure + recommend) | BUILDING #355 | scene-environment.tsx |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner questions

1. #344 perf run: needs an owner time window (one headless Chrome ~20 min).
2. Deploy (everything through #353 + #350 is pushed; but 3c576aa blacks high — deploy AFTER workerone's fix).
3. Power-slot leak (resetSlot() never called) — file it?
4. #349 RFC §8 Q1–Q10.
5. Older: .glb models issue, kick on results rows, #14 reconnection Q1/Q2, #312/#313, #16, #342 gaps.
6. Does the owner's own /test-level at high render black? (asked)

## Uncommitted

None of mine.

## Next

1. workerone fix SHA → tell workerthree + workertwo to re-check high; tell owner deploy is safe.
2. workertwo claim list for #357 → clear against table.
3. workerthree #355 report → relay; on release of scene-environment.tsx → clear workertwo for #356.
4. workerthree albedo report → relay to owner; forward values to workerone (#354 part 2).
5. On owner deploy → ping workerone (/metrics, close #337/#339) and workertwo (close #338/#340/#341).

## Lessons → memory

none
