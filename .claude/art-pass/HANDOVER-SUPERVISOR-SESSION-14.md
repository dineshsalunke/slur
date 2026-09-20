# Supervisor handover — session 14 (2026-09-19)

Session 13 ended expecting the track lane's slice-1 gate. That is not what this session was about. **The
owner stopped the work to deal with comment clutter**, and that turned into a rule change on `dev`, a second
lane, and a standing obligation on both lanes to keep checking themselves against the art package.

Slice 1's code is still not written. Everything that had to happen before it is now done.

## State at handover

`origin/dev` is at **`59805a1`**. Zero open PRs.

| Landed this session | What |
|---|---|
| #137 → `59805a1` | `docs(contributing)` — the comment rule rewritten |

Two lanes live. **Neither is blocked and neither needs the owner right now.**

| | track | comment-sweep |
|---|---|---|
| Agent | `track-90` (fresh, re-briefed) | `comment-sweep-1f` |
| Worktree | `../slur-worktrees/track` | `../slur-worktrees/comment-sweep` |
| Branch | `art/track` @ `3284fed` | `chore/comment-sweep` @ `a64f258` |
| Base | `639a2f2` | `59805a1`, verified |
| Ports / stack | client **5201**, server **2601**, up | none, and none needed |
| herdr | `w2F`, panes `p1`/`p2` | `w2G`, pane `p1` |

## What actually happened, and why it matters more than it looks

**The owner saw the track lane spend a turn editing a comment to say `(D7)`.** The reaction was to comment
clutter generally: *"haven't we discussed and decided already not to keep on adding unnecessary comments."*

They had. It was never executed — **`git log --all --grep` finds no comment-sweep commit in history.**

**The root cause was the rule itself, not the lanes.** `CONTRIBUTING.md` §3 carried two bullets that
produced the opposite of their intent:

- *"Match the surrounding code. Copy its naming, its **comment density**, its idioms."* — once a file reaches
  37% comments, every agent that touches it is **instructed** to keep writing at 37%. A ratchet with no way
  down. Clutter propagating itself by rule.
- *"Comment the **why**, not the **what**."* — no length bound, so a seven-line account of how a bug was
  found qualifies; it **is** a why. That is how `track-floor.tsx` reached 79 comment lines out of 212.

I had been correcting instances for several sessions without noticing the rule licensed them. **Fixed in
#137**, which also bans bare numeric citations (`(D7)`, `ADR-006`, `§4`, `#118`) — looking one up costs the
reader the context they were holding, which is worse than no citation.

**Measured before the change, on `origin/dev`:** 2,555 comment lines out of 10,987 in `apps/` + `packages/`
— **23%**. Worst: `sky-config.ts` 55%, `remote-engine-audio.tsx` 51%, `gltf-lfs-guard.ts` 50%,
`threat-hud.tsx` 44%. The sweep lane independently measured **23.7%** across its own 129 files — an
independent cross-check that neither number is an artifact of how I counted.

## The two exceptions that must survive the sweep

Written into both the rule and the sweep brief, because a blind pass destroys them and the gate never
notices:

1. **`useEffect` justification comments.** An uncommented Effect is *"a review failure — treat it as a bug,
   not a style nit"*, because coupling a Colyseus room's lifetime to an Effect cleanup cost the project S2.
   Tighten, never strip. An Effect found *without* one is a **finding to report**, not a gap to fill.
2. **Per-field tuning lines in `packages/shared/src/constants.ts`**, so the owner can tune live without
   reading the sim. This file is 90/276 and looks like the biggest win; it is nearly the smallest.

Plus, added after the owner's board instruction: **any comment tying a value to art direction, or encoding a
gameplay contract, is a keeper by default.** A magic number's *value* is in the code; the *reason it is that
value* never is. Delete one and the next agent tuning it has no idea it was chosen rather than defaulted.

## The split, since the owner asked for a complete sweep with a live lane in the way

- **comment-sweep lane: 129 files** (`.claude/comment-sweep/FILES.txt`, generated from `origin/dev`).
- **track lane: 18 files** — `scene/track*`, `scene/tube-walls.tsx`, all of `routes/art-lab/`.
- **Sky files (`sky-*.ts[x]`, `deep-space-sky.tsx`) went to the sweep**, task 1 being closed and merged. The
  track lane was told explicitly they are not its, since they sit in its worktree and it has edited them
  before.

**One sweep lane, not three.** Three would produce three different bars, which is worse than the clutter.

The track lane swept 4 of its 18 (`track-floor.tsx` 79→52 comment lines, `track-ribbon.tsx`,
`track-materials.ts`, `track-view.tsx`) and **refused the other 13**, because at 234k it had not read them
and *"sweeping a file I have not read is how a comment that was load-bearing gets deleted."* Correct. Those
13 are routed to its successor, to be swept **while already inside each file for the swap** — nearly free
there, and a cold pass is where a load-bearing line dies.

