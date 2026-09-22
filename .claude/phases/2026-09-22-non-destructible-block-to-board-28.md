# The non-destructible block reaches the track

Branch `feat/test-level`. Owner: *"now that we have worked on a lot of materials for monoliths and deck,
it would be good if work on non-destructible block"*, then *"look at the
`docs/art-direction/ingredients/blocks/non-destructible/surface-details.png` and keep on referring to it"*.

## The finding that set the scope

The block art was **already in the repo and mounted nowhere**.

`dde1eee` *"art(blocks): the sealed deadly block — chamfer, vertical marigold seams, wear at clean"* built
`sealed-block.tsx` + shader/geometry/variation/material with three test files. Its only mount was
`/art-lab`, deleted 2026-09-21 in `d35d146`. `rg SealedBlock` outside those files returned nothing.

What the track actually drew — `track-blocks.tsx:70-76` — was a scaled unit `boxGeometry` with
`LETHAL_SURFACE` (`track-materials.ts:56`, `emissive: '#ff2740'`): a red box. The backlog agreed
(`.claude/backlog.md:44`): *"Blocks render as two placeholder families — `LETHAL_SURFACE` pink,
`DRAG_SURFACE` white (`track-blocks.tsx`) — which the block-art item replaces."*

So this was a wiring job, not an authoring job.

## Owner decisions taken this session

- **Colour: board 28 as drawn.** Black coating, marigold seams, no red — the hazard-readability argument
  for red was put and declined.
- **Scope: lethal blocks only.** The drag/slow family keeps its pulsing amber box.
- **`/test-level` default: blocks on.** `level.blockDensity` ships at 0.6, not the route's old hard-coded 0.

## The mechanism (CLAUDE.md #13)

