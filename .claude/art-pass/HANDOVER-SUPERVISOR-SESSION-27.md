# Supervisor handover — session 27 (2026-09-20)

Two lanes ran in parallel all session and both delivered. The session's real content is that **two
long-standing questions got answered by arithmetic rather than by a frame**, and in both cases the
arithmetic overturned a supervisor premise. Three PRs open, two owner decisions taken, one visual gate
outstanding.

## Owner decisions taken this session — both binding

1. **The deck GETS a cold key from above.** The question — *"does the deck get a cold key from above, or
   is it meant to be a void whose edges the rails draw"* — is closed. Dispatched as
   `.claude/art-pass/03-lighting/BRIEF-COLD-KEY.md`. Do not re-open it.
2. **`RAIL_EMITTER_RANGE = 600` with `EMITTER_SLOTS = 24`.** The measured zero-eviction pair at 600.
   Ships in the cold-key PR. His earlier "600–800" is now resolved to 600.

## THE FINDING — the deck reflects the SKY, not the scene's warm energy

The right-side specular lobe is solved, by transcribing three 0.185.1's whole `meshphysical` fragment
path into node and evaluating it per-fragment over the in-frame deck at the committed values. Not pixels.

**92% `SkyEnvironment` IBL specular · 8% `StarLight` directional · 0% rail array · 0% ambient.**

- Screen-right is world −X for this rig (camera right basis `(−1.000, 0, 0)`);
  `skyDirection(66,19) = (−0.8638, 0.3256, 0.3846)`, `dot(L, cameraRight) = +0.864`.
- **The `starLight.intensity` discriminator I proposed would have MISLED.** The IBL key `<Lightformer>`
  reads the *same* `config.starBearingDeg` as the directional light — same bearing, same side, by
  construction. Dialling the directional moves 8% and the lobe stays. **The `Env rig` toggle is the
  discriminator.**
- The directional light's true mirror peak (`H == N`) sits at world x = −19.90 and 8.86u ahead of the
  camera — 66.0° off-axis against a half-frame of 51.5° at rest / 58.7° at top speed, so **off-frame in
  every condition**. What reaches the frame is the GGX lobe tail sweeping in from the right edge: a
  gradient, no hotspot. The lane had this as a prediction before the owner's words reached it, and three
  axes of his description matched independently.
- The deck is a very dark near-mirror: `F0 ≈ 0.0175`, **below a dielectric's 0.04**, because a near-black
  albedo at metalness 0.75 drags F0 down. A dark mirror shows almost nothing except the one bright thing
  in the sky.

**Brightness levers, descending: `environment.keyIntensity` (3.2, owns the 92%) · `FLOOR_ENV_MAP_INTENSITY`
(1) · `starLight.intensity` (1.6, owns the 8%). `starBearingDeg` is NOT a brightness knob** — it moves
both and breaks the sky/light agreement `sky-config.ts` derives it to hold.

### My metalness premise was BACKWARDS — correct the record

I briefed the lane that the lobe only appeared at metalness 0.75. Measured sheen contrast, R/L:

| metalness | 1.0 | 0.75 | 0.3 | 0.0 |
|---|---|---|---|---|
| contrast | **23.70×** | 11.55× | 6.65× | 5.42× |

Absolute right-side brightness is near-flat (3.0e-2 – 5.2e-2) across the whole sweep. **0.75 changed the
LEFT side** — it restored a diffuse lobe and halved the contrast. The sheen was present and *worse* at
1.0; "deck entirely black" was the rest of the frame going dark around a lobe that never left. So
**metalness 0.75 is a fill by another name**, and what was invisible at 1.0 was the fill, not the lobe.

Roughness sweep at m=0.75: `1.0` → 2.75× · `0.7` → 5.11× · **`0.4` (shipped) → 11.55×** · `0.15` → 25.07×.

**What survives from the pre-0.75 arithmetic:** everything about the RAIL (geometry + selection, not
BRDF) — 78 runs, 39 per side, one-sided 0/1600, predicted symmetric pair at screen (±0.72, +0.22).

**Modelling caveat, not buried:** the IBL term is a full-hemisphere 48×192 quadrature with Lightformers
as cones; three ships split-sum over a PMREM cubemap. `form="rect"` modelled as a cone,
`computeMultiscattering` omitted. **Direction and dominance robust; absolute numbers approximate.**