## The owner's standing instruction, late in the session

> *"please make sure the lanes refer to the art boards and the docs often to make sure they are on track"*

**Baked into the track lane's restart brief as a per-slice obligation**, not advice: before a slice, name
which board or doc section governs it and what it requires; at the gate, state how the build answers that.
If it cannot name the authority, that is the signal it is inventing direction, and it stops and asks.
Recorded in `LANE-FACTS` each time.

**I translated rather than relayed it for the sweep lane**, and the successor should keep that line: a
comment sweep has no art dimension and should not go reading boards. What transfers is the keeper rule
above.

Authority order given to the track lane, verbatim from the project's own rules: `ART_SCALE_REFERENCE.md`
owns dimensions and overrides every board number · `ART_MATERIALS.md` rev 3 owns surfaces · golden reference
17 governs integrated appearance · boards 24 (panel/edge) and 25 (wear) are the track subject briefs and are
newer than 17 for track specifics · `docs/art-direction/` is read-only, ChatGPT's indexed workspace.

Also re-stated to it, because it has cost real time twice: boards are a **look** target — mood, depth,
palette, contrast, speed, scale — never a pixel match and never evidence about optics. Unphysical detail in
an AI render is expected; do not discard a detail for being unphysical, do not chase one pixel while the
frame drifts, and never resolve a physics-vs-board conflict unilaterally.

## Slice-1 evidence, all settled — do not let a cold context re-open any of it

- **`buildFloorGeometry`: 14.65 ms · 10,704 vertices · 3,568 triangles at `TRACK_SEGMENTS=400`**, cold
  module, seed 1234. ~7× under the hitch threshold. **Not a `NEEDS-DECISION`.** Session 13's open thread is
  closed.
- **The pre-delete comparison was made and is durable** at `.claude/art-pass/02-track/evidence/` as
  `s1-before-instanced-bloomoff.jpg` and `s1-before-generated-bloomoff.jpg`. It shows the generated mesh has
  panel seams the instanced floor lacks, is value-graded down the ribbon, and gives the partial gap a lit
  side wall where the instanced floor gives a flat dark slot. **An improvement, not a wash.** q=2 JPEG
  deliberately: 7 MB as PNG, and `.gitattributes` routes only `public/models/**` and `docs/art-direction/**`
  through LFS — a third pattern for two files is a new failure mode for no gain, and this is evidence of a
  *look*, which survives q=2.
- **Bloom, verified:** the game hardcodes `GRID_VOID.bloom` (`net-canvas.tsx:133-139`); the lab uses
  `env.bloom`. **At the lab's default C they are identical — on A or B they are not**, so a bloom gate taken
  on A or B measures a pass the game never runs.

## The one thing genuinely still owed to the owner

**A single foreground Chrome capture of `/art-lab` with bloom ON.** The track lane established first-hand,
reproduced twice each way, that **the frame tap stops answering while the lab's `bloom` toggle is ON in an
occluded tab** and answers the moment it is switched off — page demonstrably alive throughout (Vite
connected, DOM rendered, readout live), rAF 0 frames in 1837 ms, `visibilityState: "hidden"`.

Its hypothesis — with `<EffectComposer>` mounted in an occluded tab the R3F subtree stays suspended, so
FrameTap's `hot.on` passive effect never registers while `useFrame`'s layout effect does — is **explicitly
unverified**. Either way the consequence holds: **bloom-ON captures are currently unobtainable from an
occluded tab.** This is a real limit of the instrument and partly walks back what PR #134 was believed to
have bought.

Cheapest resolution: ask the owner for one glance at `/art-lab` with bloom on while it is frontmost, and tap
it then. **Not blocking anything.**

## Traps paid for this session

- **A squash-merged PR's branch SHA is never reachable from `dev`.** I told the track lane the rule was at
  `3d17865`; it squash-merged as `59805a1`. The lane checked rather than trusting me, found `CONTRIBUTING.md`
  still saying the opposite, and wrote its interim note **with its own expiry** instead of pointing at text
  that contradicted itself. Quote a post-merge SHA to a lane, never the branch commit.
- **`LANE-FACTS.md` already exists** for the track lane. Its predecessor wrote it as a new file and nearly
  lost 162 lines before noticing. Now warned in `LANE-STATE`.
- **`herdr agent send-keys` takes the herdr agent name (`track`), not the `ListAgents` name (`track-9f`).**
  The wrong one fails with `agent_not_found`.
- **Docs-only still runs the full gate.** Done here in full; ~90 seconds.

