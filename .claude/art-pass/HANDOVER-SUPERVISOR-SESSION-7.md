# Handover — supervisor session 7 (2026-09-19). Supersedes `HANDOVER-SUPERVISOR-SESSION-6.md`.

**Assume no chat history.** You are the supervisor: lanes execute, you brainstorm, write, decide and relay.
Read session 6's handover for task 2's five decisions and task 7's rationale — both still stand. This file
records what moved after it.

---

## 0. State in one paragraph

**Two lanes are running in parallel**: `art/track` (task 2) working the owner's first gate finding, and
`art/block` (task 7) starting the sealed deadly block. Task 1 is merged. Nothing is blocked on code. What
needs a **human** is the owner's eye — once the track lane clears the black sphere, the slice-0 gate can
actually be judged, because right now the sphere makes the rest of the frame unjudgeable.

---

## 1. The session started by discovering a second supervisor

The owner said they had accidentally closed Claude. **They had not — they had forked it.** The previous
supervisor was launched with `--fork-session --resume`, so it kept running detached after its window
closed: still `busy` in `ListAgents`, socket live in `/tmp/cc-socks/`, and **still issuing instructions to
the track lane** for ~35 minutes. The lane was the only party that could see both voices, and it flagged
the conflict rather than guessing which to obey. That was correct and is worth reinforcing.

Resolution: the owner made this session authoritative, the old supervisor handed over in full as prose, and
the owner had it killed (`99817` terminated). **Before taking over from a "dead" session, check
`ListAgents`, `ls -l /tmp/cc-socks/` and `ps -o pid=,lstart=,command= -p <pid>`.** Saved as the memory
`forked-session-survives-close-dual-supervisor`.

**One fact the handover corrected, because it had already drifted through two paraphrases:** there was never
a slice-0 verdict. The owner's earlier *"the planet is in centre, ideally on the right"* arrived unprompted
and self-described as "one small note" — an observation, not a gate result. Do not treat it as one.

## 2. `art/track` — task 2

Branch pushed to `origin/art/track` (it had been three commits living in a single worktree). Commits:
`604bf0c` brief/docs · `1bb5839` slice 0 · `c937888` sky knobs · then two docs commits (`6fd15f2`,
`b74581c`). Gate green at `c937888`. **Slice 1 not started.**

Its state doc is **`.claude/art-pass/02-track/LANE-STATE.md`**, committed on the branch, and it is the
authority — it replaces the lane's chat history and is rewritten wholesale each handover, never appended to.
Read it before instructing that lane.

**The lane was cleared and restarted** (it reported ~212k tokens/turn, at a clean gate). Old context
recoverable via `claude --resume 83c77e38-86a3-4d6b-869f-9f0acc662ef0`. The fresh agent is `track-82`; it
passed a read-check before touching code, and caught a real flaw in my doc — it hardcoded its own HEAD SHA,
which is stale the instant it is committed. Fixed: the doc now points at `git log -1` and names only code
commits. **A state doc must not name its own commit.**

