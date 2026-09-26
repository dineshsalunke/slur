---
name: drive-a-hosted-room-over-cdp
description: "To live-check gameplay in a hosted room, host from a headless tab, read session.room over CDP and steer with a gap-and-block-aware bot; since #301 a finisher-less race never ends by itself"
metadata:
  node_type: memory
  type: reference
  originSessionId: 5c6d06d0-78ec-4c1c-83d8-901b72db2774
  modified: 2026-09-26T18:20:15.442Z
---

A hosted-room live check (#223, 2026-09-23) worked this way:

- Private stack: `PORT=2585 node --import tsx src/index.ts` in `apps/server`, and
  `CLIENT_PORT=5185 VITE_SERVER_PORT=2585 pnpm exec react-router dev` in `apps/client`. Do not start a
  second shared tsc watcher. Headless Chrome per [[headless-chrome-for-frame-taps]].
- Host: click the `Host a run ▸` button, then `GO ▶`. `(await import('/app/net/session.ts')).session.room`
  gives the live room. `room.state.players.get(room.sessionId)` is the authoritative ship.
- Keys: `dispatchEvent(new KeyboardEvent('keydown', { code }))` on window drives the keyboard input.
- The bot must avoid **gaps** as well as blocks. Floor spans come from `segmentAtZ(z).floors`, and some
  gap segments leave x = 0 without floor for 60u. A block-only bot dies there forever.
- Since #301 (f811400) there is no time cap. A race ends only when all racers finish, 45 s after the
  first finisher, or when no racers are left. A wedged bot keeps the room racing and the host cannot
  restart it: leave the room (close the tab) or seed a finish ([[seed-a-finished-room-with-a-scratch-server]]).
  After phase 3, use `Play Again ▶`, then `GO ▶`.
- A pickup respawns 3 s after it is taken. Reverse with S past it, wait, fly through again: that gives
  two of the same power without luck.
- A ship pressed against a block has `stunTimer > 0`, and `canFire` refuses. A refused E is not a bug.
- Two racers from one headless Chrome: open the second tab on `/game/<id>` and it joins. Opening it
  backgrounds the host tab, so its rAF stops and the HUD's addEffect readouts stay blank. Send
  `Page.bringToFront` to the tab before you read or screenshot it (#236, 2026-09-24).
- `location.href = …` inside a CDP eval left the tab deaf to CDP. Open a new tab with
  `PUT /json/new?<url>` and close the old one.

**Why:** the unit tests cover the rules. Only a live room shows the client key path, the HUD and the
wire together, and a naive bot wasted three 180 s races (the old cap).

**How to apply:** reuse this for any power, pickup or HUD check that needs the real server.
Kill Chrome, the server and the client after. Related: [[koota-universe-reaches-the-page-world]].