**The one candidate NOT closed by arithmetic:** bloom bleed off the backdrop jpg's planet, up-right. Prior
first-hand read put its interior luma 0.16–0.26 vs env C `bloom.threshold 0.42` — should not bloom — but
that read was pre-tone-map at fov 70, `[unmeasured]` at 120. It is a sky object, not a deck response, so
the owner separates it by eye in one look.

## THE OTHER FINDING — the lead-in was never a bug

`respawn()` does NOT clamp and does NOT drop into a void. **It lands on invisible floor.**

`segIndexForZ` is `Math.floor(z / SEG_LEN)`, unguarded, returns negative indices; `buildSegment`'s
start-safe branch is `if ( i < START_SAFE )`, which **every negative index satisfies** — so negative
segments were built as `kind:'plain'` with `fullFloor(0)`. The sim had an unbounded flat hazard-free plane
behind z=0. `track-floor.tsx` loops `i = 0`, so nothing was drawn there.

**Classification: a sim/render divergence, not a gameplay bug.** That is a STRONGER justification for the
owner's Option B than the bug framing was — the abstraction and the render disagreeing is exactly what the
load-bearing contract exists to prevent.

**Reachability, measured:** reverse is impossible by clamp (`s.vz = Math.min(Math.max(s.vz,0), maxCruise)`),
so `respawn()` is the only thing that ever lowers z. 300 seeds × 3 pilot styles × 180s = **69,512 deaths**.
Minimum z ever occupied **0.011u**; minimum respawn z **108.639u**. Never negative. Structural, not luck:
no death is possible before `START_SAFE * SEG_LEN = 120u`. The lane then **forced the unreachable state by
hand** (`lastSafeZ = 0`, dead, one tick) and got z = −12 grounded — proving the floor was live rather than
merely unreached.

**Why bound it anyway, which is the lane's argument and better than mine:** the unreachability is
**derived, not written down**. It holds only while `respawnSetback < START_SAFE * SEG_LEN` (12 < 120), and
both are ordinary tuning values under comments inviting playtest tuning. `START_SAFE = 0` for a cold-start
test, or a setback past 120, makes negative z reachable **silently, with every test green**.

**Sizing, from the `CHASE` constants then simulated.** Frame-bottom meets y=0 at: 5.572u at rest · 7.488u
at 20u/s · 9.326u at 40 · 10.661u at maxCruise. Launch transient peak 5.731u. **Respawn-at-spawn transient
peak 19.488u.** So the owner's 10u covers framing and does NOT cover the case that matters. **20u = exactly
one `SEG_LEN`**, costs no new index arithmetic, and the spawn footprint's rear (`z − halfL = −1.26`)
resolves to index −1 which is inside a 20u apron — no spawn-tick edge case.

**z = 0 stays the spawn point.** The alternative was costed, not assumed: `finishZ = length * SEG_LEN`
with three consumers (finish latch, render extent, arch placement) and a `z / finishZ` readout, no
progress bar. Shifting buys nothing and changes what every recorded z means.

## Open PRs — three

| PR | Branch | State | Needs |
|---|---|---|---|
| **#155** | `art/emitter-array` @ `11113e6` | gate green, rebased | **owner's fly — carried since session 26** |
| **#156** | `docs/material-departures` @ `61f3010` | docs-only, lint clean | review/merge |
| **#157** | `feat/track-lead-in` @ `8fd9b88` | full gate green | **owner's visual gate on :5202** |

**#156 is the departures record owed since session 24 — now WRITTEN.** `docs/ART_MATERIALS.md` §7 gains
items 9 and 10 (`FLOOR_METALNESS` 0.75 vs M1's 1.0; the pre-existing white `AMBIENT_INTENSITY = 1` vs
*"No global orange wash or bright blue ambient fill"*), the 92/8/0 attribution as a correction to the
sheet's own expectation, and §5 gains the cold-key question. M1's numbers untouched — §7 states the
condition under which they must be re-tested. **Never edit `docs/art-direction/`; that rule held.**

### #157 as-built

`LEAD_SEGMENTS = 1` (20u) in `@slur/shared`. `buildSegment` gains a lower edge returning `kind:'gap'` with
empty floors. `track-floor.tsx` and `track-boundary.tsx` loops start at `-LEAD_SEGMENTS` **so the rail runs
the apron** — without it the apron renders as a black slab, since the rails are all that light the deck.

