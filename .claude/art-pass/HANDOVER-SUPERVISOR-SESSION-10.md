# Handover — supervisor session 10 (2026-09-19). Supersedes `HANDOVER-SUPERVISOR-SESSION-9.md`.

**Assume no chat history.** You are the supervisor: lanes execute; you brainstorm, write, decide and relay.

Session 9's copy lives on the `art/block` branch and I corrected two sections of it in place (`01836c8`,
`1527d19`). Where it and this file disagree, **this wins**. Where either disagrees with a lane's
`LANE-STATE.md`, **the state doc wins**.

---

## 0. State in one paragraph

**The big call this session is an approach change, and it came from the owner being angry and right.** The
block's procedural material is being replaced by an **authored tileable PBR set the owner makes in Blender**;
`block-f3` is writing the authoring spec now. Both lanes are alive, re-briefed after a clear, and building:
`track-d0` on slice 1, `block-f3` on the texture spec. `art/frame-tap` is still dead and still needs a
restart. **The Chrome freeze is still on, and the owner's `/art-lab` sitting is still the gate for
everything on task 2** — it has now slipped four sessions.

## 1. ⚠ THE APPROACH CHANGE — authored textures, not procedural

**The owner's words:** the block material needs **large, medium and small** detail and today has only large;
the board reads as *"dark metal with a lot of cracks"*. And the part that actually forced the decision:
*"doing the block in blender would have taken me just 20 mins including the pbr textures"*.

**They are right, and I checked the board myself rather than taking it.** `10_obstacle_blocks_final.png`
panel 2 is dark polished stone/metal with a crack-vein network, chipped bevelled edges, strong specular
streaks, and three distinct detail scales. It is a **tiling PBR material in everything but name.**

**There is a standing project rule that should have caught this and did not** — *procedural must buy a
player-visible outcome, not purity; if the acceptance test is "match asset X" and we can ship X, the answer
IS X.* It had already cost a failed gate on the sky. It was not applied to the block, and that is the
supervisor's failure, not the lane's. **Apply it before approving any procedural art work.**

**The owner's one reservation, and its answer.** They asked how a texture aligns on procedurally-generated
boxes of arbitrary size. `block-f3` answered it first-hand from the shader, and the answer is what closed the
decision:

- The **per-face 2D UV basis already exists** (`tangentA`/`tangentB` selected by face normal, in
  `SEALED_BLOCK_FRAGMENT_NORMAL`). `vBlockPos = position * vBlockSize`, so it is in **world units** — a 4u
  and a 5.5u block carry the same material at the same physical scale, with no stretch and no per-size
  authoring.
- `put()` never writes rotation, so box-local is world-axis-aligned: **one texture fetch, not a triplanar
  three-sample blend.** It is also *cheaper* than today's ~72 hashes per fragment.
- **⚠ THE TRAP: do NOT use three's built-in `map`/`roughnessMap`/`normalMap` slots.** `BoxGeometry`'s uv
  attribute is normalised **0..1 per face** (`BoxGeometry.js:139-140`), so those slots stretch with
  non-uniform instance scale and fail **silently** — a differently-sized instance just carries a subtly
  coarser material, which nobody catches by eye. Sample manually inside the existing shader injections,
  writing `roughnessFactor` and `normal` directly, the way `uDetailRough` already does.
- Sample with **`textureGrad` and explicit derivatives from the tangents** — the UV jumps discontinuously at
  face boundaries and implicit derivatives there collapse to the blurriest mip, drawing a dark line along
  every edge. Build it that way rather than discovering it.

