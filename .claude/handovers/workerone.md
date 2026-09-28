Agent: workerone · Lane: #331 pickups 5u (shipped) · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#331: scale every pickup so its bounding box is about 5u. Done. Waiting for the owner's /test-level look.

## Done

- #329: `350febc` (pushed, closed).
- #333: `69edb82` + dials `41bde5a` (pushed, closed).
- #331: `fb878e1` (pushed, closed). `fitPickup(parts, PICKUP_SIZE)` in `pickup-instances.utils.ts` scales every distinct geometry once, so the union bbox's longest side = 5. Called from the `PickupInstances` body memo. `combat-look.ts`: PICKUP_SIZE 5, PICKUP_HOVER 2.4 → 3.2, PICKUP_POOL_RADIUS 3.2 → 4. grabR unchanged (3.2).

## State

- Pre-scale longest sides (measured): bolt 3.45 · seeker 4.22 · mine 1.96 · boost 2.46 · shield 2.70 · portal 2.72 · tug 2.75.
- Factors: ×1.45 · ×1.18 · ×2.55 · ×2.03 · ×1.85 · ×1.84 · ×1.82.
- Bottom clearance at the bob low point ≥ 0.25u for all 7 kinds (test). Largest half-height after the fit is 2.5 → clearance 3.2 − 2.5 − 0.22 = 0.48.
- Tests at `fb878e1`: client 580/580, typecheck 0. Shared 541/546 and one lint format error, all in workertwo's uncommitted #334 files (step.ts, bounce-contact*). Not this lane.
- Pickup in chase-camera frame: calculated, not captured [unmeasured].
- Collect swell reaches ~7.5u for 0.13 s [unmeasured visually].

## Uncommitted

None of mine.

## Held files

None. (combat-look.ts, pickup-instances/* released.)

## Next

1. Owner checks /test-level: pickup size and float, the collect swell, the portal pickup next to a real portal (R5), and the pool glow.
2. Retune PICKUP_HOVER / PICKUP_POOL_RADIUS / PICKUP_SIZE in `combat-look.ts` if the owner asks.

## Open questions

- #333 pass ripple: wanted?
- Seed 4 Freighter twist-motif bump (from #327, avoid pilot): worth an issue?
- #325: is the marigold sleeve too loud at distance?

## Lessons → memory

none
