# HANDOVER — sealed deadly block (#164), final

Written 2026-09-20 by the `art/sealed-block` lane at retirement. **This file assumes you have never seen
the lane's transcript.** `LANE-STATE.md` and `LANE-FACTS.md` sit beside it; this one is the summary that
stands alone. Where the three disagree, prefer this file for anything about the seams and the wear, and
`LANE-FACTS.md` for the raw lighting measurements, which are unchanged.

The work is in PR **#175** against `dev`, branch `art/sealed-block`, head `1b335a4`. The authority for
every decision below is `docs/art-direction/blocks/28_non_destructible_blocks_SPEC.md` ("board 28"), which
supersedes board 10 and `handoff/04_OBSTACLES.md`; boards 25–27 are history. `docs/art-direction/` is
read-only. `docs/ART_SCALE_REFERENCE.md` remains the sole dimensional authority — board 28 sets no numbers,
saying of itself that "this generated painting is not a working procedural system".

---

## 1. What #164 shipped

Three modules under `apps/client/app/game/scene/`, plus two lab routes. The block is a single
`meshStandardMaterial` on a purpose-built geometry, with a world-space `onBeforeCompile` patch carrying
everything board 28 asks for in the way of surface variation. There is no texture, no second mesh, no
per-footprint authored model.

### The chamfered shell — `sealed-block-geometry.ts`

`sealedBlockGeometry({ w, h, d })` returns a sealed rectangular cuboid with restrained chamfers: six face
quads, twelve chamfer strips, eight corner triangles — 44 triangles, non-indexed and flat-shaded. It is
non-indexed on purpose. A chamfer whose normals are smoothed into its neighbouring faces is a rounded box,
and board 28 excludes rounding; keeping the facets independent is what makes the edge read as a cut rather
than a fillet.

`SEALED_BLOCK_BEVEL = 0.12` is in **world units, not a fraction of the block**. This matters more than it
looks: a fractional bevel would draw a visibly wider strip on an 8u axis than on a 3.5u one, and the family
is supposed to differ in footprint, not in edge treatment. The value is clamped to
`0.45 × min(half-extent)` by `sealedBlockBevel()`, which is the one definition of that clamp — the geometry
builder and the seam code both call it, so they cannot drift. Past that clamp a chamfer stops reading as an
edge treatment and starts reading as a taper, which board 28 also excludes.

**Where the winding rule bites.** Every polygon is emitted through `pushPolygon( sink, poly, want )`, which
takes the normal you *intend* and reverses the vertex order if the cross product disagrees. Nowhere in the
file is a vertex order reasoned about by hand. This is not defensive tidiness — a hand-picked order on a
chamfer strip or a corner triangle inverts the facet silently, the block renders those facets unlit, and
every gate in the project stays green, because no test can see a black triangle. The corner triangles in
particular were confirmed present and correctly oriented only by looking at a rendered frame. If you touch
this file, derive the winding; do not reason about it.

The geometry is also the physics hull, and a two-directional AABB assertion in
`sealed-block-geometry.test.ts` pins that in both directions: no vertex escapes the envelope, **and** the
envelope is still reached on every axis. The chamfer cuts inward from the corners while the six faces keep
touching the box, so the block never kills a player on apparent empty air and never draws short enough to
look hoppable.

### The perimeter walk, and why the inset rectangle is the trick

Board 28 wants marigold seams that are **vertical only**, at variable positions, with more than one
permitted. The implementation parameterises a point on the block by a single **perimeter coordinate** `u`
that walks the four side faces. Because `u` never varies with height, a band of constant `u` is vertical by
construction — verticality is a property of the parameterisation, not something the code checks.

The walk runs anticlockwise from the `+X/−Z` corner: `+X` face over `[0, 2b)`, `+Z` over `[2b, 2b+2a)`,
`−X` over `[2b+2a, 4b+2a)`, `−Z` over `[4b+2a, 4b+4a)`, where the face is selected by whichever of
`|n.x|`, `|n.z|` dominates.

