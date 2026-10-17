Agent: workerone · Lane: RFC-349 F4f portal (#406) — DONE, issue closed · Updated: 2026-10-17

Older versions (incl. the approved plan P1–P12): `git log -p -- .claude/handovers/workerone.md`.

## Goal

Move portal into two feature folders (#406), owner-approved plan. Finished.

## Done

- Sim half (P1–P10) `1408cce9`.
- Client half (P11) `18a5cff2`: `apps/client/app/features/portal/` = portal.client.ts, portal-glyph.ts,
  portal-ring(.test), portal-field/ (scene slot), portal-pickups/ (own `portalAnchors` filter + test). New
  `HudSlots.glyphs`; glyph-atlas registers `glyph` for `power.kind` and `glyphs` for kinds in `power.uses`
  (throws otherwise). `splitPickupLayout` + test deleted. Hop/fizzle listeners moved from
  attach-room-to-world into portal's `net` slot. active-features roster test includes portal.
- Docs `dcae4c24`: RFC §3.8 "F4f result" + §7 F4f row; conventions/features.md F4f slot rules + table rows.
- Pushed to origin/dev; #406 closed with SHAs.

## State (measured)

- /test-level draws (DPR 1, quality high, script `scratchpad/portal-draws.mjs`, session 64c74057): idle 76
  before and after; staged portal pair (2 ends read back) 80 before and after.
- lint, typecheck pass; shared 586/586, server 101/101, client 730/730 at `18a5cff2`.
- Central non-test files naming portal: 34 → 21 (shared 9, client 12).

## Uncommitted

- none.

## Held files

- none (release all #406 claims).

## Next

1. Supervisor: release the #406 claims and assign the next lane.

## Open questions

- none.

## Lessons → memory

- none new.
