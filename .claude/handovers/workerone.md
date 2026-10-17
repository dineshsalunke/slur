Agent: workerone · Lane: RFC-349 F4e shield (#405) — sim half landed, client half next · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Build the approved F4e plan (latest comment on #405: E2=A, E3=A, E6=A, E8=A). Then F4f portal (#406), plan first.

## Done

- F4d boost closed: sim `843882ee`, client `2eab6b3b`, docs `01c11636`.
- F4e part 1, sim half: `24e4df3e` (pushed). E1–E7 built as planned.
  - `features/shield/`: shield-constants, shield-status (was combat/shield.ts), shield-run (fireShield,
    wardShields, resetShields, shieldAbsorbs), shield.feature.ts, shield.test.ts.
  - New `run.ward` hook (define-sim-feature, run-features, `CombatPhases.ward`, run-sim phases).
  - `run.reset( ctx, run )`; only tug had a reset before (the plan's "2 features" = tug + shield).
  - tug-run.test now imports shield names from `../shield/shield.feature.js` (one extra file, not on the
    claim list; test-only import fix).

## State (measured)

- A/B vs HEAD dist (`f4e-ab.mjs`, 6 seeds x 3600 ticks, short random shields + mid-race clearCombat,
  800 bags): bit-equal, 108 pops. Negative control (ward→strike) diverges on seeds 2, 3, 8, 13.
- shared 585/585, server 101/101 (+1 two-client decode test in room-shield.test.ts), typecheck clean,
  lint 0 errors (7 old file-length warnings).
- Scripts + dists: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/19140d86-0399-4b8c-944a-b7d73dfd9aa7/scratchpad/`
  (`f4e-ab.mjs`, `cmp.mjs`, head/new/neg-dist).
- Client compiles unchanged: shared still exports SHIELD_POP_MESSAGE etc. through the feature.

## Uncommitted

- none.

## Held files

- Client half (E8) claims stand: client-features, define-client-feature, active-features.test,
  feature-views, ship-view, pickup-field, pickup-layout/*, pickup-instances test, glyph-atlas, ecs/traits,
  attach-room-to-world, new `apps/client/app/features/shield/**`. Docs: RFC §3.8/§7, conventions/features.md.

## Next

1. E8 client half: add `views.ship = ComponentType<{ entity, shipId }>` in define-client-feature, render it
   from ship-view through FeatureViews; add `entityOf(sessionId)` to NetContext; move the SHIELD_POP listener
   into shield's net slot; move shield-look, shield-dome, shield-pickups (own anchors filter), glyph and the
   Shield trait (shield.traits.ts) into `features/shield/`. splitPickupLayout keeps only portals. Bridge keeps
   the `shielded` listen + spawn, imports Shield from the feature. Audio, sfx-map, test-level grant stay.
   Follow the boost client commit `2eab6b3b` as the template.
2. Draws on /test-level idle and with a staged shield (slot 5 + KeyE); scripts `draws.mjs` /
   `boost-draws.mjs` in the `4dda2a95-…` scratchpad.
3. Docs (RFC §3.8/§7 incl. `run.ward` + reset ctx, conventions/features.md). Close #405 with SHAs.

## Open questions

- none.

## Lessons → memory

- Updated `.claude/memory/ab-bench-needs-a-negative-control.md` (densify the boundary event when the control
  passes).