**Its current job is the owner's first gate finding, not slice 1.** The owner looked at the frame and
reported *"there is a black sphere in front of the track"*, and confirmed it is **pinned to the camera** —
so not a world object. Two hypotheses, distinguished by whether the track is truly *occluded* or merely
*dark*: a camera-centred backdrop sphere writing depth, or an unlit mesh (planet body, or drei
`<Environment>`'s `<Lightformer>` children becoming visible in-scene). It may be the **same** observation as
"the planet reads centre" — the source jpg puts the planet's centre just past the right edge with only a
crescent in frame, which is why "centre" was surprising on paper. Full framing in `LANE-STATE.md` §4.

> **The obvious test is confounded — don't use it.** Toggling `backdrop` off turns the whole background
> black, so a black sphere against it is unreadable either way. The owner tried it and said so; they were
> right, and my asking was a badly designed test.

## 3. `art/block` — task 7, now LAUNCHED

Worktree `../slur-worktrees/block`, branch `art/block`, base **verified** equal to `origin/dev`
(`1807bc0`). Ports **5202 / 2602**, stack up and both ports returning 200 before the agent was started.
herdr workspace `w2D` (agent `w2D:p1`, stack `w2D:p2`). Peer name: **`block-6b`**. Started with
`--permission-mode auto` and confirmed authenticated (model + cost line, no login prompt) before briefing.

Brief: `.claude/art-pass/07-blocks/LANE-BRIEF.md` (218 lines). The three untracked art-pass docs were copied
in — they are byte-identical across both checkouts (verified) and reach `dev` only through this lane's PR,
so the lane commits them with its first commit.

It passed its read-check and reported two facts worth carrying:
- **`/iso-block` via an existing `<IsoLab>`** is its route — it arrived at isolation independently, which is
  the right instinct (isolation is what makes lanes parallelisable; `/art-lab` renders the whole track).
- **GDD §0 calls today's 4u × 8u footprint "a generation artifact, not a rule"** — so width and depth are
  genuinely free, and that freedom is the whole silhouette budget. Height is fixed at 8u because the block
  is deliberately above double-jump reach; a shorter one reads as hoppable, which is a gameplay lie.

**The owner's three questions — ANSWERED and approved.** Decisions of record for this lane:

- **B1 — Route: `/iso-block`, built on the existing `<IsoLab>`.** The load-bearing reason is not the brief's
  say-so: **`/art-gallery` is coupled to the file `art/track` is rewriting** — `art-gallery/subjects.tsx`
  imports `LETHAL_SURFACE` from `game/scene/track-materials.ts`, so building there puts this lane inside the
  other's blast radius. `/art-lab` renders the whole track and `art/track` owns every file in it.
  `iso-lab.tsx`'s own header states the isolation contract: adding a route touches only your own directory
  plus one adjacent line, "the constraint this design was built around".
- **B2 — Contact shading is NOT this lane's gate, and that is correct.** The owner asked how an isolated
  route would judge the track spec's *"clear hazard-to-floor contact shading"*. It structurally cannot —
  there is no floor, and faking one means inventing the dark-material value task 2's slice 2 is about to
  define. It is a **two-ingredient composition read** that gates in `/art-lab` *after* `art/track` merges and
  the block is wired into the instanced blocks. **This lane exists to make that later gate possible, not to
  pre-empt it.** The lane named this instead of faking it; that is the behaviour to reinforce.
- **B3 — Board: `docs/art-direction/boards/10_obstacle_blocks_final.png`** (the named golden reference in
  `handoff/04_OBSTACLES.md`), cross-checked against `12_approved_scene_marigold_depth.png`, which sits
  *above* individual boards in the INDEX §2 authority order. Board 10 = asset identity; board 12 = whether
  the material belongs to the world; **dimensions from `ART_SCALE_REFERENCE.md` §2 only**. Board 10 is
  explicitly "no variable height, no cell notation, no vertical stacks" and depicts **disallowed** stacks —
  take material and silhouette language from it, no dimension and no stacking. Panels get cropped at native
  resolution via `make-refs.sh crop`; the surface panels do not resolve when the 1536×1024 poster is read
  whole. **Board 10 does not specify seam count, placement or width** — only "sparse marigold seams" — so
  that is the lane's to propose, not to assume.
- **B4 — Lighting: `rig={false}` plus the lane's own `<DeepSpaceSky config={DEEP_SPACE} />`.** The tension
  the lane found: **`<IsoLab>`'s default rig IS a lane-local `ambientLight` + `directionalLight`** — the very
  thing D4 deleted from `/art-lab` — so "use `<IsoLab>`" and "no lane-local lights" reconcile only the
  `/iso-sky` way. Neutral rig stays a one-click sanity check, never the gate. **Shadow sides going black
  under a near-black sky with no fill is the direction, not a bug to light your way out of** — if the block
  needs lane-local fill to look good, the block is wrong.
- **B5 — Do NOT touch `iso-lab.tsx` to decouple the scale ruler; assert the 8u height in a test.** The lane
  offered both. The test is the stronger instrument for a dimension that *encodes un-jumpability* — it fails
  loudly. Editing a shared file to gain a visual aid trades a hard check for a soft one and takes on
  cross-lane risk for it. The ruler's emissive cyan `#3BD6FF` is off-palette and a bloom magnet beside a dark
  block, so losing it with `rig={false}` is a feature. Lateral scale comes from the ground `Grid`
  (`cellSize = CELL` 4u, heavy section 64u = one track width), enabled explicitly — but **`CELL` is an
  authoring snap grid only**, a ruler for the reader, never a constraint on block size.

The lane is cleared to build the route, rig wiring, grid and 8u assertion — **but not the block's own
silhouette or material** until its design recommendation is approved.

**Its next deliverable to the supervisor** is the instancing decision as a recommendation, before
implementing: blocks render as an `InstancedMesh` scaling a unit box, so authored chamfers and seams
*stretch* with instance size. Options to weigh are triplanar/world-space material, world-derived UVs,
per-size variants, material-only detail, or accepting the stretch.

**Its escalation trap:** ADR-009's fallback proposes `Alert Red #FF4B3E` on sealed blocks if silhouette
alone fails, which contradicts the frozen no-red palette. Not the lane's to take.

## 4. Corrections to standing knowledge, both now in memory

1. **The hidden-tab trap: canvas SIZE is not the diagnostic.** The standing note said a black canvas comes
   with the 300×150 default because R3F never measures. The track lane measured a case at **3456×1926** —
   correctly sized, R3F fully mounted, rAF still dead. `visibilityState` is the only reliable check. Second
   signature from the same case: a rAF-based probe through `javascript_tool` **hangs** the CDP evaluate to
   its 45s timeout; **that hang is the diagnosis**, not a frozen renderer. Memory
   `hidden-tab-blank-canvas` corrected.
2. **`biome` treats formatting as a lint *error*.** Run `pnpm format` before `pnpm lint` or the gate fails
   on nothing. Cost the track lane two failed runs. Now in `LANE-STATE.md` §8.

Also confirmed the hard way, already known: the commit hook **rejects a `Co-Authored-By` trailer**, and the
session's own attribution instructions tell you to add one. Commit without it.

## 5. Next actions, in order

1. **Await `track-82`'s diagnosis of the black sphere** — what the object is and which hypothesis held,
   before any fix. It was told not to land a fix on a guess.
2. **Then the owner's real slice-0 gate** at `http://localhost:5201/art-lab`, bloom on **and** off, judged
   moving from the chase camera. Panel state: slab ON, rails ON, blocks OFF, backdrop ON, env/ships/finish
   off. Expect it to look **worse** than before — D4 removed the lights it was flattering itself with.
   Telling honest-and-ugly apart from broken is part of the job.
3. **Answer `block-6b`'s three open questions**, then approve its instancing recommendation.
4. **Track slices 1→4**, each gated by the owner's eye: floor swap (D1) → panel language → rail + emitter
   array (D2, isotropic-vs-anisotropic settled **by rendering**) → gaps (the hardest read).
5. **Then the deferred `/iso-sky` sky gate** with a real track in frame. `Tone map` is no longer one of its
   knobs (D3 forecloses it ON); `Field of view` **140** and `Tilt` **0°** remain. One procedure note the
   owner added: that gate's roughness self-test must run with **`Star light` OFF as well as `Env rig` off**,
   because a star light lights the probes exactly as a neutral rig light does — which is the entire reason
   `/iso-sky` drops the lab rig.
6. **The D3 emissive re-tune** remains the unpaid bill, and is **not** done. Values in
   `track-materials.ts` are all still `dev`'s. The lane's prediction that ACES makes the frame read *less*
   blown is **reasoned from the transform's shape, not measured** — do not inherit it as fact.

> ⚠ **Never gate from a tab you opened yourself.** Ask the owner to look in their own foreground window.
> Paid for twice, and see §4 for why a plausible-looking canvas does not clear you.

## 6. Uncommitted in the shared checkout

`.claude/art-pass/{INDEX.md, 02-track/README.md, 02-track/LANE-BRIEF.md, 07-blocks/, HANDOVER-SUPERVISOR-SESSION-6.md}`
and this file. The pre-commit hook blocks a Claude commit here, so they land only through a lane's PR;
copies are already in both lane worktrees. Keep them in sync if you edit them again.

## 7. Process notes that hold

- **Message lanes with the `SendMessage` tool**, addressed by the name `ListAgents` shows. **Never
  `herdr agent prompt`** — it types into a pane, has silently dropped a whole decision packet, can paste
  without submitting, and gets classifier-blocked. `herdr` stays correct for worktrees, panes, the stack and
  reading output.
- **Start lane agents with `-- --permission-mode auto`**, and export `CLAUDE_CONFIG_DIR` in the pane's shell
  *first* — the profile is not inherited, and a lane on the wrong profile comes up unauthenticated and
  cannot be re-prompted out of it.
- **The supervisor writes the prose; lanes supply first-hand facts.** I briefly asked the track lane to
  author its own handover and corrected it mid-flight: a lane's self-written handover curates — it restates
  its own reasoning as established fact and omits what it never noticed.
- **Check a restart took.** A fresh agent that has not read its docs looks exactly like one that has, so
  make it state HEAD and the next gate back in its own words before it touches code. Both lanes were
  checked this way and both passed.
- **Relay the reasoning, not just the verdict** — a lane that knows *why* applies the principle to the next
  fork instead of coming back for it.

## 8. Added late in the session

**`art/block` shipped `/iso-block` — commit `9a6551b`, gate green.** Four files under
`app/routes/iso-block/` plus one line in `routes.ts`: the route wrapping `<DeepSpaceSky>` with `rig={false}`,
a placeholder box at 4 × 8 × 8u, and `block-dimensions.ts` + `.test.ts` split out so the 8u assertion runs on
the cheap node runtime without pulling React in. Canvas-isolation now reports **9** route entry modules
clean. The three untracked art-pass docs rode in on that commit. **Not yet verified to render** — the gate
proves the code sound, not that anything is on screen. Expected look: sparse and dark, grey box, no fill,
grid off. *Sparse and dark is the pass condition* — the trap is "fixing" a correct emissive-first frame with
light.

Two judgements in it worth reinforcing: it **declined to import `LETHAL_SURFACE`** for the placeholder (its
`#ff2740` is the excluded red and its `toneMapped: false` is what D3 removes — a neutral box reads as
undesigned, the shipped red would read as a decision nobody took); and it split dimensions from the component
so the height that encodes un-jumpability fails loudly in the gate rather than by eye.

**B6 — the `/iso-block` grid stays one-click; do NOT add the prop yet.** My instruction to "turn the grid on
explicitly" assumed a prop that does not exist: `<IsoLab>`'s props are `title`, `size`, `board`, `children`,
`rig`, and `grid` is internal state initialised from `rig`, so `rig={false}` starts it off. The lane's
options were to edit `iso-lab.tsx` (forbidden, B5) or duplicate the `Grid` in its own route (drift the shared
instrument guards against) — **it correctly did neither and flagged it.** A `grid?: boolean` prop defaulting
to `rig` is the clean fix and is noted as such, but it buys one click per page load and costs a change to a
shared file every other `/iso-*` route depends on while a second lane is live. Revisit after both merge. If
the grid turns out load-bearing for judging lateral proportion rather than a nicety, that is a different
trade and the lane was told to come back for it.

**The session-name lever, verified.** `herdr agent rename` renames the *herdr* agent and does **not** change
a Claude Code session's peer identity — the block lane confirmed my row still read the old auto-generated
title after the rename. The real flag is **`claude -n <name>`** / `--name` ("Set a display name for this
session (picker, and terminal title)", from `claude --help`). Lanes get theirs because `herdr agent start
<name>` passes it at launch; it is **not renameable afterwards from inside a running session**. So name the
supervisor session at launch — `claude -n supervisor` — or peers address it by a truncated conversation title.

**Both lanes are now cleared to drive the owner's Chrome** (extension running, window foregrounded — the
owner offered it). This converts the track lane's sphere work from inference to observation, and gives the
block lane its render check. Rules given to both: `claude-in-chrome` tools **only** (never
Playwright/Puppeteer — the value is that lane and owner watch the *same live tab*, so review is a glance and
not a screenshot round-trip); **each lane keeps its OWN tab** via `tabs_create_mcp` with `tabId` passed on
every call, since two lanes share one browser; and **check `document.visibilityState` every time** —
foregrounded now is not foregrounded in five minutes, and a `"hidden"` result is a request to the owner, never
a finding about the subject.

## 9. Open at the moment this handover was written

**`art/block` is mid-clearing — finish it.** `block-6b` hit its context threshold at a clean seam (route
committed at `9a6551b`, gate green, nothing half-built) and was told to **hold the design recommendation**
and send a terse fact dump instead. **The next supervisor must: collect that dump, write
`.claude/art-pass/07-blocks/LANE-STATE.md` from it, commit it on `art/block`, and restart the agent against
it** (`herdr agent send-keys block c-c c-c`, then `herdr agent start block --kind claude --pane w2D:p1
--timeout 120000 -- --permission-mode auto`). The worktree, ports 5202/2602, stack and parked tab all
survive; only the conversation is disposable. The fact dump was asked to include **the shape the design
recommendation had already taken** — candidate silhouettes, seam options, ranked instancing candidates —
because that is the thinking that would otherwise be re-derived at full price.

**Its next artefact, after the restart:** the design recommendation — silhouette family, seam language as the
lane's own call with reasoning (board 10 specifies none of count/placement/width), and the instancing
decision weighed on four axes: survives non-uniform instance scale · cost per instance · needs a second
material path · degradation at distance. **No geometry or material lands before the supervisor approves it.**

**`/iso-block` is NOT yet confirmed to render, and needs the owner.** `block-6b`'s tab `253884490` measured
`visibilityState: "hidden"` with the canvas at the unsized `300 × 150` default — R3F never resized, so rAF
has never run. Zero console errors. **The DOM half is verified correct**: title `SLUR — Iso Lab · Blocks`,
panel heading "Sealed deadly block", status line *"Subject framed at 8u · rig off"* — so the route resolves
and `<IsoLab>` mounted with `rig={false}` as intended; only the WebGL frame is unproven. The owner needs to
**foreground the Chrome window** and glance at that tab.

> **Both hidden-tab presentations are now on record.** `block-6b`: `300 × 150`, never resized — the classic
> signature. `track-82`: `3456×1926`, fully mounted, rAF dead. **Canvas size confirms the trap when it is
> small and proves nothing when it is large.** `visibilityState` is the only reliable test.

**Pass condition for `/iso-block`, stated before the look rather than after:** a small grey box (4 × 8 × 8u)
on the ground plane in a near-black field, faint nebula behind, no fill, dark sides going fully black.
**Sparse and dark is the PASS.** If the placeholder is swallowed entirely, that is information about the
`<Lightformer>` rig's reach on a small dark object — **not** a reason to add a light.

**A shared-file fix the supervisor owns, deliberately not done yet.** `iso-lab-controls.tsx`'s copy for
`rig={false}` reads *"rig off — the subject is lit only by itself"*. That was written for `/iso-sky`, where
the subject **is** the light source; on `/iso-block` it is simply false and will mislead whoever reads the
panel mid-gate. `block-6b` found it and correctly declined to touch a shared file while `track-82` is live.
**Schedule it once one of the two lanes has merged** — and note `<IsoLab>`'s props are only `title`, `size`,
`board`, `children`, `rig`, with `grid` as internal state initialised from `rig`, so a `grid?: boolean` prop
(B6) is the natural companion change to make in the same pass.

**This supervisor session should be relaunched as `claude -n supervisor`** — see §8; the name is settable
only at launch, and without it peers address the session by a truncated auto-generated title.

## 10. Chrome tab protocol — query before create; the PORT is the tag

The owner reported a stray empty tab appearing each time a lane opens a page, and asked whether tabs could
be named per-lane the way lanes are. **They already are, implicitly: each lane's dev-server port is a unique,
collision-proof tag** — `art/track` is `localhost:5201`, `art/block` is `localhost:5202`. No new mechanism is
needed; what was missing is the discipline.

**The rule, given to `track-82` and to be carried into every lane brief and `LANE-STATE.md`:**

1. Call **`tabs_context_mcp` FIRST**, every time, and **reuse** your own tab if one exists.
2. Call `tabs_create_mcp` **only** when no tab of yours is present.
3. Match on **your own port prefix**. Never adopt a tab on another lane's port — grabbing it means two lanes
   diagnose each other's page.
4. If several of your own exist, keep the one already on the route you want and **leave the rest alone**.
   Don't tidy the owner's browser.
5. The page `<title>` is a usable secondary check (`/art-lab` and `/iso-block` set distinct ones) but the
   port is stronger — it cannot collide.

**This does not relax the `visibilityState` rule.** An adopted tab is exactly as likely to be behind the
owner's windows as a fresh one, so check it on every call regardless of how the tab was obtained.

*Unverified:* the cause of the stray empty tab itself. It was not diagnosed — `tabs_create_mcp` followed by a
`navigate` is a plausible source but was not confirmed, so do not repeat that as fact. Query-before-create
reduces the churn either way; if the blanks persist after lanes adopt this, that is worth an actual
investigation rather than another guess.

## 11. LATEST — the sphere is real, and a new finding that overturns a prediction

**`track-82` saw the sphere live and it is a REAL occluding object — not the planet in the jpg.** A large,
smooth, **featureless** dark disc with a hard circular limb, sitting **in front of** the nebula backdrop:
the jpg's planet texture shows around its right edge and nebula around its left, while the disc itself
carries no texture at all. Angular radius ~20°, centred just above the frame top, slightly right. It
occludes the jpg's terminator — the source image's single brightest feature at mean luma 224.6/255 — and
where the disc covers it, that blazing arc is simply **absent**.

**The lane retracted its own earlier conclusion, and that is the most valuable thing in the report.** It had
built a frame predictor from `sky-backdrop.tsx`'s patch geometry, `chase.ts`'s camera and three's ACESFilmic,
and concluded the sphere was the planet baked into `nebula-backdrop.jpg`. The live frame falsified it: the
prediction puts a blazing terminator top-right, the real frame has a dark edge there. Its own limb fit
(Kasa, centre (1709.5, 642.3) r 755.1, rms 1.02px over 211 points) **corroborates** the recorded
(1679, 622) r 719 — so §4's measurement stands; it was the *inference* that was wrong. A circle in the image
is not a circle on screen, because the patch maps image x→phi and y→theta linearly.

**Eliminated, treat as settled:**
- **Depth, for the backdrop** — `SkyBackdrop` is `depthWrite={false}` + `transparent` + `renderOrder={-1}`,
  so it writes no depth and cannot clip anything. *Not* ruled out for whatever the new object is.
- **Lightformers leaking in-scene** — ruled out at source tier: drei 10.7.8's `<Environment>` children path
  portals them into its own `new Scene()`; they never reach the main scene.
- **drei `<Stars>`** — `StarfieldMaterial` uses `AdditiveBlending`, which can only add light, never darken.

**Material remains the live hypothesis** — smooth, featureless, unlit, hard limb is what an unlit mesh
drawing black looks like.

**The strongest finding is an absence:** on a static read of the default frame (slab ON, rails ON, blocks
OFF, backdrop ON, env/ships/finish OFF) **the only sphere that should be mounted is the backdrop patch** —
`GradientDome` rides `layers.env` (off), `ship-model`'s 0.22u sphere rides `layers.ships` (off). **So this
object should not exist.** Either a layer mounts something untraced, or it is not a sphere mesh at all (a
post/bloom artifact, or the patch's own geometry misbehaving).

**Approved and outstanding for that lane:** two zero-risk observations — **bloom off** (if the disc vanishes
it is post-processing, not geometry) and **pan the sky slider** (disc translates ⇒ it belongs to the sky
patch; stays ⇒ scene object), then bisect slab→rails. Neither touches `backdrop`. Plus a **~10-line dev-only
`__THREE_DEVTOOLS__` instrument**, approved: the hook must be installed *before* the renderer is constructed,
so it needs a reload with the hook in place. Conditions given: dev-only, delete-don't-evolve header,
committed **separately** from any fix, and if the scene graph doesn't name the object in one pass it comes
back rather than deepening the instrument. A React-fiber walk from the canvas does **not** reach the R3F
store (`createRoot` keeps it in a closure) — don't retry that route.

> **NEW FINDING that contradicts a recorded prediction.** In the live frame the **slab and rails read
> NEAR-WHITE and clipped** — `TrackFloor` is still on its white placeholder base colour with no material,
> under tone mapping and bloom. This points the **opposite** way to the lane's earlier reasoned prediction
> that ACES would make the frame read *less* blown. That prediction was flagged reasoned-not-measured
> precisely so it could be overturned like this; **do not inherit it as fact.** The eyeball read supersedes
> it as a *direction* and stays un-pixel-measured. Consequence: **slice 2's material work is a bigger job
> than "pick a value".**

Predicted-frame artifacts (`predicted-sky-rest.png`, `predicted-sky-racespeed.png`, `predict-sky-frame.mjs`)
are in `02-track/refs/`, gitignored, and are a useful "what the sky alone should look like" control to hold
beside the live frame.

**`art/block` was cleared and restarted** — `block-c3`, against `LANE-STATE.md` at `5f33957` (pushed). It
passed its read-check and is doing the two pieces of homework its predecessor skipped before writing the
recommendation: **crop board 10's panels at native res** via `make-refs.sh crop`, and **read
`track-instancing.ts`** rather than assuming what the instanced path does per instance. It is treating the
recorded triplanar-first ranking and "cut slab" family as a prior to test.

**`track-82` is running hot (~195k/turn) and owes a fact dump, then a clearing.** It correctly flagged
rather than writing prose. The next supervisor rewrites `02-track/LANE-STATE.md` from that dump — and must
fold in this section's near-white finding and the eliminations.

**THE ONE THING BLOCKED ON THE OWNER: foreground the Chrome window for ~2 minutes.** Both lanes need it —
`track-82` for the two observations (its tab `253884497` on `:5201`), `block-c3` for the `/iso-block` render
check (tab `253884490` on `:5202`). Tab groups get torn down and recreated between calls, so a lane may
report `"hidden"` again even after a foreground; that is the trap reporting itself, never a finding.

## 12. CORRECTION to §7/§10 — tab groups are PER-SESSION, and visual gates must be SERIALISED

`block-c3` tested §7's "adopt your own tab, match on your port" protocol and it **fails across a context
clearing**. `tabs_context_mcp` returned *"No tab group exists for this session"*: a restarted agent **cannot
reach its predecessor's tab**, even though the tab is still open in the browser. So §7's recorded tab id
`253884490` was a **dead number** the moment the lane was restarted — the live one is `253884498`.
**Never record a tab id as durable lane state; record the URL and let each agent create its own group.**
Port-matching is still right *within* one agent's life, and still right for not touching another lane's port.

**And "foreground Chrome" was not an actionable ask.** `visibilityState` is **per-tab** and only one tab is
frontmost, so with two lanes in one Chrome **at most one can have a live frame** — the extension drives CDP,
which neither requires nor grants foreground. The owner foregrounded Chrome and `block-c3` stayed blocked
purely because the active tab was the other lane's. **Visual gates across parallel lanes must be
SERIALISED: name which lane owns the frontmost tab, gate it, then hand the window over.** Saved as the memory
`chrome-tab-per-session-serialise-visual-gates`.

**Two better instruments came out of it, both now in the `hidden-tab-blank-canvas` memory:**

1. **The rAF counter — run this instead of the probe that hangs.** Don't *await* a frame; install a
   free-running counter and read it on a **later** call:
   ```js
   // call 1
   window.__rafN = 0; (function tick(){ window.__rafN++; requestAnimationFrame(tick); })();
   // ...wait ~3s, then call 2
   window.__rafN
   ```
   `1` = only the synchronous first invocation ran, so rAF has fired **zero** times since. A number, one
   round trip, no 45s hang. `block-c3` measured exactly `1`.
2. **`computer screenshot` FORCES a measure.** It resized a `300×150` canvas to `3456×1882` while still
   `hidden` with rAF dead. **That is where the large-canvas presentation comes from** — something had
   already screenshotted it. So a correctly-sized canvas can never clear the trap, which is what §4
   asserted and this independently confirmed under test.

**Still open, and correctly so:** `/iso-block`'s render check and the B6 grid evidence. `block-c3` refused
to convert a dead-rAF black frame into either, which is the right call — a blocked check beats a fabricated
observation. It resumes in ~10 seconds once the window is handed to it.

`block-c3` also reports **board-10's crops are already overturning part of the recorded prior**. It has been
asked to state in the recommendation *which* part they contradict and what the crops show — a prior that
survives contact is worth more once you've said what could have killed it.

## 13. ⚠ §11 IS SUPERSEDED — there is NO bug. The sphere is the planet, and the fix is a framing call.

**Read this instead of §11 wherever the two disagree.** §11 recorded a retraction that was itself wrong. The
lane's *original* diagnosis was right: **the black sphere is the planet baked into `nebula-backdrop.jpg`.**
It flip-flopped once, so everything below is instrumented first-hand.

**The scene graph, read live** (instrument `eedd49e`, default layers) — exactly **five** renderable objects,
and **one** sphere:

1. `SphereGeometry` r=1200, phiStart 160°, phiLength −140°, thetaStart 50.6°, thetaLength 78.8°,
   `MeshBasicMaterial` #ffffff, transparent, `depthWrite=false`, `renderOrder=−1`, DoubleSide — the backdrop
   patch, exactly as authored.
2. drei `<Stars>` Points/ShaderMaterial.
3. Instanced box #050507, **`visible=false`** — `TrackRibbon`'s floor quads, correctly suppressed by
   `showFloor={!layers.slab}`.
4. Instanced box #15171a, visible — the rails.
5. `BufferGeometry` / `MeshStandardMaterial` #ffffff — `TrackFloor`, the slab.

**No unexplained object exists.** §11's "this object should not exist, therefore something untraced mounts
it" inverted the evidence: *"no rogue object exists"* was evidence **for** the planet reading, and it was
read as evidence against.

**Why it reads as a featureless black sphere — this is the actionable finding, and it is a FRAMING call, not
a bug.** The visible image window at the chase camera is roughly source x 278..1394, y 367..941. The
planet's lit terminator runs (1311,0) → (984,440), so **only its bottom tip (~image (1000,400)) is in
frame**; the entire bright rim that would make the shape legible as a planet sits **above the top of the
frame**. The player therefore sees a large dark body with a hard limb and essentially none of its rim light.
**It is not dark because the lighting is honest — it is illegible because the lit edge is cropped out.**
Frame centre maps to source (836,724); the planet centre (1709,642) is 877px away against a fitted radius
of 755, so the limb passes ~10° up-and-right of centre and the body fills the upper right. Camera-pinned
because the sky is camera-locked. **This is the owner's "black sphere" AND their earlier "the planet reads
centre" — one observation, as §4 guessed.**

**The knob is `Tilt`** — already flagged in the deferred sky gate as "0°, the most likely to move, judgeable
only in `/art-lab`". Lowering the sky brings the terminator into frame. **The lane did not touch it: sky
knobs are out of its scope and this is the owner's eye.** Pair it with the gitignored predicted-frame
controls in `02-track/refs/`.

> ### ⚠ RETRACT the "near-white slab" finding in §11. It was a bloom-ON eyeball read.
> **Bloom-OFF point samples: slab RGB (60,64,70), rail (91,98,109), upper sky (4,6,12).** Mid-dark grey,
> **not clipped.** The sharper finding: **the blow-out is a BLOOM-BUDGET problem, not an emissive-value
> problem** — which lands on task 3, the owner of the bloom/exposure budget. It does **not** overturn the
> ACES prediction; **that question is still open and still unmeasured.** Do not propagate §11's version.

**Also settled first-hand:** the pan test was done by rotating the patch directly (`sky.rotation.y += 25°`,
restored) — all sky content translated with it, so everything in the sky is on the patch. And the sky mapping
is **not** mirrored: the brightest sky pixel (luma 204) unprojects to source (357,399), the nebula's bright
left-hand wisps, so screen-left is image-left and `sky-backdrop.tsx`'s negative-`phiLength` reasoning holds.

**Eliminated and confirmed live** (not merely from source): backdrop cannot depth-clip; drei 10.7.8 portals
`<Environment>` children into their own `new Scene()`; `<Stars>` is `AdditiveBlending`; no mirrored mapping.

### The transferable techniques — these unblocked everything

- **`gl.render(scene, camera)` + `readPixels` works with rAF DEAD.** The entire diagnosis above came from a
  hidden tab; the lane never got a second live frame despite the foregrounding. It also **bypasses
  EffectComposer**, so it doubles as a bloom-off read for free. This is strictly better than waiting for a
  visible tab.
- **`useThree` beats `__THREE_DEVTOOLS__`** for a scene probe: no pre-renderer install, and it works in a
  dead-rAF tab. Mounted as `{ import.meta.env.DEV && <SceneProbe /> }`, publishing state on
  `window.__ART_LAB` (precedent `net-canvas.tsx:142`).
- **`readPixels` per pixel is a GPU stall** — read a whole ROW per call and sample columns from the buffer.
- **Point-sampling an ASCII luminance map HIDES thin bright features.** The first map "showed" no
  terminator; **max-pooling each cell** brought it back, and nearly cost a second wrong conclusion.
- **Screenshots at thumbnail scale are not evidence about thin high-luma features.** The earlier "the
  terminator is absent, so something occludes it" was a thumbnail misread.

**Both times the thing that settled it was rendering or measuring, never reasoning** — including a
confident, well-argued retraction built from source alone.

## 14. `art/block` — APPROVED AND BUILT. These approvals were relayed by message only; they are recorded here now.

**⚠ If you are a fresh supervisor reading this: the recommendation is already approved and the block is
already built. Do not re-gate it.**

### The owner's two rulings (escalated via AskUserQuestion, 2026-09-19)

- **B7 — Material-only silhouette: APPROVED.** No chamfer geometry; the mesh stays a literal unit box. The
  decisive argument was that *"nothing protrudes outside the AABB" becomes true **by construction** rather
  than by assertion* — better than the brief's own instruction to assert it, and no future edit can quietly
  break it. Supporting: at 55 u/s on an 8u block the contour delta is ~1px, so what a player sees is a
  rim-highlight band, which shading holds at constant world width and geometry cannot without stretching.
  The contour-breaking requirement belongs to the **fractured** block, which is out of scope.
- **B8 — Red leaves the hazard vocabulary: CONFIRMED, as intended.** Not a live choice: the frozen palette
  excludes red, and `track-materials.ts`'s own header calls the current values a *"SHIPPED TRON retone …
  NOT yet the art-handoff-v1 palette"*. So integrating the marigold block executes a retone the file already
  flags as owed. `Alert Red #FF4B3E` stays excluded and stays the supervisor's.

### Approved on supervisor authority

- **B9 — Instancing: option A, "unstretched box-local space".** The prior's triplanar-first ranking is
  **dead**, killed by a verified fact: `put()` writes position and non-uniform scale and **never rotation**
  (`track-view.tsx:62-64`, and `track-instancing.ts:36-40` which exists only on `art/track` at `1bb5839`).
  So `vec3 size = vec3(length(im[0]), length(im[1]), length(im[2]))` **is** `(sx,sy,sz)` — triplanar's whole
  purpose is handling arbitrary rotation **we do not have**, and it would pay 3 samples + blend per fragment
  forever for a property we get free. Zero texture samples also retires the "size features in world units,
  not pixels" trap outright: there is no texture. Verified in three 0.185.1 source: under `USE_INSTANCING`
  three already applies the inverse-scale normal correction, so non-uniform scale does not break normals.
  Material extension is three-native **`onBeforeCompile` on `MeshStandardMaterial`** — keeps the shipped
  lighting and ACES path, where drei's `shaderMaterial` would discard the PBR. `three-custom-shader-material`
  is **not installed**.
- **B10 — Seam: ONE corner-wrap L.** Vertical, full 8u, ~0.5–0.6u inset from a vertical corner, turning along
  the top edge; recessed not painted; constant ~0.10–0.15u cross-section, all in world units so
  instance-invariant. Corner chosen by hashing the instance translation — cosmetic, client-side, nothing to
  desync. This **follows the board and overrides the prior**, which had invented "1–2 seams placed
  asymmetrically": the board never shows two seams and never an asymmetric scatter.
- **B11 — No mid-face horizontal seam. A gameplay override of a board reading, and it stands.** A horizontal
  band implies a ledge, and this block is **un-jumpable by design**. The board's only horizontal run is the
  top edge, where the bevel highlight already lives and nothing can read as a step.
- **B12 — The three footprints are TEST CASES, not a spec.** The lane's pushback on the DoD is accepted and
  is the sharpest point in its document: **width and depth are the generator's output, not the art's**, so
  acceptance is "the material holds across the continuous range the generator emits", not "it looks good at
  three curated sizes". 5.5×5.5×8 and 3.5×5×8 are GDD §0's stated-legal examples; 4×8×8 is what the
  generator emits today.

### What the board crops settled

- **SURVIVED:** aspect ratio is the variation axis. Panel 3's STANDARD (DEADLY) row is *CUBE (1×1) · WIDE
  (2×1 / 3×1) · TALL (1×2) · STACK*.
- **⚠ THE SAME PANEL IS HALF SPEC AND HALF POISON.** CUBE and WIDE are pure width/depth variation — the
  spec. **TALL and STACK vary the one axis that must never vary**, and **nothing on the board marks the
  difference.** Now recorded in `block-dimensions.ts` where someone will trip on it.
- **Hazard identity is now board-evidenced, not inferred.** Panel 7 captions it: *"MONOLITHS ARE ENVIRONMENT.
  BLOCKS ARE HAZARDS."* Monoliths tall, clustered, hazed, cold, **no marigold at all**; the block squat,
  near, grounded, seamed. **Task 4 inherits: monoliths stay off-ribbon, unseamed and cold.**
- **The measurement that decided it:** CUBE and WIDE carry **visibly the same seam thickness**; on the wider
  form the seam just runs longer. Constant cross-section, length following the edge — the art independently
  asking for an instance-invariant world-unit feature, which killed "accept the stretch" on its own terms.

### Built: `5c601d3` — *art(block): the sealed deadly block — shaded mass, one marigold seam*. PUSHED.

Gate green: 175 files, 3 pre-existing warnings + 1 info, "✓ Canvas-isolation: 9 route entry modules clean";
75 shared · **49 client (8 files, up from 36/7)** · 4 server · SPA build.

- `sealed-block-material.ts` — `onBeforeCompile`, injecting at four **verified** chunk points (`color_fragment`
  172 → `roughnessmap_fragment` 176 → `normal_fragment_begin` 178 → `emissivemap_fragment` 182), checked in
  installed three rather than recalled. **Correction the lane made to its own plan:** `normal_fragment_begin`
  leaves `normal` in **view** space, so it carries the object axes through as varyings and reconstructs,
  rather than duplicating three's instanced-normal chain.
- `sealed-block.tsx` — `InstancedMesh` over a **unit** box, deliberately **the same path the game uses**:
  judging any other arrangement would judge something the player never sees, since the stretch the material
  must survive exists only on that path. Matrices set in a **ref callback**, not an effect — static data, no
  external system to sync.
- `block-dimensions.ts` — the three footprints plus `layOutFamily()` as a pure function, so framing derives
  from a tested span rather than a magic number.
- **13 tests. The load-bearing one asserts the vertex stage never writes `transformed` or `gl_Position`** —
  that is what stops a later edit silently surrendering "nothing protrudes". The guarantee is invisible to
  typecheck and to every other test.
- `placeholder-block.tsx` **deleted**, per its own delete-don't-evolve header.
- Base colour and roughness marked **PROVISIONAL**, with an instruction to adopt `art/track`'s values rather
  than let two dark-metal languages drift. Floor-contact glow **deferred and named**, not invented.

### Two evidence-backed findings from the live frame

- **The `<Lightformer>` rig's reach on a small dark object is GENEROUS, not marginal.** The box is large in
  frame and **brightly lit** — `#6b7280` reads as a clearly-lit mid blue-grey. So it is *the opposite of
  swallowed*; **the supervisor's stated "sparse and dark is the PASS" condition was wrong for this route.**
  No light was added and the material needed no compensating. Live frame confirmed: `visible`,
  `hasFocus: true`, **723 rAF frames in 3 s**, canvas `3456×1882`.
- **The rig is very FLAT** — the two visible side faces sit at nearly the same value, cool-tinted, almost no
  directional definition. **This is what earned the bevel its complexity, on evidence rather than taste:** a
  painted edge line would not respond to a rig like that at all; a **normal lean** does, because it changes
  how the surface meets the light.

### B6 CONFIRMED on evidence — do NOT add the `grid?: boolean` prop

The lane clicked the grid on and went looking for a reason to overturn B6. **The grid is a nicety here, not
load-bearing:** only two or three very faint, far-apart blue lines at this framing, and the block occludes
the ones that would have read as contact. Too coarse relative to an 8u subject to say anything the
silhouette doesn't. So it would buy one click per load and cost a shared-file change, to enable something
that does not help.

### NOT done — the material has never been seen

The gate proves the code sound and proves **nothing about the art**. The block needs a look at `/iso-block`
with the three footprints in frame, and specifically **whether the bevel reads at all under that flat rig** —
the one thing in this design most likely to need tuning. That must happen **before** it goes near
`art/track`'s composition gate. The lane is running high on context and asked to hand over at this seam
rather than mid-tune; **that is the right seam and the next supervisor should take it.**
