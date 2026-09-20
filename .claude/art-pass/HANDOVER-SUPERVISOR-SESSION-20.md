# Supervisor handover — session 20 (2026-09-20)

## What this session did

Closed the debug-panel bug that had blocked every sweep, **merged #142**, found that the deck's washout is
on none of the axes the panel was built to sweep, and killed the frame-tap plan.

## #142 is MERGED — `2b9dc6b` on `dev`

Squashed. Verified before merging that `refs/pull/142/head`, `origin/art/track-slice2` and the SHA the lane
ran the full gate at **all agreed at `0a64e40`**, and that the 2-dot diff against dev reverted nothing.

Contents: the owner-dialled chase camera + ADR-011, the debug panel, the synchronous-notify fix, and the
doubled boundary rail.

**`art/track-slice2` was deliberately NOT deleted** — the lane's worktree is on it and its unit-4 stack is
based on it. That base is now a squashed-away branch, which is the exact shape that silently deletes dev
work on merge. The lane has been told to rebase onto `2b9dc6b` and check with a **2-dot** diff
(`git diff origin/dev HEAD`), because the 3-dot form hides it.

## Unit 2 — SOLVED. It was a permanent latch, not a subscription problem.

Old `notify()`: `if (pending) return; pending = true; requestAnimationFrame(...)` — and `pending` was
cleared **only inside the rAF callback**. A hidden tab never runs rAF (measured: free-running counter 0
across four calls — dead, not throttled), so `pending` latched `true` **forever** and every later `notify()`
short-circuited, *including after the tab returned to the foreground*. One backgrounding poisoned the store
for the life of the page.

`setDebugTuning` does `applyCamera()` — a synchronous mutation of the `CHASE` singleton that
`updateChaseCamera` reads every frame — **then** `notify()`. So the camera knobs kept working past the
short-circuit. **"The camera knobs work" was never evidence the store was healthy; it was evidence of the
opposite shape.** Two sessions went into hypothesising where the *value* stopped when nothing was
re-rendering at all.

Verified fixed at `868d5f8` in a hidden tab, driven through the app's real sliders: bloom 1.2→0.4, floor
envMap 1→0.25, ambient 1→1.8, camHeight 7.5→9. All four panel DOM values moved.

## The finding that re-aims the art work

Deck material: `metalness 1`, `roughness 0.42`, `color ffffff`, **`envMap null`**, **`emissive c8d0d8` @
`emissiveIntensity 0.05`**.

- `emissiveIntensity` 0.05 → 0 **blacks the deck out**. Dominant term.
- `envMapIntensity` 0→2, `AmbientLight` 1→0, `DirectionalLight` 1.6→0: **no visible change, any of them.**

**The panel's three "washout cause" knobs do not control the washout.** The old bloom/deck/ambient sweep is
dead — do not run it. The deck being self-lit is the art direction working as intended (the track lights
itself from its own emissives); the live question is **level and colour**, and `c8d0d8` is a cool grey-white
in a marigold-primary direction. Owner ruled: put `emissiveIntensity` + emissive colour on the panel and he
dials them himself.

## Frame-tap is dead as a plan, not as code

Mount-then-hide **answers 504**: mounted visible (canvas 3456×1882, `window.__ART_LAB` present), forced
hidden via a second tab (canvas and `__ART_LAB` both still there), curl → 504 in 0.26 s, no file. A
**never**-visible tab never mounts R3F at all (canvas 300×150, rAF 0); `resize_window` did not fix it.

Caveat the lane carried honestly: no same-session visible-tab control for that curl, so "504 means hidden"
is strong but not airtight. `[unmeasured]`

**Plan every visual gate around a visible tab. Stop spending on frame-tap.** The README's "reload and tap
again" remedy addresses a *different*, intermittent fault and does not apply.

## Closed so nobody re-opens them

- **The lab's `DirectionalLight` is NOT a key-light violation.** Traced at source: it is `StarLight`,
  reaching `/art-lab` only via `TunableSky` → `DeepSpaceSky`, and its own doc comment says why — "a
  PMREM-convolved cubemap cannot hold a small hard highlight — the rig does the soft rim, this does the
  crisp one." It is the star, sanctioned by `03-lighting/README.md` §1a ("barely touches the track"), and
  it is lab-only: `/game` still mounts no rig at all.
