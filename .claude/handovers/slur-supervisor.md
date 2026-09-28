Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-29 ~00:30 (seam 11)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"`; loop reads
until 0%. Use `bash -c '…'` for herdr loops. Reply to a worker's cross-session message with SendMessage to its
`from=` socket. Older history: `git log -p -- .claude/handovers/slur-supervisor.md` (seam 10 = d4e9ddc).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh` (refuses dirty tree / unpushed HEAD).
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- #352 decisions: background = nebula-backdrop.jpg (flat); HDRI lights only, never the background; default
  self-hosted 1k kloppenheim_02_puresky; paste field dev-only; rocks lit by HDRI only; landing loses near fill.
- 2026-09-28: marigold env band comes back (#356). #357 option A (tone-map low sky, darker at default OK).
  #355 option (a) (one global Environment.intensity, per-material dials deleted).

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #354 reflections: 3c576aa + NaN fix 668df76 + pickups/exhausts f0562e7. Resumed: high perf rerun (+1.7 ms/+6 draws unconfirmed), gap-lip count, ADR, then part 2 (Wear + anisotropy). Albedo values NOT to fold until owner yes | BUILDING | deck-reflection/*, block-/pickup-/exhaust-reflections/*, track-floor.tsx, track-blocks.tsx, pickup-field.tsx, exhaust-field/*, tuning-schema.ts (handed back after 5c85b52), deck-breakup.ts, DECISIONS, ART_MATERIALS; later track-materials.ts |
| workertwo | w2Z:p3 | #357 DONE d4f12ae (closed). Told #356 moved to workerthree; idle | IDLE | — |
| workerthree | w2Z:p5 | #355 DONE 5c85b52 (closed). Albedo report relayed. Cleared + briefed #356 marigold env band; claim list pending (may need tuning-schema.ts → broker with workerone) | BRIEFED #356 | scene-environment.tsx (claim pending) |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner questions

1. Albedo: adopt Environment.rotation 180 + Metal.baseColor #595c62 as defaults? (→ workerone part 2)
2. Left-rim rail sheen does not show under the white sky light on the deck: accept or raise gain? (workerone)
3. #344 perf run: needs an owner time window (one headless Chrome ~20 min).
4. Deploy: all pushed through d4f12ae; high-black fixed (668df76). Safe.
5. Power-slot leak (resetSlot() never called) — file it?
6. #349 RFC §8 Q1–Q10.
7. Older: .glb models issue, kick on results rows, #14 reconnection Q1/Q2, #312/#313, #16, #342 gaps.

## Uncommitted

None of mine.

## Next

1. workerthree #356 claim list → clear; broker tuning-schema.ts with workerone if needed.
2. Owner albedo yes → forward to workerone. Owner rim-sheen answer → forward to workerone.
3. On owner deploy → ping workerone (/metrics, close #337/#339) and workertwo (close #338/#340/#341).

## Lessons → memory

none
