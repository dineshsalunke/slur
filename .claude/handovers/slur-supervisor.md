Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-25, ~15:45 IST

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. Clear and resume steps: memory `supervisor-clears-workers-via-herdr.md`.
Standing approval to clear workers at a seam. Grep the status line with `│ [█░]* [0-9]*%`; the first read
after /clear often shows the old percent, so read again. Clear a worker before assigning if it is past 10%.

## Standing owner decisions

- Hosted rooms default to GROOVE (option a) → workerfour. Graphite colour = #4a4d52 → workerone.
- OWNER RULE: dev only, ONE stack (:5173/:2567). The owner waived it ONCE today for a song-lab worktree
  on :5174/:2568. That worktree is torn down and removed; the rule stands again.
- WIDTH: 24 LANES = 96u (HALF_WIDTH 48). Landed (workertwo 07b4d2d, fe40718).
- MATERIAL (owner, verbatim): "dark graphite pitted metal as base which will be used for everything in the scene, deck, monolith, blocks, ships, pickups etc. deck is going to be a bit special case where it will be a mix of the dark graphite pitted metal + 4x4u plate grid like what is it now."
- #258 split (owner option c): push the arch leg fix + groove bevel sign + #4a4d52 + lint NOW; pits + grain later.
- #259 meteor ember: owner said 2.5 s is too slow → EMBER_END 1.0 s. Landed cf09c55.
- Meteors one every 9–18 s (Meteor.chance 0.15). Engine light accepted. Strafe tap kick option 2 is pushed (0c904de, e82cadf).
- Workers commit to LOCAL dev by explicit pathspec without asking, and push dev to origin.
- The song work is a lens, not a rhythm game. Freighter-only while experimenting.

## Workers

| Worker | Pane | Lane | State | Held files |
|---|---|---|---|---|
| workerone | w2P:pD | #258: pushing arch/groove/colour split; pits + grain stay uncommitted | resumed after clear; told to back up the full patch, split, gate, push, restore | track-texture.ts, pit-field(.test).ts, monolith-geometry(.test).ts, monolith-group.tsx, track-rail.tsx, world-scene.tsx, metal.ts, dev/tuning-schema.ts, docs/ART_MATERIALS.md |
| workertwo | w2P:pF | #259 meteor glow | DONE cf09c55 (handover 3748452); idle | none |
| workerthree | w2P:pG | cartoon-ish audio/SFX: research + proposal only | cleared, assigned ~15:40 | none (no repo writes until approved) |
| workerfour | w2P:pH | groove hosted default (run-room.ts:80) | UNCOMMITTED, HOLDING for the owner | apps/server/src/rooms/run-room.ts, run-room.test.ts |

## Next

1. workerone reports the #258 split SHA → relay. Then the pit tune round: fewer and smaller pits (Pit.density, PIT_SIZE, PIT_CELLS_U), then a re-shoot of deck/ship/block before any push.
2. workerthree's audio proposal → relay. The owner's cartoon direction departs from AUDIO.md §1 (synthwave + TRON UI) and needs an ADR.
3. The owner flies #259 on :5173.

## Open owner questions

- GROOVE DEFAULT BLOCKER: groove emits NO fractured blocks (groove-track.ts:86), so hosted bolt-smash disappears; groove pickup ids = segment index (groove-track.ts:115). Options (a) push as is, (b) push + follow-up (recommended), (c) hold.
- Weave a/b/c. Width feel at 96.
- #254 class roles (later). #244 FRACTURE_RATE raise? #251 device check. Score rooms have no pickups.
- Older: `git rm apps/client/app/game/net-debug-hud.tsx` + drop `--color-debug`; review #236.

## Owner's dev stack

Server :2567 (PID 17267), client :5173 (PID 85264).

## Uncommitted

none of mine. docs/art-direction/* changes are ChatGPT's; never touch them.

## Lessons → memory

none this seam.
