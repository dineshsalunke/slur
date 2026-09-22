# The deck is a mirror, and the environment it reflects is now authored

**Date:** 2026-09-22 · **Issue:** #208 · **Branch:** `art/hdri-picker` (pointer only — see *Uncommitted*)

Diagnostic session that ended in a build. The day-long "everything is black near the camera" problem
was identified, and the fix is an authored environment instead of a downloaded one.

## What the darkness actually was

Owner's hypothesis going in: a world-space-driven `normal`/`metalness`/`roughness` map on the deck.
Test run: strip every map from the deck, flat `#c8c8c8` base. **The gradient survived.** A broad
light-to-dark sweep was still there on a deck with no maps at all — brighter only because the base
colour changed at the same time. That confound was mine and is recorded so the screenshot is not
over-read.

**The cause is that the deck is a mirror with no diffuse term.** At `metalness` 0.9 a conductor's
albedo *is* its specular F0 — there is no diffuse lobe for a light to land on. Deck brightness is
entirely "what does the environment look like in the mirror direction", and that direction sweeps
with the view: steep near the camera, grazing at the horizon. Near the ship it mirrors the dark lower
hemisphere at F0 ≈ 0.19 for `#303c45`; far away Fresnel drives reflectance toward 1.0 and picks up the
bright horizon. **Dark-near / bright-far is the signature of that, not of a texture.**

Which is why the lighting rig could not fix it. **You cannot light a mirror.** The back-fill added
earlier this session is nearly wasted on the deck for the same reason.

`docs/ART_MATERIALS.md` §7 had already written this down, before the lighting strip:

> *"The largest surface in frame is currently a dark mirror of the sky."* … *"consistent with the
> direction's 'warm reflected spill' only if the rig gives it something warm to reflect; today it does
> not."*

Same passage measures the deck's one visible highlight at **92% sky IBL / 8% directional / 0% rail
array**. The rails contribute nothing to the deck. Anything warm on that surface has to come from the
environment.

## THE ROOT CAUSE — found last, supersedes the section above

The environment explanation below is **secondary**. The owner's final test settled it: authored
environment set to **pure white on all three shells** (sky, ground, band, `#ffffff`), deck at
`metalness` 1.0 / `roughness` 0.02 — a mirror under a uniformly white sky, with no fog in the game
scene (fog exists only in the landing `environment.tsx`, which `/test-level` does not use).

**The gradient was still there.** A uniform white environment cannot produce one, so the environment
was never the cause.

**It is Fresnel on a conductor whose F0 is nearly black.** At `metalness` 1.0 there is no diffuse term
and the albedo *becomes* F0. `#303c45` in linear light is `(0.030, 0.045, 0.059)`, luminance
**≈ 0.043**. So the deck reflects **~4% head-on and ~100% at grazing** — a 23× ramp from the bottom of
the frame to the horizon. That is the gradient, and no environment can remove it.

**`#303c45` at metalness 1.0 is not a physically possible material.** Real conductors run F0 ≈ 0.5 –
0.95 (iron 0.56, chromium 0.55, titanium 0.62, aluminium 0.91). 0.04 is the canonical *dielectric*
value. Dark metal is dark from roughness or a coating, never from a low F0. A near-black albedo at
metalness 1 is black head-on and a mirror at grazing with nothing in between.

**This forces M1's open question.** `ART_MATERIALS.md` M1 specifies the deck as *"bare conductor —
exposed dark metal"* at metalness 1.0; those two halves contradict each other in PBR. M2 already took
the other branch for blocks — metalness 0.0, *"it keeps the block from going black when there is
little for a conductor to reflect."* **Dark graphite means coated dielectric, not bare metal.** The
deck, blocks and ship all need that call.

Confirming tests, either one slider: `Deck.metalness` → 0 should collapse the gradient (a dielectric
gets flat 0.04 specular plus a view-independent diffuse the back-fill can light); or
`Deck.plateColor` → `#ffffff` at metalness 1 should go flat bright mirror.

### Dropping metalness is NOT the recommended exit — it costs the metal

Owner's objection, and it is correct: metalness 0 gives 4% specular plus coloured diffuse, which reads
as painted or ceramic, not metal. **The constraint is that you cannot have all three of near-black
albedo, bare conductor, and an even ramp — pick two.**

**Recommended: keep `metalness` 1.0 and raise `plateColor` into real-conductor range.** The metal is
fully preserved — specular dominance, conductor tint, sharp reflections. What goes is *near-black
albedo*, which costs nothing here: **a metal's apparent darkness comes from what it reflects, not from
its F0.** Under this scene's near-black sky a conductor at F0 0.3 still renders dark, just *evenly*.
Darkness comes from the environment, which is free; metal comes from a real F0.

The ramp is `1 / F0`:

| `plateColor` | linear F0 | near→horizon ramp |
|---|---|---|
| `#303c45` (today) | 0.043 | **23×** |
| `#7c8590` gunmetal | 0.20 | 5× |
| `#a0a8b0` dark steel | 0.35 | 2.9× |
| `#e8e8e8` aluminium | 0.91 | 1.1× (flat) |

