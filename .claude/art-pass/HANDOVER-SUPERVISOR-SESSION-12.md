# Supervisor handover — session 12 (2026-09-19)

Written at a clean seam. Nothing is in flight. One PR is open and deliberately unmerged (it needs a
human feel gate); everything else this session is merged and its worktrees are removed.

## `origin/dev` is at `00a60a7`. Nothing is open.

| Merged this session | What | Commit on dev |
|---|---|---|
| #130 | ChatGPT's golden reference + the reorganised `docs/art-direction/` (100 files) | `c8626a4` |
| #131 | Art task 2 slice 1 — track floor material + the sky framing, from `art/track` | `bf1b1f6` |
| #132 | `fix(lint)` — exclude `docs/art-direction` from biome | `77f09fc` |
| #134 | The frame tap, rebuilt from `art/frame-tap` onto fresh `dev` | `181a411` |
| #133 | Chase cam rigid laterally — **feel gate PASSED**, owner flew it | `00a60a7` |

### The camera change, for context when tuning it later

`apps/client/app/game/camera/chase.ts`. `position.x` ran the same exponential ease (`follow: 16`) as depth
and height, so the ship slid off-centre on every strafe. The worse half was the yaw: `lookAt` aims at the
ship's **real** x while `position.x` was still easing toward it, so a strafe swung the entire world about
the camera rather than translating it — ADR-006's "a 1-lane **flick** pillar juts in to force a sharp
sidestep" was landing as a camera wobble. Lateral is now rigid (`cam.position.x = p.x`); depth and height
keep the ease deliberately, because the z trail *is* the speed cue `backStretch` stretches, and an eased y
stops a jump yanking the frame.

**If it ever reads too welded to the ship,** the knob is a velocity-proportional lead — offset the camera
*into* the strafe by `vx · lead` so the ship sits slightly off-centre toward where it is going. Buys
anticipation without reintroducing lag. Deliberately not built; the owner's complaint named the lag only.

### Process slip worth not repeating

`gh pr merge 133 && git push origin --delete …` was written with `;`, not `&&`. The merge hit an API
timeout, the delete ran anyway, and **deleting the branch auto-CLOSED the PR**. Recovered by pushing the
branch back from the worktree (`git push origin HEAD:refs/heads/<branch>`), `gh pr reopen`, re-verifying
`refs/pull/N/head`, and merging. **Gate every post-merge cleanup on the merge actually succeeding.**

## I broke the lint gate on `dev` for two commits. Read this before the next docs merge.

I merged #130 without running the verify gate, on the reasoning that a docs-and-images PR cannot break a
code gate. **Wrong — biome lints JSON.** `docs/art-direction/golden-reference/history/GENERATED_IMAGE_MANIFEST.json`
failed the formatter and `pnpm lint` was red on `dev` from `c8626a4` until `77f09fc`.

Reformatting the file was not available: `docs/art-direction/` is Codex's working set and read-only for us
(`CLAUDE.md`), and a formatting pass in there desynchronises the side that is indexed against those exact
bytes. #132 adds `!docs/art-direction` to `biome.json`'s `files.includes`, alongside the `!docs/references`
entry that was already there for the same reason.

**Rule for the successor: run the gate on every PR, including docs-only ones.** It costs ~90 seconds.

## `art/background` CANNOT be merged. It is fully superseded, and merging it reverts `dev`.

The owner asked for it to be merged along with `art/frame-tap`. `frame-tap` landed; **this one must not**.
Verified first-hand:

- **Zero files** exist on `art/background` that `dev` lacks (outside stale `docs/art-direction/` copies at
  pre-reorg paths).
- Every shared file is **older** on the branch. Its work landed as #126 and was then refined by #131.
- The 2-dot diff (`git diff origin/dev origin/art/background`) is **−3730 lines**. Merging would revert:
  - `sky-config.ts` `radius: 800` → `1200` — back past **R3F's far plane of 1000**, which is the silent
    clipping issue #128 was filed for. The `800` value and its comment exist precisely to stop this.
  - `fovDeg: 120` → `140` and `elevationDeg: -2` → `0` — undoing the framing the owner approved in `441a2d9`,
    plus the corrected coverage math (134.3° swept over the speed range, not the earlier mixed-speed 138.5°).
  - `biome.json` → re-breaking the lint gate fixed by #132.
  - `track-view.tsx` → the un-split pre-#131 version, deleting `track-ribbon.tsx` and `track-instancing.ts`.

