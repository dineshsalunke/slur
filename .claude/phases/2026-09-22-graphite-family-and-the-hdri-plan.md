# One graphite family, three merges, and the plan for the HDRI panel

**Date:** 2026-09-22 · **PRs:** #202 #205 #206

Implementation session. The Split Crown became the default ship, every dark surface collapsed to one
graphite definition, and the two PRs left open by the previous handover landed. The HDRI panel is
specified but not built.

## Merged to `dev` (now `e7f8f40`)

| PR | What | Merge |
|----|------|-------|
| #205 | unify marigold emissive intensity across five surfaces | `aab4a7b` |
| #202 | leva 0.10.1 + lighting-scoped tuning panel | `396165a` |
| #206 | one dark-graphite definition + Split Crown as default ship | `e7f8f40` |

`art/clear-lighting-stack`, `art/clear-tunables`, `docs/handoff-reconciliation` and
`fix/adr-008-palette` were merged and are deleted. `feat/ship-feel` (#195) and
`docs/track-material-plan` (#188) remain open and untouched.

## #202 was about to silently revert #205

#202 read `MERGEABLE CLEAN` until #205 landed, then conflicted in four files. Every conflict was the
same shape: `dev` kept a constant that #202 had deliberately deleted in favour of a leva knob.
Resolving to #202's side was right, but on its own it would have undone #205 — **#202's leva defaults
were captured before the unification**: `Rail.rimEmissive: 6` and `Monolith.seamEmissive: 10`, exactly
the pre-#205 values. Both set to 2 in the merge commit.

**The durable lesson, and it will recur:** #202 moved the material values out of constants and into
`tuning-schema.ts`. Editing a constant that the schema now shadows is a **no-op on screen**. The schema
is the live surface. Anything that changes a deck/rail/monolith material value must change it there.

## The graphite family

`apps/client/app/game/scene/graphite.ts` is the single definition:

```ts
export const GRAPHITE_ALBEDO = '#303c45';
export const GRAPHITE_METALNESS = 0.9;
export const GRAPHITE_ROUGHNESS = 0.4;
```

Consumed by deck, rail, monolith (via `tuning-schema.ts` defaults), sealed block
(`sealed-block-material.ts`) and ship (`ship-model.tsx`). Owner's numbers, owner's call to make all
five consistent before touching lighting.

**The declared 0.9 had been rendering as 0.63.** `track-texture.ts` packs a metalness *map* and three
multiplies `metalnessMap × metalness`; `METAL_PLATE` was `0.7`. Map base raised to 1.0 and the wear
range rescaled `0.35–0.7 → 0.5–1.0`, holding the wear contrast ratio while making the scalar honest.
Anyone tuning metalness on these surfaces needs to know the map is in the path.

**Blocks and ships were dielectrics over near-black albedo** — `metalness: 0` at `#0d1117` and at
~0.01 linear respectively. Both are conductors now. The ship override lives in the existing one-shot
material traverse in `ship-model.tsx` and guards on `emissive.getHex() !== 0`, which is what spares the
GLB's `Marigold_emission` and `Engine_core`.

**`GRAPHITE_SURFACE` in `monolith-config.ts` is deleted** — `metalness: 0, roughness: 0.78`, zero
consumers, nothing read `shape.surface`. A dead definition contradicting the live one is how this drift
came back in the first place.

## Split Crown

`DEFAULT_SHIP` is `split-crown`. No model work was needed: parsing the GLB accessor bounds gives
**2.5000 × 1.0025 × 6.0000** at `min-y = 0`, matching `ART_SCALE_REFERENCE.md` §4 *"Freighter |
split-crown | 2.50 | 6.00"* and the sim's `halfW: 1.25, halfL: 3.0`. `ship-visuals.ts`'s `scale: 1,
lift: 0` was already correct. `HERO_SHIP` on the landing page stays `challenger` deliberately.

## Departures from ART_MATERIALS.md — the §7 entry is NOT written

Owner-directed, provisional, and currently undocumented in the sheet:

- **M2 (blocks)** specifies *"Metalness | 0.0"*; blocks are now 0.9.
- **M3 (monoliths)** specifies *"Metalness | 0.0"*, *"Roughness | 0.75 – 0.90"*; now 0.9 / 0.4.

M2's stated reason for a dielectric block is live risk, not taste: *"it keeps the block from going
black when there is little for a conductor to reflect."* That is exactly the condition `dev` is in.

## Nothing here has been seen on screen

The graphite values, the corrected marigold defaults and the leva panel itself have all never been
looked at — #202 merged having never had a slider dragged. With no lights in the scene, a
metalness-0.9 surface at F0 ≈ 0.04 reflects almost nothing, so **blocks and ships are expected to be
black until an environment map lands.** Do not treat that as a regression from #206; it is the
predicted state.

## The HDRI panel — specified, not built

Next task. The owner's plan, refined:

**Poly Haven URLs are computable from a slug**, so the dropdown stores slugs only:

```
https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/<slug>_1k.hdr
```

`1k` appears twice — path segment and filename — so resolution is one variable and a 2k/4k selector is
nearly free. **CORS is open**: the CDN returns `access-control-allow-origin: *`, verified by `curl -I`,
so pasting a slug or URL works from localhost with no proxy and no committed files.

**Prefer `studio` over `overcast`.** The owner had read that overcast gives even light, and it does —
but it is a *daylight sky*, blue-white with a bright horizon, which fights "Cold Space. Warm Energy."
Poly Haven's `studio` category (96 assets) gives even light with a dark surround. Shortlist of neutral
low-contrast ones: `monochrome_studio_03`, `studio_kontrast_02`, `studio_kontrast_04`,
`blocky_photo_studio`, `white_studio_04`. The `brown_photostudio_*` family is warm-tinted, which may
double up on marigold. Category counts come from `https://api.polyhaven.com/categories/hdris`;
`?t=hdris&c=studio` filters, and category membership is in each record.

**The intensity dial matters more than the map choice.** At `#303c45` / metalness 0.9, F0 is ~0.04
linear — the deck returns about 4% of what the environment gives it. Without an `environmentIntensity`
slider beside the picker, good maps will be rejected for being dim and the comparison is meaningless.

**Load it with `background={false}`.** `scene.background` already owns the backdrop via
`deep-space-sky`; a photo studio behind the track is not wanted. And 1k is enough for lighting-only —
4k is pure download cost.

## Next

1. Build the HDRI picker into the leva panel: slug dropdown + free-text slug field + intensity slider.
2. Playtest `/test-level` — the first actual look at graphite, the panel, and the unified marigold.
3. Write the `ART_MATERIALS.md` §7 departures entry once the lighting settles the M2/M3 question.
4. Revisit `ENVIRONMENTAL_MARIGOLD_INTENSITY` (`track-materials.ts`) — still zero consumers, still the
   unimplemented environmental tier from the previous handover.

## Related

- [[2026-09-22-leva-palette-and-the-marigold-split]] — the handover this picks up; its "blocks are
  invisible" item is now understood as the no-lights consequence, not a block-specific bug.
- [[2026-09-22-lighting-strip]] — the removal that left the scene unlit.
- [[2026-09-22-tuning-panel-and-punch]] — the original panel, and the table that first rejected leva.
