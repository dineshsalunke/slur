# The landing stalled on a permission denial, and four sessions share one index

Branch `feat/test-level`. Picks up `2026-09-22-rail-light-diagnosis-and-the-deck-seams.md` and
`2026-09-22-non-destructible-block-to-board-28.md`. Owner opened with *"pick up the handover and let me
know what is next"*, then reported *"i saw the blocks and they all seem to be solid black, so texture and
no glow seam"*, then *"inform everyone to commit their work, once all have commited their code push the
branch, raise a PR to dev and merge it"*, then *"once each agent is done committing its code go ahead and
exit them and close their herder panes"*.

## The blocks were two separate faults, and only one was code

### The missing glow was never a bug

`block.seam` was sitting at **0** in the owner's `localStorage['slur.tunables']` — the leftover from the
previous session's own wear A/B, never restored. At 0 the shader adds nothing to `totalEmissiveRadiance`,
so the blocks render as bare `#0d1117` coating. Set back to the spec default of **6**; the cords returned
and match board 28.

Ruled out along the way, so nobody re-chases it: **no `THREE.WebGLProgram` error on a clean reload**, so
the patched shader compiles. `transformNormalByInverseViewMatrix` is real —
verified-this-session at `node_modules/.pnpm/three@0.185.1/node_modules/three/src/renderers/shaders/ShaderChunk/common.glsl.js:69`,
`vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix )`.

### The wear is real, and it is the wrong shape

A/B at `/test-level`: at `fill.point` **0** the block face is flat near-black; at **25.6** the wear patches
appear — as **soft blurry blobs**. `docs/art-direction/ingredients/blocks/non-destructible/surface-details.png`
(board 28) draws something else: broad patches with **hard, crinkly, lichen-like edges filled with fine
granular speckle**, captioned *"Broad wear patches / intact silhouette"*.

So the previous session's rewrite got the **direction** right — lighten toward `#2c3138` rather than darken
`#0d1117` by 0.62 — and the **character** wrong. One octave of smooth value noise cannot draw that.

**Changed:**

| File | Change |
|---|---|
| `sealed-block-variation.ts` | `grain: 9` added to `SealedBlockWear` and `SEALED_BLOCK_WEAR` |
| `sealed-block-shader.ts` | `uSealedWear` `vec3` → `vec4` (carries grain); `sealedWearPatch()` rewritten |

`sealedWearPatch()` now perturbs the mask with a 3.7× octave before thresholding (crinkled edges), tightens
`edge` from `mix(0.30,0.02,…)` to `mix(0.16,0.01,…)`, and modulates amount inside the patch with a 9×
octave (`mix(0.4, 1.0, grain)`) for speckle.

**NOT SEEN ON SCREEN.** The Chrome window went behind before a close-up and the tab has since closed. This
rests on arithmetic and the reference, nothing else. `monoliths` independently flags the same thing: *"the
block wear has never been seen on screen by anyone"* — it rewrote it after its last live pass, this session
rewrote it again, neither looked. **If this merges tonight, unlooked-at art merges with it.**

### The third fault is neither — it is lighting, and it is the owner's

`SEALED_BLOCK_METALNESS` is **0**, so the block takes the full camera fill as diffuse. At `fill.point` 0 it
is pure black and **no surface treatment of any kind can show**; at 25.6 it washes pale grey. Board 28 has
them clearly lit and still black-coated, which is neither. Three ways out — lower the fill, raise block
metalness, accept the pale near-block. Confirmed by `monoliths`. **Owner's call, unmade.**

## THE LANDING IS BLOCKED — read this before doing anything

`monoliths` **cannot commit**: its permission classifier denied `git commit`. It correctly declined to let
this session commit for it —

> *"A peer running an action my own permission settings blocked is permission laundering regardless of
> intent, so it's not mine to hand over."*

That is right and this session did not argue it. **The owner has to either approve `monoliths`' commit in
its own pane, or tell this session to take it.** It cannot be settled between agents.

**27 files are staged in the shared index and verified intact** (`git diff --cached --name-only`), covering
BOTH this session's rail/seam set and `monoliths`' block + shared-sim set. `tunables.ts` and
`track-materials.ts` each hold both sessions' work and cannot be split.

### Four sessions share ONE `.git/index`

`git add` in `/Users/apple/Projects/personal/slur` is **not session-local**. `asteroids` hit this live: its
`git add <file> && git commit -m` swallowed all 27 of another session's staged files into a docs commit
(*"28 files changed"*). It caught it, `git reset --soft HEAD~1`, and re-committed with the pathspec form as
`0ae023f`. No working-tree content was touched and nothing was lost. **The bad commit is reflog-only and is
NOT reachable from the branch** — `git merge-base --is-ancestor` returns false. Do not cite it anywhere.

**Use `git commit -m "…" -- <paths>`, never `git add … && git commit -m …`.** The pathspec form ignores the
rest of the index. Saved as repo memory: `.claude/memory/shared-checkout-shares-one-git-index.md`.

## Session ledger

