Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-29 (seam 12)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"`; loop reads
until 0%. Use `bash -c '…'` for herdr loops. Reply to a worker's cross-session message with SendMessage to its
`from=` socket. Older history: `git log -p -- .claude/handovers/slur-supervisor.md` (seam 11 = dc175e6).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh` (refuses dirty tree / unpushed HEAD).
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- #352: background = nebula-backdrop.jpg; HDRI lights only; default 1k kloppenheim_02_puresky.
- #355 (a) done · #357 A done · #356 marigold band: yes.
- #354: fix pickup-over-hole (done 59aa760); left-rim sheen ACCEPTED; albedo defaults ADOPT
  (Environment.rotation 180 + Metal.baseColor #595c62, in part 2); Wear: KEEP BASE values (owner liked base
  and w3, leans base). Block-streak fixes 6cb1f36/7cb7e05 (wedge, blur, butt-joint clearance).
- #358 Blur keys: Q throttle, A/↓ brake, ←/→ strafe, LShift/RCtrl fire fwd, RShift fire back, ↑ next slot,
  LCtrl+X drop (HUD shows X on Mac); W/S/E/F/X/R kept as silent extras; Space/M/1-3/Esc unchanged.

- #359 done 0bb4b5b; OWNER: engine deck pool → marigold accent (EngineLight.color default in tuning-schema.ts;
  sent to workerone, waits for the file back from workerthree). Wear=base recorded e80f54f.
- #358 done 93df4d2. Open: remove hidden W (Windows Ctrl+W closes tab)?
- #360 asteroids → workertwo, CLEAR for asteroid-surface.ts (sawtooth → bounded sine, no fade, speed 16→0.6,
  spin 3.35→0.5). tuning-schema.ts QUEUE: workerthree (loan, unedited) · workertwo (Rock.* defaults, will
  message "ready for tuning-schema") · workerone (EngineLight.color → marigold, + 2b if (b)). One at a time,
  immediate pathspec commit, then hand to next.
- tuning-schema.ts: workertwo done cd742d0 → NOW with workerthree (GO sent) → then workerone (engine pool
  marigold). #360 DONE cd742d0 (closed); workertwo IDLE, no held files.
- #361 home-screen controls panel → workerone, CLEAR: input/keyboard.ts, input/power-select.ts, new
  input/key-label.ts(+test), power-rack.utils.ts, audio/game-audio/game-audio.tsx + new .constants.ts,
  routes/home.tsx, new routes/home/controls-panel/*.
- #354 part 2b anisotropy: OWNER CHOICE PENDING (a) drop [rec] / (b) dials default 0 / (c) 0.15 along z.
  workerone idle until answer or tuning-schema.ts returns.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #359 nozzles red-orange → marigold (quick, FIRST), then #354 part 2b anisotropy + fold albedo defaults (needs tuning-schema.ts back) + record Wear=base in ADR-031 | BUILDING | deck-reflection/*, block-/pickup-/exhaust-reflections/*, track-floor.tsx, track-blocks.tsx, pickup-field.tsx, exhaust-field/*, deck-breakup.ts, DECISIONS, ART_MATERIALS, track-texture.ts, track-materials.ts; tuning-schema.ts + tuning-panel.tsx ON LOAN to workerthree |
| workertwo | w2Z:p3 | #358 DONE 93df4d2 (closed), brief relayed. Flagged: Windows Ctrl+W closes tab (W hidden throttle) — owner question | IDLE | — |
| workerthree | w2Z:p5 | #356 marigold env band (GPU composite HDRI+band → PMREM on change) | BUILDING | scene-environment.tsx, env-band/*, tuning-schema.ts + tuning-panel.tsx (loan, additive Environment.band*) |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner questions

1. Streak length + blur right? (no Reflect.blur dial until tuning-schema returns to workerone)
2. File a 60 fps frame cap for heating? (M1 Pro gets high tier: DPR 2 + MSAA + post + rear view, no fps cap,
   ProMotion ≈120 fps [inferred]). Also offered: M1+Retina → medium default; #344 perf run.
3. #344 perf run window (~20 min).
4. Deploy: all pushed; safe.
5. Power-slot leak (resetSlot() never called) — file it?
6. #349 RFC §8 Q1–Q10.
7. Older: .glb models issue, kick on results rows, #14 reconnection Q1/Q2, #312/#313, #16, #342 gaps.

## Uncommitted

None of mine.

## Next

1. workerthree #356 SHA → hand tuning-schema.ts + tuning-panel.tsx back to workerone.
2. workerone #359 SHA → relay with /test-level brief.
3. workertwo #358 SHA → relay /test-level brief.
4. Owner answers → forward (blur dial, frame cap lane to whoever is idle).
5. On owner deploy → ping workerone (/metrics, close #337/#339) and workertwo (close #338/#340/#341).

## Lessons → memory

none
