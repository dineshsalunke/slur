Agent: workerone · Lane: RFC-349 F2 tug pilot (#390) — BUILT + COMMITTED f4e78880, not pushed, waits on F3 · Updated: 2026-09-30

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#390: move tug into two feature folders, cut its lines from central files, measure per RFC §3.8. F3 = the
owner's go/no-go on the numbers.

## Done

- F1 #385 closed (1a5415c7 + f912f7ab).
- **F2 sim half + client half: f4e78880** (one commit; the body says the wire order changed on purpose).
- Docs in the same commit: RFC §3.8 "F2 result" + §7 F2 row; `conventions/features.md` §3 as-built slots +
  leaf-import rule, §4 wire-order note (rules 1–3 reworded).
- Numbers posted on #390 (comment 5907837880). Seam report sent to the supervisor.

## State (measured this session)

- Tests: shared 583/583, server 99/99, client 710/710. Typecheck clean. Lint clean (9 old length warnings).
- D1: two SDK clients on the owner's :2567 decode 39 fields, tug at 35–38, 0 decode logs in 6 rooms. Forward
  tug: A.tugTimer 1, B.slowTimer 0.6. Back tug: B.towTimer 0.6. Both clients decoded the timers.
- simulate() HEAD vs F2 (node on dist, 5 alternating reps): idle 0.159 → 0.168 µs, tug 0.185 → 0.181 µs.
  The final ship state is bit-equal.
- /test-level draws 74 = baseline. Frame ms NOT measured: headless capped at 60 Hz (menu 16.6 ms).
- Central files naming tug: 19 → 8 (2 registry lines, 5 by D2/D3, 1 index.ts export).
- Scratch drivers (lost if /private/tmp is cleared): `…/6d04acb8-3a53-47e6-b881-cef6c9768020/scratchpad/`
  `d1-tug.mjs` (FORWARD=1), `inproc.mjs`, `f2-step.mjs`, `f2-frame.mjs`; `old/` = HEAD shared build.

## Uncommitted

- none.

## Held files

- none after this seam. The supervisor can release the F2 claim.

## Next

1. Wait for F3 (owner go/no-go on the §3.8 numbers, relayed by the supervisor).
2. On go: the owner pushes (or approves a push), then `gh issue close 390 -c "<what shipped + SHA>"`.
3. Open follow-ups: `.claude/rules/features.md` still says "Append only; never reorder". It needs the F-stage
   exception from `conventions/features.md` §4 (not claimed, so not edited).

## Open questions

- Owner: F3 go/no-go. The central count is 8, not ≤ 2, because of D2/D3.
- Owner: `.claude/rules/features.md` wire rule wording (see Next 3).

## Lessons → memory

- `.claude/memory/check-headless-frame-cap-first.md` (written this seam).
