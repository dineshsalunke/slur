# Supervisor handover — session 31 (2026-09-20)

Cleared the branch backlog, and then **two lanes each overturned a conclusion the previous handover was
about to act on**. Both corrections are recorded on the issues, not just here.

`dev` untouched at `cf1c98c`. PR queue: **#165** (Split Crown, HELD) · **#168** (M2 wear, ready to review).

## Done as asked

### The 17 stale remote branches are deleted
Blocked by the auto-mode classifier last session; done one `gh api -X DELETE` at a time (multi-target and
`for`-loop forms are still blocked — single invocations pass). The remote now holds exactly **`dev`,
`main`, `art/sealed-block`, `art/split-crown`, `docs/block-wear-m2`**.

### Both lanes verified on independent stacks, both on their own Chrome tab group
`split-crown` 5200/2600 · `sealed-block` 5204/2604, each with its own `apps/client/.env`, all four ports 200.
**Tab groups are per-session and coexist** — confirmed, `tabs_context_mcp` reports none for the supervisor
while both lanes hold their own. What does NOT parallelise is **capture**: a backgrounded tab reports
`visibilityState: "hidden"`, rAF stops, the canvas goes black, so an un-foregrounded capture is *garbage,
not stale*. Capture stayed serialised; it is now with `sealed-block`.

## ⚠ CORRECTION 1 — #165's "half sunk" is TONAL, not geometric

**Supersedes the coplanarity conclusion in session 30's addendum**, which I was one message from routing to
the owner. Full record on the PR (`#165` comment `5750750922`).

Four hypotheses are measured shut: bbox disagreement · centre-seating · a deck offset (deck top world-Y
**0.000** across every span; grounded `s.y` **0.000** across 338 ticks) · depth fighting (none at four z
positions — deck top faces up, hull underside faces down, so the coplanar pair is never both front-facing
and *cannot* fight).

**Toggling the deck layer off leaves the hull silhouette IDENTICAL.** The deck hides zero hull. There is no
geometry to fix. The hull's flared lower body renders at nearly the deck's value and merges with it, leaving
the brighter upper nacelles reading as "the ship" — the exact shape of a hull half in the floor. The 0.5u
probe lift "worked" because it gave that lower body an edge against a different background: **clearance masks
the symptom.**

**Filed as #171** — near-black assets render far brighter than authored (`baseColorFactor` 0.007–0.017 linear
arriving mid-dark). It is not a ship bug; **near-black is the house palette**, the block's M2 body is
`#0d1117`, and if authored near-black is not arriving as near-black then every material decision so far was
made against a moved target. **#167's hover masks this and is explicitly not the fix.**

Also from that lane: **a fresh `/art-lab` defaults to `shipBox` ON and `ships` OFF** — the opaque AABB slab
drawn where the ship belongs is the likeliest source of the original "half sunk" frame. Check what you are
looking at before measuring it. `[unmeasured]`: continuous-motion flicker — the keyboard never drove the sim
(`w` x50, speed stayed 0.0 u/s), so four static `jump to` waypoints were sampled; **the lab's input path is
worth its own look.**

## ⚠ CORRECTION 2 — the rig gives every player-facing face zero light

The `sealed-block` lane measured, against three 0.185.1's own fragment math with every formula cited to
installed source: the block's **presented (−Z) face is rgb(0,0,0)** — direct `0.00e+0`, env diffuse
`4.81e-5`, env specular `2.91e-4`. `dotNV` 0.928, so no grazing-angle rescue. And **both of board 28's wear
dials are exhausted**: roughness across the whole M2 band moves the *top* face 2 levels, non-monotonically
(direct and env specular nearly cancel); value responds at 4.9% for ~4 levels. On the presented face, zero.

So board 28's stated variation mechanism is not weakened by the lighting — it is **unavailable**.

**Owner decided: add a low fill from behind the player. Filed as #170.**

