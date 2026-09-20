# Supervisor handover — session 13 (2026-09-19)

Short session, one job: the owner's standing request from session 12 — *"summarize the track, art first lets
brainstorm on it, prepare a clean plan for it and then push it on a lane."* Done. **The track lane is live
and working slice 1.** Blocks (task 7) is still queued behind it, by the owner's ordering.

## State at handover

`origin/dev` is at **`639a2f2`**. Nothing is open on GitHub — zero open PRs.

| Landed this session | What |
|---|---|
| #136 → `639a2f2` | `docs(art-pass)` — D6, D7, D8 into `02-track/README.md` §7; lane brief rewritten to four slices; INDEX row corrected |

Note `b2a0345` (**#135, `ART_MATERIALS.md` revision 3**) landed *between* sessions 12 and 13. Session 12
listed rev 3 as "still owed" and as a blocker on launching the lane. **It is done.** Any doc you find
warning that "M1 is partly stale" predates it and is itself stale — rev 3 is current and M1's element table
now permits sparse interior inserts.

## The lane

| | |
|---|---|
| Agent | `track-9f` (name changes on restart — always re-read `ListAgents`) |
| Worktree | `../slur-worktrees/track`, branch `art/track`, base verified `= 639a2f2` |
| Ports | client **5201**, server **2601** — stack running, both verified serving |
| Review URL | `http://localhost:5201/art-lab` |
| herdr | workspace `w2F`, agent pane `w2F:p1`, stack pane `w2F:p2` |

It has ACKed the brief, read the code first-hand, and is on **slice 1 only**: swap `TrackFloor` in as the
game's floor, delete `TrackRibbon`'s floor quads, retire the two-floors comparison switch. It is doing a
pre-delete frame-tap comparison first, which is correct and was asked for.

**Its next message is the slice-1 gate, with frames.**

## The three decisions taken this session — the reasoning, not just the verdict

All three were put to the owner with `AskUserQuestion` and all three came back as the recommendation. Full
text is of-record in `02-track/README.md` §7; this is why each one matters, so a fresh context does not
re-open it.

**D6 — the track boards govern seam density; board 17 is atmosphere.** Session 12 left this as "the single
biggest visual variable on screen", unresolved. It resolved quickly because the evidence is inside the track
package and is *newer* than board 17: board 24's panel table specifies *"sparse short emissive segments of
varied lengths and irregular spacing among mostly dark joints"* and excludes *"repeated lane-like cadence,
full glowing grid or a highlighted safe route"*. **The non-obvious half, and the one a cold context will get
wrong:** rev 3's M7 says boundary and inserts are separated by **continuity, not intensity** — *"making
inserts regular or continuous destroys that separation… which is the failure mode, not dimness."* So if the
inserts ever read as lanes, the fix is irregularity, **never** dimming them. Both are gameplay tier and both
may be equally hot.

**D7 — the emitter array is built before the floor's finish is judged.** The lane brief had floor material at
slice 2 and rail+emitter at slice 3. That contradicted D2's own justification for pulling the emitter array
forward at all — without it the task ships *"a dark grey ribbon with a marigold stripe"*. That argument bites
hardest on the **floor** slice, whose gate is *"reads as dark metal rather than grey plastic"*: dark metal
carries no information until something warm reflects off it. Same rule that put the background first in the
arc — judge each thing once, under final light. Order is now **swap → light → surface+wear → gaps**.

**D8 — board 25's wear is world-space noise in the D2 shader patch, not a second texture.** Board 25 froze
the wear treatment *after* the lane brief was written, so there was no slice for it. The obvious mechanism
fails its own gate: `track-texture.ts` is one 1024² canvas over a 16 × 20u panel, repeating 4× across the
ribbon and ~400× down it, and **a tile cannot hold a feature larger than itself** — while board 25 demands
*"sparse, broad, softly bounded patches"* with *"large readable features"* that *"avoid identical stamps on
adjacent tiles"*. A `roughnessMap` bolted on inherits the identical period, i.e. builds in the failure that
*"a tiling period the eye can lock onto is a failure"* forbids. World-position noise has no period by
construction, and since the material is **already** being patched through `onBeforeCompile` for D2's emitter
array, wear and light collapse into one shader instead of two systems that must be kept in agreement. Every
control board 25 names becomes a live uniform. The tiled canvas is **kept**, demoted to fine grain below ~1u.

## Two corrections to the record, both load-bearing

1. **Task 2 said "not started" / "no task-2 code exists".** Both untrue since #131. Fixed in the README
   header and §7 and in the INDEX row.
2. **#131's title says "the track's own floor material" and that is misleading.** What it landed is slice 0
   — tone mapping, lab lights, the `TrackRibbon`/`TrackBlocks` split. `TrackFloor` and `track-texture.ts`
   exist but are mounted **only** behind `/art-lab`'s `slab` toggle; `showFloor` is intact and the game's
   floor is still instanced 0.6u boxes. **D1 was never done.** Session 12's own arc table said "slice 1
   merged", which reads as though the floor swap had shipped. It had not.

## Decisions I took for the lane (not escalated — file layout is its call, but I confirmed)

**The `slab` layer becomes a `floor` layer rather than being deleted.** The brief said "retire the `slab`
toggle", meaning the *two-floors A/B comparison* that D1 kills. The lane pointed out that deleting the key
outright leaves the lab with no way to mount the floor alone — which is the one thing `lab-layers.ts` says
the lab exists for (*"the lab's primary job is judging the track surface itself"*). It keeps three
independent layers: **floor · rails · blocks**. Its reasoning was better than the brief's; taken.

## The open thread the next supervisor will have to route

**`buildFloorGeometry` builds the ENTIRE ~400-segment ribbon as one geometry in a `useMemo`**, where the
instanced floor only ever touches a ~49-segment window. The lane found this, not the brief. In the lab that
cost is already paid and invisible; after D1 it **moves to race start**, where a stall lands on the player.

It is measuring build time and vertex count on the game path at `TRACK_SEGMENTS=400`, cold module (not HMR
— a warm `useMemo` lies), and putting both in `LANE-FACTS.md` before it claims the frame-time half of the
slice-1 gate.

**The threshold I gave it:** a visible hitch (≈>100ms, but trust the eye over the number) is a
`NEEDS-DECISION` routed to the owner, because a stall at GO is gameplay-adjacent, not art. It is explicitly
told **not** to solve it inside slice 1. The option set I asked to be enumerated if it comes to that: build
during the **countdown**, where a stall is free and the descriptor is already known · **chunk** the ribbon
into N-segment geometries built lazily ahead of the ship · build once at **track-materialize** time rather
than component mount. Flagged cost of the chunking option: chunk boundaries are new seams in a mesh whose
entire purpose is continuity, and a gap straddling a boundary is the case that breaks. If it measures fine,
that goes in `LANE-FACTS` as a number — "measured, not a problem" stops the next context re-litigating it.

## Already flagged to the lane for the slice-2 gate, so it is not a surprise

**Metalness.** `ART_MATERIALS.md` M1 specifies bare conductor — **metalness 1.0, roughness 0.35–0.50** —
against the shipped `FLOOR_METALNESS = 0.12` / `FLOOR_ROUGHNESS = 0.62`. Metalness 1.0 removes diffuse
entirely, and `INDEX.md` §4 records the sky at **~linear 0.01** as an IBL source, so everything the rail's
specular does not reach goes **pure black**. That is either exactly the direction (*"there is no fill; shadow
sides go black"*) or a void with a stripe through it. **Not settleable on paper** — the lane renders both and
brings the pair to the gate. Do not let a cold context decide it from the sheet.

The lane was also told to record slice 1's four **forced** material deltas in `LANE-FACTS` as the baseline
(white base colour — base MULTIPLIES the map and `#050507` crushes the texture to flat black · the tiled map
· 0.62/0.12 · 2u thickness instead of 0.6u), because the metalness comparison is measured against them.

## Bloom is washing the frame out — owner's first-hand report, late in this session

The owner flew it themselves and reported the whole screen reading washed out. **This is most likely a
predicted consequence of slice 0, not a new defect** — but it is unmeasured, and it is dangerous to task 2's
gates, so it is routed and not closed.

*Verified-this-session:* `env-config.ts:152` — the shipped variant `C · Grid Void` carries
`bloom: { intensity: 1.2, threshold: 0.42, smoothing: 0.2 }`, and the comment at `:52` records those were
deliberately pushed up from `0.5/0.6` as *"too timid"* (ADD §11) — chosen when **every** emissive surface set
`toneMapped: false` and bypassed ACES entirely.

*Inferred, NOT verified:* #131 removed that opt-out from the **track** surfaces but its own commit message
says VFX kept theirs (finish gate, pickups, bolts, sparks, explosions, ship engines), because those values
trade against a bloom budget task 3 owns and that does not exist yet. So one frame now holds two populations
of pixels in different tone-mapping regimes feeding a single threshold tuned for one regime, at a threshold
low enough that much of the frame clears it. #131 also states plainly that the emissive re-tune was **not**
done, and slice 0's own gate note said to expect it to look worse.

**What the lane was told, and the instruction that matters:** *do not compensate for this in the track's
emissive values.* The failure mode being headed off is the obvious one — see a washed frame at the rail
slice, dial `RAIL_SURFACE.emissiveIntensity` down, and the rail is wrong forever while task 3 inherits a
scale built on a workaround. The bloom knobs are out of the lane's scope **in both directions**. It captures
**two frame-tap frames, bloom ON and OFF, identical camera and seed**, into `LANE-FACTS.md` with the three
bloom values, and it must **verify whether `/art-lab` mounts its own `EffectComposer`/`Bloom` and with what
values rather than assuming it matches the game** — if the lab and the game bloom differently, every
"bloom on" gate in the brief is measuring the wrong thing, and that must surface before slice 2.

**The line drawn for the lane, because it cuts both ways:** rev 3 §3 says *"Reference intensity 1.0 — the
track boundary strip defines it"*, so the rail IS the anchor the scene's intensity scale is later built on.
The rail's own emissive value is the lane's job; the bloom pass's response to it is task 3's. If a render
cannot separate the two, that is a `NEEDS-DECISION`.

**Scope call taken, not escalated:** the bloom budget is **not** pulled forward into task 2. It balances
against monoliths, asteroids and final-form pickups that do not exist yet, so setting it now against a
track-only frame means doing it twice — the exact deadlock that reset the earlier art attempt. The owner was
told this is the call and offered the alternative (pull it forward as D2 did for the emitter array); they had
not overridden it as of handover. **If they do, it becomes a new D-decision in `02-track/README.md` §7.**

## A stale instruction in the lane brief made the lane steal window focus — retracted, fix in flight

The owner noticed the lane focusing the Chrome window instead of using the frame tap. **The lane was
obeying its brief.** `LANE-BRIEF.md` §6 still carried the pre-#134 warning — *"Never gate from an automated
Chrome tab… The tab must be **foreground**"* — and this session's rewrite touched §0, §1, §2, §3 and §4 but
**not** §6. Supervisor error, not a lane error.

The diagnosis in that warning is still true (a backgrounded tab reports `visibilityState: "hidden"`, rAF
stops, the canvas reads black while DOM panels render fine). The **conclusion** is dead: the frame tap does
not depend on rAF, because it drives R3F 9.7.0's `advance()`, which gates on none of `frameloop` /
`internal.active` / `internal.frames`. That is what PR #134 bought.

Replacement §6 text was sent to the lane verbatim to commit in its own worktree (one writer, no conflict).
Its substance: capture through the tap, never steal focus; the live shared tab is for the **owner's
judgement**, not the lane's iteration, and only when the owner is actively looking or something reads
differently in motion than in a still; a black canvas is the hidden-tab symptom and the answer is the tap,
not focus; **canvas size is not the test** (a case measured 3456×1926, mounted, rAF still dead). The lane
was also asked to log the retraction in `LANE-FACTS.md`.

**Successor: verify this actually landed in the brief on `dev`.** If the lane's PR does not carry the §6
replacement, make it a docs commit — otherwise the next lane reads the stale copy and reinstates
focus-stealing. Related memories: `frame-tap-unfocused-capture`, `hidden-tab-blank-canvas`,
`chrome-tab-per-session-serialise-visual-gates` (the latter two are partly retired by #134).

## Still owed, carried from session 12 — both are the OWNER's call, not the supervisor's

- **`art/background` cannot be merged and should probably be deleted.** Fully superseded; the 2-dot diff is
  **−3730 lines** and merging reverts `dev` (sky `radius` back past R3F's far plane, the approved framing,
  `biome.json`, the pre-#131 `track-view.tsx`). Its worktree is still at `../slur-worktrees/background`.
  The 3-dot diff **hides this completely** — always check `git diff origin/dev <branch>` (2-dot) before
  merging a branch whose base is behind. This is the `#118`→`#119` failure mode.
- **`art/block`** (`30a1b3c`, +20 commits) has the **same stale base**, 2-dot −3731. Do **not** merge it
  directly — use the cherry-pick recipe in session 12's handover ("How `art/frame-tap` was landed"). It is
  task 7's starting point, whenever blocks come up the queue.
- **Stale remote branches** that can go: `art/art-direction-reorg` (#130, merged), `art/golden-reference-17`
  (#129, closed), `docs/art-materials-rev3` (#135, merged), `fix/biome-skip-art-direction` (#132, merged).
  **Keep `art/procedural-bg`** — it deliberately preserves the procedural sky task 1's cheap-path pivot set
  aside.
- **Shared-checkout tidying** — stale pre-reorg copies at old paths plus modified files now identical to
  `dev`. The cleanup was blocked by the permission classifier in session 12 and still needs the owner to
  approve the discard. **The shared checkout is also 6+ commits behind `origin/dev`** (local `dev` sits at
  `1807bc0`); it is read-only by protocol so this is cosmetic, but it will confuse a cold context that
  greps it instead of `origin/dev`. Grep `origin/dev`, not the working tree.
- **Stale herdr workspace `frame-tap` (`w2E`)** points at a worktree that no longer exists on disk.

## Process notes worth keeping

- **The docs-only gate got run in full this time** (typecheck · lint · 75 shared · 61 client · build) and
  the 2-dot / deletion-filter checks were run before pushing. Session 12's #130 went red on `dev` for two
  commits on the reasoning that docs cannot break a code gate — biome lints JSON. It costs ~90 seconds.
- **The `Co-Authored-By` trailer is rejected by this repo's commit hook**, even though the session-level
  attribution instructions ask for it. The hook wins; commit without it. (Memory: `no-coauthored-by-trailer`.)
- **`gh pr merge --delete-branch` fails to delete the local branch when a worktree holds it** — harmless,
  but remove the worktree first, then `git branch -D`. The remote branch is deleted either way.
- **The lane's dev stack crashed on first start**: `apps/server` raced ahead of `@slur/shared`'s first
  `tsc` compile and died on `ERR_MODULE_NOT_FOUND` for `@slur/shared/dist/index.js`. The client came up
  fine, so a `curl` on the client URL reports a healthy stack that is half dead. **Read the stack pane, do
  not just curl.** Restarting after shared finishes compiling fixes it permanently.

## ▶ NEXT ACTION

**Wait for `track-9f`'s slice-1 gate message** (it will carry frames). Then:

1. Judge it against the brief's slice-1 gate: ribbon continuous, gaps still read as holes with depth, no
   z-fighting, **frame time not regressed** — and check it actually did the pre-delete comparison, because
   that is the last chance to make it.
2. Route the `buildFloorGeometry` measurement: number in `LANE-FACTS` if fine, `AskUserQuestion` to the
   owner if it is a visible hitch.
3. Then slice 2 — **the rail and the emitter array**, with the metalness pair rendered both ways.

Slices 3 (floor finish + board-25 wear in one shader) and 4 (gaps) follow. **Then blocks (task 7)** — the
owner's session-12 request was *"we will do the same for the block as well"*, i.e. summarize → brainstorm →
plan → lane, exactly as this session did for the track.

Talk to the lane with **`SendMessage` addressed by its `ListAgents` name**, never `herdr agent prompt` —
the relay drops packets silently and the failure looks exactly like success.

**Chrome is running** (the owner started it late in this session) and the lane has been told. The division
it was given: **frame tap for its own measurement** — deterministic, same camera and seed, no focus needed,
which is what the slice-1 before/after comparison requires — and the **live shared tab when the owner is
judging**, parked on whatever needs a human eye. It was re-warned that a black canvas in an automated tab is
`visibilityState: "hidden"` killing rAF, not a renderer bug, and that canvas size is not the test.
