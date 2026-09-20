# Supervisor handover — session 32 (2026-09-20)

**The PR queue is empty and both lanes are cleared, re-briefed and working.** Two PRs merged, one process
constraint that shaped the last several sessions turned out to be false, and the owner reversed the order of
the two open art bugs.

`dev` at **`32a6b5f`**. PR queue: **empty**. Open branches: `dev`, `main`, `art/sealed-block`,
`fix/near-black-albedo`.

## Merged

- **#168 — M2 gains wear, vertical seams and seeded variation from board 28** → `160b356`. Docs-only,
  `docs/ART_MATERIALS.md` only. Had been ready for two sessions.
- **#165 — the Freighter flies the Split Crown** → `32a6b5f`, closing **#159**. First bespoke ship asset,
  the team wash deleted, the drained-command ship picker in `/art-lab`, and the Bloom/React-19 fix that is
  the only fix for **#166** crashing every dev lab. Gated green on `33f7812` after a rebase onto current
  `dev`; head SHA verified identical on the PR object and `refs/pull/165/head` before merging.

**I merged #165 rather than holding it on #171.** The seating is provably exact and the "half sunk" read is
a global tonal question that this PR cannot fix and does not cause; holding it was also holding the #166
lab-crash fix hostage. Recorded so it is not re-litigated.

## ⚠ THE BIG ONE — capture no longer serialises, and never needed to

**The frame tap works from a hidden tab, and `sealed-block` proved it this session.**
`curl 'http://localhost:<PORT>/__frame-tap?name=X'` → `ok: true`, `pumped: 1`, **`firstDeltaSeconds:
89.77`** — rAF in that tab had been dead for 89.8 seconds and the tap pumped the frame itself. The gate was
read on those pixels.

This **retires the rule that has shaped supervision since session 26**: that only one tab is live at a time,
so parallel lanes' visual gates must be queued and the window handed from lane to lane. That rule cost
`sealed-block` a whole stint sitting blocked on a Chrome slot it did not need. **Any Chrome with the route
merely loaded is a valid responder — no focus, no foregrounding, no pairing, no CDP.** Both lane docs now
say so; the `chrome-tab-per-session-serialise-visual-gates` memory is corrected.

Two rules travel with it. `firstDeltaSeconds` measures time since the last frame from **any** source and a
pump **is** a frame, so it only reads as an rAF probe across a ~10 s gap. A tap that 504s means the route
never mounted R3F — reload the tab, do not retry the tap.

And the sharper half: **`computer:screenshot` on a background tab returns a STALE frame, not a blank one.**
`sealed-block` refused to read one and was right; that refusal is what sent it to the tap.

## ⚠ Owner decision — #171 goes BEFORE #170, and #170 is held

The two contradict each other about the same pixels.

**#170's premise** is `sealed-block`'s computed result that the block's presented (−Z) face receives
rgb(0,0,0) — direct `0.00e+0`, env diffuse `4.81e-5`, env specular `2.91e-4`, `dotNV` 0.928 so no grazing
rescue — computed against three 0.185.1's own fragment math with every formula cited to installed source.

**#171** reports the opposite sign of error on a different asset: the hull's authored `baseColorFactor` of
`[0.00700, 0.00913, 0.01161]` linear appearing far brighter than authored. Both lanes computed correctly and
they disagree about what the renderer does to a dark surface. A fill tuned against an inflated base would
have to be retuned once the truth is known, and near-black is the house palette — the deck, the block family
and the hull are all authored there.

Rationale is on **#170** (comment `5750815399`), which also preserves the whole bearing table so the work is
not lost; the scope and the ruled-out list are on **#171** (comment `5750817115`).

### My pushback on #171, which the lane is instructed to test first

**I do not yet believe the 50x gap exists.** Its evidence is *"~0.4 linear by eye"* — an estimate.
**0.007 linear encodes to `#171A1D`, about 9% of the 8-bit range**, and a patch that dark against a
near-black backdrop under bloom reads as mid-grey to any observer without being mid-grey. Perceived
lightness is not linear albedo and an 8-bit sRGB value is not either. The lane's first deliverable is a
**sampled pixel** with the sRGB transfer and the tone map both inverted from installed source, the deck in
the same frame as a control. **If it comes back `#171A1D` there is no bug, #171 closes invalid, and #170
un-blocks immediately** — a good outcome, not a wasted lane.

## Lane state — both cleared, both re-briefed, both working

### `sealed-block` (#164) — branch `art/sealed-block` @ `fb113cc`, stack 5204/2604
Cleared at ~171k. LANE-STATE rewritten and pushed as `fb113cc`.

