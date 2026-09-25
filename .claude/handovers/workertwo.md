Agent: workertwo · Lane: meteor glow lingers after the hit (#259) · Updated: 2026-09-25

Older versions hold the #257 width lane (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

Owner report: "reflections of the meteor fade slowly and stay even after the hit." Find the cause and fix it.

## Done

- Issue #259 filed.
- Cause measured and plan sent to slur-supervisor. Claims cleared. No code written.

## State

- Harness: headless Chrome :9471 (killed), /test-level on :5173. `Meteor.chance` 1 in the headless localStorage only. Ship pinned 30u or 90u behind strike slot 2 (z 503.8, size 4.56). Clock stepped with `advance`. Each sample rendered 4 ways (all / no light / no ember / neither). Threshold: RGB-sum diff > 9 at 960x540.
- Ship 30u from the hit: the pointLight shows 32,827 px at +0.1 s and 0 px from +2.0 s. The ember shows ~380 px at the hit, 208 px at +3.8 s, and 0 px only at ~+11.9 s.
- Ship 90u from the hit: the ember shows ~35 px and is visible for ~4 s. The light's timing is the same as at 30u.
- Cause: `emberColor` in meteor-scorch.tsx keeps 30% (1 − FLASH_SHARE) of the glow on `exp(-age / Meteor.cool)`, where cool is 3.5 s. No age cut-off; a mark is retired only when it falls behind the camera.
- Scripts: this session's scratchpad `m/run2.mjs` and `m/cdp.mjs`. Frames are `m/b30-*.png` and `m/b90-*.png`.

## Uncommitted

None.

## Held files

apps/client/app/game/scene/meteor-scorch.tsx, apps/client/app/game/scene/meteor-scorch.test.ts (new), apps/client/app/game/scene/meteor-strikes.tsx. Claims cleared by the supervisor.

## Next

1. WAIT for the owner's ember choice, which the supervisor is relaying.
2. Build: a hard end for the ember, fading to exactly 0 at EMBER_END ≈ 2.5 s, then `live = false`; or remove the ember if the owner picks that. Set the light intensity to 0 after ~1.8 s. Add a test that `emberColor` is 0 at and after the end.
3. Re-measure with `run2.mjs 30`. The ember should read 0 px by +2.5 s.
4. Run the gates, commit by pathspec, report to the supervisor.

## Open questions

- Owner: should the ember end at ~2.5 s, or be removed so only the soot mark is left?

## Lessons → memory

none