First thing to try: `plateColor` `#7c8590`, `metalness` 1.0, `roughness` back to 0.4. If it reads too
bright, **darken the environment, not the albedo** — that is the knob that preserves the material.
Roughness compounds it: at 0.4 the grazing end blurs, which is why the `roughness` 0.02 mirror test
showed the ramp at its worst.

M2's coated-dielectric branch stays available for genuinely near-black surfaces, but gloss then has to
come from `MeshPhysicalMaterial` clearcoat rather than conductivity — a larger change.

## The owner's mirror test, and why it settles the design

Owner set `metalness` 1 / `roughness` 0 — a perfect mirror, so the deck *shows* the HDRI rather than
interpreting it. The black band under the ship was revealed as **the studio's floor**.
`monochrome_studio_03` has a dark floor; `blocky_photo_studio` has a bright one, and the darkness went
away. Hence the owner's conclusion: we need a good HDRI.

Extended one step, and agreed by the owner: **we need a good *lower hemisphere*, which is three
numbers rather than a 4 MB photo.**

- A horizontal mirror sees the environment's lower hemisphere. In a photographic HDRI that is the
  floor the photographer stood on — a property these files were never authored to control.
- At the deck's real roughness (0.4, not the 0 used for the test) the env is blurred so hard that no
  detail survives. Only the low-frequency average reaches the deck, so the megabytes are discarded.
- The detail that *does* survive at low roughness is wrong for the fiction — a ladder, a workbench and
  studio equipment were visible in the deck.
- A photo studio can never contain marigold, which is what §7 says the deck must reflect.

## Built: the authored environment

`AuthoredEnvironment` renders three emissive shells into drei's cube portal
(`<Environment>` with `children` → `EnvironmentPortal`, verified in the installed drei 10.7.8:
`props.children ? EnvironmentPortal : EnvironmentCube`). `frames={Infinity}` so sliders are live;
`resolution={64}` because the content is near-flat colour.

| Shell | Role |
|---|---|
| sphere, `BackSide` | cool surround — what the deck reflects at grazing angles |
| circle below at `y = -40` | **the ground disc — the knob that kills the black under the ship** |
| open cylinder at the horizon | marigold band — the warm energy §7 demands, which no HDRI supplies |

`SceneEnvironment` owns the `authored | hdri` switch and the two scene-level dials
(`scene.environmentIntensity`, `environmentRotation.y`), which apply to either source. The HDRI picker
survives as the **A/B reference** you validate the authored rig against — that is now its job.

## Departure to resolve: `toneMapped={false}`

`.claude/rules/r3f-rendering.md` bans it project-wide (removed 2026-09-22). The three env materials
were written with it and then **complied** — it is gone. But the rule's rationale is screen appearance
and bloom, and these materials never reach the screen; they are rendered into a cube target used as an
IBL source, where tone mapping compresses the very values that do the lighting.

Worked around rather than exempted: virtual-scene intensities are kept at or below ~1 and absolute
level is carried by `Environment.intensity`, which multiplies *after* the texture is sampled.
**Owner call outstanding:** does an IBL-source material earn an exemption? If yes it belongs in the
rule as a stated carve-out, not as a silent re-add.

Second caveat: the portal's cube target is **not PMREM-filtered**, so roughness response is
box-filtered rather than GGX-convolved. With near-flat colour fields the difference is small, but it
is a real limitation if the authored env ever gains detail.

## IBL values read off the golden reference

`docs/art-direction/golden-reference/cruise-lighting.png` (read-only; approved cruise mood per its
`CRUISE-LIGHTING.md`) settles what the authored env should aim at, and it is **not** an evenly lit
deck. In the reference the deck is dark and its brightness comes almost entirely from **marigold
rail/seam lines smeared down it** as long vertical reflections. The near field is never black, but it
is lifted by a cold ambient plus warm pools, not by a bright sky.

Defaults set from it — **eyeballed from the image, not measured**:

| Tunable | Was | Now | Why |
|---|---|---|---|
| `Env.skyColor` | `#2b3a4d` | `#6b7d94` | cold key from above — monolith tops, grazing deck sheen |
| `Env.skyIntensity` | 0.35 | 0.4 | |
| `Env.groundColor` | `#8fa0b0` | `#2a323d` | reference's head-on deck is dim, not bright |
| `Env.groundIntensity` | 0.6 | 0.22 | lifts the near field without washing it out |
| `Env.bandIntensity` | 1 | 1.8 | the band is the dominant warm contributor, as the rails are in the reference |
| `Env.bandHeight` | 12 | 5 | tight horizon line, matching the rail lines rather than a broad glow |

## Near fill — the faked emitter between ship and camera

`NearFill` (`scene/near-fill.tsx`) is a `pointLight` that **rides the camera**, not the ECS: it copies
`camera.position` and offsets along `camera.getWorldDirection()`, so it lands between camera and ship
in every camera mode (chase, lobby orbit, spectator) with no `Render`-trait coupling and no query.
Scratch vector hoisted to module scope per the `useFrame` no-allocation rule.

