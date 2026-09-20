# Lane brief — put the boundary's geometry on the panel, so the owner can gate it against intensity

*Written by the supervisor 2026-09-20. Self-contained: you do not need to re-read the art package,
`INDEX.md`, or the handovers to do this. Everything load-bearing is quoted here.*

Base off fresh `origin/dev` (at or after `1819290`) in a **new worktree**. Do not reuse
`art/track-slice2` or `art/marigold-retone` — both are squashed away and rebasing off them replays
history that no longer exists.

---

## Why this exists

The owner took the marigold-reference eye-gate (PR #145's `:5203` slider) and came back with two
findings:

1. He pushed `MARIGOLD_REFERENCE_INTENSITY` from the shipped **2.0** to **4.0** and 4.0 "feels ok".
2. **"The line still feels thin — I think we should double the thickness of it."**

Finding 1 is not trustworthy as it stands, for two reasons, and finding 2 is why.

**The slider maxed out.** `DebugSlider` for `marigoldReference` is declared `max={ 4 }`
(`apps/client/app/dev/debug-panel.tsx:114`). He described 4 as "the extreme". He was judging against
the rail, not against a preference — we do not know whether 4.0 is his answer or the ceiling's.

**Thickness and intensity are the same knob at distance.** Far down the track the strip is sub-pixel;
what reads as line weight is bloom spreading total emitted energy, and widening the strip raises that
energy per unit track length just as intensity does. Shipping a doubled width *and* 4.0 is close to 4×
the energy he actually looked at. Width buys something intensity cannot only in the **near field** —
the metres beside the ship, where the strip genuinely subtends width and reads as an edge rather than
a glow. So the two must be judged **together, in one frame**, not sequentially.

## What to build

Three live DEV-only sliders on the existing TUNING panel, following the #143/#145 pattern exactly
(`import.meta.env.DEV`, emitted by `debugTuningSource` as committable source, committed defaults from
the real constants via `committed()`).

| Slider | Backing constant | Now | Suggested range | Why it is separate |
|---|---|---:|---|---|
| marigold reference · boundary | `MARIGOLD_REFERENCE_INTENSITY` (`track-materials.ts:64`) | 2.0 | **raise max to 8**, keep min 0, step 0.05 | the existing one; it is only the max that changes |
| boundary width | `BOUNDARY_W` (`track-geometry.ts:20`) | 1.0 | 0.25 – 4.0, step 0.25 | the **top face**, inset from the outer edge into the deck |
| boundary wrap | `BOUNDARY_H` (`track-geometry.ts:23`) | 1.0 | 0.25 – 4.0, step 0.25 | the band down the **outer side face** |

`BOUNDARY_W` and `BOUNDARY_H` are two different contributions to apparent thickness and they **swap
dominance with distance** — at the chase angle the top face foreshortens away far ahead while the outer
face stays closer to perpendicular, which is exactly why the wrap exists (its own comment: *"so the
strip turns the corner instead of lying flat and foreshortening away at the chase angle"*). Giving the
owner one combined "thickness" slider would hide the trade he most needs to see. Ship both.

## The part that is actually hard

Intensity is a material uniform; **width and wrap are baked geometry.** `emitBoundary` reads
`BOUNDARY_W`/`BOUNDARY_H` at build time, and `TrackBoundary` holds
`useMemo( () => buildBoundaryGeometry( track ), [ track ] )` over all ~400 segments.

So a live width slider means re-running the geometry build, and a range-input drag fires a burst of
events. Two things will bite:

- **Dispose the superseded `BufferGeometry`.** A memo that returns a new geometry per drag event and
  drops the old one on the floor leaks GPU buffers for the length of the drag. This is not optional.
- **Measure the rebuild before assuming per-event is fine.** 400 segments of quad pushing per
  `input` event may or may not hold 60fps. If it stutters, rebuilding on the *commit* edge rather than
  every `input` is a legitimate answer — a slider that updates on release still settles the question.

This is a **mechanism decision, so non-negotiable #14 applies**: enumerate at least five candidates,
weigh them, commit the winner with a one-line rationale in code and the full weighing in the PR body.
For the record, the axis I see is rebuild-per-event · rebuild-on-commit · throttle the rebuild ·
a vertex attribute marking the strip's inner edge with a uniform offset in `onBeforeCompile` (zero
rebuild, but shader complexity for a DEV knob) · accepting a coarser step so there are fewer distinct
rebuilds. **Do not treat that list as the answer** — it is me showing my work, and you have the
measurement I do not.

Whatever you choose: the **non-DEV path must read the plain constants**, with no rebuild machinery and
no slider state in it, exactly as #145 did.

## Constraints that do not move

- **The strip must stay flush.** Board 24 panel 02 excludes *"raised rails or ornamental edge
  machinery"*, and `ART_MATERIALS.md` M7 calls the boundary *"a narrow strip embedded at the deck's
  outer edge — a small bright core with a controlled local halo — not a bar standing proud of the
  floor"*. Raising `BOUNDARY_H` only extends the lit band **down** the existing outer face — it lifts
  nothing, so it is safe. Raising `BOUNDARY_W` eats into the deck.
- **Flag it to me if he lands above ~2.5u on width.** 2u is 3% of the 64u ribbon per side and
  comfortably still "a narrow strip". Past roughly 2.5u I want to re-read M7's wording before we
  freeze it, rather than the lane quietly shipping something that has become a rail. The slider may
  still *range* to 4.0 — I would rather he find the edge of his own preference than be fenced in.
- **Nothing in `docs/art-direction/` gets edited.** It is ChatGPT's read-only workspace.
- **`MARIGOLD_REFERENCE_INTENSITY` is the scale anchor for the whole hierarchy**, not a local boundary
  brightness — `ENVIRONMENTAL_MARIGOLD_INTENSITY = MARIGOLD_REFERENCE_INTENSITY * 0.25`. Moving it
  moves the unbuilt monolith seams too. Leave that coupling exactly as it is; just be aware the number
  he lands on is a world-level decision.

## Scope

**This PR ships the instrument, not the values.** Committed defaults stay 2.0 / 1.0 / 1.0, so the PR
is a no-visual-change merge like #145 was, and it can land before the gate. The numbers he lands on
get frozen in a second small commit afterwards.

`debugTuningSource` must emit the two new constants under a `// game/scene/track-geometry.ts` heading
so whatever he settles on is committable verbatim.

## Verify gate — the full one

`pnpm typecheck` · `pnpm lint` (expect 3 pre-existing `noExcessiveLinesPerFile` warnings in
`packages/shared`; canvas-isolation must stay 8/8; comment ratchet must not gain lines) ·
`pnpm -r test` · `pnpm build`. Green before you ask for the gate, not after.

Comments: **1–2 plain lines, only what the code cannot say** (`CLAUDE.md` non-negotiable #15). The
NN#14 weighing goes in the **PR body**, not in a comment block.

## Getting the gate taken — the instrument hazards, all paid for already

- **The tab must mount VISIBLE.** A tab that was never visible never mounts R3F at all (root creation
  gates on measured size), and a backgrounded one comes up `visibilityState: "hidden"` with a 300×150
  canvas. Forcing a mount afterwards gives you a **mounted, non-rendering** scene — the exact dead end
  #145's gate hit. Canvas size is *not* the test.
- **Check `gl.info.render.frame` actually advances** before believing any screenshot. It can be frozen
  while the UI reads "running".
- **Drive the panel's own DOM elements.** Never `await import(...)` a module to poke it — under Vite
  HMR that hands you a second module instance that half-works, because the singletons it imports
  resolve to the same object, so a control routed through it passes while proving nothing.
- **Yield a task after `dispatchEvent` before reading.** `notify()` is synchronous; React's flush is
  not. An immediate read returns stale values that are indistinguishable from a dead knob. 300 ms was
  enough last time.
- **Serialise against the owner's other tab.** Only one visible tab renders at a time. He has `:5202`
  (`../slur-worktrees/deck-emissive-knobs`) for the deck emissive. Say which tab and port you need and
  wait for it; "foreground Chrome" is not an actionable request.

## What I want back

The PR, the NN#14 weighing in its body, the measured rebuild cost, and a named port + tab for the gate.
Escalate to me rather than deciding alone if the width question turns into an art-direction question
(the ~2.5u flag above) or if the rebuild forces a visible behaviour change in the non-DEV path.
