# Handover — supervisor session 9 (2026-09-19). Supersedes `HANDOVER-SUPERVISOR-SESSION-8.md`.

**Assume no chat history.** You are the supervisor: lanes execute; you brainstorm, write, decide and relay.

Read session 8 for the reasoning behind the three lanes' existence. Everything that moved since is here.
Where this and session 8 disagree, **this wins**.

---

## 0. State in one paragraph

**All three lanes are parked, clean and pushed. Nothing is in flight.** `art/track` is landing the owner's
final sky framing plus the coverage-assertion replacement, then clears. `art/block` is **parked** (not
cleared-and-restarted) pending a question about whether its own work is actually blocked. `art/frame-tap`
was **cleared at its seam** and its successor has a one-call measurement waiting. **A CHROME FREEZE IS IN
FORCE** — see §4, it is the most operationally important thing in this file. The one thing blocked on the
owner is still the **slice-0 verdict**, which has now slipped past three sessions.

## 1. What the owner decided this session

| | |
|---|---|
| Sky **tilt** | **−2**, frozen. It is `backdrop.elevationDeg` — SKY framing, not camera |
| Sky **fov** | **~120**, revised UP from their first answer of 70 after being shown the measurements |
| Chrome focus | Unprompted complaint: Chrome stealing focus 3× inside one sentence. **Caused by us** |
| Block finish | Looked unprompted, confirmed the target is **dark stone / worn concrete**, said it "doesn't give the feeling" |
| `lane-clear` | Asked for it to be wired into the `/lane` skill. **Done** — see §6 |

**The fov story is worth keeping, because it is the model for how these calls should go.** The owner first
froze **70** — which was the slider's *floor*, so they had hit the wall rather than found a value. 70 is half
the measured coverage need, so `art/track` measured what it actually costs: black margin **15% of frame
width each side parked, ~21% at top speed, up to 33% on one edge under hard strafe**, and — killing the main
argument for 70 — **the stars do NOT fill that void** (0.008% of pixels lit over a 237,160-px block). Shown
that, the owner revised to ~120 themselves. **Pushing back with measurements, not opinions, is what moved
it.**

**At fov 120** (supervisor arithmetic from the lane's measured half-angles — *the lane must verify, it is
not measured*): patch half-width 60° vs frame half-width 46.0° parked and 54.0° at top speed → **fully
covered in both**; worst case is top speed + 13.39° strafe yaw needing 67.39°, leaving **~7% of frame width
black on ONE edge only.**

## 2. ⚠ 120 STILL FAILS THE ASSERTION — Option C still has to land

`sky-config.test.ts:99` asserts `fovDeg > 134.297`. **This is false at 120 as well as at 70.** The fix is
**Option C**, scoped by `track-44` and approved:

1. The opacity floor, `fovDeg/aspect > 2*edgeFadeDeg` — always true, cheap, and what the slider floor **43**
   encodes (derived: `makeEdgeFade`'s `du=min(v,1-v)` peaks at 0.5, so `fovV <= 2*edgeFade` can never reach
   alpha 1 anywhere; `2*12*1.7768 = 42.64 → 43`. It moves if `edgeFadeDeg` moves).
2. A **renamed** margin assertion that no longer claims "fills the frame", pinning the worst-case black
   margin against a named **`ACCEPTED_EDGE_MARGIN`** carrying the owner's decision — filled with the
   measured ~7% at fov 120.

**Rejected and must stay rejected:** loosening the assertion to fit the value (it would certify anything),
and deleting it (it caught a 120° patch shipping once).

**The 138.5° figure in `sky-config.ts`'s header is WRONG** — it mixes rest-pose yaw (15.5°, look distance
18) with top-speed frame width (108°), two different speeds in one number. The test is self-consistent at
s=1: 2*(53.76+13.39) = **134.30**. *The supervisor relayed 138.5 to the lane as authoritative and the lane
caught it.* Prose fixed in three places; `sky-tuning-panel.tsx` is the only one committed so far.

## 3. THE BLACK SPHERE IS CLOSED — the owner falsified it themselves

The owner asked whether "tilt" was camera or sky, because dragging it *moved the background and left the
track still.* **That is the sphere test passing.** It is the planet baked into `nebula-backdrop.jpg`,
cropped so its lit rim sits above frame; the test was "does the dark body slide with the sky", and it did.
**There is no rogue object. Do not re-open this.** (`/art-lab` exposes no camera controls at all — the only
`pan`/`tilt`/`fov` sliders there write `backdrop.*`.)

