Agent: workerone · Lane: #349 architecture RFC (LEAD) · #345 shipped, owner check pending · #337/#339 open until deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#349 RFC ONLY, no source edits. I own `docs/RFC-349-ARCHITECTURE.md`. Feature modules, pilot = tug.

## Done

- Draft `af25d7c`. workertwo net half `1a1c39c`. Schema off-by-one `b304d32`.
- workerthree §5 MERGED (commit carrying this handover): §5.1–5.6 full; §2 rank 3 widened (mount-time
  order), new rank 6 (render/quality by mount), new rank 14 (per-frame waste); §3.5 → O1 systems + O5 views,
  9 phases; §7 their stages renumbered S13–S20 → S14–S21 (S12/S13 already taken); F1/S8/S9 now need S16;
  §8 Q8–Q10 from their §5.7.
- RFC is complete: no pending sections.

## State

- Verified this session: schema guard `index > 64`, index 64 = DELETE bit; PlayerState 39 fields;
  R3F events-156d8d12.esm.js :1129, :16171, :16188.

## Uncommitted

- none.

## Held files

- `docs/RFC-349-ARCHITECTURE.md` — only I write it.

## Next

1. Supervisor relays §8 Q1–Q10 to the owner. Fold owner answers into the RFC; set Status APPROVED or revise.
2. #345: close after owner sign-off. After deploy: prod /metrics, then close #337/#339.

## Open questions

- Owner: RFC §8 Q1–Q10.
- Owner (#345): hulls dark (#4a4d52, current) or bright (#7b7f86)?
- Kick button on the results rows (#342 follow-up)?

## Lessons → memory

- none this seam.
