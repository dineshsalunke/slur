# Slice 2 — the track boundary: shape, then colour, then emitters

You are the track lane, re-briefed after a context clear. Slice 1 is **merged** (`deadf9f`). Read
`.claude/art-pass/02-track/LANE-FACTS.md` on this branch — it is your predecessor's, it is merged, and it
is the record of what has already been paid for. Do not re-derive what it settles.

**Your worktree** is `../slur-worktrees/track-slice2`, branch `art/track-slice2`, based on `47c3dab`
(the supervisor rebased this branch onto current `dev` before you started — zero conflicts, docs-only).
Never reuse `art/track` — it was squash-merged and deleted; reusing a squash-merged branch carries an
ancient base that a 3-dot diff hides (`#118`→`#119` reverted live work that way). Always check with
`git diff origin/dev HEAD` (2-dot), never `...` (3-dot).

## The headline your predecessor found, and it expands this slice

**The rail is the wrong SHAPE, not merely the wrong colour.** Board 24 panel 02 ("Boundary") calls for a
*continuous narrow marigold emitter at the upper outer edge* with a dark engineered section and a localized
halo — and its do-not-copy column explicitly excludes *"raised rails or ornamental edge machinery"* and
*"apparent slab thickness"*. `ART_MATERIALS.md` rev 3 M7 puts the emitter **in the top outer corner of the
slab** as a narrow *embedded strip* with a small bright core.

What ships today is a `0.5 × 0.5u` box standing **proud** of the deck (`track-rails.tsx`, `RAIL_W`/`RAIL_H`).
That is the excluded shape. So slice 2 is: **embed the boundary into the slab's top outer corner, then
retone it, then build the emitter array** — not a retone alone.

## Authority order (unchanged, and it is not optional)

`ART_SCALE_REFERENCE.md` owns dimensions and **overrides every number printed on a board** ·
`ART_MATERIALS.md` rev 3 owns surfaces · golden reference 17 governs integrated appearance · **boards 24
(panel/edge) and 25 (wear) are the track subject briefs and are newer than 17 for track specifics** ·
`docs/art-direction/` is **READ-ONLY** — it is ChatGPT's indexed workspace. Never edit, rename or "fix"
anything in it. Disagree in a Claude-owned doc instead.

Boards are a **look** target — mood, depth, palette, contrast, speed, scale. Never a pixel match, never
evidence about optics. Unphysical detail in an AI render is expected; do not discard a detail for being
unphysical, and **never resolve a physics-vs-board conflict unilaterally**.

## The work

1. **Re-shape the boundary** into an embedded top-outer-corner strip per M7 / board 24 panel 02.
2. **Retone to marigold.** Rev 3 §3 makes this strip the **reference intensity 1.0** from which the rest of
   the scene's marigold scale is later built. Do **not** compensate it for bloom washout — that value
   propagates into every later task, and task 3 (lighting) must inherit an honest one.
3. **The emitter array** — fixed-size K-nearest via `onBeforeCompile`. Isotropic first; `Physical` only if
   a render *proves* isotropic cannot stretch the streaks.

Split the shader patch into its own module if the ratchet (`#139`, now on `dev`) would otherwise push the
file over. **Do not delete a load-bearing note to satisfy a counter** — the fixed-size-array warning in
particular must sit where someone would otherwise "tidy" it into a dynamic array.

## Two decisions that arrive at the owner as ONE sitting — render both, decide neither

1. **The M1 metalness pair**: metalness 1.0 / roughness 0.35–0.50 against the shipped 0.12 / 0.62. Not
   settleable on paper — the sky measures ~linear 0.01 as an IBL source, so at 1.0 everything the specular
   misses goes black. That may be the intended "no fill, shadow sides go black", or may read as a void with
   a stripe. Only a render says which.
2. **Rail breaks over full gaps.** Board 24 wants the outer boundary continuous and M7 separates boundary
   from inserts *by the boundary being unbroken*; the in-code justification
   (`track-rails.tsx`, `if (seg.floors.length === 0) continue`) is that the break is what makes a gap read
   at the shallow chase angle. Both defensible. Not a lane call.

## Standing caution worth holding while you judge

`ART_SCALE_REFERENCE.md` §0: at true scale each edge sits **32u off-centre**, over **12 ship-widths** from
a pilot threading the middle — the sheet itself flags marigold edge-glow as *"a weak guide at true scale"*
and calls it an open art problem. If the boundary is not doing its navigational job, that is a finding to
raise, not a thing to quietly over-brighten.

## Still `[unmeasured]` — do NOT inherit either as fact

- The **bloom-OFF** half of the pair at matched camera.
- Whether the washout is uniform or concentrated in the VFX still setting `toneMapped: false`.

One bloom-ON capture answers neither. The existing composed capture is preserved at
`.claude/art-pass/00-frame-tap/refs/s1-after-swap.png` in the **shared checkout** (it was gitignored and
would not have survived the old worktree's teardown).

Frame tap: `curl localhost:<CLIENT_PORT>/__frame-tap?name=X` writes a composed frame with no focus and no
browser automation. **Known limit:** it stops answering while the lab's `bloom` toggle is ON in an occluded
tab, and answers the moment it is off — reproduced twice each way. Bloom-ON captures currently need a
foreground tab, which needs the owner.

## Comments

**No sweeping.** The 8 previously-pending files are dropped by decision. `#139`'s ratchet prevents
regression mechanically. Fix a comment only in a file you are already inside for this work; never open one
to sweep it. Do not report ratios.

## The gate

The **owner's eye** in `/art-lab` at race speed, env C, **bloom on and off**, judging displayed
tone-mapped pixels — never input hex. Before you build, state which board or doc section governs what you
are about to do and what it requires; at the gate, state how the build answers it. If you cannot name the
authority, you are inventing direction — stop and ask.

Full verify gate before any PR: `pnpm lint && pnpm typecheck && pnpm -r test && pnpm build`. **There is no
CI on this repo** — your local run is the only gate that exists.

No `Co-Authored-By` trailer. Do not bundle `git add` and `git commit` in one Bash call.
