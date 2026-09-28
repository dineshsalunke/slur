Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-28 late night (seam 7)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"`; loop reads
until 0%. Use `bash -c '…'` for herdr loops. Reply to a worker's cross-session message with SendMessage to its
`from=` socket. Older history: `git log -p -- .claude/handovers/slur-supervisor.md` (seam 6 = 9c4baa0).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh` (refuses dirty tree / unpushed HEAD).
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- #352 decisions: background = nebula-backdrop.jpg (flat); HDRI lights only, never the background; default
  self-hosted 1k kloppenheim_02_puresky; paste field dev-only; rocks lit by HDRI only; landing loses near fill.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | — (#352 done 90a2699) | IDLE, cleared + resumed | none |
| workertwo | w2Z:p3 | #350 seam on every exposed wall end: plan done (option A = seam 0.28u inside each open corner) | WAITING: "go ahead with option A" sits UNSENT in its prompt box — owner must press Enter or say go | sealed-block-variation.ts(+test), track-blocks/track-blocks.utils.ts(+test) |
| workerthree | w2Z:p5 | — (#351 826340a, #353 765ab59 done) | IDLE | none |
| do-setup | w2Z:p4 | infra | idle | — |

## Done this seam

- #351 live Accent.color dial 826340a · #352 image backdrop + Poly Haven HDRI env, key light/near fill/procedural
  sky/Tuning folder removed 90a2699 · #353 tone-mapping mode + exposure dials, HDRI status row removed 765ab59.
  All closed by their workers; all await the owner's /test-level check.

## Open owner questions

1. Seam reflections (golden reference streaks on the deck): file + give workerthree plan-first? Options relayed:
   fake additive streaks (all tiers, cheap) · emissive-only mirror pass (high tier) · RectAreaLights near camera ·
   full planar reflector / SSR (too costly).
2. Bring back the marigold band the baked env reflected into blocks/monoliths/ships?
3. Low tier: sky image ignores tone-mapping dials (three never tone-maps an sRGB background) — match it?
4. #344 perf run: needs an owner time window (one headless Chrome ~20 min); run after #352 (done).
5. Deploy (everything through #353 is pushed).
6. Power-slot leak (resetSlot() never called) — file it?
7. #349 RFC §8 Q1–Q10.
8. Older: .glb models issue, kick on results rows, #14 reconnection Q1/Q2, #312/#313, #16, #342 gaps.

## Uncommitted

None.

## Next

1. On owner go for #350 → workertwo builds.
2. On owner answer to Q1 → file the reflections issue, brief workerthree plan-first.
3. On owner deploy → ping workerone (/metrics, close #337/#339) and workertwo (close #338/#340/#341).

## Lessons → memory

none
