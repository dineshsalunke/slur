# Task 1 — cheap path: the build plan

Written 2026-09-19, against `CHEAP-PATH-BRIEF.md`. **Plan only — no code written yet.** Three open
decisions for the owner are marked **[DECIDE]**; everything else is settled by the brief.

> ## ⚠ ALL FOUR DECISIONS ARE CLOSED — 2026-09-19. Read this before the plan below.
>
> The owner answered the three `[DECIDE]` items, and the build that followed found a fourth. **The `[DECIDE]`
> blocks in §1, §2 and §3 are historical** — the answers are here, and the as-built detail is in
> `HANDOVER-CHEAP-PATH.md`. Code is committed at `643af5a` (+ the fov fix below).
>
> **1 — Mapping: option A, the sphere PATCH.** Approved as recommended, on the ground the plan gave: it
> deletes a shader rather than trading one for another, and the fidelity error lands in soft cloud. The catch
> was load-bearing — a stock sphere's default UVs *are* equirectangular, so "texture instead of noise" would
> have silently shipped the mapping the brief rejects. **Built.**
>
> **2 — Cone size: author the horizontal, DERIVE the vertical from the image's real aspect.** A patch runs
> UV 0–1 across `phiLength × thetaLength`, so any authored pair that drifts from 1672:941 renders the planet
> oval. `sky-backdrop.tsx` computes `fovVDeg = fovDeg / (image.width / image.height)`. **Built.**
>
> **2b — the fourth decision, which neither the plan nor the owner's first pass caught: `fovDeg: 120` was
> UNDER-SPEC.** Both derivations omitted camera yaw. `SkyFollow` copies camera *position* only, never
> rotation, so the patch is world-fixed and the camera yaws inside it. Sustained max strafe lags the
> rubberband by `strafeClamp / follow` = 80/16 = **5u** at a look distance of `back + lookAhead` = 18–21u →
> **~15.5°** of yaw, against the "~4°" the code comment claimed. Coverage need is `108 + 2·15.5` ≈ **138.5°**.
> **Raised to 140°** — the owner's packet proposed 160, but 138.5 is the floor and 160 pays 14% more
> composition zoom-out than the geometry demands for a *transient* excursion that the edge fade degrades to
> dark, not to hard void. Final value is still an eye call at the gate; 140 is the floor, not the answer.
> `sky-config.test.ts` now carries the yaw term, so the number cannot silently drift back.
>
> **3 — Star bearing: the FRAME BUG is real and is fixed; the VALUE is deferred to the gate.** Bearing 0 did
> point *behind* the player (`0 = −Z`) while its own comment claimed "the game's forward view", so the scene's
> one real light was aimed backwards. Now `skyDirection`, `0 = +Z`, growing toward screen-right (world −X),
> pinned by a test that projects through a real three `PerspectiveCamera` rather than re-asserting the algebra
> that produced it.
>
> The *value* is genuinely contested and only the owner's eye can settle it:
>
> | | new-frame bearing | basis |
> |---|---|---|
> | owner's packet | **35°** (given as 215° in the old frame) | eyeball read; nebula's upper-left wisps corroborate |
> | as-built | **66°** | limb circle-fit, centre (1679,622) r719px, **rms 4.2px**; polar sweep → terminator at 169° → star 79° screen-azimuth from the planet |
>
> Both put the star right of forward, so the real question is narrow: **left-of-the-planet (35°) or
> straight-above-it (66°)** — 31° apart. Measurement outranks eyeball, so **66° ships as the default**, but
> the packet's "215 = 55 + 180, and that coincidence is the tell" is a different account of history than the
> as-built "55 put the star 27° to the planet's *right*, the mirror of the image" — and both cannot be true.
> It is a slider. **Settle it at the gate.**
>
> **Knock-ons, both already satisfied:** `celestial-body.tsx` is deleted and `bearingDeg: 28` was not carried
> forward; and the `<Lightformer>` rig and the `DirectionalLight` read **one** source — `star-light.tsx:21`
> and `sky-environment.tsx:49` both call `skyDirection( config.starBearingDeg, … )` — so they cannot drift.

Facts established while planning (this session):
- `origin/art/procedural-bg` is pushed at `6d52029`, identical to `art/background` HEAD. The procedural work
  is safe; nothing below risks it.
- `nebula-backdrop.jpg` is **1672×941 (16:9)**, 368 KB.
- The existing `scene-backdrop.tsx` is exactly the mechanism the brief forbids — `attach="background"`, and
  its own header comment admits it "fills the viewport and does NOT parallax". Retiring it is the fix.

---

## 1. ⚠ "Swap the ShaderMaterial for a textured material" is not sufficient — and here is why

A sphere's **default UVs are equirectangular**. Putting the jpg on a stock `sphereGeometry` with a
`meshBasicMaterial` *is* the equirect mapping the brief rejects: the image would wrap 360° horizontally and
180° vertically, stretching the composition and smearing the planet across the poles. So "texture instead of
noise" needs one more decision about **how** the framed image lands on the dome.

The real constraint is that a 16:9 framed composition covers a **cone**, not a sphere. It cannot fill all
view directions without either distorting, repeating (which doubles the planet — forbidden by brief §3.1),
or leaving sky uncovered.

**[DECIDE] Two ways to map it:**

