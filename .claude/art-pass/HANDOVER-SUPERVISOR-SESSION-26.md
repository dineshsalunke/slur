# Supervisor handover — session 26 (2026-09-20)

Short session, one thread: merge the A/B/C PR, then chase why the deck renders black. It ends with a
real art-direction question in front of the owner and a lane holding clean, gate-green work.

## What merged

**PR #151 → `dev` @ `1b4d760`** — *"the rail stands outboard, in code — delete variants A/B/C"*. ADR-012
is now true in the code, not just the docs.

**Three branches today would each have silently reverted `dev` if merged as they stood.** #151 was
deleting `strictPort: true` back out of `vite.config.ts`; #150 was deleting **74 lines of `DECISIONS.md`
(ADR-012)**, the whole A/B/C deletion, `strictPort`, `ART_MATERIALS.md` and `ART_SCALE_REFERENCE.md`. In
every case the rebase applied **cleanly** and only the **2-dot** `git diff origin/dev HEAD` showed it —
the 3-dot diff was innocent every time. This is memory `reused-branch-stale-base-reverts-dev` recurring
three times in one session. **Run the 2-dot diff before every merge. It is not optional.**

## Open PRs

| PR | Branch | State | Needs |
|---|---|---|---|
| **#150** | `art/bloom-input` @ `62d89d8` | rebased, gate green, 2 files dev-only (+48/−19) | **owner's word — carried unpaid since session 24** |
| **#154** | `docs/track-readme-status` @ `dca888b` | docs-only, lint run | review/merge |

**#150 matters more than its size suggests:** it makes the bloom knobs write the live effect instead of
orphaning the `EffectPass`, which is the toggle needed to settle whether the rail cores are blowing out
from bloom or from `MARIGOLD_REFERENCE_INTENSITY = 2.0`.

## THE FINDING — edge rails cannot light this deck

The owner's call, on a frame: **delete the deck's flat emissive.** It was never art direction —
`FLOOR_EMISSIVE = '#c8d0d8'` @ 0.05, whose own comment recorded it as *"the deck's only brightness
control"*, a stand-in from when nothing lit the deck at all. View-independent per-fragment add = a grey
pedestal with zero form, swamping the low end the streaks need. Deleted, not dialled to zero.

With it gone the deck reads **black everywhere except one specular glint near the camera, one side only.**
That render settles three things:

1. **The array is not broken.** A visible glint proves the `onBeforeCompile` patch compiles, uniforms
   upload, `RE_Direct` runs. Worth stating: this lane had already shipped one fully green gate with the
   light doing literally nothing, so a black deck was ambiguous evidence until something lit up.
2. **The black is a correct render of a wrong lighting geometry.** Emitters at `|x| = 32.5`,
   `RAIL_EMITTER_LIFT = 0.5`, against a 64u deck with a +Y normal — **0.88° above the surface plane,
   `N·L ≈ 0.015`** at the centreline. Measured headlessly: centreline irradiance ≈ 3.7e-2 vs 0.43–8.0 one
   unit inboard of the rail. **Too little, not zero — no second wiring bug.**
3. **Dropping metalness does NOT fix it, and this is the load-bearing point.** `RE_Direct` multiplies
   *both* the diffuse and specular terms by `dotNL`, so backing metalness off restores a diffuse lobe that
   meets the same 0.015. It is the reflexive fix, it costs M1, and it buys nothing. **Do not let anyone
   "solve" this by dropping metalness.**

**General form:** two 1u strips at the edges of a 64u plane are, for everything but the last couple of
units, *functionally coplanar with it*. Same finding that killed the inset reading and corroborated
ADR-012 from the lighting side — **it survived the fix for it.** At `N·L = 0.015`, matching an overhead
source needs ~65× and the near-rail band blows out long before the centre lifts. Intensity is not the dial.

## The question in front of the owner — NOT taken

1. **Roughness.** `floorRoughness`/`floorMetalness` are now live knobs (see below), committed values
   untouched at **0.42 / 1.0**. Hypothesis `[inferred, unmeasured]`: 0.42 scatters into nothing the
   grazing streaks §8 ruled for (*"grazing-angle specular streaks, NOT mirror reflections"*); the
   wet-road case says they appear as roughness drops toward 0.05–0.15. If that holds, **M1's 0.35–0.50
   roughness band was written for a surface lit by something** and does not survive edge-only lighting.
