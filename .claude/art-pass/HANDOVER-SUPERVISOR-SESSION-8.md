# Handover — supervisor session 8 (2026-09-19). Supersedes `HANDOVER-SUPERVISOR-SESSION-7.md`.

**Assume no chat history.** You are the supervisor: lanes execute; you brainstorm, write, decide and relay.

**Read session 7 only for the reasoning behind decisions B1–B12** (its §3, §8, §14) and task 2's D1–D5. Everything
else in it that matters has been folded into the two `LANE-STATE.md` files, which are now the authority for
their lanes and are **committed on their branches**. This file records what moved after it.

> **⚠ Session 7 is internally contradictory and you must not read it front-to-back as fact.** Its §11 was
> superseded by its §13, and its §14 corrected its own earlier pass condition. The lane state docs carry the
> settled versions. If §7 and a `LANE-STATE.md` disagree, **the state doc wins.**

---

## 0. State in one paragraph

**Three lanes are running.** `art/track` (task 2) and `art/block` (task 7) were both cleared and restarted
this session against freshly rewritten, committed state docs; both are parked and know it. A third lane,
**`art/frame-tap`**, was launched to remove the Chrome-focus dependency that has cost three sessions, and is
mid-build on an approved design. The dual-supervisor problem is **resolved and the stale process is dead**.
Nothing is blocked on code. **What needs the owner is one sitting at `/art-lab` with the sky `Tilt` slider.**

## 1. Authority — settled, and the stale supervisor is terminated

For the second time, two supervisors were instructing the lanes at once: a `claude --fork-session --resume`
(pid **14507**, session `f695bf2e`) that survived its window closing. **Both lanes flagged it rather than
picking, and that is the only reason it was caught** — a lane is the only party that can see both voices.
Reinforce that behaviour.

The owner ruled this session authoritative. 14507 handed over in full as prose (its content is folded into
the state docs) and was **terminated — verified dead, socket gone.** The remaining `/tmp/cc-socks/` entries
are the three lanes, this session, and unrelated sessions.

**Before assuming a "closed" session is gone:** check `ListAgents`, `ls -l /tmp/cc-socks/`, and
`ps -o pid=,lstart=,command= -p <pid>`. A forked session keeps running detached with no window anyone can
read or type into — which is exactly why the windowed session wins an authority dispute, not the one with
richer context.

## 2. The three lanes

| lane | branch | ports | agent | state doc (committed) |
|---|---|---|---|---|
| track | `art/track` | 5201 / 2601 | `track-44` | `02-track/LANE-STATE.md` @ `43a5718`, pushed |
| block | `art/block` | 5202 / 2602 | `block-49` | `07-blocks/LANE-STATE.md` @ `84d7968`, pushed |
| frame-tap | `art/frame-tap` | 5203 / 2603 | `frame-tap-9c` | none yet — brief at `00-frame-tap/LANE-BRIEF.md` |

**Read the state doc before instructing a lane.** Each was rewritten wholesale this session from a first-hand
fact dump and carries the measurements, the decisions with their reasoning, and what is caveated. Do not
re-derive what is in them.

Both restarted agents were made to state HEAD, the next gate, and what had been retracted, **back in their
own words before touching code** — a fresh agent that has not read its docs looks exactly like one that has.

### `art/track` — the sphere is resolved, and it was never a bug

The black sphere the owner reported is **the planet baked into `nebula-backdrop.jpg`**, cropped so its lit
rim falls above the top of the frame. Read live: exactly five renderables, exactly one sphere (the authored
backdrop patch). The knob is **`Tilt`** (`backdrop.elevationDeg`, currently `0`), and **nobody has touched
it** — verified, `sky-config.ts` is byte-identical between `origin/dev` and the branch. **So the owner still
seeing the sphere is the expected state, not a contradiction**; this got relayed onward as "fixed" once and
it was never fixed, only diagnosed.

**The owner can falsify it themselves in ten seconds:** drag `Tilt` down at `:5201/art-lab`. If the diagnosis
holds, the dark body slides with the sky and a bright crescent comes in over it. If it stays put while the
nebula moves, the diagnosis is wrong and there is a real object to hunt.

Also retracted this session: the "near-white, clipped slab and rails" report. Bloom-off samples are slab
(60,64,70), rail (91,98,109), sky (4,6,12) — mid-dark, not clipped. **The blow-out is a bloom-budget problem,
task 3's**, and slice 2 is **not** enlarged by it. The ACES prediction remains **unmeasured** either way.

