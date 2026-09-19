# Task 1 — PIVOT to the cheap path (owner decision, 2026-09-19)

**This supersedes `LANE-BRIEF.md`, `HANDOVER.md` and `GATE-1-FINDINGS.md` for everything about *how* the sky
is produced.** Their measurements, traps and standing rules all still hold. Stop the procedural re-tune.

---

## 1. The decision, and the reasoning you need to not re-litigate it

**Use `nebula-backdrop.jpg` directly as the display sky. Light the scene from a separately-authored
environment (drei `<Lightformer>`s) plus one real `DirectionalLight`.**

Three facts drove it:

1. **The target was circular.** The boards were *composed over* `nebula-backdrop.jpg` (owner-confirmed). So
   the acceptance test for the procedural dome was "match this JPEG" — and we ship that JPEG. We were
   building an approximation of an asset we already own, then measuring it against the original and finding
   it short. The failed slice-1 gate was a symptom of that, not a setback inside it.
2. **The background is not load-bearing.** `INDEX.md` already records that the arc's "background first,
   because lighting flows from the environment" rationale was **falsified** — the sky lights only the far
   rock field and the planet; the track lights itself from its own emissives. The research separately
   measured ~55–65% of the upper frame as rock. This is a mostly-occluded element that does not light the
   thing the player stares at for 2.5 minutes.
3. **Only one justification for procedural survived scrutiny** — per-sector variation (board 06's six
   sectors). That is speculative today, and six bitmaps is a legitimate answer to it. "No bitmaps" was a
   *method* rule in the arc, never traced to a player-visible outcome. 368 KB is not a budget problem.

**The procedural work is preserved, not deleted** — branch `art/procedural-bg`, pushed, at `6d52029`
(all 8 commits: four-layer dome, tuning, celestial body, the real light). Revisit if per-sector variation
becomes a real requirement. Do not delete that branch.

---

## 2. What to build

**Display:** the jpg on the **camera-locked dome you already built** (`SkyFollow` in `procedural-sky.tsx`),
with the noise `ShaderMaterial` swapped for a textured material.

> **Do NOT use `scene.background = texture`.** It renders as a static fullscreen fill that does **not rotate
> when the camera yaws**. An infinitely distant sky must not *translate* (parallax was already killed on
> that reasoning) but it must *rotate*. **Equirect mapping is also wrong** — this jpg is a framed
> composition, not a lat-long map, so it would distort. The camera-locked dome is the answer, and it is the
> one you already have.

**Lighting — decoupled from the display, and this is the whole point.** The sky you *see* and the
environment that *lights* need not share a source. Use drei `<Environment>` with `<Lightformer>` children to
bake a small custom env map shaped to cold-rim the far rock field, plus one real `DirectionalLight` for the
star. This **dissolves the "central tension"** in `README.md` §2 ("art wants a dark sky, but a dark sky is a
dark light source") — that is only a tension if you insist on deriving the light *from the picture*.

**Verified-this-session against the installed packages** (drei **10.7.8**, three **0.185.1**):
- `Lightformer` — `form: 'circle' | 'ring' | 'rect' | 'plane' | 'box'`, plus `intensity`, `color`, `scale`,
  `target`, `map`, `toneMapped` (`core/Lightformer.d.ts`).
- `Environment` — accepts `children`, `frames`, `resolution`, `background: boolean | 'only'`, and
  **separate** `backgroundIntensity` / `environmentIntensity` / `environmentRotation` / `backgroundRotation`
  (`core/Environment.d.ts`). `EnvironmentPortal` is the children-taking path.
- **`preset="…"` remains FORBIDDEN** — it fetches from a CDN, and this must work offline and on the office LAN.

---

## 3. Two constraints that are easy to miss

1. **The jpg already contains the planet.** It has a rim-lit limb (bright thin crescent, upper right) — your
   own handover identified it as slice 2's subject. If the jpg becomes the sky, **that planet comes for
   free**, and a second procedural body would double it. Default to **dropping the procedural celestial
   body** from this path. Raise it if you think a foreground body is still wanted; do not just keep it.
2. **The jpg has lighting baked in, and your lights must agree with it.** The `DirectionalLight` bearing and
   the `Lightformer` placement must match the light direction implied by the image, or the rock field will be
   lit from one side while the sky implies another — incoherent in a way that reads as "wrong" without the
   viewer being able to say why. Derive the bearing **from the image**, and keep it as the single source of
   truth shared by the light and any flare, exactly as the old brief required.

---

## 4. Keep vs retire

**Keep — all still valuable:**
- `SkyFollow` (the camera-locked dome) — now carries the texture.
- `/iso-sky` route, `IsoLab` `rig={false}` toggle, the roughness probes. The falsifiable self-test is
  **more** relevant now, not less: a surface that looks identical at `roughness 0.2` and `0.9` still proves
  the environment is not lighting it. That is exactly how you gate the Lightformer rig.
- `reference-boards.ts` additions (boards 12/13), **plus the `nebula-backdrop.jpg` entry from
  `GATE-1-FINDINGS.md` §4.1** — still wanted, still the correct default reference for this route.
- All `.claude/art-pass/**` docs. They must ride into the PR (the folder is untracked on `dev`).

**Retire on this branch** (preserved on `art/procedural-bg`):
- The four-layer noise shader, `sky-config.ts`'s noise knobs, the sky tuning panel's mask/emission/dust
  sections. Keep any knob the textured path still needs (e.g. star bearing).
- Probably `celestial-body.tsx` — see §3.1.

**Branch strategy — recommended:** build the cheap path **on top of the existing `art/background`** and
remove the dead shader in an explicit commit. The PR then tells an honest story: built procedural, measured
it, pivoted, here is why. That is cheaper and far less risky than cherry-picking onto a fresh branch. If you
judge the diff unreviewable that way, say so and propose the alternative — do not silently rewrite history.

---

## 5. Definition of done

- Sky reads as the reference **because it is the reference** — no histogram tuning needed for the display.
- Sky **rotates** correctly with camera yaw and does **not** translate.
- The roughness probes **differentiate** (0.2 vs 0.9 visibly different) with `rig={false}` — proving the
  Lightformer environment actually lights, which the procedural path never achieved.
- Light direction is coherent with the lighting baked into the jpg.
- No CDN fetch; works offline.
- Bloom on **and** off.
- Full verify gate green:
  `pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build`

**Gate:** owner's eye at `/iso-sky` in the shared Chrome tab, then `/art-lab` at race speed.

No `Co-Authored-By` trailer. Do not bundle `git add` and `git commit` in one Bash call.
