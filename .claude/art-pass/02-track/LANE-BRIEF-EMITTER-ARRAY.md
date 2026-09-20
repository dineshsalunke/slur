# Lane brief — the emitter array (task 2, decisions D2 + D7, then D8)

**Worktree:** `/Users/apple/Projects/personal/slur-worktrees/emitter-array` (yours; never the shared checkout)
**Branch:** `art/emitter-array`, cut from `origin/dev` @ `1b2e71f`
**Ports:** `CLIENT_PORT=5200`, `VITE_SERVER_PORT=2600` · review at http://localhost:5200/art-lab

## Your first action: start your own stack

You own it for this lane's life. Backgrounded, redirected, never streamed into your context:

```
cd /Users/apple/Projects/personal/slur-worktrees/emitter-array
PORT=2600 pnpm dev > .claude/lane/dev.log 2>&1 &
```

`PORT` **must** equal `VITE_SERVER_PORT` — `tsx` has no dotenv loader, so the server reads it from the
shell while Vite reads the `.env`. Check nothing is already serving those ports first; two stacks on one
worktree fails confusingly rather than loudly. Then `curl -s -o /dev/null -w '%{http_code}'
http://localhost:5200/art-lab` and get a 2xx **before judging anything on screen** — a black canvas is as
likely to be a dead stack as a real result. `tail` the log on demand.

**A stack that will not start is your first task and your first report**, with the log tail — not
plumbing to hand back. Two known causes, both already paid for:
- A stale Vite dep cache makes koota's `useWorld` see a null React and blanks the whole Canvas behind the
  error boundary, so: `rm -rf apps/client/node_modules/.vite`, restart.
- Unsmudged git-lfs ship models 404 and take the Canvas down the same way, so: `git lfs pull`.

## The work item

Build the **patched-material emitter light**: a `MeshStandardMaterial` patched through
`onBeforeCompile`, fed by a **FIXED-SIZE uniform array of the K nearest emitters**, with the **edge rails
as the only emitters** in this task.

Spec: `.claude/art-pass/02-track/README.md` decisions **D2** and **D7**. Mechanism and its 5-option
enumeration are already paid for in `.claude/art-pass/03-lighting/research/2026-09-18-emissive-as-light.md`
— read it, do not redo it.

Verified before you started: there is **no `onBeforeCompile` in any track file** today. The only two in
the repo are `sky-backdrop.tsx` and `ship-model.tsx` — read `ship-model.tsx`'s dissolve shader first, it
is this repo's precedent for the technique.

### Why this is the next thing, and why it comes before the floor's finish

D7: *"dark metal carries no information until something warm is reflecting off it"*. The deck ships at
`FLOOR_METALNESS = 1.0` / `FLOOR_ROUGHNESS = 0.42` — bare conductor, which removes diffuse entirely, and
the sky measures only ~linear 0.01 as an IBL source. So without emitter light the deck is a **black void
with a marigold stripe**, and judging its finish under that is judging it under light the finished scene
will not have. Light first, then the surfaces it lights.

### FIXED-SIZE IS LOAD-BEARING — say so in the code

A varying light count **recompiles the shader mid-race**; a fixed-size array has no count to churn, so it
cannot. That is the entire reason the research chose this shape over a real-light rig. Do not let it be
"tidied" into a dynamic array, and leave a one-line comment saying why.

### What the floor should show

Board evidence (README section 8, cross-checked over five independent regions) settled this:
**grazing-angle specular streaks, NOT mirror reflections.** The falsifier: a mirror reflects *dark*
geometry, and no board ever shows a dark inverted body beneath a dark monolith. Signature to reproduce —
bright-only, elongated **along the view direction**, length much greater than source size, soft-edged,
tapering, no silhouette, never inverts. `MeshReflectorMaterial` stays unused; it costs a full extra scene
render per frame.

## Scope

**In:** the shader patch, the K-nearest emitter selection, rails as emitters, the uniforms, and live
debug-panel knobs for whatever you expose.
**Out, explicitly:** the rail's channelled cross-section (`02-track/RAIL-PROFILE.md`) — the owner parked
it as polish this session, do **not** build it. Also out: engines/pickups/projectiles/monolith seams as
emitters (task 3 extends to those), the floor's final finish, and block design.

