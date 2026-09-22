# Handover — asteroids (renderer shipped, look unjudged)

Session of 2026-09-23, branch `dev`, issue #211. Picked up from `HANDOVER-atmospherics.md`, whose
"Next" was the asteroid belt.

## Shipped

`bb2d9f5` feat(scene): render the three asteroid bands as instanced spheres (#211) — on `dev`.
Green on `pnpm typecheck` / `pnpm lint` / `pnpm test`.

New: `asteroids.tsx` (`Asteroids`), `asteroid-group.tsx` (`AsteroidGroup`),
`asteroid-material.ts`. Edited: `game-environment.tsx`, one import plus one line.

The existing `asteroid-config.ts` and `asteroid-field.ts` are untouched and their 8 tests still
pass. This slice was renderer-only.

Shape: mirrors the monolith pattern. `Asteroids` builds placements once per band in a `useMemo`
over the whole track; `AsteroidGroup` fills one `InstancedMesh` per band from a ref callback; one
module-scope `SphereGeometry( 0.5, 12, 8 )` is shared by all three. Mounted in `GameEnvironment`
beside `Monoliths`, because asteroids are environment, not track. Roughly 1270 instances over 8000u
of track in three draw calls. The five-way mechanism weighing is in issue #211.

`variants`, `detail` and `limit` in `asteroid-config.ts` stay unused. The first two describe real
rock shapes; a sphere has one of each. `limit` is a per-window budget and the field is not windowed.

## The look, judged on a clean origin

Done on `:5175` / `:2569`, a second stack inside this checkout on `dev` — a separate origin whose
`localStorage` held only leva's self-persisted defaults (every entry `value === from`), so the
scene rendered at pure schema values with no override from any other session.

Three findings, all reproducible at defaults:

1. **The rock reads two-tone, not as cold desaturated form.** Where the fill light catches it, it
   blows out to a pale near-white grey. Where it does not, the camera-facing hemisphere goes flat
   dark with almost no shading gradient across it. There is no middle. Against
   `docs/art-direction/AUDIT.md` — *"Cold, desaturated light separates distant rock/planet forms
   from space"* — the lit side is neither cold nor desaturated, and the dark side does not separate
   from space at all.
2. **This is consistent with rig issue #170**, *"The rig gives the player-facing face of everything
   zero light"*. `back-fill.tsx` is a `directionalLight` aimed by `Fill.elevation`/`Fill.azimuth`,
   and `near-fill.tsx` is a `pointLight` with a `distance` cutoff that never reaches rock at
   110–700u. Stated as consistency, not as proven cause — that is the mistake this note already
   records twice. #211 should not be closed before #170 is resolved and the rock re-checked.
3. **The 12×8 sphere is visibly faceted on the flank band.** Near rock shows straight silhouette
   edges. It is cheap to raise segments, but the better answer is the shaped geometry that
   `variants` and `detail` were written for, so this is pass-2 work rather than a knob.

Whether the three bands read as three depth layers is still unanswered — the washed lit side and
flat dark side between them destroy the depth cue that fog is supposed to give, so this cannot be
judged until 1 and 2 are.

Do not judge any of this on `:5173`.

Still outstanding from the atmospherics handover: the owner's mid-band crop of
`docs/art-direction/golden-reference/cruise-lighting.png`. Mid-band size and lighting have to sit
against the monoliths we already render.

## Do not judge scene look on the shared `:5173` origin

This cost the whole session. `localStorage['slur.tuning.v1']` is one store per ORIGIN, and other
sessions dial it live. Across three reloads the same nominal fog config gave flat black rock once
and a washed-out pale scene once; `Exhaust.idle` and `EngineLight.intensity` appeared as live
overrides mid-session, absent from the same diff minutes earlier. A reload-to-reload comparison
there isolates nothing.

**Get a clean origin without a worktree** (worktrees are retired — see below): set `CLIENT_PORT` +
`VITE_SERVER_PORT` in `apps/client/.env` and launch with a matching `PORT=` in the shell, per
CLAUDE.md's dev-server note and issue #59. Different port, different origin, separate store, all
inside this one checkout on `dev`.

Liveness is decidable from source and worth checking before blaming a stale key. `restore()` in
`apps/client/app/dev/tuning-persist.ts` applies an entry iff `entry.from` equals the **current**
schema default in `dev/tuning-schema.ts`. So a populated store proves nothing, and a `value` that
differs from its own `from` proves nothing either — compare `from` against the schema. A commit that
moves a default silently kills every entry persisted before it: `03a28c8` did that to `Fog.near`
60→40, `Fog.far` 500→420, `Fog.color` `#070a10`→`BACKDROP_HORIZON`.

## Two process failures worth not repeating

**I created a branch. The owner had said not to.** The standing instruction is at
`.claude/phases/2026-09-22-block-surface-and-the-fresnel-trade.md:11` — *"all agents work directly
on `dev`, no worktrees, and no creating branches unless specifically asked"*. I did not read the
phase notes before starting and followed CLAUDE.md's worktree section plus the harness default of
branching off the default branch. `feat/asteroid-bands` stranded three sessions' commits, because a
shared checkout follows one HEAD: `hud` and `rearview-mirror` committed onto it without choosing it.
The owner fast-forwarded `dev` to it; the branch is deleted and `dev` is at `dd24d04`.

**That conflict is now fixed at the source.** CLAUDE.md carried a "Worktrees (optional)" section
whose *"otherwise branch and commit in the checkout like any normal repo"* is the line I followed,
and whose "Use one when" list offered *"you need a second live stack running at once"* — my exact
situation, which is why the wrong path read as the documented one. `CLAUDE.md:206` is now
"Branching — `dev` only" (`734877b`): never create a branch or `git checkout` another one here, a
worktree is the only sanctioned branching and only when genuinely required, ask the owner if in
doubt, and a second live stack takes a second origin via `CLIENT_PORT` + `VITE_SERVER_PORT` rather
than a second checkout.

**`git commit --amend` in a shared checkout clobbered a peer's commit.** Between two of my amends,
`rearview-mirror` committed onto the branch, so my amend replaced their message with mine. Restored
byte-identically (`%B` diff empty, trees equal); only the hash moved, `47111c3` → `37e70e0`. One git
index per checkout applies to `--amend` as much as to `git add`: amend assumes HEAD is yours, and in
this checkout it is not. Correct a pushed-or-shared message in the issue instead.

## The tuning panel is being retired — judge accordingly

The owner has asked for the debug panel to be removed. It is briefed to `slur-supervisor`, not
started, and it is a bake-then-delete: 19 scene modules read `num()` / `col()` at runtime, so
dialled values move into source constants before the store goes.

This lands directly on the knobs the look pass above needs. Two consequences:

- **Anything settled goes into `dev/tuning-schema.ts` defaults, not left in `localStorage`.** When
  the panel goes, the schema is the only surviving record and stored values die with it. This is the
  same store that cost this session a judgement — in its permanent form.
- **Tell `slur-supervisor` when the panel is no longer needed**, so the retirement can be sequenced
  after this work and `hud`'s.

The asteroid code needs nothing from that pass: `asteroids.tsx`, `asteroid-group.tsx` and
`asteroid-material.ts` contain zero `num()` / `col()` calls, and the material is already three
source constants. Keep it that way — prefer real constants over new tunables in anything added here.

## Also briefed and unstarted

`.claude/phases/HANDOVER-block-mechanics.md` (`a551808`): block collisions bouncing instead of
killing, and 4u–8u organic block heights. The second is blocked by the single-slice clearance
sampler at `packages/shared/src/sim/track.ts:414`.

## Environment notes carried forward

- **Leave the browser tab open**, reuse the `/test-level` tab.
- **First screenshot after a reload comes back blank** — take a second one.
- A stack was already running on `:5173`/`:2567` this session, so `pnpm dev` failed on the port and
  HMR picked the change up instead.
