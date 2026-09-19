# TEXTURE SPEC — the sealed deadly block

**For the author, with Blender open.** What to make, in numbers. The *why* is in `LANE-STATE.md` and
`SESSION-9-ADDENDUM.md`; you do not need it to build this.

Target, unchanged and not up for re-litigation: **dark stone / worn concrete — dark metal with a lot of
cracks**, per `10_obstacle_blocks_final.png` panel 2. Cold. Same material family as track and world (panel 8).

---

## 1. The three scales — check your own work against this before exporting

| | Feature size (world units) | What lives here | Carried mainly by |
|---|---|---|---|
| **LARGE** | ~2–3u | broad weathering blotches, tonal patches — the "this is stone" read at distance | roughness + albedo |
| **MEDIUM** | ~0.05–0.3u | **the crack-vein network** and chipped bevel edges — the board's dominant character | **normal** + roughness |
| **SMALL** | < 0.05u | micro-grain, speckle, pitting — breaks up the specular streaks, reads only up close | roughness + faint normal |

Today the material has **only large**. Medium is the one the board is actually about.

The board's **strong specular streaks are a ROUGHNESS feature, not a painted highlight.** Author them as
low-roughness streaks and let the engine light them. Never paint a highlight into albedo — the shader lights
this surface and a baked highlight will fight it from a second direction.

---

## 2. Which maps, and why in this order

The block renders **~85–90% non-diffuse** (measured: zeroing albedo outright moved the lit face only 48–65 →
45–57). So the maps that modulate the specular/environment term do nearly all the visible work, and albedo is
close to inert *today*.

1. **ORM — the one that matters.** A single RGB image, three's own native packing (verified in
   `roughnessmap_fragment` / `aomap_fragment`, three 0.185.1):
   - **R = Ambient Occlusion.** Not optional and not a nicety: under an environment map three occludes
     indirect **specular** with it (`reflectedLight.indirectSpecular *= computeSpecularOcclusion(...)`), and
     indirect specular is what is painting this block. AO is a live lever here.
   - **G = Roughness.** The primary finish channel. All three scales.
   - **B = Metalness.** Author it, but **leave it flat for now** — see §7.
2. **Normal.** Carries the cracks and chips. The medium scale is mostly this.
3. **Albedo (base colour).** Lowest priority, still worth making: it becomes visible the moment the track
   lane lands a lighter base colour, and crack veins want a dark value in it.
   **Keep its average near mid-grey and low-contrast.** three *multiplies* it by the material's base colour,
   so a map that is dark overall double-darkens an already near-black block, and a map that carries strong
   hue takes the base colour's job away from the lane that owns it.

**No height/displacement map.** The mesh is a literal box and must stay one — the drawn hull IS the physics
hull, and anything that displaces a vertex kills players on apparent empty air.

---

## 3. Tile size — **5u**, and it is one number

The material tiles in **world units**, so one tile is the same physical size on every block. Blocks are **8u
tall always**; width and depth are free (3.5u–5.5u typical, any size legal).

**Make one tile = 5 world units square.** Three reasons, and the first is the load-bearing one:

- **5 is not a divisor of 8.** A 4u tile would put a tile boundary exactly at **mid-height on every block** —
  and a horizontal line across the mid-face reads as a **ledge** on a block that is deliberately un-jumpable.
  That is a gameplay lie, and it is the one tile size that must not be chosen. 5u puts the vertical boundary
  at 5u, once, off-centre.
- **Comfortably bigger than the largest feature** (~2–3u), so the tile period never becomes the biggest thing
  on the face — which is what makes tiling read as tiling.
- **A typical block rarely repeats.** An 8u height shows 1.6 repeats; a 4u-wide face shows 0.8 — less than
  one full repeat horizontally.

---

## 4. Resolution — **1024 × 1024**, square, power-of-two

Derived from world-units-per-texel at the distances the player actually sees these, not from habit.

