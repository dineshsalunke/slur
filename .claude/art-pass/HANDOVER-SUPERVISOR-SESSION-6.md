# Handover — supervisor session 6 (2026-09-19). Read with `INDEX.md` §"▶ NEXT".

**Assume no chat history.** You are the supervisor: lanes execute, you brainstorm, write, decide and relay.

---

## 0. State in one paragraph

Task 1 (background sky) is **merged to `dev`**. Task 2 (track) is **decided, briefed, and its lane is
running** — `art/track` has slice 0 built, verify gate green, and is acting on two decisions relayed this
session. Nothing is blocked on code. The next thing that needs a **human** is the owner's eye on slice 0's
frame in a foreground `/art-lab` tab.

---

## 1. What happened this session

1. **Task 1 landed.** `art/background` @ `3f8458a` → PR **#126** → squash-merged to `dev` as **`1807bc0`**.
   Full verify gate re-run green in the worktree first; `refs/pull/126/head` checked against the gated SHA
   immediately before merging (the `#94` stale-head failure mode). `dev` now also carries every art-pass
   tracking doc, which until now lived untracked in the shared checkout.
   - The shared checkout was fast-forwarded. Two **stashes** hold the superseded untracked copies
     (`stash@{0}` supervisor docs, `stash@{1}` stale art-pass copies) — every file in both exists in `dev`,
     verified, so they are droppable at will. The gitignored `*/refs/` board crops survived.
2. **Task 2 was briefed.** `.claude/art-pass/02-track/LANE-BRIEF.md` (supervisor-written, ~330 lines):
   read-first list, the five decisions, five gated slices, definition of done, verify gate, traps, escalation
   contract, ports. Decision records went into `02-track/README.md` §7; `INDEX.md` updated.
3. **The lane launched.** Worktree `../slur-worktrees/track`, branch `art/track` off `1807bc0` (base SHA
   verified), ports **5201 / 2601**, stack live, herdr workspace `w2C` (agent pane `w2C:p1`, stack pane
   `w2C:p2`). Peer name for messaging: **`track-6c`**.
4. **The lane built slice 0** and raised one decision packet. Both answers were relayed (§3).

---

## 2. The five task-2 decisions, as they now stand

Full reasoning in `02-track/README.md` §7. **D3 and D5 both moved this session — do not work from an older
copy of the brief.**

| | Decision |
|---|---|
| **D1** | `TrackFloor` (one continuous generated mesh) becomes the game's floor; `TrackView`'s instanced floor quads are deleted. Gap treatment is geometry, and 4u-repeating boxes *are* the forbidden dense seam grid |
| **D2** | Task 3's emitter array comes **forward**: `MeshStandardMaterial` patched via `onBeforeCompile`, fed a **fixed-size** uniform array of the K nearest emitters (rails only, this task). Fixed size is load-bearing — a varying count recompiles the shader mid-race |
| **D3** | **RESOLVED (owner):** tone mapping **ON at the renderer default, everywhere**; `toneMapped: false` comes off the track surfaces and **no panel switch is built**. Verified: r3f 9.7.0's `<Canvas>` sets ACES Filmic unless `flat`, which nothing passes. Consequence: every emissive value needs re-tuning — that is the work, not a regression. Also forecloses task 1's deferred `Tone map` knob: **ON** |
| **D4** | **NEW (owner):** `/art-lab`'s own `ambientLight` + `directionalLight` are **deleted**; the lab is lit by the shipped `DeepSpaceSky` rig alone. `StarLight`/`SkyEnvironment` stay mounted regardless of the `backdrop` toggle, so "backdrop off" does not mean "pitch black" |
| **D5** | **REPLACED (owner):** the obstacle blocks come **out of the review frame**; they are **not** retoned. Split the welded `hazards` toggle — rails and blocks become independent layers, **blocks default OFF**, one click away for the hazard-to-floor contact-shading check. `LETHAL_SURFACE`/`DRAG_SURFACE` colours are **not touched** in task 2 |

