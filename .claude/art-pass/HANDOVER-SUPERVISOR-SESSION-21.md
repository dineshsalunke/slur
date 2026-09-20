# Supervisor handover — session 21 (2026-09-20)

## What this session did

Settled the comment rule repo-wide, landed the deck's brightness knob, and took slice 2's marigold
retone from "blocked on an owner ruling" to a PR awaiting one eye-gate.

## `dev` is at `3cbf54a`

```
3cbf54a docs: settle the comment rule in one place, and stop the Effect block from coming back (#144)
b47ccb8 art(dev): put the deck's real brightness knob on the panel (#143)
2b9dc6b art(track): slice 2 boundary retone, ADR-011 chase camera, and a live tuning panel (#142)
```

Both merges had `refs/pull/N/head` verified against the SHA each was gated at, immediately before
merging, and a **2-dot** diff checked for revert-shaped deletions.

## #144 — the comment rule, now in one place

The bar lived in `CONTRIBUTING` §3 and in memory but **not in `CLAUDE.md`**, where the word "comment"
did not appear. So each lane restated it by hand and one site still mandated what the bar forbids.

`conventions/react-router.md` required every `useEffect` to carry a comment naming the external system
**and** which of five cheaper idioms it rejected and why. That cannot fit `CONTRIBUTING` §3's "1–2 plain
lines" and cannot pass `scripts/check-comment-ratio.mjs`. It is the literal shape of the "JUSTIFIED
EFFECT" blocks the owner had removed.

**`CLAUDE.md` non-negotiable #15** is now canonical and settles three things explicitly: the Effect
comment is **one line naming the outside-React system, and that is the whole comment** (rejected idioms
→ PR body); **#14's rationale** is one line in code, the ≥5-candidate weighing in the PR; and **"match
the surrounding code" never extends to comment density**. `conventions/react-router.md` carries a dated
*superseded* note so the inline version is not reinstated as a "regression fix".

⚠️ **The shared checkout's `dev` was stale twice this session** (`1807bc0`), and my first comment-rule
inventory was read off it — four of six proposed edits targeted text that no longer existed. **Read
`git show origin/dev:<path>`, or work in a fresh worktree. Do not trust the shared checkout's files.**

## Slice 2 marigold retone — **PR #145 open, not merged**

`art/marigold-retone` @ `f217937`, off `3cbf54a`. Four files, all `apps/client`.

**The blocker was resolved, not deferred.** `BOUNDARY_SURFACE`'s comment claimed the retone waited on an
owner ruling about which material sheet is canonical. It did not:
`docs/art-direction/golden-reference/DIRECTION.md` — the appearance authority — says *"Numeric
intensity/roughness presets are not measured acceptance targets and should be tuned to the visual
hierarchy."* No competing number exists, so `ART_MATERIALS.md` §3's *"Reference intensity **1.0** — the
track boundary strip defines it"* is a scale, not a target. The two agree. Stale comment deleted.

**What shipped:** `MARIGOLD_REFERENCE_INTENSITY = 2.0` and `MARIGOLD_EMISSIVE = '#F59A24'`, with
`BOUNDARY_SURFACE` built from them. Both are **byte-identical to the literals they replace**, and the
non-DEV path reads the constant — verified in the diff. **No visual change ships**, which is why this
can merge ahead of the eye-gate. `ENVIRONMENTAL_MARIGOLD_FRACTION = 0.25` and its derived intensity land
unconsumed, ready for the monolith lane. `LETHAL_SURFACE`, `DRAG_SURFACE`, `FLOOR_EMISSIVE` and the
emitter array are untouched. No bloom compensation applied.

Gate green: typecheck · lint (3 pre-existing `noExcessiveLinesPerFile` warnings in `packages/shared`;
canvas-isolation 8/8; ratchet 4 files, none gained) · 75/75 + 66/66 + 4/4 · build.

### Two things gate the merge

1. **An open question I raised, unanswered when this was written.** `TrackBoundary` now calls
   `useDebugTuning()` **unconditionally** and branches only on the *result*. #142's prod check found
   `debug-tuning.ts` surviving into `build/client` as an **inert** default-values literal with no
   mutation path. A game-scene component importing the hook may make it live — pulling the
   subscribe/notify machinery into prod and giving `TrackBoundary` a subscription that can never fire.
   I asked the lane to **measure it from a real `pnpm build`** rather than accept my inference. If it is
   tree-shaken, merge as-is; if not, move the DEV branch so the hook is not called in prod at all.
2. **The owner eye-gate.** Not passed. See below.

### The eye-gate, and the substitution I approved