| Session | State | Owns |
|---|---|---|
| `slur-supervisor` | this note; rail/seam + wear-grain **staged, uncommitted** | `emitter-array.ts`, `track-geometry.ts`, `track-rail.tsx` + test, `track-rails.ts`, `track-view.tsx`, `seam-inserts.ts` + test, `track-seams.tsx`, `ART_SCALE_REFERENCE.md` |
| `asteroids` | **done, committed, asked to exit** | `adfd749` + `0ae023f` |
| `monoliths` | **BLOCKED on permission denial**, staged | blocks + all of `packages/shared` |
| `controls` | committed on its own branch, waiting on my go | `feat/ship-feel` in `../slur-worktrees/ship-feel` |

`asteroids` — `adfd749` asteroid placement (3 files) + `0ae023f` its phase note. **Placement half only: no
geometry, no renderer, nothing mounts it.** Tested dead code. *No asteroids are visible after this merge* —
say so to the owner rather than letting the merge imply the feature shipped.

`controls` — **5 commits at `01947c2`**, 18 files, branch based on `dcc3149` which is still an ancestor;
clean, tests and lint green, nothing pushed, `feat/test-level` untouched. Agreed sequence: **`monoliths`
commits → this session commits → the ship-feel branch rebases and merges in.**

**`controls` cannot do that rebase — it is out of context and stopped rather than start one.** That was the
right call: half-resolved conflicts in `step.ts` plus a wholesale-rewritten `tunables.ts` is the exact
damage everyone spent the day avoiding. It wrote the full brief instead, committed at `01947c2` in
`.claude/phases/2026-09-22-ship-bank-engine-light-and-rail-bounce.md` under **"PENDING — the rebase and
merge"**: the landing order, the three conflict sites and how each resolves (`step.ts` adjacent not
overlapping, keep both · `constants.ts` disjoint hunks, keep both · `tunables.ts` APPEND-ONLY, keep all four
sessions' knob groups), and the grep confirming its branch references none of the symbols `monoliths`
removes. **A fresh session does the rebase from that note.**

Gates green at the time of writing: **typecheck clean · 144 client tests · 4 server · shared passing.**

## Owner decisions blocking the PR

1. **`monoliths`' commit** — approve in its pane, or tell this session to take it. Everything waits on this.
2. **Merge unlooked-at block wear, or look first?**
3. **`fill.point` vs `SEALED_BLOCK_METALNESS` 0** — the blocks are black or pale, never board 28.
4. **`tone.exposure` 1 vs `bloom.threshold` 1** — carried, unanswered. At spec defaults *nothing* marigold
   blooms; the rail computes to 0.856. The whole look depends on the owner's dialled `exposure 2`.
5. **Hull roughness** (`controls`) — authored 0.48/0.43 vs `ART_MATERIALS` M6's 0.25–0.40 band;
   `ship.hullRoughness` 1 → 0.75 fixes it. Codex's art, so not an agent's to override.
6. **The rail bounce** (`controls`) contradicts GDD §11's LIVE *"walls stop+slide, non-lethal"*. Owner asked
   for the bounce directly; the doc line needs updating or the change backing out.
7. **Camera far** (`asteroids`) — `test-level-canvas.tsx` sets 1000; a belt rock down the z-window sits past
   it and pops. Real fix ~2500. Deliberately not slipped into a landing commit.

## Owed before or with the merge

- **GDD §5.7 and ADR-009 still describe the slow/drag block family** that no longer exists in the sim.
  `monoliths` confirms it never touched them. Unclaimed — someone must take it.
- **`ART_MATERIALS.md` §7 decisions-and-departures entries** for `SEALED_BLOCK_WEAR_COLOR` `#2c3138` and now
  the grain octave. Both depart from Codex's authored values. Also the carried rail/seam entries.
- **Restore the owner's tunables.** This session left two A/B values live on `:5173` and the tab closed
  before they could be put back: `fill.point` **25.6** (owner had 0) and `level.blockDensity` **0.35**
  (owner had 1). `block.seam` **6** is the deliberate fix — leave it. Full 55-key backup:
  `scratchpad/tunables-backup.json`. `controls`' tab is on `:5175`, a different origin and a different
  store; it never touched the owner's.

## Gotchas

- **Chrome is single-occupancy.** A tab outside the frontmost window is `document.hidden`, rAF throttles to
  zero and every screenshot is black at 0 fps. Only the human can raise a window. It went behind twice
  mid-pass. Retitle the tab (`document.title`) so the owner can find the right one.
- **A `computer` key press sends keydown+keyup**, so the module-level `down` set in `input/keyboard.ts`
  never holds. Dispatch `KeyboardEvent`s from `javascript_tool` instead.
- **At `level.blockDensity` 1 with `level.gapChance` 0 the ship dies on the first wall every run** and never
  advances, so no close-up is reachable. Thin the density to ~0.35 to fly the field.
- **`restore()` never writes; `persist()` runs on any set.** One slider move freezes every key at its
  current value, so a later source-side default change is invisible in that browser. Clearing the store to
  see a new default discards the owner's entire dialled set — back it up first, every time.
