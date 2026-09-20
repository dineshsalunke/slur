# Brief — slice 2, the marigold retone

Written by the supervisor for a cleared lane. **Self-contained: do not re-read the GDD, the art package,
or `ART_MATERIALS.md` in full.** Everything you need is quoted below. Read
`.claude/art-pass/02-track/LANE-STATE.md` for repo state, then this.

## Start here

```
git fetch origin
git worktree add -B art/marigold-retone ../slur-worktrees/marigold-retone origin/dev
cd ../slur-worktrees/marigold-retone
pnpm install
```

`origin/dev` is `3cbf54a`. **Do not reuse `art/deck-emissive-knobs` or `art/track-slice2`** — both are
squashed away and rebasing off them replays history that no longer exists.

Ports: copy `apps/client/.env.example` → `apps/client/.env` and pick a pair not in use. **`:5202` is
taken** by a client the owner is using; do not touch it.

## The one file, and what is in it today

`apps/client/app/game/scene/track-materials.ts` — the single definition of every track surface.
Verbatim, at `origin/dev`:

```ts
export const LETHAL_SURFACE = { emissive: '#ff2740', emissiveIntensity: 2.2, color: '#1a0206' } as const;
export const DRAG_SURFACE   = { emissive: '#ffa51f', emissiveIntensity: 1.6, color: '#2a1600', ... };

/** The outer boundary strip, embedded in the deck's top outer corner. Still the old rail's VALUES on
 *  purpose — the marigold retone waits on the owner's ruling about which material sheet is canonical. */
export const BOUNDARY_SURFACE = { emissive: '#F59A24', emissiveIntensity: 2.0, color: '#15171a' } as const;
```

The hex is **already** the right marigold. The strip is **not** miscoloured. What is missing is that
nothing in the file expresses that this strip is *the reference the rest of the scene's marigold scales
off*, so every surface carries an unrelated hand-typed number.

## The blocker in that comment is resolved — do not re-open it

The comment says the retone waits on a ruling about which material sheet is canonical. It does not.
`docs/art-direction/golden-reference/DIRECTION.md` (the appearance authority) says in its own words:
*"Numeric intensity/roughness presets are not measured acceptance targets and should be tuned to the
visual hierarchy."*

So the art package names **no competing number**. `docs/ART_MATERIALS.md` §3 supplies the scale, not an
acceptance target: *"Reference intensity **1.0** — the track boundary strip defines it"* for the
gameplay tier, with the environmental tier at *"**≤ 0.25** of gameplay"*. Those two statements agree.
**Delete that stale comment as part of this change.**

## What to build

**1. Make the reference explicit.** Introduce a single exported gameplay-tier marigold reference in
`track-materials.ts`, and have `BOUNDARY_SURFACE` *be* that reference rather than carry a private
number. The point is that when the owner moves one value at the gate, everything defined as a fraction
of it moves with it — today they would all have to be re-typed by hand, which is how they drifted apart.

Give the file a way to express the environmental tier as a fraction of the reference (§3's ≤ 0.25), even
if nothing in this slice consumes it yet — the monolith and asteroid work lands on that number next, and
the whole reason the tier split exists is so those two layers cannot be tuned independently into
looking alike.

**2. Do not compensate for bloom washout.** This is the load-bearing constraint and it is the easiest
one to violate by accident. If the strip looks too hot through the global `<Bloom>`, the temptation is
to dial the constant down until the *composited* result looks right. **Do not.** Slice 3 inherits this
number as its reference, so a value bent to cancel bloom silently rescales every marigold that comes
after it. The reference is authored pre-bloom; bloom is applied on top and judged, not subtracted.

**3. Out of scope — do not touch:**
- `LETHAL_SURFACE`. It is still red although the palette excludes red. `ART_MATERIALS.md` is explicit
  that retoning it *"is the block-design task's call, judged when someone is judging blocks."* Leave it.
- `DRAG_SURFACE`. Same reason — it is block language, not boundary language.
- `FLOOR_EMISSIVE` / `FLOOR_EMISSIVE_INTENSITY`. The deck's cool grey-white at 0.05 is the owner's live
  call on `:5202` right now. Do not pre-empt it.
- The emitter array (fixed-size K-nearest via `onBeforeCompile`). Separate unit, separate PR.

## What the strip must still be, so a refactor does not quietly restyle it

From `ART_MATERIALS.md` M7, quoted because it is easy to get backwards:

- **"The boundary is an edge, not a rail."** Board 24 puts the emitter *in the top outer corner of the
  slab*, dark cut side-face dropping away beneath it, and its do-not-copy column excludes *"raised rails
  or ornamental edge machinery."* A narrow strip embedded at the deck's outer edge — small bright core,
  controlled local halo — never a bar standing proud of the floor.
- **Continuity is what separates the boundary from interior inserts, not brightness.** Both are gameplay
  tier and *"both may be equally hot"*; board 24 asks only that the boundary stay *"visually distinct
  from intermittent interior inserts."* The boundary is **unbroken and predictable**; inserts are
  **short, varied, irregularly spaced**. Making inserts regular or continuous produces the lane read the
  direction forbids — *"which is the failure mode, not dimness."*
- **Golden, never vermilion or red-orange — verified after tone mapping, not in the source colour.**
  There is no `toneMapped: false` in this file and that is deliberate; the file's own header says opting
  out made the art direction's test *"does the rail read marigold in the final tone-mapped frame"*
  unrunnable.

## The gate

This ends in a PR **and** an owner eye-gate, not in tests. Tests cannot judge this.

Render the strip at **two levels** and leave both for the owner: the literal `1.0` reference, and the
current perceived level re-expressed through the new constant. The absolute level is an artistic call
and it is the owner's, not yours and not mine — this project's pattern is *render both, decide neither*.

**A visual gate needs a genuinely visible tab.** A never-visible tab does not mount R3F at all. A
`computer` screenshot call forces the mount but leaves `visibilityState: "hidden"` and the frame counter
frozen — a mounted, non-rendering scene, which is not a gate. Frame-tap is dead; do not spend on it.
Before trusting any A/B pair, confirm `gl.info.render.frame` is advancing.

If you probe the panel to set values, **yield a task after `dispatchEvent` before reading**. `notify()`
is synchronous, React's flush is not, and an immediate read returns stale values that look exactly like
an inert knob.

## Verify before you claim done

`pnpm typecheck` · `pnpm lint` (includes `scripts/check-comment-ratio.mjs`) · `pnpm -r test` ·
`pnpm build`. All four, in the worktree, before the PR.

**Comments:** `CLAUDE.md` non-negotiable #15 — comment only what is not inferable from the code, 1–2
plain lines, anything longer goes in the PR body. The comment ratchet means a file you touch may not
come out with more comment lines than it went in with, so budget for it: you are deleting a stale
2-line comment here, which buys you room.

## Escalate to me, do not decide alone

- Anything that would change `LETHAL_SURFACE`, `DRAG_SURFACE` or the deck emissive.
- Any finding that the strip cannot be both "the reference" and visually right without bloom
  compensation — that is a real conflict and it changes the plan.
- Any dimension. Dimensions come from `docs/ART_SCALE_REFERENCE.md` and override every number printed
  on a board. This task changes **no** geometry.
