Agent: slur-supervisor · Lane: supervision + RFC-349 staging · Updated: 2026-09-29 (seam 18 — context warning at ~157k)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "░+ [0-9]+%"`; re-read
until 0%. Reply to a worker's cross-session message with SendMessage to its name (workerone, workertwo,
workerthree). Older history: `git log -p -- .claude/handovers/slur-supervisor.md`.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE: the owner tests everything on /test-level. Every brief says so.
- OWNER RULE: never ask about an issue by number alone (title + one line).
- ONLY THE OWNER DEPLOYS: `! docker desktop start && ./scripts/deploy.sh` (refuses dirty tree / unpushed HEAD).
- Pushes: workers push their own green commits; a push carries every local commit (memory
  shared-tree-footguns "Amend and push"). The owner told the supervisor to push doc commits. Never push
  for a worker whose push was denied (permission laundering) — tell the owner.
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- Look (#364 254d267): HDRI cyclorama_hard_light 1k, Environment.rotation 210, intensity 1, Metal + Hull
  baseColor #232324, Neutral tone mapping exposure 1. Home, lobby and race all read one tuning.
- Env band (d6cb3f6): colour = Accent.color, bandHeight 10, bandIntensity 2.
- KEY LAYOUT (#368, ADR-032): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd, D fire back, S/F
  prev/next slot, X drop, M mute, Esc. Pad Start = action 'start' (#375).
- RFC-349 (`docs/RFC-349-ARCHITECTURE.md`) §8 all answered: Q1 yes, Q2 D1 now/D3 later, Q3 O1, Q4 rule C +
  B2 + four tiers, Q5 = A (room config = combat/world rules only), Q6 = B (dev host dials in lobby, locked
  at GO, S6), Q7 = a3 with HAND-WRITTEN StandardSchemaV1 objects, no library (owner: no wire lag;
  54ff79b7), Q8 yes, Q9 = RELOAD-ONLY for build-time quality knobs (17afbb4f). Q10 is ours (workertwo
  measuring). Each stage gets its own issue. Supervisor marks stage status in RFC §7.
- F2 owner answers: D1 = B (tug fields move to the feature spread; wire order changes once; client decodes
  by reflection — verified matchmaking.ts:75 passes no root class), D2 = a (tug rules keys wait for S6),
  D3 = keep HeldPower.tug central.

## RFC-349 stages

| Stage | Issue | State |
|---|---|---|
| S0 S1 S2 S3 S8 S10 S10b S14 S15 S16 | various | landed (see RFC §7) |
| S17 addEffect → phases | #387 | landed a3ee47ad |
| S18 render system | #384 | landed ea385b6b |
| S20 dial-sync | #388 | landed 9b5f38f2 + 80b9e8ef (route schedules) |
| S19 quality hooks | #391 | landed 393e7480 + a50cd135, closed. Owner check pending |
| F1 engine skeleton | #385 | landed 1a5415c7 + f912f7ab, closed |
| F2 tug pilot | #390 | BUILDING workerone. Sim half built, UNCOMMITTED on purpose until the D1 2-SDK-client proof. Expected central count ~19 → 7. Baselines (HEAD c99945c4): /test-level 8.30 ms best, 74 draws; simulate() 2.36–2.41 µs/tick at 4× throttle |
| F3 | — | owner go/no-go on F2 §3.8 numbers |
| S4/S5 | — | free, but both touch attach-room-to-world.ts (F2 holds it) → after F2 |
| S21 | — | after Q10 measurement and after F2 |
| S6 rules spec | — | free after F2; takes tug's 20 SimConfig keys (D2) |
| S12 messages | — | after F1; Q7 = hand-written Standard Schema |

Other landed today: #386 landing canvas 04684954; #389 landing gap 6acf1345 (still backdrop until first
paint). All pushed; dev = origin except workers' in-flight work.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #390 F2 tug pilot | BUILDING (cleared + resumed after b5247df6) | tug files → features/tug/ (shared + client); registries; engine slots; central cuts: step.ts, types.ts, run-sim.ts, combat.ts, power-bag.ts, index.ts, player-fields.ts, sim-config.ts (import only), NEW sim/status.ts, attach-room-to-world.ts, net-canvas.tsx (back from workertwo), pickup-field.tsx, seeker-pickups/*, glyph-atlas.ts, bind-room-audio.ts; listed tests; features.md §3 |
| workertwo | w2Z:p3 | none (perf skill fixed e5f71a16: ArrowUp moves 29.7 u; Q10 done → S21 deferred) | IDLE, needs a lane; context high → clear before next lane | — |
| workerthree | w2Z:p5 | none (#389 done: gap 0.93–1.03 s → 0 frames; told to close #389) | IDLE. Its amend ran on my f2859165, then it undid it with reset --soft; history verified intact and pushed | — |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner items

1. Assign workerthree a next lane (idle).
2. Owner checks: S19 on /test-level (mid-race tier switch: no hitch; home picker "Reload to apply");
   S20 dials (Deck/Rail/Monolith seamEmissive, Deck roughness then plate); #389 home page (no blank flash);
   S17 HUD speed; #375 pad Start in a real lobby.
3. Older: #369 streak after reset tuning; hue-preserving tone map (option 4); 60 fps cap / M1 → medium; #344
   perf window; power-slot leak (S5 fixes it); .glb models; kick on results rows; #14 reconnection Q1/Q2;
   #312/#313; #16; #342 gaps.

## Uncommitted

None of mine.

## Next

1. workertwo and workerthree both IDLE. Pick lanes that avoid F2 files (ask the owner, or pull non-F2
   bugs from the issue list). S21 deferred (Q10 recorded in RFC §8).
2. workerthree: once unblocked, get the #389 gap ms; mark it in this file. Its next lane: free (candidates:
   S6 prep reading, or a non-F2 bug from the issue list — ask the owner).
3. F2: workerone proves D1 (2 SDK clients, no decode errors), commits, reports §3.8 → relay to owner as F3.
4. After F2: S4/S5, S6, S12, S21.

## Lessons → memory

Appended "Amend and push act on everyone's commits" to `shared-tree-footguns.md` (f2859165).