**Why D5 moved, because it generalises.** The first D5 said "retone the off-palette red blocks so they do
not poison the material read". The owner struck it: *"these obstacles are just plain box, they don't really
help in any way and also block the view."* The cause was structural — `/art-lab` welds blocks to rails in
one toggle (`TrackView` draws floor + lethal + drag + **rails**), so blocks defaulted ON only because
turning them off would delete the **edge rail, the task's own subject**. The lane independently found the
same thing from the other end: retoning would make the blocks the brightest warm objects in frame,
competing with the rail's marigold read in slice 3. The scrapped earlier art attempt made the identical
mistake. **Ask what each element in a review frame is teaching you; anything answering "nothing" comes out.**

---

## 3. What the lane is doing right now

Slice 0 ("honest frame") was built and the verify gate was green, held uncommitted. It then received two
relayed decisions:

- **D5 replacement** — revert the lethal/drag retone entirely; split the toggle instead.
- **D3 scope** — its own packet asked whether "everywhere" meant the whole app, since eleven other files
  still set `toneMapped: false`. Its recommendation was accepted **as reasoned**: track surfaces **plus**
  `tube-walls.tsx` and `track.tsx` only. Those two are the track/environment pipeline; the rest (finish
  gate, pickups, bolts, sparks, explosions, ship engines) is VFX whose values trade against the bloom and
  exposure budget **task 3** owns — re-tuning them now would be tuning against a budget that does not exist
  and would be redone the moment task 3 sets it.

It was told to commit slice 0 (code **and** the updated docs), park a **foreground** `/art-lab` tab, and
report ready — and **not** to start slice 1.

**The lane's own caveat, which must not be lost:** its emissive re-tune is **reasoned, not measured** — it
has never seen the frame. Treat the numbers as a first guess and require a measure-and-re-tune once the tab
is foreground, before the gate proper.

---

## 4. Two process corrections made this session — they are now in the `/lane` skill

1. **Message lanes with the `SendMessage` tool**, addressed by the name `ListAgents` / `/list-agents` shows
   (`track-6c`). **Never `herdr agent prompt`.** It types into a pane: it has silently dropped a whole
   decision packet, it can paste without submitting, and the calls get blocked by the permission classifier —
   which strands the supervisor on a `--wait --until idle` that never returns while the lane sits idle. All
   three failures are invisible at the call site. `herdr` stays correct for worktrees, panes, the stack and
   reading output.
2. **Start lane agents in auto mode:**
   `herdr agent start <name> --kind claude --pane <id> --timeout 120000 -- --permission-mode auto`
   (`--permission-mode` accepts `auto` — verified against `claude --help` this session). Without it the owner
   hand-accepts every tool call and then toggles auto mode themselves.

---

## 5. Next actions, in order

1. **The owner's eye on slice 0** — foreground `/art-lab` tab, bloom on **and** off. The frame should be
   *honest* (only lighting the game has) and *uncluttered* (no obstacle boxes). Expect it to look worse than
   before; it was flattering itself.
2. **Slices 1→4** in order, each gated by the owner's eye: floor swap (D1) → panel language → rail + emitter
   array (D2, and the isotropic-vs-anisotropic call settled **by rendering**) → gaps (the hardest read:
   gap edges distinguishable from panel seams *and* from reflected light, **moving**).
3. **Then the deferred `/iso-sky` + `/art-lab` sky gate** with a real track in frame. `Tone map` is no
   longer one of its knobs (D3 forecloses it ON); `Field of view` **140** and `Tilt` **0°** remain.
   > ⚠ Never gate from an automated Chrome tab — it reports `visibilityState: "hidden"`, rAF never fires,
   > and the canvas stays black while the DOM panels render fine. Paid for twice.
4. **Then task 3 (lighting)**, which balances and extends D2's emitter array rather than inventing it.

## 6. Uncommitted in the shared checkout

`.claude/art-pass/02-track/{README.md,LANE-BRIEF.md}` and `.claude/art-pass/INDEX.md` are edited here and
**already copied into the lane's worktree**, which is where they will be committed — the pre-commit hook
blocks a Claude commit in the shared checkout. Keep them in sync if you edit them again; this file is
untracked and rides the same way.

