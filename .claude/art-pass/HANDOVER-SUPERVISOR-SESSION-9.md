# Handover — supervisor session 9 (2026-09-19). Supersedes `HANDOVER-SUPERVISOR-SESSION-8.md`.

**Assume no chat history.** You are the supervisor: lanes execute; you brainstorm, write, decide and relay.

**Read session 8 only for the reasoning behind decisions it records.** Everything live has been folded into
the three `LANE-STATE.md` files, which are **committed on their branches** and are the authority for their
lanes. If a handover and a state doc disagree, **the state doc wins.**

---

## 0. State in one paragraph

**Three lanes, all with committed state docs, two of them cleared and re-primed this session by new
tooling.** The black-sphere mystery that had cost four rounds is **solved and understood** — it was the
camera far plane, not an object. `art/frame-tap` is **pushed**; `art/block` has three commits whose push was
classifier-blocked and is being retried; `art/track` is mid-fix on the sky radius. Two issues filed (#127,
#128). **What still needs the owner is one sitting at `/art-lab` for the slice-0 verdict, with tilt, once
the sky fix lands.**

## 1. THE BLACK SPHERE — SOLVED. Read this; it is the session's main lesson.

**It was never an object. It was a hole punched by the camera's far plane.**

The sky patch sits at `radius 1200`; R3F's camera far is **1000**. The patch is camera-locked, so every
point on it is equidistant and the clip condition is `radius·cos(a) > far` — a **circular hole of half-angle
`acos(1000/1200) = 33.6°` centred on the camera axis.**

**That is why the owner's falsification test came out as it did.** The hole is defined by the *camera axis*,
so it is completely independent of the sky's pan/tilt/fov. Dragging `tilt` slides the nebula behind a hole
that does not move a pixel. *"The body stays put while the sky moves"* was the **signature of this bug**,
not evidence of a rogue object.

**Root cause is a confidently-wrong comment.** `sky-config.ts` picks 1200 as *"well inside three's default
far plane of 2000"* — true about three (`three@0.185.1`, `src/cameras/PerspectiveCamera.js:33`) and **false
about this app**: R3F builds its own camera, `new THREE.PerspectiveCamera(75, 0, 0.1, 1000)`
(`@react-three/fiber@9.7.0`, `dist/events-156d8d12.esm.js:15771`), and `camera={{fov, position}}` overrides
only the fields it names.

**DECIDED (mine):** lower `DEEP_SPACE.radius` below `far`, fix both comments, and **add a test** asserting it
against R3F's real default with the source citation. Not merely minimal — *more correct*: a radius strictly
under `far` is unclippable at every angle **by construction**, rather than being far enough away to get
lucky. Raising `far` to 4000 buys the same result while spending depth precision against a `near` of 0.1,
and would drag the change into the game canvas. As one shared constant, lowering the radius **fixes the game
for free**. `track-44` is building it.

**Blast radius, filed as #128:** `iso-lab-canvas.tsx` is the **only** Canvas in the client that sets `far`
— which is exactly why the isolation lab never showed this. `net-canvas.tsx` (the game), `/art-lab`,
`/art-gallery`, `/env-lab` and the landing scene all inherit 1000. **The shipped game has had this hole in
its sky.** Pre-existing on `dev`; the art pass only made it visible by deleting the lab lights.

**SHIPPED: `e339381`** *"fix(sky): bring the backdrop inside R3F's far plane, not three's"* — pushed,
`art/track` level with origin, tree clean, full gate green (client 35 tests, net +1). `radius` 1200 → **800**;
both comments rewritten; `R3F_DEFAULT_FAR = 1000` is now a named constant in `sky-config.test.ts` carrying
the source citation.

> **⚠ ONE HONEST GAP, and it is the owner's first two seconds at the gate.** The lane proved the
> **mechanism** live by toggling `far` 1000 → 5000 and back, but **has not seen `radius 800` render.** The
> committed change is the same physics from the other side of the inequality and the test pins it, but the
> frame is `[unverified visually]`. The hole is either gone or it is not; nothing subtle sits between.

> **⚠ THE EXISTING TEST WAS PART OF THE BUG.** There was already a test named *"keeps the backdrop inside
> three's default far plane"* asserting `DEEP_SPACE.radius < 2000`. **It encoded the same wrong premise,
> passed, and the bug shipped underneath it** — it would have gone on certifying any radius up to 1999. The
> same premise sat in its own `chaseCamera()` helper (`far 2000`), and `project()` multiplied by 1000,
> putting its sample point exactly **on** the far plane. The lane **replaced** it rather than adding beside
> it, which is correct: a test built on a false premise is not a weaker guard, it is an active source of
> false confidence. **When a bug ships under a green test, fix the test's premise, never just add another.**

> **⚠ I WAS WRONG ABOUT THE STARS, and the lane was right to measure rather than inherit it.** I reasoned
> the star shell ran *inward* from `radius` (400 → 280). **drei spans it OUTWARD**: `let r = radius + depth`
> then decrements (drei 10.7.8, `core/Stars.js:65`), so the field runs **400 → 520**. The decision stands
> unchanged — 520 is still comfortably inside 800 — but the margin is 520-vs-800, not 400-vs-800. Now pinned
> as its own test: `stars.radius + stars.depth < radius`. **Supervisor arithmetic offered to a lane is a
> hypothesis, not a fact; say so, and the lane will check it.**

### The two lessons, and they are worth more than the fix

1. **Four rounds of confident source-reading lost to one controlled experiment.** The lane eliminated the
   texture (radial profile shows no luminance step at the limb), the alphaMap (plain feather, 255 at centre)
   and occlusion (`depthTest=false` changes nothing) **before** naming a cause, then proved it by toggling
   `far` 1000 → 5000 and back — four interior points returning to their correct texture values while a
   control point outside the hole did not move. **Every confident conclusion in this arc that got overturned
   was overturned by rendering or measuring.** This is the fourth instance.
2. **A true, carefully-measured fact that cannot reach the question is more dangerous than a wrong one**,
   because it feels like progress. The lane's earlier *"exactly five renderables, exactly one sphere"* was
   **correct and reproducible and was never the answer** — enumerating objects can never find a hole. Before
   trusting a measurement, ask what question it could possibly answer.

## 2. NEW TOOLING — lane context clearing, built and proven this session

The owner asked for lane clearing to stop depending on them watching the lanes. **Built, tested, and it ran
end-to-end twice on its first day.**

- **`~/.claude-personal/hooks/context-watchdog.sh`** (rewritten; `.bak` kept). Detects a lane by asking git
  whether it is in a **linked worktree** (`--git-dir` differs from `--git-common-dir` only there —
  project-agnostic, no hardcoded paths). In a lane it emits an instruction a lane can *execute*: take no new
  work, commit, push, **message your supervisor with a fact dump**, and **never `/clear` yourself**. Two
  stages: **150k warn, 250k hard**. Outside a lane the old text is unchanged. All four branches tested.
  *The old text said "tell the user it is safe to /clear" — a lane has no user, which is why it was ignored
  19 times in one session.*
- **`~/.claude-personal/bin/lane-clear.sh <agent-name> <reprime-file> [--force]`**. Reads `herdr agent list`
  for pane and status, **refuses to clear a lane that is not at a seam**, sends `/clear`, then feeds a
  re-prime prompt.
  - **It drives the PANE, not the agent API** — `herdr pane send-text` + `herdr pane send-keys <pane> enter`,
    verified end-to-end on a scratch pane. `herdr agent prompt` pastes **without submitting**.
  - **`done` is idle-equivalent and MUST be accepted** — herdr reports `done` for an agent sitting at its
    prompt after finishing a turn, which is exactly the seam we want. Accepting only `idle` refused the
    first real handover; fixed.
- **The re-prime prompt must ask the lane to state, in its own words and before touching code:** HEAD and
  push status, the next slice and why *that* one, what was retracted and why the wrong claim happened, and
  the trap specific to its lane. **A fresh agent that has not read its docs looks exactly like one that
  has.** `frame-tap` immediately caught that HEAD no longer matched its state doc (committing the doc moved
  HEAD past the SHA inside it) — that catch is the protocol working.
- **Known wart:** a state doc cannot name its own commit. Say so in the doc rather than trying.

**Measured:** both lanes came back at **~9% context** from 28% and 20%+. The trigger stays **supervisor
judgement, not a fixed number** — a threshold firing mid-slice cuts the reasoning that was about to be
written down, which is the one thing a state doc cannot recover.

## 3. The three lanes

| lane | branch | ports | state doc | pushed |
|---|---|---|---|---|
| track | `art/track` | 5201 / 2601 | `02-track/LANE-STATE.md` | yes, @ **`e339381`** |
| block | `art/block` | 5202 / 2602 | `07-blocks/LANE-STATE.md` §10 | **NO — 3 commits local** |
| frame-tap | `art/frame-tap` | 5203 / 2603 | `00-frame-tap/LANE-STATE.md` | **yes**, @ `ba7319d` |

**All three serve `/art-lab`.** Only `:5201` means anything for the sky — this caused a real "are we looking
at the same thing" confusion with the owner. Always state the port.

### `art/block` — the surface slice landed, unseen

`e7ca605`, gate green, 57 client tests (was 49). Splits + fbm + narrowed seam + crease/gamma for the
interior corner. **Decisions B13–B20 and the as-built record are in `07-blocks/LANE-STATE.md` §10** —
including the auditable B18 seam derivation (measured against **height**, the only fixed board dimension),
the exact even-count phase fix, and the real per-fragment cost (**~72 hashes**, not "a few ALU" — I was
loose about this and the lane corrected me).

**`FRAME_SIZE` (B20) is reasoned from camera constants and never measured** — the lane flagged it as the
single most likely thing to be wrong, and confirming the crop is its next task because it gates every other
judgement. **B14 (the contact glow) is approved but NOT built.**

### `art/frame-tap` — works, with one open defect

Pulled a 3456×1926 bloomed PNG of the live track from a tab nobody focused. The A/B is evidence rather than
a number because **alpha matches at ∞ while colour does not** (signature of a post pass) and **red diverges
most** (what a marigold bloom predicts). Open: handler is entered but nothing happens; **StrictMode
double-registration is the untested lead**. **DECIDED: dedupe first, move the listener out of the R3F tree
second** — the move changes registration lifetime as a side effect, so doing it first fixes the bug without
anyone learning which change did it.

**⚠ Its retraction is a trap with teeth:** *"a tab loaded while hidden never mounts R3F at all"* was wrong
and was written down as measured. **Vite prunes a replaced module's custom HMR listeners and Fast Refresh
does not re-run an effect inside R3F's reconciler**, so a probe added by editing the file looks like it
never ran. Full reload required. Every success followed a reload; every failure an HMR-only update.

## 4. Issues filed

- **#127** — `check-canvas-isolation.mjs`'s `strip()` removes string literals **before** comments, so a
  possessive apostrophe in prose opens a fake string; on an **odd** apostrophe count it eats the file's own
  `<Canvas`. `/art-lab` and every `/iso-*` route are outside the #102 guard. **The failure is silent and
  inverted** — such a file is reported *clean*. Acceptance requires a self-test that every file containing
  `<Canvas` raw still contains it after `strip()`.
- **#128** — the far-plane trap (§1).

## 5. Process facts confirmed or learned this session

- **The Chrome focus escape works.** `open -a "Google Chrome"` is **not** enough (a background tab in a
  foreground window is still hidden). Selecting that tab as the **active tab of a frontmost window via
  `osascript`**, matching on your own port, works — verified independently by two lanes (counter 8 →
  1263/1408 and climbing). Two tool calls. The frame tap is the better answer where available.
- **Never route a blocked action through another session.** Two lanes had push blocked; `frame-tap` assumed
  it was blocked, never tried, and the push then went through with no prompt. **Tell a lane to attempt and
  report the exact wording**, rather than accepting "blocked" as a state.
- **DIAGNOSIS belongs to the lane, even when the owner asks you directly.** I read a lane's source to form a
  hypothesis and was correctly called on it. Routing it costs one message; doing it burns the supervisor
  context the whole arc depends on, and hands the lane a conclusion instead of a question. **Cross-lane
  state — ports, branches, who holds Chrome — IS mine** and no lane can supply it.
- **Comments are a load-bearing artefact and can be confidently wrong.** #128 exists because of one.

## 6. Next actions, in order

1. **The owner gates slice 0 once, with tilt**, at `:5201/art-lab` — and confirms the hole is gone, which
   nobody has yet seen. The fix is shipped (`e339381`); everything in task 2 is behind this sitting.
   Then **slice 1 = the floor swap (D1)**: `TrackFloor` becomes the floor, delete `TrackView`'s instanced
   floor quads out of `TrackRibbon`, retire `showFloor` and the `slab` toggle — and **compare against the
   instanced floor BEFORE deleting it.**
2. **`block`'s push** — retry sent; if genuinely denied, it is the **owner's** to clear.
3. **`block` confirms the crop** (gates all its other tuning), then splits → `DETAIL_ALBEDO` →
   `DETAIL_NORMAL` **last and only on a grazing face**.
4. **`frame-tap`: the StrictMode dedupe**, tested in isolation.
5. **PRs** — `art/frame-tap` is pushed with none open.
6. **Wire `lane-clear` into the `/lane` skill** so new lanes get the protocol automatically. Offered, not
   done.
