# `art/track` — LANE STATE

**Replaces itself.** This file says where the work *is*; `LANE-BRIEF.md` says what the work *is* and does
not change. Read the brief first, then this. Written by the supervisor from the lane's first-hand reports
plus facts verified directly in the tree — so do not re-derive what is here; if what you find contradicts
it, stop and say so rather than quietly fixing either one.

Last written: 2026-09-19, supervisor session `414783` (`slur-da`), at the first context handover. Begun by
session `2ce938`, which has since been terminated; this session adopted the doc rather than rewriting it.

---

## 1. Where the branch is

| | |
|---|---|
| Branch | `art/track`, worktree `../slur-worktrees/track` |
| HEAD | `git log -1` is authoritative — **this file cannot name its own commit** without being one behind, so it doesn't try. The last *code* commit is `c937888`; anything after it is docs |
| Base | `1807bc0` (`dev` at the time task 1 merged) |
| Code commits | `604bf0c` docs/brief · `1bb5839` slice 0 · `c937888` sky knobs |
| Working tree | clean as of the last handover |
| Pushed | **yes** — `origin/art/track`. No PR opened yet |
| Verify gate | `pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build` |
| Gate result | **green** — lint "Found 3 warnings" (pre-existing `noExcessiveLinesPerFile` on `step.test.ts`, `track.test.ts`, `track.ts`) + "✓ Canvas-isolation: 8 route entry modules clean"; 75 shared · 34 client · 4 server; SPA build |
| Ports | client **5201**, server **2601** · stack was up at handover |
| Review URLs | `http://localhost:5201/art-lab` (chase camera — the gate) · `http://localhost:5201/iso-sky` (free orbit) |

## 2. What is built

**Slice 0 — the honest review frame (`1bb5839`).** All three of its decisions landed:

- **D3, tone mapping ON.** `toneMapped: false` came off the track surfaces, plus `tube-walls.tsx` and
  `track.tsx`. Deliberately *not* the other eleven files that still set it — finish gate, pickups, bolts,
  sparks, explosions, ship engines are VFX whose values trade against the bloom and exposure budget **task 3
  owns**, and re-tuning them now is tuning against a budget that does not exist yet. No panel switch exists
  and none is to be built.
- **D4, the lab lost its own lights.** `/art-lab`'s `ambientLight` and `directionalLight` are gone; the
  `DeepSpaceSky` rig is mounted **unconditionally** and the `backdrop` toggle now hides only the visible
  patch, so "backdrop off" does not mean "pitch black".
- **D5, the placeholder boxes came out of frame.** `TrackView`'s welded `hazards` toggle is split: rails and
  blocks are independent layers (`layers.rails` / `layers.blocks` in `art-lab-canvas.tsx`) and **blocks
  default OFF**, one click away for the hazard-to-floor contact-shading check. `LETHAL_SURFACE` and
  `DRAG_SURFACE` colours were **not** touched — the retone is cancelled, not deferred.
  The split is structural, not a flag: `track-view.tsx` is now a 19-line composer over new
  `track-ribbon.tsx` (floor quads + rails), `track-blocks.tsx` (lethal + drag + opacity pulse) and
  `track-instancing.ts` (shared `put`/`park` helpers, `AHEAD = 900` / `BACK = 80`). **Slice 1 deletes the
  floor quads out of `TrackRibbon`** — that is where D1 lands.

**Sky framing knobs in `/art-lab` (`c937888`)** — added mid-slice-0 on the owner's observation that *"the
planet feels centre, we wanted it on the right"*. This is **the instrument, not the answer**: no committed
sky value changed.