At 5u/1024, one texel is **~0.005u**. Players close at 55 u/s and the sealed-vs-fractured call happens around
**27u out** (~0.5 s), where a block spans ~343 px — about **4.7 texels per screen pixel**, so mips do the
work. At closest approach (~8u) it is **~1.5 texels per pixel** — still slightly finer than the screen, so the
small scale stays crisp at the moment of impact instead of going soft.

**512² is an acceptable fallback** if authoring time is tight; it only softens inside the last ~10u.
**2048² is waste** — it buys nothing the screen can resolve.

Power-of-two and square are requirements, not preferences: the material is sampled with explicit derivatives
and repeat-wrapped, and that combination wants a clean mip chain.

---

## 5. Seamless tiling — required, and here is where the cost actually falls

**Must tile seamlessly in both axes.** Every map, identically — the three are sampled at the same coordinate,
so a seam in one is a seam in all.

The expensive part is **the crack network**, because veins have to cross the tile boundary and *meet* on the
other side. Hand-drawn or sculpted cracks will not do this by accident.

Two things that make it cheap, both of which also improve the result:

- **Keep the LARGE scale low-contrast and low-frequency.** If the big blotches are soft, a slight mismatch
  across the boundary is invisible, and you only have to solve tiling properly for medium and small — where a
  mismatch is genuinely hard to see anyway.
- **Avoid one dominant feature.** A single big hero crack will be obviously the same crack on every block.
  The failure mode to design against is a visible tile **period**, not just a visible seam — many medium
  cracks beat one large one.

---

## 6. What the maps must NOT contain

These are already procedural in the shader and would double up, or they break a contract:

- **The marigold seam.** Procedural and staying that way — its corner is hashed **per instance**, and a baked
  texture is byte-identical on every block, so it cannot carry that variation.
- **The bevel highlight and the dark crease line at the edges.** Procedural, keyed to each block's real
  extents, constant world width at any footprint. A tiling texture cannot know where a block's edges are.
- **Any warm colour at all — no marigold, no amber, and never red.** The seam is the one feature carrying
  hazard identity at range; a second warm line anywhere on the face dilutes exactly that signal. The authored
  material is cold, dark stone/metal, full stop.
- **No baked lighting of any kind** — no painted highlights, no directional shading, no drop shadows. The
  shader lights this. (AO in the R channel is *not* baked lighting; it is occlusion, and three applies it
  correctly.)

**⚠ OWNER'S CALL — the vertical panel splits.** The shader currently draws thin dark vertical hairlines
dividing each face into full-height slabs, snapped so an even count spans the face. If your authored material
already carries vertical structure, these are redundant and should be **deleted from the shader** rather than
drawn on top of yours. Please say which you want; doubling them is the one outcome that looks wrong.

---

## 7. Colour space, format, and one convention that fails subtly

| Map | Colour space | Format |
|---|---|---|
| Albedo | **sRGB** | PNG, 8-bit |
| ORM | **Linear** (non-colour data) | PNG, 8-bit |
| Normal | **Linear** (non-colour data) | PNG, 8-bit |

- **The normal map must be OpenGL convention (+Y up / green up).** Blender bakes this by default, so this is
  a check, not work — but a DirectX-convention map (green inverted) does not look broken, it looks *lit from
  the wrong side*, which is exactly the kind of thing that survives review.
- **ORM and Normal must be tagged non-colour** in Blender's image settings. If either is sRGB-decoded the
  roughness range silently shifts and the finish reads wrong everywhere at once.
- **Metalness (ORM blue): author it flat.** The block currently runs `metalness: 0` on a premise that may be
  stale, and that is under review pending a frame. Give us a flat channel now; if metalness is reopened we
  change one number, not your asset.

---

## 8. Deliverable

Three PNGs, 1024², tiling at 5u:

```
block_albedo.png    sRGB
block_orm.png       linear   R=AO  G=roughness  B=metalness (flat)
block_normal.png    linear   OpenGL +Y
```

Drop them anywhere in the repo and say where; wiring them up is the lane's job, not yours.

**Before you export, check against §1:** are all three scales actually present, and are the specular streaks
in *roughness* rather than painted into albedo?
