# 2026-09-21 — handover: the monolith field and the approved sky

Continues `2026-09-21-test-level-handover.md`. Commits: `63c9325`, `b5db417`. That file's "do this next" list is now partly stale —
read the status section below before acting on it.

## Status of the previous handover's three items

1. **CLAUDE.md `/solo` amendment** — still not done. The owner said they would. Wording proposal is in
   the previous handover.
2. **Push `feat/test-level` and open the PR** — **the owner chose to hold the branch.** It now carries
   three commits, still unpushed, still no PR. Do not push without asking again.
3. **Scene lighting** — the owner settled the governing reference: **`cruise-lighting.png`**, not
   `action-lighting.png`. Started, not finished; see below.

## Shipped on `feat/test-level` (`63c9325`, not pushed)

The scene had been running on the placeholder environment since the project's first week. Two bugs the
owner spotted in `/test-level` drove the work:

- **White bars beside the track** — `TubeWalls`, random-height emissive white slabs 68u off the deck.
- **No nebula** — `SkyBackdrop` (`/textures/nebula-backdrop.jpg`) was mounted only by `DeepSpaceSky`,
  and `DeepSpaceSky`'s only consumers were the `/art-lab` and `/iso-*` routes deleted in `d35d146`.
  The texture was on disk the whole time; nothing rendered it.

**`GameEnvironment`** (new) now holds background, fog, `DeepSpaceSky` and the monolith field, and
`WorldScene` mounts it. `DeepSpaceSky` takes `light={false}` so its `StarLight` does not double up on
`ColdKey`. `SkyBackdrop` gained `fog={false}` — fog `far` is 460 and the backdrop sphere is at radius
800, so it fogged to nothing without it.

**`Monoliths`** (new) replaces `TubeWalls`, built to `docs/art-direction/progression/overview.png`:
uniform size, matched left/right pairs, even spacing, flush to the deck edge (inner face at
`HALF_WIDTH + BOUNDARY_W`), one full-height marigold seam on the track-facing edge. M3 dark stone per
`ART_MATERIALS.md`; the seam is the **first consumer** of `ENVIRONMENTAL_MARIGOLD_INTENSITY`, which had
been exported and unused.

**Density is progression-driven** via `intensityAt()` from `@slur/shared` — the ADR-006 envelope that
already drives corridor width, gap probability, wall density and flick rate. The field derives from
`track.finishZ`, so it is deterministic and identical on every client, and is built **once** through a
ref callback: no `useFrame`, no ECS subscription, no per-frame work. Covered by
`monolith-field.test.ts` (5 cases).

**`TubeWalls` deleted** as a first-week placeholder, with `WallConfig`, the `walls` block of all three
`ENV_VARIANTS`, and the `wallSeed` plumbing through `WorldScene` / `NetCanvas` / `TestLevelCanvas`.

**Debug panel cut to the monolith sliders only** at the owner's instruction — sliders come back for
whatever is being worked on. The tuning **store** keeps its other keys, so cold-key, bloom,
track-material and chase consumers still read their committed defaults.

`pnpm typecheck`, `pnpm lint` and `pnpm test` (100 client tests) all pass.

## Frozen values (owner's pass, `b5db417`)

height 50u · width 12u · depth 12u · gap 0 (flush to rail) · extends below deck 60u · spacing calm 400 ·
spacing intense 200 · seam 2.

**The seam value breaks the tier rule and is knowingly provisional.** `ART_MATERIALS.md` §3 caps the
environmental tier at *"**≤ 0.25** of gameplay"* and `MARIGOLD_REFERENCE_INTENSITY` is 2.0, so seam 2 is
fraction **1.0** — the gameplay tier exactly, 4× over. It is applied as its own `MONOLITH_SEAM_INTENSITY`
so `ENVIRONMENTAL_MARIGOLD_INTENSITY` is not left contradicting its own `FRACTION = 0.25`. Likely cause is
the unfinished lighting: `ColdKey` is intensity 1 with ambient 0, the stone renders near-black, and a 0.5
seam has nothing to sit against. **Re-check it after the lighting pass**; if 2 survives, it needs a
departure note for the package alongside the height one.

**The spacing sliders are mislabelled, not miscalibrated.** `calm` and `intense` are endpoints of a lerp
over `intensityAt()`, and the track never visits either end — `SECTIONS` opens with `intro` at `i0: 0.5`,
so the first monolith at `z=120` is already mid-ramp. Measured over 8000u, calm 400 / intense 200 gives
actual gaps of **201-363** across **29 pairs**. That is why both sliders appear to affect everything.
Relabelling them to the real min/max gap would be a genuine improvement.

## Art-rig state

