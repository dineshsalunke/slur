# Supervisor handover — session 25 (2026-09-20)

## The owner's two standing instructions from this session

1. **The rail's channelled cross-section (`02-track/RAIL-PROFILE.md`) is PARKED as polish.** His words:
   *"the profile thing was polish we don't need to do it right now."* The five open parameters (body
   height, channel depth, how proud the emissive stands, wall angle, skirt depth) are **not** questions
   to re-ask. Do not build it, do not brief it.
2. **Lanes do the building, not the supervisor.** *"i thought this was supposed to be done in
   worktrees by the lanes, why are you doing the changes yourself? for now finish it but i hope rest of
   the work will be done on lanes."* I did dispatch this session's unit to the lane and the delivery was
   **refused** (below) — but the correct move was to stop and tell him, not to pick it up myself. **Next
   unit goes to a lane. If a lane cannot be reached, escalate rather than absorb the work.**

## ⚠️ Cross-session messaging to the lane is BROKEN — fix before dispatching anything

`SendMessage` to `track-slice2-d8 [b9952f]` returned `success: true`, then a delivery notice arrived:
*"that session is not accepting cross-session messages (the feature is off there, or a setting or
policy there refuses them)"* — recipient socket `uds:/tmp/cc-socks/35839.sock`. **The lane never
received the brief.** Nothing in `.claude/settings.json` or `~/.claude-personal/settings.json` mentions
peer messaging, so the knob was not found this session.

This matters more than any single build unit: memory `peer-messaging-not-herdr-prompt` records that the
herdr relay (`herdr agent send-keys`) **drops packets silently, pastes without submitting, and gets
classifier-blocked**, so it is not a fallback. Until peer messaging works, lanes cannot be tasked.
**Resolve this first.**

## ⚠️ Dev-server port churn — DIAGNOSED (owner reported it this session)

He reported *"the stack keeps on closing and starting again and the port number keeps on changing."*

**Cause, verified this session:** `apps/client/vite.config.ts:39` reads `port: Number( env.CLIENT_PORT || 5173 )`
but **never sets `strictPort`**, so Vite's default `strictPort: false` applies — a taken port is silently
auto-incremented rather than failing. And three worktrees have **no `apps/client/.env` at all**, so they
all fall back to 5173 and race:

| worktree | `apps/client/.env` |
|---|---|
| `bloom-input` | **MISSING** |
| `codex-reconcile` | **MISSING** |
| `track` | **MISSING** |
| `bloom-knobs` | 5205 / 2605 |
| `boundary-three-way` | 5206 / 2606 |
| `marigold-retone` | 5203 / 2603 |
| `track-slice2` | 5201 / 2601 |

**Recommended fix (not built): set `strictPort: true`.** A silently-moved port is worse than a crash
here — the owner's Chrome tab and the frame-tap (`curl localhost:<PORT>/__frame-tap`) then point at the
*wrong stack* while everything looks fine, which is the same class of error as the hidden-tab and
duplicate-module incidents. Failing loudly on EADDRINUSE makes the missing `.env` obvious immediately.
Then give every lane worktree a distinct `.env` pair.

**The "closes and starts again" half is NOT diagnosed** — could be the lane skill relaunching or `tsx
watch` cycling. Needs evidence, not a guess.

## What landed

**`art/boundary-three-way` @ `ed325de`, pushed. PR #151, still DRAFT.**

- **Rebased onto `origin/dev` (`1b2e71f`) and force-pushed** (`dce423c` → `912e860`). **This was a live
  hazard:** the branch was cut at `bb59350`, one commit before #152 merged, and `git diff origin/dev HEAD`
  (2-dot) showed it deleting **74 lines from `DECISIONS.md`** plus 52 from `PASTE-TO-CODEX-rail-outboard.md`,
  22 from `ART_SCALE_REFERENCE.md`, 18 from `INDEX.md`, 8 from `02-track/README.md`, and a chunk of
  `ART_MATERIALS.md` — i.e. a squash-merge would have **reverted ADR-012 out of the docs**. The rebase
  applied *cleanly*, so nothing would have warned anyone. This is memory
  `reused-branch-stale-base-reverts-dev` recurring; the 3-dot diff hides it, the 2-dot diff shows it.
