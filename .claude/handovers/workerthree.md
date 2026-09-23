Agent: workerthree · Lane: seekers fire back to back (#226), after three power slots (#223) · Updated: 2026-09-23 ~23:25

## Goal

#226: remove the one-seeker-in-flight cap so a racer can fire seekers back to back. Owner: *"i would
like to fire seeker's back to back if required."* Add no new gate.

## Done

- `eae791d` shared + server + client + DECISIONS: `seekerReady()` deleted, gate removed in server
  `room-combat.ts` `firePower` (now `void`) and `/test-level` `local-combat.ts`. `MAX_SEEKERS` 16 → 48
  (render bound only, supervisor's call). Three refusal tests became back-to-back tests. ADR-017
  amendment quotes and replaces the #223 fire-time cap bullet.
- Earlier lane #223: `eb4c381`, `c362fab`, `555862d`, `1081809`, `9928cc1`, `738ebd3`, `454f544`,
  `78ff858`, `3bc2605` (seeker pickup bar).

## State

- Tests: shared 201/201, server 14/14, client 241/241. `pnpm typecheck` clean. `pnpm lint`: 8 warnings,
  all older. The one warning in a file I touched is run-room.test.ts over 300 lines. It is older, and
  this change made the file shorter.
- Render buffers at 48: trail 768 segments × 76 B = 58,368 B; bodies 3 parts × 48 × 64 B = 9,216 B;
  about 66 KB (was about 22 KB). Seekers past 48 fly and hit but are not drawn.
- Live /test-level (private :5186, headless DPR 1, muted, all killed after): rack [2,2,2], E ×3 at
  120 ms → rack 022 → 002 → 000, seekers 1 → 2 → 3. Still: scratchpad
  `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/f9f2fb5c-0c78-4488-a314-a3dd3c3132bd/scratchpad/seekers-b2b.png`
  (three seekers in a line, each with its own trail).
- Overlap: E on consecutive frames (the client fires at most one per tick) → spawn z 3.67/3.33/3.11,
  about 2u apart after 250 ms. The body is 8.8u long, so they draw as one stacked shape. They do not
  collide: the seeker step tests blocks and ships only.
- Server `onMessage` fires right away, not once per tick. Two USE_POWERUP messages in one tick spawn at
  the same point [inferred from code, not measured]. Harmless: hit stun is SET
  (`v.stunTimer = stunDurationForShip(...)`), so two hits at once give one stun. A later hit restarts it.
- Nothing is keyed per owner: seeker ids come from `nextProjectileId++`. Audio `bind-room-audio.ts` and
  `threat-hud.tsx` read `projectiles` only. The seekers have no per-owner sound.
- NOT done: the hosted-room live check. A real room needs seeker pickups through a bot. The run-room
  test drives the real room through a real Colyseus client (3 seekers → `seekers.size` 3).

## Uncommitted

none

## Held files

- #226: none held beyond the #223 set below (all committed).
- #223 client: game/input/power-select(.test).ts, game/hud/power-{rack,cell}.tsx, game/net-power-rack.tsx,
  game/net-canvas.tsx, net/attach-room-to-world.ts, ecs/traits.ts, audio/bind-room-audio.ts,
  routes/test-level/{local-combat(.test).ts, local-ship.tsx, test-level-hud.tsx}, game/net-debug-hud.tsx,
  game/overlays/{overlays.tsx, overlays.test.tsx}, docs/GDD.md.
- Shared combat/*, schema, sim-config; server run-room(+test), room-combat.

## Next

1. Supervisor decides whether the hosted-room check for #226 is worth a bot run.
2. Close #226 once accepted.
3. Apply the owner's answer on the class keys (/test-level and the `net-canvas.tsx` dev swap).
4. If wanted: a refused-fire cue. Only stun can refuse a fire now.
5. Seeker leftovers: audio + LOCKED HUD, target dummy, two-player room check.

## Open questions

- Owner: class keys, (a) Shift+1..5 (built on /test-level), (b) or (c). Should the hosted room's dev
  class swap move the same way?
- Owner, via the supervisor: the colyseus rule wording (draft in `36dd249`). DO NOT EDIT until approved.
- Owner: should seekers fired on consecutive frames be spaced apart? Now they draw as one stacked shape.
- Owner: the look review of the 8.8u seeker stills. Trail segment seams (dark chevrons) remain.

## Lessons → memory

none