2. **Behind it, a question no slider answers:** does the deck get a **cold key from above** (the star
   contributes nothing to it today), or is the deck *meant* to be a void the rails draw the edges of?
   ***"There is no fill" is not the same as "there is no key".*** Owner's call. Not resolved here.

## The asymmetry — supervisor's hypothesis was WRONG, ruled out from code

I suspected the K-nearest scan starving one rail (gaps cutting one side's runs shorter). **Wrong.** The
lane re-ran `buildRailRuns`/`selectNearest`/`feedEmitters` plus the shader's own maths (Karis `emT`,
window clamp, `getDistanceAttenuation`, `BRDF_GGX`) headlessly against the real
`resolveTrack(procgenDescriptor(1234))`:

- 78 runs, **exactly 39 per side**; over 1600 ship positions a side was never starved, worst 3 vs 2.
  **Gaps kill both outer edges at once** — the runs break in pairs, which is why the premise fails.
- Camera roll, window-clamp stranding, Karis wrong-end: all symmetric to **1.000×**, with per-side
  attribution confirming each strip is lit by its own rail (fromL 1.8e+2 / fromR 1.3e-3).
- Slots never bind: 2–10 live of 12.

**Prediction from code:** a *symmetric pair* of strips hugging `x = ±31`, ~19–20u ahead, at screen
(±0.72, +0.22) — upper-middle toward both edges. **Not one patch low and near.** Near-camera deck cannot
be rail-lit and the rails are outside the frustum at that range.

**So the patch is probably NOT the emitter array.** Untested discriminator for whoever has the tab:
**drag `rail emitter → intensity` to 0.** Survives ⇒ it is another emissive layer still in shot
(`BOUNDARY_SURFACE`, a `LETHAL_SURFACE` block at intensity 2.2, or the ship — none touched by the
deletion). Vanishes ⇒ the arithmetic is missing something.

**Distant deck is unlit BY DESIGN — tell the owner flatly, it is not a failure.**
`RAIL_EMITTER_RANGE = 150` is both the tube clamp and the cutoff distance, and the falloff reaches
exactly zero at the same distance the clamp drops the run, so nothing pops on entry.

## Lane `emitter-array` — clean, gate green, NO PR

`art/emitter-array` @ `7250961`, pushed, tree clean, rebased on `1b4d760`. Worktree
`../slur-worktrees/emitter-array`, ports **5200/2600**, stack serving `/art-lab` → 200. herdr agent
`emitter` (pane `w2H:p1`); `ListAgents` address **`emitter-array-4b [b81564]`**.

Commits: `e5f8bda` emitter array · `a6e5d8e` lift above deck · `acfee36` emitter outboard · `346bd7f`
delete the deck emissive · `a03228b` roughness/metalness knobs · `977ad28`+`7250961` LANE-FACTS.

Gate at each: typecheck · lint (ratchet clean) · shared 75/75 · client 74/74 · server 4/4 · build.

### As-built worth keeping

- **The rebase was clean and still semantically wrong.** The emitter sat at `±(HALF_WIDTH − w/2)` = ±31.5,
  the retired inset position, hovering over playable deck. Post-#151 the band is
  `[HALF_WIDTH, HALF_WIDTH + BOUNDARY_W]`, so it is now `±32.5`. **Git cannot see this class of conflict.**
- **The old test asserted the emitter's exact x against the lane's own constant, so it passed at either
  position.** Now asserts `|x| > HALF_WIDTH` too. A test written against your own magic number verifies
  arithmetic, not intent — worth generalising.
- **Knobs are recompile-free, verified against installed three 0.185.1 rather than assumed:**
  `WebGLPrograms.js:137-138,231-232,452-453` keys the program cache on `roughnessMap`/`metalnessMap`
  **presence, never the scalar**; `WebGLMaterials.js:383,393` refreshes both uniforms per frame. Safe live.
- **The emissive deletion forced a typecheck cascade the lane did not guess:** `floorEmissive` was the
  ONLY string field in `DebugTuning`, so `DebugTuningColorKey` collapsed to `never` and
  `setDebugTuningColor` failed TS2322 — `debug-color.tsx` became *unusable*, not merely unused. All three
  deleted. Typecheck found it.

### Still open on the lane

