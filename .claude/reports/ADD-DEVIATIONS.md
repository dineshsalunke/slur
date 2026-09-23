# ADD deviations — doc against code and against the art package

Audit of `docs/ADD.md` against the shipped code and against the current
`docs/art-direction/` layout, 2026-09-23. Every finding quotes the doc wording it relies on and the
file, line or path that contradicts it. Nothing is fixed here.

`docs/art-direction/` is ChatGPT's read-only workspace. Nothing in this report touches it; where a
finding is about that folder it is about **ADD's references into it**, which are ours to fix.

## Summary

| Severity | Count |
|---|---|
| Authority table points at paths that no longer exist | 1 (4 rows) |
| The doc describes a number or mechanism the code does not have | 3 |
| Internal inconsistency or stale claim | 3 |

---

## 1. ADD §0's authority table points at a retired layout

§0 is the section that tells a reader where the real direction lives. Four of its rows cite the
`handoff/` + numbered `boards/` structure:

> *"Visual direction, palette, material/shape language, A→B→C | **`docs/art-direction/handoff/`** —
> supersedes v1"*
>
> *"Concept boards | `docs/art-direction/boards/` (all 14 boards, consolidated — v1's + v2's board `12`)"*
>
> *"The approved integrated look | **`docs/art-direction/boards/12_approved_scene_marigold_depth.png`**"*

Neither directory exists. `docs/art-direction/` now contains `README.md`, `AUDIT.md`,
`golden-reference/`, `background/`, `track/`, `ingredients/`, `vehicles/`, `progression/`. The folder
was reorganised 2026-09-20/21; CLAUDE.md records it: *"the old `handoff/` + numbered `boards/` layout
is gone"* and *"Docs elsewhere in the repo still cite the retired `handoff/`/`boards/NN_*` paths —
treat any such reference as stale and resolve it through `README.md`."*

ADD §7 carries a fourth dead reference: *"per its own `00_STATUS_AND_SCOPE.md`"*.

**Impact:** the one table whose whole job is to route a reader to the authoritative source routes
them to four 404s. Highest-value fix in this report and the cheapest — it is a pointer update, and
`docs/art-direction/README.md` is the replacement index.

---

## 2. Numbers and mechanisms the code does not have

### 2.1 Monolith scale — doc says 200–400u, code ships 50u

ADD §4:

> *"**Environment monolith** | huge (200–400u), background-scale, framing — never track-adjacent mass"*

`apps/client/app/game/scene/monolith-config.ts:63`:

    height: 50,

A quarter of the bottom of the documented range. This is a **known, deliberate departure** — the
phase index records the height as *"frozen at 50u (a departure from `ART_SCALE_REFERENCE.md` §5's
200–400u, sided with the art board)"* — but ADD §4 still prints the old range as the contract, with
no note that the build went elsewhere.

**Impact:** the "never mistakable for a hazard" read in the same table row is carried by scale. At 50u
against 8u blocks the scale separation is 6×, not 25–50×. Whether that still reads is an art
judgement, not a code one, but the doc should not claim a number the build abandoned.

### 2.2 Monolith metalness — ships 0.9 against a documented dielectric spec

ADD §4 places monoliths on the block metal family. The engineering sheet `docs/ART_MATERIALS.md` §M3
specifies metalness 0.0 (dielectric). The shipped value is inherited from graphite —
`apps/client/app/dev/tuning-schema.ts:65`:

    'Monolith.metalness': { value: GRAPHITE_METALNESS, ... }

and `apps/client/app/game/scene/graphite.ts:2`:

    export const GRAPHITE_METALNESS = 0.9;

The phase index records this as an *"open departure, unresolved"* and cites the shipped value as 0.3.
**The index is itself stale on this number** — the value today is `GRAPHITE_METALNESS`, 0.9. Either
way it is not the 0.0 the materials sheet specifies.

### 2.3 Camera knobs — half fixed 2026-09-23, half will stay false

ADD §6:

> *"Knobs are named + commented in `apps/client/app/game/camera/chase.ts` (`CHASE`), live-tunable."*

When this report was written, two of the three claims were false. One has since been made true.

- **Live-tunable — now correct.** Eight `Chase.*` entries were added to
  `apps/client/app/dev/tuning-schema.ts` and a "Chase camera" group to `tuning-panel.tsx`;
  `chase.ts` reads them per frame through `num()`, the same way `rear-view-camera.ts` already did.
  Backtick opens the panel.
- **Commented — still false, and should stay false.** `chase.ts` contains zero comments, correctly,
  because non-negotiable #14 bans them outside `setTimeout`/`setInterval`/`useEffect`. **The ADD
  sentence asks for something the build rules forbid, so the ADD is what should change here, not the
  file.**

Named is true — the knobs are now named as tunable paths (`Chase.back`, `Chase.height`,
`Chase.lookAhead` …) rather than module constants.

This section is additionally out of date as of commit `3b50857` (2026-09-23), which changed the
camera's z from a smoothed follow to an exact copy with a smoothed follow *distance*, to fix the
forward judder (issue #212). §6's framing discussion still describes the old four-lever tuning.

---

## 3. Internal inconsistencies and stale claims

### 3.1 Cyan bolt tracers against a palette that demotes cyan

ADD §5: *"**(S5 built)** cyan bolt tracers (instanced+interpolated)"*.

ADD §3 retires cyan in the same document: *"Cyan is demoted from co-primary to a sparing support
accent at `#3BD6FF`"*, under a system where *"Marigold is the signature and the only energy colour"*
carrying *"projectiles"* explicitly. GDD §5.4 agrees with §3, not §5: *"Visually it reads as an
**elongated energy streak/tracer**"* under the marigold-primary direction.

A bolt is a projectile, so by §3 it should be marigold. Flagged as an inconsistency to resolve, not
as a verified code defect — I did not check what colour the bolt renders today.

### 3.2 "The one bitmap in the pipeline" is now six

ADD §9:

> *"**The one bitmap in the pipeline** is `public/textures/nebula-backdrop.jpg`"*

`apps/client/public/textures/` holds `nebula-backdrop.jpg` **and** a `metal/` directory with five
Metal046B 1K JPEGs (Color, Displacement, Metalness, NormalGL, Roughness), landed with the block
surface work. The §9 procedural-first claim and its "zero-asset-pipeline property" both need
restating against that.

This also puts pressure on §8 rule 3, *"Low-poly, no heavy textures. Light does the work, not
texels"* — five 1K maps sampled in world space is a texture budget the section says the art does not
have.

### 3.3 §8 rule 5 budget is still OPEN

> *"**Budget:** *OPEN* — set tri-count + draw-call budgets after first perf test."*

Still open, and now load-bearing: the 2026-09-22 render additions (rearview pass, rail area lights,
world-space metal maps, two asteroid fields) all landed with no budget to check them against. The
frame-time variance behind issue #212 is the first symptom. Not a deviation so much as an open
question that has started costing something.

---

## What to do with this

§1 is a pure pointer fix and should just be done — four dead paths in the routing table is the worst
kind of doc rot because it misroutes everyone who trusts the table.

§2.1 and §2.2 are real departures where the build chose differently from the package. Per CLAUDE.md
the correction is written on our side and handed to the owner to paste into ChatGPT, never edited
into `docs/art-direction/`. `ART_MATERIALS.md` §7 shows the shape.

§2.3 and §3.2 are stale claims that the build has simply outrun.