- **`kind:'gap'` reused, no new `SegmentKind`.** Verified safe: both `KIND` display maps
  (`net-debug-hud.tsx:10`, `art-lab-readout.tsx:15`) fall back `?? '?'` AND only read forward
  (`z + n*SEG_LEN`, n≥1), so neither can ever see the lead-in. Zero union churn.
- **`track-blocks.tsx` deliberately left clamped at 0** — apron is blockless by construction.
- **The assertion is the deliverable:** `respawnSetback < START_SAFE * SEG_LEN`, checked for
  `DEFAULT_TUNING` **and every class tuning** — a per-class `FlightTuning` with its own setback is exactly
  how this would have gone quietly untrue past a DEFAULT-only check. Plus floorless at
  `-LEAD_SEGMENTS*SEG_LEN - 1` and at −1000, and apron flat/full-width/hazard-free across 8 seeds.
- Shared tests 75 → 78. Gate: typecheck · lint · shared 78/78 · client 69/69 · server 4/4 · build.

**NOT VISUALLY GATED.** Segment-data level only. Specific thing to look at: **does the apron's rail read
continuous with the first real segment's rail at the z=0 seam, or is there a visible join?** Same
`emitBoundary` call in the same loop so continuity is expected — expecting is not seeing.

## Range 600/800 vs EMITTER_SLOTS — measured, 7 seeds × 1600 positions

