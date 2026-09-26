---
name: stage-a-mine-on-test-level
description: "To look at a mine, set the ship's Held slots to [3,0,0] on /test-level and press E; a scripted host in a room wedges and never reaches one"
metadata:
  node_type: memory
  type: reference
  originSessionId: def1af11-0f49-4854-b09e-00cc6f15cd51
  modified: 2026-09-26T08:33:29.677Z
---

To get a live mine on screen, load `/test-level` fresh and import koota and `ecs/traits.ts` by the exact
URLs the page loaded. Then call `e.set(Held, { slots: [3, 0, 0] })` on the `LocalPlayer` entity and
dispatch `KeyE`. The mine lands at z≈6, under the ship's nose. Move it into view by writing `z` (and a big
`ttl`) on its entry in `localCombat.mines`. `/test-level` and `/game` draw mines with the same
`MineBodies`, so the look is the same.

**Why:** on 2026-09-26 (#275 check 4) the scripted host pilot in a hosted room wedged on a block twice. It
used up two 180 s races without holding a mine. The bot also takes pickups first. The first mine it did
fire fizzled against a block.

**Also measured:** the renderer runs `NoToneMapping` (`gl.toneMapping === 0`). A material's `toneMapped`
flag therefore changes nothing. Flipping it on the mine glow moved the crop peak 232→238, which is within
frame noise.

Related: [[koota-universe-reaches-the-page-world]], [[place-the-ship-over-cdp]],
[[drive-a-hosted-room-over-cdp]].