**The rule for what converts and what does not**, `block-f3`'s formulation and better than mine — adopt it:
**anything keyed to the block's own extents or to a per-instance hash stays procedural; anything that tiles
in world space becomes a texture.** Four things survive: the **marigold seam** (hashed per instance into
`vSeamCorner`; a baked texture is byte-identical on every instance), the **bevel/crease** (keyed to
`blockEdge` from `vBlockSize`, and a tiling texture cannot know where the block's edges are), the **B13
panel splits** (block-extent-relative, snapped to an even count) — *and* the **AABB gate test**, which is not
art at all: the vertex stage must still never write `transformed` or `gl_Position`, and a texture swap must
not be allowed to quietly delete that test.

**I was wrong about the seam and the correction matters.** I said it stays procedural because it "has to
scale with block size rather than stretch". That is the **opposite** of B9/B18 — the seam is a
**world-constant width**, which is why the board draws CUBE and WIDE carrying the same thickness. That
phrasing, left standing, would have licensed the exact error those decisions exist to prevent.

## 2. What the owner decided

| | |
|---|---|
| Block material | **Authored tileable PBR maps**, owner-authored in Blender. Procedural route ends |
| Track floor | **SEPARATE CALL, deferred until the blocks land.** Do not switch it pre-emptively |

The floor deferral is deliberate: let the block lane prove the authored route end-to-end first. Slice 1 and
slice 2 proceed as planned meanwhile, but plan them knowing the floor may follow.

## 3. The lanes

| lane | branch | ports | agent | state doc |
|---|---|---|---|---|
| track | `art/track` | 5201 / 2601 | `track-d0` | `02-track/LANE-STATE.md` @ `7581f89` — rewritten wholesale this session |
| block | `art/block` | 5202 / 2602 | `block-f3` | `07-blocks/LANE-STATE.md` + `SESSION-9-ADDENDUM.md` §14 @ `1527d19` |
| frame-tap | `art/frame-tap` | 5203 / 2603 | **DEAD** | `00-frame-tap/LANE-BRIEF.md`, `LANE-FACTS.md` @ `96f5d94` |

Both live lanes were cleared and restarted this session and both passed the readback check before touching
code. **`art/block`'s worktree is `block-f3`'s** — I committed into it twice and it correctly flagged that
two writers share it. One owner per worktree; hand a lane doc changes to carry rather than committing there.

### `track-d0` — slice 1 approved, building

**Approved: Option A plus the `track-materials.ts` ownership item.** Extend the floor build past `finishZ` by
a fixed run-out, honour `f.y` in `emitSpan`, add the y-equality term to `continues()`, material values
untouched, stale comment corrected. `TrackRibbon` loses its floor half and becomes `track-rails.tsx`. The
deletion commit is staged **LAST** so the before/after comparison stays possible.

Three findings of its own, all first-hand:

1. **`TrackFloor` stops at the finish line and the instanced floor does not.** `buildFloorGeometry` bounds at
   `finishZ / SEG_LEN` = 400 while `TrackRibbon`'s window is unbounded and `segmentAt(420)` still returns a
   full-width `finish` pad. **Swap as-is and the player crosses the line and flies over a void** for the
   whole leader-grace window — a gameplay regression a surface review would not catch.
2. **`TrackFloor` silently ignores `FloorSpan.y`** (`emitSpan` hardcodes `t=0`). Verified **latent, not
   live**: across seeds 1/2/3/7/42/1337/99991, 2,675 spans, the distinct `y` set is exactly `[0]`.
3. **`/art-gallery`'s "Track slab" subject will start lying the moment the swap lands** — `subjects.tsx`
   hand-rolls its own `boxGeometry` and spreads raw `FLOOR_SURFACE`, while the game's floor becomes a 2u
   mesh whose material overrides `color`, `roughness 0.62` and `metalness 0.12` inline. That is the precise
   drift `track-materials.ts`'s header exists to prevent. **Giving the module the floor's real material also
   discharges `art/block`'s cross-lane contract** — their condition binds them to read the base from the
   single constant `art/track` owns, and right now that constant does not exist.

**Rejected: Option C** (geometry + material in one gate) — a verdict of "worse" could not be attributed to
either. Correct, and the lane rejected it itself.

### `block-f3` — writing the texture authoring spec

`a519ebf` (the §5 fade-gate unit fix, which also caught the identical mismatch in `uCreaseHalfWidth` that §5
had missed) and `062ce4e` (`uDetailRough`, one line: `roughnessFactor *= 1.0 - uDetailRough * (detail-0.5) *
2.0`, injected after `<roughnessmap_fragment>`) are both landed, gated, pushed and **unjudged**.

**`uDetailRough` is now a probe rather than the answer**, and it is worth one minute of the owner's sitting:
it tells us whether roughness genuinely breaks the 85–90% specular dilution *before* the owner spends twenty
minutes authoring a roughness map. Caveat to relay as an expectation, not a defect: under an environment bake
the direction is **per-face non-monotonic** — variation should appear on every face, but which way it goes is
per-face.

**Its current task: `.claude/art-pass/07-blocks/TEXTURE-SPEC.md`** — a document, not code. Which maps and
which channels; **tile size in world units**; resolution argued from world-units-per-texel at play speed;
seamless-tiling requirement; **what the maps must NOT contain** (seam, bevel/crease, and — owner's call —
the B13 splits, possibly redundant if the authored material carries vertical structure); colour space and
format; and the three detail scales in the owner's own large/medium/small terms so they can check their own
work before exporting. **Read once, by someone with Blender open, who wants to know what to make.**

## 4. ⚠ Both lanes independently found the SAME stale premise today

`TrackFloor`'s material comment justifies low metalness with *"this scene has ambient light and no
environment map, so high metalness just renders black"*, and `sealed-block-material.ts` holds `metalness: 0`
for the same stated reason. **Both halves are now false**: D4 deleted the lab's ambient, and the sky rig
brings `SkyEnvironment`. The block lane measured what that environment is worth — zeroing albedo entirely
moved the lit face only 48–65 → 45–57.

**Neither lane is acting on it**, correctly — it cannot be tested blind and it must not ride a gate that is
already judging something else. Both are holding for the same frame. **This is the fourth stale premise
falsified on this project in three days.** Re-test an inherited blocker before budgeting around it.

## 5. THE OWNER'S SITTING — still the gate, now carrying three things

Hand this over as one sitting, and **schedule it rather than letting a lane steal focus.** The freeze stands
until `art/frame-tap` lands.

1. **Slice 0's verdict** — the corrected block is in session 9 §9 on the `art/block` branch, `1527d19`. It
   says fov 120, tilt −2, and the black margin is a **~12% sliver on the leading edge under hard strafe
   only**, with parked and straight fully covered. Black parked, or straight, or on both edges, means the
   framing drifted rather than the margin being large.
2. **`track-d0`'s floor comparison** — needs **no code change**, rides free at today's HEAD, and is
   **unrecoverable after the deletion commit**. Two toggle states one click apart. The lane owes me a short
   verbatim block naming the two states and the single question each frame answers.
3. **`block-f3`'s roughness probe** — sixty seconds at `/iso-block` on :5202. Did roughness break the
   dilution? That answer decides whether a roughness map is worth authoring.

**⚠ Chrome tabs are per-session and only ONE tab is active at a time** — serialise these, and never record a
tab id as state.

## 6. Next actions, in order

1. **Schedule the owner's sitting** (§5), three items, serialised.
2. **`block-f3`'s `TEXTURE-SPEC.md`** → review it, then put it to the owner. **The spec is the thing that
   makes their twenty-minute estimate real**; every ambiguity in it is an iteration they pay for.
3. **`track-d0` builds slice 1 (A + the materials item)**, deletion commit last.
4. **Restart `art/frame-tap`** — it is what lifts the freeze, and every lane is paying a per-probe tax on the
   owner's attention until it lands. Its successor's first action is one call:
   `document.querySelectorAll('canvas').length` on `:5203/art-lab`.
   `herdr agent start frame-tap --kind claude --pane w2E:p1 --timeout 120000 -- --permission-mode auto`
5. **Slice 2 opens with a MEASUREMENT, not a retune.** `track-texture.ts` is albedo-only against a ~85–90%
   non-diffuse surface — the same shape as the block's diagnosed failure. Zero the term, read the same pixel
   row, see whether the frame moves. **That measurement now feeds an owner decision** (whether the floor
   follows the blocks to authored maps), so it matters more than when it was written.

## 7. Process notes that earned their place

- **The supervisor writes the prose; lanes supply first-hand facts.** `LANE-FACTS.md` is raw, one line each,
  committed *as the lane works*. `art/track` had none — it predates the convention — so its successor's
  state doc cost an extra round-trip. Both lanes now maintain one.
- **Do not duplicate numbers into the state doc.** A number living in two files is a fork with a delay fuse.
  Cite the fact line.
- **Lanes overturned the supervisor twice more today**, both times with checkable evidence: the fov-120
  margin (7% → 11.6%, wrong in the *unsafe* direction — the budget constant would have been set below what
  it exists to permit), and the seam's rationale (§1). **Relay the reasoning, not the verdict**, and expect
  to be corrected.
- **⚠ Check which way a falsification actually pointed.** Session 9 §3 recorded the owner's tilt test as
  *confirming* the baked-planet diagnosis when it killed it; the real cause was a far-plane clipping hole.
  Corrected in both the handover and the state doc this session.
- **Re-audit the artifact after a targeted fix** — the 7% figure lived in three places, not one.
- **NO BACKTICKS IN GLSL COMMENTS.** The shader blocks are TS template literals; a backtick terminates one
  and surfaces as `error TS1005` pointing at a comment line. Cost `block-f3` one cycle.
- **`pnpm format` before `pnpm lint`** (biome treats formatting as a lint error); `pnpm -r test` silently
  skips `@slur/shared`, so `--filter @slur/shared` is not redundant; the commit hook rejects a
  `Co-Authored-By` trailer; never bundle `git add` and `git commit` in one Bash call.

> **The lesson this arc keeps re-earning, now with a second edge on it:** every confident conclusion built
> from source alone that got overturned, got overturned by rendering or measuring. **And every approach that
> burned a session got burned because nobody asked whether the cheap authored thing would simply be better.**
> If you find yourself arguing about a frame, measure it. If you find yourself tuning toward a reference we
> could just ship, stop.

---

## 8. ADDENDUM — `block-f3` is AT A SEAM and ready to clear. Do this first.

**HEAD `a360082`** "docs(art-pass): the sealed block's authored-texture spec, for Blender". Tree clean,
pushed `0 0`, gate green. Its commits, in order: `062ce4e` (`uDetailRough`) · `a519ebf` (fade-gate unit fix)
· `aecea33` (texture-swap facts) · `a360082` (the spec). `01836c8` in the middle is the supervisor's.
`LANE-FACTS.md` is current and was written with the code each time, never at handover.

**It took the spec as its last unit deliberately** — every input was already in its context and a fresh agent
would have re-read five docs to reconstruct it. That is the right call at a seam. **Take no more work from
it.** Clearing it needs only: write `07-blocks/LANE-STATE.md` from its `LANE-FACTS.md` plus the tree, kill,
restart in pane `w2D:p1`, re-brief.

**`[unmeasured]` and it is the important one: THE ROUGHNESS FINISH HAS NEVER BEEN SEEN BY ANYONE.**
Everything in `e7ca605`, `062ce4e` and `a519ebf` is unjudged, and the spec's **5u tile and 1024² are derived,
not validated against a render**.

### ⚠ The material language is UNSETTLED and the spec is written against a stale line

The spec's line 6 reads *"dark stone / worn concrete — dark metal with a lot of cracks"*, marked "not up for
re-litigation" — **that marking is now false.** The owner has since asked whether **"old painted wrought
iron"** describes it. That is the **third** vocabulary for one surface across three sessions.

**Supervisor position, put to the owner and awaiting their word:** take the *finish behaviour*, reject the
*material identity*. Proposed replacement for line 6:

> **Dark brittle stone under a worn matte coating** — the coating rubbed through at edges and high points to
> a slightly brighter, glossier substrate.

- **Keep** the two-layer wear story: it *generates* roughness variation from a physical cause and gives the
  board's chipped bevels a reason to read bright, instead of an arbitrary tuned band. Roughness is the
  channel that paints this surface, so a language that produces it is worth more than one that decorates.
- **Reject** rust (the palette excludes red, and `track-materials.ts` says so in its own header — it would
  also compete with the marigold seam, which board panel 8 reserves *functionally* for gameplay
  readability), paint-flake noise (panels 7 and 8: "clean fracture language, not noisy detail"), and the
  forged/Victorian-ironwork association, which pulls terrestrial against "Cold Space" and against panel 8's
  "same material family as the track and world". Iron also does not *craze* — the destructible family's
  fracture language needs a brittle material.

**The spec does NOT depend on the name.** Tile size, resolution, ORM packing and the exclusion list are all
invariant; only line 6 and §1's three-scale descriptions carry vocabulary. **A language change is a small
edit, not a rewrite** — say so when putting it to the owner, so the decision is not made under false cost.

### Two spec points to carry to the owner rather than let them discover

1. **The 5u tile is a GAMEPLAY argument and must not be changed casually.** 5 was chosen *because it does not
   divide 8*. A 4u tile — the habit-shaped choice, and it matches `CELL` — puts a tile boundary at exactly
   **mid-height on every block**, and a horizontal line across a mid-face reads as a **ledge** on a block
   that is un-jumpable by design. Same read B11 rejected the mid-face seam for. Any size is fine provided it
   does not divide 8.
2. **Open, theirs, deliberately undecided (spec §6):** once the authored material carries its own vertical
   structure, do the procedural **B13 panel splits** get deleted? **Doubling them is the one outcome that
   looks wrong.**

### A reversal worth propagating: AO is NOT diffuse-only

The lane inferred AO would be nearly inert, then **caught itself by reading three's source before shipping
the claim**: under `USE_ENVMAP && STANDARD`, `aomap_fragment` also does
`reflectedLight.indirectSpecular *= computeSpecularOcclusion(…)`. At ~85–90% non-diffuse, **AO acts directly
on the term doing the painting** — a live lever, and the spec now asks for a real AO channel instead of
telling the owner to skip a map that matters. Recorded as a reversal rather than quietly fixed, which is the
behaviour to keep rewarding.

### Other first-hand three-0.185.1 facts it banked

- `<roughnessmap_fragment>` declares `float roughnessFactor = roughness;` seeded from `material.roughness`,
  and reads channel **G** — so scaling `roughnessFactor` follows the base **structurally**, with no second
  copy of the number anywhere that could fork. Better than the supervisor's §14 expected.
- `lights_physical_fragment` 10-12 clamps roughness at both ends (`max(…,0.0525)` then `min(…,1.0)`), so **no
  clamp belongs in lane code**.
- Chunk order: 172 color → 176 roughnessmap → 177 metalnessmap → 178 normal_begin → 182 emissivemap. That
  ordering is the only reason `detail` is in scope where it is injected.
- `DETAIL_ROUGH = 0.35` swings roughness **0.36–0.74**. Untouched, pending the frame.

---

## 9. ADDENDUM — `track-d0` is ALSO at a seam. BOTH lanes now need clearing.

**HEAD `86615cd`**, tree clean, pushed `0 0` — **verified by the supervisor, not taken on report.** Gate
GREEN at `f6d1351` and again at HEAD: typecheck · lint (3 pre-existing `noExcessiveLinesPerFile` +
"✓ Canvas-isolation: 8 route entry modules clean") · shared 75/75 · client 37/37 · server 4/4 · build.

- `c1ccb97` — `track-materials.ts` owns the floor's material; the gallery stops lying about it.
- `f6d1351` — run-out past the finish line + `span.y` honoured.
- `86615cd` — docs: commit-2 facts and what slice 1 deliberately has not done.

### ✅ THE CROSS-LANE CONTRACT IS DISCHARGED — tell `art/block` immediately

**`track-materials.ts` now exports `FLOOR_ROUGHNESS = 0.62` and `FLOOR_METALNESS = 0.12`** (verified at
`track-materials.ts:30,36`). **This is the constant `art/block` was waiting on** — before `c1ccb97` it was a
literal in a JSX prop and nothing could import it, which is why their §4 condition 2 was unsatisfiable. It
exists now. **They can take it, and they should be told at their re-brief** — it is the whole point of a
relative perturbation that it follows a base it can actually read.

`floorSurface()` is a **function, not a frozen object**, because `trackSurfaceTexture()` needs `document` and
must not run at import time. Two consequences worth not rediscovering: `track-slab-subject.tsx` is a
component rather than an inline node, because `SUBJECTS` is imported at module scope by `gallery-camera.tsx`
and `art-gallery-sidebar.tsx` for metadata alone and a module-scope `floorSurface()` call would have made
that import require a DOM; and the gallery shares an exported `buildSpanGeometry` rather than a
`boxGeometry`, because box UVs are normalised 0..1 per face and would have stretched one panel tile across
the full 64u — **the same trap as the block's, met independently on the other lane.**

### ⚠ THE DELETION IS HELD, ON PURPOSE. Do not let a fresh agent land it.

Not done and **deliberately** not done: quads out of `TrackRibbon`, `showFloor` and the `slab` toggle
retired, `TrackView` composing `TrackFloor`, rename to `track-rails.tsx`.

It waits on **the owner's two gap frames**, and then — if they say 2u conceals the hole — on a
`SLAB_THICKNESS` decision **taken while the 0.6u alternative still exists.** The dev server serves the
working tree, so "staged last" is not sufficient protection; the quads must stay *in the tree* until the
frames are taken. **This comparison is unrecoverable.**

**Commits 1 and 2 are invisible on screen by construction** — every material value carried across unchanged,
and the run-out and `span.y` fixes are verified no-ops today (7 seeds, 2,675 spans, distinct `f.y` = `[0]`).
**So the owner's comparison is still exactly the two toggle states in §5's frame block. Nothing landed
changes what they will see.**

### Measurements banked

- Seed 1: 382 spans, 18 holes, 20 partial-width spans → ≤2,292 quads ≈ 13.7k verts for the whole track, in
  one `useMemo`. Against that, the instanced path walks a 49-segment window **every frame** and uploads two
  `instanceMatrix` buffers — so the swap is expected to *improve* frame time, to be measured not claimed.
- All 7 seeds are exactly 400 segments. `segmentAt(400)` and `segmentAt(420)` both return `kind:'finish'`,
  `floors:[{x0:-32,x1:32,y:0}]`.
- `[unmeasured]` frame time, before or after — the swap is not in the tree yet, so there is nothing to
  measure.
- `[unmeasured]` **anything in pixels. The lane took no frames; the freeze held all session.**

### One doc-hygiene correction for the next state-doc write

`LANE-STATE.md` §1 names HEAD `888b1c9`, which was already one commit stale when written — **a state doc
cannot name the commit that creates it.** It briefly confused the fresh agent. When rewriting, either omit
the HEAD SHA or say plainly that `git log -1` is authoritative.

## 10. Next actions — REVISED. Both lanes are parked at clean seams.

1. **Clear BOTH lanes.** `block-f3` (~161k) and `track-d0` (~151k). Each needs: write `LANE-STATE.md` from
   that lane's `LANE-FACTS.md` plus the tree, kill (`herdr agent send-keys <name> c-c c-c`), restart in the
   same pane (`w2D:p1` block, `w2C:p1` track), re-brief, demand the readback. **Tell the block lane that
   `FLOOR_ROUGHNESS` now exists.**
2. **Settle the material language** (§8) and hand the owner `TEXTURE-SPEC.md`.
3. **The owner's sitting** (§5) — three items, serialised, one tab at a time. **The track gap comparison is
   the only one that is unrecoverable, so it goes first.**
4. **Restart `art/frame-tap`.** Both lanes have now run a full session blind under the freeze, and both said
   so explicitly. It is the constraint on everything visual.

---

## 11. THE MATERIAL LANGUAGE IS SETTLED — and a vocabulary sweep is OUTSTANDING

**The owner retracted "dark stone / worn concrete" as their own mistake and asked for it removed everywhere.**
The agreed replacement, which supersedes §8's "awaiting their word":

> **Dark brittle stone under a worn matte coating** — the coating rubbed through at edges and high points to
> a slightly brighter, glossier substrate.

**⚠ DO NOT BLANKET-REPLACE. The phrase is the WHOLE WORLD's material family, not the block's**, and it came
from the frozen ChatGPT art package. Verified occurrences:

| where | what it covers | call |
|---|---|---|
| `07-blocks/TEXTURE-SPEC.md` line 6 + §1 | the block | **replace** — handed to `block-f3` as its last unit |
| `04-monoliths/README.md:26` | monoliths | **replace** — but note `handoff/HANDOVER.md:85` says monoliths have **"near-zero wear"**, so "worn" was already wrong there in the *opposite* direction. Manufactured, hard, specular — but not weathered |
| `docs/ADD.md:108,192` | world-wide | **replace**, carefully — 192 calls the read "the one real exception" for surface detail |
| `05-asteroids/README.md:23` | asteroids | **DO NOT** apply the new phrase. `handoff/02_ENVIRONMENT.md:63` has them "dark stone / desaturated rocky" — **natural rock has no coating to rub through.** Drop only the "concrete" association |
| `docs/art-direction/**` (6 files) | the frozen package | **FLAGGED, NOT CHANGED.** Codex owns art; rewriting their frozen deliverable unilaterally is not ours to do. **The owner has been asked and has not yet answered.** |

**The split to apply:** a **manufactured family** (blocks, monoliths, track) takes the new definition; **asteroids
stay natural rock**. The confusion the owner hit is that "worn concrete" implies a porous matte mineral while
the board plainly shows a hard, dark, specular, manufactured surface — which is true of the manufactured
family and false of asteroids.

## 12. THE DIVISION OF LABOUR — the owner's question, answered

*"How do we achieve this with procedurally generated mesh and hand-authored texture maps?"* The framing to
keep, because it settles every downstream argument: **the texture says what the material IS; the shader says
where features SIT on this particular box.**

- **Texture owns everything below the 5u tile**, sampled in **world units**, so one asset serves a 4u block,
  a 5.5u block and a 12u wall with no stretching and no per-size authoring.
- **The shader keeps four things the texture physically cannot do:**
  1. **Anything larger than the tile.** A 5u tile cannot encode a 10u feature — so block-to-block tonal
     variation and whole-face weathering stay procedural, as a low-frequency field over the sampled
     roughness. **The owner's three scales therefore split across TWO systems; they do not all live in the
     maps.** This reframes `TEXTURE-SPEC.md` §1 and is the part most likely to be lost.
  2. **Anything at the block's edges** — bevel, crease, and the coating's rub-through. The texture cannot
     know where this box ends.
  3. **Per-instance uniqueness** — the seam's hashed corner. A baked texture is byte-identical everywhere.
  4. **Extent-relative features** — the B13 splits, snapped to an even count so none lands on a corner.
- **The wear story falls out of this, which is why the new definition is a good one:** author **ONE** coated
  material and have the shader lerp roughness toward the glossier substrate inside the `blockEdge` band it
  already computes. Texture supplies *what worn-through looks like*; shader supplies *where the coating is
  gone*. The band is a world-constant width, so wear is size-invariant for free — no second asset.
- **⚠ Anti-repetition, NOT YET BUILT and it will bite:** 5u tiles across a field of blocks read as stamped.
  Fix is per-instance **UV offset + a 0/90/180/270 rotation** hashed from `instanceMatrix[3].xz` — one extra
  hash, reusing the machinery `vSeamCorner` already uses. Belongs to the sampling work, not to the author.

---

## 13. ⚠ FIRST JOB NEXT SESSION — THE MATERIALS AUDIT. The owner asked for it directly.

**The owner's words:** *"lets take a step back, go through the art direction and list out the material
treatment and definition for track, block, monolith, asteroids and the ingredients. lets confirm everything
once."*

**This was NOT started** — session 10 ended at ~233k against a 250k stop, and a half-finished materials
audit is worse than none because it becomes the artifact people cite. **Do it cold, in one pass, before
anything else.** It is cheap with full context and expensive without.

### Read these, in this order

1. `docs/art-direction/handoff/02_ENVIRONMENT.md` · `06_IMPLEMENTATION_NOTES_THREEJS.md` ·
   `07_ASSET_CHECKLIST.md` · `HANDOVER.md` · `docs/art-direction/CURRENT_STATUS.md`
2. `.claude/art-pass/02-track/README.md` · `04-monoliths/README.md` · `05-asteroids/README.md` ·
   `07-blocks/LANE-BRIEF.md` + `TEXTURE-SPEC.md`
3. `docs/ADD.md` §§ around lines 108 and 192
4. **The code, because the docs and the values have already diverged:**
   `apps/client/app/game/scene/track-materials.ts` and
   `apps/client/app/routes/iso-block/sealed-block-material.ts`
5. Boards `10_obstacle_blocks_final.png` for blocks; the monolith/asteroid boards for theirs.
   **Boards are a LOOK target, never physics and never dimensions** — `docs/ART_SCALE_REFERENCE.md`
   overrides every number printed on a board.

### Deliverable — ONE table, four subjects: track · block · monolith · asteroid

Per subject: **definition** (one sentence) · **finish behaviour** (matte/gloss, wear, where highlights come
from) · **ingredients** (the maps/terms it is actually made of) · **procedural vs authored**, with the
`extents-or-per-instance → procedural; tiles-in-world-space → texture` rule applied · **where the value
lives in code today**, by `file:line`.

### Contradictions ALREADY FOUND — resolve these, do not rediscover them

1. **The blocks have TWO materials that disagree.** In-game hazards render through `LETHAL_SURFACE` /
   `DRAG_SURFACE` (`track-materials.ts`) which specify **no roughness at all** → three's default **1.0**;
   the sealed block (`sealed-block-material.ts:326`) is **0.55**. Same object, two materials, different
   finish. Whoever merges task 7 into `track-blocks.tsx` must carry it across.
2. **The monolith spec contradicts itself.** `04-monoliths/README.md:26` says "dark stone / worn concrete
   family… matte to subtle gloss, dielectric"; `handoff/HANDOVER.md:85` says **"near-zero wear"**. "Worn"
   and "near-zero wear" cannot both hold.
3. **The in-game blocks are still RED** (`#ff2740`), a hue the palette excludes. `track-materials.ts` says
   so itself and defers the fix to the block task. Still open.
4. **`metalness` rests on a stale premise in BOTH lanes** — "no environment map, so metal renders black" is
   false since D4 and `SkyEnvironment`. Independently found on the track floor and the sealed block the
   same day. Unresolved, awaiting a frame.
5. **The vocabulary sweep from §11 is outstanding** and should be folded into this audit rather than done
   separately — the audit is what decides the right phrase per subject.
6. **`docs/art-direction/` is Codex's frozen package.** The audit may recommend changes to it; it must not
   silently make them. **The owner was asked whether to edit those six files and has not answered.**

### Verified-this-session fragments, to save re-reading (cite, do not trust blindly — re-check at `file:line`)

- `FLOOR_SURFACE` `color #050507` / `emissive #c8d0d8` @ **0.05** (`track-materials.ts:17`);
  `FLOOR_ROUGHNESS 0.62`, `FLOOR_METALNESS 0.12` (`:30,:36`, new at `c1ccb97`).
- `RAIL_SURFACE` `emissive #c8d0d8` @ **2.6**, `color #15171a`.
- `LETHAL_SURFACE` `#ff2740` @ 2.2 · `DRAG_SURFACE` `#ffa51f` @ 1.6, transparent, pulsed 0.25↔0.5.
- Sealed block: `roughness 0.55`, `metalness 0`, `DETAIL_ROUGH 0.35` swinging 0.36–0.74.
- Board panel 8's binding principles: *same material family as the track and world*; *marigold used
  **functionally** for gameplay readability*; *keep it minimal, no unnecessary surface detail or visual
  noise*; *destructible uses clean fracture language, not noisy detail*.
- Measured: the block renders **~85–90% non-diffuse**, so **roughness and normal are the channels that
  paint these surfaces and albedo is nearly inert.** This is the single most load-bearing fact in the audit
  — it decides which "ingredients" actually matter for every subject, not just the block.

---

## 14. `block-f3`'s final commit — spec retargeted. Both lanes now idle at seams.

**`30a1b3c`** "docs(art-pass): retarget the texture spec — coated stone, and the labour split". Tree clean,
pushed `0 0`, gate green. Lane at ~179k, **holding, nothing started, ready to clear.**

`TEXTURE-SPEC.md` only: target line is now the coated-stone definition, "not up for re-litigation" removed,
§1's three scales recast in coating terms, new §6 carrying the division of labour verbatim, sections
renumbered 1–9 with cross-references checked. `docs/art-direction/`, the other task READMEs, and its own
history docs deliberately untouched.

**⚠ AN ASSET CONSTRAINT THE OWNER MUST HAVE BEFORE OPENING BLENDER, and the lane added it unprompted:**
if we later hash a 0/90/180/270 per-instance rotation for anti-repetition, **the tile must survive being
rotated** — no strong directional grain that only reads one way up. A tile with a clear vertical lay means a
quarter of the blocks look wrong and the asset gets remade. **That is the twenty minutes repeated.** It is
in the spec's not-yet-built callout.

**Two `[unmeasured]`s to state plainly when handing over the spec:** the **5u tile** and **1024²** are
derived, not validated against a render. The tile argument is geometric and solid (5 does not divide 8, so
no boundary lands at mid-height and nothing reads as a ledge). The **resolution** rests on an assumed ~50°
vertical FOV and 1080-tall screen, **neither verified against the project's actual camera** — a two-minute
check of the camera constants, and 1024 errs safe if the real FOV is wider.

**Still the headline `[unmeasured]`: nothing in `e7ca605`, `062ce4e` or `a519ebf` has ever been seen by
anyone.** The roughness probe is unjudged and `metalness: 0` still rests on a premise stale on its face.