The subtle part is what `a` and `b` are. They are **not** the block's half-extents. They are the half-extents
of the **inset** rectangle — `w/2 − c` and `d/2 − c`, where `c` is the clamped bevel — and the fragment's
offset from the block centre is *clamped* to that rectangle before `u` is computed.

Use the true half-extents and the corners do not agree. A vertical chamfer strip is a shortcut across the
corner: points on the `+X/+Z` strip satisfy `x + z = hx + hz − c`, not `hx + hz`, so the `+X` branch and the
`+Z` branch return values `c` apart and a seam crossing that corner **steps sideways by the bevel width**.
Clamping to the inset rectangle collapses the whole chamfer strip onto a single perimeter value, and then
both branches return exactly the same number. Verified algebraically at all four corners: `u = 2b`,
`2b + 2a`, `4b + 2a`, and `0 ≡ P` where `P = 4(a + b)`. A seam that lands on a corner therefore **wraps** it
as a continuous band, which is also the visually correct behaviour. The cost is that such a seam is widened
by the strip width, 0.12u, which is below the resolution of anything anyone will look at.

### The `|n.y|` mask

Board 28 is explicit that "Top-face luminous returns and glowing outlines are not part of the selected
direction". The seam term is multiplied by `1.0 - smoothstep( 0.2, 0.45, abs( n.y ) )`, where `n` is the
world-space shading normal, recovered in the fragment shader with three's
`transformNormalByInverseViewMatrix( normal, viewMatrix )` (`vNormal` is view space; this is the current
helper, not the `@deprecated r185` `inverseTransformDirection`).

The thresholds look arbitrary and are not. **The shell only ever presents `|n.y| ∈ {0, 0.577, 0.707, 1}`** —
0 on the four side faces and on the vertical chamfer strips, 0.577 on the corner triangles, 0.707 on the top
and bottom chamfer strips, 1 on the caps. Any threshold strictly between 0 and 0.577 partitions that set the
same way, so the mask is exact rather than tuned: sides and vertical strips keep the seam, everything with a
vertical component loses it entirely. The exclusion holds mechanically, not by care, and it cannot drift when
someone changes the bevel.

This also silently resolved a concern raised at the previous seam: under the lab rig the top chamfer band was
the brightest feature on the block and read close to a "glowing outline". It is a *lit* facet, not an emissive
one, so it was never a top-face luminous return in board 28's sense — but the `|n.y|` mask means no emissive
is ever added to it, so the seams did not make it worse. Whether the lit band itself is acceptable is still an
art-direction judgement for the owner, and was flagged, not resolved.

Seam colour is `MARIGOLD_EMISSIVE × MARIGOLD_REFERENCE_INTENSITY` **imported** from `track-materials.ts`
(gameplay tier per `ART_MATERIALS.md` §2). It is never a locally invented number, which is why
`MARIGOLD_REFERENCE_INTENSITY` still being unmeasured did not block this work. One non-obvious fact, verified
against the installed `three@0.185.1`: `THREE.Color` already holds **linear working-space** components once
ColorManagement converts the sRGB hex, and a custom uniform is uploaded raw, so converting again in the
uniform builder would darken the seam. The code deliberately does not convert.

### Seam placement — `sealed-block-variation.ts`

Count and position derive from one per-block seed, which itself derives from the block's world placement
(`sealedBlockSeed( x, z )`). A block's look is therefore reproducible from where the track descriptor puts
it, with no seed attribute to plumb through the instanced renderer later.

Placement is **stratified, not free**: one seam per equal arc of the perimeter, jittered inside the middle
70% of its arc. Free placement lets two seams land on top of each other and read as one fat seam; stratified
placement makes that impossible by construction. Each seam is then pushed clear of the corners by
`offCorner()`, because a seam sitting exactly on a corner reads as a glowing outline of the silhouette —
which is the thing board 28 excludes by name. See §3 for an important correction about that guard.

