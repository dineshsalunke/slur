# `art/block` — SESSION 9 ADDENDUM to `LANE-STATE.md`

**Read `LANE-STATE.md` first. Where this file and it disagree, THIS FILE WINS** — it is later and it
overturns two things the older doc states as findings. Written by the supervisor from `block-49`'s
first-hand dumps, 2026-09-19, at the lane's third context clear (seam at ~193k).

---

## 1. THE SINGLE CAUSE — found, measured, and it is not what anyone predicted

The owner's *"it reads UNTEXTURED"* finding, the missing vertical splits, the missing filament
scratches and the missing speckle are **one cause, upstream of all of them**: the block's rendered
brightness is **~85–90% NON-DIFFUSE**. Every albedo-only feature is diluted into invisibility.

**The decisive test** — the shape of experiment to repeat whenever a term is suspected dead: the lane
set `diffuseColor.rgb = vec3(0.0)`, removing **100%** of the albedo, and the blocks rendered
**essentially identically** to the beauty frame. Same pixel row (y=420), left block's lit face, read
with `ffmpeg` + `od`, not eyeballed:

| | face range |
|---|---|
| beauty frame | **48–65** |
| albedo ZEROED | **45–57** |

Removing *all* the diffuse albedo moved the face ~10–15%. The remainder is the environment/specular
term from `<DeepSpaceSky>`'s Lightformer bake.

**Consequence:** `SPLIT_DARKEN 0.55` moves a pixel by ~5% — about **3 sRGB levels, inside JPEG noise**.
Same for `CREASE_DARKEN 0.6` and the whole `DETAIL_ALBEDO` field.

**Nothing is broken. Everything is diluted.** `split` dumped as a hard step draws clean white bands —
3 on block 1's lit face, 2 each on blocks 2 and 3, correctly spaced. The term is computed at full
strength and reaches `diffuseColor`. The failure is entirely downstream of it.

> This also explains, from the same root, `LANE-STATE.md` §8's finding that the lab rig is a null
> control and that *"no neutral rig can lift this albedo"*. Same fact, seen from the other side.

## 2. ⚠ TWO RETRACTIONS — do not cite the originals

1. **RETRACTED: "`DETAIL_ALBEDO 0.35` is producing visible variation."** The soft blotches reported as
   visible fbm **survive with albedo at zero**, so they are the environment reflection's own gradient.
   **The face has NEVER shown any authored surface detail at all.** The lane reported this as a
   positive finding in the morning and killed it on its own evidence the same day.
2. **RETRACTED: "the fbm fade gate is the cause."** `splitVisible` measured 0.06–0.09 on the far block;
   bucketed, <0.1 on block 1 and 0.5–0.9 on block 3 — a diagonal gradient with distance, so the gate
   **is** distance-dependent and **is** partly closing. Fixing it changes nothing visible.

## 3. `uDetailRough` DOES NOT EXIST — B13(d) names a lever that was never built

B13 condition (d) says *"`uDetailRough` lands at 0"*. There is **no `uDetailRough` uniform, no roughness
map, and no per-fragment roughness modulation anywhere in the file** — `roughness: 0.55` is a flat
material constant. The condition was unsatisfiable as written. This is a finding, not a gap in the
lane's work.

Since roughness modulates the term that **actually paints the face**, it is the one lever that makes
finish visible **without** touching the PROVISIONAL base colour that belongs to `art/track`.

## 4. DECISION — Option A approved, SCOPED TO VARIATION ONLY (supervisor, session 9)

Implement `uDetailRough`: modulate roughness per fragment from the fbm **already evaluated**. No new
samplers, no new material path, one more use of the existing box-local world-unit `detail` field.

**The scope is the whole decision. Four conditions:**

1. **Perturb RELATIVELY, never absolutely** — modulate *around* whatever base `art/track` lands
   (multiplicative or ±delta). Never write an absolute roughness. **Reasoning:** what B13(d) protects
   against is *two dark-metal languages forking*, and that risk lives in the base **value**, not in
   whether the surface has **variation**. A relative perturbation follows the base wherever task 2 puts
   it; an absolute one silently forks the moment task 2 moves.
2. **Read the base from the single constant `art/track` will own.** Do not copy its current number into
   this file — a duplicated constant is a fork with a delay fuse.
3. **Do not touch `BLOCK_BASE_COLOR`.** Option B (raise it off near-black) stays **rejected**: it is
   PROVISIONAL and it is task 2's.
4. **KEEP the albedo-only terms. Do not delete them, do not tune them.** They are correct and they
   become visible the moment task 2 lands a base colour. Deleting correct code because it is currently
   invisible is the expensive mistake available here.

Option C (defer everything to `/art-lab` after `art/track` merges) rejected: it leaves the owner's
UNTEXTURED finding unanswered for that whole wait, sitting on a known-inert set of constants.

