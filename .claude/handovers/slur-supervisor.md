Agent: slur-supervisor · Lane: supervision + RFC-349 staging · Updated: 2026-09-29 (seam 17 — context warning at ~153k)

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
  plan: 9 phases, P2 render owner, quality service), Q5 = A: room config covers combat and world rules
  only; ship tuning stays fixed data (f090e82; commented on #70). Q6 = B: dev-build host dials write the
  B2 map in the lobby only, locked at GO; server accepts only in dev mode; built in S6 (RFC committed,
  #70 commented; workerone folds it into features.md with F1).
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
| S0 conventions | #382 | landed c1233064 (conventions/features.md; Q5–Q7 written as open) |
| S16 scheduler | #381 | landed f33da9f0 (0 % stale camera readers measured; owner try-it pending) |
| S8 input on sim tick | #383 | landed 8681e05 (30 sends/s, 2 inputs each; reconcile 0/198 before and after; hidden tab no worse) |
| S18 render system | #384 | landed ea385b6b, closed; pushed (by workertwo's push). S19 now unblocked |
| #386 landing canvas | #386 | landed 04684954, closed; pushed with workertwo's fb60a05f. fallback={null} → ~1 s clear-colour gap before the 3D scene; StillBackdrop hand-off needs a new reveal file (owner to decide) |
| S17 addEffect → phases | #387 | landed a3ee47ad, closed, pushed (HUD speed now this-frame 151/151) |
| F1 engine skeleton | #385 | landed 1a5415c7 + f912f7ab; pushed (by workertwo's push); workerone to close #385. features.md §8 now empty (Q6, Q7 folded) |
| S20 dial-sync | #388 | landed 9b5f38f2, closed, pushed. Material writes 29 → 7/frame |
| S19 quality hooks | (workertwo files) | ASSIGNED workertwo after the dial-sync schedule move |
| F2 tug pilot | (workerone files) | ASSIGNED workerone; claim pending. Must avoid dev/tuning.ts + track scene files (workertwo) and home route (workerthree) |

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2Z:p2 | F2 tug pilot | ASSIGNED; claim pending | — (F1 claims all released) |
| workertwo | w2Z:p3 | DIAL_SYNC → route schedules, then S19 quality hooks (Q9 reload-only) | ASSIGNED; claim pending (S20 landed 9b5f38f2) | — |
| workerthree | w2Z:p5 | #389 landing gap (follow-up to #386) | BUILDING (claim cleared; cleared + resumed after e1c15534) | routes/home/{landing-backdrop/*, landing-scene/landing-scene.tsx, NEW landing-reveal/*} |
| do-setup | w2Z:p4 | infra | idle | — |

## Open owner questions

1. RFC-349 §8: Q7 ANSWERED (54ff79b7): a3 with hand-written StandardSchemaV1 objects, no library (owner
   worried about wire lag; validation is server-side after decode, 0 bytes). workerone told; folds into
   features.md. Q9 ANSWERED: reload-only (S19 unblocked after S18). Was: Q9 (tier change rebuilds sky/track textures mid-race, or reload-only). Q10 is ours (measure).
2. Owner to try pad Start in a real lobby (#375).
3. Older: #369 streak after reset tuning; hue-preserving tone map (option 4); 60 fps cap / M1 → medium; #344
   perf window; power-slot leak (S5 fixes it); .glb models; kick on results rows; #14 reconnection Q1/Q2;
   #312/#313; #16; #342 gaps.

## Uncommitted

None.

## Next

1. Wait for F1 (#385, workerone), S18 + #386 (workerthree), S17 claim (#387, workertwo). Still free:
   S20, S21 (Q10 first); S4/S5 after F1.
2. Still free, unassigned: S17, S20, S21 (Q10 first); S4/S5 after F1 (both touch the bridge). S19 needs Q9.
3. F1 → F2 tug pilot → F3 owner go/no-go on the §3.8 numbers.
4. features.md §5 cites game/frame/schedule.ts `buildSchedule`; if it is renamed, update §5.

## Lessons → memory

none this seam (herdr clear/resume steps already in `supervisor-clears-workers-via-herdr.md`).