All of this is plain TypeScript, deliberately, so it is testable without a GL context. `sealed-block-variation.test.ts`
pins reproducibility from the seed, genuine variation across seeds, seams staying inside `[0, P)`, the minimum
gap, the corner keep-out, the cap at the shader's four seam slots, and the seam count staying in range.

### The wear mechanism

Board 28 makes "broad irregular wear patches varying sheen and muted graphite value" the family's variation
mechanism, with placement, scale, coverage, contrast and a repeatable instance seed named as the controls.
All five exist as named fields on `SEALED_BLOCK_WEAR` plus `strength`.

The field is **3D value noise of world position**. Because it is sampled in 3D on the world position, it is
inherently projection-free: there is no UV, no projection axis, and therefore **no triplanar blend is needed
at all**. This is worth knowing because a lot of prior investigation on this lane went into triplanar
mechanics. That investigation is not wasted — the wear still needs the same `vWorldPos` varying — but nobody
should go looking for a triplanar blend in this code, because there isn't one and there shouldn't be. For the
record: `three@0.185.1` does ship `triplanarTextures`, but it is TSL/node-material only, this client imports
nothing from `three/tsl` or `three/webgpu`, drei 10.7.8 has none, and the built-in's `positionLocal` default
would have scaled the pattern with the instance anyway — exactly the anisotropy this design avoids.

Two hooks, both before the normal exists and neither needing it. Chunk order verified this session in
`meshphysical.glsl.js`: `map_fragment` at :171, `roughnessmap_fragment` at :176, `normal_fragment_begin` at
:178, `emissivemap_fragment` at :182.

- `map_fragment` → the graphite value, `diffuseColor.rgb *= mix( 1.0, tone.x, wear )`.
- `roughnessmap_fragment` → the sheen, `roughnessFactor + tone.y * wear`, which lifts 0.52 to **0.60**: the
  top of M2's 0.45–0.60 band, never outside it.
- `emissivemap_fragment` → the seams, added to `totalEmissiveRadiance`.

**Wear ships at strength 0**, and a test pins `SEALED_BLOCK_WEAR.strength === 0` so it cannot be raised by
accident. Board 28 says "Clean is a legitimate endpoint of the wear range", and the measurements in
`LANE-FACTS.md` say both of board 28's wear dials are exhausted at 2–4 levels of 8-bit on the one face that
carries any signal at all, and at exactly zero on the face the player sees. Tuning is deferred to **#170**,
the lighting fill — not skipped, deferred, because there is currently nothing for wear to modulate.

### Mechanism choice, for the record

The material patch was chosen over four alternatives: per-footprint authored geometry and a painted texture
atlas (both excluded by board 28's own authoring intent, which asks for "shared parameterized cuboid forms and
shared material variation over individually authored models or painted block textures", and both broken by the
anisotropic per-instance scale); a second additive emissive mesh for the seams (a second source of truth for
where a seam is, z-fighting, and it solves only half the problem since wear still needs a material path); and
vertex colours baked at geometry build (the shell is 44 flat triangles, so a 0.14u seam would quantise to whole
facets — no resolution at all). The full weighing is in the PR body.

### Instancing-readiness

The patch computes its own world position through `modelMatrix * instanceMatrix` under `#ifdef USE_INSTANCING`,
so it is correct for the lab's one-mesh-per-block **and** for the instanced game renderer without change. It
carries its own `varying` rather than using three's `worldPosition`, which `worldpos_vertex` declares only under
`USE_ENVMAP || DISTANCE || USE_SHADOWMAP || ...` — it exists today only because the scene happens to have an
`<Environment>`, and deleting that would silently break a patch that leaned on it.

---

## 2. What a fresh reader would get wrong

**The lab rig is not the art direction.** `/iso-block` runs `ambientLight 0.5` plus a `directionalLight`. It
makes the block look fine while the race view renders the same face rgb(0,0,0). Both are true at once. Take
geometry from a lab frame — silhouette, facet read, seam continuity — and never take levels from one.