`/test-level` hides obstacle blocks (`blocks={ false }` on `WorldScene`) so the deck and its surroundings
read clean. **View-level only** — blocks are deterministic track data that `simulate()` collides against,
so collision is unchanged and a ship still dies on geometry it cannot see. `/game/:roomId` still renders
them. Flip the prop to bring them back.

**The test level is short enough to starve the monolith field.** `TEST_LEVEL_SEGMENTS` is 40 → `finishZ`
800u, and spacing is 400-200, so only two or three pairs ever exist. Raise the segment count when judging
field density, or judge it in a hosted room.

## Next design task — density knobs in the descriptor

The owner's ask: control addition/deletion of blocks (and gaps) with a knob, since levels are generated.

**The knobs already exist as constants** — `constants.ts:140` `WALL_DENSITY_START = 0.14` / `WALL_DENSITY_MAX
= 0.4`, and `constants.ts:179` `GAP_P_START = 0.06` / `GAP_P_MAX = 0.16`, consumed by `wallDensity(
intensity )` and `gapProb( intensity )` which lerp START→MAX. What is missing is varying them per track
without editing source.

**A debug-panel slider is the wrong home.** Those constants being module-level is *why* the track is
deterministic: both ends compute identical geometry because they read identical numbers. Turning blocks
down client-side desyncs the client's track from the server's and puts prediction in conflict with
authority over geometry only one end believes in — ADR-000. This is the same reason the `blocks` flag is a
render flag and not a generator change.

**Recommended shape:** optional density fields on `ProcgenDescriptor` (`blockDensity`, `gapChance`) as
multipliers defaulting to 1; `wallDensity()` and `gapProb()` multiply by them; `/test-level` sets 0 for a
clean art track and a room sets them from `tier` or a host control. `ProcgenDescriptor.tier` is the hook
already reserved for this and still reads nothing.

If this lands, **delete the `blocks` render flag** on `WorldScene`/`TrackView` — a descriptor with
`blockDensity: 0` makes the special render path redundant, and removes the trap where the test level kills
you on invisible geometry.

Touches `/shared` (descriptor type, schema, generator) and both ends, so it is not a small change.

## Do this next

1. **Finish the lighting pass against `cruise-lighting.png`.** Not started. Two gaps are visible in
   the current build:
   - **Rails are blown out** — thick white-cored bars where `CRUISE-LIGHTING.md` asks for *"Rails have
     controlled halos"*. Levers are bloom threshold and `RAIL_EMITTER_INTENSITY`; **both sliders were
     just removed from the panel** — re-add them for this item.
   - **Monolith faces read as near-silhouette.** The board shows stone catching light. `ColdKey` is
     intensity 1 with `AMBIENT_INTENSITY` 0; the new drei `Environment` IBL is now live, so
     `FLOOR_ENV_MAP_INTENSITY` is no longer inert. Re-add the cold-key and ambient sliders.
2. **Decide what the landing page backdrop gets.** Deleting `TubeWalls` stripped its scenery — it is
   now dome plus stars. It cannot take `Monoliths`, which needs a `Track`.

## Things found this session that outlive it

- **`intensityAt( i, length )` is the progression signal**, exported from `@slur/shared` via
  `export * from './sim/track.js'`. It is **not a monotonic ramp** — `SECTIONS` in `constants.ts` is a
  song structure (intro / verse / prechorus / chorus / bridge), so intensity rises and falls. Measured
  profile on a 400-segment track: trough 0.198 at `z=6000`, peak 0.995 at `z=7200`, max 1.0 at
  segment 367. A test asserting "denser toward the finish" fails; assert peak-vs-trough instead.
- **`intensityAt` never reaches its endpoints on a real track.** Measured: first placement at `z=120` is
  already intensity 0.5. Any slider expressed as "value at intensity 0" / "value at intensity 1" will feel
  like both ends affect everything, because they do.
- **`ART_SCALE_REFERENCE.md` §5 conflicts with the board on monolith height** — §5 says 200-400u, the
  board reads ~50u. §5 is headed *"from the boards, sanity-checked"* and was only ratio-checked against
  track width, never against the chase camera. **This needs a departure note** in a Claude-owned doc for
  the owner to paste into ChatGPT — `docs/art-direction/` is read-only. Not written yet. The frozen height
  is **50u**, siding with the board. The seam departure below needs the same treatment.
- **`ProcgenDescriptor.tier` is still unwired.** `intensityAt` derives from position along the track,
  not from `tier`. If per-level intensity ever needs to differ, `tier` is the hook and nothing reads it.
- **The landing page was a second `TubeWalls` consumer**, easy to miss — `routes/home/landing-scene.tsx`,
  not just `/env-lab`.
- Still true from last session: the `arc` skill is not installed; `DebugPanel` should not be rebuilt;
  blocks are still the two placeholder families in `track-blocks.tsx`; open art issues are #166, #128,
  #173, #170, #162, #161, #160, #167, #163.
