# Ship feel — banking, engine light, rail bounce

Worktree `../slur-worktrees/ship-feel`, branch `feat/ship-feel`, based on `dcc3149` (the
`feat/test-level` head), **not** `origin/dev` — dev is 28 commits behind and carries none of the
corridor rebuild, so the ship could not be judged against the real lighting there.

Client dev stack on `CLIENT_PORT=5175` / `VITE_SERVER_PORT=2569`. That port is its own browser origin,
so this worktree's `localStorage['slur.tunables']` is a **separate store** from the owner's `:5173`
one — nothing dialled on 5173 was read or written from here.

## Why a worktree

Four sessions were in the main checkout at once and nothing was committed. `slur-supervisor`,
`monoliths` and `asteroids` all confirmed the split before any file was touched:

- `monoliths` owns the uncommitted `step.ts` / `constants.ts` drag-block removal. Its words: *"clampToEdges
  itself is UNCHANGED — I only deleted the block immediately above its call site"*, and *"`Block.lethal`
  no longer exists on the shared Block interface"*.
- `slur-supervisor` owns `emitter-array.ts` (emitter positions moved view-space → world-space), the rail,
  deck and seam files.
- `asteroids` had edited nothing and will own `asteroid-*.ts(x)`.
- Ship lighting was handed to this session by both: *"SHIP LIGHTING/MATERIAL IS YOURS."*

Rail bounce touches neither `Block.lethal` nor `SimConfig.dragSpeedFrac`, so it does not collide with the
drag removal — but it does edit the same file, so whoever commits first must stage by path.

## Split Crown is the only real ship

Owner, mid-session: *"we will only be focusing on the split-crown ship as all others are just
placeholders"*, and *"its a freighter … replace the existing freighter models with split-crown"*.

The four `.gltf` ships are one mesh with one material named `Texture`, `metallicFactor 0`, base-colour
texture only, no emissive. `split-crown.glb` carries the actual SLUR material families as named
materials: `Charcoal_coating`, `Armor_panels`, `Recess_interior`, `Recess_bezels`,
`Marigold_emission` (emissive strength 0.8) and `Engine_core` (emissive strength 1.7).

`split-crown` was **already** the freighter — `ship-classes.ts:102`,
`'split-crown': { id: 'split-crown', name: 'Split Crown', classId: 'freighter' }`. There was no second
freighter model to replace. The actionable half was the default, so `DEFAULT_SHIP` moved
`'challenger'` → `'split-crown'`. Every other `DEFAULT_SHIP` use is a fallback, and the two tests that
name it do so symbolically, so nothing else moved.

**The model is authored to the freighter hull exactly.** Its position accessors give a bounding box of
`2.5 × 1.003 × 6.0` with `min.y = 0`, against the freighter's `halfW 1.25` (2.5u) and `halfL 3.0` (6u).
That confirms `ship-visuals.ts`'s `scale: 1, lift: 0` and confirms the model was built for this class.

## Banking

`docs/GDD.md` §5.3 is the constraint: *"pitch/yaw/roll are **cosmetic banking**, never control axes"*,
and `docs/ADD.md` §"Speed cues": *"subtle bank into strafes"*. So attitude stays presentation-only and
never feeds the sim.

What was there: one line in each of two places, instantaneous and roll-only —
`grp.rotation.z = -( s.vx / DEFAULT_TUNING.strafeClamp ) * 0.5`. The local copy in `systems.ts` read
`DEFAULT_TUNING` regardless of ship class, so a Freighter (`strafeClamp` 65) banked as if it were a
Fighter (80) — it hit full roll at 81% of its own strafe limit. The remote copy in `net-systems.ts`
already used `tuningForShip`, so local and remote ships banked differently for the same input.

