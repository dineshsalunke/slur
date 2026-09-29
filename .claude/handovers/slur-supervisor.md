Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-29 (seam 14)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"`; loop reads
until 0%. Use `bash -c '…'` for herdr loops. Reply to a worker's cross-session message with SendMessage to its
`from=` socket (workerone = uds:/tmp/cc-socks/1146.sock, workertwo = uds:/tmp/cc-socks/1219.sock,
workerthree = uds:/tmp/cc-socks/58651.sock).
Older history: `git log -p -- .claude/handovers/slur-supervisor.md`.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh` (refuses dirty tree / unpushed HEAD).
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- Look (#364 254d267): HDRI cyclorama_hard_light 1k, Environment.rotation 210, intensity 1, Metal + Hull
  baseColor #232324, Neutral tone mapping exposure 1. Home, lobby and race all read one tuning.
- Env band (d6cb3f6): colour = Accent.color (bandColor dial removed), bandHeight 10, bandIntensity 2.
- FINAL KEY LAYOUT (#368, ADR-032): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd, D fire back,
  S/F prev/next slot, X drop, B mirror, M mute, Esc. Lobby ship picker ←/→ only (A/D removed 28da8f8).
- Rocks: Rock.spin default 0 (32852a5, #360).
- #369 nozzle hue: owner APPROVED option 2 (accent override on Marigold_emission + Engine_core, base black;
  engineIdle/Cruise 0.35/0.6) + EngineLight removal in one commit set. Option 4 (hue-preserving tone map)
  parked; owner has not answered on it.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | — (#369 shipped 4c66045 + e5b1e6d; OPEN for owner sign-off) | IDLE | — |
| workertwo | w2Z:p3 | — (mirror cost measured, handover cdadd1f; context likely >15%: clear before next lane) | IDLE | — |
| workerthree | w2Z:p5 | REMOVE rear-view mirror entirely (owner, 2026-09-29): render, panel, B key, pad/touch, slur.rearView, quality flag, dials, tests, ADR bullet, GDD + CLAUDE.md controls line, delete memory rear-view-panel-looks-like-geometry | BRIEFED, claim list pending | — (awaiting claim) |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner questions

1. Env band: done per owner spec; nothing open.
2. #369: owner to press "reset tuning" and re-check the near-camera orange streak (workerone could not reproduce).
3. Hue-preserving tone map follow-up (option 4)?
4. Older: 60 fps cap for heating / M1 Retina → medium; #344 perf run window; deploy (safe when pushed);
   power-slot leak (resetSlot() never called); #349 RFC §8 Q1–Q10; .glb models, kick on results rows, #14
   reconnection Q1/Q2, #312/#313, #16, #342 gaps.

## Done this seam

- MEMORY.md compacted b189813: 154 lines / 20.8 KB → 129 / 11.6 KB; 55 memories merged into 16 topic files;
  worktrees-are-for-concurrency deleted (contradicted by owner rule). Workers told to re-read MEMORY.md.
- #370 boost chevrons back face mirrored — workerthree 57f2bfe, closed.
- workerthree d6cb3f6 (env band) + 28da8f8 (picker A/D).

## Uncommitted

None of mine. The tree shows workerone's in-progress #369 edits.

## Next

1. workerthree sends the mirror-removal claim list → check it against the tree (no one else holds files) → clear.
2. Relay #369 owner answers (flatter nozzle OK? streak after reset tuning?) to workerone; it closes #369.
   Mirror cost (relayed): ON +0.55–0.8 ms, 129 vs 74 draws; owner chose REMOVE.
3. On owner deploy → ping workerone (/metrics, close #337/#339) and workertwo (close #338/#340/#341).

## Lessons → memory

`.claude/memory/supervisor-clears-workers-via-herdr.md` (now also holds herdr send-keys, queued messages, pane %).
