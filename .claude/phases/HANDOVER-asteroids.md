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

## The look is NOT judged — this is the open work

Pass 1 is spheres. Whether they read correctly is unknown. Two readings were published and both
were retracted; see the correction comment on issue #211. Open questions:

- Does the rock read as lit cold blue-grey form, or as flat silhouette? If flat, rig issue #170
  (no light on the player-facing face) is the suspect and #211 should block on it.
- Is `meshStandardMaterial` at `#5a6570` / metalness 0.05 / roughness 0.9 the right rock, against
  `docs/art-direction/AUDIT.md`: *"Cold, desaturated light separates distant rock/planet forms from
  space."*
- Do the three bands read as three depth layers, or do `mid` and `belt` merge?

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

**CLAUDE.md still contradicts that instruction** — it carries a full "Worktrees (optional)" section
with setup steps. That conflict is unresolved and will catch the next agent. Someone should reconcile
it, but CLAUDE.md is the owner's file, so ask first.

**`git commit --amend` in a shared checkout clobbered a peer's commit.** Between two of my amends,
`rearview-mirror` committed onto the branch, so my amend replaced their message with mine. Restored
byte-identically (`%B` diff empty, trees equal); only the hash moved, `47111c3` → `37e70e0`. One git
index per checkout applies to `--amend` as much as to `git add`: amend assumes HEAD is yours, and in
this checkout it is not. Correct a pushed-or-shared message in the issue instead.

## Environment notes carried forward

- **Leave the browser tab open**, reuse the `/test-level` tab.
- **First screenshot after a reload comes back blank** — take a second one.
- A stack was already running on `:5173`/`:2567` this session, so `pnpm dev` failed on the port and
  HMR picked the change up instead.