Now one pure function, `driveAttitude` in `game/ecs/attitude.ts`, called from both sites, with per-ship
state in an AoS koota trait `Attitude` (AoS so `get()` hands back the live object — SoA traits return a
snapshot and mutating it does nothing, `conventions/ecs.md`). Three axes, each a semi-implicit-Euler
spring toward a target derived from velocity: roll and yaw from `vx / strafeClamp`, pitch from
`vy / jumpImpulse`, all clamped to ±1 first so over-speed cannot over-roll. `dt` is capped at 1/30 so a
frame hitch cannot blow the integrator up.

### Mechanism — the five candidates (non-negotiable #13)

| Option | Verdict |
|---|---|
| `useFrame` per ship in `ShipModel` | rejected — N loops and duplicated state for one cosmetic value |
| R3F `addEffect` | rejected — a second clock when the loop already runs; nothing needs pre-render ordering |
| Inside the fixed-step `simulate()` | rejected — banking is cosmetic; putting it in shared sim invites it onto the wire and quantises it to 60Hz |
| react-spring / drei springs | rejected — React-driven, re-renders per frame, violates non-negotiable #4 |
| **Pure fn called from the existing two render systems** | **chosen** — one clock, zero re-renders, `dt` already in hand, one definition shared by local and remote, testable without a world |

Knobs are live in the tuning panel under **Ship bank**: roll 0.5 rad, yaw 0.12, pitch 0.18, stiffness 90,
damping ratio 0.75. Stiffness 90 is ~1.5 Hz and settles in about 0.3 s; 0.75 underdamps slightly so the
ship overshoots and settles rather than arriving dead, which is what sells the bank.

Remote ships have no `vz`/`vy` on the interp snapshot, so pitch is derived from the interpolated y across
the sampled span. Engine glow on remote ships sits at cruise rather than tracking throttle — the
snapshot carries no forward speed. Both are noted as follow-ups below, neither is worth widening the wire
for yet.

## Engine light

`docs/ART_MATERIALS.md` §2 assigns *"| Engines / thrust | **M7** | gameplay |"* and §3 puts the gameplay
tier *"above threshold; halo is part of the look"* at reference intensity 1.0, *"the track boundary strip
defines it"*.

The measurement that matters, and it is the same root cause `slur-supervisor` found on the rail.
`conventions/r3f.md`: *"emissive intensity is now the only lever that reaches `bloom.threshold`"*, and
`ExposureEffect` multiplies **before** `SceneBloom` in the `world-scene.tsx` composer chain. `Engine_core`
emissive is `[1, 0.462, 0.027]`, linear luminance **0.545**. At the authored strength 1.7 that is
**0.927** — under a `bloom.threshold` of 1. **The engine cores did not bloom at spec exposure.**

So the engine is now driven per frame between two intensities instead of sitting at the authored one:

- idle **1.8** → 0.98, glows hot, stays just under threshold
- cruise **3.2** → 1.74, clears it and blooms

driven by `vz / maxCruise`, so the halo blooms on the gas and falls back off it. Setting idle = cruise
disables the response and holds a constant glow. `Marigold_emission` trim sits at **1.2** → 0.51, glowing
and deliberately *below* threshold: §2 assigns the gameplay tier to the engines, not to hull trim.

Verified on `/test-level` at spec `tone.exposure 1`, `bloom.threshold 1`, `mapping Neutral`: four engine
cores with a visible halo under throttle, no halo at rest, trim glowing without halo, 103–120 fps at
cpu ~1 ms.

## OPEN — hull roughness conflicts with the M6 band. Owner's call, do not resolve silently.

The hull reads as a near-black silhouette. `docs/ART_MATERIALS.md` M6 (Claude-owned) specifies
*"Roughness | 0.25 – 0.40 — the glossiest family here"* and explains why that number carries the form:
*"Tight specular on crisp bevels does that work: a bevel catching a moving highlight is what separates a
physical object from a flat emissive icon."*

The authored GLB is **above** that band on both hull materials — `Charcoal_coating` 0.48,
`Armor_panels` 0.43 — so the specular the sheet relies on is broader and dimmer than specified.

A `ship.hullRoughness` **scale** knob exists for this (a scale, not an absolute, so the authored
separation between the six materials survives). At **0.75** the two land at 0.36 and 0.32, both inside
the band. A live A/B on `/test-level` looked better.

