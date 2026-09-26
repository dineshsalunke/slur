---
name: stage-a-mine-on-test-level
description: "To get any power-up on screen on /test-level, write its id into slots[0] on the loopback room's server state and press E; a scripted host in a hosted room wedges"
metadata:
  node_type: memory
  type: reference
  originSessionId: b0f5f26f-a904-449c-ae79-bfcb620951e7
  modified: 2026-09-26T14:41:12.093Z
---

Get the room as in [[place-the-ship-over-cdp]]. Then write the power into the **server** ship and fire:

```
room.sim.state.players.get(room.sessionId).slots[0] = 3;   // HeldPower: bolt 1, seeker 2, mine 3, boost 4, shield 5
// wait ≥ 1 patch (150 ms), then dispatch KeyE
```

Verified 2026-09-26 (#288): all five fire and reach the decoded `room.state` (projectiles, seekers,
mines, boostTimer, shielded). A fire is refused while the ship is stunned or dead (`canFire`), so fire
early on an open deck: a boost staged after a crash stayed in the slot. Live objects are in
`room.sim.state.{projectiles,seekers,mines}`; moving one by writing its x/z there is [unmeasured].

**Why:** on 2026-09-26 (#275 check 4) the scripted host pilot in a hosted room wedged on a block twice
and never held a mine. The koota `Held` write and `localCombat.mines` from the old note are gone since
#288 slice 4: the server state overwrites the client on every patch.

**Also measured:** the renderer runs `NoToneMapping` (`gl.toneMapping === 0`), so a material's
`toneMapped` flag changes nothing.

Related: [[koota-universe-reaches-the-page-world]], [[drive-a-hosted-room-over-cdp]].
