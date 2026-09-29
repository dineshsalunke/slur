Agent: slur-supervisor · Lane: supervision + RFC-349 staging · Updated: 2026-09-29 (seam 16)

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
- Prod: https://slur.kurmah.studio. do-setup owns infra.
- Look (#364 254d267): HDRI cyclorama_hard_light 1k, Environment.rotation 210, intensity 1, Metal + Hull
  baseColor #232324, Neutral tone mapping exposure 1. Home, lobby and race all read one tuning.
- Env band (d6cb3f6): colour = Accent.color, bandHeight 10, bandIntensity 2.
- KEY LAYOUT (#368, ADR-032; mirror removed #371): ↑/↓ throttle/brake, ←/→ strafe, Space jump, E fire fwd,
  D fire back, S/F prev/next slot, X drop, M mute, Esc. Pad Start = action 'start' (#375).
- RFC-349 (`docs/RFC-349-ARCHITECTURE.md`): owner said YES to §8 Q1 (feature modules + tug pilot), Q2 (D1
  registry now, D3 later), Q3 (O1 order), Q4 (rule C, room config B2, four tiers — d15076e), Q8 (frame
  plan: 9 phases, P2 render owner, quality service).
  Each stage gets its own issue. Supervisor marks stage status in RFC §7 (workers do not edit the RFC).
- Supervisor calls the owner accepted without objection: S2 pad Start → 7th action 'start'; M no longer
  mutes while typing/with modifiers; S3 all 6 event queues drop OLDEST on overflow.

## RFC-349 stages

| Stage | Issue | State |
|---|---|---|
| S1 one client config | #374 | landed 41c9a41 (no live rubber-band check) |
| S2 input action map | #375 | landed cf8f95e (pad Start only unit-tested — owner asked to try once) |
| S3 event-queue helper | #376 | landed f3382cb |
| S10 .scratch.ts | #377 | landed 7a267ec + 564c84b |
| S10b constants scratch | #380 | landed a9f7b83 |
| S14 frame-phase constants | #378 | landed db2552d |
| S15 camera/Sim readers after NetLoop | #379 | landed dbaf3b2 (lag 1.96 u → 0) |
| S0 conventions | #382 | IN PROGRESS workerone (claim cleared 2026-09-29) |
| S16 scheduler | #381 | landed f33da9f0 (0 % stale camera readers measured; owner try-it pending) |

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | #382 S0 conventions | BUILDING | conventions/ecs.md, conventions/features.md (new), conventions/README.md, .claude/rules/features.md (new), .claude/rules/ecs-koota.md, CLAUDE.md |
| workertwo | w2Z:p3 | — (cleared to 0% after #376) | IDLE, cleared | — |
| workerthree | w2Z:p5 | — (#381 done, handover bd5d3a59) | IDLE | — |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner questions

1. RFC-349 §8: Q5 (#70: room config combat only, or ship tuning too), Q6 (dev dials in hosted rooms?), Q7 (valibot/zod
   for commands), Q9 (tier change rebuilds sky/track textures mid-race, or reload-only). Q10 is ours (measure).
2. Owner to try pad Start in a real lobby (#375).
3. Older: #369 streak after reset tuning; hue-preserving tone map (option 4); 60 fps cap / M1 → medium; #344
   perf window; power-slot leak (S5 fixes it); .glb models; kick on results rows; #14 reconnection Q1/Q2;
   #312/#313; #16; #342 gaps.

## Uncommitted

None.

## Next

1. Wait for #382 (workerone) to land; mark it Landed <sha> in RFC §7.
2. S16 landed, so S8, S17, S18, S20, S21 are free now (S21 measures §8 Q10 first; S19 also needs Q9).
   S4/S5 wait for S0. workertwo and workerthree are idle: owner to choose which stages to hand out.
3. After S0 + S16 → F1 engine skeleton → F2 tug pilot → F3 owner go/no-go on the §3.8 numbers.

## Lessons → memory

none this seam (herdr clear/resume steps already in `supervisor-clears-workers-via-herdr.md`).
