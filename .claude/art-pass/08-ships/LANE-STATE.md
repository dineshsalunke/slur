# LANE STATE — Split Crown (#159) — written by the supervisor, 2026-09-20

**Your context was cleared at the hard stop. This file and `LANE-FACTS.md` are the whole of what you
need.** Everything below is verified, not remembered.

## Where the work is

| | |
|---|---|
| branch | `art/split-crown`, pushed, **nothing unpushed**, tree clean |
| HEAD | `2af6acb` docs(lane): the origin-to-keel measurement for all five ships |
| PR | **#165**, open against `dev`, closes #159 |
| gate | green on all five at `411fda3` (typecheck · lint · `--filter @slur/shared` 78 pass · `-r test` client 74 / server 4 · build). `2af6acb` is docs-only, `pnpm lint` re-run clean |
| stack | ports 5200 / 2600 |

Commits: `7a551c6` ship + team-wash removal · `04820db` drained-command ship picker · `411fda3` the bloom
fix · `2af6acb` the keel measurement.

## What is DONE and must not be re-litigated

- **Facing is settled and eye-confirmed.** `Engine_core` meshes sit in an 8mm slab at z = 2.991..2.999,
  mean centroid **+2.995**, flush against the +Z end — stern is **+Z**, nose is **−Z**, facing
  `[0, Math.PI, 0]`.
- **The LFS guard needed nothing.** `isLfsPointer` already branches on `ArrayBuffer` and compares the
  first 23 bytes (`gltf-lfs-guard.ts:28-36`); tests already cover pointer-as-bytes and the `.glb` magic.
  **The brief's predicted two-line decode fix was not applicable.** No change was made and none is wanted.
- **The bloom crash is fixed** (`411fda3`, its own standalone commit). `@react-three/postprocessing` 3.0.4
  memoises constructor args on `JSON.stringify( props )`; React 19 passes `ref` as an ordinary prop; the
  ref holds R3F's circular `__r3f`. Built once via lazy `useState`. **Filed retroactively as #166**, which
  is cross-referenced on the PR.
- **The ship picker is approved scope**, and reverting the prop-drilled version for the drained
  `labCommands.setShip` one-shot was the right call.
- `CREDITS.md` narrowed to the four placeholders — correct. GDD and `ART_SCALE_REFERENCE` Freighter rows
  took the new id. `CLAUDE.md`'s status log and the phase notes stay as history.

## THE ONE OPEN THING — the ship IS sunk, and it is NOT the asset

**The owner confirmed the `shipBox` debug AABB was OFF in the frame where the hull reads half-buried in
the deck.** So the occlusion explanation — the one you and I both found plausible, and which you hit
yourself this session — **is ruled out.** It stays in `LANE-FACTS` as a real trap; it is just not this bug.

Your measurement stands and is what makes the next step obvious. World-space bbox per ship, composing
every node's TRS, `keelAfterLift = nativeMinY × scale + lift`:

| ship | nativeMinY | scale | lift | keel |
|---|---|---|---|---|
| executioner | −0.7748 | 0.1996 | 0.154 | −0.0006 |
| challenger | −0.8215 | 0.2476 | 0.203 | −0.0004 |
| bob | −0.8742 | 0.2095 | 0.182 | −0.0011 |
| dispatcher | −1.4219 | 0.4898 | 0.696 | −0.0005 |
| **split-crown** | **−0.0000** | **1.0** | **0** | **−0.0000** |

**The convention is keel-at-the-render-group's-origin and all five satisfy it.** The four placeholders'
origins are not centred; their lift is precisely what keels them. `syncRenderSystem`
(`apps/client/app/game/ecs/systems.ts:24`) writes `grp.position.y = s.y` and `ShipModel` places the clone
at `[0, v.lift, 0]` inside that group, so a grounded hull's keel is at world `y = s.y = 0` for every ship.

Ruled out by you: **(a)** node-local vs scene-graph bbox disagreeing — split-crown's 7 nodes are all
identity. **(b)** the renderer seating the CENTRE at a hover height — it seats the keel at the origin.

**Not ruled out, and now the whole task: (c) the deck's top surface is not at the Y the rig assumes.**
`[unmeasured]` — you hit the stop before taking it.

**Your own hypothesis, which the owner's answer promotes:** split-crown is the only **flat-bottomed** hull
— its entire underside is at exactly y=0, whereas the four placeholders' lowest points are narrow gear and
fins. A small deck offset would be invisible on them and glaring on this one. **That is a hypothesis, not
a measurement.**

**If the deck top sits above 0, this is a rig/deck fact affecting ALL FIVE ships, not a Split Crown asset
fault — and the fix is NOT nudging one ship's lift.** Do not add an offset to make one hull look level.
Do not touch footprint or scale; the footprint is a gameplay quantity under GDD §0's ship-size contract.

## Not yours, and not to be prepared for

**#167 — speed-proportional hover** is filed in Backlog and is explicitly out of scope. No hover constant,
no offset, nothing "ready for it". Your job is to make the resting position measurable and correct; a
render-only hover composes on top of it later. Y ownership stays as it is: the sim owns `s.y`, the
renderer adds only the static per-model lift.

## For the owner's eye, not yours to change

The hull reads mid-grey on screen rather than the near-black its baseColorFactors (0.007–0.017 linear)
suggest — the cold key plus the rail emitters. Called out in the PR body as an open art call with the
numbers. Leave it.

## Next action, and only this

**Measure the deck's top surface world-Y, and compare it to a grounded ship's `s.y`.** First-hand, from
the running stack or the source — not recalled. Report the two numbers and the difference. If they differ,
say so and stop; the fix is a separate decision and it is mine to route, because it touches all five ships.
