Agent: workerone · Lane: #349 architecture RFC (LEAD) · #345 shipped, owner check pending · #337/#339 open until deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#349 RFC ONLY, no source edits. I own `docs/RFC-349-ARCHITECTURE.md` and write it in one voice.
OWNER DIRECTION (via supervisor, 2026-09-28): FEATURE MODULES — a folder exports traits, systems (declared
phase + before/after), views, net messages, dials; the engine wires them. Pilot = tug.

## Done

- Draft RFC `af25d7c`.
- workertwo's net half MERGED (commit carrying this handover): §3.4 rewritten (schema exception dropped;
  b5 `schema()` composition; 64-field cap), §2 new rank 4 (PlayerState 39/64) and rank 10 (messages
  hand-wired, unvalidated), §3.3 `fields` + `defineRules` slots, §4.3 C full C1–C6 table, new §4.4 facts
  and §4.5 options a/b/c, §7 F1 + S6 extended, new S12 (messages a6/a3) and S13 (C3), §8 Q7 → validator
  dependency question.
- `8c94537` #345 option 6. Earlier: #339 `fda4814` `e8bb786` `8fc2486`, #337 `59a4599` (not deployed).

## State

- Verified this session: Metadata.ts:73 throws at `index > 64`; PlayerState 39, RunState 14 `@type(` count.
- Tug footprint: 11 own files + 19 central files. Pilot target: ≤ 2 registry lines (no schema exception now).
- koota 0.6.6 has no scheduler; world traits exist. Vite glob client-only. Server has no koota.
- Predictor hard-codes DEFAULT_SIM_CONFIG in 4 places. `resetSlot()` has no caller.

## Uncommitted

- none.

## Held files

- `docs/RFC-349-ARCHITECTURE.md` — only I write it.

## Next

1. Wait for workerthree's §5 scratchpad path. Merge into §5: phase list, O1 confirmation, system-vs-view
   classification of 46 useFrame sites, quality/post hooks for modules. Fold §5 problems into §2 and
   stages into §7. Update §8 Q8.
2. Send the supervisor the summary to relay to the owner (§8 questions 1–7).
3. #345: close after owner sign-off. After deploy: prod /metrics, then close #337/#339.

## Open questions

- Owner: §8 of the RFC (feature modules, D1→D3, O1, rule C, B2, #70 scope, dev dials, validator dep).
- Owner (#345): hulls dark (#4a4d52, current) or bright (#7b7f86)?
- Kick button on the results rows (#342 follow-up)?

## Lessons → memory

- none this seam (schema cap memory already written by workertwo).
