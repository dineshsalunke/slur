---
name: measure-a-homing-rule-on-procgen
description: "Before trusting a projectile path rule, run it over many procgen seeds against a block-avoiding target and classify each death by flight phase"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b3cbb304-60c0-4d79-b69e-031e451bd3bb
  modified: 2026-09-23T14:38:11.454Z
---

Measure any projectile path rule (seeker, homing, trail follow) over 30+ procgen seeds with a scripted
target that steers around blocks, gated by the real launch LOS. Log each death with its flight phase and
its x error from the target's path. Do this before you report a rate.

**Why:** the #219 breadcrumb seeker looked right in unit tests. It measured 30–97% blocked. The per-phase
log showed two collision artifacts that no hand-made test would catch. First, the zero-width launch LOS
let a 2u body clip corners. Second, a swept block test used the new x over the whole z-sweep. After both
fixes, blocked fell to about 1%. Related: [[instanced-meshes-hide-scene-bugs]].

**How to apply:** import from `packages/shared/dist` in a scratchpad `.mjs` (run `pnpm -F @slur/shared
build` first). Skip runs where the bot crashes and report how many. Mutation-check a new behaviour test on
a scratch copy of `test-dist` (symlink `node_modules`; a copied pnpm `node_modules` breaks its links).
