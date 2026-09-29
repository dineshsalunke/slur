Agent: workerone · Lane: RFC-349 F1 engine skeleton (#385) — sim half done, client half next · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#385: engine skeleton. Registries, `defineSimFeature` / `defineClientFeature`, feature systems on the S16
scheduler, `FeatureViews`, a bridge loop over `net` handlers, the `step()` hook loop, and `PlayerState` from
`schema()`. Zero features. No behaviour or wire change. Build to `conventions/features.md`.

## Done

- `1a5415c7` — sim half. `features/define-sim-feature.ts` (contract; `run` hooks bound per RunSim through
  `open()`, so there is no module state), `features/registry.ts` (`SIM_FEATURES = []`),
  `features/sim-hooks.ts` (`sortFeatures`, `featureThrust`/`featureCap`/`tickFeatures`, `openRunFeatures`),
  `player-fields.ts` (`CORE_PLAYER_FIELDS`, `composePlayerFields`, `PLAYER_FIELDS`, `SIM_SHIP_KEYS`,
  `SIM_FLOAT_KEYS`, `SimShipFields`), `schema.ts` (`PlayerState = schema(...)` + `SchemaType` alias),
  `sim/types.ts` (`SimShip = SimShipFields`; keys re-exported), `step.ts` and `run-sim.ts` hook calls,
  `player-fields.test.ts` (golden wire order).

## State

- Wire: the full encode and a patch of a populated RunState are byte-identical before and after (902 hex
  chars, `cmp`). Measured this session with a scratch probe, now deleted.
- `pnpm test`: shared 578/578, client 696/696, server passes. `pnpm lint` passes.
- `pnpm typecheck`: shared and server pass. The client fails ONLY in `game/scene/scene-effects/*`. That is
  workerthree's uncommitted S18 work, not mine.
- Footgun hit: `player-fields.ts` must import only leaf modules. Importing `emptySlots` from
  `combat/combat-step.js` made a cycle (`sim/types` → `player-fields` → `combat-step` → … →
  `sim/score/notes`), and 4 test files threw `Cannot access 'HELD_MIN_CELLS' before initialization`. The
  slots default now uses `combat/constants.js`.
- The metadata type of `slots` is `{ array: 'uint8', default: ArraySchema }`, because `schema()` stores the
  spec object as the type. Reflection reads only `Object.keys(type)[0]` (`Reflection.ts:141`), so the wire
  is unchanged. The test compares the type as `array:uint8`.
- `spawnShip` still lists fields by hand. Its `SimShip` return type makes a missing feature field a
  compile error.
- `index.ts` does not export `features/*` or `player-fields.ts` yet. The client half needs `SimFeature`,
  `SIM_FEATURES` and `sortFeatures`. Add `export *` for the three `features/*` files. Do not add
  `export * from './player-fields.js'`: `sim/types` already re-exports the keys (check TS2308 if you do).

## Uncommitted

- none of mine.

## Held files

- Claimed and clear: `packages/shared/src/index.ts`, `apps/client/app/engine/*` (new),
  `apps/client/app/features/client-features.ts` (new), `apps/client/app/game/net-canvas.tsx`, `.ls-lint.yml`,
  `conventions/features.md`.
- Released back to me: `net/attach-room-to-world.ts` (S8 landed 8681e05) and
  `game/net-loop/net-loop.constants.ts` (S17 landed a3ee47ad; keep `net.send-input`, `net.host-tick`,
  `net.hud` in place).
- Not mine: `game/scene/world-scene.tsx`, `routes/home/landing-scene/*` (workerthree, S18).

## Next

1. Client half. Design (decided):
   - `engine/define-client-feature.ts`: `ClientFeature { id; sim?: SimFeature; systems?: readonly
     FrameSystem<NetFrame>[]; views?: { scene?: ComponentType }; net?: Readonly<Record<string, (payload:
     never) => void>> }` and `defineClientFeature(f) => f`. Add only the slots that have a consumer in F1.
     hud, audio, dials, traits, rules and `views.pickups` come with their consumers later. Say so in the
     commit.
   - `features/client-features.ts`: `CLIENT_FEATURES = []`, `DEV_FEATURES = []`.
   - `engine/active-features.ts`: `ACTIVE_FEATURES` (DEV adds `DEV_FEATURES` behind
     `import.meta.env.DEV`), checked with `sortFeatures` for duplicate ids, and every `f.sim` must be in
     `SIM_FEATURES`. Also `FEATURE_SYSTEMS = ACTIVE_FEATURES.flatMap(f => f.systems ?? [])`.
   - `game/net-loop/net-loop.constants.ts`: `scheduleSystems('net', [ ...core, ...FEATURE_SYSTEMS ])`.
   - `engine/feature-views/feature-views.tsx`: `<FeatureViews slot="scene" />` maps `ACTIVE_FEATURES` to
     `views[slot]`. Use `<Fragment>`, not `<>`. Mount it in `net-canvas.tsx` after `<PortalField />`.
   - `engine/bind-feature-messages.ts` + `.test.ts`: `bindFeatureMessages(room, features) => off`, using
     `room.onMessage(type, on)` (typed `never` payload, so no cast). Call it once inside
     `attachRoomToWorld` and call its `off` in the returned cleanup.
   - `.ls-lint.yml`: `.feature.ts: kebab-case` under `packages/shared/src`, `.client.ts: kebab-case` under
     `apps/client/app`.
   - `conventions/features.md`: §3 as-built slot list. Fold in **Q6** (owner, answer B): "In a dev build,
     the host's Rules dials write the room's B2 override map in the lobby only; values lock at GO for every
     racer. The server accepts these writes only when it runs in dev mode, so a production room rejects
     them. Built in S6." Put it next to the Q5 scope line and remove the Q6 bullet from §8. Also fold in
     **Q7** (owner, answer a3 with no library, RFC 54ff79b7): commands use the 0.17 `messages` table with
     `validate()`. Each schema is a hand-written synchronous StandardSchemaV1 object `{ '~standard': {
     version: 1, vendor: 'slur', validate(v) } }` that wraps the existing checks. No valibot or zod. It is
     S12 work. Replace the §8 Q7 item. Also remove the stale "Open: Q5/Q6" bullet in
     `.claude/rules/features.md`; it is in the same doc set.
2. Gates: `pnpm typecheck` (ignore the S18 errors only if they are still uncommitted), `pnpm test`,
   `pnpm lint`.
3. Owner check: /test-level looks and flies the same. There is no visible change.
4. Commit by pathspec. `gh issue close 385 -c "<SHAs>"`. Send the supervisor the SHAs.

## Open questions

- none.

## Lessons → memory

- none new. The leaf-import cycle is in this file under State. It is specific to `player-fields.ts` and
  the code shows it.