**It ships defaulting to 1.0 — authored values untouched.** The GLB is Codex's art, and CLAUDE.md is
explicit that a disagreement with the package is never resolved by quietly overriding it. This is written
up here for the owner to hand to Codex: either the GLB roughness comes down, or the M6 band widens. One
number changes if the owner takes the runtime route — `ship.hullRoughness` default 1 → 0.75 in
`dev/tunables.ts`.

## Rail bounce

`clampToEdges` in `packages/shared/src/sim/step.ts` pinned `x` to the limit and zeroed `vx`. It now
reflects: `vx = -vx * t.railBounce`, with `railBounce` a new `FlightTuning` field defaulting to **0.35**
— data, not code, per non-negotiable #6, so balance can dial it per class and `0` reproduces the old
stop-and-slide exactly. That equivalence is a test.

Shared sim, so it is server-authoritative and deterministic on both ends by construction.

Writing `-s.vx * 0` produced `-0` and a strict-equality test caught it, so the zero case assigns a
literal `0` rather than relying on the multiply.

**This contradicts a documented LIVE behaviour.** `docs/GDD.md` §11 roster table:
*"| Strafe (analog, drifty→snappy) + corridor walls | **LIVE** | walls stop+slide, non-lethal |"*. A
bounce is not stop-and-slide. The owner asked for it directly (*"a bit of controls like bounce on the
rails"*), so it is built — but the GDD line needs updating or the change needs backing out, and that is
the owner's call. Forward speed is deliberately untouched: a speed penalty would be a much larger
balance change than a bounce and was not asked for.

## Gates

`pnpm typecheck` clean. `pnpm test` — shared 104, client 142, server 4, zero failures. 25 of those are
new: 9 attitude, 8 ship-materials, 8 rail bounce. `pnpm lint` clean, including
`check-canvas-isolation` (5 route modules) and the comment ratchet: **100 changed source files, none
gained comment lines**.

Nothing is committed. `git add -p` by path when it lands, because the main checkout still holds three
other sessions' uncommitted work in some of the same files.

## Handover — state on exit

**Everything described above is written to disk in `../slur-worktrees/ship-feel` and passing. Nothing is
committed.** The branch is `feat/ship-feel` off `dcc3149`.

Changed: `dev/tunables.ts`, `game/ecs/{net-systems,systems,traits}.ts`, `game/net-loop.tsx`,
`game/scene/ship-model.tsx`, `net/attach-room-to-world.ts`,
`routes/test-level/{local-loop,local-ship}.tsx`, `shared/src/{constants,ship-classes}.ts`,
`shared/src/sim/step.ts`. Added: `game/ecs/attitude.ts` + test, `game/scene/ship-materials.ts` + test,
`shared/src/sim/rail-bounce.test.ts`, this note.

A client dev server may still be running on `:5175` (`apps/client && pnpm dev`) with a Chrome tab open on
`/test-level`. Leave the tab alone if it is there — closing it closes the window, and it is the one
reusable driving surface. Re-check `document.visibilityState` before trusting any screenshot from it.

### Rebase exposure onto monoliths' shared-sim work: none

`monoliths` warned that its drag removal deletes `SimConfig.dragSpeedFrac`, `DRAG_SPEED_FRAC`,
`Block.lethal` and `overlapsBlock`'s `lethal` parameter, and that test fixtures constructing any of those
break on rebase. **Checked: this branch references none of them.** `rail-bounce.test.ts` calls
`simulate( s, input, dt, tuning )` with no `track`, so it takes the `resolveFlatFloor` path and never
builds a `Block` or a `SimConfig`. The only overlap with that session is textual adjacency inside
`step.ts` — its deletion sits just above the `clampToEdges` call site, this change is inside the function
body below it.

`monoliths` is explicitly **not** committing: its blocks work cannot be staged alone, because
`tunables.ts` and `track-materials.ts` each carry two sessions' edits in the main checkout and
`track-blocks.tsx` would reference knobs that aren't there. It will say so before it pushes. So this
branch can land first without waiting.

### Next steps, in order

1. **Two owner decisions are open** and are written up above — the hull-roughness conflict with the M6
   band (§OPEN), and the rail bounce contradicting the GDD's *"walls stop+slide"* LIVE line. Neither was
   resolved unilaterally. The hull one is a one-number change if taken: `ship.hullRoughness` default
   1 → 0.75 in `dev/tunables.ts`.
2. **Commit** once the owner says so, then open the issue/PR that `CONTRIBUTING.md` expects. The
   mechanism weighing for banking is in §"Mechanism — the five candidates" and belongs in the PR body,
   per non-negotiable #13 — it must not go into the source, per #14.
3. **Follow-ups deliberately not done**, none blocking: remote ships derive pitch from interpolated `y`
   rather than a real `vy`, and their engine glow sits at cruise because the interp snapshot carries no
   forward speed. Both need a wider `Snapshot`, which is netcode scope, not ship art.
4. The four placeholder `.gltf` ships still load and still have their single `Texture` material. They are
   unreachable by default now but `SHIP_ORDER` keys 1–4 on `/test-level` still select them.

## PENDING — the rebase and merge (next session picks this up)

All four commits are in and the worktree is clean. **One task remains: rebase `feat/ship-feel` onto
`feat/test-level` and merge it in.** It is blocked on `slur-supervisor`'s go and must not start before
it arrives — the shared branch is mid-landing.

Landing order agreed with `slur-supervisor`: `monoliths` commits, then `slur-supervisor`, **then** this
rebase + merge. One rebase here beats two on their side.

State at handover: `feat/test-level` HEAD was `6353169`. `asteroids` has landed (`adfd749` + `6353169`,
placement only — tested dead code, nothing mounts it). `monoliths` is the last blocker; its block work
and the whole `packages/shared` slow-block removal are **staged but not committed** in the shared index.

### Expect real conflicts in exactly three files

Verified by diffing the changed-file sets — against `feat/test-level` as of `6353169` there is **zero**
overlap, but that is only because the two overlapping sessions have not committed yet. After they do:

- `packages/shared/src/sim/step.ts` — `monoliths` deletes the drag branch immediately *above* the
  `clampToEdges` call site; this branch edits the *inside* of `clampToEdges` below it. Adjacent, not
  semantically overlapping. Keep both: their deletion **and** the `vx` reflection.
- `packages/shared/src/constants.ts` — they delete `DRAG_SPEED_FRAC` and the `SLOW_*` block; this branch
  adds `railBounce` to `FlightTuning` and `DEFAULT_TUNING`. Disjoint hunks. Keep both.
- `apps/client/app/dev/tunables.ts` — **append-only, never a wholesale rewrite.** It carries three or
  four sessions' knob groups. Keep every group: this branch's `Ship bank` and `Ship light`,
  `slur-supervisor`'s `seam.emissive`, `monoliths`' `Blocks` + `Level`, `asteroids`' `rock.*`.

This branch references none of the symbols `monoliths` removed — no `SimConfig`, `dragSpeedFrac`,
`DRAG_SPEED_FRAC`, `overlapsBlock` or `Block.lethal` — checked by grep. `rail-bounce.test.ts` calls
`simulate()` with no `track`, so it takes the `resolveFlatFloor` path and builds no `Block` or
`SimConfig` fixture. So the conflicts should be textual only.

`slur-supervisor` offered to arbitrate rather than have anyone guess at another session's intent: **ask
it if a hunk is not obviously resolvable.**

After the rebase: `pnpm typecheck`, `pnpm test`, `pnpm lint` before merging. Do **not** push or open the
PR — `slur-supervisor` does that.

### Careful: the shared checkout's git index is not session-local

`/Users/apple/Projects/personal/slur/.git/index` is shared by every session in that checkout, so a
`git add` there is visible to all of them and can stage someone else's work. This worktree has its own
index and is insulated. Stage by explicit path if you ever work in the shared checkout.
