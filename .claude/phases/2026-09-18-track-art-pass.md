# HANDOVER — Track art pass (2026-09-17 → 18)

> **Read this first if you are picking up the art work with a fresh context.**
> Everything below is verified against the code as of branch `art/lab-fixes` @ `46e963f`.

---

## 1. Where we are in one paragraph

An external art-direction package (produced with ChatGPT) was adopted as the frozen scene/world direction
(**ADR-008**), then revised after we sent dimensional corrections back (**ADR-010**). Two review
instruments were built — `/art-lab` and `/art-gallery`. The **track floor** has been rebuilt as a generated
mesh with real thickness and a procedural graphite/panel texture. **The edge rail is next**, and it is the
piece that finally puts marigold on screen instead of the current blazing white.

## 2. State of the branches

| Branch | State |
|---|---|
| `dev` @ `0ffea71` | ADR-008 + labs merged (PR #121) |
| **`art/lab-fixes`** @ `46e963f` | **7 commits, UNPUSHED, no PR yet** — everything in §4 below |
| Open PRs | **#115** canvas-isolation lint · **#120** chase-cam reframe. Both `MERGEABLE`/`CLEAN`, both unreviewed |

Worktree: `/Users/apple/Projects/personal/slur-worktrees/lab-fixes`. The shared checkout stays on `dev`
(non-negotiable #12 — never commit there).

## 3. How to run it

```
cd ../slur-worktrees/lab-fixes
pnpm install                 # ~2s, hardlinks from the warm store
PORT=2570 pnpm dev           # .env already pins CLIENT_PORT=5176 / VITE_SERVER_PORT=2570
```

- **`/art-lab`** — fly the real track, real chase cam, real collision, no server.
  Layers: `slab · hazards · backdrop · env · ships · finish`. Also pause, ghost, bloom on/off, A/B/C,
  seed, jump-to-section. Readout bottom-left shows z / speed / intensity / **live corridor width**.
- **`/art-gallery`** — each subject isolated at true scale under the game's own bloom, on the Fighter's
  real 2.6 × 2.52u footprint. Click a subject in the sidebar to frame it.

> **If either route is black:** check the console. Two causes seen so far — (a) unsmudged git-lfs ship
> models 404ing and taking the whole Canvas down via the error boundary (`git lfs pull` fixes it), and
> (b) a stale Vite dep cache after a fresh worktree install (`rm -rf apps/client/node_modules/.vite` and
> restart).

## 4. What was built, and the decisions behind it

### The track floor is ONE generated mesh, not instanced tiles

`apps/client/app/game/scene/track-floor.tsx`. Generated from the sim's real `FloorSpan` data, 2u
downward extrusion, closed solid (top, both sides, end caps at gap edges, underside).

**Why not instanced 4u tiles** (which was the other candidate): a 4u tile repeats every 4u in both axes —
a visible grid, and exactly the "dense seam grid" `art-handoff-v2` §5 rejects. Each tile also carries its
own 0–1 UV, so the surface texture would repeat every 4u unless per-instance UV offsets were added. One
continuous mesh gives continuous UVs for free, which makes **panel size a texture decision rather than a
geometry constraint**.

**Why from `FloorSpan` and not a lane grid:** spans are 4u-aligned today (`x0 = -HALF_WIDTH + n*CELL`), so
a lane grid would match — but GDD §0 says that is a generation artifact, not a rule. Reading spans directly
keeps WYSIWYG collision true whatever the generator does later. A dev-only warning fires if a span ever
stops being CELL-aligned.

### The surface texture is generated, and sized in WORLD units

`apps/client/app/game/scene/track-texture.ts`. One tile = one panel, mapped to **16 × 20u** — 16u divides
the 64u ribbon into exactly 4 panels with no partial panel at the edges, and 20u matches `SEG_LEN` so
transverse seams land on segment boundaries and agree with gap edges instead of cutting across them.

### Nebula backdrop (placeholder)

`scene-backdrop.tsx` + `public/textures/nebula-backdrop.jpg` (368KB, converted from a 2.6MB PNG with
`sips`). Deliberately **not** LFS — a missing backdrop should degrade, not crash.

## 5. NEXT TASK — the edge rail

This is the agreed next piece and the spec is settled.

**Approach:** procedural, not Blender. The ribbon **never turns** (GDD locked constraint), so sweeping a 2D
cross-section along z is just a quad strip per profile segment — no `ExtrudeGeometry`, no curve, no
imported mesh.

**The profile** (user sketch, 2026-09-18): a stepped cross-section — vertical inner face, a chamfer in from
the top, a notch, then a long angled face, a small step out, and an angled outer skirt. **Exactly one face
is emissive** (marked red in the sketch); everything else is near-black, optionally with a small repeating
concrete texture.

**Implementation note that matters:** generate it as **two geometries** — dark shell and glow strip — with
independent materials. An imported or `ExtrudeGeometry` mesh would force material groups to isolate that
one face; generating it means the marigold can be tuned without touching the shell.

**Open:** which side of the profile is outward. Build it with a named constant and flip on request.

**Also:** rails must **break at gaps** (the current `TrackView` already does this) — that is how a hole
reads at distance. So it is a short piece instanced per floored segment, not one continuous extrusion.

## 6. Then, in the user's stated order

1. ~~Track (incl. gaps)~~ — floor done; **gap rim treatment still owed** (thin marigold edge + inner-lip
   glow + dark cavity, per v2 §5)
2. Environment — nebula, planets
3. Monoliths — 3 variants (Obelisk/Gate/Arch), gallery first then lab
4. Asteroids — same route
5. Non-destructible blocks
6. Destructible blocks → **this completes the initial gameplay shot**

**Constraint for 3 and 4:** environment props must stay **off the ribbon** (`|x| > 32u` plus margin). A
300u obelisk near the edge reads as a hazard, and v2 says monoliths must never look like gameplay blocks.

## 7. Open questions / decisions NOT made

- **ADR-009 (breakable blocks)** is **PROPOSED, not accepted.** Merging slow + destructible into one
  primitive. Gated on the deadly-vs-breakable readability test. Real cost: it converts a free seed-derived
  primitive into **networked mutable state**.
- **ADR-010 deferred the low camera.** v2 proposes 4–5u with occlusion fade; ADR-006 puts the chase cam at
  +9u *specifically* to see over 8u pillars. Gameplay change wearing art clothing — needs its own ADR and a
  feel-gate. Overlaps PR #120.
- **Track width 64u.** Not changing it. Measured corridor is 64u / 56u / 24u at intensity 0 / 0.41 / 1.00.
  Narrowing the ribbon *reduces* obstacle count (the corridor is defined in absolute lanes, so fewer lanes
  remain for blocks), so it is a full generator re-tune, not a constant edit.
- **Marigold recolour not started.** The shipped palette is still red/white/amber. Now unblocked by
  ADR-010's answers, but it should land in ONE deliberate pass with the readability gates attached.

## 8. Gotchas paid for in this session

1. **Never reason about triangle winding — compute it.** Got the top face backwards (whole ribbon
   invisible), then the end caps backwards the same way (gaps had no depth). `pushQuad` now takes an
   intended normal and reverses when the cross product disagrees.
2. **Size texture features in WORLD units, not pixels.** A 3px seam over a 16u tile is 0.05u — invisible.
   This is why the floor read as flat grey for two iterations.
3. **Base `color` multiplies `map`.** `FLOOR_SURFACE.color` is `#050507`, which crushed the texture to
   black. Override to white when supplying a map.
4. **`metalness` without an environment map renders black.** Metals get their value from reflections.
   Keep it low until there is something to reflect.
5. **A module-singleton texture survives HMR.** Editing the texture's constants does nothing until a full
   reload.
6. **The boards in `art-handoff-v2` were NOT reshot** — byte-identical to v1. `docs/ART_SCALE_REFERENCE.md`
   remains authoritative on every dimension; boards `07`/`09` still show the old undersized proportions.