**`/iso-block`'s debug toggles start ON.** `grid` and `rig` both default `true`; board compare mode starts
`'off'`. Check a lab's defaults before trusting any frame from it.

**The bevel is world units.** Reading `0.12` as a fraction and "fixing" it to scale with the block would
reintroduce exactly the inconsistency it exists to prevent.

**`a` and `b` in the seam code are the inset rectangle, not the block.** Substituting the true half-extents
looks like a simplification and silently reintroduces the corner step. §1 explains why.

**Do not "correct" for anisotropic instance scale in the shader.** It does not break normals on 0.185 —
`defaultnormal_vertex` divides by the squared column lengths first, which is the inverse-transpose for our
scale+translate matrices. A shader that compensated would be wrong.

**`onBeforeCompile` is one slot per material.** `patchEmitterLight` already holds the floor's
(`track-floor.tsx:249`). If the block is ever given rail-emitter light, the two patches must be **composed**,
not both assigned. Relatedly, any patch whose GLSL text varies with a JS value must override
`customProgramCacheKey` or three serves a stale program — ours does not need to, because every parameter is a
uniform and the generated source is constant. If you make the GLSL conditional, that stops being true.

**Frame-tap refs are gitignored.** A frame reproduces by re-tapping, not by looking in git. Names quoted in
this file and in the PR are tap names, not files you will find.

---

## 3. A correction that must not propagate

On the first frame I read the third block's seam as sitting **on** a vertical corner, and added the
`offCorner()` keep-out in response. Measuring the actual placement through the real module afterwards showed
that read was **wrong**.

That seam is at `u = 12.182` on the **−X face**, and the nearest corner is at `u = 12.78` — it is **0.598u
clear**, more than twice the 0.28u keep-out. The lab camera sees the −X face nearly edge-on, and the
foreshortening makes a face seam near an edge look like an edge glow. Nothing was on a corner.

The keep-out is kept: it guards a case that genuinely can occur, it is cheap, and it is tested. But it **did
not bind on any of the three lab seeds and did not fix a visible defect**, and the before/after frames are
pixel-similar for that reason and not because HMR failed to apply. Anyone re-reading those two taps should
know that before concluding something is broken.

Measured placements, through the real module, for the lab family at x = 0 / 8 / 15:

| footprint | seed | count | seam `u` | face | to nearest corner |
|---|---|---|---|---|---|
| 4 × 8 | -1148698886 | 1 | 14.739 | −X | 3.219u |
| 5.5 × 5.5 | -1911139206 | 1 | 6.733 | +Z (far) | 1.473u |
| 3.5 × 5 | -483544950 | 2 | 2.092 / 12.182 | +X / −X | 2.092u / 0.598u |

---

## 4. NEEDS-DECISION — seam placement on the presented face

**No block in the lab family presents a seam on its −Z face — the face an approaching player sees.** All four
seams across the three blocks landed on `+X`, `+Z` or `−X`.

This is not a bug, and the numbers are what make it a real question. That face measures **rgb(0,0,0)**:
direct `0.00e+0`, env diffuse `4.81e-5`, env specular `2.91e-4`, total `3.39e-4` against a gameplay-marigold
yardstick of `8.530e-1`. `dotNV` is 0.928, so the face is seen nearly head-on and Fresnel sits at its minimum
— there is no grazing-angle rescue. Both scene lights come from ahead and above and give it `N·L = 0.000`.
The chamfer recovered exactly one lit vertical edge on that silhouette (0.3388 on the `−Z/−X` strip, 0.4646
on the corner); every other presented-face chamfer facet is still 0.0000.

So on the face the player actually looks at, the **emissive seam is the only thing that can carry any
information at all** — and with a seam count of 1–3 distributed over the full perimeter, it lands there only
by chance. A block can present a completely featureless black rectangle.

