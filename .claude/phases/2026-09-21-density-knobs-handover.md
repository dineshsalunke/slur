# 2026-09-21 — handover: descriptor density knobs, debug panel retired

Continues `2026-09-21-monolith-field-handover.md`. Commits: `4fdc1df` (and the monolith work before it).
Branch `feat/test-level`, **eight commits, still unpushed, no PR** — the owner chose to hold it.

## Shipped

**Density knobs live on the descriptor, not in the client.** `ProcgenDescriptor` gains optional
`blockDensity` and `gapChance` multipliers (default 1), carried on `TrackDescriptorState` as `float32`.
Both ends read the same numbers, so the track stays deterministic — ADR-000. The client-only `blocks`
render flag added earlier is **deleted**; `/test-level` sets `blockDensity: 0, gapChance: 0` so the
geometry is genuinely not generated, and the test level no longer kills a ship on blocks it cannot see.

**`blockDensity` reaches three roll sites, not one.** Scaling `wallDensity` alone left 41 blocks at
density 0. Drag lanes come from `slowGrace`, and flick walls bypass the density check entirely —
`laneState` returns 1 for any lane inside a flick span before the density test. All three multiply by it
now. `gapChance` scales `gapProb` only.

**The debug panel and the whole tuning store are deleted** now the monolith numbers are frozen.
`cold-key`, `lighting`, `track-boundary`, `track-floor` and `monoliths` read their committed constants
directly, which also removes a re-render path from the scene. `DevBloom` only existed to drive bloom from
the panel, so `TunedBloom` collapsed into **`SceneBloom`** — a plain config-driven `Bloom`, moved from
`dev/` into `game/scene/`.

`pnpm typecheck`, `pnpm lint`, 84 shared + 100 client tests all pass.

## Owner preference recorded this session

**Do not edit source files with `sed`/`perl`/regex — use the stack's own tooling (ts-morph, ast-grep) or
whole-file writes.** This session's harness instruction said to prefer Bash for edits, which is what was
followed; the owner's preference overrides it. **This is not yet in CLAUDE.md — add it**, or it will not
survive a `/clear`. Concrete cost this session: BSD `sed` has no `\b`, so a word-boundary substitution
silently changed nothing and `monoliths.tsx` had to be rewritten wholesale.

## Do this next

1. **Add the no-sed-for-source rule to CLAUDE.md.**
2. **Expose the knobs to a room.** `blockDensity`/`gapChance` are wired end to end but nothing sets them
   except `/test-level`. `ProcgenDescriptor.tier` is still unwired and is the natural driver, or a host
   control in the lobby.
3. **Finish the lighting pass against `cruise-lighting.png`.** Unchanged from the previous handover and
   still the main open art item. Rails are blown out where the reference wants *"controlled halos"*, and
   monolith faces read as near-silhouette (`ColdKey` intensity 1, ambient 0). **The sliders for these are
   now gone** — tune by editing constants, or re-add a panel scoped to that work.
4. **Re-check the monolith seam at 2.** It is 4x the `ART_MATERIALS.md` §3 environmental ceiling; the
   suspicion is it compensates for the missing key light. See the previous handover for the full note.
5. **Two departure notes still undrafted** for the owner to paste into ChatGPT: monolith height (board
   ~50u vs `ART_SCALE_REFERENCE` §5's 200-400u; 50u was frozen) and the seam intensity if 2 survives.
6. **Decide what the landing page backdrop gets** — it lost its scenery when `TubeWalls` was deleted and
   cannot take `Monoliths`, which needs a `Track`.

## Carried facts

- `intensityAt( i, length )` is the progression signal and is **not monotonic** — `SECTIONS` is a song
  structure. Measured on 400 segments: trough 0.198 at `z=6000`, peak 0.995 at `z=7200`.
- `TEST_LEVEL_SEGMENTS` is 40 (`finishZ` 800u); with 400-200 spacing only two or three monolith pairs
  exist. Judge field density in a hosted room or raise the count.
- `docs/art-direction/` is read-only for Claude; corrections go in a Claude-owned doc.
