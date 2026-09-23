# Handover — bolt ingredient art (#218)

**Landed:** `38b4fb8` on `dev` (not pushed). Client-only.

## What exists

- `scene/bolt-pickups.tsx` — the pickup: coated shell, marigold glyph from `accent()`, a hot core and a deck glow pool. One component, used by both `pickup-field.tsx` (hosted room) and `routes/test-level/local-pickup-field.tsx`.
- `scene/pickup-pose.ts` (+ test) — the collect animation (0.32s: swell, lift, spin, shrink) and the respawn grow-in (0.5s, with an overshoot).
- `scene/bolt-streaks.tsx`, `bolt-streak-material.ts`, `bolt-embers.ts` — an additive streak (core + sheath) and shed embers. Used by `projectile-field.tsx` and `local-bolt-field.tsx`.
- `scene/combat-look.ts` — the shape and intensity constants. The cyan constant is gone.

## Status: idle, awaiting owner assignment

The fps scare is cleared. workerone measured it: no commit regressed the frame. The track has about 130 pickups, so the per-frame `BoltPickups` rewrite is cheap. The drop came from agents' headless Chrome tabs contending for the GPU at DPR 2. Rule: [[headless-game-tabs-starve-the-gpu]].

The collect animation was cut from 0.32s to 0.13s in `9017e0f` (owner request), so it plays in front of the chase camera. The respawn grow-in is still 0.5s.

## Open

- The pickup cooldown works (`PICKUP_RESPAWN_S = 3`), but the respawn happens about 300u behind the player, so nobody sees it. Balance call for the owner; the supervisor took it.
- `/test-level` does not mount `<HitSpark/>`, so a bolt impact shows no burst there. The supervisor took it.
- The bolt look has only been judged in frozen frames, never at full speed.

## How to look

Drive a headless Chrome over CDP, fire when the HUD reads "E · Fire", then press KeyP to freeze. Take the screenshot through CDP `Page.captureScreenshot`, not the frame tap. The driver script was in the session scratchpad and is not kept.
