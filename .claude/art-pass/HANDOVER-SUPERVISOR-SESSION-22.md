# Supervisor handover — session 22 (2026-09-20)

## What this session did

Closed the deck's two open geometry questions with the owner, and turned his eye-gate feedback into a
working instrument. Three PRs merged, one lane task in flight.

## `dev` is at `bb59350`

```
bb59350 art(dev): put the boundary's width and wrap on the panel, next to its intensity (#147)
cb573f6 docs(art): set the deck's joint width, and exempt linear elements from the detail floor (#148)
1819290 docs(art): settle the deck's panel division at 4u tiles in breaking bond (#146)
563a19f art(track): make the boundary strip the marigold reference, not a hand-typed number (#145)
```

All three merges had `refs/pull/N/head` verified against the gated SHA immediately before merging, and
a 2-dot diff checked.

## Owner decisions taken this session — both now in `ART_MATERIALS.md` revision 4

**Deck tiles are 4u in breaking bond** (#146). This reverses revision 3's *"It must not be built at
4u"*. The ban's reasoning held only for longitudinal stripes; a tile has transverse joints too, and the
forbidden *"visible runtime lanes"* read needs an **uninterrupted** down-track line. Offsetting
alternate rows 2u means no down-track seam survives past one tile — the failure mode dies by
construction rather than by a contrast ratio holding at speed. Board 24 audits *"16 across 64u"*, which
is what 4u across a 64u ribbon produces, so this **adopts the board's count rather than departing from
it**. Texture-only: the sim never reads `CELL`, collision is continuous float-AABB, `MIN_CLEAR = 7u`
untouched.

**Joint width is 0.2 – 0.8u** — 5–20% of the tile, start at 0.8 and dial down (#148). This forced M1's
`Detail floor | nothing below ~1u` to be **exempted for continuous linear elements**, on the reasoning
that the floor was written about isolated features (a 0.5u scuff is a speck) while a line integrates
along its length and survives sub-pixel as contrast modulation. §7 item 8 marks that as **this sheet's
own perceptual call, not the package's — overturnable at the gate.**

**Paste-to-Codex note for the 4u decision is written and NOT yet handed over:**
`.claude/art-pass/02-track/PASTE-TO-CODEX-4u-bond.md`. The owner pastes it; Claude never edits
`docs/art-direction/`. **The joint-width decision has no paste note yet — write one.**

## The gate the owner has NOT yet taken — this is the top of the queue

Port **5204**, worktree `../slur-worktrees/boundary-width-gate`, `http://localhost:5204/art-lab`.
Panel: TUNING → "marigold reference" → **boundary** (0–8, pre-bloom, live) / **width** (0.25–4, applies
on release) / **wrap** (0.25–4, on release).

He reported the boundary reads **thin**, and that 4.0 intensity "feels ok" — but the slider was
`max={4}`, so **he was judging against the rail** and 4.0 may be the ceiling rather than his answer.
That max is now 8.

**Why all three must be judged in one frame:** width and intensity are the same knob at distance —
bloom spreads total emitted energy, and widening raises energy per unit length exactly as intensity
does. Shipping doubled width *and* 4.0 would be ~4× the energy he actually looked at. Width buys
something intensity cannot only in the **near field**. And `BOUNDARY_W` (top face) vs `BOUNDARY_H`
(wrap down the outer face) **swap dominance with distance** — the top face foreshortens away far ahead
while the wrap stays nearer perpendicular, which is why the wrap exists at all.

**Escalation I reserved and have not yet had to make:** if he lands above **~2.5u** on width, re-read
M7's *"narrow strip embedded at the deck's outer edge … not a bar standing proud of the floor"* before
freezing. 2u is 3% of the ribbon per side and comfortably fine. Raising the **wrap** has no such
ceiling — it extends the band downward and lifts nothing.

**Serialise against `:5202`** (`../slur-worktrees/deck-emissive-knobs`, the owner's deck-emissive
session). Only one visible tab renders at a time. `:5203` from #145 is being torn down.

After he lands on numbers: a second small commit freezes them. `copy values` on the panel already emits
`MARIGOLD_REFERENCE_INTENSITY`, `BOUNDARY_W` and `BOUNDARY_H` as committable source.

## What the lane is working on right now (sent, not yet started when this was written)

1. **The bloom knobs at the top of the TUNING panel do nothing** — owner's first-hand report while
   dragging, so this is not the stale-read hazard; something is genuinely unwired. They write
   `GRID_VOID.bloom.*` through `DEBUG_TUNING`, and `apps/client/app/dev/tuned-bloom.tsx` exists.
   **My suspicion is a guess, not a finding** — diagnosis is the lane's.
2. **Remove the "sky framing" section from the art-lab panel.** Straight removal, owner asked directly.

## What #147 taught, worth not re-learning

My brief treated the boundary strip as the only consumer of `BOUNDARY_W`/`BOUNDARY_H`. **It is not** —
`track-floor.tsx`'s `emitSpan` insets the deck by `BOUNDARY_W` and drops the walls by `BOUNDARY_H`, and
the strip fills exactly that notch. `track-geometry.ts`'s header says so outright: *"the deck omits
exactly the facets the strip fills, so both must read the same numbers."* A width knob moving only the
strip opens a corner seam or lays coplanar z-fighting faces. Both builders are parameterised now, and
there is a contract test pinned at `w=2.5/h=3` — every prior test ran at 1.0/1.0 and could not have
caught a desync.

**Measured rebuild cost** (400 segments, node/V8, 30 runs, GPU upload excluded): boundary median
2.96ms, floor 6.11ms, **both 8.64ms** — ~52% of a 16.7ms frame on an already-rendering scene. So the
geometry sliders apply **on release**, not per input event; intensity stays per-event because it is a
uniform. If the commit-edge feel annoys the owner, the thing to measure next is `useDeferredValue`
(React 19.2.8 is installed and types it) — rejected this round only because the build is a synchronous
`useMemo` inside R3F's reconciler, which React can skip but cannot interrupt. **Do not reach for a
timer.**

## Still owed / unowned — carried forward, none of it touched this session

- **Fly 7.5u through 8u pillar fields with `fly` ON.** Unpaid gate; ADR-011 and #142's body both demand
  it. Do not let anyone claim it passed.
- **Slice 2's emitter array** — fixed-size K-nearest via `onBeforeCompile`, unstarted. Fixed size is
  load-bearing: a varying light count recompiles the shader mid-race.
- **Occlusion at 7.5u** — deferred, wants a brainstorm not an issue. Removing the object is rejected
  (pillars are lethal and collision is continuous, so culling builds an invisible wall). Cheapest
  unruled-out option touches no geometry: `lookAhead`/`lookAtLift`/`fov` plus a distinct emissive crown
  so a pillar reads by its top.
- **Owner-parked pair, one sitting, once both are rendered:** the M1 metalness pair (1.0 / 0.35–0.50 vs
  the shipped 0.12 / 0.62 — the sky measures ~linear 0.01 as an IBL source, so at 1.0 everything the
  specular misses goes black) and **rail breaks over full gaps**. Render both, decide neither.
- **`docs/codex-reconcile` @ `84291fb`** — committed, unpushed, no PR since session 17, unowned. 108
  files, +757/−1936, every path under `docs/art-direction/`, which is read-only for Claude. Needs an
  owner decision.

## Slice 3 is now unblocked and specced

Floor finish: panel language + board-25 wear, one shader. `ART_MATERIALS.md` M1 carries the tile size,
bond and joint-width range; §5 carries what is still open. **Not yet briefed to anyone.**

**The design tension to hold:** panel divisions are low-contrast value/material contrast, **not lines**
— *"if the deck starts reflecting recognisable shapes it has gone too low"* on roughness. And §5 now
names a specific check that did not exist before: at the chase vantage (7.5u up, 15u back, 70° FOV) the
deck 50u ahead is ~8.5° off edge-on, which crushes **transverse** joint spacing ~7× while leaving a
**longitudinal** joint's width untouched — so the mid-to-far deck can revert toward **stripes** through
mip blur even though breaking bond removed them geometrically. Look at 40–100u at race speed. The
remedy is sampling or contrast, **never** the tile size.

## Worktrees

`../slur-worktrees/boundary-width-gate` (`:5204`) — **keep, it is the owner's live gate.**
`../slur-worktrees/deck-emissive-knobs` (`:5202`) — the owner's deck session.
`../slur-worktrees/track-slice2` — **do not remove**, it is the lane's herdr shell cwd; its branch is
squashed away so do not work in it either. Never reuse or rebase off `art/track-slice2`,
`art/marigold-retone`, `art/deck-emissive-knobs`, `art/deck-4u-bond` or `art/deck-joint-width` — all
squashed away. New work gets a fresh worktree off `origin/dev`.

## Lane

`track-slice2-d8` (herdr name **`track`**). Cold-start docs in the shared checkout so they survive its
context and its worktree: `.claude/art-pass/02-track/LANE-STATE.md`,
`.claude/art-pass/02-track/BRIEF-MARIGOLD-RETONE.md`, and this session's
`.claude/art-pass/02-track/BRIEF-BOUNDARY-WIDTH-GATE.md`.

## Instrument hazards — unchanged, all paid for

Tab must mount **genuinely visible** (a never-visible tab never mounts R3F; canvas size is not the
test). Check `gl.info.render.frame` advances before believing a screenshot. Drive the panel's own DOM,
never `await import(...)`. Yield a task after `dispatchEvent` before reading. Frame-tap is dead as a
plan.

---

## ADDENDUM — the lane parked at a seam; both new items are unstarted but narrowed

`track-slice2-d8` hit ~209k and stopped rather than start either item half-way. **Correct call.** It is
parked clean, wrote to no source file, and its cold-start doc is rewritten:
`.claude/art-pass/02-track/LANE-STATE.md`. I cleared its context via herdr.

**`:5203` is torn down. `:5204` is up and is the owner's gate** —
`../slur-worktrees/boundary-width-gate`, `CLIENT_PORT=5204` / `VITE_SERVER_PORT=2604`, 200 at
`http://localhost:5204/art-lab`. No tab was ever opened; the #147 eye-gate is still unpaid.

### Bloom knobs — my suspicion was wrong, and so was the lane's replacement lead

**I was wrong** that `tuned-bloom.tsx` might not re-read the store. The lane established first-hand
that it is wired correctly: `useDebugTuning()` plus a DEV ternary, and it already handles the
constructor-arg problem by remounting the pass on `radius`/`levels` via a `key`. The store is also not
the suspect — the deck and boundary knobs travel the same `notify()`.

**The lane's replacement lead is also wrong, and I checked rather than relaying it.** It reported that
`art-lab-canvas.tsx` never mounts `TunedBloom`. It does — **verified on `origin/dev`: imported at
`art-lab-canvas.tsx:7`, mounted at `:77`** inside an `EffectComposer`, behind a `bloom` layer toggle.
The bad lead most likely came from a `git grep` with an unescaped `|` and no `-E`. Recorded in
`LANE-STATE.md` as explicitly wrong so the next context does not chase it.

**The live candidate, unverified:** `TunedBloom` takes a `config` prop and in DEV **ignores it** in
favour of the store, while art-lab passes `config={ env.bloom }`. Anything driving `env.bloom` is
therefore inert by construction. Complication to settle first: there are **two** panels —
`dev/debug-panel.tsx` (writes `DEBUG_TUNING`) and `routes/art-lab/art-lab-controls.tsx` — and it is not
established which one the owner was dragging. His words were "the top bloom knobs on tuning panel".

### Sky framing — not a one-file delete

Controls are contained to `routes/art-lab/art-lab-controls.tsx`, but `TunableSky` has three consumers:
`routes/art-lab/art-lab-canvas.tsx`, `routes/iso-sky/route.tsx`, `routes/iso-sky/tunable-sky.tsx`.
**Unestablished:** whether `/iso-sky` drives it from its own state or from the values the art-lab
section writes. That decides one-file versus two. Do not delete blind.

### Method note

Twice this session a stated fact reversed on measurement — my prod-bundle inference in session 21's
addendum, and now two successive leads on the bloom knobs, one mine and one the lane's. **Checking the
lead before relaying it into a brief cost one grep and saved the next context a wasted hour.** The
lane's own instinct to stop at a seam rather than begin a diagnosis it could not finish was also right;
do not push a lane past that line.

---

## ADDENDUM 2 — the owner took the #147 gate. Three findings, one of them a real bug.

His `copy values` dump, diffed against `origin/dev` by me: **the only values that moved are
`MARIGOLD_REFERENCE_INTENSITY` 2.0 → 4, `BOUNDARY_W` 1.0 → 3, `BOUNDARY_H` 1.0 → 2.75.** Camera,
floor, ambient and bloom are byte-identical to committed.

That is not just bookkeeping — **the dump reads from the store**, so it splits his two bug reports into
two different failures, on evidence rather than inference.

### Bloom knobs — the diagnosis moves to the INPUT side

The dump shows `GRID_VOID`'s committed `1.2 / 0.42 / 0.2 / 0.6 / 4` exactly. So either he reset them,
or **the store never received his drags** — the break is **panel → store**, not store → Bloom. This
points away from `tuned-bloom.tsx` *and* away from the `env.bloom` candidate in `LANE-STATE.md`. First
check is whether the bloom sliders in whichever panel he used are wired to `setDebugTuning` with the
right keys at all. The `env.bloom` lead is **demoted, not dead** — if he turns out to have reset them,
it is back in play.

### The wrap is broken — and it is why he landed at W = 3

The dump shows `BOUNDARY_H = 2.75`, so the store received it and the geometry rebuilt, and he **still
saw nothing**. That is **store → pixels**.

**Hypothesis, inferred from `emitBoundary` and NOT verified:** the wrap is a vertical quad on the outer
side face carrying a `LEFT`/`RIGHT` **outward** normal, while the chase camera sits inside the track at
x≈0 — so it sees the back face and it is culled. Invisible at any value, from the chase cam, always. If
that holds, the wrap's own comment (*"so the strip turns the corner instead of lying flat and
foreshortening away at the chase angle"*) describes an effect that **has never been visible in play**.
Same family as the concave-outline winding bug: a normal error that passes every gate and just renders
wrong.

**Why this matters beyond the bug:** the wrap is the knob that buys apparent thickness on the vertical
face, where no playable surface is lost. It was silently dead, so the only working thickness knob was
the one that eats deck. **He chose W = 3 with one of the two knobs broken.**

### "Widening extends the rail INTO the track" — correct by construction, do not fix

He flagged this as a bug. It is not. The strip insets from the outer edge **inward** because that edge
is the sim's floor boundary at ±32u and the visual slab is built from the `Track`'s own floor spans.
Extending outward would paint floor-looking geometry where the sim has no floor — he would fly onto
marigold and drop through it. **I explained this to him; nobody should "fix" it.**

### The calls I took

- **FREEZE `MARIGOLD_REFERENCE_INTENSITY = 4.0`.** Judged against a working live slider with the raised
  max, and independent of the geometry question. It doubles `ENVIRONMENTAL_MARIGOLD_INTENSITY` to 1.0
  by derivation — intended (it is the scale anchor), but it must be said in the PR body.
- **DO NOT freeze `BOUNDARY_W` or `BOUNDARY_H`.** W = 3 also trips the ~2.5u escalation flag — 6u of a
  64u ribbon, nearly a full tile, past M7's *"narrow strip … not a bar standing proud of the floor"*.
  **I am deliberately not arguing that on the merits yet**, because the choice was made with the wrap
  dead. Fix the wrap, re-gate, and expect W to come down with H carrying the difference.

### Lane queue, in the order I sent it

1. Verify and fix the wrap — the unblocker.
2. Diagnose the bloom **input** path.
3. Freeze `MARIGOLD_REFERENCE_INTENSITY = 4.0`.
4. Sky framing — unchanged, still open, lowest priority.

Then the owner re-gates width and wrap on `:5204`, serialised against `:5202`.

---

## ADDENDUM 3 — a rule I broke, and the queue collapsed to one task

### Never cite code or its comments as art direction

Owner correction, explicit and irritated: **the art direction assumes we are starting from scratch.**
An implementation comment records what a past lane decided — execution history — not what a thing
should be. Quoting one back manufactures a constraint no authority imposes and derails the design
conversation. `CLAUDE.md` already says *"Engineering lane notes record execution history, not
competing art direction"*; this is that rule, broken.

**What I did:** defended the boundary strip's inward inset by quoting `track-boundary.tsx`'s own
comment (*"NOT a rail: board 24 … so the strip IS the slab's top outer corner"*) as though it settled
the question. It settles nothing.

**Read code to learn what it currently does. Never to learn what it should do.** Appearance authority
is the art package plus the Claude-owned sheets (`ART_SCALE_REFERENCE.md`, `ART_MATERIALS.md`), and
nothing else. If a code comment is the only support for a design constraint, **there is no
constraint.** Saved as memory `code-comments-are-not-art-direction`.

### The measured fact that does matter, and the defect it exposes

`BOUNDARY_W`/`BOUNDARY_H` are **client-only** — `git grep` finds them nowhere in `packages/shared` or
`apps/server` — and the sim floor spans `±HALF_WIDTH` (±32u) regardless of either. **The strip cannot
change the playable area in any direction.**

So my earlier framing was wrong in a way that mattered. The inset does not shrink the track; it
**repaints genuinely flyable surface as edge trim.** The track is not shrinking, it is lying — it
looks like you should not be there and you can be. That is the defect the owner reacted to, and it is
worse than what he thought was happening. I spent an exchange justifying the implementation instead of
measuring it.

### Queue collapsed to one task

**Fix the wrap. Nothing else.** Bloom diagnosis, the `MARIGOLD_REFERENCE_INTENSITY = 4.0` freeze and
sky framing all wait. The owner re-gates width and wrap on `:5204` as soon as the wrap renders, and
`BOUNDARY_W = 3` stays provisional because he chose it with the wrap dead. Nothing else is worth a
context until that gate can be taken honestly.

The wrap fix may also be the inset fix — told the lane to keep that in view rather than preserve the
current geometry's intent because a comment explains it.

### Still unresolved, for whoever picks this up

The owner's position is that the strip is **a filler that should never affect the playable read**. The
art package's position is that it is **not a rail and must not stand proud of the floor**. Those may
be reconcilable via the wrap or an outward chamfer — or they may not, in which case it is a Codex
decision, not a Claude-owned departure. **Do not resolve it unilaterally in either direction.**

---

## ADDENDUM 4 — wrap cause confirmed and fixed; the inset is minimisable, not removable

**`art/boundary-bevel` @ `a2bbb6b`, pushed, full gate green. No PR yet, NOT merged.**
**Unlike #145 and #147 this one changes the visuals — it must not merge before the owner's eye.**

### Cause, measured

The lane built the geometry headlessly and read back the packed normals. At `BOUNDARY_H = 2.75` the
wrap quads sit exactly on the outer plane `x = ±32`, spanning `y` 0 to −2.75, with normals exactly
`[−1,0,0]` at `x = −32` and `[+1,0,0]` at `x = +32`. **Backface-culled from a camera inside the track —
the hypothesis held in every particular.**

Two additions worth keeping: `DoubleSide` would **not** have rescued it (a face parallel to the view
direction has no projected area, and the slab occludes it regardless), and the same argument means the
deck's own outer side wall is invisible in play too — **`SLAB_THICKNESS` is never seen**. Only top
faces and gap end-caps are visible from inside.

### The fix

One bevel per edge replaces the flat top plus the vertical drop, spanning the band `track-floor.tsx`
already reserves (the deck insets its top face to `x0+w` and stops its side wall at `t−h`), so both
seams still meet exactly and **`track-floor.tsx` is untouched**. The normal tilts from exactly `UP` at
`h=0`, through `[−0.71,0.71,0]` at `h=1`, to `[−0.94,0.34,0]` at `h=2.75`. **`h` now buys visible
thickness for a fixed deck bite `w`** — the property that was missing.

The normal test was strengthened, and the reason is the most reusable thing here: **the existing
"faces the strip outward" test passed both before and after the change — it pinned the very property
that made the facet invisible.** It now also requires a `+y` term.

### The constraint on the owner's open question — I verified this independently

Can the trim hang outboard of ±32 and take zero deck? **No, not at useful proportions.** A point at
`(32+w, −h)` is only visible past the deck edge from a camera at height `H` when the sight line clears
the corner at `(32,0)`: **`h < (H/32)·w`**, which at the dialled `H = 7.5` is **`h < 0.234·w`** — so
**0.70u of drop at `w = 3`**. I re-derived this from scratch and it matches the lane's figure to three
decimals. Near-field cross-section only; geometry farther down-track clears more easily and that is
**not characterised**.

**Consequence: any edge trim visible from inside must either take some deck or rise above it.** The
owner's complaint and the dead wrap are one problem, the bevel is the answer that costs the least
deck, and **the inset is minimisable but not removable.** That is the fact his "filler outside the
track" position has to be reconciled against — it is geometry, not a preference, and it is not
something the art package can overrule.

### Banked so nobody re-walks it

**The `env.bloom` lead is closed outright, not demoted.** In the installed
`@react-three/postprocessing` **3.0.4**, `wrapEffect` computes args via `useMemo` keyed on
`JSON.stringify(props)` and hands them to the R3F primitive, so **any** prop change reconstructs the
`BloomEffect` — store → `<Bloom>` applies live by construction. That plus `TunedBloom` never reading
`config` in DEV eliminates it as a cause. Consistent with the panel → store reading from the dump.

### State

- **Marigold `4.0` freeze was made, then reverted** so the gate isolates one variable. Re-applying is a
  one-line change to `track-materials.ts`. **Hold it until after the bevel gate.**
- **No tab was opened; `:5204` and `:5202` are undisturbed** and the serialisation is intact.
- ⚠️ **`:5204` serves the wrong branch** — it runs `../slur-worktrees/boundary-width-gate`, which is
  #147 *without* the bevel. The lane must rebuild that server from `art/boundary-bevel` or stand it up
  on its own port before the owner can gate anything.
- Bloom and sky framing remain parked.
