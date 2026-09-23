# Handover — bolt ingredient art (#218)

**Landed:** `38b4fb8` on `dev` (not pushed). Client-only.

## What exists

- `scene/bolt-pickups.tsx` — the pickup: coated shell, marigold glyph from `accent()`, a hot core and a deck glow pool. One component, used by both `pickup-field.tsx` (hosted room) and `routes/test-level/local-pickup-field.tsx`.
- `scene/pickup-pose.ts` (+ test) — the collect animation (0.32s: swell, lift, spin, shrink) and the respawn grow-in (0.5s, with an overshoot).
- `scene/bolt-streaks.tsx`, `bolt-streak-material.ts`, `bolt-embers.ts` — an additive streak (core + sheath) and shed embers. Used by `projectile-field.tsx` and `local-bolt-field.tsx`.
- `scene/combat-look.ts` — the shape and intensity constants. The cyan constant is gone.

## Status: ON HOLD

The supervisor paused this lane. The owner reported a drop below 15 fps, and workerone is measuring. The bolt art is a suspect.

**Prime suspect (inferred, not measured):** `BoltPickups` rewrites every pickup instance every frame: 4 instanced meshes, each with a full buffer upload. `pickupsOf()` returns one pickup per non-hole segment (`packages/shared/src/sim/track.ts:159`), so a long track means hundreds to thousands of instances. The old field only wrote when a pickup was taken.

**Likely fix:** animate only the pickups inside a z-window around the camera. Set `mesh.count`, or write only the dirty range. Also skip the ember buffer uploads when no ember is live.

## Open

- The pickup cooldown works (`PICKUP_RESPAWN_S = 3`), but the respawn happens about 300u behind the player, so nobody sees it. Balance call for the owner; the supervisor took it.
- `/test-level` does not mount `<HitSpark/>`, so a bolt impact shows no burst there. The supervisor took it.
- The bolt look has only been judged in frozen frames, never at full speed.

## How to look

Drive a headless Chrome over CDP, fire when the HUD reads "E · Fire", then press KeyP to freeze. Take the screenshot through CDP `Page.captureScreenshot`, not the frame tap. The driver script was in the session scratchpad and is not kept.
