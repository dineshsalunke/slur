Agent: workertwo · Lane: none (idle) · Updated: 2026-09-24

## Goal

No lane. Supervisor: stay idle. The last lane was deck material on monoliths + blocks (#228). Its code,
tunable, docs and memory are done.

## Done

- `81c2b76`: monoliths use only the deck material. `use-rail-mask.ts` shared by `monoliths.tsx` and
  `finish-gate.tsx`.
- `9688d40`: sealed, fractured and debris blocks spread `floorSurface()` and follow `Deck.*` through
  `applyDeckFinish` (`deck-finish.ts`).
- `f6e9874`: `Monolith.plate` tunable (0–24, rebuild). `SurfaceParams.joints`: false makes `eachJoint`
  a no-op and drops the per-plate value jitter. `monolithSurface()` in `track-materials.ts`.
- `321a65f`: `docs/ART_MATERIALS.md` rev. 8. `docs/ADD.md` §4. Memory
  `deck-material-on-blocks-and-monoliths.md`.
- `d54e4ef`: §7 item 12 superseded-in-part note.
- `fd818e6`: `Monolith.plate` default 4 → 2 (owner).

## State

- At `fd818e6`: vitest 244/244. At `f6e9874`: client tsc clean, comment ratchet passes.
- Plate-2 bake: extra ≈ 57–67 ms cold on `/test-level` (headless swiftshader). Hosted room at GO:
  [unmeasured].
- Next 0 (reduced-motion nebula) was handed to workerfour by the supervisor before I wrote anything.
  The line is `nebula-baker.ts:196` (`this.liveUniforms.uTime.value = elapsed;`), driven from
  `nebula-sky.tsx:11`.
- No scratch servers or Chrome running.

## Uncommitted

None.

## Held files

None. Released by the supervisor: `monolith-group.tsx`, `tuning-schema.ts`, `tuning-panel.tsx`
(workerthree's edits there are committed). The rest of the #228 file set is released with the lane.

## Next

1. Idle. Wait for the supervisor.
2. Follow-up for whoever holds `track-floor.tsx`: it keeps an inline copy of `applyDeckFinish`. Fold it
   into `deck-finish.ts`.
3. Earlier lane (#227): still waiting on the worktree and the 145 ms bake questions.

## Open questions

1. Owner: does R3 need a follow-up? Wear patches do not show on the close block (one sample).
2. Owner (still open): worktree for the `036645c` darkness stills; the 145 ms bake on the first race
   frame.

## Lessons → memory

none.