**D8's world-space wear noise rides in the SAME patch** — a later slice of this lane, not a separate
system. Do not build it into `track-texture.ts`: that canvas is one 1024-square tile over a 16x20u panel,
repeating ~400 times down-track, and the task's definition of done forbids a tiling period the eye can
lock onto. Wear is world-position-driven noise with no UVs and no period. Get the emitter array gated first.

## The one thing to escalate, not decide

**Isotropic or anisotropic?** It decides whether the patched material is `MeshStandardMaterial` or
`MeshPhysicalMaterial` — `anisotropy` lives on Physical only. Isotropic GGX does stretch at grazing
angles, but the boards' streaks are longer and narrower than that alone tends to give. **Settle it by
rendering, then escalate your recommendation before committing to it** — it changes which material task 3
inherits.

**Footgun, already paid for:** three@0.185.1's `anisotropy` setter recompiles the shader when the value
crosses zero (`this._anisotropy > 0 !== value > 0` gives `version++`). Never animate or toggle it through
0 mid-race, and do not put a slider through 0 without knowing that.

## In flight, and it touches your files

**PR #151** (`art/boundary-three-way`, draft) deletes boundary variants A/B/C and changes
`track-boundary.tsx`, `track-floor.tsx`, `track-materials.ts`, `track-geometry.ts`. Expect to rebase onto
`dev` once it merges. Do not cherry-pick from it; do not work around it.

## How it is judged

`/art-lab`, the **real chase camera, at race speed**, bloom on and off, against
`refs/12_approved_scene_marigold_depth.small.jpg`. Not the `/art-gallery` orbit camera — a side-facing
glow is edge-on there and reads as unlit even when it is correct.

Use the **`claude-in-chrome` tools**, never Playwright. Create your **own** tab (`tabs_create_mcp`) and
pass its `tabId` on every call — parallel lanes fight over one tab otherwise. The point is that you and
the owner look at the same live tab.

## Gate — the whole thing, verbatim

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

`pnpm -r test` **silently skips `@slur/shared`** and its 75 sim tests; the explicit `--filter` is not
redundant. Lint includes a **comment ratchet** — a changed file may not gain comment lines, so budget
them: terse, only what the code cannot say, one or two plain lines. No multi-paragraph rationale blocks;
longer reasoning goes in the commit body.

## Rules

- **Never regex-edit source** (`sed -i`, `perl -pi`): use `Edit`, or `ast-grep` for structural sweeps.
- **No Python** for any scripting or checking.
- **No co-author trailer in commit messages** — the commit hook rejects that trailer outright, in every
  form. Write the message without one.
- Don't `git add` and `git commit` in one Bash call; a hook rejection kills the whole call.
- All edits and commits in this worktree.

## LANE-FACTS.md — from your first commit, not at handover

Maintain `.claude/art-pass/02-track/LANE-FACTS.md` beside this brief, **continuously**. Raw facts, one
line each: measurements with units, SHAs, `file:line` citations, config values, gate results, versions
read from installed source, and what you tried that failed. No prose, no narrative. `[unmeasured]` is a
legitimate and valuable entry — refusing to reconstruct a reading you cannot source first-hand is correct.
Append-only within a slice, committed with the code it describes.

## Escalation

Escalate to me (the supervisor), never to the user directly, in exactly this shape:

```
NEEDS-DECISION: <one line, specific, answerable>
CONTEXT: <2-4 lines: what you are doing, why this fork exists>
OPTION A — <label>: <what it means> / consequence: <what it costs or commits us to>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why>
IF NO ANSWER: <what you do meanwhile, or that you are genuinely blocked>
```

Escalate: art/taste judgements, anything reopening a frozen decision or ADR, anything touching gameplay,
anything costly to undo, and your research recommendation **before** implementing it.
Do NOT escalate: naming, file layout, code structure, anything the docs already answer, and anything
settleable by **verifying** — an API's behaviour, a measured value, whether something renders. Verify,
don't ask. Never treat silence as approval. If the decision is visual, park your Chrome tab on it and say so.