Knobs: `NearFill.intensity` (40, candela — `decay` 2), `forward` (6), `height` (3), `distance` (45),
`color` (`#ffb964`, warm to match the reference's exhaust/pickup pools).

## The scanned metal maps — recommendation: keep procedural, add grain

`apps/client/public/textures/metal/Metal046B_1K-JPG_*` (Color, Displacement, Metalness, NormalGL,
Roughness; ~4 MB total) is **not wired up**, deliberately. The measured facts that decide it:

- The procedural canvas is `RES = 1024` covering `COLS × ROWS = 4 × 4` plates of `AUTHOR_PLATE_U = 4`
  — **16u × 16u, i.e. 64 px per world unit** (`track-texture.ts:7-13`).
- Baking the scan in as a detail layer at a useful tiling (4×4 per canvas) gives it only **256 px per
  tile**, which throws away almost all the micro-detail that makes a scan worth having. Keeping it
  would need `RES` 2048+, and the canvas set is four maps — memory grows as the square.
- The scan carries **no plate or groove structure**, so it can only ever be a detail layer under the
  procedural one, never a replacement.
- Plate size, groove width, bevel and wear are **live tuning sliders** that rebuild the canvas. A
  baked scan freezes none of that but does not participate in it either.

**Recommendation: keep the procedural pipeline and add a high-frequency grain layer** (value
noise / FBM) to the roughness and normal canvases, using Metal046B as the *visual target to match*
rather than as shipped assets. At 64 px/u the canvas can represent detail down to ~0.016u, which is
far finer than anything currently drawn — the missing realism is a grain layer that was never added,
not a resolution ceiling. This keeps the descriptor-driven generation ADR-000 asks for.

**Honest counterweight:** a scan gives better micro-realism for less effort, and if the grain layer is
attempted and still reads flat, wiring the scan as a second detail map via `onBeforeCompile` (with
independent tiling, avoiding the bake-resolution problem entirely) is the fallback. Not attempted this
session.

## Nothing here has been seen on screen

The Chrome extension was not connected for the whole session, so every default below is reasoned, not
looked at. The owner drove all four screenshots.

## Uncommitted — read this first

**Nine files are uncommitted on `dev`.** `git checkout`/`git switch` were blocked by the permission
classifier all session; the `art/hdri-picker` branch *pointer* exists but was never checked out.
First action next session: get onto the branch and commit.

```
?? apps/client/app/dev/env-store.ts
?? apps/client/app/game/scene/authored-environment.tsx
?? apps/client/app/game/scene/scene-environment.tsx
?? apps/client/app/game/scene/hdri-environment.tsx
?? apps/client/app/game/scene/hdri-boundary.tsx
?? apps/client/app/game/scene/back-fill.tsx
?? apps/client/app/game/scene/near-fill.tsx
 M apps/client/app/dev/tuning-panel.tsx
 M apps/client/app/dev/tuning-schema.ts
 M apps/client/app/game/scene/world-scene.tsx
```

The deck diagnostic was fully reverted — `track-floor.tsx` and `track-materials.ts` are byte-identical
to HEAD (`git diff --stat` empty). Maps and the graphite base are back.

Verification at handover: typecheck clean, lint clean (9 pre-existing warnings, none in new files),
145 tests pass.

## Next

1. **Raise `GRAPHITE_ALBEDO` into conductor range, keeping metalness.** Deck, rails, blocks and ship
   all carry near-black albedo at metalness 0.9 – 1.0, which is not a real material. Start at
   `#7c8590` (F0 0.20, 5× ramp) with roughness back to 0.4 and judge from there; darken the
   environment rather than the albedo if it reads bright. Everything else is downstream of this.
   Note `GRAPHITE_ALBEDO` feeds `tuning-schema.ts` defaults, and **the schema shadows the constant at
   runtime** — editing the constant alone is a no-op on screen (see the #202 lesson in the previous
   handover).
2. Re-judge the authored environment **after** that change. It was tuned against a surface that was
   throwing away 96% of it, so none of its defaults have been fairly tested.
3. `/test-level`, `Environment > source = authored`. `groundIntensity` is the
   black-under-the-ship dial; `bandIntensity`/`bandHeight` are the marigold horizon. A/B against
   `source = hdri` + `blocky_photo_studio`.
4. Write the `ART_MATERIALS.md` §7 departures entry, now owing **four** items: M2/M3 metalness from
   #206, the `toneMapped` carve-out question above, and M1's bare-conductor contradiction.
5. The rails are still metalness 0.9 at `#303c45` — same impossible material, not yet looked at.

## Related

- [[2026-09-22-graphite-family-and-the-hdri-plan]] — the handover this picks up. Its HDRI panel is
  built; its prediction that *"blocks and ships are expected to be black until an environment map
  lands"* was correct, and this note explains why an environment map alone was not sufficient.
- [[2026-09-22-lighting-strip]] — the removal that left the scene unlit.
