# BRIEF — the deck gets a cold key from above

**Decision taken by the owner, 2026-09-20.** Not a proposal. The question was *"does the deck get a cold
key from above, or is it meant to be a void whose edges the rails draw"*, and the answer is the key.

Read this file and the two named source files. **Do not read `docs/art-direction/`, `INDEX.md`, the
02-track `README.md` or `LANE-BRIEF.md`** — everything from them that bears on this task is quoted below,
and re-reading them will cost you a third of your context before you write a line.

---

## Why, in one paragraph

The deck's flat emissive was deleted — it was a stand-in, never art direction, and a view-independent
per-fragment add gives a grey pedestal with zero form. That left the rail emitter array as the deck's
lighting. It cannot do the job, and the reason is geometric rather than a tuning failure: the emitters
sit at `|x| = 32.5`, 0.5u above a 64u-wide deck whose normal is +Y, which is **0.88° above the surface
plane**. `N·L ≈ 0.015` at the centreline. Two 1u strips at the edges of a 64u plane are, for everything
but the last couple of units, functionally coplanar with it. Matching an overhead source needs ~65× and
the near-rail band blows out long before the centre lifts, so **intensity is not the dial and never was**.

Two values in the tree exist only to paper over this, and both are recorded as departures in
`docs/ART_MATERIALS.md` §7 items 9 and 10: `FLOOR_METALNESS` at 0.75 against M1's bare-conductor 1.0, and
an undeclared **white** `AMBIENT_INTENSITY = 1`. Both work by making the unlit side less unlit. A key is
the thing that makes them unnecessary.

## The distinction the whole task turns on

***"There is no fill" is not the same as "there is no key".***

The direction's instruction is **deep shadows** — *"Cold rim light, deep shadows"*
(`CURRENT_STATUS.md`), *"restore deep shadow masses and dark stone/graphite surfaces"*
(golden-reference review), and explicitly *"No global orange wash or bright blue ambient fill"*
(`track/24_track_BRIEF.md`). Every one of those forbids a **fill** — an omnidirectional term that lifts
black levels everywhere and destroys form. **None of them forbids a directional source**, which creates
shadows rather than erasing them. A key gives the deck form; a fill is what takes it away. If your key
ends up reading as a fill, it is wrong, and that is the primary failure mode to watch for.

The direction also rejects one specific look by name: board 14 *"drifted into a saturated blue
environment and lifted shadows"* and its *"environmental saturation and bright material values are
rejected as the target"*. The wanted look is *"desaturated slate/charcoal scenery, deep near-black stone
and graphite, selective cold rims and localized golden energy"*. **Cold means desaturated slate, not
blue.** A saturated blue key is the single most likely way to fail this task.

## Scope

**In scope:** one new cold key source in the scene rig, its colour, intensity and direction; the
consequent re-test of `AMBIENT_INTENSITY` and `FLOOR_METALNESS`.

**Out of scope, do not start:** shadow maps and hazard-to-floor contact shading. The direction does ask
for contact shading, but shadow-mapping an 8000u track is its own task with its own budget. If your key
makes contact shading's absence conspicuous, say so in the PR and leave it.

## What to build

A **directional** source, not an ambient, hemisphere, or point. Directional is what gives `N·L` its
variation across a non-flat scene while landing near-1.0 on the deck's +Y normal — the exact opposite of
the rails' 0.015, which is the whole point.

Mount it the way `star-light.tsx` is mounted and read that file first: it renders its `target` explicitly
because three takes the direction as `light.worldPosition − target.worldPosition` and the default target
sits at the world origin, while the light rides `SkyFollow`. **Your key has the same problem and needs
the same solution** — a sibling target inside the follow group, so both ends translate together and the
direction is constant over the race's 8000u of travel. Getting this wrong produces a light whose
direction swings slowly through the race, which is very hard to spot and very easy to ship.

Files you will touch: `apps/client/app/game/scene/lighting.tsx` (where `AMBIENT_INTENSITY` lives) and
`apps/client/app/game/scene/star-light.tsx` (read for the mounting pattern; the key may be its own file —
one component per file is a project rule).

### Parameters to measure and propose, not to guess

