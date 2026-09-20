# Supervisor handover — session 19 (2026-09-20)

## What this session actually did

Built the owner a **live tuning panel**, closed the camera regression with values he dialled himself,
recorded the decision as **ADR-011**, and changed the `/lane` skill so lanes own their own dev stacks.

## The camera is fixed and ADR'd

`art/track-slice2` @ **`56d6f99`** (+ `c9efcdf`, + an ADR docs fixup the lane was committing at
handover). Values, owner-dialled on the panel and committed verbatim:

```
height 7.5 · back 15 · lookAhead 9.5 · lookAtLift 6 · fov 70
```

Framing, verified twice independently (supervisor + lane): **23.06° below axis vs 35° half-FOV =
11.94° margin at rest**, widening to **23.0°** at top speed — `backStretch 3` AND `fovStretch 15`
compound (back 18, fov 85). The shipped `a50cb3f` was **−0.20°**, i.e. the ship was off the bottom
edge. **The frame is tightest parked**, which is the safe direction.

**ADR-011 is written** (`docs/DECISIONS.md`, on the branch). It supersedes ADR-010's camera *deferral*
only — it does **not** adopt v2's 4–5u camera or its occlusion fade, and ADD §10 OQ8 stays open. It
records as an accepted cost that the eye at 7.5u sits **below the 8u pillar height**, which is the
precise thing ADR-006's +9u existed to prevent.

**Owner ruling this session: proceed on 7.5 anyway; the occlusion problem is deferred, not solved.**
The fly-with-pillars-and-`fly`-ON gate is still **unpaid** and the ADR says so — do not let anyone
claim it.

### Occlusion — the deferred design, with the option set already narrowed

Owner floated two fixes. **Semi-transparent fade is the right family** (it is v2 §8's own proposal, so
adopting rather than inventing); cost is that transparency does not write depth, so it sorts by
distance and interacts badly with the single global `<Bloom>` over HDR emissives — a rendering
feature, not a material tweak. **Removing the object from the scene is rejected**: the pillars are
lethal and collision is continuous float-AABB in the shared `simulate()`, so culling the mesh builds
an invisible wall the player dies to. Fading preserves the silhouette; hiding deletes exactly the
information the vantage existed to supply.

**Third option not yet ruled out, and cheaper than either** — do not touch geometry at all. Occlusion
only hurts *line-planning ahead*; `lookAhead`/`lookAtLift`/`fov` and a distinct emissive crown that
lets a pillar be read by its top may buy it back as a material change. Rule this out before paying
for transparency sorting. All options are cosmetic and client-only — no sim or determinism impact.
**Not filed as an issue yet**: design-shaped, wants a brainstorm first.

## The panel — shipped, and half of it is broken

`4305a4d` shipped `<DebugPanel>` (DEV-only via `import.meta.env.DEV`, verified absent from a real
production build) in **both** `/art-lab` and `/game/:roomId`. Exposes bloom
`intensity`/`threshold`/`smoothing`/`radius`/`levels`, floor `envMapIntensity`, ambient, and the five
camera constants with a live in-frame/off-edge readout. "copy values" dumps literal source lines
labelled per target file — that is how the camera values reached the commit unmangled.

**Owner reports every non-camera knob does nothing.** That is the lane's current unit.
**Hypothesis handed down, not yet confirmed:** the one knob that works is the only one that never
touches React — `updateChaseCamera` reads the `CHASE` singleton every frame. The four dead knobs all
ride the `useSyncExternalStore` path. One broken path beats four coincidental bugs. The lane has the
Chrome tab and must prove the fix by observation, not by reading code.

**Nothing in the bloom/deck/ambient sweep has been measured yet.** `levels 4` / `radius 0.6` from
`57589dc` is still never captured or judged.

## The finding that outranks everything else here