isotropic-vs-anisotropic (**still blocked — its tab cannot render**: `visibilityState: "hidden"`, rAF
dead, frame tap 504s; every visual claim from it is `[unmeasured]`) · frame-time cost of the patch
`[unmeasured]` · D8 world-space wear not started, by design · no PR opened yet.

**The choice is cheap when it comes:** anisotropy enters inside `RE_Direct_Physical`
(`lights_physical_pars_fragment.glsl.js:178-183`), so the **injected GLSL is byte-identical either way** —
it is a material-class swap and nothing else.

## Process notes

- **Lanes do the building** (owner's standing instruction, session 25). Held this session: every code
  change went to the lane, supervisor wrote only docs. Keep it.
- **Clearing a lane from outside works**: `herdr agent send-keys emitter / c l e a r enter`, then
  `SendMessage` lands in the fresh context. Pair it with a self-contained brief that forbids re-reading
  the big docs. Used once here at the lane's ~241k seam; it handed the unstarted task over rather than
  applying it half-way, which was the right call.
- **Peer messaging worked all session** to `emitter-array-4b [b81564]` — including after the clear
  (session, name and socket survive).

## Carried, untouched

Fly 7.5u through 8u pillar fields with `fly` ON (ADR-011, #142) · `MARIGOLD_REFERENCE_INTENSITY` at 2.0,
authored pre-bloom, cores blowing near-white `[unmeasured]` — discriminator is bloom-off, which is what
#150 unblocks; a prior lane already ruled against dimming the strip to hide bloom washout · occlusion at
7.5u · rail breaks over full gaps · `CONTRIBUTING.md`'s false trailer-hook claim · **the two divergent
`docs/art-direction/` snapshots, neither on `dev`** (shared checkout's dirty 17 files vs
`docs/codex-reconcile` @ `84291fb`) — owner's call, and a `git pull` in the shared checkout will collide
with it · the rail's channelled cross-section (`02-track/RAIL-PROFILE.md`) stays **PARKED as polish**,
do not re-ask its five open parameters.

**Route to Codex:** the coplanar finding is a second, independent physical justification for ADR-012's
outboard ruling, from the lighting side and with nothing to do with playable width. Still not sent.

## ⚠️ Shared checkout

Still `1807bc0`, far behind `origin/dev` (`1b4d760`), dirty across 17 tracked files. **Read from a
worktree or `git show origin/dev:<path>`** — it has already produced one wrong citation.

## Commit trailers

The repo hook **rejects `Co-Authored-By` outright**, including the form the session system-reminder asks
for, and it fires on the **literal string anywhere in a heredoc** — it will block a `cat > brief.md` whose
text merely *mentions* the trailer. Write around it ("the co-author trailer"). Commit without it.

## Immediately next

1. **Owner turns `deck → roughness` down on :5200** and says whether streaks appear. That is the whole
   gate right now.
2. **Owner drags `rail emitter → intensity` to 0** to identify the mystery glint.
3. Then the cold-key-from-above question, which is his and only his.
4. Merge **#150** (one word) and **#154**.
5. Lane still owes: a PR for `art/emitter-array`, and isotropic/anisotropic once anyone can render.

---

## Late additions — end of session 26

### Merged

- **#150** (`art/bloom-input`) — bloom knobs write the live effect instead of orphaning the `EffectPass`.
- **#154** (`docs/track-readme-status`) — the README corrections + the rail gate result.
- `dev` is now **`2c3901c`**. Both 2-dot diffs were clean and both PR heads were verified against the
  gated SHA immediately before merging.

### PR #155 — OPEN, the whole emitter-array arc, awaiting the owner's fly + my review

`art/emitter-array` @ `cccf1da`, rebased on `2c3901c` (2-dot == 3-dot, rebase ate nothing), gate green:
typecheck · lint (ratchet clean) · shared 75/75 · client 74/74 · server 4/4 · build.

**The owner dumped tuned values off a live frame. Only THREE actually moved:**

| constant | was | now |
|---|---|---|
| `FLOOR_ROUGHNESS` | 0.42 | **0.4** |
| `FLOOR_METALNESS` | 1.0 | **0.75** — departs `ART_MATERIALS.md` M1 |
| `RAIL_EMITTER_RANGE` | 150 | **400** |

Everything else already matched the tree. The `GRID_VOID` bloom block came in with #150. **`AMBIENT_INTENSITY`
was ALREADY 1** — a pre-existing departure, not a new one; I briefed it wrongly as a change and the lane
caught it and recorded it as retained rather than claiming an edit. Note `GRID_VOID` is `ENV_VARIANTS`
variant **C**, not A.

**Supervisor still owes: the departures record.** `FLOOR_METALNESS` 0.75 departs M1's bare-conductor
metalness 1.0, and `AMBIENT_INTENSITY = 1` is fill against *"there is no fill; shadow sides go black."*
Both belong in **`docs/ART_MATERIALS.md`** with an explicit *decisions + departures* section quoting the
package wording they change — **never** by editing `docs/art-direction/`, which is Codex's read-only
workspace. **NOT DONE.**

### RANGE 400 — a real finding, flagged not fixed

Clamp and cutoff still agree at 400, so nothing pops *entering* range. **But slot contention is now
binding where it never was**, measured over 1600 ship positions, seed 1234:

| | range 150 | range 400 |
|---|---|---|
| all 12 slots live | never | **477/1600 (30%)** |
| run in range, evicted for want of a slot | **0** | **167/1600 (10%)** |
| max contending | ≤10 of 12 | **16 of 12** |

**An evicted run is still contributing non-zero light**, so unlike the range cutoff — which fades to
exactly zero at the boundary — an eviction can **pop** as the 12-nearest set churns. If intermittent
down-track flicker is reported, this is it. **The fix is more slots, not less range.** Side balance still
holds at 400 (one-sided 0/1600, worst 7L vs 5R). Left as the owner dialled it: the frame chose the value.

### ⚠️ ALL PRE-VALUES ARITHMETIC IS SUPERSEDED

Every per-fragment conclusion in `LANE-FACTS.md` about **what lights the deck** was computed at
`metalness 1.0`, no fill, `range 150`. The committed values are **0.75 / ambient 1 / 400**. At 0.75 there
is a **diffuse lobe again** and ambient 1 is a real term, so a source that contributed nothing before can
now dominate. The lane recorded its own caveat: the Karis reflection-ray point choice *"under-reports the
diffuse term — irrelevant at metalness 1.0 … a real error the moment metalness is dialled down."*

**What still stands** (geometry and selection, not material): the rail array is symmetric per side — 78
runs, 39 each, one-sided 0/1600 — and its predicted response is a symmetric **pair** of strips at screen
`(±0.72, +0.22)`, upper-middle toward both edges.

### In flight — the right-side specular

Lane cleared at its ~159k seam and re-briefed; **working as of handover.** Diagnosis only, fix nothing.
**Strongest suspect: `star-light.tsx`**, a *directional* source — off-axis to the right it puts exactly one
broad sheen on that side, and at metalness 1.0 with no fill it would have been nearly invisible. Also in
the queue: `BOUNDARY_SURFACE`, a `LETHAL_SURFACE` block at 2.2, `DRAG_SURFACE`, the ship, `SkyEnvironment`
as IBL now that there is a diffuse lobe, and bloom bleed off an edge-of-frame object (not a deck response
at all). Owner's cheap discriminator, still unrun: **drag `rail emitter → intensity` to 0.**

### Lane state

`art/emitter-array` @ `cccf1da` pushed, tree clean, stack serving :5200. herdr agent `emitter`
(`w2H:p1`), `ListAgents` address **`emitter-array-4b [b81564]`**. Cleared twice this session at ~241k and
~159k; both times it handed the unstarted task over rather than applying it half-way. **That is the
behaviour to keep.** Still cannot render — `visibilityState: "hidden"`, rAF dead, frame tap 504s; every
visual claim from it is `[unmeasured]`.

### Immediately next

1. **Owner flies :5200 / #155** — his own values, his call to merge.
2. Lane's star/right-side-specular report lands → relay the reasoning, not just the verdict.
3. **Supervisor writes the M1 + ambient departures record into `docs/ART_MATERIALS.md`.**
4. Consider more `EMITTER_SLOTS` if down-track flicker shows up at range 400.
5. Still unsent to Codex: the coplanar finding as a second physical justification for ADR-012.

### Queued, not started — the track lead-in

Owner, end of session: *"can we start track 8-10u behind the start point."* Written up as
**`.claude/art-pass/02-track/BRIEF-TRACK-LEAD-IN.md`**, deliberately NOT dispatched — it needs a decision
first and the lane was mid-task.

It is not the cosmetic tweak it sounds like. The chase cam is `back: 15` while the track starts at the
spawn point, so the bottom of frame looks past the track's own origin into space — visible as the black
band in his screenshots. **But `DEFAULT_TUNING.respawnSetback` pushes a respawning ship back in world-z,
and near the start it has nowhere to put you** — either it clamps (the stake silently vanishes for early
deaths) or it drops the ship behind the first segment where there is no floor. **Check which; if the
latter, this is a live gameplay bug and the lead-in is its fix.**

The decision: a **client-only apron** (cheap, desyncs the moment a ship can actually reach negative z —
check reverse throttle and the respawn setback) versus **the generator genuinely starting at z = −10**
(in the shared sim path, moves progress/finish/segment accounting, fixes respawn for free). **Recommended:
the latter** — the contract exists so the sim depends on the `Track` abstraction, so extending the
abstraction is the move it is designed for; an apron the sim does not know about is a special case waiting
to be forgotten. Also settle: flat and hazard-free apron (yes), and **rails running along it** — rails are
the only thing lighting the deck, so an unrailled apron renders as a black slab. Size it by computing
where the bottom of frame meets `y = 0` at spawn, not by shipping his eyeball 10u.

### Queued — range 600–800 needs `EMITTER_SLOTS` raised with it

Owner, end of session: *"the rail emitter range should be around 600-800."* **Dispatched to the lane as a
measurement task, not a change.** The range is not the constraint; the slot count is.

At the just-committed 400 the lane already measured contention binding: 12/12 slots live in 30% of 1600
positions, a run **in range and evicted** in 10%, up to 16 contending. Runs in the window grow roughly
with range, so at 600–800 eviction becomes the normal state — and an evicted run is still contributing
**non-zero** light, so every eviction is a visible **pop**, unlike the cutoff which fades to exactly zero.
**Raising range alone would trade a hard horizon for a flickering one.**

Asked for: max runs in range at 600 and at 800; the `EMITTER_SLOTS` value where eviction hits zero; the
value where it drops under 1%. **Both figures** — the gap between them is the owner's call. Plus the cost:
uniform count against the platform limit, per-fragment loop work, and whether the CPU scan stays
allocation-free at larger K.

**Hard constraint restated to the lane:** fixed-size stays fixed-size — a varying light count recompiles
the shader mid-race, which is the whole reason the array size is a GLSL literal. Raising it is a
**build-time** change and must never become a live knob; `defines.NUM_EMITTERS` is not an escape hatch,
since a `define` change is also a recompile. Committed values unchanged until the owner picks the pair.

### Track lead-in — DECIDED: Option B (owner, 2026-09-20)

**The track genuinely starts ~10u before spawn.** Not a client-side apron. Option A is closed — do not
re-propose it as an optimisation. Reasoning he accepted: the contract exists so the sim depends on the
`Track` abstraction and never on how the track was produced, so extending the abstraction is the move it
is designed for; an apron the sim does not know about is a special case waiting to be forgotten by whoever
next touches respawn.

Spec is in **`.claude/art-pass/02-track/BRIEF-TRACK-LEAD-IN.md`**. **Needs its OWN worktree off fresh
`origin/dev`** — shared-sim work, must not ride the `art/emitter-array` client render branch.

Build order that matters: **(1)** check `respawnSetback` near the start first and report — clamp, or ship
placed behind the first segment with no floor? That decides bug-fix vs framing-fix. **(2)** size by
arithmetic from `CHASE` (`back 15`, `height 7.5`, `fov 70`, `lookAtLift 6`), report the number before
laying geometry; 10u is his eyeball figure. **(3)** apron is flat and hazard-free. **(4)** the rail runs
along it or it renders as a black slab. **(5)** determinism rules apply — it is in the
descriptor → `resolveTrack` path.

**The decision inside the decision, to be stated explicitly in the PR:** does **z = 0 stay the spawn
point** with the track extending to negative z, or does **everything shift** so the track starts at 0 and
spawn moves to +10? The first keeps every existing z meaning what it meant and is almost certainly right.
**Must not be settled implicitly by whichever is easier to type.**