| range | runs in range mean / MAX | slots for ZERO eviction | slots for <1% |
|---|---|---|---|
| 150 | 4.6 / 12 | 12 | 12 |
| 400 (was committed) | 9.2–10.6 / 20 | 20 | 18 |
| **600 (owner's pick)** | 11.6–14.9 / 24 | **24** | 24 |
| 800 | 14.6–19.1 / 30 | 30 | 29 |

- Worst seed at every range is **99991** (92 runs vs 73–79 elsewhere).
- **The committed 400/12 pair ALREADY POPS** — eviction in 10.4% of positions on seed 1234, **49.3% on
  99991**. Live today. An evicted run still contributes non-zero light, so it pops; the range cutoff by
  contrast fades to exactly zero.
- **There was no gap for the owner to choose inside** — zero-eviction and under-1% land within 0–1 slot
  at every range. Hard shoulder, no tail.
- **Cost:** `uEmitters` + `uEmitterTint` are `vec4[K]` = 2K fragment uniform vectors. K=24 → 48 of a
  guaranteed ≥224 (Khronos ES 3.0 `glGet`, verified-this-session). Parked slots exit on a **uniform**
  branch — fully coherent, no divergence. **The per-fragment cost is the RANGE, not K:** 400→600 raises
  live emitters ~1.5×, and each live one runs the Karis tube solve + full GGX. CPU stays allocation-free
  (`_near`/`_dist` grow once, preallocated `Float32Array`s, module-level `_view` scratch).
- **`EMITTER_SLOTS` stays BUILD-TIME.** It is a literal in `FRAG_HEAD`/`FRAG_LIGHTS` and
  `onBeforeCompile.toString()` is three's default `customProgramCacheKey()`. Never a live knob; `defines`
  is not an escape hatch — a `define` change is also a mid-race recompile.

## Lanes

| lane | branch | ports | herdr | `ListAgents` |
|---|---|---|---|---|
| `emitter-array` | `art/emitter-array` @ `11113e6` | **5200 / 2600** (both 200) | `emitter` (`w2H:p1`) | `emitter-array-4b [b81564]` |
| `track-lead-in` | `feat/track-lead-in` @ `8fd9b88` | **5202 / 2602** (both 200) | — | `track-lead-in-33 [c9561c]` |

**`emitter-array` was cleared at its ~163k seam and re-briefed with the cold key.** It was told to start
the key on a **fresh branch off fresh `origin/dev`**, not on top of #155.

**`track-lead-in` is holding**, PR delivered, stack up, has NOT grabbed Chrome (one tab at a time).

**Still cannot render from either lane** — `visibilityState: "hidden"`, rAF dead, frame tap 504s. Every
visual claim from a lane is `[unmeasured]`. This has now been true for several sessions and the
arithmetic route has been worth more than the frames.

### Orphan processes holding ports — owner asked, not yet killed

- **:5205 / :2605** — `bloom-knobs` worktree (branch `art/boundary-bevel`, unmerged). Worktree exists,
  lane does not.
- **:5206 and :5207** — two client processes in `boundary-three-way`, whose worktree is **already removed
  from `git worktree list`**.

Defaults `:5173`/`:2567` correctly not running — nothing should serve from the shared checkout.

## The cold-key brief — what it specifies

`.claude/art-pass/03-lighting/BRIEF-COLD-KEY.md`, self-contained, forbids re-reading the big docs.

- **Directional**, not ambient/hemisphere/point — `N·L` near 1.0 on the deck's +Y normal, the opposite of
  the rails' 0.015.
- **Mounted like `star-light.tsx`**: target as an explicit sibling inside `SkyFollow`, or the direction
  swings over the race's 8000u. Hard to spot, easy to ship.
- **The distinction the task turns on:** *"there is no fill" is not "there is no key"*. The direction
  forbids a fill (*"No global orange wash or bright blue ambient fill"*); it never forbids a directional
  source, which creates shadows rather than erasing them. **If the key reads as a fill it is wrong.**
- **Cold = desaturated slate, NOT blue.** The direction explicitly rejects board 14's *"saturated blue
  environment and lifted shadows"*.
- **Two re-tests are the point:** `AMBIENT_INTENSITY` → 0, and `FLOOR_METALNESS` → M1's 1.0. Report
  `FLOOR_ROUGHNESS`'s response, do not change it.
- **Out of scope:** shadow maps / contact shading. Flag if its absence becomes conspicuous.
- **Routed to the owner, not the lane — the bearing.** Star is at 66° (screen-right) and the highlight is
  already 92% IBL on that side. Same-side doubles the asymmetry; opposite balances the frame but is
  unmotivated by anything visible in the sky.
- Range 600 / slots 24 ship in the same PR.

## Process notes

- **Lanes build, supervisor writes docs and decides.** Held again. Every code change went to a lane;
  supervisor wrote #156, the briefs and this handover.
- **Both lanes overturned a supervisor premise with measurement.** Metalness (backwards) and the
  respawn classification (neither of the two options offered). **Brief the hypothesis, demand the
  arithmetic, accept the correction** — that is the pattern that is working.
- **Clearing from outside still works:** `herdr agent send-keys emitter / c l e a r enter`, then
  `SendMessage` lands in the fresh context.
- **The comment ratchet did its job** — it caught a 4-line invariant comment and forced the 2-line
  version, and the lane's response was to also delete two comments that merely restated the assert
  message below them. That is the right response, not a workaround.
- **`pnpm format` does NOT fix import order; `npx biome check --write <files>` does** — and it also
  reflows a multi-line `assert.ok` that `format` leaves alone. Repeat occurrence; use the latter.
- **Cold-worktree race:** the first `pnpm dev` in a new worktree can beat `packages/shared`'s initial
  `tsc`, and the server exits `ERR_MODULE_NOT_FOUND @slur/shared/dist/index.js`. Restart once `dist`
  exists. Ordering, not a defect.

## Carried, untouched

Fly 7.5u through 8u pillar fields (ADR-011, #142) · `MARIGOLD_REFERENCE_INTENSITY` at 2.0, authored
pre-bloom `[unmeasured]` · occlusion at 7.5u · rail breaks over full gaps · `CONTRIBUTING.md`'s false
trailer-hook claim · **the two divergent `docs/art-direction/` snapshots, neither on `dev`** (shared
checkout's dirty 17 files vs `docs/codex-reconcile` @ `84291fb`) — owner's call, and a `git pull` in the
shared checkout will collide · the rail's channelled cross-section (`02-track/RAIL-PROFILE.md`) stays
**PARKED as polish**, do not re-ask its five open parameters.

**Route to Codex, still unsent:** the coplanar finding as a second independent physical justification for
ADR-012's outboard ruling, from the lighting side, with nothing to do with playable width.

## ⚠️ Shared checkout

Still `1807bc0`, far behind `origin/dev` (`2c3901c`), dirty across 17 tracked files. **Read from a
worktree or `git show origin/dev:<path>`.** It has already produced one wrong citation.

## Commit trailers

The repo hook **rejects the co-author trailer outright**, including the form the session system-reminder
asks for, and it fires on the **literal string anywhere in a heredoc** — it will block a `cat > brief.md`
whose text merely mentions it. Write around it. Commit without it.

## Immediately next

1. **Owner flies :5202 and gates #157** — specifically the z=0 rail seam.
2. **Owner flies :5200 and gates #155**, his own tuned values. Carried since session 26.
3. **Merge #156** (docs-only, lint clean).
4. **Cold-key lane reports** — four parameters with arithmetic, the two re-test numbers, the bearing
   trade stated as a choice. Relay the reasoning, not just the verdict.
5. **Kill the four orphan processes** (:5205/:2605/:5206/:5207) once the owner confirms `bloom-knobs` is
   abandoned.
6. **Run the 2-dot `git diff origin/dev HEAD` before EVERY merge.** Three branches in one week would each
   have silently reverted `dev`, and the 3-dot diff was innocent every time.

---

## Late additions — end of session 27

### #157 MERGED — the track lead-in is on `dev`

**`dev` is now `6981117`.** The owner flew :5202 and confirmed **there is now deck behind the start
point**. Head SHA verified equal to the gated SHA immediately before merging, and the 2-dot
`git diff origin/dev origin/feat/track-lead-in` was pure additions — no revert.

The local branch delete failed harmlessly (`../slur-worktrees/track-lead-in` still holds it). The worktree
and its stack on **5202 / 2602** are deliberately left up in case the owner wants to re-fly. Remove with
`git worktree remove` when he is done.

**Still `[unmeasured]` on the merged work**, and worth an eye next time someone is in a frame there:
whether the apron's rail is **continuous with the first real segment's rail at the z=0 seam**, and whether
the apron's lighting reads at the same intensity as the rest of the deck. The owner confirmed the deck is
there; he did not confirm the seam. The cold-key lane has been told its key lands on this apron too, and
to report — not fix — any seam or intensity step it makes conspicuous.

**Lane `leadin` cleared** (herdr name is `leadin`, pane `w2J:p1` — NOT `track-lead-in`, which
`send-keys` rejects with `agent_not_found`). It handed over cleanly at its ~166k seam with the facts file
committed.

### The cold key branches OFF #155, not off `dev` — my instruction was wrong

I briefed the lane to branch the cold key off fresh `origin/dev`. **It checked and refused, correctly.**
The key's entire premise lives only in PR #155:

- `FLOOR_EMISSIVE` / `FLOOR_EMISSIVE_INTENSITY` are **still present on `dev`** — the deck's flat emissive
  is deleted only on `art/emitter-array`.
- `FLOOR_METALNESS` is **1.0 on dev**; the 0.75 the brief asks to re-test is a #155 value.
- `emitter-array.ts` is a **new file in #155**, so `RAIL_EMITTER_RANGE` and `EMITTER_SLOTS` have no
  dev-side existence — "ship 600/24 in the same PR" is literally unbuildable on a dev-based branch.

A dev-based branch would have tuned a cold key against a deck that still lights itself, and every reported
number would have been measured off the wrong scene.

**Approved shape:** `art/cold-key` off `art/emitter-array` @ `11113e6`, PR opened **against
`art/emitter-array`** so it still reviews as its own 2-dot diff, retargeted to `dev` and rebased when #155
merges. **The rebase will be real, not a formality** — #157 changed `track-floor.tsx` and
`track-boundary.tsx`, the same files the key may touch.

**General lesson for the supervisor:** "branch off fresh `origin/dev`" is a reflex, and it is wrong
whenever the work's premise lives in an unmerged PR. Check what exists on the base before naming it.

### Correction to the cold-key brief

It is `StarLight`'s **mounting** the key reuses, not its direction source. `StarLight` derives direction
from `skyDirection(config.starBearingDeg, config.starElevationDeg)`; **the key's bearing is a free
parameter**, which is exactly why the bearing is the owner's question. What must be copied is the explicit
sibling target inside `SkyFollow` — without it the key's direction swings over the race's 8000u.

### Open PRs at end of session

| PR | Branch | Needs |
|---|---|---|
| **#155** | `art/emitter-array` @ `11113e6` | **owner's fly — carried since session 26.** Now also blocks the cold-key PR's retarget |
| **#156** | `docs/material-departures` @ `61f3010` | review/merge, docs-only, lint clean |

**#155 is now on the critical path for two things, not one.** Getting it flown and merged unblocks the
cold key's rebase onto `dev`.
