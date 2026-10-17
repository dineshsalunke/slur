Agent: workerone · Lane: RFC-349 F4e shield (#405) — plan sent, awaiting approval · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Build F4e shield once the owner approves the plan, then F4f portal (#406) with a plan first.

## Done

- F4d boost closed: sim `843882ee`, client `2eab6b3b`, docs `01c11636`.
- F4e plan E1–E9 sent to slur-supervisor (2026-10-17). It is in the supervisor's inbox and in this session's
  transcript. If the approval comes back as an issue comment on #405, build from that comment.

## State (measured)

- Shield names 39 files (git grep -il): shared 21, client 15, server 3.
- Sim: `combat/shield.ts` (raise/drop/step/absorb). `run/combat.ts` fires it (`firePower`), steps it at the TOP
  of `stepCombat` (dead → drop, else step) before `phases.strike`, and owns `shieldAbsorbs` + SHIELD_POP
  broadcast. `run-sim.ts` gives `ctx.shieldAbsorbs` (used by bolt-run, seeker-run, mine-run, tug-run), spends
  `nextProjectileId++` for every non-feature power (line ~293), and `clearCombat` calls `dropShield` per
  player. `run.reset` hooks get no ctx/state.
- Fields: `shielded` (FALSE, synced) and `shieldTimer` (LOCAL_FLOAT) are core in `player-fields.ts`, after
  `slots`.
- Bag: `power-bag.ts` core list `[HeldPower.shield, cfg.shieldRatio]` + cache key.
- Client: `ShieldDome` is per ship inside `ship-view.tsx` (`windowS = DEFAULT_SIM_CONFIG.shieldS`). `Shield`
  trait in `game/ecs/traits.ts`. `attach-room-to-world.ts` spawns with Shield, listens `'shielded'`
  (`mirrorShield`) and SHIELD_POP (`popShield` by victimId → needs entity lookup; NetContext has only
  sessionId). Audio + sfx-map + test-level grant name shield.

## Uncommitted

- none.

## Held files

- none until the plan is approved (claims listed in the plan message).

## Next

1. Wait for approval of E2, E3, E6 and E8 (the four with choices).
2. Build the sim half (E1–E7), A/B against HEAD dist with a negative control (shield step at run.strike),
   800 bags, decode test if E2=A. Commit + push.
3. Client half (E8), draws idle + with a staged shield (slot 5 + KeyE). Scripts `draws.mjs` and
   `boost-draws.mjs` are in
   `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/4dda2a95-6658-44c2-b44c-88d1d58f0371/scratchpad/`
   (set the slot to 5 for shield). F4d A/B script `f4d-ab.mjs` is in the `cc75d6b3-…` scratchpad.
4. Docs (RFC §3.8/§7, conventions/features.md), close #405 with SHAs.

## Open questions

- E2, E3, E6, E8 (see the plan message).

## Lessons → memory

- none new.
