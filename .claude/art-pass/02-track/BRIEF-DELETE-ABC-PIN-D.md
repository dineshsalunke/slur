# Brief — delete A/B/C, leave only the outboard rail

**Worktree:** `../slur-worktrees/boundary-three-way` — `cd` there first, it is NOT the shared checkout.
**Branch:** `art/boundary-three-way`, freshly rebased onto `origin/dev` (`1b2e71f`). Tip `912e860`.
**Stack:** `:5206` / `:2606` already serves this worktree.

## Why

ADR-012 is merged and true in the docs — *"the deck's rendered top face ends at exactly
±`HALF_WIDTH`; the rail is outboard"*, and *"it may not take a single unit of playable width, at any
setting"* (`docs/DECISIONS.md`). It is **false in the code**: `BOUNDARY_VARIANT = 'A'` is the
committed default, A is non-outboard, so `track-floor.tsx:73` still runs
`deckL = !outboard && isOuterEdge(x0) ? x0 + w : x0` and the deck draws 62u while the player flies
64u. That is the exact bug ADR-012 exists to kill.

The owner has closed the shape question and asked for A/B/C to be deleted. D becomes the only
boundary and the branching disappears — so no code path *can* inset the deck. That is the
acceptance test: the invariant holds by construction, not by a default value.

**Do NOT re-open "which shape".** Do not build the channelled rail profile in
`RAIL-PROFILE.md` — the owner parked it as polish this session.

## What stays a knob

`width` and `wrap` stay live sliders. **`wrap` must still reach 0** — flush-vs-raised is
deliberately open (owner: *"lets keep the option open for now, we will finalize later"*). Do not
pin a height as final, do not remove the slider, do not change the committed 1.0 / 1.0.

## The consumer map — already derived, don't re-derive it

`track-geometry.ts`
- Delete `BoundaryVariant`, `BOUNDARY_VARIANT`, `isOutboard`, `isRaised`, `inwardFalloff`.
- `packGeometry`'s `falloff?` param and its `uv1` block were C's only — delete both.
- Keep `BOUNDARY_W`, `BOUNDARY_H`, `isOuterEdge`. `BOUNDARY_H`'s comment still says *"wrap down the
  outer face"* — that is A/B language; it now lifts the band above the deck, 0 = flush.

`track-boundary.tsx`
- `emitEdge` keeps only its `isRaised` branch (top face + inner face). Delete the outboard-flare and
  inboard branches. Drop the `variant` param from `emitEdge`, `emitBoundary`,
  `buildBoundarySpanGeometry`, `buildBoundaryGeometry`, `TrackBoundary`.
- Material is always `BOUNDARY_SURFACE`. **Drop `key={variant}`** — it existed only because C swapped
  in `map`/`emissiveMap` and R3F never restores a prop that stopped being passed. With one material
  there is nothing to key.

`track-floor.tsx`
- `outboard` is always true -> `deckL = x0`, `deckR = x1`, unconditionally. **This line is the
  invariant** — give it a one-line comment saying so and citing ADR-012.
- `sideL`/`sideR` keep their `isOuterEdge` test, `lip` is always `t + h`.

`track-materials.ts` — delete `boundarySoftSurface`, drop the `edgeFalloffRamp` import.
`track-texture.ts` — delete `edgeFalloffRamp`, `buildRamp`, `rampCached`, `RAMP_RES`, `RAMP_EXP`.
`debug-tuning.ts` — drop `boundaryVariant`, `setBoundaryVariant`, the `BOUNDARY_VARIANT` import and
its line in `debugTuningSource`. Keep the `string extends` predicate in `DebugTuningColorKey` (still
correct), but its comment's *"keeping the variant's 'A' | 'B' | 'C' out"* rationale is dead — rewrite it.
`debug-panel.tsx` — drop the `DebugVariant` import, its usage, and the "boundary shape" heading.
`debug-variant.tsx` — **delete the file.**
`routes/art-gallery/boundary-subject.tsx` — calls `buildBoundarySpanGeometry` on defaults; just
confirm it still compiles.

`track-boundary.test.ts` — drop the A/B/C cases and the `uv1` cases, drop the variant argument from
the D cases, and keep D's tests as the unconditional boundary tests. **Add one test that pins the
invariant directly:** the deck's top face reaches exactly ±`HALF_WIDTH` for every `width` and `wrap`
in a swept range. That test is the point of the change.

## Rules that are pass/fail here

- **Never regex-edit source** (`sed -i`/`perl -pi`): use `Edit`, or `ast-grep` for structural sweeps.
- **Comments: terse, only what the code cannot say.** One or two plain lines. No multi-paragraph
  rationale blocks — longer reasoning goes in the commit body.
- **No Python** for any scripting or checking.
- **Full verify gate before you report done:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build`.
  Green lint included — biome lints JSON too.
- Commit in the worktree. Trailer: `Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>`.
  **No `Co-Authored-By: Claude <noreply@anthropic.com>`** — the hook rejects it.
- Do not `git add` and `git commit` in one Bash call; a hook rejection kills the whole call.

## Report back

The gate output, the final diffstat, and one line on whether `:5206` still renders the rail
correctly at `wrap` 0 and `wrap` 1. Do not take a Chrome tab — the owner's tabs are his.
