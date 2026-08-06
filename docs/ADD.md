# SLUR — Art Design Document (ADD)

> Status: **v0 draft**. Establishes the visual target and constraints. Concrete asset specs follow once the look is locked.

## 1. Visual pillar

**Neon sci-fi / vector-glow — TRON meets Star Trek.** Dark void, bright emissive lines, heavy bloom. The
world reads as light against black — a TRON grid rushing at you, flown with the clean optimistic sheen of
Star Trek. This is both an aesthetic and a **performance strategy**: emissive lines + bloom look expensive
but are cheap (few materials, lots of instancing).

**Franchise inspiration:**
- **TRON** — the grid, light-cycle trails, glowing edges, *derezz* dissolve on death, high-contrast neon on black. This is the core visual language.
- **Star Trek** — sleek hopeful hardware, warp/energy motifs, and especially **LCARS** (curved black panels, warm amber/purple/blue blocks, confident type) as the HUD/menu language. Keeps the neon from feeling grungy — clean, not cyberpunk-dirty.

Anchor reference: **cuberun** (the neon tunnel). Motion reference: **SkyRoads** (floating ribbon track in
space). Energy reference: **Blur** (glowing pickups, punchy combat VFX).

## 2. Mood / one-liner
> "Racing a light-cycle down a Daft Punk album cover."

## 3. Color

- **Base:** near-black background (#05060a-ish), subtle starfield/grid.
- **Player ships:** each player gets a distinct **high-chroma emissive hue** (color-pick on join) — this is
  the primary way you tell ships apart at speed. Reserve a palette of ~12 maximally-distinct, colorblind-aware hues.
- **Track:** cool neutral glow (cyan/violet) so player hues pop against it.
- **Pickups:** coded by category — Offensive (red/orange), Defensive (green/cyan), Utility (yellow), Chaos (magenta).
- **Danger:** hazards/walls flash a consistent warning hue (hot red/white) — readability over prettiness.

*Rule: color carries meaning. Never use a player hue for a hazard, or a category hue for décor.*

## 4. Shape language
- **Ships:** simple, low-poly, angular/arrow silhouettes — instantly distinguishable at distance by *silhouette + color*, not detail. Think readable icons, not detailed models.
- **Track:** a ribbon/tube of glowing edges and lane lines; hazards are bold primitive forms (blocks, gaps, gates).
- **Pickups:** floating platonic/geometric icons that spin — shape encodes type, color encodes category.
- Minimal texture detail; the "detail" is light, motion, and trails.

## 5. VFX (the juice)
- **Bloom** (postprocessing EffectComposer) — the signature. Emissive materials + selective bloom on ships/pickups/track lines. See `conventions/r3f.md`.
- **Speed cues:** motion streaks, FOV/camera-shake on boost, star/grid parallax, chromatic aberration ramp with speed.
- **Combat VFX:** bright bolt tracers, shield shimmer, hit-flash + spin, mine pulse.
- **Trails:** each ship leaves a fading light-trail in its hue (identity + speed read).
- VFX are **client-local** (not networked) — driven by ECS/game events. See TDD §5.

## 6. Camera
- Chase cam behind the player ship, low and close for speed; slight look-ahead into turns; kick-back on boost.
- Spectators: follow-cam on the pack / cycle players.

## 7. UI / HUD — **LCARS-flavored**
- **LCARS as the interface language:** curved-corner black panels, warm amber/purple/blue color blocks, confident sans type, "computer" chrome — applied to lobby/host/join and the in-game HUD. Star Trek gives us a ready-made, instantly-readable, *fun* UI kit that reads as "spaceship cockpit."
- HUD content: speed/fuel, held power-up, position/alive-count, mini threat indicators (incoming bolt/mine).
- Diegetic-lite and minimal — LCARS styling, but never clutter the flight view; readable in peripheral vision at speed.
- Death = **TRON derezz** dissolve; respawn = materialize-in.
- *Caveat: LCARS is a distinctive look — evoke it, don't clone Trek assets/logos (it's an office toy, but keep it original).*

## 8. Performance-driven art constraints (hard rules)
These exist so the art *stays* 60fps with 12 ships + pickups + projectiles:
1. **Few materials.** Emissive + basic PBR only; reuse materials → instancing works.
2. **Instance everything repeated:** track segments, pickups, projectiles, stars (`InstancedMesh`/drei `<Instances>`).
3. **Low-poly, no heavy textures.** Light does the work, not texels.
4. **One bloom pass**, tuned — not per-object glow hacks.
5. **Budget:** *OPEN* — set tri-count + draw-call budgets after first perf test.

## 9. Asset pipeline — **OPEN**
- Ships/hazards: hand-modelled (Blender) vs generated vs pure procedural geometry (boxes/extrusions in-code)?
  - Lean: **procedural/primitive geometry first** (fits the vector aesthetic, zero asset pipeline), model later only if needed.
- A Blender MCP toolchain is available if we want authored models later.

## 10. OPEN QUESTIONS
1. **Fidelity of ships** — pure procedural primitives, or authored low-poly models?
2. **Track look** — enclosed tube (cuberun) vs open floating ribbon in space (SkyRoads)? Affects hazard design & camera.
3. **Palette lock** — commit the 12-hue player palette + category colors.
4. **Chromatic aberration / heavy post** — how far to push before it hurts readability?
5. **Perf budgets** — tris/draw-calls per frame target.