- **`ed325de` — A/B/C deleted, the outboard rail is the only boundary.** ADR-012 was merged in the docs
  but **false in the code**: `BOUNDARY_VARIANT = 'A'` was the committed default, A is non-outboard, so
  `emitSpan` ran `deckL = !outboard && isOuterEdge(x0) ? x0 + w : x0` — the deck drew 62u while the player
  flew 64u, the exact bug the ADR exists to kill.

  Deleted rather than defaulted, deliberately: with one boundary left the branching disappears and the
  deck's top face spans `x0..x1` unconditionally, so **the invariant holds by construction — no code path
  can inset the deck.** Gone with the variants: `BoundaryVariant`/`BOUNDARY_VARIANT`/`isOutboard`/
  `isRaised`, C's `inwardFalloff` and the `uv1` ramp in `packGeometry`, `boundarySoftSurface`,
  `edgeFalloffRamp` + its canvas, `debug-variant.tsx`, and the material `key` (needed only because C
  swapped in a second map). Net `10 files, +154/−375`.

  **`width` and `wrap` stay live sliders and `wrap` still reaches 0** — flush-vs-raised is the owner's
  open call and was NOT closed here.

  **Tests:** A/B/C cases dropped; the invariant is pinned directly instead — deck top face lands on
  exactly ±`HALF_WIDTH`, and no rail vertex falls inboard of the edge, swept over five width/wrap pairs
  including wrap 0.

  **Full gate green:** typecheck · lint (comment ratchet + Canvas-isolation both pass) · 69 client + 4
  server tests · build. **Not yet flown on `:5206` — no visual confirm at wrap 0 vs wrap 1.**

## Immediately outstanding

1. **PR #151's description still describes three bevel shapes.** It is now a different change entirely:
   the rail stands outboard *in code*, plus the gap-end cap profile, the `emitEdge` refactor, the
   `/art-lab` placeholder-footprint fix, and the ADR-012 acceptance test. **Rewrite before it leaves
   draft — supervisor's job, still not done** (carried from session 24).
2. **`02-track/README.md`'s status line is STALE.** It says *"the review frame is honest (#131); the art
   itself is not built"* and *"D1 is not done"*. Verified false: `TrackView` is now three leaves with
   `TrackFloor` as the game's floor (D1), `toneMapped: false` is gone from `track-materials.ts` (D3), the
   leaves are split so blocks can default off (D5), and `FLOOR_METALNESS` is committed at the M1 value
   **1.0** with `FLOOR_ROUGHNESS = 0.42`. Held back this session only to avoid committing into a worktree
   a lane might be live in.
3. **#150** (`art/bloom-input` @ `9ec40f8`, `:5205`) — clean, gate green, prod path untouched. **Still
   unpaid by the owner**, carried from session 24. Two minutes of his eye.

## The next build unit — D2/D7, the emitter array

This is the largest un-built piece of task 2 and it is **not** blocked by the parked rail profile: the
emitter array needs the rail's *position and intensity*, not its section.

`02-track/README.md` D2 specifies it: **`MeshStandardMaterial` patched through `onBeforeCompile`, fed by
a FIXED-SIZE uniform array of the K nearest emitters**, with the edge rails as the only emitters. Verified
this session: **zero `onBeforeCompile` in any track file** — the only two in the repo are
`sky-backdrop.tsx` and `ship-model.tsx`.

**Load-bearing, and D2 says it must be stated in the code:** fixed-size is not a simplification. A varying
light count **recompiles the shader mid-race**; a fixed-size array has no count to churn. Do not let it be
tidied into a dynamic array.

D7 orders it **before** the floor's finish is judged — *"dark metal carries no information until something
warm is reflecting off it"*, so judging the deck's finish under placeholder light means re-judging it later.
D8 then rides world-space wear noise in the **same** patch (no UVs, no tile, no period — `track-texture.ts`
is one 1024² canvas over a 16×20u panel, repeating ~400× down-track, and §4 forbids a lockable tiling period).

