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
- #352: background = nebula-backdrop.jpg; HDRI lights only; default 1k cyclorama_hard_light (#362 d47a026,
  owner picked it on /test-level; workerthree measuring band/rotation on it, then closes #362).
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
- #356 DONE 9c2ce73 (Environment.bandColor/bandIntensity 1.5/bandHeight 6°; rebake ~0.6 ms per dial change).
  workerthree IDLE, no held files. tuning-schema.ts + tuning-panel.tsx now back with workerone (engine pool
  marigold queued). Owner may want stronger band intensity. #360 DONE cd742d0 (closed); workertwo IDLE, no held files.
- #361 DONE 0ca2c3b (closed), brief relayed. workerone now on EngineLight.color → marigold. Was CLEAR: input/keyboard.ts, input/power-select.ts, new
  input/key-label.ts(+test), power-rack.utils.ts, audio/game-audio/game-audio.tsx + new .constants.ts,
  routes/home.tsx, new routes/home/controls-panel/*.
- #354 part 2b anisotropy: OWNER CHOSE (a) DROP. workerone BUILDING: EngineLight marigold → fold albedo
  defaults + Reflect.blur → close #354. Told to re-check rotation 180 on the new HDRI.
- #363 W throttle removed 056e436 (closed). workerthree IDLE, no files. OPEN OWNER Q: hidden R (Ctrl+R
  reloads mid-race), F (Ctrl+F find bar), E (Ctrl+E address bar): (a) remove [rec] / (b) preventDefault.
- workerone: rotation 180 + #595c62 fits cyclorama (deck luma 122→79, frame 103→67); told GO to fold.
- #362 DONE/closed. New HDRI ~2.5x brighter; band share falls 7–26% → 4–9%. Owner to test bandIntensity
  5–7 and Environment.intensity on /test-level, report dial values → workerthree folds defaults.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #364 DONE 254d267. NOW: seam-streak slant + fake look (owner imgs 22/23), INVESTIGATE + PLAN only, build after owner OK | INVESTIGATING | — (claims pending) |
| workertwo | w2Z:p3 | #360 done; ~12% context — clear before next lane | IDLE | — |
| workerthree | w2Z:p5 | FINAL KEY LAYOUT (owner): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd, D fire back, S/F prev/next slot, X drop, B mirror (was V), M, Esc. ALL old keys removed, no Mac split. Pad+touch remapped. New ADR supersedes #358. DECISIONS.md loan after workerone #365. I update CLAUDE.md line after it lands | BUILDING | — (claims pending) |

Open owner Qs (new): add "V mirror" to CLAUDE.md controls line (mine)? · Ctrl+1..3 switch tabs: (a) leave [lean] / (b) drop digit slot keys · mirror-off FPS: offered workertwo perf-analysis A/B.
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