### `art/block` — built, approved, and its material has never been judged

`5c601d3` ships the sealed block: material-only silhouette (B7 — the mesh stays a literal unit box, so
"nothing protrudes outside the AABB" is true **by construction**), one corner-wrap marigold seam (B10),
box-local instancing (B9), 15 tests. Gate green, pushed.

**The owner's two gate findings are the next slice**, and both are in `07-blocks/LANE-STATE.md` §7:

1. **It reads untextured.** Confirmed from the shader itself, not just the frame: **zero texture samples and
   zero procedural detail** — no noise, no grain, no panel breakup, no roughness variation. The only spatial
   variation anywhere is the seam and the 0.18u bevel band; everything between is a mathematically uniform
   surface, so a face interior has nothing to catch light with and would read as flat mass under *any* rig.
   **This does NOT overturn B9** — zero texture *samples* was a consequence of choosing box-local space over
   triplanar, never a decision that the block should read as bare mass. Letting an engineering choice
   silently settle an art question is the failure worth naming here. The bevel already proves the mechanism
   detail needs: world-unit sizing, box-local, instance-invariant, zero samplers.
2. **It needs a glow where it meets the track.** Constraints are recorded; the honest problem is that the
   block's own material has no knowledge of whether a floor is under it, so a base band glows identically
   **over a gap** — and the generator emits gaps, so that is not hypothetical. Per-instance "is grounded"
   would need `track-view.tsx`, **which `art/track` owns**. It can be built here; it can only be *judged* in
   `/art-lab` after `art/track` merges (B2).

**The board was never read for material finish** — nothing in any artefact records a single note about
surface treatment. The re-read now underway is a genuine first read, not a recall.

Two readings in the docs are **second-hand from a cleared conversation** and must be re-taken, not cited: the
rig's reach being "generous, not marginal", and the rig being "very flat". Note a previous supervisor's
stated pass condition — *"sparse and dark is the PASS"* — was **wrong for that route** and the lane's
evidence overturned it. Do not reintroduce it.

### `art/frame-tap` — the instrument that makes the focus problem go away

**The problem, framed correctly:** every visual gate depended on a Chrome tab being frontmost, and that
dependency is not on *focus* — it is on `requestAnimationFrame`, which the browser owns and stops calling when
a page is not visible. `visibilityState` is spec behaviour; no flag or window arrangement changes it. **So we
stop being a client of that clock.**

Verified from installed source by the lane (and independently by me — check it yourself rather than
inheriting it):

- `@react-three/fiber` 9.7.0 exports `advance(timestamp, runGlobalEffects?, state?, frame?)`. In the
  unminified bundle **it checks nothing** — not `frameloop`, not `internal.active`, not `internal.frames`.
  `loop()` gates on all three; `advance()` calls `update()` unconditionally. So pumping a live
  `frameloop="always"` root whose rAF has merely stopped being called is the **supported path**, and no
  `frameloop` change is needed.
- `@react-three/postprocessing` 3.0.4's `EffectComposer` renders **inside** `useFrame` at priority 1, and
  fiber's `update()` skips its own render when `internal.priority` is non-zero — which is exactly when the
  composer is mounted. **So the composer becomes the renderer and a pumped frame is the post-processed
  frame, bloom included.** Provable from source, not observation.

**Approved design (A5 + B5):** a DEV-only `<FrameTap/>` registering a module singleton, driven over **Vite's
HMR channel** (`import.meta.hot` / `server.hot.send`), with a dev-only connect middleware that writes the
PNG to disk under `.claude/art-pass/*/refs/`. `art-refs-plugin.ts` is the precedent and the house standard for
the five-mechanisms-weighed header. Two consequences worth holding: `import.meta.hot` is undefined in a
production build, so the instrument **cannot ship, by construction**; and firing a tap becomes an ordinary
HTTP request — `curl :5203/__frame-tap -o frame.png` — so **any Chrome tab with the route open is a valid
responder, extension or not**, and the owner and supervisor can pull a frame from any desktop.

**Four conditions I attached:**

1. **Fail loudly, never ambiguously** — error on zero responders *and* on multiple, never last-write-wins.
   Three lanes share one Chrome and several tabs on one port is likely. A silently-wrong frame would poison
   every art judgement downstream; this project has already lost two sessions to a plausible frame that
   wasn't what anyone thought.
2. **Mount only on lab routes, never `/game`** — pumping *advances the simulation*, and that is a
   server-authoritative game.