---

## 7. ADDED LATE IN THE SESSION — task 7, the sealed deadly block (parallel lane, briefed, NOT launched)

**Brief:** `.claude/art-pass/07-blocks/LANE-BRIEF.md` (218 lines, written and ready). `INDEX.md`'s task table
carries the new row and the rationale.

**Scope: the SEALED deadly block only — silhouette and material.** Not the fractured/destructible block, not
the amber drag block, not a support colour.

**Why it can run in parallel, and why now (owner's call, and it is the right one).**
- `docs/DECISIONS.md` **ADR-009** proposes merging slow + destructible blocks into one *breakable* primitive,
  but it is **`PROPOSED`** and says of itself: *"gated on the readability test below. **Do not build until
  that gate passes.**"* That gate is unrun: *at 55 u/s on the real chase camera, can a player reliably tell
  sealed from fractured?* — roughly half a second on an 8u block.
- ADR-009 leaves the **sealed** state *"deadly — kills on contact (**unchanged**)"*. So building only the
  sealed block bets on the ADR neither way, and carries none of its costs (a third collision response in the
  shared sim, blocks gaining a **synced destroyed flag**, `validateTrack` treating fractured blocks as solid
  for FIT).
- **It helps task 2's gates.** The track spec requires *"clear hazard-to-floor contact shading"*, unjudgeable
  with no object making contact. This is task 2's D5 test — *what is this element teaching me?* — returning
  the opposite answer now the object is worth looking at.

**The hard constraints the brief carries** (each fails invisibly): the mesh **is** the AABB physics hull, so
silhouette detail is **inward only** — anything protruding kills on apparent empty air; **height is 8u,
always**, above double-jump reach on purpose, while width/depth are free and are the entire silhouette
budget; blocks render as an **InstancedMesh scaling a unit box**, so authored chamfers/seams **stretch** with
instance size — the brief requires an enumerated choice (triplanar/world-space material, world-derived UVs,
per-size variants, material-only detail, or accepting the stretch) with a one-line rationale.

**A trap recorded in the brief:** ADR-009's own fallback, if silhouette fails, proposes `Alert Red #FF4B3E`
on sealed — which **contradicts the frozen no-red palette**. Not the lane's to take; it escalates.

**Dependency, honest:** *"dark material family shared with track/world"* makes the block's material
downstream of the floor `art/track` is defining now. Build the independent half (silhouette, proportion,
seams) first; adopt the floor's material values when task 2's slice 2 lands.

**To launch it** (plumbing is mechanical; the brief already exists):
```
git fetch origin
herdr worktree create --workspace w24 --branch art/block --base origin/dev \
  --path ../slur-worktrees/block --json
cd ../slur-worktrees/block && pnpm install
node $CLAUDE_CONFIG_DIR/skills/lane/find-ports.mjs --out apps/client/.env \
  --var CLIENT_PORT=5202 --var VITE_SERVER_PORT=2602 --scan ../
herdr pane split --pane <root-pane-id> --direction down --ratio 0.8 --cwd <worktree>
herdr pane run <stack-pane-id> "PORT=2602 pnpm dev"     # wait for BOTH ports to serve
herdr pane run <agent-pane-id> "set -gx CLAUDE_CONFIG_DIR $CLAUDE_CONFIG_DIR"
herdr agent start block --kind claude --pane <agent-pane-id> --timeout 120000 -- --permission-mode auto
# then SendMessage (NOT herdr agent prompt) to the name ListAgents shows, pointing at the brief
```
**Copy the three edited art-pass docs into the new worktree** (`07-blocks/LANE-BRIEF.md`, `INDEX.md`, this
handover) — they are untracked in the shared checkout and can only land through a lane's PR.

**Known cold-start race:** the server boots before `@slur/shared`'s tsc-watch emits `dist` and dies with
`ERR_MODULE_NOT_FOUND`. Restart the stack once shared reports "Found 0 errors"; `herdr pane send-keys <pane>
c-c` then re-run.