- **Unit 2b retired on first-hand evidence** — panel `envMapIntensity` 0 and 2 both landed on the live
  material. R3F applies the prop; no `<primitive object>` in the path.
- **Duplicate-module doubt confirmed but instrumentation-only** — see the standing rule below.

## Two instrument rules that each cost a unit — now in memory

1. **Drive the app's own DOM elements; never `await import(...)`.** Under Vite HMR the app runs
   `/app/dev/x.ts?t=…` while a bare dynamic import returns the unversioned URL — a **second module
   instance**. It half-works, because singletons the duplicate imports resolve to the same object, so a
   control routed through one passes under a duplicate and proves nothing. (This is why my proposed
   `camHeight` control was wrong; the lane caught it.)
2. **Check `gl.info.render.frame` is advancing before believing any A/B screenshot.** It sat frozen at
   57951, 0 frames in 1 s, while the lab's run button read "running".

Memories written: `probe-the-app-not-a-dynamic-import`, `rerender-latch-not-the-subscription`.
`frame-tap-unfocused-capture` corrected — its "retires the focused-tab constraint" claim was false.

## Track slices — 3 remain, order is swap → light → surface → gaps (D7)

| Slice | State |
|---|---|
| ~~0 — honest frame~~ | merged, #131 |
| ~~1 — `TrackFloor` becomes the game's floor~~ | merged, `deadf9f` (#140) |
| **2 — the rail + the emitter array** | in flight, ~1 of 3 items done |
| 3 — floor finish: panel language + board-25 wear, one shader | not started |
| 4 — gaps | not started |

**Slice 2 still owes:** the **retone to marigold** — that strip is **reference intensity 1.0** for the whole
scene's marigold scale and must **not** be compensated for bloom washout, because task 3 inherits it — and
the **emitter array** (fixed-size K-nearest via `onBeforeCompile`; fixed size is load-bearing, a varying
light count recompiles the shader mid-race).

**None of this session's work was slice-2 art.** Camera, panel and notify were all detour — real value, but
the slice is where it was. The deck-emissive knobs are **slice 3** tooling, not slice-2 progress.

## Parked for the owner — ONE sitting, once both are rendered

1. **The M1 metalness pair**: 1.0 / 0.35–0.50 against the shipped 0.12 / 0.62. Not settleable on paper — the
   sky measures ~linear 0.01 as an IBL source, so at 1.0 everything the specular misses goes black. That may
   be the intended "no fill, shadow sides go black", or may read as a void with a stripe.
2. **Rail breaks over full gaps.** Board 24 wants the outer boundary continuous; the in-code justification
   is that the break is what makes a gap read at the shallow chase angle. Both defensible. Not a lane call.

Render both, decide neither.

## Still owed / unowned

- **Fly 7.5u through 8u pillar fields with `fly` ON.** Unpaid gate. ADR-011 says so; #142's body says so.
  Do not let anyone claim it passed.
- **Occlusion at 7.5u** — deferred, not solved. Option set already narrowed: semi-transparent fade is the
  right family (v2 §8's own proposal) but transparency does not write depth and interacts badly with the
  single global `<Bloom>` over HDR emissives; **removing the object is rejected** (pillars are lethal,
  collision is continuous float-AABB, so culling builds an invisible wall). Third option, cheapest, not yet
  ruled out: touch no geometry — `lookAhead`/`lookAtLift`/`fov` plus a distinct emissive crown that lets a
  pillar be read by its top. Design-shaped; wants a brainstorm, not an issue yet.
- **`docs/codex-reconcile` @ `84291fb`** — committed, unpushed, no PR, since session 17. Unowned.
- The shared checkout's local `dev` is behind `origin/dev`; fetched, not switched.

## Lane state

`track-slice2-d8` (herdr name **`track`**) is live, cleared twice this session, briefed on unit 4 off a
rebased stack. Its self-contained handover is `.claude/art-pass/02-track/HANDOVER-UNIT-2.md` **on the branch
in its own worktree** — write lane docs there, never the shared checkout.
