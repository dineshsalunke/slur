Agent: workerone · Lane: RFC-349 F4d boost (#404) — F4c mine (#403) DONE + closed · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Owner go-ahead (via supervisor, 2026-10-17): after F4c, do F4d boost (#404), F4e shield (#405), F4f portal
(#406), in order. Per stage: plan to supervisor (claim list, central-file counts, decisions + recommendations).
Supervisor approves plans that follow the F4a–F4c pattern and stay bit-equal; behaviour, wire or contract
changes beyond a new fixed hook go to the owner. Gates: A/B with negative control, draws, 2-SDK check, close
issue with SHAs.

## Done

- F4c mine: `2b8c9d53` sim, `90446c94` client, `7c5a28f8` docs. Pushed. #403 closed.

## State (measured)

- F4c live burst on /test-level (scratch `burst.mjs` in this session's scratchpad): mineBurst `trigger` reaches
  the client; shock = +2 draws for ~0.6 s over the dropped-feature control; steady +4 (slot views).
- Lint clean at `7c5a28f8` (7 pre-existing warnings). Full test gates not re-run after docs-only commit.
- Dev stack running (started by me earlier, owner OK). No Chrome left open.

## Uncommitted

- none.

## Held files

- none yet for F4d. Claim goes to the supervisor with the plan.

## Next

1. DONE: F4d plan B1–B8 sent to `slur-supervisor` (2026-10-17). Waiting for approval. B2 (move `boostTimer`
   to boost fields, index 27 → 38) is an owner call; rec A = move. Others: ship hooks thrust/cap/tick/clear
   (bit-equal by id order), glideTimer stays core, run.use spends `ctx.nextId()` first, bagWeight boostRatio,
   client moves look/streaks/pickups/glyph, blur + camera surplus stay central. Baseline: 36 non-test central
   files name boost (shared 9, client 27).
2. On approval: baseline HEAD dist first (as F4c, scratch `f4c-ab.mjs` in session 9a159aac), then sim half,
   then client half; same gates as F4c + beat-deck draws.

## Open questions

- none.

## Lessons → memory

- none (the live-burst recipe is in `stage-a-mine-on-test-level` + this handover; no new durable lesson).