## 4. ⚠⚠ THE CHROME FREEZE — read before instructing any lane

**Standing order to every lane: take no frames, run no `osascript`, raise no tab. Ask the supervisor first
and say why.**

The owner was pulled out of their typing three times inside one sentence. Accounted for: `block-49` took
**nine frames across six reloads**; `track-44` took **three `computer screenshot` calls**, two on the same
parked frame, one of which returned byte-identical and bought nothing.

**The multiplier nobody had measured, and it is the whole story:**

- **A `navigate` or `location.reload()` returns the tab to `hidden`** — so the foreground must be re-run
  after **EVERY** reload.
- **A module-scope material/probe SURVIVES HMR** — so a shader edit needs a **full reload**, not an HMR
  update.

Those compound: every shader probe costs a reload, and every reload costs a focus steal. **This is why
`art/frame-tap` matters far more than it looks** — every lane has been paying a hidden per-probe tax on the
owner's attention.

**The one free mitigation, found by `track-44`, now propagated:** panel/toggle/config state is **DOM**, so
`javascript_tool` reads it at **zero focus cost**. Only *pixels* need the window.

**Lift the freeze only when `art/frame-tap` lands**, or for a single scheduled frame you explicitly grant.

## 5. The three lanes

| lane | branch | ports | status | herdr name / pane |
|---|---|---|---|---|
| track | `art/track` | 5201 / 2601 | **ALIVE**, landing fov 120 + Option C, then clear | `track` / `w2C:p1` |
| block | `art/block` | 5202 / 2602 | **PARKED** — agent killed, not restarted | `block` / `w2D:p1` |
| frame-tap | `art/frame-tap` | 5203 / 2603 | **CLEARED** — agent killed, needs restart | `frame-tap` / `w2E:p1` |

### `art/track`
`b00c91f` pushed. **`sky-config.ts` is deliberately DIRTY** (tilt/fov + rewritten prose) — it must stay in
the tree or the owner's sitting cannot happen. The assertion is untouched and failing **on purpose**. Far-
plane fix **visually confirmed** (hole gone, sky continuous, planet limb legible). Next after the clear:
**slice 1 (floor swap, D1), gated by the slice-0 verdict.**

### `art/block` — PARKED, and the park is under challenge
Everything is in **`07-blocks/SESSION-9-ADDENDUM.md`**, committed at `8c5d460`. Headline: the block renders
**~85–90% non-diffuse**, so every albedo-only feature is diluted below JPEG noise. Proved by zeroing
`diffuseColor.rgb` entirely and measuring a 10–15% face change. **Two retractions** in there. Option A
(`uDetailRough`, variation only) approved; then found possibly gated on task 2; **§13 of that file challenges
the gate and must be resolved by reading before anyone inherits it as settled.**

### `art/frame-tap` — cleared, with a one-call test waiting
`96f5d94` pushed, gate green, `LANE-FACTS.md` current. The successor's **first action** is
`document.querySelectorAll('canvas').length` on `:5203/art-lab` — **two canvases proves two R3F roots and
settles the open hang outright**; one canvas rules *nothing* out (a root teardown can drop the DOM node
while a module-scope listener survives). A measurement scaffold is committed and **marked REMOVE BEFORE
PR**. Restart it with:
```
herdr agent start frame-tap --kind claude --pane w2E:p1 --timeout 120000 -- --permission-mode auto
```
**But it needs Chrome**, so it is behind the freeze and behind the owner's sitting.

## 6. `lane-clear` is wired into the `/lane` skill — and it was exercised twice, unprompted

`~/.claude-personal/skills/lane/SKILL.md` now carries **"Clearing a lane — `/lane clear <name>`"**: a
`LANE-FACTS.md` obligation (raw facts, one line each, committed *as the lane works*, never written at
handover time), an 8-step procedure, and what `LANE-STATE.md` carries. Frontmatter triggers updated.

**The finding behind it:** detection was never missing — `context-watchdog.sh` is already lane-aware and
two-stage (150k/250k). It was ignored **19 times in one session** because *acting* cost four supervisor
round-trips. **The fix is to make clearing cheap, not the alarm louder.**

