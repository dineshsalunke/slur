# `art/track-slice2` — LANE STATE

**Written by the supervisor at the session-16→17 clear, from `LANE-FACTS.md` plus the tree. Replaces the
previous state doc wholesale** — a log is not a state doc. Everything in §1 and §2 was verified against
this worktree, not recalled.

Read order: `SLICE-2-BRIEF.md` (intent, immutable) → **this file** (where the work is) → `LANE-FACTS.md`
(evidence, one line each, and the authority for every number).

**Numbers are deliberately NOT duplicated here.** They live in `LANE-FACTS.md`. A number copied into two
files is a fork with a delay fuse. Cite the fact line; do not restate it.

If what you find contradicts this file, **stop and tell the supervisor** rather than quietly fixing either.

---

## 1. Position

| | |
|---|---|
| Branch | `art/track-slice2`, worktree `../slur-worktrees/track-slice2` |
| Base | **`47c3dab`** (= `origin/dev`). The supervisor rebased this branch onto it before you started — docs-only, zero conflicts. 2-dot and 3-dot diffs match, so the `#118` stale-base trap is clear |
| HEAD | the brief commit + this state commit — **docs only. No code has been written for slice 2** |
| Tree | clean |
| Ports | client **5201**, server **2601** (`apps/client/.env` present and correct) |
| Stack | **down.** Launch with `PORT=2601 pnpm dev` — `tsx` has no `.env` loader, so `PORT` must be passed in the shell and must equal `VITE_SERVER_PORT` |
| Review URL | `http://localhost:5201/art-lab` — chase camera, which IS the gate |
| Gate | `pnpm lint && pnpm typecheck && pnpm -r test && pnpm build`. **There is NO CI on this repo** — `gh pr checks` reports nothing on any branch, so your local run is the only gate that exists |
| Last green | `47c3dab` on `dev`, full gate re-run by the supervisor: lint (3 pre-existing `noExcessiveLinesPerFile`), typecheck, 75/75 shared + 61/61 client + 4/4 server, build |

**`art/track` is deleted** — branch, remote and worktree. It was squash-merged, so its tip is not an
ancestor of `dev`, `git branch -r --merged` will not list it, and a 3-dot diff hides the stale base.
Never reuse it. Always check with `git diff origin/dev HEAD` (2-dot).

**Source lives in `apps/client/app/`, not `apps/client/src/`** — React Router 8 framework mode. The
supervisor lost a round-trip to that assumption at this clear; do not repeat it.

## 2. What is built — and the facts slice 2 starts from

Slices 0 and 1 are **merged** (`deadf9f`): the honest review frame (tone mapping on, lab rig lights gone,
placeholder blocks out of frame) and the generated deck as the game's floor. `FLOOR_SURFACE` has no
remaining consumer; no `TrackRibbon` / `showFloor` / `track-ribbon` reference survives; `net-canvas.tsx`
still mounts `TrackView`, so the **game** picked the deck up through the composer, not just the lab.

Verified in this worktree at the clear, so you need not re-check:

- **`track-rails.tsx:12-13`** — `RAIL_W = 0.5`, `RAIL_H = 0.5`, and line 13's own comment states the
  justification: *"stands proud of the floor so the rail reads at the shallow chase angle"*. That proud box
  **is the shape board 24 panel 02 excludes**. This is the thing slice 2 re-shapes.
- **`track-rails.tsx:34`** — `if ( seg.floors.length === 0 ) continue;` is the rail break over full gaps.
  That is escalation 2 below. **Do not change it on your own judgement.**
- **`SceneProbe` is still live** (`art-lab/scene-probe.tsx`, mounted by `art-lab-canvas.tsx`). Its deletion
  is an acceptance item on **slice 4** and the PR body must name it. It stays through slice 2.
- **15 files still reference `toneMapped`** — the VFX whose values trade against the bloom and exposure
  budget **task 3 owns**. Slice 1 deliberately took it off the track surfaces only. Do not widen that.

## 3. Next — slice 2, in this order

**Re-shape → retone → emitter array.** The brief carries the authority for each step; the short form:

1. Embed the boundary into the slab's **top outer corner** as a narrow strip (`ART_MATERIALS.md` rev 3 M7,
   board 24 panel 02), replacing the proud box.
2. Retone to marigold. Rev 3 §3 makes this strip the scene's **reference intensity 1.0**, so it must
   **not** be compensated for bloom washout — task 3 has to inherit an honest value.
