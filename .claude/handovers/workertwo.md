Agent: workertwo · Lane: #290 tug line · Updated: 2026-09-26

Older versions hold #283 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #290 tug line. The line latches onto a rival, or onto the nearest block ahead (the grapple is folded
  in). Forward on a rival: catapult the firer and slow the target. Back on a rival: tow the chaser
  forward and degrade its strafe and jump. It replaces the GDD §5.7 Tractor beam.

## Done

- S1 sim core `403f8de`.
- S2 bag + fire path `72eafc0`.
- S3 client `86060aa` (pushed): tug-events queue + TugLine beam (game/scene/tug-line/), tug pickup
  bucket + placeholder hook body (tug-pickups/), HUD 'Tug' label + hook gem (glyphs moved into
  hud/power-gem/gem-glyph.tsx, a switch, for the complexity cap), audio playTugEvent (seekerFire
  rate 0.7 / stun on victim), TUG_RATIO 0.1, MINE_RATIO 0.15.

## State

- Owner-final bag: bolt 4 · seeker 3 · mine 3 · boost 3 · shield 3 · portal 2 · tug 2 [measured, test].
- After 86060aa: typecheck 0, lint 0, shared 479/479, server 40/40, client 441/441 [measured].
- /test-level headless check [measured]: forward rival latch → firer vz 27, rival slowTimer 0.6; back
  latch → chaser vz +40, towTimer 0.48; no rival → block anchor z 404. Beam visible in all three.
- No `slowed` interp flag was added (would need ecs/traits + net-systems). Not required for S3.

## Uncommitted

None.

## Held files

None. S3 files released to workerfour (portal S4).

## Next

1. Wait for the supervisor to clear docs/GDD.md.
2. S4: GDD §5.3 / §5.7 (Tractor and Grapple → tug line).
3. `gh issue close 290 -c "<what shipped + SHAs>"`.

## Open questions

- None.

## Lessons → memory

- none