- `art-lab-canvas.tsx:66` mounts `<TunableSky backdrop={ layers.backdrop } />` instead of the frozen
  `DEEP_SPACE` constant, reading the same `SKY_TUNING` singleton `/iso-sky` writes — so the two labs cannot
  disagree about what ships. `TunableSky`'s two-`useMemo` split is preserved untouched, so a pan drag does
  not re-bake the `<Environment>` cubemap. The sliders are their own leaf component holding their own
  subscription (non-negotiable #10).
- **The star is coupled to pan, inside `writeSkyTuning`** (`sky-tuning.ts:101`), because `starBearingDeg: 66`
  was measured *through* the backdrop mapping and therefore names a point in the **image**, not the world.
  Pan without it and the `DirectionalLight` and rig key keep aiming where the star used to be. The coupling
  sits in the single write path rather than in a panel, because a panel is free to forget. Weighed against
  read-time derivation (loses the independent star tuning `/iso-sky`'s gate needs), a panel readout, a
  warning at freeze time (too late), and a comment (nothing). *Verified in the tree by the supervisor.*

## 3. What is NOT done, and must not be reported as done

- **Slice 0 is NOT gated.** The owner has now looked at the frame — but the look produced a bug, not a
  verdict (§4). Nothing about the floor, rail, or bloom-on-vs-off read has been judged yet, because a black
  sphere in front of the track makes the rest unjudgeable. Slice 1 does not start until slice 0 passes.
- **The emissive re-tune that D3 forces has not happened.** Every intensity in the tree is its
  previously-committed value. The lane reverted its own `2.6 → 2.0` rail guess rather than pass an unmeasured
  number off as tuning — that was the right call and stands. Its expectation that ACES makes the frame read
  *less* blown than before is **reasoned from the transform's shape, not measured**; it needs either pixels
  sampled from a foreground tab or the owner saying what reads blown.
  The values sit in `apps/client/app/game/scene/track-materials.ts` and are all still `dev`'s:
  `FLOOR_SURFACE` `0.05`, `LETHAL_SURFACE` `2.2`, `DRAG_SURFACE` `1.6`, `RAIL_SURFACE` `2.6`. Confirm with
  `git diff origin/dev -- apps/client/app/game/scene/track-materials.ts` — it shows only `toneMapped`
  deletions and comments.
- **No Chrome tab is parked.** The lane's own tab reported `visibilityState: "hidden"` — black canvas, DOM
  panels fine, the documented trap — and it closed the tab rather than leave something easy to misread. That
  was correct. **Never gate from a tab you opened yourself**; ask the owner to foreground their own window.
  See §8 for two first-hand corrections to how that trap presents.
- **No PR is open.** The branch is pushed (`origin/art/track`); a PR waits until the slices are gated.

## 4. FIRST GATE FEEDBACK — a black sphere occluding the track. Fix this before slice 1.

The owner ran the slice-0 gate on 2026-09-19 and reported, in their words: *"it seems there is a black sphere
in front of the track."* They also confirmed it is **pinned to the camera** — it does not sit at a world
position you approach and pass. That rules out a scene object and puts it in sky/backdrop space.

**This is probably the same observation as the earlier "the planet reads centre".** The source jpg is
1672×941 with the limb fit at (1679, 622) r 719, so the planet's centre sits just *past* the right edge and
only a crescent should be in frame — which is why "it reads centre" was surprising on paper. A distinct dark
sphere sitting centre-frame would explain both reports as one bug. **Inferred, not confirmed — confirm or
kill it before acting.**

Two hypotheses, and they are distinguishable by whether the track is *occluded* or merely *dark*:

- **Depth.** A camera-centred backdrop sphere that writes depth clips everything past its radius, so the
  track would be genuinely cut off at the sphere's edge. Newly black because **D4 deleted the lab's own
  ambient light** that used to wash it — the frame is now honest, and this is what honesty exposed.
- **Material.** An unlit mesh drawing black — the planet body, or drei `<Environment>`'s `<Lightformer>`
  children becoming visible in-scene rather than only baking. D4 mounts `StarLight` and `SkyEnvironment`
  **unconditionally**, so the `backdrop` toggle does not hide them.

**Do not narrow this by toggling `backdrop`.** The owner tried and the test is confounded: with the backdrop
off the whole background goes black, so a black sphere against it cannot be read either way. They said so
directly, and they were right. Instrument it instead — render-order/depth-state readout, or isolate the
sky-rig children one at a time.

The owner asked the lane to capture the frame. **Expect the hidden-tab trap and read §8 first** — a capture
that comes back black is the trap, not evidence about the sphere.

## 5. Open, waiting on the owner's eye

1. **Slice 0's frame** at `/art-lab`, bloom on **and** off. It should be *honest* (only lighting the game
   has) and *uncluttered* (no placeholder boxes). It is expected to look **worse** than before — it was
   flattering itself with lab lights.
   Panel state for that look: **slab ON, rails ON, blocks OFF, backdrop ON**, env/ships/finish off. The top
   row is running / fly / **bloom** — bloom is the third, and `useState(true)` at `route.tsx:35`, so it
   starts ON. Judge it **moving**, from the chase camera.
2. **The planet's position**, using the new pan/tilt/fov sliders — a fourth "sky framing" panel section,
   carrying a live "star bearing N° — follows pan" readout beside them. When a value is frozen
   it goes into `DEEP_SPACE` in `sky-config.ts` — and `starBearingDeg` moves with it automatically only
   while the change goes through `writeSkyTuning`; a value hand-typed into the constant carries no coupling,
   so freeze **both** numbers as the panel reports them.

## 6. Then, in order

Slice 1 floor swap (D1 — `TrackFloor` becomes the floor, the instanced floor quads go) → slice 2 floor
material and panel language → slice 3 rail + emitter array (D2; the isotropic-vs-anisotropic call is settled
**by rendering**, not by reading more boards) → slice 4 gaps. Each one stops at the owner's eye.

The deferred `/iso-sky` sky gate runs **after** a real track is in frame — still not this lane's to run. One
procedure note the owner added, recorded so it is not lost: that gate's roughness self-test must run with
**`Star light` OFF as well as `Env rig` off**, because a star light lights the probes exactly as a neutral
rig light does, which is the whole reason `/iso-sky` drops the lab rig at all.

## 7. Housekeeping

`INDEX.md`, `HANDOVER-SUPERVISOR-SESSION-6.md` and `07-blocks/` were untracked in the shared checkout and
ride to `dev` only through this lane's PR. They are committed on this branch as of `c937888`; if the
supervisor refreshes them in the worktree again, fold them into the next commit.

**One supervisor, and it is session `414783` (`slur-da`).** For a period on 2026-09-19 two supervisor
sessions were messaging this lane, because the owner's first supervisor was a `--fork-session --resume` that
kept running detached after its window closed; the owner believed it was gone while it went on issuing
instructions. The second supervisor had no history and read the in-progress sky work as unexplained scope
creep. **The lane was right to flag it instead of guessing** — it was the only party that could see both
voices. Session `2ce938` handed over in full and was terminated. If a second voice appears again, say so and
keep following this one until told otherwise in writing.

## 8. Traps paid for in this lane, not in `LANE-BRIEF.md`

First-hand from the lane; each cost real time.

- **`biome` treats formatting as a lint *error*.** Two edits failed `pnpm lint` purely on line wrapping. Run
  `pnpm format` before `pnpm lint`, or the gate fails on nothing.
- **The commit hook rejects a `Co-Authored-By` trailer** — it blocked the lane's first commit attempt. The
  session's own attribution instructions tell you to add one; the hook forbids it. Commit without.
- **HMR does not survive a layer-key rename.** After `hazards` → `rails`/`blocks` the running page held stale
  state and needed a full reload.
- **Hidden-tab trap, corrected — a correctly-sized canvas does NOT rule it out.** The standing note says the
  canvas gets stuck at 300×150 because R3F never measures. Measured here: **3456×1926**. R3F *did* mount and
  measure; only rAF was dead. So size is not the diagnostic — `visibilityState` is.
- **Second hidden-tab signature:** a rAF-based probe through `javascript_tool` **hangs** the CDP evaluate to
  its 45s timeout ("renderer may be frozen") because the promise never resolves. **That hang is the
  diagnosis**, not evidence of a frozen renderer.
- **The cold-start `ERR_MODULE_NOT_FOUND` race was NOT observed here** — the stack was already running and
  was never restarted, so it stays unverified by this lane rather than confirmed.
- **Clean-run baseline, for comparison after a change:** zero console errors, zero 404s, and one pre-existing
  `THREE.Clock is deprecated` warning ×2.