3. The emitter array — fixed-size K-nearest via `onBeforeCompile`. Isotropic first; `Physical` only if a
   render *proves* isotropic cannot stretch the streaks.

Split the shader patch into its own module if `#139`'s comment ratchet would otherwise push the file over.
**Do not delete a load-bearing note to satisfy a counter** — the fixed-size-array warning especially.

## 4. Decisions in force

- **ONE LANE, track only.** The owner declined a second art lane (blocks / lighting) this session. Do not
  propose spinning one up.
- **The comment sweep is STOPPED by decision.** The 109 remaining files and this lane's own 8 pending files
  are dropped; `#139`'s ratchet prevents regression mechanically, which was the point. Fix a comment only
  inside a file you are already in for real work. **Never open a file to sweep it. Do not report ratios.**
- **`explosions.tsx:26` `MAGENTA #ff2bd6` stays**, recorded as a known divergence beside the red
  `LETHAL_SURFACE`. Retone when someone is judging that subject, not opportunistically. Neither is in a
  default review frame.
- **A test built on a false premise is REPLACED, not added beside** — `radius < 2000` passed while the
  far-plane bug shipped underneath it.
- Isotropic vs anisotropic stays **settled by rendering**, not by argument.

## 5. Retracted — do not cite the originals

`LANE-FACTS.md` § *"Things that were wrong"* holds the full list and it still stands: the black sphere as a
rogue object, the black sphere as the baked planet (it was a **far-plane clipping hole**; the owner's
tilt-drag falsified the planet theory), "near-white clipped slab and rails", the planet at top right, "zero
stars in the void", coverage ≈138.5°, and the fov-120 margin ≈7% — that last one wrong **in the unsafe
direction**, since angle-to-screen-width grows as `sec²θ` and the correct figure is 11.6%.

**Two retractions are NEW at this clear, and both were live claims the previous handover made:**

- **`s1-after-swap.png` is NOT lost.** All three frame-tap captures were copied out before the old
  worktree's teardown and are at `.claude/art-pass/00-frame-tap/refs/` in the **shared checkout** —
  `s1-after-swap.png`, `s1-before-generated-bloomoff.png`, `s1-before-instanced-bloomoff.png`. No retake is
  owed. The luma numbers also survive in `LANE-FACTS.md`.
- **Text CAN be delivered to a lane's pane.** The standing claim was that `herdr agent send-keys` takes key
  names only and `herdr agent prompt` pastes without submitting — both true, but **`herdr pane send-text`
  and `herdr pane run <pane-id> <command>` exist** and work. That is how this pane was moved out of the
  deleted `../slur-worktrees/track` and restarted without the owner pressing a key.

> **Every reversal in this lane was settled by rendering or measuring, never by reasoning** — including the
> confident, well-argued retractions built from source alone. **If you find yourself arguing about a frame,
> measure it.**

## 6. Caveated / `[unmeasured]` — do NOT inherit either as fact

- **The bloom-OFF half of the pair at matched camera.** Unmeasured.
- **Whether the bloom washout is uniform, or concentrated in the VFX still setting `toneMapped: false`.**
  Unmeasured. One bloom-ON capture answers neither.
- **`[unmeasured]`: WHERE tone mapping happens.** `gl.toneMapping` read `NoToneMapping` live while R3F's
  source sets ACESFilmic absent `flat`; most likely the postprocessing `EffectComposer` takes it into the
  chain. **Confirm before judging the strip's hue.** Every luminance number in `LANE-FACTS.md` comes from
  `gl.render()`, which bypasses the composer — pre-bloom, pre-tone-map.
- **`SKY_TUNING` is an in-memory module singleton and nothing persists it.** Run `skyConfigSnippet()`
  before any reload if a sitting's values matter.
- **The boundary may not be doing its navigational job at all.** `ART_SCALE_REFERENCE.md` §0: each edge
  sits **32u off-centre**, over 12 ship-widths from a pilot threading the middle, and the sheet itself
  flags marigold edge-glow as *"a weak guide at true scale"* and calls it an open art problem. If you find
  that, it is **a finding to raise — not a licence to quietly over-brighten**.

## 7. Instrumentation — the Chrome freeze is LIFTED for bloom-OFF