**`/game` mounts no authored lighting rig at all.** Its complete light list is one
`<ambientLight intensity={1}>`. Everything `<Environment>` mounts — `<color>` background, linear
`<fog>`, `<GradientDome>`, drei `<Stars>`, `<TubeWalls>` — is unlit or emissive-driven; **none of it
is a light**. `DeepSpaceSky`/`SkyEnvironment`/`StarLight` are imported only by `deep-space-sky.tsx`
and `iso-sky/tunable-sky.tsx`, and `TunableSky` mounts only in `/iso-sky` and `/art-lab`.

This **rewrites session 18's record**, which had it as "the lab lacks the game's fill" — backwards.
The game's ambient 1 is a stand-in for a rig it never received.

**Owner ruling: do NOT mount the rig in `/game` on this branch** — it visibly changes the shipped game,
which makes it **03-lighting's** subject. `SKY_TUNING` is seeded from the frozen `DEEP_SPACE` via
`committed()`, so **when 03-lighting takes it, the work is mounting, not tuning**.

**Standing caveat on every sweep result until then:** values dialled in `/art-lab` are judged against
the full authored rig while `/game` runs ambient-only. **`envMapIntensity` is the acute case** — it
scales the cubemap `/game` does not mount, so its lab reading may be meaningless for the game.

## `/lane` skill changed — agent owns its stack

Owner decision. The split stack pane is **gone**; the agent starts and owns its own stack.
`~/.claude-personal/skills/lane/SKILL.md`, five edits:

- Step 6 no longer splits a pane or runs the stack; agent starts in the root pane.
- New section **"The agent owns its stack"** — backgrounded to `<worktree>/.claude/lane/dev.log`, a
  `.claude/lane/.gitignore` of `*` so the log self-ignores, `curl` for 2xx before judging anything,
  check for an already-running stack first, and a stack that will not start is the agent's first
  report, not plumbing the supervisor fixes.
- The supervisor duty *"read the stack pane, for dev-server errors the agent cannot see"* is deleted —
  that line was an admission the old design blinded the agent to its own server.
- **Lifetime consequence, written down:** the stack is a child of the lane's `claude` process, so
  killing the agent kills the stack, and a fresh agent in an existing lane must start one. Clearing
  context does not.

## Two mechanics that cost real time this session

1. **Write a lane's docs into the LANE'S WORKTREE, not the shared checkout.** `LANE-STATE.md` went to
   `/Users/apple/Projects/personal/slur`; the lane reads
   `/Users/apple/Projects/personal/slur-worktrees/track-slice2` and had an hours-old copy. It blocked
   mid-unit on four camera numbers that were "on disk" only in a tree it cannot see. **Silent failure**
   — both paths exist, both look right, a `grep` in the wrong one just returns nothing.
2. **A lane has TWO names.** `herdr` knows it as **`track`**; `ListAgents`/`SendMessage` as
   **`track-slice2-d8`**. `herdr agent send-keys track-slice2-d8 …` fails `agent_not_found`, which
   reads exactly like a dead lane. `herdr agent list` is the lookup for the herdr name.

Both are in memory.

## Lane behaviour worth preserving

The lane refused to invent the four missing camera numbers; recomputed the supervisor's framing
arithmetic and **caught a real error** (`fovStretch 15` was missed, so the at-speed margin is 23.0° not
15.5°); reported the ADR error instead of editing the ADR; and rewrote the `CHASE` comment block that
asserted `MUST stay > BLOCK_HEIGHT (8)` while the value had become 7.5. Keep briefing for that.

## Still owed

- **Unit 2 — the dead panel knobs.** In flight. Nothing can be swept until it lands.
- **Fly 7.5u through 8u pillar fields with `fly` ON.** Unpaid gate.
- **The whole bloom/deck/ambient sweep.** Unstarted by design — one hand on the knobs.
- **PR for `art/track-slice2`.** Not opened. Must flag the camera-below-pillar-height change in the body.
- **Frame-tap is dead** on 5201, twice-confirmed in session 18 and unowned since. Forces
  one-tab-at-a-time Chrome screenshots, which is what serialises every visual gate.
- `docs/codex-reconcile` @ `84291fb` — committed, unpushed, no PR, since session 17.