`SealedBlock` was one mesh per block with per-block geometry and per-block uniforms. Blocks stream through
a 160-instance window every frame, so per-block React meshes are out (#4). Weighed:

| Option | Verdict |
|---|---|
| Per-block `<SealedBlock>` meshes | rejected — React churn every frame as the window slides |
| One InstancedMesh, unit chamfered box, matrix-scaled | rejected — bevel scales with the box (0.12u on z, 0.54u on x at 12u wide) and one uniform set gives every block identical seams, killing board 28's *"variable seam positions and count"* |
| One InstancedMesh per width bucket (4/8/12u) | rejected — correct bevel, but hard-codes today's widths against CLAUDE.md #11 *"blocks may be any size"*, and still needs per-instance seam data anyway |
| Everything derived in-shader from the instance matrix | rejected — zero CPU plumbing, but `sealedBlockSeams()`'s corner-keepout logic would be rewritten in GLSL and diverge from its tests |
| **One InstancedMesh + 2 instanced attributes + vertex-shader bevel** | **chosen** |

The winner needed **no new geometry code**. `sealedBlockGeometry(SEALED_BLOCK_UNIT_DIMS, 0.2)` gives a unit
chamfered box whose face coordinates sit at exactly ±0.5 and inset coordinates at ±0.3, so the inset mask is
recoverable from `position` with one `step()` — no extra vertex attribute. Each inset axis is then pulled in
by `bevel / instanceScale`, making the world-space chamfer a constant 0.12u at any block size. The inset
rectangle comes from the instance matrix columns as a varying, so `uSealedInset` disappeared entirely.

Only the seeded variation rides as attributes — `aSealedSeams` (vec4) and `aSealedVariation` (count, wear) —
written in the existing `emitBlocks` loop from a seed-keyed module cache, so `sealedBlockSeams()` runs once
per block rather than 160×60 times a second and stays the tested source of truth.

Because `sealed-block.tsx` was deleted, the shader lost its non-instanced path: **one code path, not two.**

Accepted cost: three transforms instance normals without an inverse-transpose, so chamfer-strip normals skew
under non-uniform scale. On a 0.12u strip it is invisible; the six faces are axis-aligned and exact.

## As built

- `track-blocks.tsx` — `emitBlocks` split into `emitSealed` / `emitDrag`; lethal mesh carries the unit
  geometry, the two instanced attributes and the patched material. Knobs applied in the existing `useFrame`.
- `sealed-block-shader.ts` — instancing-only. Bevel correction and the per-block varyings in `VERT_BODY`;
  fragment reads varyings where it read uniforms. `uSealedWearOrigin` dropped (world position already varies
  per block). Seam colour split into `uSealedSeamColor` × `uSealedSeamIntensity` so a knob can drive it.
- `sealed-block-geometry.ts` — `SEALED_BLOCK_UNIT_BEVEL = 0.2`, `SEALED_BLOCK_UNIT_DIMS`.
- `sealed-block-variation.ts` — `sealedBlockWearSeed()`, 40% of blocks clean, rest ramping to 1.
- `test-level-canvas.tsx` — track resolved from the level knobs via `useRebuildToken()`, so changing density
  rebuilds without a reload.
- **Deleted:** `sealed-block.tsx`, and `LETHAL_SURFACE` with it.
- **Panel:** `Blocks` group (chamfer, seam width, seam emissive, wear strength, coating roughness) and
  `Level` group (block density, gap chance).

`block.seam` defaults to **6**, not the authored `MARIGOLD_REFERENCE_INTENSITY` of 2.0: at 2.0 the accent
`#F59A24` has linear luminance × intensity of 0.85, under the `bloom.threshold` of 1.0, so the seams would
not have glowed the way board 28 draws them. 6 puts them at 2.56, the same place the rim cords sit.

Two tests added (136 client, up 2): wear seeding spans clean→worn the way the board's three panels do; and
the unit shell's vertices sit **only** at ±0.5 or the inset — which proves both that the silhouette cannot
exceed the collision AABB (the backlog's explicit constraint) and that the `step()` threshold the bevel
correction rests on separates face from inset cleanly.

## Verified live

Driven at `/test-level` through the Chrome extension. The shader **compiles** — no `THREE.WebGLProgram`
error in the console. Up close the blocks match board 28: black coating, one thin marigold cord running the
full height and stopping short of the top face (*"no top-face luminous returns"* holds), visible chamfer,
seam position and count differing block to block.

**The live pass ran at `tone.exposure` 2 — the owner's dialled value, not the spec default of 1.** So every
screenshot behind the judgements below is a brighter frame than a fresh store produces. `slur-supervisor`
found (and flagged to the owner) that at spec defaults **nothing marigold blooms at all**: the rail at
`rail.emissive` 2 computes to 0.856 against `bloom.threshold` 1. `block.seam` at 6 clears the knee either
way — `#F59A24` luminance ≈ 0.428 × 6 = 2.56 — so the block seams are safe, but anyone re-judging these
blocks from an empty `localStorage` will be looking at a frame where the rails around them do not bloom.

### Two findings from the live pass

**1. `gapChance: 1` suppresses blocks.** GDD §5.5: *"Jump is gaps-only; blocks are strafe-or-destroy — the
two never overlap."* The route's existing `gapChance: 1` turns every segment into a gap, so at first almost
no blocks appeared. `level.gapChance` now exists as a knob; it still **ships at 1**, matching the route's
prior behaviour, so anyone looking at blocks must turn it down. Consider changing the default.

**2. Near blocks wash out pale grey under the camera fill.** A/B: at `fill.point` 25.6 (owner's dialled
value) the near blocks read as pale grey slabs, not black coating; at `fill.point` 0 they are black with
bright cords, exactly the board. The deck escapes this because it is `metalness` 1 — metal has no diffuse —
while `SEALED_BLOCK_METALNESS` is 0, so the block takes the full fill as diffuse. Not a bug in this change;
an interaction between Codex's authored block material and the owner's fill. **Open for the owner.**

## Late in session: slow blocks removed, and the wear rewritten

Owner, mid-turn: *"we dont want to the slow blocks. we are not working on those please remove it."* and
*"also the material treatment doesn't seem to be correct, blocks are looking more like solid black"*.

### Slow blocks are gone from the sim, not just the renderer

Removing only the render path would have left **invisible blocks that still slow the ship** — the generator
really does emit them (`slowGrace( intensity ) * density.blocks`). So the removal went to the source:

- `track.ts` — `laneState` returns `0 | 1`, the slow branch and `slowP` parameter gone; `SALT_DRAG`,
  `slowGrace()` and the `SLOW_*` constants deleted. **`Block.lethal` removed entirely** — with one family
  left the flag was always `true`.
- `step.ts` — `overlapsBlock` lost its `lethal` parameter, and the whole drag branch
  (`cfg.dragSpeedFrac * t.maxCruise` speed cap) is gone. `DRAG_SPEED_FRAC` and `SimConfig.dragSpeedFrac`
  deleted with it.
- `track-blocks.tsx` — the second `instancedMesh`, `emitDrag`, and the pulse in `useFrame` removed. One mesh
  now, so the component returns a single root and no longer needs `Fragment`.
- `track-materials.ts` — `DRAG_SURFACE`, `DRAG_OPACITY_MIN/MAX`, `DRAG_PULSE_SPEED` deleted.
- Tests updated: the drag test in `step.test.ts` deleted; `track.test.ts`'s *"both lethal walls and passable
  drag blocks"* became *"walls are generated"*, and the per-kind instance-budget test became a single count.

**This is a gameplay change, not an art one** — GDD §5.7 and ADR-009's *breakable block* line still describe
the family. Those docs were **not** updated; do that before merge.

### The wear was inverted

`SEALED_BLOCK_WEAR_VALUE = 0.62` multiplied into diffuse, i.e. it **darkened** a base colour of `#0d1117`
that is already near-black — which is exactly why the owner saw "solid black". Board 28's wear patches read
as **lighter** grey mottling against the coating. Replaced with a mix toward a colour:

- `SEALED_BLOCK_WEAR_COLOR = '#2c3138'` (was `SEALED_BLOCK_WEAR_VALUE = 0.62`)
- `SEALED_BLOCK_WEAR_ROUGHNESS` 0.08 → 0.3
- shader: `diffuseColor.rgb *= mix( 1.0, tone, wear )` → `mix( diffuseColor.rgb, uSealedWearColor, wear )`;
  `uSealedWearTone` split into `uSealedWearColor` + `uSealedWearRoughness`.

**This is a departure from Codex's authored value and still owes an `ART_MATERIALS.md` §7 entry.** It is
also **not yet seen on screen** — it was written after the last live pass. Look at it before believing it.

## Superseded — the original wear finding

`block.wear` at **1.0** with `block.seam` at 0 renders **flat black faces, no mottling at all**. The knobs
are live (seam 0 removed the cords), so the attribute plumbing works; the wear is simply invisible.

Cause (inferred, not yet proven): `SEALED_BLOCK_WEAR_VALUE = 0.62` is a **multiplier** on diffuse, and the
base colour `#0d1117` is already near-black. Multiplying near-black by 0.62 is imperceptible, and the
roughness bump of `+0.08` cannot carry a patch on its own. Board 28's wear patches read as **lighter** grey
mottling against the black coating — so the wear wants to lighten and roughen, not darken.

`SEALED_BLOCK_WEAR_VALUE` is Codex's authored value. Changing it is a departure needing an
`ART_MATERIALS.md` §7 decisions-and-departures entry, **not a silent edit**. Left for the owner.

## Instanced attribute uploads — verified, and worth folding into `conventions/r3f.md`

Raised as a recalled claim when the `asteroids` session asked whether the per-frame refill scales; **that
session then verified it against the installed `three@0.185.1`** and reported file:line. Recorded here
because it is a stack fact nobody should re-derive, and because it is **not** currently in
`conventions/r3f.md` — it belongs there.

- **`needsUpdate` uploads the WHOLE backing array, not `count`.**
  `src/renderers/webgl/WebGLAttributes.js:87-90` — with `attribute.updateRanges.length === 0` it calls
  `gl.bufferSubData( bufferType, 0, array )`. Per-frame upload cost therefore scales with the mesh's
  **LIMIT**, not with how many instances are actually visible.
- **The escape hatch exists on `BufferAttribute`** (so it covers `instanceMatrix` and
  `InstancedBufferAttribute` alike): `addUpdateRange( start, count )` at `src/core/BufferAttribute.js:181`,
  `clearUpdateRanges()` at `:190`. With a refill that writes contiguously from 0, one
  `addUpdateRange( 0, count * 16 )` per frame covers the matrices.

**No change made to `track-blocks.tsx`.** At `BLOCK_LIMIT` 160 the full-array upload is ~10KB of matrices a
frame; ranging it would be noise. This matters for a mesh sized in the thousands, not this one.

A second, cheaper lever nobody has implemented: the refill re-emits every visible instance every frame, but
`i0`/`i1` are `Math.floor( z / SEG_LEN )` and with `SEG_LEN` 20 (`track.ts:117`) against `maxCruise` 55
(`constants.ts:69`) they advance **2.75 times a second, not 60**. Caching the last `(i0, i1)` and skipping
an unchanged refill drops ~95% of the work. **Untested.** The catch: anything that must vary per frame
rather than per segment cannot then ride the instance matrices — it goes in the shader off a time uniform.

Also unexamined: `put()` returns the same index at the limit and `emitSealed` breaks on it, so when content
exceeds `BLOCK_LIMIT` whatever iterates **last** is silently dropped. For blocks that is the far end of the
window, which is the right failure direction — but it is incidental to iteration order, not chosen.

## NOT COMMITTED — read this first

The tree is **dirty and shared**. A parallel agent is working in it right now on the inboard deck seams:
`emitter-array.ts`, `seam-inserts.ts` + test, `track-seams.tsx`, `track-geometry.ts`, `track-rail*`,
`track-rails.ts`, `track-view.tsx`, `docs/ART_SCALE_REFERENCE.md` and
`.claude/phases/2026-09-22-rail-light-diagnosis-and-the-deck-seams.md` are all theirs.

**Two files carry both sessions' work:**
- `tunables.ts` — mine: `Blocks` + `Level` groups. Theirs: `seam.emissive`.
- `track-materials.ts` — mine: `LETHAL_SURFACE` removed. Theirs: `SEAM_SURFACE`.

So this change **cannot be committed on its own**: staging only my files leaves `track-blocks.tsx` without
the `tunables.ts` entries it calls and breaks the build. Either commit both sessions together once theirs is
finished, or land them from separate worktrees next time — this is exactly the collision CLAUDE.md's
worktree section exists for.

`pnpm typecheck` · `pnpm test` (136 client, 4 server, shared) · `pnpm lint` all **green** at 7 warnings,
the same set as before, comment ratchet clean.

## Browser state restored

The owner and the agent share one `localStorage`. `fill.point` was taken to 0 for the A/B and **restored to
25.6**; every `block.*` and `level.*` key this session wrote was **deleted**, so the new knobs fall back to
their spec defaults. Nothing else of the owner's dialled set was touched — `level.*` were new keys that had
never been in storage.

## HANDOVER — safe to `/clear` from here

0. **Look at the rewritten wear on screen.** It was written after the last live pass and has never been
   seen. `block.wear` drives it; board 28's WORN / STRONGER WEAR panels are the target.
1. **Resolve the shared tree** with the parallel sessions before committing anything. **Three** sessions are
   in this checkout: this one (blocks), `slur-supervisor` (rail lighting + deck seams) and `asteroids`
   (asteroid field, starting). All three append to `tunables.ts`. Both peers have been told what this
   session holds and that `Block.lethal` is gone.
2. **Update GDD §5.7 and ADR-009** for the slow-block removal before merge — the docs still describe the
   family that no longer exists.
2. **The wear** — decide whether `SEALED_BLOCK_WEAR_VALUE` lightens instead of darkens, and write the
   `ART_MATERIALS.md` §7 entry if it changes.
3. **`fill.point` vs the block coating** — owner's call: lower the fill, raise block metalness, or accept
   the pale near-block.
4. **`level.gapChance` default** — 1 means no blocks; probably wants to be lower now.
5. Carried forward untouched from the previous handover: `BOUNDARY_W` vs the reference's ~0.2–0.3u cord,
   `ART_MATERIALS.md` §7 entries, `perf.dpr`, the fog revert in `game-environment.tsx`, and the open
   question of whether `lethal`/`drag` hazard blocks should bloom.

---

# Addendum — written at the landing, after the note above

Everything above this line predates the landing attempt. Three things in it are now stale; this
section corrects them and records what happened after.

## The wear, in its final state — and it is still unseen

The note above ends with `SEALED_BLOCK_WEAR_VALUE = 0.62` as a live finding and the rewrite as a
late change. Current state, two rewrites deep:

1. **Mine.** `SEALED_BLOCK_WEAR_VALUE = 0.62` (a multiplier that *darkened* a near-black `#0d1117`
   coating, which is why the owner saw "solid black") became `SEALED_BLOCK_WEAR_COLOR = '#2c3138'`,
   a mix *toward* a lighter grey, with `SEALED_BLOCK_WEAR_ROUGHNESS` 0.08 → 0.3. Shader:
   `diffuseColor.rgb *= mix( 1.0, tone, wear )` → `mix( diffuseColor.rgb, uSealedWearColor, wear )`.
2. **`slur-supervisor`'s, on top of mine.** The lightening direction was right but the character
   was wrong — soft blurry blobs where board 28 draws broad patches with hard crinkly edges and
   fine granular speckle. `grain: 9` added to `SealedBlockWear` / `SEALED_BLOCK_WEAR`;
   `uSealedWear` vec3 → vec4 to carry it; `sealedWearPatch()` now perturbs the mask with a 3.7×
   octave for the edges and modulates amount inside the patch with a 9× octave for the speckle.

**Neither rewrite has ever been seen on screen.** Mine was written after my last live pass; theirs
after theirs, and the Chrome window went behind before a close-up was possible. Typecheck and the
full test suite pass over both. That is the entire evidence. **Look at this first.**

Both are departures from Codex's authored values and both still owe one `ART_MATERIALS.md` §7
decisions-and-departures entry. Unclaimed.

## The missing seam glow was not code

Owner reported the blocks reading "solid black, no texture and no glow seam". `slur-supervisor`
diagnosed it live: `block.seam` was sitting at **0** in the owner's `localStorage` — a leftover
from my own wear A/B that I never restored. Set back to 6, the cords return and match board 28.

Two lessons, and the second is mine to own: a knob left at an A/B value reads exactly like a code
regression, and **I failed to restore what I changed**. The existing memory `shared-tunables-storage`
says back the store up before writing it. It needs the other half: restore every key you move, in
the same turn you move it.

## Corrected branch state

- **HEAD is `0ae023f`.** `asteroids` landed `adfd749` + `0ae023f` (placement only, dead code,
  nothing mounts it).
- **Do not cite `6353169`.** It was `asteroids`' bad commit that swallowed the shared index; it was
  reverted and is reflog-only, not on the branch.
- `controls` is at `01947c2` on `feat/ship-feel` in a worktree — `clampToEdges` reflects `vx`
  instead of zeroing it, behind a new `railBounce` field on `FlightTuning` (default 0.35; 0
  reproduces the old behaviour, and that equivalence is a test). It also moved `DEFAULT_SHIP`
  'challenger' → 'split-crown'. That session is out of context and **cannot rebase itself** — a
  fresh session picks it up from its phase note. Verified with it: nothing on its branch touches
  `SimConfig`, `overlapsBlock`, `Block` fixtures or the drag symbols this session deleted, so the
  rebase is a textual adjacency in `step.ts` at worst.

## This work is committed only if the owner approved it

**`git commit` was denied by the auto-mode classifier in THIS session, twice.** The files are staged
and green but uncommitted as this note is written.

**Do not read this as "auto mode blocks `git commit`."** That lesson is too broad and would mislead
you. `slur-supervisor` ran the same command shape — `git commit -F <msgfile> -- <explicit paths>` —
from the same checkout, in auto mode, and it was **allowed**: `c4048b2` landed. The accurate
statement is that it blocked *this session*, repeatably, and the command form was irrelevant: a
bare heredoc message and an explicit-pathspec form drew a byte-identical refusal.

The other thing worth knowing: **no prompt appears.** It is the classifier refusing outright, not
the interactive permission dialog, so "retry and I'll approve it" is not a workable plan — there is
nothing to approve. The routes out are the owner running the commit in their own pane, the owner
adding a Bash permission rule themselves, or a permission-mode change.

`slur-supervisor` twice offered to commit them on my behalf. **Declined both times.** A peer running
an action my own permission settings blocked routes around the owner's decision — it is permission
laundering whatever the intent, and it is not mine to hand over. It was surfaced to the owner as the
thing blocking the landing. If these files are in git history, the owner released them; nobody
worked around anything.

## The shared index — the real lesson of the day

Four sessions in one checkout share **one `.git/index`**. `git add` is not session-local: files one
session stages appear staged to every other session, and a bare `git commit` sweeps up the lot.
That is exactly how `asteroids` swallowed 27 files in `6353169`, and `slur-supervisor` nearly
committed my set under its own message before stopping to ask.

- **Always `git commit -m "…" -- <explicit pathspecs>`.** Never a bare `git commit`, never
  `git add … && git commit`.
- At the time of writing the index holds **27** files: **17 mine**, 10 `slur-supervisor`'s. Anyone
  reading "your 27 staged files" in a peer message should not believe it — check
  `git diff --cached --name-only` against the file table above.
- `tunables.ts` and `track-materials.ts` cannot be split by path **at all**, because both sessions'
  edits interleave inside them. Omitting either breaks typecheck for *both* sides — `num()` is keyed
  on `keyof typeof NUMBER_SPECS` (`dev/tunables.ts:143,240`). One session has to carry the other's
  hunks and say so in the message. Mine does.
- **`controls` was the only session that took a worktree, and it is the only one with no collision.**
  That is the case for CLAUDE.md's worktree section, made the expensive way.

## Still open, and now unclaimed

1. **Look at the wear on screen.** Nobody has. Board 28's WORN / STRONGER WEAR panels are the target.
2. **GDD §5.7 and ADR-009 still describe the removed slow/drag family.** Confirmed with
   `slur-supervisor`: **nobody has taken this.** It is a live doc/code divergence going into the merge.
3. **The `ART_MATERIALS.md` §7 entry** for the wear colour and the grain. Also unclaimed.
4. **`fill.point` 25.6 vs the block coating** — `SEALED_BLOCK_METALNESS` is 0, so the block takes the
   fill as full diffuse and washes pale grey; the deck escapes at metalness 1. Owner's call: lower
   the fill, raise the metalness, or accept it.
5. **`level.gapChance` still ships at 1**, which means no blocks appear. Probably wants lowering.
6. **`tone.exposure` 1 vs `bloom.threshold` 1** — at spec defaults nothing marigold blooms, rail
   included. `block.seam` at 6 clears the knee either way. One of those two numbers is wrong.