3. **Warm-up burst tunable and reported.** `clock.getDelta()` is wall-clock, so the first pumped frame after a
   dead tab delivers a ~40 s delta into `simulate()` and the ship teleports down the track before the photo
   is taken. The tap reports the captured frame's delta so a caller can tell a settled frame from a warm one.
4. **The bloom-off A/B behind a flag, default off**, with the composer-disagreement pinned in a **test** —
   that is what stops a later refactor silently routing the pump around the composer.

**An idea awaiting verification, not yet fact:** because `clock.getDelta()` returns time since it was last
called and `update()` calls it every frame, the reported delta is ~16 ms if rAF is alive and ~40 s if it has
been dead for forty seconds — i.e. **the delta is a server-side measurement of rAF liveness**, needing no
browser evaluate at all. If it holds, a lane with no Chrome pairing can still gate a frame. The lane was
asked to verify rather than inherit it.

## 3. THE ONE THING BLOCKED ON THE OWNER

**One sitting at `http://localhost:5201/art-lab`**, doing two things at once:

- **Dial `Tilt`** in the sky-framing section until the planet's lit crescent enters frame, and freeze it.
  When freezing, take **both** numbers the panel reports — `starBearingDeg` follows pan only while the change
  goes through `writeSkyTuning`; a value hand-typed into `DEEP_SPACE` carries no coupling.
- **Then give the real slice-0 verdict**, which has never happened: floor, rails, bloom on **and** off, judged
  **moving** from the chase camera. Panel: slab ON, rails ON, blocks OFF, backdrop ON, env/ships/finish off.

**Gate it ONCE, with tilt dialled in the same sitting — not twice.** The owner's eye is the scarcest resource
in this arc, and the only thing between them and a verdict is a frame they can read. **Expect it to look
worse than before** — D4 removed the lab lights it was flattering itself with, and telling honest-and-ugly
apart from broken is part of the job.

## 4. Decisions I took this session

- **`SceneProbe` stays through slices 1–4** on `art/track`; deleting it is an **acceptance item on slice 4**
  and the PR body names it. It is the instrument that turned two wrong inferences into measurements, and the
  manual-render path is the standing condition, not the exception.
- **Slice 0 gates once, with tilt** (above).
- **The D3 emissive re-tune rides slice 2**, not before slice 1 — tuning emissive against the white
  placeholder slab is tuning against a surface about to be replaced. It must **not** be used to fix the
  blow-out; that is task 3's bloom budget.
- **Isotropic vs anisotropic (slice 3) stays settled by rendering.**
- **`art/block`'s design is approved and must not be re-gated.** I nearly did, from a stale picture; the lane
  stopped me with checkable evidence. That was correct of it.
- **`art/frame-tap`: A5 + B5 with four conditions** (above).
- **Deferred, supervisor-owned, needs one lane merged first:** `iso-lab-controls.tsx`'s copy *"rig off — the
  subject is lit only by itself"*, written for `/iso-sky` and **false on `/iso-block`**; pair it with B6's
  confirmed decision **not** to add a `grid?: boolean` prop.

## 5. Context clearing — the finding, and a proposal the owner has NOT yet answered

The owner asked for a way to clear lane context at a threshold. **Detection already exists and already
works** — `~/.claude-personal/hooks/context-watchdog.sh` on `UserPromptSubmit`, and it fires inside lanes
(cross-session messages trigger it). Measured across this project's transcripts:

| | peak warned | times warned |
|---|---|---|
| two sessions | **484k** | 4 and 7 |
| the forked supervisor | 265k | **19** |
| various lanes | 188k–281k | 2–10 |

**Nineteen warnings ignored in one session.** So a threshold is not what is missing — **we have one and it is
wallpaper.** It is ignored because the action it demands is expensive: four supervisor round-trips (ask for a
dump → wait → write the doc → commit → restart). Proposal, **not built, awaiting the owner**:

1. **Make clearing cheap rather than the alarm louder.** The lane maintains a raw **facts** file continuously
   — measurements, SHAs, values, one line each — and the supervisor writes the prose state doc from it. Lanes
   curate *reasoning*; they do not curate *numbers*. Splitting facts from prose removes the lossy half.
2. **Make the warning lane-aware.** Its text says *"tell the user it is safe to `/clear`"* — a lane has no
   user, so the instruction is unactionable and gets dropped. It should say: commit, refresh your facts file,
   tell your supervisor you are at a seam.
