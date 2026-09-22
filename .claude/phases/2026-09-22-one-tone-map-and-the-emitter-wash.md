# One tone map, and the wash that was never the bloom

Branch `feat/test-level`. Picks up `2026-09-22-owner-numbers-and-the-ship-glow.md`, whose fifth pass
left `<Canvas flat>` as **"Owner's call — not done"**. Owner's answer this session: *"then why not just
fix it instead of filing an issue"* — so it was fixed rather than filed.

## The pipeline change

Verified-this-session:

- `@react-three/fiber` **9.7.0**, `dist/events-156d8d12.esm.js:15903` —
  `gl.toneMapping = flat ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping`. Neither gameplay canvas
  passed `flat`, so **in-shader ACES** ran on every material.
- `world-scene.tsx:36-39` — the `EffectComposer` holds `<SceneBloom />` then `<ToneTuning />`.
- `tunables.ts:122` — `tone.mapping` had already been changed to spec default `Reinhard` (the earlier
  handover recorded it as `None`, which was true of the owner's *storage*, not the spec).

So the shipped default was **ACES → bloom → Reinhard**. Two curves.

The double curve was the smaller problem. ACES ran in the **material shader, before the composer**, so
the bloom pass never received an HDR value — which is why emissives had to be pushed to 6 and 10 to
cross a `0.9` threshold. Those numbers were compensation for a curve applied in the wrong place.

**As built:** `flat` on `routes/test-level/test-level-canvas.tsx` and `game/net-canvas.tsx` — both mount
the same `WorldScene`, so the real room carried the same double map. `landing-scene.tsx` and
`env-lab-canvas.tsx` deliberately **not** touched: neither mounts `ToneTuning`, so `flat` there would
leave them with no tone map at all and clip their neon to white.

### Why Neutral

`tone.mapping` spec default → **`Neutral`** (Khronos PBR Neutral). Verified-this-session against the
installed `postprocessing@6.39.4`, `build/index.js:13481` — `ToneMappingMode.NEUTRAL` maps to three's
`NeutralToneMapping`.

| Candidate | Weighing against `golden-reference/cruise-lighting.png` |
|---|---|
| **Neutral** | **chosen** — hue-preserving highlight rolloff; the saturated orange core survives |
| ACESFilmic | the known skew: bright saturated orange rides toward yellow then white. Our primary colour is the one it damages most |
| AgX | desaturates hard toward white by design and lifts blacks — kills both the neon and the black deck |
| Reinhard | no shoulder worth the name; the whole frame goes milky |
| Cineon | dated film emulation, hue shifts in the highlights |
| None / Linear | clips. White cords with an orange halo — the inverse of the reference |

The reference is the argument: its rim cords read **saturated orange at their brightest**, and only the
exhaust cores go white.

## The re-dial, and the finding

Driven live at `/test-level` through the Chrome extension, writing `localStorage['slur.tunables']` and
reloading (the store is a module singleton — `tunables.ts:198` runs `restore()` at import, so there is
no window handle to poke).

**Every prediction about the over-bloom was wrong.**

| A/B | Result |
|---|---|
| `bloom.threshold` 0.9 → 1.4 | almost no change |
| `rail.emissive` 2 → 0.8 | no change |
| `rail.emissive` → **0** | near edge *still* a white smear |
| **`emitter.intensity` 10 → 0** | **smear gone; rails snap to thin saturated cords** |

The blowout was the **emitter array** — `emitter.intensity` 10 over `emitter.range` **690u**
(`tunables.ts:98-99`), line lights washing the deck along the full rail length. Dialled when ACES was
compressing everything downstream; with ACES gone it dominates the frame. The rail strips
(`track-rail.tsx:93` — `strip.emissiveIntensity = num( 'rail.emissive' )`) and the bloom pass were
never the problem, which is why the first two A/Bs moved nothing.

**Landed into `NUMBER_SPECS`:**

| Key | Was | Now |
|---|---|---|
| `emitter.intensity` | 10 | 1.5 |
| `bloom.threshold` | 0.9 | 1 |
| `bloom.intensity` | 0.45 | 0.7 |
| `fill.point` | 1.2 | 25.6 |
| `fill.pointBack` | 8 | 4 |
| `fill.pointLift` | 6 | 0 |
| `fill.pointDecay` | 0 | 0.1 |
| `fill.pointDistance` | 0 | 140 |
| `fill.pointColor` | `#7d8ea3` | `#5f6367` |

The `Fill` block is the owner's own dialling, landed as spec defaults **because a `reset` ate it during
this session**. It was recovered from the previous handover's recorded values. Spec defaults are now the
protection against that happening again.

**Tested and reverted, no gain:** `deck.metalness` 0.9 → 0.5 and `fill.point` 25.6 → 50 both left the
near deck essentially unchanged. `deck.metalness` stays at Codex's 0.9 — no reason to move an
art-direction value for nothing. Note this contradicts the *second pass* of the previous handover, which
found metalness to be the only lever; that reading held at `fill.point` 1.2, not at 25.6.

## Docs

`conventions/r3f.md` §"Tone mapping" — the "Open … **not done**" paragraph is replaced by what is now
true: every gameplay Canvas carries `flat`, which canvases do not and why, and the Neutral rationale
with the reference cited. `.claude/rules/r3f-rendering.md` was already correct from the previous
session's `toneMapped: false` removal.

## Still open — none of them is a dial

- **Inboard amber deck seams.** The reference carries marigold across the full track width; our floor
  only has `isOuterEdge` rails, so the deck goes near-black at bottom-centre. Content.
- **`BOUNDARY_W = 1.0u`** against the reference's ~0.2–0.3u cord. Geometry, and it feeds collision.
- **The sky reads navy** where the reference nebula is desaturated grey. `ibl.*` and the dome, separate
  from the tone pipeline.
- `ART_MATERIALS.md` §7 decisions-and-departures entries.
- Panel is `/test-level` only.
- **Revert before merge:** fog (`game-environment.tsx`).
- `perf.dpr` — spec 2, still unasked.

## Commit

Everything landed in **`4cf3a84`** *"feat(client): rebuild the corridor look — rail, deck, lighting and
grade"* — committed by a **parallel process** in the window between this session's `git add -A` and its
`git commit`, which is why the message is not the one this session wrote. Verified present in `HEAD`:
`flat` on both canvases (reformatted multi-line by biome, prop intact), all nine spec values, and the
`conventions/r3f.md` rewrite.

That commit also carries `near: 1, far: 1000` on both cameras, which this session **did not write** —
not present when the files were read. Likely the same parallel process; issue #128 covers exactly that
default. **Worth checking before the branch merges.**

## Gotchas that cost time

- **The extension's tab was `document.hidden: true` twice.** rAF is throttled to zero there, so the
  canvas never renders and every screenshot is black — and a `javascript_tool` call that awaits rAF
  hangs until the 45s CDP timeout. `resize_window` works on a hidden window but does **not** raise it.
  Only the owner can bring it forward.
- **The owner and the agent share one `localStorage`.** Mid-session both were dialling; `tone.exposure`
  moved from 1 to 3 under the agent's feet and the A/B chain had to be restarted. Agree who drives.
- **`reset` wiped the owner's whole dialled set**, `Fill` included. The previous handover's recorded
  numbers were the only copy. Write dialled values into a doc *before* the session that might reset them.

## HANDOVER — safe to `/clear` from here

Tree is **clean**, everything committed on `feat/test-level`. Next steps, in order:

1. **Check the `near: 1, far: 1000` camera change** that arrived with `4cf3a84` (see above).
2. **Re-dial the emissives that have no knob** now that bloom sees true HDR — finish gate 2.4, pickups
   3, bolts 4, `mono.seam` 10, `rim.emissive` 6. All hard-coded; each is a code edit.
3. **Inboard amber deck seams** — the largest remaining gap against the reference.
4. `BOUNDARY_W`, the sky, `ART_MATERIALS.md` §7, `perf.dpr`, the fog revert.
