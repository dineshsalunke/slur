# Supervisor handover — session 24 (2026-09-20)

## What the owner decided, and it reframes the whole boundary task

**The rail stands OUTBOARD. No drawn element may consume playable width.** ADR-012, merged-pending in
**PR #152** (`docs/rail-outboard`, `b54142c`). The rail as decided: **1u wide × 1u tall, 0.15u chamfer
on the long edges, centred pivot ±32.5** — his words: *"take a 1u box, chamfer its edges (0.15u), place
it at `track_width/2 + 0.5u`, and that's it."*

**The bug, and it was never a shape question.** `BOUNDARY_W` fed *both* the boundary mesh and
`track-floor.tsx`, where `deckL = isOuterEdge( x0 ) ? x0 + w : x0` generated the **deck's own top face
inset by the trim width**. The width slider shrank the deck and repainted the reclaimed floor as
border. The sim's floor spans ±`HALF_WIDTH` unconditionally (`sim/track.ts:133`), so the deck *drew*
62u while the player *flew* 64u. Not a narrower track — a render disagreeing with the physics, an edge
marker drawn somewhere other than the edge.

**He said it three times before it landed and was rightly furious.** Three sessions went into tuning
bevel shapes inside the wrong frame, including a three-way A/B whose three options were all
consequences of the same premise. Do not re-open "which shape" — that question is closed.

## State

- **PR #152** — docs. ADR-012 · `ART_SCALE_REFERENCE.md` §1 + new §1a · `ART_MATERIALS.md` M7 rewritten ·
  `INDEX.md` new "Geometry / the playable read" standing facts · `02-track/README.md` · new
  `02-track/PASTE-TO-CODEX-rail-outboard.md`. Lint green. **Unreviewed, unmerged.**
- **PR #151** — `art/boundary-three-way`, **DRAFT/held**, now at `6855ee6`: A/B/C **plus variant D**,
  the outboard rail. Gate green (typecheck · lint · shared 0 fail / client 82 / server 4 · build). Its
  description still claims the dead three-bevel premise — **rewrite before it leaves draft.**
- **PR #149** (corner bevel, `a2bbb6b`) — **probably obsolete**: it bevels a corner that ADR-012
  deletes. Recommend closing rather than gating. **#150** (bloom knobs, `9ec40f8`) — independent, gate
  green, still unpaid, two minutes of his eye.
- **`:5206`** = A/B/C/D, worktree `../slur-worktrees/boundary-three-way`. **`:5205`** = #149/#150.
  Both are the owner's tabs; only one renders at a time.

## Open, in his hands

1. **The ship placeholder penetrates the rail** — his screenshot, D at width 3 / wrap 2. The sim
   already clamps the **wing**: `sim/step.ts:86`, `limit = t.halfWidth - t.halfW`, *"so the visible
   hull never pokes past the track edge"*. So a correct render has the hull kiss x=32 and stop.
   Hypotheses handed to the lane, unanswered: (1) `/art-lab`'s placeholder box is drawn wider than the
   `halfW` the sim clamps against — likeliest; (2) D's band starts inboard of 32 despite its label;
   (3) the clamp reads tuning `halfWidth` while the rail is drawn against `HALF_WIDTH`. **If (1): the
   fix is to size the placeholder from the real footprint, and say so — a placeholder lying about hull
   width will keep producing false edge-contact reads for the rest of the art pass.**
2. **Flush vs raised is his call with Codex, not ours.** A 1u bar standing on the deck is a raised
   rail; board 24 panel 02 excludes *"raised rails or ornamental edge machinery"*. The fallback is the
   same bar at **wrap 0** — coplanar, outboard, takes no width. `PASTE-TO-CODEX-rail-outboard.md` is
   written for him to paste. **Never resolve this unilaterally.**
3. **The lane flagged one thing a test cannot settle:** at wrap 0 the band abuts the deck at exactly
   ±32 — no overlap, no z-fight by construction — but coplanar-and-abutting can still show a hairline
   on some GPUs. **Wants one look at a grazing angle before flush is called the answer.**
4. **I never answered his chamfer question** — all four long edges, or only the two top ones he can
   see. Ask.

## Lane