A 14-commit rebase was attempted and aborted — it conflicts on every commit, because the conflict *is* the
branch reasserting content `dev` has already moved past. **Recommendation: delete the branch and its
worktree at `../slur-worktrees/background`.** Left in place because deleting work is the owner's call, not
mine. Its only unique content is superseded lane docs.

This is the `#118`→`#119` failure mode from the `reused-branch-stale-base-reverts-dev` memory. The 3-dot
diff (`origin/dev...branch`) hides it completely — it showed a healthy +5822/−55. **Always check 2-dot
before merging a branch whose base is behind.**

## How `art/frame-tap` was landed, as the template for `art/block`

`art/block` (`30a1b3c`, +20 commits) has the **same stale base** — its 2-dot diff is −3731. Do not merge it
directly. The shape that worked for frame-tap:

1. `git worktree add -B <new-branch> ../slur-worktrees/<dir> origin/dev` — fresh base, new branch name.
2. `git cherry-pick <the real commits>`, **dropping any self-labelled scaffold commit.** frame-tap's tip
   `96f5d94` said `MEASUREMENT SCAFFOLD — instance vs re-invocation. REMOVE BEFORE PR` and was dropped.
3. **`git diff --stat origin/dev HEAD` and `git diff --diff-filter=D --name-only origin/dev HEAD`** — the
   merge is only safe when the second is empty and the first is pure addition. frame-tap came out
   17 files, +1603/−1, zero deletions.
4. Full gate, PR, verify `refs/pull/N/head` equals the gated SHA, merge, delete both branches.

Old `art/frame-tap` is deleted on the remote; the work is on `dev` as `art/frame-tap-v2` → #134.

## What the frame tap gives the successor — use it

`curl 'http://localhost:5203/__frame-tap?name=track-01'` writes the composed frame (with bloom) to
`.claude/art-pass/00-frame-tap/refs/track-01.png` and returns JSON naming the path. **The tab does not need
to be focused.** It drives R3F 9.7.0's `advance()`, which — read from the installed source — gates on
neither `frameloop` nor `internal.active` nor `internal.frames`, all three of which `loop()` checks.

This retires two standing memories' constraints: `hidden-tab-blank-canvas` (a backgrounded tab is
`visibilityState: "hidden"`, so rAF stops and the canvas reads black — not a renderer bug) and the
serialisation in `chrome-tab-per-session-serialise-visual-gates`. Visual gates no longer need the owner's
frontmost window, and lanes no longer have to queue for it. Full write-up in
`.claude/art-pass/00-frame-tap/README.md` on `dev`.

## Art direction — the state the owner reviewed and accepted this session

Authority order: `docs/ART_SCALE_REFERENCE.md` (dimensions, always) → `golden-reference/DIRECTION.md`
(appearance) → the per-topic briefs → `docs/ART_MATERIALS.md` (surfaces, ours).