`curl localhost:5201/__frame-tap?name=X` writes a composed frame (with bloom) to
`.claude/art-pass/00-frame-tap/refs/X.png` with **no focus and no browser automation** (PR #134). That
retires the old focused-tab constraint.

**The one surviving limit:** the tap stops answering while the lab's `bloom` toggle is ON in an occluded
tab, and answers the moment it is off — reproduced twice each way. So **bloom-ON captures still need a
foreground tab, which needs the owner.** One such capture of `/art-lab` is owed; ask the supervisor for a
slot and say why.

Still true, and cheap to forget:

- `javascript_tool` reads DOM — toggles, slider values, config — at **zero** focus cost. Only *pixels* need
  the window. Use it first.
- `visibilityState` is the only reliable hidden-tab test. Canvas size proves nothing: 3456×1926, mounted,
  rAF dead.
- Tab groups are **per-session**. You cannot adopt a predecessor's tab. Record URLs, never tab ids.
- Never `await` a frame through `javascript_tool` — it hangs the CDP evaluate to its 45s timeout, and the
  hang *is* the diagnosis. Read a free-running counter on a LATER call.
- `gl.render(scene, camera)` + `readPixels` works with rAF dead and bypasses the composer — a free
  bloom-off read. Read a whole **scanline** per call; per-pixel calls are a GPU stall each.

## 8. Open escalations — awaiting the owner, as ONE sitting

Render both, decide neither. Neither is a lane call, and neither is settleable on paper.

1. **The M1 metalness pair** — metalness 1.0 / roughness 0.35–0.50 against the shipped 0.12 / 0.62. The sky
   measures ~linear 0.01 as an IBL source, so at 1.0 everything the specular misses goes black. That may be
   the intended *"no fill, shadow sides go black"*, or may read as a void with a stripe. **Only a render
   says which.**
2. **Rail breaks over full gaps** — board 24 wants the outer boundary continuous, and M7 separates boundary
   from inserts *by the boundary being unbroken*; the in-code justification (`track-rails.tsx:34`) is that
   the break is what makes a gap read at the shallow chase angle. Both defensible.

## 9. The gate, and the obligation before you build

The **owner's eye** in `/art-lab` at race speed, env C, **bloom on and off**, judging displayed
tone-mapped pixels — never input hex. **Before you build, state which board or doc section governs what you
are about to do and what it requires; at the gate, state how the build answers it. If you cannot name the
authority, you are inventing direction — stop and ask.**

Boards are a **look** target — mood, depth, palette, contrast, speed, scale. Never a pixel match, never
evidence about optics. Unphysical detail in an AI render is expected. **Never resolve a physics-vs-board
conflict unilaterally.** `docs/art-direction/` is **READ-ONLY** — ChatGPT's indexed workspace. Disagree in
a Claude-owned doc, never by editing it.

## 10. Housekeeping that has bitten before

- `pnpm format` before `pnpm lint` (biome treats formatting as a lint error).
- `pnpm -r test` silently skips `@slur/shared` — an explicit `--filter @slur/shared` is **not** redundant.
- The commit hook **rejects a `Co-Authored-By` trailer**.
- Do **not** bundle `git add` and `git commit` into one Bash call — a hook rejection kills the whole call.
- **Maintain `LANE-FACTS.md` continuously**, committed with the code it describes — never at handover time,
  because by then the conversation that knew the facts is the thing being thrown away. `[unmeasured]` is a
  legitimate entry; refusing to reconstruct a reading you cannot source first-hand is **correct**.
- **"Swept" is not a state — a measurement is.** Track measurements, never checkmarks.

## 11. Escalation contract

Escalate to the **supervisor**, never to the owner:

```
NEEDS-DECISION: <one line, specific, answerable>
CONTEXT: <2-4 lines: what you are doing, why this fork exists>
OPTION A — <label>: <what it means> / consequence: <what it costs or commits us to>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why — a recommendation without a defence is a preference>
IF NO ANSWER: <what you do meanwhile, or that you are genuinely blocked>
```

Escalate art/taste calls, anything reopening a frozen decision or ADR, anything touching gameplay, anything
costly to undo, and **your design recommendation before you implement it**. Do **not** escalate naming, file
layout, code structure, anything the docs already answer, or anything settleable by verifying. **Verify,
don't ask.** Never treat silence as approval, and a declared fallback that does not fire is worse than no
fallback — it reads as handled while nothing moves.
