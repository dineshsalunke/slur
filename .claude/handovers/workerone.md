Agent: workerone · Lane: #349 architecture RFC (LEAD) · #345 shipped, owner check pending · #337/#339 open until deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#349 RFC ONLY, no source edits. I own `docs/RFC-349-ARCHITECTURE.md` and write it in one voice.
OWNER DIRECTION (via supervisor, 2026-09-28): the central proposal is FEATURE MODULES — a folder exports
traits, systems (declared phase + before/after), views, net messages, dials; the engine wires them.
"Scale by adding a folder, not by editing central files." Pilot = tug.

## Done

- Draft RFC committed (see the commit that carries this handover). Sections: §1 measured map (incl. §1.8
  tug footprint) · §2 ranked problems · §3 feature modules (contract, two halves, schema exception, O1
  ordering, D1→D3 discovery, E1 boundary lint, tug pilot measures) · §4 workertwo's section MERGED ·
  §5 PENDING (workerthree) · §6 data rule C + constant tiers + folders · §7 stages S0–S11 + F1–F4 · §8 questions.
- Sent the outline to workertwo and workerthree. Sent both the feature-module direction.
- `8c94537` #345 option 6. Earlier: #339 `fda4814` `e8bb786` `8fc2486`, #337 `59a4599` (not deployed).

## State

- Tug footprint (measured, `rg -il tug`, tests excluded): 11 own files + 19 central files. Pilot target:
  ≤ 2 registry lines + the schema exception.
- koota 0.6.6 has no scheduler (index.d.ts:89 export list). World traits exist (types-*.d.ts:441–460);
  `useTrait`/`useTraitEffect` accept a World (react.d.ts:26,28). Verified.
- Vite 8.2.1 has `import.meta.glob` (types/importGlob.d.ts); client does not use it; server/shared cannot.
- Server has no koota. MAX_ROOMS = 12 (limits.ts:1). Cap 16 live worlds.
- Predictor hard-codes DEFAULT_SIM_CONFIG in 4 places (prediction.ts:52, systems.ts:16, net-systems.ts:49,
  deck-flight.ts:21); /test-level loopback uses tunedSimConfig → mispredicts.
- `resetSlot()` has no caller (power-select.ts:54) — real cross-run leak.

## Uncommitted

- none.

## Held files

- `docs/RFC-349-ARCHITECTURE.md` — only I write it.

## Next

1. Wait for workerthree's §5 scratchpad path (they are at a seam; handover d5efbe3). Merge into §5: phase
   list, O1 confirmation, system-vs-view classification of 46 useFrame sites, quality/post hooks for modules.
   Fold §5 problems into §2 ranking and stages into §7.
2. Wait for workertwo's net-half answer: messages, schema fields without a central edit (§3.4, verify
   installed @colyseus/schema), Rules namespace in B2; optional §4.3 C input options. Merge into §3.4/§4.
3. Send the supervisor the summary to relay to the owner (§8 questions 1–6).
4. #345: close after owner sign-off. After deploy: prod /metrics, then close #337/#339.

## Open questions

- Owner: §8 of the RFC (feature modules, D1→D3, O1, rule C, B2, #70 scope, dev dials in hosted rooms).
- Owner (#345): hulls dark (#4a4d52, current) or bright (#7b7f86)?
- Kick button on the results rows (#342 follow-up)?

## Lessons → memory

- none this seam.