| | **A — sphere PATCH (recommended)** | **B — projection shader** |
|---|---|---|
| Geometry | `sphereGeometry` with `phiLength`/`thetaLength` — a spherical rectangle subtending an authored FOV. UVs run 0–1 across the patch for free. | Full sphere, tiny fragment shader doing a gnomonic (perspective) direction→UV projection. |
| Material | Stock `meshBasicMaterial`. **Zero custom shader.** | Custom `ShaderMaterial` — much simpler than the noise one, but still a shader to own. |
| Fidelity | Maps a perspective render onto a spherical rect — not a perfect inverse, but the content is soft nebula and the error is imperceptible. The planet limb changes shape very slightly. | Exact reproduction of the original framing when looking down the patch's centre at the authored FOV. |
| Outside the cone | Nothing drawn → the scene's dark background shows. Needs an edge treatment (below). | Same problem, same treatment. |

**Recommendation: A.** It deletes a shader instead of trading one for another, it uses stock geometry, and
the fidelity difference lives in soft cloud where nobody can see it. Precedent: the standing memory that the
boards are a **look target, not physics** — "a cheap non-physical trick that matches is legitimate".

**Edge treatment, either way.** The patch has a hard border. Plan: size the cone generously (~150° × 100°)
and fade the texture's alpha to zero over the outer ~10°, onto a flat dark colour sampled from the jpg's
darkest corner. In-game this is likely never seen (see §2); in `/iso-sky` — which orbits freely by design —
it will be, and a soft fade to void reads as "the nebula ends" rather than as a bug.

## 2. How much does the camera actually yaw? — must check before sizing the cone

If SLUR's chase camera stays near-forward, the cone only has to cover a narrow yaw range and §1's edge
problem is academic in-game. The track is a **straight ribbon** and the camera chases down it, so the
reachable yaw is probably small — but that is **inferred, not verified**. First implementation step is to
read `camera/chase.ts` and establish the real range, then size `fovDeg` from it with margin. Do not guess.

## 3. Lighting — the part that actually has to work

Display and lighting are decoupled; that is the whole point of the pivot, and it dissolves README §2's
"dark sky is a dark light source" tension because the light is no longer derived from the picture.

- `<Environment frames={1} background={false}>` with `<Lightformer>` children. Children path = local render
  to a cubemap, **no CDN**, `preset` stays forbidden.
- Rig shape (starting point, to be tuned at the gate): one large cold **rect** keyed to the star bearing
  doing the rim light on the far rock field; one dim opposite-side fill so unlit faces are not pure black;
  one broad low-intensity **ring** for ambient wrap.
- Keep `star-light.tsx` as the one real `DirectionalLight`. It already reads the shared bearing and already
  solves the camera-locked-target trap (the default target sits at the world origin, which would swing the
  direction over a race's 8000u of travel).

**[DECIDE] The star bearing almost certainly has to move, and it is currently authored at `55°`
(upper-right).** In the jpg, the rim-lit crescent runs down the planet's **left/upper-left** limb, and the
planet sits at frame right — a crescent on that side means the star is to the **left of the planet**, i.e.
well inboard of 55°, possibly left of frame centre. Brief §3.2 makes agreeing with the baked-in lighting a
hard requirement. Proposed method, so this is derived rather than eyeballed: take the crescent's brightest
point on the limb, and the limb's centre of curvature; the direction from centre to that point projects the
star's bearing. Then confirm by eye at the gate. **Flagging rather than changing it, because `55°` is a
value you eye-tuned for the nebula's own lighting.**

## 4. Keep / retire

**Keep:** `SkyFollow` · `/iso-sky` · `IsoLab` `rig={false}` · roughness probes (now the *primary* gate —
they are how the Lightformer rig is proven to light anything) · `reference-boards.ts` additions incl. the
`nebula-backdrop.jpg` entry · `star-light.tsx` · all `.claude/art-pass/**` docs.

**Retire (preserved on `art/procedural-bg`):** `procedural-dome.tsx` (the four-layer noise shader) ·
`celestial-body.tsx` · the noise knobs in `sky-config.ts` · the mask/emission/dust sections of the tuning
panel and the uniform-pushing in `tunable-sky.tsx` · `scene-backdrop.tsx` at slice 4.

**Agreed on dropping `celestial-body.tsx`** — the jpg already contains the rim-lit limb, so a procedural body
doubles it. No objection to raise. Note the consequence: the planet is then only visible when looking down
the patch, which is fine because that is where the composition was framed.

## 5. Commit sequence (on `art/background`, per brief §4)

Agreed — the diff reads honestly as built / measured / pivoted, and the removals are whole-file deletions,
which review cleanly. No history rewrite.

1. `art(sky): retire the procedural nebula — the target was the asset we ship` — deletions + the why.
2. `art(sky): put the backdrop on the camera-locked dome` — the textured patch, `fovDeg` sized from §2.
3. `art(light): author the environment rig` — `<Environment>` + Lightformers + the re-derived bearing.
4. `art(sky): swap into environment.tsx, retire scene-backdrop.tsx` — slice 4, the bitmap-as-background dies.
5. Docs update.

## 6. Definition of done — unchanged from brief §5

Sky rotates on yaw and does not translate · roughness probes differentiate at `rig={false}` · light
coherent with the jpg · no CDN · bloom on and off · full verify gate green.