Give each a recommended value **with the arithmetic or the frame behind it**, the way the sheen
attribution was done. You have a per-fragment harness for three's `meshphysical` path already — reuse it.

1. **Elevation.** Straight down, or tilted? Straight down maximises `N·L` on the deck and flattens every
   vertical surface in the scene; a tilt gives the deck a gradient and gives blocks and monoliths a lit
   and an unlit face, which is what "deep shadows" is asking for. Recommend a number.

2. **Bearing — and this one has a trap.** The star is at `starBearingDeg 66`, which is screen-**right**,
   and the deck's one visible highlight today is already 92% sky-IBL specular on that side (8% star, 0%
   rail). A key tilted the same way doubles the existing asymmetry; tilted the other way it balances the
   frame but is unmotivated by anything visible in the sky. **State which you chose and what you traded**
   — this is an art call I will route to the owner, so give him the two frames' worth of reasoning, not a
   fait accompli.

3. **Colour.** Desaturated slate, cold, low saturation. Propose a hex and say what it does to the deck's
   near-black graphite, which is what it mostly lands on.

4. **Intensity.** The gate is: does the deck have **form** — a readable falloff across its width and
   down its length — while black levels stay down and the marigold rails stay the loudest thing in frame?
   The rails must not lose the contest to the key. Marigold is the gameplay signal.

### The two re-tests this unblocks — do both, they are the point

5. **`AMBIENT_INTENSITY` back to 0.** The white ambient exists because nothing lit the deck. Once the key
   lands, drive it to zero and report what breaks. If something in the scene genuinely needs it, say
   which object and why — but the default expectation is that it goes, and *"there is no fill"* becomes
   true in the code instead of only in the docs. If it must stay non-zero, it should at minimum stop
   being **white**.

6. **`FLOOR_METALNESS` back to M1's 1.0.** Re-test it under the key. The measured history: sheen contrast
   was 23.70× at metalness 1.0 and 11.55× at 0.75, and 0.75 worked by lifting the **dark** side — it is a
   fill by another name. Under a real key the bare conductor M1 actually specifies may hold. Report the
   number; do not silently keep 0.75 because it looks familiar.

Also re-test, and report only: **`FLOOR_ROUGHNESS`**. M1's band is 0.35 – 0.50 and the shipped value is
0.4, but that band was written for a lit surface. Measured sheen contrast runs 2.75× at roughness 1.0,
5.11× at 0.7, 11.55× at 0.4, 25.07× at 0.15. Do not change it in this PR — say what the key does to it.

## Also in this PR — the emitter slot pair

**Owner's decision, same session: `RAIL_EMITTER_RANGE = 600` with `EMITTER_SLOTS = 24`.** You measured
24 as the zero-eviction slot count at range 600 across seven seeds. Ship the pair.

**Both move together or not at all.** The committed 400/12 pair already evicts in 10.4% of positions on
seed 1234 and 49.3% on the worst seed, and an evicted run is still contributing non-zero light, so each
eviction **pops** — unlike the range cutoff, which fades to exactly zero. Raising range without raising
slots trades a hard horizon for a flickering one.

`EMITTER_SLOTS` stays a **build-time** literal. `onBeforeCompile.toString()` is three's default
`customProgramCacheKey()`, so the count is baked into the program cache key by construction. Do not make
it a live knob and do not route it through `defines` — a `define` change is also a recompile, mid-race.

## Gate

Full verify: typecheck · lint (ratchet clean) · shared · client · server · build. Rebase on fresh
`origin/dev` before opening the PR and run **`git diff origin/dev HEAD`** — the **2-dot** diff. The 3-dot
diff has looked innocent on three separate branches this week that would each have silently reverted
`dev`. This is not optional.

Commit **without** a co-author trailer — the repo hook rejects that literal string anywhere in the
commit, heredocs included. Write around it.

## What I want back

The key's four parameters with their reasoning, the two re-test results, the bearing trade stated as a
choice for the owner, and a note on whether contact shading's absence became conspicuous. If you cannot
render, say every visual claim is `[unmeasured]` and give me the arithmetic instead — that has been worth
more than the frames on this arc so far.