## 5. A REAL LATENT BUG — take it, as its OWN commit

The fade gate has a unit mismatch: `smoothstep(worldPerPixel*1.5, worldPerPixel*4.0, uSplitHalfWidth)`
compares a **HALF**-width against a **FULL**-pixel footprint, so it demands a line be ~8 device px
before it passes and starts fading one still covering 5. **`uSplitHalfWidth * 2.0` is the correct
comparison.** Built, served, measured — **no visible change**, because of §1 — and **reverted, not
kept**.

**Commit it separately from the §4 work**, with a message saying plainly that it fixes a latent unit
mismatch with **no visible effect today**, and why. A fix that changes nothing on screen is exactly the
kind that gets reverted later by someone who cannot see what it bought; the commit message is the only
defence it has.

## 6. B20 CONFIRMED — framing is no longer reasoned, it is measured

`FRAME_SIZE = span*0.65` frames all three footprints, none clipped, none behind the panel. In a 1492px
capture: panel ends x=259, leftmost block starts x=430 (**171px clear margin** — the "far end pushed
left behind the panel" failure is gone), rightmost ends x=1130; tops y=262, bottoms y=690. Panel reads
*"Subject framed at 12.35u"*.

## 7. DEFERRED, ART JUDGEMENT, OWNER'S — the seam reads as two lines

The corner-wrap seam reads as **two separate parallel strands**, not one wrap: the corner sits between
them, left strand on the lit face, right on the dark, `SEAM_INSET 0.55u` in from the corner on **each**
face — which is mechanically exactly what B10 specifies. But the inset pushes each strand off the
corner and the corner itself stays dark, so at a glance the block wears two parallel seams rather than
one wrapped edge. Block 1 shows none: its hashed corner faces away.

**Not a B10 violation and not a defect** — an art call, **deliberately deferred to the single owner
sitting** once the material is whole. Reasoning: the owner's eye is the scarcest resource in this arc,
and a material missing two of its three scales is not worth spending it on — they would be judging a
surface they are about to see again.

## 8. ⚠ CHROME FREEZE IS ON — and this is the fact that made it necessary

**Take no frames. Foreground nothing. Ask the supervisor first, and say why.**

The lane took **nine frames across six reloads** and stole the owner's desktop focus three times inside
one sentence they were typing. The multiplier nobody knew about, now measured first-hand:

- **A `navigate` or `location.reload()` returns the tab to `hidden`** — so the `osascript` foreground
  must be re-run after **EVERY** reload.
- **The module-scope material SURVIVES HMR** — so a shader edit needs a **full reload**, not an HMR
  update. Which is what forces a reload per probe in the first place.

Those two compound: every shader probe costs a reload, and every reload costs a focus steal. **That is
why `art/frame-tap` matters more than it looks** — every lane has been paying a hidden per-probe tax on
the owner's attention that nobody had measured.

Cheap mitigation from `track-44`, use it: **panel toggle state is DOM, so `javascript_tool` reads it at
zero focus cost.** Only *pixels* need the window.

## 9. State at the clear

- Branch `art/block`, HEAD **`abdcb93`**, tree **clean**, **pushed** (`@{u}...HEAD` = `0 0`). Nothing
  outstanding. Every debug probe reverted; the ×2 gate fix is **not** kept.
- **The "push is blocked by the lane's classifier, the owner must clear it" claim is STRUCK.** It rode
  three handovers as fact without re-testing. `git push` went through with no prompt and no denial.
  Re-testing an inherited blocker instead of routing around it is what killed it.
- The frame tap is **NOT** on this branch and is **not** to be pulled in (supervisor call): it is 15
  files including `vite.config.ts`, mid-slice with a live hang, and currently carries a temporary
  scaffold marked REMOVE BEFORE PR. It arrives via `dev`, after its own PR.
- `[unmeasured]` whether the interior corner improved under `CHAMFER_GAMMA 2.2` + the crease. Never got
  a clean read; no frame taken to find out.
- **Nothing in `e7ca605` has been seen.** What is outstanding on this lane is **judgement, not design**.

## 10. Next actions, in order

1. **Build §4 (Option A, variation only)**, run the full verify gate, commit. **It will be UNJUDGED** —
   the Chrome freeze means it cannot be looked at. Say so explicitly in the state doc; do not treat "I
   need to see it" as grounds to lift the freeze.
2. **The §5 unit fix, as its own commit.**
3. Housekeeping one-liners: the false `iso-lab-controls.tsx` copy *"rig off — the subject is lit only by
   itself"* (written for `/iso-sky`, false on `/iso-block`) — and **do not** add a `grid?: boolean` prop,
   that is confirmed rejected. Record the `DETAIL_NORMAL` judging constraint as a constraint on **where**
   it can be read: the only grazing light is the interior corner, so that is the one place it can ever
   show.
4. Then a frame, **when the supervisor schedules one.**
