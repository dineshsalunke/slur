Agent: workerone · Lane: RFC-349 F4f portal (#406) — sim half shipped, client half next · Updated: 2026-10-17

Older versions (incl. the full approved plan P1–P12): `git log -p -- .claude/handovers/workerone.md`. The plan
is also the latest comment on #406.

## Goal

Move portal into two feature folders (#406), owner-approved plan (P2=A, P3=A, P4=A, P5=A, P6=A, P8=A, P11=A).

## Done

- Sim half (P1–P10) `1408cce9`, pushed. `packages/shared/src/features/portal/` = portal-constants,
  portal-hop (PortalState, PortalSpot, PortalRider, hopThroughPortal), portal-place, portal-schema, portal-run
  (tap/use/hop/settle/reset; run state `{ taps, seq }`), portal.feature.ts. New hooks in
  define-sim-feature: `run.tap`, `run.hop`, `HopOrigin`, `PowerSpec.uses`. Seeker has `hop: loseHopLocks`.
  firePower + RunSim fallback + `portalTaps` gone; bag reads portal's bagWeight.
- Portal's `use` sets the slot itself and returns false (it cannot import combat-step: TDZ cycle via
  pickups → power-bag → sim-hooks → registry).
- Stop-gap in client `pickup-layout.utils.test.ts`: featureKinds excludes portal. P11 deletes that test.

## State (measured)

- A/B vs HEAD dist (bench `scratchpad/f4f-ab.mjs`, session fda47919): 6 seeds × 3600 ticks bit-equal, every
  PLAYER_FIELDS key by name, portals incl. armTimer/ttl, 505 hops, 44 fizzles, 1921 double taps, 20
  unused-portalB expiries, 800 bags equal. Negative control (drop `ctx.nextId()`) diverges on 6/6 seeds.
- Every shared dist module imports alone (TDZ check): 0 fails.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` (shared, server, client 730/730) all pass at `1408cce9`.

## Uncommitted

- none.

## Held files

- Every file in the plan's Claims list (cleared by the supervisor). Client half untouched.

## Next

1. Load `conventions` (`conv cards` on the client paths).
2. Client half (P11) in `apps/client/app/features/portal/`: portal.client.ts; `views.scene` = PortalField
   (out of net-canvas); `views.pickups` = PortalPickups with its own anchor filter (shield precedent), delete
   `splitPickupLayout` + its test + pickup-field's portal lines; move portal-ring (+test); `net` slot takes
   PORTAL_HOP (skip own victim via `net.sessionId`) and PORTAL_FIZZLE; `hud.glyphs` map for `power.uses`
   kinds (atlas checks each kind belongs to the feature). Keep central: shock queue, local-hop, bridge
   portals mirror, block-state, audio, sfx-map, Portal.* dials, test-level grant.
3. Gates: all tests; draws on /test-level idle + staged portal pair (owner's stack :5173, headless Chrome DPR 1,
   muted, kill after).
4. Docs: RFC §3.8/§7, conventions/features.md (new hooks tap/hop/uses). Close #406 with SHAs.

## Open questions

- none.

## Lessons → memory

- none new (the TDZ rule is already in `feature-registry-import-cycle.md`).