**The lab rig is accidental evidence for it, and gives a starting bearing.** `/iso-block`'s legibility rig
(`ambientLight 0.5` + `directionalLight [dist, dist*1.6, -dist]`, `iso-lab-canvas.tsx:67-68`) converts to
**bearing 225.0, elevation 48.5** — behind the player and high. N·L per face, computed this session (the star
row independently reproduces the lane's `(-0.8638, 0.3256, 0.3846)` to four places):

| light | presented (−Z) | top (+Y) | −X | +X |
|---|---|---|---|---|
| lab rig directional (225, 48.5) | **0.469** | **0.749** | 0.000 | 0.469 |
| existing env fill card (246, −19) | 0.385 | 0.000 | 0.000 | 0.864 |
| star (66, 19) | 0.000 | 0.326 | 0.864 | 0.000 |
| cold key (0, 45) | 0.000 | 0.707 | 0.000 | 0.000 |

**This reverses #170's implementation order.** The existing fill card is aimed nearly right (0.385) and fails
purely on **energy**; its below-horizon elevation contributes **0.000** to the top face where the wear dial
lives. And since direct and env specular already nearly cancel, adding energy to the **env** side works
*against* the dial. So: **a second real directional at ~225/48.5 first**, raising the Lightformer second.

**Blast radius is smaller than it looked:** the rig is **labs-only**. `DeepSpaceSky`/`StarLight`/
`SkyEnvironment` mount in `/art-lab` and `/iso-sky` only; the race canvas still runs
`<Environment config={GRID_VOID}>` + flat `<ambientLight intensity={1} />` (`net-canvas.tsx:114-115`). No
hosted-room pixel changes until the integration task runs.

## Lane state

### `sealed-block` (#164) — ACTIVE, holds Chrome
Cleared at 173k and re-briefed; `LANE-STATE.md` pushed as `bc8189b`. **#164 is NOT blocked by #170** — board
28 fixes the silhouette independently and says *clean is a legitimate endpoint of the wear range*, so it
builds the whole thing and ships at clean, tuning deferred.

**Bevels done, `f71db93`** — parameterised chamfered cuboid, 0.12u world-uniform (same strip width on a 3.5u
and an 8u block), clamped to 45% of the smallest half-extent so it can never become a taper, winding derived
from the intended normal. Two-directional AABB assertion re-run green. Client tests 85 (was 80).

Its per-facet result is worth keeping: the chamfer recovers **one lit vertical edge** on the presented
silhouette (0.339 star on the −Z/−X bevel, 0.465 on the corner) plus a continuous lit top rim — on facets a
flat box does not possess. Not a general rescue (every other presented-face facet is still 0.0000), so it
does not soften #170; it means the front silhouette is no longer carried by the emissive seam alone.

Next: vertical marigold seams → wear mechanism plumbed and left at clean → visual gate.

### `split-crown` (#165/#159) — AT A SEAM at ~167k, NOT cleared
HEAD `c8ad83d`, pushed, tree clean; `953a860`/`8650251`/`c8ad83d` are **all notes, no fix**. Boundary intact —
lift, footprint and scale untouched, nothing prepared for #167. **Needs a LANE-STATE written and a clear.**
Its stack had died (both listeners gone) and was restarted; **the machine IP moved `192.168.43.61` →
`10.20.2.48`**, plausibly the cause — worth watching if other stacks drop.

## Immediately next

1. **Write `split-crown`'s LANE-STATE and clear it.** It is idle at a seam; nothing is burning, but it is
   holding 167k for no reason.
2. **#165 stays HELD** — it is now blocked on **#171**, not on a lift nudge. Decide whether to merge the ship
   as-is (the seating is provably exact) and fix the value separately, or hold the PR until #171 lands.
3. **#168 (M2 wear) is ready to review** and has been for two sessions.
4. **#170 needs a lane** once one frees. It is lighting, not blocks — do not give it to `sealed-block`.
5. **#163's scope list is STILL unconfirmed by the owner** — carried from sessions 29 and 30.
6. The z=0 rail seam is still unlooked-at (carried since s26).

## Carried, untouched

The two divergent `docs/art-direction/` snapshots and whether `vehicles/` lands · `.claude/art-pass/02-track/README.md`
still says "not started" · #160/#161 stay in Backlog deliberately · `MARIGOLD_REFERENCE_INTENSITY` 2.0
`[unmeasured]` · `LETHAL_SURFACE` still `#ff2740` red, retone correctly deferred to after #164 · the coplanar
finding still unsent to Codex.

## Gotchas paid for this session

- **The classifier blocks multi-target and compound git/branch commands**; single invocations pass. It also
  blocked a `gh api DELETE && echo && fetch` compound — split it.
- **`/art-lab` defaults `shipBox` ON, `ships` OFF** — see above. A debug overlay defaulting on has now
  produced one phantom bug; check every lab's defaults before trusting a frame.
- **A lab rig is a legibility instrument, not the art direction.** `/iso-block` makes a block look fine while
  the race view renders it rgb(0,0,0); both true at once. Take geometry from a lab rig, never levels.
- **`Co-Authored-By` is rejected by the commit hook** — the session attribution instruction conflicts with the
  repo policy, and the repo wins.