- **Golden reference 17 FINAL, approved.** Near-black surfaces, a *faint desaturated slate-blue* undertone
  in lit nebula / planet rim / stone edges — not achromatic (board 16's failure), not saturated blue
  (board 14's, rejected). Marigold is the only warm colour, localized. HUD small and borderless.
- **Track:** satin bare graphite, continuous marigold outer boundary, *mostly dark* interior joints with
  sparse short emissive inserts of varied length. "**No fully glowing tile grid, marked driving lanes** or
  automatic safe route." Gaps are real missing deck with a thin warm lip and visible cut wall.
- **Track wear FROZEN** (board 25): broad softly-bounded finish patches that interrupt the warm
  reflections, occasional elongated scuff clusters with a weak down-track bias, sparse joint-edge rub. All
  procedural and seeded. Excluded: rust, skid marks, bright silver scratches, dents, all-over fine noise.
- **Blocks** (board 28, final *draft*, not individually approved): near-black coated metal, sealed cuboids,
  8u high, **vertical marigold seams only**, clean→worn as one continuous range. Closed fissures dropped.
- **Environment** (board 25, approved): Deep Space = one dominant planetary mass; Nebula = layered
  slate-blue clouds own the sky, planets subordinate. Progression is density/proximity/scale/framing —
  "**materials and exposure stay fixed**".
- **Monoliths:** matte stone/concrete, **visible vertical marigold seams with localized soft halos**,
  subordinate to gameplay light.
- **`4u` is a study ruler only** — "16 across 64u. **This is not a new collision quantization rule.**"
  Consistent with GDD §0's continuous space.

### The one tension the owner should settle

**Board 17's deck contradicts its own written rule.** The image shows continuous glowing lines running the
full length of the deck in a regular lateral rhythm — it reads as lane markings, which the text explicitly
forbids. **Board 25's overview is the restrained version** (short segments, irregular spacing, mostly dark
joints). Working read, raised with the owner and not yet contradicted: *for seam density the track boards
win; board 17 is atmosphere only.* This is the single biggest visual variable on screen — get it confirmed
before task 2 slice 2 implements seams.

## Still owed

- **`docs/ART_MATERIALS.md` revision 3.** `golden-reference/DIRECTION.md`'s "Material document
  reconciliation" adopts revision 2 and then supersedes it twice: interior seams **may** carry sparse
  irregular emissive inserts, and monolith seams **may** produce a visible localized halo. Revision 2's §3
  ("below the bloom threshold — glows, does not halo") and M1's non-emissive transverse seams both now
  conflict, as does the element table's "Interior panel divisions and seams → none". Fold in
  `DIRECTION.md`'s panel-division hierarchy rather than re-deriving it. Still **untracked** on `dev`; it and
  the `CLAUDE.md` ChatGPT-workspace callout want their own docs PR.
- **Board-number collision** — three different `25`s (`blocks/`, `scene-background/`, `track/`). Ambiguous
  in any citation. Deliberately left for ChatGPT: renumbering means renaming images that specs link to.
- **Shared-checkout tidying.** Stale pre-reorg copies sit at old paths (`docs/art-direction/boards/25-27_*`,
  `desctructible-block/`, top-level `GOLDEN_REFERENCE.md`) plus modified files now identical to `dev`. The
  cleanup — `git checkout --` on the superseded copies, then `git merge --ff-only origin/dev` — was
  **blocked by the permission classifier**. Verified beforehand that `CURRENT_STATUS.md`, board 00's PNG,
  `.claude/art-pass/INDEX.md` and `02-track/README.md` are byte-identical to `dev`, and that the two
  README diffs are the branch being *older*. Needs the owner to approve the discard.
- **Stale remote branches** that can be deleted: `art/art-direction-reorg` (#130, merged),
  `art/golden-reference-17` (#129, closed). Keep `art/procedural-bg` — it deliberately preserves the
  procedural sky that task 1's cheap-path pivot set aside.

## Art-pass arc status

| # | Task | Status |
|---|---|---|
| 1 | Background | **built, gate green** — cheap path: `nebula-backdrop.jpg` on a camera-locked sphere patch, lit by a `<Lightformer>` rig + one `DirectionalLight` |
| 2 | Track | **slice 1 merged (#131)** — `track-view.tsx` split into ribbon/blocks/floor, floor's real material, floor built past the finish line. Wear and seam-insert language explicitly **not** started |
| 7 | Sealed deadly block | briefed, not started — `art/block` needs the cherry-pick treatment above |
| 3–6 | Lighting · Monoliths · Asteroids · Composition | not started |

GitHub: 25 open issues — S6 5 (incl. **#6 respawn death-loop, a bug**), S7 7, Backlog 8, unmilestoned 5
(all process/tech-debt from the #94–#116 round, incl. **#127**, where the canvas-isolation checker's
`strip()` eats odd-apostrophe files and silently unguards `/art-lab` and every `/iso-*` route).

## ▶ NEXT ACTION — the owner's standing request, asked for at the end of session 12

Verbatim: *"now summarize the track, art first lets brainstorm on it, prepare a clean plan for it and then
push it on a lane. we will do the same for the block as well."*

So: **track first — summarize → brainstorm → clean plan → launch a lane. Then repeat for blocks (task 7).**
This is an `/arc` brainstorm, which is collaborative: the owner wants to *talk it through*, not receive a
finished plan. Present, argue, converge, **then** write the plan and launch the lane.

### Read these before opening your mouth — in this order

1. **`.claude/art-pass/02-track/README.md` §7** — five decisions of-record. D3 was resolved and D4/D5 added
   by the owner on 2026-09-19. **These are already settled; do not re-litigate them**, build on them.
2. **`.claude/art-pass/02-track/LANE-BRIEF.md`** — the brief written for the lane that never launched. May
   need updating against what slice 1 actually landed, and against the wear freeze.
3. **`docs/art-direction/track/24_track_BRIEF.md`** — material, boundary, seam and gap language, plus the
   integrated review criteria.
4. **`docs/art-direction/track/25_track_procedural_wear_BRIEF.md`** — the **frozen** wear target: three
   layers (broad finish patches / elongated scuff clusters / sparse joint-edge rub), the controls it asks
   us to expose, and a long explicit exclusion list.
5. **`docs/ART_MATERIALS.md`** M1 (track graphite), M7 (marigold emissive), M8 (gap slab edges) — **but see
   the revision-3 conflict below; M1 is partly stale.**
6. **The code slice 1 landed:** `apps/client/app/game/scene/track-ribbon.tsx`, `track-blocks.tsx`,
   `track-floor.tsx`, `track-materials.ts`, `track-instancing.ts`. `bf1b1f6`'s message records what slice 1
   deliberately did **not** do — that is the seam slice 2 starts from.

### What slice 2 is actually for, in one line each

- **Wear** — the frozen board-25 treatment, procedural and seeded, with the art-review controls the brief
  names (overall amount incl. zero, patch coverage + size, dulled-vs-smoother delta, scuff density/length/
  bias, edge-rub amount, stable seed).
- **Seams** — sparse short emissive inserts of varied length and irregular spacing, on mostly-dark joints.
  **Settle the board-17 tension first (below) or this gets built twice.**
- **Gaps** — thin warm lip, visible dark cut wall, open void. Board 24 panel 04 is the reference; the
  generated masonry texture and exaggerated depth are explicitly *not* construction spec.
- **Boundary** — continuous narrow marigold emitter, small bright core, controlled halo, visually distinct
  from the interior inserts.

### Two things to settle WITH the owner before the plan is written

1. **The board-17 seam-density tension** (detailed in its own section above). Board 17's deck shows
   continuous full-length glowing lines in a regular lateral rhythm — reads as lane markings, which the
   written direction explicitly forbids. Board 25's overview is the restrained version. Working read,
   raised with the owner in session 12 and not contradicted: *for seam density the track boards win;
   board 17 is atmosphere only.* **Get an explicit yes.** It is the biggest visual variable on screen and
   it decides whether the seam system is "sparse irregular inserts" or something far denser.
2. **`ART_MATERIALS.md` revision 3** — M1's non-emissive transverse seams and the element table's
   "Interior panel divisions and seams → none" are **dead**, superseded by `DIRECTION.md`. The lane will
   read M1 and build the wrong thing unless rev 3 lands first, or the lane brief overrides it in writing.
   **Do rev 3 before launching the lane.**

### Use the frame tap for the gates

`curl 'http://localhost:<CLIENT_PORT>/__frame-tap?name=<label>'` → a composed PNG with bloom, tab
unfocused. Slice 1's gates needed the owner's frontmost window; slice 2's do not. Gate against board 25
with matched lighting and camera, board 24 as the clean baseline, and judge **the overview first** — the
brief is explicit that closeups explain the material but must not force tiny detail into the gameplay
render.

### Then blocks (task 7)

`.claude/art-pass/07-blocks/LANE-BRIEF.md` + `docs/art-direction/blocks/28_non_destructible_blocks_SPEC.md`.
**Sealed/deadly only** — the fractured state stays gated on ADR-009's unrun readability test. `art/block`
(`30a1b3c`, +20 commits) has a **stale base** (2-dot −3731) — use the cherry-pick recipe above, do not
merge it directly.
