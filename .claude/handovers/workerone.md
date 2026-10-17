Agent: workerone · Lane: RFC-349 F4f portal (#406) — plan sent, waiting for approval · Updated: 2026-10-17

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Move portal into two feature folders (#406). Build nothing until the owner approves the plan through the
supervisor.

## Done

- F4e shield closed: sim `24e4df3e`, client `adab9982`, docs `88fb4f95`.
- F4f plan written and sent to slur-supervisor (full text below). Not yet posted on #406.

## State (measured)

- No code changed this seam.
- Portal today: 34 non-test files name it (shared 12, client 22, server 0); 48 with tests.
- `<FeatureViews slot="scene" />` mounts only in `net-canvas.tsx`.
- Only mine uses `run.settle`; `bagCounts` sorts weights by kind, so moving portal into the bag keeps order.

## Uncommitted

- none.

## Held files

- none. Claims go to the supervisor after approval (list in the plan).

## Next

1. Wait for the owner's choices (P2, P3, P4, P5, P6, P8, P11 glyphs).
2. Post the approved plan on #406, send claims, then build the sim half first.
3. Run client tests before pushing the sim-half commit (memory `sim-half-commit-runs-client-tests.md`).

## Open questions

- The seven owner choices in the plan.

## Lessons → memory

- none.

## Plan as sent

**F4f portal plan (workerone, 2026-10-17). Owner options marked "owner".**

Today: 34 non-test files name portal (shared 12, client 22, server 0); 48 with tests. Portal is the largest feature: it touches the ship step (hop), the fire path (two power kinds, double-tap far throw), the hop event (seekers lose their lock) and the shock queue.

**P1. Sim folder** `packages/shared/src/features/portal/`: portal-constants (PORTAL_RATIO, the two messages and their types, PortalConfig + DEFAULT_PORTAL_CONFIG; sim-config imports them, D2), portal-place (placement and clear-spot math from combat/portal.ts), portal-hop (hopThroughPortal), portal-schema (`Portal` class; `RunState.portals` stays, S3/mine precedent), portal-run (run/portal-run.ts), portal.feature.ts with `messages: [ PORTAL_HOP_MESSAGE, PORTAL_FIZZLE_MESSAGE ]`. Tests move in: combat/portal.test.ts, run/portal-run.test.ts, sim/portal-hop.test.ts. HeldPower.portal/portalB stay (D3).

**P2. `portalHops` stays core (owner).** A: keep it in CORE_PLAYER_FIELDS, no wire change. Core reads it: run-sim hop detection, the bridge's reconcile and `pushRemote` (Interp `hops`), the local step in net-systems, and the Interp snap that stops a remote ship lerping across a teleport (the `glideTimer` precedent in F4d: core code reads it, so it stays core). B: move it into portal `fields.player`, as E2/B2; index shifts, golden test + two-client decode test. Recommend A.

**P3. Hop in `step()` stays a direct call (owner).** A: step.ts keeps its one line and imports hopThroughPortal from the leaf `features/portal/portal-hop.ts` (not the contract, to keep the registry free of an import cycle); `SimWorld.portals` stays core (client `blockWorld` mirrors it). B: new ship hook `ship.pass( s, prevZ, t, world, cfg )` after collisions. One user only, and the world type stays portal-shaped either way. Recommend A.

**P4. Fire through `run.use`, two kinds.** `PowerSpec` gets optional `uses: [ HeldPower.portalB ]`; openRunFeatures registers the use for `kind` and each extra kind (taken-kind check covers both). Portal's use calls `ctx.nextId()` first and discards it (today `nextProjectileId++` runs before firePower), places the end, records the tap `{ slot, dir, seq, end }`, and returns false. `use` has no `seq` today; owner picks: **A** `run.tap` (P5) gets the whole intent and parks its `seq` in portal's run state for the `use` call that follows on the same intent, no signature change; **B** `use` gains the intent (signature change in the 6 existing use hooks, like E6). Recommend A. Portal returns false because it owns its slot (fizzle keeps it, end A swaps to portalB, end B spends). After this every HeldPower except none has a use, so `firePower` and the fallback in `RunSim.fire` go; a registry test asserts every kind has a use.

**P5. New fixed hook `run.tap( ctx, run, p, ownerId, intent: FireIntent ) => boolean` (owner).** Runs on every fire intent before `canFire`, in id order; true consumes the intent. Portal keeps its tap map as run state `S`: tap reads and deletes the entry, checks isDoubleTap, throws far. Same order as today (entry deleted on every intent, even when the slot check fails). Alternative B: leave the double-tap in run-sim and import the portal contract. Recommend A.

**P6. `RunSim.leave` drops the tap delete (owner).** A: no new hook. A left player's tap stays until the next reset; session ids are not reused, so it never fires. B: new `run.leave( ctx, run, sessionId )` hook. Recommend A.

**P7. Expiry at `run.settle`.** stepPortals runs after every settle and before pickups today; mine is the only other settle user and mine < portal in id order, so the order is the same. Expiry clears portalB slots before stepPickups refills them, so pickups must stay after it (they do).

**P8. New fixed hook `run.hop` (owner).** run-sim keeps the hop detection and calls `features.hop( ctx, victimId, from, p )` in id order. Portal broadcasts PORTAL_HOP; seeker drops seekers locked on the victim and broadcasts SEEKER_MISS. portal < seeker keeps today's broadcast order, and S5's portal→seeker import goes away. Alternative B: portal's hop function imports seeker.feature as today (S5).

**P9. Reset.** Portal's `run.reset` clears `state.portals` and its tap map; clearCombat loses both lines.

**P10. Bag.** `bagWeight = cfg.portalRatio`. Remove the hard-coded entry and `portalRatio` from the cache key. Weights already sort by kind, so bags stay bit-equal (E7).

**P11. Client half** `apps/client/app/features/portal/`: portal.client.ts; `views.scene` = PortalField (leaves net-canvas); `views.pickups` = PortalPickups with its own anchor filter (shield precedent), so `splitPickupLayout` + its test and pickup-field's last portal lines go; portal-ring and its test move in; `net` slot takes PORTAL_HOP (skip own victim via `net.sessionId`) and PORTAL_FIZZLE. Glyphs (owner): A: `hud.glyphs` map for the extra kinds in `power.uses`, atlas checks each kind belongs to the feature; B: portalB glyph stays in CORE_GLYPHS. Recommend A. Stays central (D7: look, audio and listeners outside the slots stay central): the shock queue with burstPortalHop/nearestPortalEnd and the portalIn/portalOut shock kinds, local-hop (core reads portalHops), the bridge's portals onAdd/onRemove mirror into blockWorld, block-state, audio, sfx-map, the Portal.* tuning dials, the test-level grant.

**P12. Gates.** A/B against HEAD dist: 6 seeds × 3600 ticks, every player field by name, portals map, seekers, ids and broadcast log, portal-heavy mix with double taps, fizzles, expiry with an unused portalB, hops with seekers locked, mid-race clearCombat. Negative control: drop the `ctx.nextId()` discard in portal's use, must diverge (the boost control). Expiry at `run.strike` runs too, as information only: nothing between strike and settle reads portals, so it may not diverge. 800 bags. Shared/server/client tests; every shared dist module imports alone (TDZ). Draws on /test-level idle and with a staged portal pair (the scene slot mounts only in NetCanvas, so /beat-deck does not change). If P2 = B, two-client decode test. Close #406 with SHAs.

**Claims.** New `features/portal/**` on both ends. Shared: registry(.test), define-sim-feature, run-features, sim-hooks, combat/{portal(.test), constants, power-bag(.test)}, run/{combat, run-sim, portal-run(.test)}, sim/{step, portal-hop.test, types}, schema, sim-config, index, features/seeker (P8), player-fields(.test) only if P2 = B. Client: client-features, define-client-feature, net-canvas, pickup-field, pickup-layout/*, pickup-instances test, glyph-atlas, scene/portal-field/*, portal-pickups/*, portal-ring(.test), attach-room-to-world, tests that import moved files. Docs: RFC §3.8/§7, conventions/features.md.
