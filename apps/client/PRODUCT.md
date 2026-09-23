# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two audiences, served equally (owner, 2026-09-24):

- **Invited friends and coworkers.** They got a room link or were told "jump in". Their job: enter a call
  sign, pick a ship, host or join a run, and reach GO in seconds.
- **Cold visitors** to the hosted web build. They arrive with no context. Their job: understand what SLUR
  is within one screen, then take the same path as an invited friend.

## Product Purpose

SLUR is a casual multiplayer ship-racer for office LAN or the web. It is a party game about messing with
your friends. Players fly down a finite track to a finish line. SkyRoads speed and jumps, Blur pickup
combat, cuberun neon. Success is a room of friends who race, wreck each other, and start the next round.

## Positioning

Round-based party racing in the browser with no install. The host launches a run and the room races
together. Anyone can join at any time. The field locks at GO, and late joiners spectate.

## Operating Context

- Played on desktop keyboards, in an office or at home, often with everyone in the same room.
- Controls: W/S throttle and brake, A/D strafe, Space jump (tap, hold, double), E use power-up, M mute.
- Ship roster (`packages/shared/src/ship-classes.ts`): Executioner, Challenger, Bob, Dispatcher,
  Split Crown. Ship stats are server-authoritative data.
- A player's ship can be set while the room is in its lobby phase.

## Capabilities and Constraints

- The main menu joins the Colyseus lobby and lists live rooms. From it a player hosts a new run or joins a
  listed one.
- Ship choice and a controls hint belong on the main menu (owner, 2026-09-24).
- Menu copy can be rewritten, with the owner's approval. Functions stay.
- The menu shares the machine and GPU with the game. It must stay cheap to render.

## Brand Commitments

- Name: **SLUR**.
- Pillar: "Cold Space. Warm Energy." Visual authority lives in `docs/ADD.md` and the approved images in
  `docs/art-direction/` (read-only).
- Current tagline: "Race your friends. Wreck their run." It may be rewritten with approval.

## Evidence on Hand

- Approved art: `docs/art-direction/golden-reference/` (cruise and action lighting) and
  `docs/art-direction/background/approved-direction.png`.
- Ship models are GLB files served by the client (`game/scene/ship-visuals.ts`).
- No player counts, reviews, press or testimonials exist. Do not invent them.

## Product Principles

1. Get to GO fast. Every screen between the link and the race costs players.
2. The race is the product. The menu shows the real game world, not a stand-in.
3. Fun at a friend's expense, never mean-spirited.
4. Cheap to run. The menu never costs the game frames.

## Accessibility & Inclusion

- Keyboard-only flow: call sign, ship, host and join all work with Tab and Enter, with visible focus.
- Honour `prefers-reduced-motion` for every motion, including the backdrop drift.
- Text meets WCAG AA contrast over the 3D backdrop.
