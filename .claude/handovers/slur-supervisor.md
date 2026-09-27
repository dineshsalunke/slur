Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-27

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"` (a bare
`[0-9]+%` catches the weekly-usage figure). The first reads after /clear often show the old percent; loop
reads until 0%. Clear a worker before assigning if it is past 10%. Use `bash -c '…'` for herdr loops.
Never brief a worker to build or serve an old commit: that is a scratch stack (owner rule).
A `/clear` sent while a worker is mid-turn queues behind that turn; wait for 0% before the resume prompt.
Reply to a worker's cross-session message with SendMessage to its `from=` socket address.

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE (memory owner-tests-on-test-level): the owner tests everything on /test-level. Every brief says so.
- Single-player mode will come later, without a server room. #288's LoopbackRoom is its base (not dev-gated).
- WIDTH 96u. MATERIAL: dark graphite pitted metal. Hosted rooms default to GROOVE (→ 'phrase' when #300 lands).
- Every power fires forward (E) or back (F). Audio sci-fi; reuse existing sfx for new pickups for now.
- Bag (owner-final): bolt 4 · seeker 3 · mine 3 · boost 3 · shield 3 · portal 2 · tug 2.
- Portal loop stays as built (GDD §10 Q8, 7980f45; comment on #289).
- Race end (2026-09-26, #301 DONE f811400): grace 45 s, NO time cap.
- Draw-call budget (2026-09-27): soft 200, hard 300; baseline 127 (perf-analysis SKILL §7, 3de8baa).
- Sky: keep procedural nebula (image would save ≤1.3 ms; half-res sky is the cheaper lever if ever needed).
- Marigold (2026-09-27): owner picked B `#F5B024` (was `#F59A24`); emissive intensity unchanged.
- #300 RFC approved: gen 'phrase', 600 segments (12,000u, may grow; no hard-coded length), 3-note motifs in
  every act (option A) → 5 sections (low, low, mid, mid, high), weave band 20/16/14u by act, weave ≤ 25%,
  parallel weaves (owner addition; RFC §2.3), forced pickup per set piece outside the bag, open-space targets
  changed for phrase only, retire weave/score at S7, fork 50/50 wall/gap acts 2–3. #292 folded in.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #306 reset (Backspace; Shift+Backspace clears start) + right-click Start here, start in URL ?start=x,z (owner GO); then #307 delete saved track (plan first) | building #306 | run-sim.ts + test, test-level-dev/*, test-level-room.ts, start-point/*, editor-map.tsx, track-editor.state.ts, track-editor.utils.ts (+test), editor-start-menu.tsx, edit/route.tsx, test-level/route.tsx, shared index.ts, run/start-point.ts (+test), track-editor.tsx |
| workertwo | w2P:pF | #305 strafe kick B: kickDistance 4 (0 = A), window = 4/strafeKick, stop dead on release (owner GO) | building | step.ts, constants.ts, ship-classes.ts, sim/types.ts, schema.ts, pacing/pockets.ts, strafe-kick.test.ts |
| workerthree | w2P:pG | #300 ADR-023 amended 97692ad (handover e913ded) | idle; OWNER: HOLD S4 until authored tracks exist (2026-09-27) | sim/phrase/*, avoid-pilot.test.ts, track-digest.test.ts, DECISIONS.md (ADR-023) |
| workerfour | w2P:pH | #295 blink: plan relayed, awaiting owner | idle, 8% | none |
| workerfive | w2P:pK | #14 reconnection: plan relayed, awaiting owner | idle, 8% | none |

#300 landed so far: S1 8a4f1dd · S2 0ae9967 + b90f436 · ADR-023 (Proposed) bbb44b4, 7b696f3. Owner can fly
`/test-level?gen=phrase`.

## Open owner questions

- **WEAVE SHAPE — ANSWERED 2026-09-27: B, straight sealed walls + slalom inside.** Owner wants the curved
  corridor gone first. LANDED 4ca02e7. Owner: Comet 72 in 14u "ok i think".
- **SPACING (owner "go", 2026-09-27):** slalom unreadable (posts stack, next gap hidden; Freighter bumps
  "very irritating"). Pitch = distance at design speed for reaction 0.3 s + kick/accel lateral cross + damp
  settle + hull, via simulate(); design speed act1 100% / act2 90% / act3 75% maxCruise, max over classes;
  applies to motif pins too. Briefed workerthree; numbers come back before commit.
- **Derived pitch DONE afcc66c** (owner go on all 4 recs): 0 bumps/0 deaths all classes; phrase length per
  seed 744–768 segments; posts per lane 2/3/3. Art-direction folder committed as-is 65d441a (owner OK).
- **#304 split (owner: 2 workers, talk only when needed, clean pushed tree before handover — done).**
- **#304 editor (owner, 2026-09-27):** throwaway top-down editor on /test-level; blocks (destructible/solid)
  + gaps; snap 1/2/4u; Edit → Save → Play loop; saved tracks = repo files for designing the generator.
- **#304 editor** shipped 5165d46, d382904, 6982014, 0130a63, 12a91b7 (sim freeze), 249d47f (zoom 25–800%).
  Reopened for the eraser fix; workerone closes it again with the SHA.
- **Untracked `tracks/groove-20260921-decompiled.json`** (saved 02:19): asked the owner if it is theirs →
  commit if yes, delete if not. Unanswered.
- **MEMORY.md is 20.7 KB** (hook read limit 24.4 KB; compact to < 17 KB). Supervisor job, not started.
- **Readability, still to ask the owner:** marigold glow on post faces; posts below camera eye line; floor
  chevrons at gaps. Owner stopped the multi-select to clarify spacing first.

- **Amber** `#FFB52E` (hue 41°) now ≈ new marigold hue; core→amber→marigold ramp differs only in value. Keep,
  or pick a hotter amber? (Open in ADD §3 / ART_MATERIALS §7 item 20.) ChatGPT paste note already given.
- **Portal models** (owner hero shots: linked-ring pickup, A/B gate): told owner procedural is feasible
  (instanced bevelled wedges + dashed emissive band + graphite material, ~2–3 draws/ring). Offered to file
  an issue — #303 DONE 5e9abd0 (draws: pair +6 incl. rear view, pickup 3). Open: gate rim reads dark, inner
  glow wall dominates at an angle; levers GATE_SLEEVE reach, PORTAL_ARMED_INTENSITY, lighter rim finish.

- **Stalled race exit** (no cap now): recommended a host "End race" button; alternatives: no-progress N s,
  grace after first drop-out, leave it. workertwo's finding: no host control mid-race (run-sim.ts:134/138),
  a connected wedged/AFK racer holds the room forever.
- **Freighter pin bumps** on phrase motifs: 19–23 bumps/run, ~25% slower. Owner playtest asked; untuned.
- **Owner finish times** per class on `/test-level?gen=phrase` (workerthree wants them for length tuning).
- **#14 reconnection** Qs: Q1 ex-host gets host back? Q2 drop a disconnected racer from race end at once or
  after N s? (Plan: sessionStorage token per roomId, stop inputs while dropped, clear server input queue.)
- **#295 blink** Qs: distance 24u fixed or speed-scaled; lateral held-strafe ±12u or nearest lane; back hop
  keeps vz?; server-only snap OK; bolt 4 → 2 to make room in the bag?
- Serialize #295 against #14 on run-sim.ts / attach-room-to-world.ts when they start.

## Next

1. Clear workertwo's #302 claim when it arrives; relay its paste-ready ChatGPT note to the owner; confirm close.
2. Clear/resume workerthree at seams; relay S3 results.
3. Relay any owner answers above to the right worker.
4. Later candidates: #291 boomerang, #297 membrane, #293 hazards (needs art cues), #294 parry, #299 Seeker.flyY.

## Uncommitted

None of mine.

## Lessons → memory

none