Open sub-question D2 flags: isotropic vs anisotropic decides whether the patched material is
`MeshStandardMaterial` or `MeshPhysicalMaterial`. **Settle by rendering, not by reading boards.** Footgun
already paid for: three@0.185.1's `anisotropy` setter recompiles when the value crosses zero — never
animate or toggle it through 0 mid-race.

## Carried, untouched

Fly 7.5u through 8u pillar fields with `fly` ON (ADR-011, #142) · `MARIGOLD_REFERENCE_INTENSITY` committed
at 2.0, owner ran 4.1 in an earlier shot · slice 2's fixed-size K-nearest emitter array · occlusion at
7.5u · rail breaks over full gaps (still undecided) · slice 3 floor finish · `CONTRIBUTING.md`'s false
trailer-hook claim · **the two divergent `docs/art-direction/` snapshots, neither on `dev`** (shared
checkout's dirty 17 files vs `docs/codex-reconcile` @ `84291fb`) — his call, and a `git pull` in the shared
checkout will collide with it.

## ⚠️ Shared checkout

Still `1807bc0`, **19 behind** `origin/dev` (`1b2e71f`), dirty across 17 tracked files. Read from a
worktree or `git show origin/dev:<path>` — it has already produced one wrong citation.

## Commit trailers

The repo hook **rejects `Co-Authored-By` outright** ("not permitted in commits per user policy"), including
the `Claude Opus 5 (1M context)` form the session system-reminder asks for. The hook wins; commit without
it. Memory `no-coauthored-by-trailer` already records this.

## Lane

`track-slice2-d8`, herdr name **`track`**, worktree `../slur-worktrees/track-slice2` (**must NOT be
removed** — its herdr shell is cwd'd there). Cleared and idle, took no work this session because the
message was refused. The brief written for it is committed at
`.claude/art-pass/02-track/BRIEF-DELETE-ABC-PIN-D.md` — that unit is now **done**, so the file is a record,
not a live task.

---

## Late additions — end of session 25

### Port churn: FIXED

- **`strictPort: true`** on the client dev server — **PR #153**, `fix/strict-port` @ `b8a84f0`, worktree
  `../slur-worktrees/strict-port`. Gate green (typecheck · lint · 75 shared + 4 server + 67 client · build).
  Two lines came off the `host: true` comment to stay under the comment ratchet; the removed half was
  history (why LAN peers once could not connect), not something the code needs. **Open, unreviewed.**
- **Every worktree now has a distinct `apps/client/.env`** (gitignored, local only, nothing committed):
  `track-slice2` 5201/2601 · `marigold-retone` 5203/2603 · `bloom-knobs` 5205/2605 · `boundary-three-way`
  5206/2606 · `bloom-input` 5207/2607 · `codex-reconcile` 5208/2608 · `track` 5209/2609 · `strict-port`
  5210/2610 · `emitter-array` **5200/2600**.
- **The "closes and starts again" half is still NOT diagnosed.** Needs evidence — likely the lane skill
  relaunching or `tsx watch` cycling, but that is a guess and should not be treated as an answer.

### PR #151 — description rewritten, title changed

Now *"art(track): the rail stands outboard, in code — delete variants A/B/C"*. The dead three-bevel
framing is gone; it describes the deletion, the by-construction invariant, the gap-end cap profile, the
`emitEdge` refactor, the `/art-lab` placeholder-footprint fix, and the stale-base near-miss. **Still
DRAFT and still not flown** — no visual confirm on `:5206` at wrap 0 vs wrap 1. That look is the only
thing between it and merge.

### New lane: `emitter-array` — the D2/D7 emitter array

- herdr agent **`emitter`**, workspace `w2H`, pane `w2H:p1`. **`ListAgents` name is `emitter-array-4b
  [b81564]`** — that is the address for `SendMessage`, not `emitter`.
- Worktree `../slur-worktrees/emitter-array`, branch `art/emitter-array`, base verified `== origin/dev`
  (`1b2e71f`). Ports 5200/2600, review at http://localhost:5200/art-lab. Agent authenticated under
  `~/.claude-personal`, auto permission mode, 0% context at start.
- Brief committed-in-tree at `.claude/art-pass/02-track/LANE-BRIEF-EMITTER-ARRAY.md` (151 lines).
- **The brief was DELIVERED** — unlike session 25's earlier attempt at the `track` lane, this send was
  accepted. A freshly started lane accepts peer messages; the old `track-slice2-d8` session does not.
  **If a lane must be reached and refuses messages, restart it as a new lane rather than falling back to
  the herdr relay** (which drops packets silently).
- **Escalation queued from it:** isotropic vs anisotropic, which decides `MeshStandardMaterial` vs
  `MeshPhysicalMaterial` and therefore what task 3 inherits. It will settle it by rendering and send a
  recommendation before committing. Relay the reasoning back, not just the verdict.

### Gotcha worth keeping

The commit hook's `Co-Authored-By` rejection fires on the **literal string anywhere in a heredoc**, not
just in a commit message — it blocked a `cat > brief.md` whose text merely *mentioned* the trailer. Write
around it ("the co-author trailer").

### Immediately next

1. Owner flies `:5206` (PR #151, wrap 0 vs wrap 1) → un-draft → merge.
2. Owner looks at **#150** (`art/bloom-input`, `:5207` now) — carried unpaid since session 24.
3. Review/merge **#153** (`strictPort`).
4. Lane reports its stack up + brief read; then its isotropic/anisotropic recommendation lands.

### Lane checked in, and found a stale doc

`emitter-array-4b` reported its stack up on first try (no stale `.vite` cache, no lfs smudge issue),
`curl /art-lab` → 200, shared tsc-watch clean. It is taking research rung 2 as settled —
`onBeforeCompile` on a subclassed standard material, K fixed globally, `defines.NUM_EMITTERS` as an
unused escape hatch. Agreed, and told it a `define` change is a recompile so that hatch belongs at
build/config time, never on a live path.

**It caught a real doc/code disagreement, and the CODE wins.** Verified on both `origin/dev` and
`art/emitter-array`: `track-materials.ts:14` `FLOOR_ROUGHNESS = 0.42`, `:16` `FLOOR_METALNESS = 1.0`,
identical, no drift. **`02-track/README.md`'s "flagged, not decided" section is STALE** — it still reads
as though 0.12/0.62 were live and the M1 bare-conductor pair were a proposal. M1 was taken. **Fixing that
section is the supervisor's job (docs are mine), and it is NOT done** — add it to the README status-line
correction already queued in this handover.

**Consequence worth carrying:** metalness 1.0 removes diffuse entirely and the sky is only ~linear 0.01
as an IBL source, so every part of the deck the emitter array does not reach renders **pure black**. The
README already flags this as *"the single most likely thing to fail at the rail gate"* and not settleable
on paper. The lane has been told that if 1.0 proves untenable, that is a real finding and an escalation —
not something to quietly soften.

**Rule restated to the lane and worth keeping:** Chrome tab ids are per-session, a later session cannot
adopt one, so never record a tab id as state. Create it, hold it, pass it explicitly on every call.

---

## Emitter-array lane — at a seam, READY TO CLEAR

**`art/emitter-array` @ `7a1db09`, pushed, tree clean, gate green, NO PR opened.**
Commits: `c21363d` (light the deck from the rails through a fixed-size emitter array) · `7a1db09`
(stand the rail emitter above the deck, or it lights nothing). Base `origin/dev` @ `1b2e71f` —
**needs rebase now that `e8a82d1` (strictPort) and, later, the A/B/C deletion have landed.**

Gate at `7a1db09`: typecheck · lint (ratchet: 7 changed files, none gained comment lines) · shared 75/75 ·
client 72/72 (5 new in `track-rails.test.ts`) · server 4/4 · build.

### THE FINDING — route it to Codex, it strengthens ADR-012 from a second direction

The owner saw *"only the faces in the gaps facing towards camera are emitting light."* Cause: the emitter
sat at `top - h/2` (y = −0.5), below the deck plane, following where the strip lies in the retired INSET
geometry. The deck's top-face normal is +Y, so `dot(N,L) <= 0` and it received **exactly zero at any
intensity**; gap end caps face ∓z, so the same source is inside *their* hemisphere — hence those and only
those.

**The general form is what matters: a strip flush with the deck cannot light the deck at all.** A coplanar
source illuminates a coplanar surface at exactly zero. So the retired inset reading is not merely awkward
to light — it is **unlightable**. That is independent corroboration of ADR-012 from the *lighting* side,
with nothing to do with playable width, and it is worth sending to Codex as a second physical
justification for the outboard ruling.

Fixed as `top + lift`, `RAIL_EMITTER_LIFT = 0.5`, slider floor above 0 so it cannot be dragged back into
the dead plane, plus a test pinning `y > 0` with the reason. **The full gate was green with the light
doing literally nothing** — nothing but a rendered frame would have caught it.

### As-built worth keeping

- `emitter-array.ts`: `EMITTER_SLOTS = 12` as a literal interpolated into the GLSL array size. Closure
  source text is constant, so three's default `customProgramCacheKey()` (`Material.js:543`, returns
  `onBeforeCompile.toString()`) is correct — no override needed. `defines.NUM_EMITTERS` left unused.
- The injected block does **not** fake a lobe: it builds an `IncidentLight` and calls three's own
  `RE_Direct` at `#include <lights_fragment_begin>`. Streaks are real GGX at grazing incidence.
- Slots are **tubes**, not points (closest point on the run to the reflection ray, Karis 2013). A point
  emitter is the same slot at half-length 0 — the shape task 3's engines/pickups/projectiles inherit.
- Rail runs are **static per track** (`track-rails.ts`). Per frame = K-nearest scan + ≤12 writes,
  allocation-free, module-scope scratch. A deck gap ends a run rather than dimming it. Runs clamp to a
  window around the ship so endpoints slide instead of popping.
- Panel knobs under `rail emitter`: intensity 0–200 (40) · range 10–400 (150) · decay 0–3 (**1**) · lift
  0.05–4 (0.5). All four in `debugTuningSource()`. **Decay is 1, not 2, deliberately:** at inverse-square
  the ribbon centre is 32u from either rail and stays black.

### The NEEDS-DECISION is BLOCKED, and not by the lane

No isotropic-vs-anisotropic recommendation: **the lane could not render.** Its tab reported
`visibilityState: "hidden"`, `hasFocus() false`, rAF dead, no `__r3f` on the canvas or any ancestor, and
`curl 'localhost:5200/__frame-tap?name=emitter-01'` → **504**. This is the known frame-tap failure — a
never-visible tab never mounts R3F (root creation gates on measured size), so the tap's own responder does
not exist. It cannot foreground its own window. **Every visual claim from this lane is `[unmeasured]`;**
the shader's compile is proven only indirectly, by the owner seeing lit gap faces at all.

**What makes the decision cheap when it happens:** because the patch routes through `RE_Direct`, anisotropy
enters via `material.anisotropyT/B` inside `RE_Direct_Physical`
(`lights_physical_pars_fragment.glsl.js:178-183`), so **the injected GLSL is byte-identical either way** —
the choice is a material-class swap and nothing else. Its tab is parked on `/art-lab` at `localhost:5200`.

### Two traps the next lane will hit

- **`LANE-FACTS.md` already existed** (466 lines from the `art/track` lane). This lane overwrote it before
  checking, caught it within the minute via `git status` showing 513 deletions, restored with
  `git checkout --`, and appended under its own `# art/emitter-array` heading. Nothing lost. **The brief
  says "start the file" and the file is already there** — fix the brief wording.
- **`pnpm format` does NOT fix `assist/source/organizeImports`;** `biome check --write <files>` does. Cost
  one red gate run.

### Still open on this lane

`FLOOR_METALNESS = 1.0` tenability — `[unmeasured]`, the README's own most-likely-to-fail item, and with
lift fixed there is now actually light on the deck to judge it by · frame-time cost of the patch
`[unmeasured]` · D8 world-space wear not started, by design · rebase onto dev.