**It worked the same day.** `frame-tap-9c` hit 151k, **declined a Chrome slot I had just freed** rather than
bank measurements into a context about to be thrown away, and spent the turn making the measurement cheap
for its successor instead. `block-49` and `track-44` both hit seams and stopped clean.

## 7. Process notes that earned their place this session

- **Lanes reply with `SendMessage`, never plain text.** `block-49` answered a direct question in its own
  pane; it never reached the supervisor and it looked idle for 43 minutes while the owner asked twice.
- **An unsubmitted line can sit in a lane's input box for an hour.** `block-49` had `go ahead with option B`
  typed into its pane, never submitted. **Third** time typing-into-panes has eaten a decision packet.
- **A declared fallback that does not fire is worse than no fallback** — it reads as "handled" while nothing
  moves. `block-49` wrote `IF NO ANSWER: I proceed with B`, then ended the turn without doing it.
- **Re-test inherited blockers.** Two died this session: *"the push is blocked by the lane's classifier"*
  (rode three handovers, never true) and the StrictMode premise on `art/frame-tap`.
- **Check before executing a supervisor instruction.** `frame-tap-9c` was told to write two corrections into
  the docs, found them already there verbatim, and declined to create a second copy that would drift — then
  recorded *that it checked*.
- **Contradictory supervisor constraints are the supervisor's error to fix, not the lane's to resolve
  quietly.** `frame-tap-9c` raised one rather than picking.
- **Scope a falsification when you record it.** "StrictMode double-registration is FALSE" was proved only
  for *one instance, effect twice* — not for *two instances, once each*. Recorded under a heading reading
  **READ THE SCOPE BEFORE CITING THIS**.
- **Delete the term entirely rather than tuning it down.** `block-49` zeroed albedo 100% and got an
  unarguable answer in one reading.
- **Gate ONCE.** The owner's eye is the scarcest resource here; the 33%-margin look and the slice-0 verdict
  were deliberately combined into one sitting.

## 8. Next actions, in order

1. **`track-44`: land fov 120 + Option C, FULL gate, push** — then clear it (it is at ~168k).
2. **THE OWNER'S SITTING** — still the gate for everything on task 2. The verbatim block is in §9.
3. **Resolve `art/block` §13** — does `art/track` own the BLOCK's roughness, or only the track surfaces'?
   By reading. If unblocked, Option A goes to the front: **the owner has personally asked for that surface
   to read.**
4. **Restart `art/frame-tap`**, once the freeze allows a frame. One call may close it.
5. **The deferred `/iso-sky` sky gate**, after a real track is in frame — its roughness self-test must run
   with **`Star light` OFF as well as `Env rig` off**.

## 9. The owner's sitting — hand this verbatim

> Open `http://localhost:5201/art-lab` yourself, in a window you already have in front — nothing will open
> or raise it for you.
>
> It should come up as: bloom ON, slab ON, rails ON, backdrop ON; blocks, env, ships, finish all OFF; pan 0,
> tilt −2, fov 120. That is the default state, so you should not have to set anything. If it isn't, say so
> and stop — something drifted.
>
> Two things, one sitting.
>
> 1. **The black margin.** Hit `running`, then `fly`. Hold W until the speed readout stops climbing (~8s),
>    then hold A for a full three seconds and let go, then D for three seconds. Watch the LEFT and RIGHT
>    edges of the picture, not the middle. At fov 120 the nebula should reach the frame edge everywhere
>    except while you are hard over, where a sliver of black (~7% of the width) opens on one side. The
>    question is only whether that reads as space, or as the sky having run out. Bloom stays on.
> 2. **Slice 0, the honest frame.** Same flight, now look at the floor and the rails, bloom ON and again
>    with bloom OFF, and keep moving — parked tells you almost nothing. Expect it to look worse than you
>    remember: the lab used to mount its own ambient and directional light that the game does not have, and
>    those are gone, so shadow sides now go properly black. Honest-and-ugly and broken look similar for
>    about two seconds; you're judging which one this is.

> **The lesson session 8 recorded still holds, and earned it again twice today:** every confident,
> well-argued conclusion built from source alone that got overturned, got overturned by **rendering or
> measuring**. If you find yourself arguing about a frame, measure it.
