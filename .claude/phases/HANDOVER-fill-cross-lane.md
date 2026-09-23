# Handover — #170, what `Fill.intensity` costs the asteroid lane, and the rig that made it cheap

Session of 2026-09-23, branch `dev`, issue #170. Picked up from
`.claude/phases/HANDOVER-deck-vs-rail.md`, whose item 1 — *"The surviving finding belongs to the
open half of #170 ... Still an owner's-eye call across two lanes"* — this prices. **No source
change and no commit.** Full measurement set is on the issue:
`github.com/dineshsalunke/slur/issues/170#issuecomment-5789956614`.

## The verdict

**Fill 2 costs more than the previous handover thought, and the objection is a different one.**
The recorded worry was that *"at 2 the rubble visibly pales"*. Measured, the near flank rubble goes
from **0.73x the deck's linear luminance at the shipped 0.35 to 2.05x at Fill 2** — it crosses the
deck at **Fill ~0.8**. That is not paler rock, it is the rubble becoming the brightest large
surface in the frame while the corridor stops being the bright thing.

Priced against the gain: the sealed block's player-facing face buys blue **2.3 -> 4.4 -> 9.3 ->
15.5** across Fill 0.35 / 1 / 2 / 3. The ~10 levels #170 wants costs rock at 2x deck. At Fill 1,
just past the crossover, the face buys **+2 levels**. Recommendation on the issue: **Fill 1 is the
honest ceiling on this knob alone.**

Three things the sweep turned up that nobody asked for:

- **The monolith cannot be reached by this knob at all** — blue 2.2 -> 3.0 across a 5.7x raise.
  `Monolith.metalness` is `GRAPHITE_METALNESS` = 0.9 (`graphite.ts:2`); at 0.9 there is no diffuse
  for a fill to land on. Whatever is decided, every M1 surface stays where it is.
- **The fill lands on rubble asymmetrically.** One large flank rock read **1.9, 7.3, 16.2 at every
  Fill value**, identical to three decimals — N.L is 0 for its normal against `Fill.azimuth` 25 /
  `Fill.elevation` 35. So "raise Fill and compensate asteroid albedo" cannot restore both sides.
- **The wear dial did not open up at Fill 2** on the two instances in frame (<=0.8 of a level for
  `Block.wear` 0 -> 1, at both Fill values). This does not refute the green -3 / blue -3.7 already
  on #170 — wear multiplies a per-instance `sealedBlockWearSeed` — but it means raising Fill alone
  does not guarantee the acceptance bar reads on any given block.

## The rig change worth keeping — a lighting A/B with ZERO camera drift

`HANDOVER-deck-vs-rail.md` spent a whole pass fighting drift and landed on "freeze at the spawn
pose, probe by feature". **There is a better way, and it removes the problem instead of managing
it.**

`setNum` is a live module export (`apps/client/app/dev/tuning.ts`), and every lighting tunable is
`rebuild: false`, so it is read fresh each frame by `useFrame`. Vite dev serves the app's modules
by URL and dedupes them, so **the page can `import()` its own live module graph over CDP and call
`setNum` with no reload**:

```
node cdp.mjs "(async () => { const t = await import('/app/dev/tuning.ts');
  t.setNum('Fill.intensity', 2); })()"
```

The camera never moves, so every frame in a sweep is bit-identical except the light. Rig
reproducibility measured at **SSIM 0.99992** — against 0.906 for the timed-flight approach the
previous handover had to abandon, and 0.995 for its spawn-pose fix.

**Two gotchas that cost time:**

1. **A dynamic `import()` can get a different module instance.** `/app/game/ecs/traits.ts` and
   `/app/game/ecs/traits.ts?t=1790136001058` are two modules with two different `trait()` objects,
   so `world.query(tr.Sim)` silently returned **empty**. Read the URL the app actually loaded out
   of `performance.getEntriesByType('resource')` and import *that* string, HMR timestamp and all.
2. **Writing `Sim` under `KeyP` freeze does nothing visible** — `LocalLoop` skips
   `syncRenderSystem` while frozen, so the render group and chase camera never see the new
   position. Set `Sim` *and* `Prev`, unfreeze ~0.9s, re-freeze.

Together those two give **arbitrary camera placement**: resolve the same descriptor in the page
(`resolveTrack` off `/@fs/.../packages/shared/dist/index.js`), walk `segmentAt(i).blocks` for a
block worth measuring, and teleport to 40u behind it. `/test-level`'s spawn pose has no sealed
block near the camera at all — three blind flights failed to find one before this worked.

Also: the tall marigold-seamed slabs are **monoliths**, not sealed blocks. `MONOLITH_FIELD` 12x12x50
with `EDGE_SEAM` (`monolith-config.ts`); sealed blocks are the 8u-tall cuboids on the deck, out at
x +-12 to +-30, and there are only 109 in the whole 420-segment test level.

And the `drawbox` rule earned itself again: **two of five candidate rubble probes were nebula, not
rock**, and both looked like rock at 1x.

## What to do next

1. **The decision is the owner's and now has a price list.** Nothing else on #170 can move until
   Fill is chosen, because every remaining option is a retune.
2. **The option nobody has priced:** raise `Fill` and drop `ASTEROID_ALBEDO` (`asteroid-material.ts:1`,
   `'#586470'`) to compensate. Unmeasured, because there is no `Asteroid.*` entry in
   `tuning-schema.ts` and it cannot be swept live. It needs a temporary schema entry — worth adding
   if the owner wants this path explored, not before.
3. Still open and untouched from the previous handovers: **#162 should be closed as not
   reproducing** (owner's); **`NearFill` at intensity 40 contributes nothing to the deck at either
   probe** and is unmeasured on the ship, worth its own issue; the **corridor playtest** (12u pinch
   gates never flown); the **vertical-reach check** missing from the track validator.

## Shared-checkout state at handover

Working tree was clean at start and is clean at end — this pass wrote no source. The tuning
override store was cleared with `forget()` and the three touched tunables set back to their schema
defaults, so the `:5177` origin's `localStorage` is empty.

A client dev server is running on `:5177` against `:2567` (inherited) and a headless Chrome on CDP
port **9341** (this session's; it replaced the inherited 9338, which was killed). Both can be
killed. Other sessions hold `:5173`, `:5174`/`:2568` and `:5176` — leave those alone.
