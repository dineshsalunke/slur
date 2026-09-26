Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-26, late night (resumed after /clear)

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Read the context bar with `grep -oE "│ [█░]* [0-9]*%"` (a bare
`[0-9]+%` catches the weekly-usage figure). The first reads after /clear often show the old percent; loop
reads until 0%. Clear a worker before assigning if it is past 10%. Use `bash -c '…'` for herdr loops.
Never brief a worker to build or serve an old commit: that is a scratch stack (owner rule).

## Standing owner decisions

- OWNER RULE: dev only, ONE stack (:5173/:2567). No worktrees, no scratch stacks.
- OWNER RULE: the worker who fixes an issue closes it with a SHA comment. Put it in every lane brief.
- OWNER RULE (memory owner-tests-on-test-level): the owner tests everything on /test-level. Every brief says so.
- Single-player mode will come later, without a server room. #288's LoopbackRoom is its base (not dev-gated).
- WIDTH 96u. MATERIAL: dark graphite pitted metal. Hosted rooms default to GROOVE.
- Every power fires forward (E) or back (F). Audio sci-fi; reuse existing sfx for new pickups for now.
- Portal approved at 2/20. Tug share still TBD (see open questions).

## Shipped / filed this session

- #269 blur 16bc5ef — OPEN for owner feel test. #268 rear-view 09cb486 — OPEN for owner look test.
- #288 one run path DONE + CLOSED (workerone). RunSim shared; /test-level on LoopbackRoom.
- #289 portal: S1 6dd1368, S2 664cc60 (portalRatio 0 until S3). #290 tug: S1 403f8de, S2 72eafc0 (tugRatio 0 until S3).
- Filed: #291 boomerang, #292 forks, #293 triggered hazards, #294 parry, #295 blink (after #289), #296 RFC polarity
  lanes, #297 membrane.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | none | idle, 14% (clear before assigning) | none |
| workertwo | w2P:pF | #290 tug S3 QUEUED behind portal S3 | idle, 13% | none |
| workerthree | w2P:pG | none | idle, 11% | none |
| workerfour | w2P:pH | #289 portal S3, RESUMED (claim pending) | working | awaiting its S3 claim |
| workerfive | w2P:pK | none | idle, 11% | none |

## Serialization

Portal S3 (client mirror, seeker-pickups/*, pickup-field.tsx, attach-room-to-world, prediction, ecs snap,
portalRatio → 2/20) runs first. Tug S3 wants pickup-field.tsx + attach-room-to-world.ts: start it only after
portal S3 commits. workerfour messages workertwo + me on commit. workertwo is at 13%: clear it, then resume with
"You are workertwo. Resume from .claude/handovers/workertwo.md. Read CLAUDE.local.md first. Your #290 S3 claim is next."

## Open owner questions

- BAG MIX. Test-proven at 0.1 each: bolt 3 · seeker 3 · mine 4 · boost 3 · shield 3 · portal 2 · tug 2. Mine
  outnumbers bolt, so seamSafe keys on mine. My proposal: bolt 4, mine 3. Owner to pick before tug S3 sets tugRatio.
- #289 portal loop: a chaser in your far end is thrown back and loops until they strafe or the pair expires.
  Add a per-ship hop cooldown? Owner to decide.

## Next

1. Answer workerfour's portal S3 claim.
2. On portal S3 commit: clear + resume workertwo on tug S3.
3. Idle workerone/three/five: candidates #291 boomerang (touches combat/bag: serialize), #292 forks (generator
   only, safe now), #297 membrane (step.ts), #293 hazards (needs art cues). Clear past 10% first.

## Uncommitted

None of mine.

## Lessons → memory

none
