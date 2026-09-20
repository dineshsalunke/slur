# LANE STATE — sealed block (#164) — written by the supervisor, 2026-09-20

**Your context was cleared at a clean seam. This file plus `LANE-FACTS.md` are the whole of what you
need.** Everything below is verified, not remembered.

## Where the work is

| | |
|---|---|
| branch | `art/sealed-block` off `origin/dev` @ `cf1c98c`, pushed, **nothing unpushed**, tree clean |
| HEAD | `0eb7947` art(blocks): point the instrument at board 28 |
| gate | **green at HEAD** — typecheck clean · lint 3 warnings = the pre-existing baseline · shared 78/78 · client 80/80 across 12 files · server 4/4 · build OK |
| stack | 5204 / 2604, up; log `.claude/lane/dev.log`; `/iso-block` → 200 |
| issue | #164, locked (comment `5750325229`). No PR yet |

Commits: `5fc6620` instrument + M2 body + AABB assertion · `f40343c` slice-1 gate results ·
`0eb7947` board-28 repoint + authority correction.

## Built and gated — do not redo

- **`/iso-block`** on the existing `<IsoLab>`, `size={8}`, board overlay now
  **`28_non_destructible_blocks_FINAL_DRAFT.png`** (serves 200 over the new `art-refs-blocks` mount).
- **The M2 body:** roughness **0.52** (midpoint of 0.45–0.60), metalness **0**, colour **`#0d1117`**, no
  emissive. Deck for contrast: `FLOOR_METALNESS 0.75`, `FLOOR_ROUGHNESS 0.4` (`track-materials.ts:16,11`).
  The separation from the deck is **finish, not value** — a coated dielectric against a bare conductor.
- **Three footprints:** `4×8`, `5.5×5.5`, `3.5×5`, all 8u. The first is today's generator output; the
  other two are GDD §0's own blessed legal examples.
- **The AABB assertion, in both directions** — no vertex outside the envelope, *and* the envelope reached
  on every axis, per footprint. The second half is the one an eyeball never catches and it was your idea.
- `BLOCK_HEIGHT = 8` (`packages/shared/src/sim/track.ts:143`), `BLOCK_DEPTH = 8` (`:144`), block z centred
  in the 20u segment (`:358`).

**No silhouette work has been done, deliberately** — slice 1 is a plain cuboid in the decided material,
which is exactly what board 28 asks for, so the authority correction cost nothing already built.

## THE AUTHORITY — board 28 only

`docs/art-direction/blocks/28_non_destructible_blocks_SPEC.md` is the block direction. It supersedes board
10 and `handoff/04_OBSTACLES.md`. **The owner was explicit: boards 25, 26 and 27 are history — do not read
them.** `LANE-FACTS.md` quotes board 28 verbatim, so you do not need to re-read the art package at all.

The decided shape, so you do not have to look it up: **sealed rectangular cuboids with restrained bevels**
(no draft, no taper) · **marigold seams vertical only**, variable positions, multiple permitted · **no
top-face luminous returns or glowing outlines** · variation comes from **broad wear patches in sheen and
muted graphite value**, not from differing silhouettes · clean is a legitimate endpoint of the wear range ·
wear strength and seam count are independent controls · **no fissures, cracks or separated plates** · keep
the silhouette intact at every wear level · preserve generous dark face areas.

Board 28's **image** is a final draft that *"has not itself been approved"* — the written direction is what
is decided, the image is a LOOK target, and *"illustrative proportions, apparent height and camera matching
are not measured evidence."* `docs/ART_SCALE_REFERENCE.md` stays the sole dimensional authority.

Your mechanism choice — **proportional geometry + world-space material** — is confirmed by the spec's own
authoring intent and stands. Still write the five-way weighing into the PR body.

## Next actions, in this order

**1. The cold-key measurement — `[unmeasured]`, and it may reshape everything after it.**
What an 8u block actually receives from the `cf1c98c` cold key, at the **centreline** versus at the
**rails**. Nobody has this number. A 64u ribbon's middle and its edge are very different places to be a
near-black coated body, and if an untreated M2 body reads as a black void that is a **finding that
reshapes the seam and wear work** — not a bug to fix. Units and method into `LANE-FACTS.md`.

**2. The visual gate — you have never seen a single pixel of this.** Chrome is yours; the other lane is
idle and will not contest the tab. Create your OWN foreground tab (`tabs_create_mcp`) and pass its `tabId`
on every call. **Never judge from a tab that has never been visible** — it reports
`visibilityState: "hidden"`, rAF never fires, the canvas stays black while the DOM panels render fine, and
a rAF probe that HANGS the evaluate IS the diagnosis. Judge with bloom on and off.

**3. `[unverified]` — the triplanar / world-space UV behaviour on the installed three + R3F.** Verify
against the installed version before it goes in the PR body or the code. Not from memory.

**4. Then the silhouette family** as board 28 describes it: restrained bevels, vertical seams, broad wear.

## Your M2-vs-board-28 finding — accepted, and it is mine to fix

You found `docs/ART_MATERIALS.md` M2 **omits wear entirely** while board 28 makes broad wear patches *the*
variation mechanism; that a reader of M2 alone builds a uniform family; that M2 does not say seams are
vertical nor exclude top-face returns; and that it names no instance seed. **No contradiction, three
omissions.** Correcting `ART_MATERIALS.md` is the supervisor's job — **do not edit it**, and never edit
anything under `docs/art-direction/`.

Carry the one misread risk you identified: M2's "Destructible variant" paragraph describes recessed
fractures with M7 inside; board 28 rejects fissures *"on this family"*. Different family members, no
collision — but do not let it pull fractures onto the sealed block.

Board 28 sets no numbers at all, so M2's 0.45–0.60 and metalness 0 stand unopposed. **Open and
unmeasured:** wear "varying sheen" needs a roughness *spread*, and whether the worn end stays inside 0.60.

## Traps, paid for

- **The lint comment-ratchet fires on TOUCHED files.** A one-line comment added to an existing file costs
  a deletion somewhere. It rejected the first pass at `0eb7947` for gaining 5 comment lines.
- `.claude/lane/.gitignore` did not pre-exist; it does now.
- Board 10 is relabelled "(SUPERSEDED)" in the picker, not deleted.

## Scope fence

Your deliverable is the block's own visual plus the instrument. **Wiring it into the game's instanced
blocks is a separate integration step after this lands.** `LETHAL_SURFACE` is still `emissive: '#ff2740'`
red (`track-materials.ts:35`) with a comment deferring the retone to this task — that retone is the
**integration** step, correctly deferred; leave it alone. Escalate to the supervisor, never the user.