**Bevels done AND visually gated** (`f71db93` + `0521682`, ref `sealed-block-bevel-01`). Silhouette PASS —
sealed cuboid, contour unbroken, no taper, no rounding, generous dark faces. Top chamfer strips **resolve**
as a distinct band; corner triangles **present and correctly oriented**, which is independent confirmation
of the winding-from-intended-normal construction on facets no test could have caught rendering black.
**Vertical chamfer strips do not resolve at that distance** — the facet is in the geometry, it just does not
separate under that rig at that zoom, and its in-game read is `[unmeasured]`.

Next: vertical marigold seams (design fully settled in LANE-FACTS — perimeter coordinate over the four side
faces, `|world normal.y|` mask, `emissivemap_fragment` hook, colour imported not guessed), then the wear
mechanism plumbed and left at clean, then the gate and the PR.

**For the owner / Codex, flagged and not acted on:** under the lab rig the **top chamfer band is the
brightest feature on the block**. It is a lit facet, not an emissive one, so it is not a "top-face luminous
return" in board 28's sense — but it sits close to the excluded "glowing outline" read and needs re-judging
once the seams and bloom are on it. The `|n.y|` mask kills the top strips at `|n.y| ≈ 0.707` anyway, which
makes the question narrower but not moot.

### `fix/near-black-albedo` (#171) — was `split-crown`, same worktree, stack 5200/2600
Cleared at ~180k and redirected. Branch created fresh off `32a6b5f`, brief pushed as the branch's only
commit: `.claude/art-pass/03-lighting/LANE-STATE-NEAR-BLACK-ALBEDO.md`.

It carries the GLB's four authored material values read from the binary, the four causes ruled out by direct
inspection (material path · ambient at 0 · the cold key · the `/art-lab` `env` **layer toggle**, which
changed the hull not at all), the two live hypotheses, and the failed approach: **the R3F scene graph is not
reachable from the DOM fiber** — `canvas.__r3f` undefined, 42 hops up and 325 fibers down find no `isScene`,
because R3F runs its own reconciler root.

The two live hypotheses: the **IBL** — `sky-config.ts:103` says the environment is three `<Lightformer>`s
baked by drei `<Environment>`, so the `env` layer button may only drive the visible backdrop rather than
`scene.environment`, making that null result evidence about the toggle and not the IBL. And **tone mapping**
— nothing under `apps/client/app` sets `toneMapping`, `toneMappingExposure` or `outputColorSpace` on any
Canvas (grepped this session, no hit), so every Canvas runs R3F 9.7.0's defaults, whatever they are, and
they sit in the path between `0.007` and the pixel. I added a third to hold: **bloom** is global, the
composer *is* the renderer, and the tap captures the composed frame — so a sampled pixel already includes
any bleed from the adjacent marigold emissive and engine core.

Instructed to stop and report rather than write a fix if the fix turns out to be a light, since that is
#170's file.

## Immediately next

1. **Wait on #171's measurement.** Everything downstream keys off it: #170's validity, the block's wear
   tuning, and whether the deck and block material decisions were made against a moved target.
2. **#163's scope list is STILL unconfirmed by the owner** — carried from sessions 29, 30 and 31. It is the
   track slice: gaps and gap rims, rail breaks over gaps, and the z=0 seam. Worth asking directly rather
   than carrying a fourth time.
3. The z=0 rail seam is still unlooked-at (carried since s26). A `seam-check` worktree is already parked at
   `cf1c98c` detached and clean if someone wants it.
4. **#170 stays held** — do not hand it to a lane until #171 reports.

## Carried, untouched

The two divergent `docs/art-direction/` snapshots and whether `vehicles/` lands · the unpushed
`docs/codex-reconcile` worktree, one commit, clean tree — *"adopt Codex's 2026-09-19 reconciliation, keep
the engineering sheets"*, still not turned into a PR · `.claude/art-pass/02-track/README.md` still says "not
started" · #160/#161 stay in Backlog deliberately · `MARIGOLD_REFERENCE_INTENSITY` 2.0 `[unmeasured]` ·
`LETHAL_SURFACE` still `#ff2740` red, retone deferred to after #164 · the coplanar finding still unsent to
Codex.

**The shared checkout is 27 commits behind with a dirty tree** (`1807bc0`, modified docs and many untracked
`.claude/` files). It is read/merge-only so nothing is at risk, but it means a `git status` there is
misleading and a file read from it can be stale — as happened this session, when the frame-tap source looked
absent from the working tree while being present on `dev`. Worth a `git pull` next time someone is in it.

## Gotchas paid for this session

- **The frame-tap source is on `dev` but NOT in the shared checkout's working tree**, because that tree is
  27 behind. A `grep` there said the tool did not exist. Check `git ls-tree origin/dev`, not the tree you
  are standing in.
- **`gh pr merge --delete-branch` fails to delete a local branch that a worktree holds** — the remote and
  the merge still succeed. Remove the worktree first, then the branch.
