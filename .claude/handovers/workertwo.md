Agent: workertwo · Lane: deck material on monoliths + blocks (#228) · Updated: 2026-09-24

## Goal

Owner pick B: *"lets use the deck material on the blocks and monoliths please"*. Code is done, plus the
`Monolith.plate` tunable. Docs and memory remain.

## Done

- `81c2b76`: monoliths use only the deck material (`floorSurface()` + `patchRailGlow`). `use-rail-mask.ts`
  shared by `monoliths.tsx` and `finish-gate.tsx`.
- `9688d40`: sealed, fractured and debris blocks spread `floorSurface()` and follow `Deck.*` through
  `applyDeckFinish` (`deck-finish.ts`).
- `f6e9874`: `Monolith.plate` tunable (0–24, default 4, rebuild). `SurfaceParams.joints`: false makes
  `eachJoint` a no-op (grooves, cavity, edge rubs, joint metal/rough) and drops the per-plate value jitter.
  `monolithSurfaceParams()` = deck params with `plate: Monolith.plate`, or `Deck.plate` + `joints: false`
  when it is 0. `monolithSurface()` in `track-materials.ts`; `monolith-group.tsx` uses it.
- Owner answers (via supervisor): no `Block.*` value dial (R1). No rail glow on blocks for now. Static
  default 4 for `Monolith.plate` (it does not follow `Deck.plate` edits) — supervisor OK'd.

## State

- At `f6e9874`: client tsc clean. vitest 244/244. Comment ratchet passes. Biome: one warning,
  `noExcessiveLinesPerFile` on `track-texture.ts` (626 lines; it was 617 before, so pre-existing).
- `jointWidth: 0` did NOT remove joints: `jointPx: Math.max( 1, … )` keeps 1 px. Hence the flag.
- Stills (git-ignored), `/test-level`, headless, 1600×813, DPR 1, frozen at x 0 z 75, clean origin :5187:
  `.claude/frame-tap-refs/228-monolith-plate-4.png` (grid on the pillars, as before) and
  `228-monolith-plate-0.png` (plain brushed metal on the pillars, deck unchanged).
- Bake cost, headless CPU, 4 samples: 22.6–29.8 ms per `surfaceMaps` build, joints on or off. At
  `Monolith.plate` = `Deck.plate` the cache key equals the deck's, so no extra bake [verified by
  code reading: same key order and values].
- The stills include workerthree's then-uncommitted rail edits in the tree (they were served by vite).
- Scratch vite 5187 and headless Chrome 9339 killed.

## Uncommitted

None.

## Held files

`apps/client/app/game/scene/{monolith-group, monoliths, monolith-frames, finish-gate, use-rail-mask,
unattached, rail-glow, track-blocks, block-debris, deck-finish, sealed-block-shader,
fractured-block-shader, metal, track-materials, track-texture}`, `apps/client/app/dev/{tuning-schema,
tuning-panel}.ts(x)`, `docs/ART_MATERIALS.md`, `docs/ADD.md`, `.claude/memory/monoliths-are-metal-now.md`.

## Next

1. `docs/ART_MATERIALS.md` §7: add item 12, a decisions + departures entry. Quote §M2: *"The separation
   from the deck is finish, not value. A coated dielectric block and a bare metal deck respond to the
   same light in visibly different ways"*. Record that blocks and monoliths now use the deck material
   (owner, 2026-09-24), with no value dial, and `Monolith.plate` (0 = no joints). Amend item 11 and the
   element→material table (lines ~444–448): blocks and monoliths → deck (M1).
2. `docs/ADD.md` §4: same change, short.
3. Replace memory `monoliths-are-metal-now.md` with `deck-material-on-blocks-and-monoliths.md`. Update
   the `MEMORY.md` line.
4. Follow-up for whoever holds `track-floor.tsx`: it keeps an inline copy of `applyDeckFinish`. Fold it
   into `deck-finish.ts`.
5. Earlier lane (#227): still waiting on the worktree and the 145 ms bake questions.

## Open questions

1. Owner: which `Monolith.plate` look to keep as default — 4 (grid) or 0 (plain)? Stills above.
2. Owner: does R3 need a follow-up? Wear patches do not show on the close block (one sample).
3. Owner (still open): worktree for the `036645c` darkness stills; the 145 ms bake on the first race
   frame.

## Lessons → memory

none. `jointWidth: 0` still painting 1 px is recorded in the commit and here; not a durable workflow
lesson.
