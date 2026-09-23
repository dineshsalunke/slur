# Handover — #162, the rail is not out-shone, and what the measurement found instead

Session of 2026-09-23, branch `dev`, issue #162. Picked up from `.claude/phases/HANDOVER-back-fill.md`,
whose "Run the same measurement on the monolith and the deck" item this closes. **No source change
and no commit** — the issue says *"Do not retune to make the ratio look better before the mechanism
is understood"*, and the mechanism turned out not to need a retune. Full measurement set is on the
issue: `github.com/dineshsalunke/slur/issues/162#issuecomment-5789662183`.

## The verdict

**#162 does not reproduce, and its ratio is inverted.** At equal depth on the shipped composed frame,
the rail strip is **1.9x** the linear luminance of the deck 3px inboard and **8.2x** at 24px. The
issue's numbers came from `.claude/art-pass/03-lighting/LANE-FACTS-COLD-KEY.md`, deleted with
`.claude/art-pass/`, and every code path it names is gone — no `feedEmitters`, no
`RAIL_EMITTER_*`, no `EMITTER_SLOTS`. The rail's light is now six `RectAreaLight`s:
`apps/client/app/game/scene/rail-lights.tsx:12` — `const SLOTS_PER_SIDE = 3;`.

## The mechanism, which is the part worth keeping

| deck, bloom off | +3px inboard | +24px inboard | colour at +24px |
|---|---|---|---|
| all lights on | 0.1579 | 0.0379 | rgb(72.0, 48.9, 32.8) |
| `RailLight.intensity` 0 | **0.0093** | **0.0136** | rgb(31.4, 29.9, 34.6) |
| `NearFill.intensity` 0 | 0.1579 | 0.0379 | unchanged |
| `Env.bandIntensity` 0 | 0.1538 | 0.0348 | rgb(68.2, 46.7, 32.7) |

**The rail lights are the deck's light near the rail, and the only thing warming it** — killing them
drops the deck 17x at +3px and turns it cold. `NearFill` (a point light at intensity 40) does
*nothing* there. The band does 8%.

**Mid-deck, ~30u from any rail, the rail lights reach nothing.** There the deck pre-bloom reads
rgb(20, 21, 28), and only `Environment.intensity` moves it (sRGB lum 21.6 → 7.4). The IBL is
mid-deck's only light. So the reading #162 describes is real with the cause backwards: the deck does
not out-shine the rail, the deck **stops being lit a few units in from it**.

**Bloom's contribution is local, not global.** Beside a rim cord the deck loses 46% of its brightness
and all its warmth with bloom off; out at the rail walk it loses 6%. The broad orange over a shipped
frame is the bloom pass smearing marigold emissives.

## The monolith answer the previous handover asked for

Face sampled 46px from its own seam, anchored on the seam per frame:

| | face | lin-lum |
|---|---|---|
| shipped | rgb(31.2, 13.2, 3.4) | 0.0060 |
| `Bloom.intensity` 0 | **rgb(1.8, 4.5, 9.0)** | 0.0013 |
| `Env.bandIntensity` 0 | rgb(31.9, 13.6, 3.0) | 0.0062 |
| `Monolith.metalness` 0 | rgb(33.3, 15.6, 5.3) | 0.0070 |

**78% of what that face shows is bloom spill**, and it is marigold with effectively zero blue.
`docs/ART_MATERIALS.md` §0 exactly — *"a bare metal surface with nothing to reflect renders black and
reads as a hole. This is a constraint on the lighting rig, not a licence to drop metalness until the
problem goes away."*

It **disproves the band-mirror hypothesis** `HANDOVER-back-fill.md` proposed off #170: band 0 changes
the face 3%, metalness 0 changes it 16% — against the *block's* 2-3x in #170. The block's face
mirrors the band; the monolith's does not, and neither does the deck's. The reason is geometric — the
deck is horizontal, so it mirrors the sky shell, not a horizon band at `BAND_RADIUS` 98
(`scene-environment.tsx:9`, which is the file the back-fill handover called `authored-environment.tsx`).

## Three traps this pass hit — read before the next frame-tap session

**1. The bright marigold line on the deck near the camera is the GAP-RIM CORD, not the rail.**
`Rail.rimEmissive` 0 removes it; `Rail.railEmissive` 0 and `Deck.seamEmissive` 0 leave it untouched.
I measured it for three runs believing it was the rail, and it out-shines the deck 1u away by ~20x —
a plausible-looking number for entirely the wrong surface. The rail is never near the chase camera;
it only ever appears as a thin distant line at the deck edge.

**2. `bloom-off` is NOT the composed frame minus bloom.** `frame-tap-pump.ts:65` produces it with
`state.gl.render( state.scene, state.camera )`, which bypasses the whole `EffectComposer` — so it
also skips the `ToneMapping` pass. Its *values* are not comparable to the composed frame's. Use it
for **geometry** (un-smeared emissive edges are perfect for locating a probe) and set
`Bloom.intensity` 0 when you want bloom off *inside* the shipped pipeline.

**3. `[[freeze-the-sim-to-ab-a-light]]`'s "same duration lands the same frame" does not hold.**
Two identical default runs at a 4s held `KeyW` came back at SSIM 0.906 — enough drift to move a
monolith across the frame and to swamp any effect under ~2 levels. Memory corrected. Two fixes, both
used here:
- **Freeze at the spawn pose** (flight 0, no `KeyW`): SSIM 0.995 run to run.
- **Probe by feature, never by fixed pixel.** Locate the surface in each frame from its own
  emissive, then sample at offsets from that. Scripts are four lines each and gone with the
  scratchpad; the shape is in `[[probe-by-feature-not-by-pixel]]`.

Also: a strafe of even 1.1s off the spawn pose throws the ship off the deck edge, and the headless
Chrome hung twice (CDP `Runtime.evaluate` stopped answering, tap reported "nobody answered") — fixed
by `pkill -f "remote-debugging-port=<port>"` and relaunching.

## What to do next

1. **The surviving finding belongs to the open half of #170**, which is already about putting cold
   light on a player-facing face: *player-facing vertical faces have no light of their own and are
   carried by the bloom pass.* The monolith numbers above are the evidence; #170's own table already
   shows `Fill.intensity` 2 is what puts blue on a face. Still an owner's-eye call across two lanes
   (the asteroid albedo was tuned at `Fill.intensity` 0.35 under #211).
2. **#162 should be closed as not reproducing.** Recommended on the issue; left open, it is the
   owner's issue to close.
3. **Worth its own issue, not filed:** `NearFill` at intensity 40 measurably contributes nothing to
   the deck at either probe. Either its `distance` 45 / falloff makes it a ship-only light, in which
   case the name is misleading, or it is dead weight. Unmeasured on the ship itself.
4. Untouched and still open from the previous handovers: the **corridor playtest** (12u pinch gates
   never flown), and the **vertical-reach check** missing from the track validator.

## Shared-checkout state at handover

`apps/client/app/dev/panel-visibility.ts` and `game/scene/rear-view-pass.tsx` modified, plus
untracked `dev/rear-view-toggle.ts`, `dev/typing-target.ts`, `game/scene/rear-view.tsx` — **another
session's uncommitted work** on the rearview. Untouched here. This pass wrote no source at all, so
there was nothing to commit and no pathspec needed.

A client dev server is running on `:5177` against `:2567` (inherited from the previous session) and a
headless Chrome on CDP port **9338** (this session's, relaunched twice). Both can be killed.