The brief said *render both, decide neither*. The lane shipped **one live DEV-only slider** instead
(TUNING → "marigold reference · boundary", labelled pre-bloom, `import.meta.env.DEV`, emitted by
`debugTuningSource` as committable source), following #143's deck pattern. **I approved this** — the
owner drags 2.0 ↔ 1.0 in one frame instead of reloading two branches, the comparison is continuous
rather than two points, and it pre-empts his call *less* than two builds would.

**Still needs a genuinely visible tab.** The lane's `:5203` tab came up `visibilityState: "hidden"`,
canvas 300×150, `__ART_LAB` undefined. A `computer` screenshot call forced the mount (3456×1994, panel
rendered correctly including the new slider) but the scene stayed black with
`gl.info.render.frame` frozen at 12 across 800 ms — **mounted, non-rendering**. The lane stopped there,
correctly. This is the documented dead end, not a new one.

## Live clients — serialise them, do not race them

| Port | Worktree | For |
|---|---|---|
| `:5202` | `../slur-worktrees/deck-emissive-knobs` | owner dialling the deck emissive (#143's knobs) |
| `:5203` | `../slur-worktrees/marigold-retone` | the #145 eye-gate |

Only **one visible tab renders at a time**, so these two gates must be taken in sequence. "Foreground
Chrome" is not actionable without naming which tab.

## The 4u tile question — owner decision, open

The owner wants deck tiles at **4u** and is right that it is texture-only: collision is continuous
float-AABB, the sim never reads `CELL`, `MIN_CLEAR = 7u` is unaffected. Geometry confirmed —
`halfWidth: 32` → a 64u ribbon → exactly 16 cells of 4u across.

`ART_MATERIALS.md` currently says **"It must not be built at 4u"**, reasoning that a 4u joint pitch
draws a line on **every cell boundary**, rendering the *"visible runtime lanes"* the direction forbids
(*"no racing line, no safe-route glow, no fully glowing tile grid, no marked driving lanes"* —
`golden-reference/DIRECTION.md`). Board 24 *does* show *"16 across 64u"*, i.e. 4u, but
`DIRECTION.md` says the ruler is *"not collision quantization"* and *"the generated image does not
reliably depict that exact count"*.

**The counter-argument I gave the owner, and would stand behind:** that reasoning is about *longitudinal
stripes*, not about tiles. A tile has **transverse joints too**, and the forbidden read needs
*uninterrupted* lines running to the vanishing point. **Breaking bond** — offsetting alternate rows like
brickwork — removes the continuous longitudinal seam entirely while keeping every tile exactly 4×4u, and
is what real metal decking looks like. Preferred over tuning joint contrast, because it kills the
failure mode structurally rather than relying on a ratio holding up at distance and speed.

Caveat to carry: 4u is fine at that width, but a fine pitch can **alias into shimmer** on the far deck
at speed and shallow angle. That is a mip/aniso problem, not a reason to change the size.

**If the owner confirms 4u:** `ART_MATERIALS.md` is a Claude-owned engineering sheet and his to override
— update it with an explicit *decisions + departures* section quoting the wording it changes, and hand
it to him to paste into ChatGPT. **Never edit `docs/art-direction/` directly.**

This is **slice 3** work (floor finish: panel language + board-25 wear, one shader), the next slice after
the retone. Design tension to settle before any shader is written: panel divisions are **low-contrast
value/material contrast, not lines** — *"if the deck starts reflecting recognisable shapes it has gone
too low"* on roughness.

## Cross-lane finding, recorded so it is not lost

`placeholder-monolith.tsx` imports `BOUNDARY_SURFACE` — **gameplay tier** — for an **environmental**
subject. Its own comment flags it; the lane correctly took no action. It is the first real consumer of
`ENVIRONMENTAL_MARIGOLD_INTENSITY` whenever the monolith lane opens. This is exactly the drift the tier
split exists to prevent.

## Instrument hazards — three, one new this session

1. **NEW: yield a task after `dispatchEvent` before reading.** `notify()` is synchronous; React's flush
   is not. An immediate read returns **stale values, indistinguishable from an inert knob** — both
   working deck knobs were nearly filed as dead on this read. 300 ms sufficed. Memory:
   `react-flush-not-sync-after-dispatch`.
2. **Drive the app's own DOM; never `await import(...)`** — under Vite HMR that returns a second module
   instance that half-works, because singletons resolve to the same object.
3. **Check `gl.info.render.frame` advances** before believing any A/B screenshot.

Frame-tap is dead as a plan. Plan every visual gate around a genuinely visible tab.

## Still owed / unowned

- **Fly 7.5u through 8u pillar fields with `fly` ON.** Unpaid gate — ADR-011 and #142's body both demand
  it. Do not let anyone claim it passed.
- **Slice 2's emitter array** — fixed-size K-nearest via `onBeforeCompile`. Unstarted. **Fixed size is
  load-bearing:** a varying light count recompiles the shader mid-race.
- **Occlusion at 7.5u** — deferred. Semi-transparent fade is the right family but transparency does not
  write depth and interacts badly with the single global `<Bloom>`. **Removing the object is rejected**
  (pillars are lethal, collision is continuous float-AABB → culling builds an invisible wall). Cheapest
  unruled-out option: touch no geometry — `lookAhead`/`lookAtLift`/`fov` plus a distinct emissive crown
  so a pillar reads by its top. Wants a brainstorm, not an issue.
- **Owner-parked pair, one sitting, once both are rendered:** the M1 metalness pair (1.0 / 0.35–0.50 vs
  the shipped 0.12 / 0.62 — the sky measures ~linear 0.01 as an IBL source, so at 1.0 everything the
  specular misses goes black) and **rail breaks over full gaps** (board 24 wants the outer boundary
  continuous; the in-code justification is that the break is what makes a gap read at the shallow chase
  angle). Render both, decide neither. Untouched.
- **`docs/codex-reconcile` @ `84291fb`** — committed, unpushed, no PR since session 17, unowned. 108
  files, **+757/−1936**, every path under `docs/art-direction/`, which `CLAUDE.md` declares read-only
  for Claude. Needs an owner decision.

## Worktrees

**Do not remove `../slur-worktrees/track-slice2`** — the lane's herdr pane has it as its shell cwd;
removing it pulls the floor out from under a live agent. Its branch is squashed away, so do not *work*
in it either. `art/deck-emissive-knobs` and `art/track-slice2` are both squashed away: never reuse them,
and never rebase off them — the replay walks history that no longer exists. New work gets a fresh
worktree off `origin/dev`.

## Lane

`track-slice2-d8` (herdr name **`track`**), cleared twice this session. Its cold-start docs are
`.claude/art-pass/02-track/LANE-STATE.md` and `.claude/art-pass/02-track/BRIEF-MARIGOLD-RETONE.md`, both
in the **shared checkout** so they survive its context and its worktree.

---

## ADDENDUM — #145 merged as `563a19f`; my bundle concern was wrong

`dev` is now at **`563a19f`** (`art(track): make the boundary strip the marigold reference, not a
hand-typed number (#145)`). The "two things gate the merge" section above is superseded on point 1.

**I was wrong about the prod bundle, and the lane measured it rather than accepting my inference.**
`useDebugTuning()` was **already** called by two game-scene components on `dev` before #145 —
`lighting.tsx:8` and `track-floor.tsx:148`, verified by `git grep` and neither touched by the PR. So the
store's subscribe path was already live in `build/client`; #145 adds a **third caller of a shape that
had already shipped twice**. #142's "inert default-values literal" finding went stale **on dev**, not in
this branch.

**Severity, measured from a real build** (`build/client/assets/track-boundary-BbjCTL6-.js`, 5061 B):
the value path is clean — the DEV ternary constant-folds to the literal `emissiveIntensity:2`, so there
is no behavioural difference in prod. And the subscription is not merely ignored, it is **unfirable**:
`notify()` is tree-shaken (no iteration over the listener `Set` anywhere in the chunk),
`debugTuningSource`, `applyCamera`, the setters and the reset are all absent, and no chunk contains the
panel. Cost is one `Set` insert plus `useSyncExternalStore` bookkeeping per mount, for three components,
against a `Set` nothing can ever iterate.

**Decision: no follow-up unit. Do not re-raise this.** Fixing `TrackBoundary` alone would fix one of
three callers, leave the bundle in an identical state, and make it the one sibling that branches
differently. The real fix is not a moved ternary — **hooks cannot be called conditionally**, so avoiding
the call in prod means splitting each of the three components into tuned and plain variants and
branching at the element level. That is a refactor across `track-floor.tsx`, `lighting.tsx` and
`track-boundary.tsx`, it touches the deck component the owner is actively dialling on `:5202`, and it
buys nothing measurable while the listeners are unfirable. If it is ever done it is one unit over all
three callers at once, justified on something other than bundle cost.

**Still outstanding, unchanged:** the owner eye-gate on the marigold reference (`:5203`, the TUNING →
"marigold reference · boundary" slider, 2.0 ↔ 1.0, serialised against the owner's `:5202`). It gates the
*choice of value*, not the merge — the merge shipped no visual change.

**Method note worth keeping:** twice this session I held or proposed work on an inferred fact and the
first-hand measurement reversed it — the stale shared checkout, and this bundle read. Asking the side
with the context to measure, rather than acting on the inference, was right both times.
