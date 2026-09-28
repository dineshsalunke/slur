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
2. MERGE workertwo's net-half section — RECEIVED, NOT YET MERGED:
   `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/37700c16-63ca-4985-a595-1c5c60d9c91b/scratchpad/rfc-349-s4-modules.md`
   (4.6 facts, 4.7 options a1–a6 / b1–b6 / c1–c6, 4.3 C action map C1–C6). Their headline, verified by
   them against @colyseus/schema 4.0.30 / core 0.17.47:
   - `defineTypes` (annotations.d.ts:76) and `schema()` (:108) exist; call order = wire order
     (Metadata.ts:202–206). Client decodes by reflection (matchmaking.ts:65/70/75), so order only needs to
     be deterministic on the server.
   - HARD CAP 64 fields per Schema (Metadata.ts:73); PlayerState has 39 → 25 left for all features.
   - Child Schema per feature breaks the flat sim (tug fields flat on PlayerState/SimShip, SIM_SHIP_KEYS /
     SIM_FLOAT_KEYS sim/types.ts:83). Lean b5: `schema({...core, ...tug.fields})`; key lists from the same object.
     → rewrite RFC §3.4: the schema exception goes away; add the 64-field cap as a new ranked problem/risk.
   - Messages: Colyseus 0.17 declarative `messages` + validate() (Room.d.ts:174, :51), unused. Lean a6
     (events via RunSim ctx.broadcast) + a3 for commands once a validator is approved.
   - Config: lean c4 — one `defineRules` spec per feature drives defaults, server clamp, B2 key check and
     dev dials; removes 8 duplicated Tug.* dials (tuning-schema.ts:118–125). Keys `tug.pullS`; server
     merges the fround-ed float32 value.
   - Action map: C2 now (base for #348), C3 (action bits in PlayerInput) later under a netcode ADR.
   Update §8 Q7 (answered) and §4.3 C.
3. Send the supervisor the summary to relay to the owner (§8 questions 1–6).
4. #345: close after owner sign-off. After deploy: prod /metrics, then close #337/#339.

## Open questions

- Owner: §8 of the RFC (feature modules, D1→D3, O1, rule C, B2, #70 scope, dev dials in hosted rooms).
- Owner (#345): hulls dark (#4a4d52, current) or bright (#7b7f86)?
- Kick button on the results rows (#342 follow-up)?

## Lessons → memory

- none this seam.
