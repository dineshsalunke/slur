Agent: workertwo · Lane: deck material on monoliths + blocks (#228) · Updated: 2026-09-24

## Goal

Owner pick B: *"lets use the deck material on the blocks and monoliths please"*. Code, tunable, docs
and memory are done. Waiting on the owner's `Monolith.plate` default and workerthree's seam-flicker report.

## Done

- `81c2b76`: monoliths use only the deck material. `use-rail-mask.ts` shared by `monoliths.tsx` and
  `finish-gate.tsx`.
- `9688d40`: sealed, fractured and debris blocks spread `floorSurface()` and follow `Deck.*` through
  `applyDeckFinish` (`deck-finish.ts`).
- `f6e9874`: `Monolith.plate` tunable (0–24, default 4, rebuild). `SurfaceParams.joints`: false makes
  `eachJoint` a no-op and drops the per-plate value jitter. `monolithSurface()` in `track-materials.ts`.
- `321a65f`: `docs/ART_MATERIALS.md` rev. 8 (header note, M2 + M3 notes, §2 rows, item 11 pointer,
  new §7 item 16, §8 log). `docs/ADD.md` §4. Memory `monoliths-are-metal-now.md` replaced by
  `deck-material-on-blocks-and-monoliths.md`; `MEMORY.md` line updated.

## State

- At `f6e9874`: client tsc clean. vitest 244/244. Comment ratchet passes. Biome: one pre-existing
  `noExcessiveLinesPerFile` warning on `track-texture.ts`.
- Stills (git-ignored), x 0 z 75, frozen, clean origin: `.claude/frame-tap-refs/228-monolith-plate-4.png`
  (grid on pillars) and `228-monolith-plate-0.png` (plain brushed pillars; deck unchanged).
- Bake: 22.6–29.8 ms per `surfaceMaps` build, headless, 4 samples. No extra bake at default.
- §7 item 12 of `ART_MATERIALS.md` still describes `Metal.mapTint` as live. Item 16 records its
  deletion; item 12's text is not edited.
- No scratch servers or Chrome running.

## Uncommitted

None.

## Held files

`apps/client/app/game/scene/monolith-group.tsx` — HELD, do not edit until workerthree's seam-flicker
report is in (supervisor). Also held: `apps/client/app/game/scene/{monoliths, monolith-frames,
finish-gate, use-rail-mask, unattached, rail-glow, track-blocks, block-debris, deck-finish,
sealed-block-shader, fractured-block-shader, metal, track-materials, track-texture}`,
`apps/client/app/dev/{tuning-schema, tuning-panel}.ts(x)`, `docs/ART_MATERIALS.md`, `docs/ADD.md`.

## Next

1. Wait for the supervisor: the owner's `Monolith.plate` default (4 or 0), and workerthree's
   monolith seam-flicker diagnosis. If the default is 0, change `tuning-schema.ts` value, update
   §7 item 16 wording, take one still.
2. Follow-up for whoever holds `track-floor.tsx`: it keeps an inline copy of `applyDeckFinish`. Fold it
   into `deck-finish.ts`.
3. Earlier lane (#227): still waiting on the worktree and the 145 ms bake questions.

## Open questions

1. Owner: `Monolith.plate` default — 4 (grid) or 0 (plain)? (supervisor is asking)
2. Owner: does R3 need a follow-up? Wear patches do not show on the close block (one sample).
3. Owner (still open): worktree for the `036645c` darkness stills; the 145 ms bake on the first race
   frame.

## Lessons → memory

`.claude/memory/deck-material-on-blocks-and-monoliths.md` (replaces `monoliths-are-metal-now.md`).