- **`--include='*.ts'` breaks under fish** ("no matches found"); wrap the whole `grep` in `bash -c`.
- **A lab rig is a legibility instrument, never the art direction** — carried and reconfirmed. `/iso-block`
  runs `ambientLight 0.5` + a directional and makes a block look fine while the race view renders the same
  face at rgb(0,0,0). Take geometry from a lab frame; never levels.
- **Check every lab's defaults before trusting a frame.** `/art-lab` defaults `shipBox` ON and `ships` OFF;
  `/iso-block` defaults `grid` and `rig` ON. Both facts are now in the lane docs.
- **Chrome quits when a lane closes its last tab** — owner-reported. Lanes leave their tab groups open.
- **`Co-Authored-By` is rejected by the commit hook**, again — the session attribution instruction conflicts
  with repo policy and the repo wins.

---

## ADDENDUM — Chrome died again, and the cause underneath it is worse

The owner reported, for the **second** time, that a lane closed its last Chrome tab, Chrome quit, and the
next agent's connection then failed. Chasing it turned up a real bug.

### The tab rule is now structural, not a line in a brief

**Closing the final tab quits Chrome.** The cost lands in a *different session, later*, so the agent that
caused it never sees the failure — and tidying up is the right reflex everywhere else, which is why "leave
your tab open" in a brief has now failed twice. The rule is therefore absolute and phrased as a
prohibition: **`tabs_close_mcp` is forbidden.** Let tabs accumulate; the human closes them. Belt and
braces, **keep one ordinary human-owned anchor tab open** — the only part of this that does not depend on
agent compliance.

Written into **`~/.claude-personal/skills/lane/SKILL.md`**, which is where every future lane brief is
generated from, replacing the old "expect focus contention, serialise the lanes" advice with the frame-tap
reality. Memory `never-close-the-last-chrome-tab` records it too. Both live lanes were told directly and
asked to append it to their own LANE-STATE on their next commit — **I did not write into either worktree,
because both had uncommitted work in them at the time.**

### ⚠ #172 — a frame tap with no responder can kill the dev server

Found while probing why 5200 had no responder. `split-crown`'s `dev.log` ends with an unhandled
`ERR_HTTP_HEADERS_SENT` — `Timeout._onTimeout → Object.done → json` — followed by `Exit status 1`. The
client and server go down **together**.

`entry.done` in `frame-tap-plugin.ts` is the sole writer of the tap's response and calls `json( res, … )`
(`:173-177`) with **no `res.headersSent` check and no settled flag**, while being reachable from three
independent paths: the `deadline` timer (`:257-260`), the `settle` timer (`:220-223`) and the
`slur:frame-tap:error` handler (`:144-156`). Each guards itself with the `pending` map, but the map entry
is not the response and `entry` stays captured in every closure after the delete. The second caller throws
**from a timer callback**, where there is no request context to catch it, so Node exits.

Two consequences beyond the fix:

- **Session 31's attribution was wrong.** A lane's stack dying with both listeners gone was blamed on the
  machine IP moving `192.168.43.61` → `10.20.2.48`. This crash is in that lane's log and is a sufficient
  cause on its own.
- **The tap is not safe as a probe.** The documented way to learn whether a responder exists is to tap and
  read the error — which is precisely the no-responder path that reaches this. Check the port is up and a
  tab is loaded first; tap last.

Fix direction on the issue: make `done` idempotent (settled flag and/or early return on `res.headersSent`),
assert double-call-writes-once in `frame-tap-plugin.test.ts`, and consider containing any throw inside a tap
timer so dev-only tooling can never stop the app it photographs.

### Current browser/stack state, as left

All four ports 200 (`5200`/`2600` albedo, `5204`/`2604` sealed-block). Chrome running, with three tabs I
opened: the repo on GitHub as the **anchor**, `localhost:5200/art-lab`, and `localhost:5204/iso-block`.

- **5204 answers taps** — verified `ok: true`, `pumped: 1`, `firstDeltaSeconds: 14.05`.
- **5200 does NOT answer**, even after opening and foregrounding `/art-lab` and waiting. The two candidate
  causes, in order: a tab that has **never** been visible never mounts R3F (root creation gates on measured
  size), and a tab open across a **dev-server restart** has a dead HMR socket and stops answering until
  reloaded — and that stack did restart after the #172 crash. **The albedo lane has been told its capture is
  down and must fix it before building any finding on a frame.** Diagnosis is its own; the cross-lane state
  is recorded here.

Operational detail worth keeping: `open -a "Google Chrome" "<url>"` reopens tabs from the shell, but **open
route tabs one at a time and let each become frontmost**, or the covered one never mounts and is not a
responder. Opening three at once is how 5200 ended up dead while 5204 worked.

---

## ADDENDUM 2 — the owner reframed the sunk ship, and it is a third explanation

**The observation, from the owner watching the Split Crown after #165 landed: the hull is seated correctly
now, but there is NO SHADOW, so nothing separates the ship from the deck.**

