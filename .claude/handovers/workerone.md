Agent: workerone · Lane: #331 pickups ~5u (plan only, not started) · Updated: 2026-09-27 23:10

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#331: scale every pickup (bolt, seeker, mine, boost, shield, portal, tug) so that its overall bounding box is about 5u. PLAN FIRST, no edits. Send the plan to slur-supervisor, who relays it to the owner.

## Done

- #329: `350febc` (pushed, closed). Owner values portalR 5 / portalY 3 (the owner's own edit, kept). portalClearHalfL 11.5, portalClearW 12. Ring band = R×1.3, depth = R×0.4. Feet removed. ADR-022 #329 amendment.
- #333: `69edb82` + dials `41bde5a` (pushed, closed). Marigold additive membrane, clipped at the deck (`portal-field/membrane-material.ts`). Leva Portal.membraneOpacity 0.22 / Glow 1.2 / Flow 0.6.

## State

- #329 placement-null rate, 30 phrase seeds: 0.69% / 0.76% → 1.64% / 1.52% (Comet / Freighter). Driver: this session's scratch `portal-null.mjs`.
- #329 catch at R5 Y3: deck chord 8.98u, top ship y 7.2. A Comet double jump always catches (6.69). Other doubles catch only when crossing below 7.2.
- #333: draws 131 → 133 with a pair (+1 per view: main + mirror). No blown pixels. The A/B diff is inside the scene noise (7–10%).
- #333 pass ripple from the hit point: NOT built (it needs a per-end hop time). Follow-up only if the owner asks.
- Tests at `69edb82`: shared 546/546, client 497/497, typecheck 0, lint 0 errors (9 warnings, not mine).
- Owner has not viewed #329/#333 on /test-level yet [unmeasured].

## Uncommitted

None of mine. `tracks/` is owner data.

## Held files

None. (portal-field/*, tuning-schema.ts, tuning-panel.tsx all released.)

## Next

1. #331 plan, no edits. `gh issue view 331`. The plan needs:
   - Today's bounding box per pickup, measured from the built geometry. Builders are `build*Pickup()`/`build*Body()` in `apps/client/app/game/scene/<kind>-pickups/<kind>-pickups.utils.ts`. The portal uses `PICKUP_RING` in `portal-pickups.constants.ts`. Shared body: `pickup-body.ts`. Measure via `npx tsx` (extensionless imports) from apps/client, or a vitest run: build parts, merge the bbox, and print the size.
   - The scale factor for each pickup.
   - The float height after scaling. Hover and bob are `PICKUP_HOVER`/`PICKUP_BOB` in `combat-look.ts`; the pose is in `pickup-instances.utils.ts` `writeInstance`. The pickup must clear the deck and stay in view of the chase camera. The pool disc `PICKUP_POOL_RADIUS` may need to scale too.
   - Whether `Pickup.grabR` (sim, shared) stays or scales. Do not touch shared sim without a claim: workertwo is in step.ts for #334.
2. Send the plan to slur-supervisor. Build only after the owner approves. Then check it on /test-level and close with the SHA.

## Open questions

- #333 pass ripple: wanted?
- Seed 4 Freighter twist-motif bump (from #327, avoid pilot): worth an issue?
- #325: is the marigold sleeve too loud at distance?

## Lessons → memory

none
