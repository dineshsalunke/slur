Agent: workerthree · Lane: #292 track forks · Updated: 2026-09-26

## Goal

Add forks to the groove generator. A wall or a gap divider splits the deck into two parallel lanes, and the lanes rejoin further on. Each lane must hold threadable clearance on its own.

## Done

- Read the issue, GDD §0, ADR-006/007/019/020 and the groove generator (`sim/groove/*`).
- Sent the plan, 7 owner questions and the S1 claim to slur-supervisor.

## State

- The default gen is `'groove'` (`sim/space.ts:132`).
- `OPEN_TARGETS.longestWall` = 60u fails any wall divider longer than 60u (owner question 5).
- #268 is still open for the owner's look test (09cb486).

## Uncommitted

None.

## Held files

None. The S1 claim is pending the supervisor's answer.

## Next

1. Wait for the owner's approval and answers, relayed by the supervisor.
2. S1: `groove/fork.ts`, and reserve fork slots in `line.ts`, the same way arenas are reserved.
3. S2: live check on /test-level. Close #292 with the SHAs.

## Open questions

The 7 questions in the plan message: generators, divider mix and gap width, frequency, lane content, longestWall exemption, digest re-pin, forks vs arenas.

## Lessons → memory

none