## Carried from session 12/13, still the OWNER's call, unchanged

- **`art/background` cannot be merged** — 2-dot diff **−6092 lines across 156 files**; merging reverts the
  sky far-plane fix, the approved framing and the post-#131 `track-view.tsx`. Recommend deleting branch and
  worktree. The 3-dot diff hides this entirely; always `git diff origin/dev <branch>`.
- **`art/block`** has the same stale base (2-dot +3322/−5646). It is task 7's starting point, so cherry-pick
  onto a fresh base rather than merge.
- **Stale remote branches** that can go: `art/art-direction-reorg`, `art/golden-reference-17`,
  `docs/art-materials-rev3`, `fix/biome-skip-art-direction`. **Keep `art/procedural-bg`.**
- The shared checkout is **6+ commits behind** (`1807bc0`) and read-only by protocol. **Grep `origin/dev`,
  not the working tree.**
- Stale herdr workspace `frame-tap` (`w2E`) points at a worktree pruned this session.

## ▶ NEXT ACTION

1. **Confirm the fresh track lane read its docs** — it was told to state back the HEAD SHA, the next slice
   and its real gate, which board governs it, and what `LANE-STATE` retracts. *A fresh agent that has not
   read its docs looks exactly like one that has.* Then it writes slice 1.
2. **Read the sweep lane's `game/scene` diff when it lands — the diff, not the summary.** Judgement is the
   deliverable and the gate cannot check it; a deleted comment never fails a test. Check specifically that
   art-encoding and gameplay-contract comments survived.
3. Then slice 2 — **rail and emitter array**, with the metalness pair rendered both ways (`ART_MATERIALS`
   M1 says metalness 1.0 / roughness 0.35–0.50 against the shipped 0.12/0.62; at 1.0 everything the rail's
   specular misses goes pure black, since the sky is ~linear 0.01 as an IBL source). **Not settleable on
   paper — the lane renders both and the owner picks.**
4. **Blocks (task 7)** after the track, per the owner's session-12 request: summarize → brainstorm → plan →
   lane.

Talk to lanes with **`SendMessage` addressed by the `ListAgents` name**, never `herdr agent prompt` — the
relay drops packets silently and the failure looks exactly like success.

---

## Late addition — the Canvas-isolation guard has been lying since #115 (issue #138)

The track lane's comment sweep turned `pnpm lint` red on `routes/art-lab/route.tsx`, a file it never touched.
It refused to restore the backticks that would have made it green, and escalated. That was correct, and it
uncovered a real defect.

**`scripts/check-canvas-isolation.mjs` strips strings BEFORE comments.** The template-literal regex does not
know it is inside a comment, so a backtick in one comment pairs with a backtick in a later one, the match
spans the `*/` between them and collapses it, and `stripComments` then eats an arbitrary span of **real
code** up to the next `*/`. Nothing fails loudly — the file just gets quietly shorter.

**Reproduced independently on `dev` at `59805a1`, before any lane change**, by running the guard's own
`strip()`:

| file | survives | `<Canvas` after strip | exported fn names after strip |
|---|---|---|---|
| `iso-lab/iso-lab.tsx` | 19% | **gone** | **none** |
| `iso-lab/iso-lab-canvas.tsx` | 39% | **gone** | **none** |
| `routes/art-lab/art-lab-canvas.tsx` | 27% | **gone** | **none** |

No exported name survives, so these were never registered as Canvas wrappers and every route rendering one
was never checked. The guard printed *"8 route entry modules clean"* throughout. **Its pass/fail currently
depends on how many backticks are in a file's prose.** Its mutation test passes vacuously on a file it
cannot see.

**Filed as #138** with measurements and acceptance criteria. The obvious fix is unavailable for the reason
the script's own header records — TypeScript 7 exposes no JS compiler API and Biome's GritQL JSX matching was
unverified — so it likely needs a single-pass tokenizer; strings and comments cannot be separate passes in
either order.

**The violation it was hiding is real:** `routes/art-lab/route.tsx` holds four `useState` plus a `useMemo`
directly above `<ArtLabCanvas>`. **Ruled option C:** the lane extracts an `ArtLabShell` leaf inside slice 1
(precedent already in the tree — `env-lab/route.tsx` and `art-gallery/route.tsx` both do this), and #138
owns the guard. The lane must not touch `scripts/`.

**Keep the lane's caveat visible, it is the honest part:** the same re-render still walks the Canvas
subtree, one level down — it has moved, not gone. What the extraction buys is that a React Router loader or
navigation re-render of the route entry no longer reconciles the scene, which is what non-negotiable #10 is
actually about. A later session reading the commit as "fixed the re-render" will be wrong and will stop
looking.