**Confirmed this session.** Grepping `apps/client/app/` for `shadows`, `castShadow`, `receiveShadow`,
`shadowMap`, `ContactShadows`, `AccumulativeShadows` and `SoftShadows` returns **zero hits**. Nothing in
this game casts a shadow onto anything and nothing ever has. It is not something the lighting rework would
have fixed incidentally: the deck is lit from its **own emissives** (#155) and an emissive material is not a
light in three — it cannot cast. The cold key directional (#158) is the only real light and is not
configured to cast either.

**Filed as #173.** It reorganises three existing findings into one, which is why it is more convincing than
either explanation it displaces:

- **The deck-off A/B** showing the deck hides zero hull was read as evidence for a *tonal* cause. It is
  equally evidence for a **missing cue** — nothing covers the hull, there is simply nothing marking where it
  meets the floor.
- **The 0.5u lift "working"** was recorded as *"clearance masks the symptom"*. Better read: the lift gave
  the lower body a silhouette edge against a different background, substituting for a grounding cue that
  does not exist. **#167 is the same substitution by accident.**
- **"The flared lower body renders at nearly the deck's value and merges with it"** is precisely what two
  similar-valued surfaces meeting with **no contact darkening** look like, whether or not either albedo is
  correct.

**#171 is demoted, not closed.** The pixel measurement is cheap and still worth taking — it either closes
#171 invalid or uncovers a colour-management problem affecting every material — but it is no longer the
leading explanation for the sunk read, and the lane is told to measure, report, and move on rather than
mount a long diagnosis.

**#170 stays held**, and #173 is further evidence for holding it: the scene's problem looks like a missing
*cue*, not a missing *quantity of light*, and a back-fill does not make that distinction.

**There is art-direction precedent.** `docs/ART_MATERIALS.md`'s element→material map already carries
`| Hazard-to-floor contact shading | M1, lighting only | none |` — contact shading at the floor is an
anticipated, named treatment specified as lighting-only with no marigold. A ship-to-floor cue is the same
idea on a different element, not a new invention.

**Left deliberately unprescribed.** #173 is a mechanism decision and gets non-negotiable #14 in full. The
issue lists five candidates — shadow map on the key · drei `<ContactShadows>` · a blob shadow parented to
the ship · SSAO in the existing chain · a fresnel rim on the lower edge — explicitly **not** as a
recommendation. The constraint most likely to eliminate an attractive option: **the deck is not continuous,
so check the chosen mechanism over a GAP early.** A floor-plane trick that floats over a hole is worse than
no cue at all.

**Boundary given to the lane:** if the chosen mechanism means touching the light rig — enabling the shadow
map on the cold key is exactly that — it stops and asks, because that overlaps #170 and I will not have two
lanes editing one file.

## ADDENDUM 3 — #174, the lab stops opening on a debug box

Owner's call. `DEFAULT_LAB_LAYERS` ships `ships: false, shipBox: true`, so a fresh `/art-lab` draws an
**opaque debug AABB slab exactly where the ship belongs and hides the ship**. That is the likeliest source
of the original "half sunk" frame, and it has now produced two phantom bugs. Filed as **#174**: flip to
`ships: true, shipBox: false`, and make the lab's default ship the **Split Crown** — our only bespoke asset
and the only one worth judging art against.

**The trap, spelled out to the lane:** do **not** change `DEFAULT_SHIP` (`ship-classes.ts:132`, currently
`'challenger'`) — it decides what every real player flies. This is a lab-only default and needs its own
constant, read by **both** seeds, which are independent and will drift if not: `art-lab-controls.tsx`'s
`useState< ShipId >( DEFAULT_SHIP )` drives the picker's highlighted button, and `art-lab-rig.tsx`'s
`Net( { …, shipId: DEFAULT_SHIP, … } )` decides what mounts. If they disagree the highlight lies about
what is on screen.

`env: false` is flagged as a questionable default too — the environment is part of what any art judgement
is made against — but explicitly **not** folded in.

## Revised order for the albedo lane

1. **#174** — fix the instrument first; it is small and it is what everything else is judged through.
2. **#171** — take the pixel measurement, report, move on. Do not mount a long diagnosis.
3. **#173** — the real work, with the five-candidate weighing and the gap check.

Its practical blocker is unchanged and unresolved: **port 5200 still has no frame-tap responder.**

## Note for whoever writes session 33

`sealed-block` folded the never-close-a-tab rule and the #172 tap-crash hazard into its own `LANE-STATE.md`
when asked, so those survive its next clear. **The albedo lane was asked to do the same and has not been
confirmed doing it** — check `.claude/art-pass/03-lighting/LANE-STATE-NEAR-BLACK-ALBEDO.md` carries both
before clearing that lane, or they are lost.