3. **Two stages, firing at a gate not a limit** — warn ~150k ("take no new work, head for a seam"), hard
   ~250k ("commit and stop"). Both lanes correctly refused to stop mid-build this session; a threshold that
   fires mid-slice is worse than one that fires late.
4. **Not auto-compaction** (it is the curation failure, automated) and **not `maxTurns`** (available on
   2.1.267, but a turn cap cuts mid-thought, which is the one place you must never cut).

## 6. Corrections to standing knowledge

- **Browser pairing is PER-SESSION, like tab groups.** `list_connected_browsers` returned `[]` in one lane
  while returning a live browser in this session at the same moment. An empty list is a fact about *your
  session*, not about the machine. Second per-session browser gotcha after tab groups.
- **`net-canvas.tsx:142` is NOT a precedent for publishing R3F internals on `window`** — it is a DEV render
  gate (`{ import.meta.env.DEV && <NetDebugHud/> }`). There is **no** such precedent in `apps/client/app`. I
  inherited this error from session 7 and passed it on in a brief; the lane caught it and it reshaped their
  recommendation.
- **`track-instancing.ts` does not exist on `art/block`** — it is `art/track`'s. `put()` is in
  `track-view.tsx:62-63`, and the claim it underwrites (no rotation is ever written, which is what kills
  triplanar) is **true**. Only the citation is wrong, and it is being repaired.
- **`computer screenshot` FORCES a canvas measure** — it resized a 300×150 canvas to 3456×1882 in a still-
  hidden, rAF-dead tab. So canvas size can never clear the hidden-tab trap, at either size.

## 7. Process notes that hold

- **Message lanes with `SendMessage`**, addressed by the `ListAgents` name. Never `herdr agent prompt` — it
  types into a pane, has silently dropped a decision packet, and gets classifier-blocked. `herdr` stays right
  for worktrees, panes, stacks and reading output.
- **Start lane agents with `-- --permission-mode auto`**, exporting `CLAUDE_CONFIG_DIR` in the pane's shell
  **first** — the profile is not inherited and a lane on the wrong profile comes up unauthenticated.
- **A restarted lane registers under a NEW `ListAgents` name** (`track-82` → `track-44`, `block-c3` →
  `block-49`). Bare `SendMessage` to the herdr name fails; the error hands you the real name and ref.
- **The supervisor writes the prose; lanes supply first-hand facts.** A lane's self-written handover restates
  its own reasoning as established fact and omits what it never noticed.
- **Relay the reasoning, not just the verdict** — a lane that knows *why* applies the principle to the next
  fork instead of coming back for it.
- **Ask for a fact dump in a fixed shape**, and expect `[unmeasured]` on anything the lane cannot source
  first-hand. `block-c3` marked two readings `[unmeasured]` and **refused to reconstruct them**; that refusal
  is worth more than the readings would have been.
- **Push lane branches.** Commits living only in a worktree are one disk failure from gone. Tell the lane you
  pushed — an unexplained push into its own branch is a reasonable alarm.

## 8. Doc routing

This file and the art-pass docs are **untracked in the shared checkout** (the pre-commit hook blocks a Claude
commit there), so they reach `dev` only through a lane PR. A copy is in the **`block` worktree** and
`block-49` has been asked to carry it on its next commit — keep **one** home so copies cannot diverge.

## 9. Next actions, in order

1. **The owner's `/art-lab` sitting** — Tilt, then the slice-0 verdict. Everything in task 2 is behind it.
2. **`block-49`'s board re-read** for material treatment/finish, then its design recommendation covering
   surface detail **and** the contact glow, weighed on the four axes. **Nothing lands before you approve it.**
3. **`frame-tap-9c`'s build**, then its acceptance demo — the first frame should be `/art-lab` on :5203 from a
   tab nobody focused, with bloom, proved by numeric disagreement against a `gl.render` read.
4. **Track slices 1→4**, each gated by the owner's eye, once slice 0 passes.
5. **The context-clearing proposal** (§5) — awaiting the owner's yes.
6. **The deferred `/iso-sky` sky gate**, after a real track is in frame. Its roughness self-test must run with
   **`Star light` OFF as well as `Env rig` off** — a star light lights the probes exactly as a neutral rig
   light does, which is the whole reason `/iso-sky` drops the lab rig.

> **The one lesson this session keeps re-earning:** every confident, well-argued conclusion built from source
> alone that got overturned, got overturned by **rendering or measuring**. Two lanes each had one. If you find
> yourself arguing about a frame, measure it.