`track-slice2-d8`, herdr name **`track`** (SendMessage resolves as `track-slice2-d8 [b9952f]`, the bare
name does not). **At ~166k and asking to be cleared** — it closed its unit cleanly: committed, pushed,
gate green, stack relaunched, no Chrome tab taken. Clear it with
`herdr agent send-keys track / c l e a r enter`, then re-task by SendMessage with a self-contained
brief. Its live brief is `.claude/art-pass/02-track/BRIEF-DECOUPLE-RAIL-FROM-DECK.md` — **revised, and
the revision matters**: the first version cited a `BOUNDARY_H` comment that exists only on
`art/boundary-bevel`, not on `dev`. Cite line numbers against the branch you are on and say which.

**Its worktree `../slur-worktrees/track-slice2` is stale and must NOT be removed** — its own herdr
shell is cwd'd inside it. It dies at teardown.

## Carried forward, untouched again

Fly 7.5u through 8u pillar fields with `fly` ON (ADR-011, #142) · `MARIGOLD_REFERENCE_INTENSITY = 4.0`
(he dialled 4.1 in today's shot) · slice 2's fixed-size K-nearest emitter array · occlusion at 7.5u ·
the M1 metalness pair and rail breaks over full gaps · slice 3 floor finish · the `CONTRIBUTING.md`
trailer wording · **the two divergent `docs/art-direction/` snapshots, neither on `dev`** (the shared
checkout's dirty 17 files vs `docs/codex-reconcile` @ `84291fb`, ~1723 lines more) — his call, and a
`git pull` in the shared checkout will collide with it.

## ⚠️ Shared checkout

Still `1807bc0`, 18 behind `origin/dev` (`bb59350`), dirty across 17 tracked files. **Anything read
there may be stale** — read from a worktree or `git show origin/dev:<path>`.

---

## Late additions (end of session 24)

**Item 1 above is CLOSED.** It was hypothesis (1), measured: `/art-lab`'s `ship-box.tsx:7` hardcodes
`SIZE = 3` → visual half-width **1.5**, against the Fighter's real `halfW` **1.3** (`constants.ts:92`,
`challenger`→`fighter` takes `DEFAULT_TUNING` verbatim). The clamp parks the wing at 30.7, so the real
hull edge lands on **exactly 32.0** — sim correct, comment accurate. The placeholder overhung 0.2u per
side, and the same in z. Fixed `dce423c`: sized from `halfW`/`halfL` off the entity inside the existing
`useFrame`. Height stays arbitrary — **there is no `halfH` in `FlightTuning`**, so a box that looks too
tall means nothing while one that looks too wide is a real signal. Hypotheses (2) and (3) ruled out by
measurement: the band starts at exactly 32, and `DEFAULT_TUNING.halfWidth` / `HALF_WIDTH` are both 32
with no drift.

**NEW, and it is the owner's call — zero margin at the rail's inner face.** His 1u bar centred at ±32.5
spans `[32, 33]`, putting the rail's inner face at exactly where the clamp parks the hull's wing. The
geometry is exact, but a hull stopping at 32.0 against a marigold face starting at 32.0, at marigold
4.1 under bloom, will **bloom-bleed over the wing** whenever he holds the edge and read as clipping
though nothing penetrates. Three options, none taken: move the rail's inner face out a touch; give the
clamp a small margin (**a sim change** — weigh carefully); or accept the graze as the intended "riding
the rail" look.

**`art/boundary-three-way` is now at `dce423c`** (two commits: `6855ee6` variant D + cap profile +
`emitEdge` refactor + corner-contract header deleted; `dce423c` placeholder footprint). Gate green on
`dce423c`. A/B/C byte-identical to base `1b98357`.

**Still not built on D:** the **0.15u chamfer** on the long edges, and pinning the defaults to 1u × 1u —
width/wrap remain sliders at the inherited 1.0/1.0. *[unmeasured]* whether a chamfer survives the
comment ratchet's budget in `track-boundary.tsx`.

**PR #151's description still describes three bevel shapes — rewriting it is the supervisor's job, not
the lane's, and it is not done.**

**The lane was cleared at the end of this session** after reporting a seam at ~174k. It took no new
work and left the tree clean, pushed, stack up on `:5206`/`:2606`, no Chrome tab taken.

---

## Owner's answers, end of session 24 — these are decisions, treat them as settled

- **Chamfer: TOP long edges only.** *"Only the top ones i feel."* 0.15u. The lower/outboard long edges
  stay square — they face away from the chase cam and buy nothing.
- **wrap 0 (flush) READS WELL — he flew it.** *"Tried wrap 0 and it looks good as well."* The hairline
  worry from the lane did not materialise at his angle. Flush is a live, validated option; it is not
  yet the final answer, because →
- **Flush vs raised stays OPEN, deliberately.** *"lets keep the option open for now, we will finalize
  later."* Keep `wrap` on the panel reaching 0 and do **not** pin a height default as final.
  `PASTE-TO-CODEX-rail-outboard.md` stays unsent until he settles it. **Do not resolve this.**
- **Zero margin at the rail's inner face — DEFERRED until the chamfer is in**, on my recommendation and
  with his question answered. The concern is optical only: hull wing parks at exactly 32.0, rail inner
  face starts at exactly 32.0, nothing penetrates, but marigold at ~4.1 through bloom spreads in screen
  space and washes over the wing, reading as clipping. A top-edge chamfer replaces the hard inner
  corner — the most bloom-prone feature — so the bleed must be re-judged after it lands, not before.
  Options when he does judge it: move the rail's inner face out a touch (**pure art**); give the clamp
  a margin, e.g. wing at 31.9 (**a SIM change — narrows the racing surface, shared code, avoid unless
  the art option fails**); or accept the graze as the intended "riding the rail" feedback.

**Next build unit for the lane:** the 0.15u chamfer on the top long edges of D, nothing else. Then he
flies the edge and settles the margin question.

### Correction + close-out on the margin question (owner, same session)

**What he originally highlighted was the real 0.2u overlap, not the bloom.** That is fixed (`dce423c`).
He has since flown the bloom graze deliberately: **it reads fine and is ACCEPTED.** No action.

**Moving the rail's inner face out is POLISH-LATER, and conditional:** *"i wouldn't mind moving the
rail's inner face a bit out unless it doesn't affect the lighting or the bloom."* That condition picks
the implementation:

- Inner face out with the outer face fixed **narrows the band** → less emissive area → dimmer rail and
  less bloom. **Fails his condition. Do not build this one.**
- **Shift the whole bar outboard** (inner 32 → 32.1, outer 33 → 33.1) keeps width, emissive area and
  bloom identical and only moves the glow further from the hull. **This is the one that satisfies him.**

So it is an **offset** knob, not a width knob — one constant, not a shape change. Not scheduled; it
belongs with the later polish pass, and the clamp-margin (sim) option is off the table since the
optical concern it existed to solve has been accepted.

---

## FINAL STATE — session 24 close

### Merged / closed this session

- **#152 MERGED** → `origin/dev` is now **`1b2e71f`**. ADR-012 and the invariant are live in the docs:
  `DECISIONS.md` (ADR-012) · `ART_SCALE_REFERENCE.md` §1 + §1a · `ART_MATERIALS.md` M7 ·
  `.claude/art-pass/INDEX.md` standing facts · `02-track/README.md` ·
  `02-track/PASTE-TO-CODEX-rail-outboard.md`. Head SHA verified against `refs/pull/152/head` before
  merging. Worktree removed, branch deleted.
- **#149 CLOSED** — superseded by ADR-012; it bevels a corner that no longer exists. Its visibility
  analysis (a downward flare is hidden whenever `wrap ≥ 0.117 × width`, distance-independent) is what
  ruled out the flare shape, so it earned its keep. Branch `art/boundary-bevel` left intact.

### Open PRs

- **#151** — `art/boundary-three-way` @ **`dce423c`**, **DRAFT**, gate green. A/B/C/D; A/B/C
  byte-identical to base `1b98357`. **Its description still describes three bevel shapes — rewriting it
  is the supervisor's job and is NOT done.** Rewrite before it leaves draft: it now carries variant D
  (the outboard rail), the gap-end cap profile, the `emitEdge` refactor, the deleted corner-contract
  header, the ADR-012 acceptance test, and the `/art-lab` placeholder-footprint fix.
- **#150** — `art/bloom-input` @ `9ec40f8`, CLEAN, gate green, prod path untouched. **Still unpaid by
  the owner.** On `:5205`. Independent of everything above; two minutes of his eye.

### The one build unit queued

**The 0.15u chamfer on D's TOP long edges. Nothing else.** Then the owner flies the edge. *[unmeasured]*
whether it survives the comment ratchet's budget in `track-boundary.tsx`.

### Stacks

`:5206`/`:2606` — A/B/C/D, worktree `../slur-worktrees/boundary-three-way`. `:5205` — #150's worktree
`../slur-worktrees/bloom-knobs`, still on the closed `art/boundary-bevel`; **worth renaming or rebasing
onto `art/bloom-input` now that #149 is closed.** Only one Chrome tab renders at a time; both are his.

### Lane

`track-slice2-d8` / herdr **`track`** — cleared, idle, taking no work. SendMessage resolves as
`track-slice2-d8 [b9952f]`; the bare name does not. Its brief:
`.claude/art-pass/02-track/BRIEF-DECOUPLE-RAIL-FROM-DECK.md`. **`../slur-worktrees/track-slice2` must
NOT be removed — its herdr shell is cwd'd there.**

### Still carried, untouched

Fly 7.5u through 8u pillar fields with `fly` ON (ADR-011, #142) · `MARIGOLD_REFERENCE_INTENSITY` (he ran
4.1 today; committed value unchanged) · slice 2's fixed-size K-nearest emitter array · occlusion at
7.5u · the M1 metalness pair and rail breaks over full gaps · slice 3 floor finish · `CONTRIBUTING.md`'s
false trailer-hook claim · **the two divergent `docs/art-direction/` snapshots, neither on `dev`** —
his call, and a `git pull` in the shared checkout will collide with it.

### ⚠️ Shared checkout

`1807bc0`, now **19 behind** `origin/dev` (`1b2e71f`), dirty across 17 tracked files. Read from a
worktree or `git show origin/dev:<path>` — it has already produced one wrong citation.

---

## ⚠️ LAST THING IN, AND IT CHANGES THE BUILD UNIT — the rail's real profile

The owner sketched the section he wants (2026-09-20, end of session). **It supersedes the "1u × 1u
chamfered bar" in ADR-012.** Full spec, with his numbers and the open parameters:
**`.claude/art-pass/02-track/RAIL-PROFILE.md`** — read it before briefing anything.

**The shape:** a metal extrusion with a **trapezoidal channel milled into its top**, the emissive strip
**seated in the channel** and standing slightly proud of the metal. An LED-in-an-aluminium-channel
section, two materials — metal body (M1), seated emitter (M7). **Not** a solid glowing bar.

**His numbers, "roughly, not to scale":** total width **4u** (occupies `[32, 36]`, mirrored), emissive
**3u**, leaving **0.5u of metal lip per side**. Inner face flush at `x = 32`. Channel narrows downward.

**ADR-012's invariant is untouched** — deck's top face still ends at exactly ±`HALF_WIDTH`, rail still
outboard. Only the rail's own section changed, so the merged docs stay correct; ADR-012's *dimensions*
line and `ART_SCALE_REFERENCE.md` §1's rail rows need updating to 4u/3u once the open parameters land.

**OPEN, needs him:** rail body height above the deck · channel depth · how proud the emissive stands ·
channel wall angle · skirt depth. He was asked; not yet answered.

**Consequences worth carrying:**
- **The queued build unit is no longer "the 0.15u chamfer on D's top edges".** That chamfer decision now
  applies to the metal body's outer top edge; the channel walls are already angled and are not a
  separate chamfer. Variant D (flat band) remains the right *instrument* for proving the invariant, and
  the A/B on `:5206` still stands, but the shipping shape is this profile.
- **The parked inner-face offset may be unnecessary.** The 0.5u inner lip occludes the strip's inner
  edge from a chase cam hugging the deck — the bloom-bleed this offset existed to soften is largely
  solved by the section. **Build the profile first, re-judge the offset after. Do not build the offset.**
- A 4u rail per side widens the visual ribbon 64u → 72u; and raised metal on the **far** rail occludes a
  band of far deck at the 7.5u chase height, which is what lateral position is read from at speed. Both
  want a look at speed, neither is a blocker.