The decidable question: should placement be **biased toward the −Z face**, or the minimum seam count raised,
so that every block presents at least one seam to an approaching player? Against it: board 28 says "variable
positions", and a guaranteed front seam is a regular feature the spec did not ask for, arguably drifting
toward the "glowing outline" read it excludes. For it: the alternative is a family whose surface treatment is
invisible in play on most blocks. **This is an art/gameplay call and was deliberately not taken by the lane.**

Note this interacts with **#170** (the low fill from behind the player). If #170 lands and lifts the presented
face off zero, the question softens considerably, because wear and value would then carry information there
too. It may be worth deciding *after* #170 rather than before.

---

## 5. Every `[unmeasured]` claim, and the frame that settles it

**`/iso-block-wear` has never been looked at.** This is the most important one. The route exists and returns
200, and it sweeps wear strength 0 → 0.6 → 1 on one footprint and one seed so the dial is the only variable in
frame. But **no frame of it has been captured**, so the wear GLSL — the value noise, the coverage and contrast
mapping, both hooks — is unproven on pixels. It ships at strength 0, so nothing it computes reaches a shipped
frame and no user-visible risk is being carried; but if the noise function is wrong, nothing currently would
tell you. *Settles it:* reload a Chrome tab onto `http://localhost:<client port>/iso-block-wear`, then
`curl 'http://localhost:<client port>/__frame-tap?name=sealed-block-wear-01'`. Do this first.

**How the block reads at race speed.** The iso lab cannot answer it — it is a different camera, a different
rig, and a different dwell time. *Settles it:* a tap of `/art-lab`, which flies the real track with the real
chase camera. Note `/art-lab` defaults `shipBox` ON and `ships` OFF, and that debug slab has already produced
one phantom bug on another lane; turn it off before reading anything.

**The in-game read of the vertical chamfer strip carrying 0.3388 on the presented face.** Under the lab rig at
lab zoom the vertical strips do **not** resolve — the near corner reads as a hard value step, not a band. The
facet is definitely in the geometry (pinned by a test on the `−Z/−X` facet); the open question is purely
whether it separates visually in play. Projection arithmetic says it subtends about 5.3 px at 1080p at chase
distance, so it is marginal by construction. *Settles it:* the same `/art-lab` tap.

**Whether a base-contact seam reads per-block or as a continuous route glow.** Never built, never seen. Only
relevant if someone adds a horizontal base seam, which the current `|n.y|` mask would kill anyway. *Settles
it:* a `/art-lab` tap over a run of adjacent blocks.

**`MARIGOLD_REFERENCE_INTENSITY`.** Still unmeasured as an absolute. It does not block anything here because
the seam imports it rather than guessing a value, so the seam is correct-by-construction relative to every
other marigold in the game whatever the number turns out to be.

---

## 6. Boundaries this lane respected, and you should too

`docs/art-direction/` is **read-only** — it is ChatGPT's indexed working set, and a silent edit there
desynchronises both sides. Disagreements get written in a Claude-owned doc with an explicit decisions-and-
departures section and handed to the owner, never edited in place. All lighting belongs to **#170** and was
not touched: no edits to `sky-config.ts`, `sky-environment.tsx`, `star-light.tsx`, or any light anywhere.
`LETHAL_SURFACE`'s red at `track-materials.ts:35` is untouched; retoning it is the integration step *after*
#164, deliberately deferred, and red is excluded from the palette so it does need doing. `docs/ART_MATERIALS.md`
is untouched because its M2 correction already merged as **#168** — duplicating it would conflict.

Integration itself — putting this material on the instanced `track-blocks.tsx` renderer in place of the bare
`<boxGeometry />` and retoning `LETHAL_SURFACE` — is the next task and is **not** in #175.

## 7. Verify gate as it stood

On `1b335a4`: `pnpm typecheck` clean · `pnpm lint` 3 warnings, all the pre-existing `noExcessiveLinesPerFile`
baseline, comment ratchet clean on 14 changed files · shared **78/78** · client **93/93** (up from 85) ·
server **4/4** · `pnpm build` OK. The commit hook rejects a `Co-Authored-By` trailer; do not add one.
