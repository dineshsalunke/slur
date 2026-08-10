# SLUR — Art Design Document (ADD)

> Status: **v0 draft**. Establishes the visual target and constraints. Concrete asset specs follow once the look is locked.

## 1. Visual pillar

**Neon sci-fi / vector-glow — TRON meets Star Trek.** Dark void, bright emissive lines, heavy bloom. The
world reads as light against black — a TRON grid rushing at you, flown with the clean optimistic sheen of
Star Trek. This is both an aesthetic and a **performance strategy**: emissive lines + bloom look expensive
but are cheap (few materials, lots of instancing).

**Franchise inspiration:**
- **TRON** — the grid, light-cycle trails, glowing edges, *derezz* dissolve on death, high-contrast neon on black. This is the core visual language.
- **Star Trek** — sleek hopeful hardware, warp/energy motifs, and **LCARS**'s *information design* (colour-coded panel blocks, confident "computer" type) as the HUD/menu language. Keeps the neon from feeling grungy — clean, not cyberpunk-dirty.
- **Aesthetic formula (locked 2026-08-10 — user direction):** **TRON supplies colour + material** (neon-on-black, HDR emissive, glow/bloom); **Star Trek + Star Wars supply shape + geometry — but *de-rounded*.** Take Trek's clean panel logic and Wars' hard-edged industrial paneling/greebles, and **subtract the roundness**: chamfered/angular corners, trapezoidal & hex panels — **NOT** LCARS's signature curves. Net: keep LCARS's *information design*, drop its rounded silhouette.

Anchor reference: **cuberun** (the neon tunnel). Motion reference: **SkyRoads** (floating ribbon track in
space). Energy reference: **Blur** (glowing pickups, punchy combat VFX).

## 2. Mood / one-liner
> "Racing a light-cycle down a Daft Punk album cover."

## 3. Color

- **Base:** near-black background (#05060a-ish), subtle starfield/grid.
- **Player ships:** each player gets a distinct **high-chroma emissive hue** (color-pick on join) — this is
  the primary way you tell ships apart at speed. Reserve a palette of ~12 maximally-distinct, colorblind-aware hues.
- **Signature duo (locked 2026-08-10):** the brand/identity pair is **cyan + marigold-amber ("gainda",
  `#00e5ff` × `#ff9f1c`)** — cyan = local/primary, marigold = the warm co-accent — replacing the earlier
  cyan+magenta (teal-orange reads warmer + higher-contrast). **Magenta demotes to just one of the ~12
  player hues.** Default 2-player contrast = cyan (local) / marigold (remote).
- **Track:** cool neutral glow (cyan/violet) so player hues pop against it.
- **Pickups:** coded by category — Offensive (red/orange), Defensive (green/cyan), Utility (yellow), Chaos (magenta).
- **Danger:** hazards/walls flash a consistent warning hue (hot red/white) — readability over prettiness.

*Rule: color carries meaning. Never use a player hue for a hazard, or a category hue for décor.*

## 4. Shape language
- **Ships:** simple, low-poly, angular/arrow silhouettes — instantly distinguishable at distance by *silhouette + color*, not detail. Think readable icons, not detailed models.
- **Track:** a ribbon/tube of glowing edges and lane lines; hazards are bold primitive forms (blocks, gaps, gates).
- **Pickups:** floating platonic/geometric icons that spin — shape encodes type, color encodes category.
- Minimal texture detail; the "detail" is light, motion, and trails.
- **Geometry = de-rounded Trek/Wars (locked 2026-08-10):** panels, ship silhouettes, and HUD frames use **chamfered/angular corners and trapezoidal/hex forms**, not rounded LCARS curves. Hard edges + cut corners read as "spaceship console"; **roundness is reserved for *lights*** (status pips, glows, colour dots) — never structural panels. See §1 aesthetic formula.

## 5. VFX (the juice)
- **Bloom** (postprocessing EffectComposer) — the signature. Emissive materials + selective bloom on ships/pickups/track lines. See `conventions/r3f.md`.
- **Speed cues:** motion streaks, FOV/camera-shake on boost, star/grid parallax, chromatic aberration ramp with speed.
- **Combat VFX:** **(S5 built)** cyan bolt tracers (instanced+interpolated), hit-spark burst (additive HDR), on-ship stun-flicker. **Planned:** shield shimmer, mine pulse, hit-spin, ship light-trails.
- **Trails:** each ship leaves a fading light-trail in its hue (identity + speed read).
- VFX are **client-local** (not networked) — driven by ECS/game events. See TDD §5.

## 6. Camera — **third-person chase** (decided)
- Chase cam behind + slightly above the ship, low and close for speed. First-person is rejected: it hides your ship's hue/trail (your **identity** signal) and worsens dodge awareness.
- **Aim at a look-ahead point** *ahead* of the ship (not the ship itself) so you read incoming track early.
- **Speed cues:** FOV widens + camera pulls back on boost; subtle bank into strafes; light shake at high speed.
- **On hit/stun: spin the *ship*, keep the *camera* stable** — disrupt without disorienting (fair, not nauseating).
- **Comfort options (day one):** sliders to dampen shake / FOV-kick / chromatic aberration — cheap motion-sickness insurance.
- **Death:** TRON derezz, then **spectator** follow-cam on the pack / cycle players.

## 7. UI / HUD — **LCARS-flavored**
- **LCARS-*derived*, de-rounded interface language (refined 2026-08-10):** take LCARS's *information design* — colour-coded panel blocks, confident "computer" type, instantly-readable chrome — but render it **angular, not rounded** (chamfered/cut corners, trapezoidal blocks per §4), matching the TRON×Trek/Wars formula in §1. Applied to lobby/host/join + the in-game HUD. Reads as "spaceship cockpit" without cloning Trek. *(A light-LCARS-rounded mockup was tried 2026-08-10 and rejected for being too soft — de-rounded is the call.)*
- HUD content: speed/fuel, held power-up, position/alive-count, mini threat indicators (incoming bolt/mine). **(S5 built:** `heldPower` chip + directional threat-warning HUD; dev stun/held/bolt readout. Speed/position/alive-count still to do.)
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
6. **WYSIWYG collision (hard rule — ADR-002).** The rendered track IS the physics hull; any authored mesh
   must faithfully cover the collidable hull (no invisible lethal walls, no visible walls you pass through).
   Full statement + the ADR-000 litmus live in **§12** (added by the ADR-002 implementation).

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

## 11. As-built + art research (2026-08-10) — inputs for the S6 art pass

*(S5 shipped the first real combat VFX; a research pass then inventoried the scene + surveyed the aesthetic
space. This section **persists that research** — it is INPUT for S6, not locked decisions.)*

**As-built scene reality (the gap vs the pillar):**
- **Two divergent scenes:** `/solo` (`game-canvas`) has **no bloom at all**; the networked race has bloom but **timid** (`intensity 0.5, threshold 0.6`). The signature look only half-exists.
- **No atmosphere:** flat `#05060a` void — no fog, skybox/gradient, or real starfield (cuberun, our anchor, leans on fog + a ~10k-star field + a galaxy skybox for depth).
- **Ship identity is a beacon pip**, not the hull — at speed you read a small glowing dot, not a coloured ship (contradicts §4's "silhouette + colour").
- **`COLOR_COUNT` is 8**, not the 12 §3 reserves. Instancing discipline is solid (few draw calls) — the art can get much richer with no perf bill.

**Cheap, high-impact moves (S6):** unify solo/net into one scene module + push bloom (~`1.0–1.5` / threshold `~0.4`); add **atmosphere** (`fog` + drei `<Stars>` + gradient backdrop → new `scene/environment.tsx`); put the team hue **on the hull**; vignette + subtle grain; speed-ramped chromatic aberration (the core set merges into ~one full-screen pass — largely ship-count-independent).

**Research-informed answers to §10:**
- **OQ1 (ship fidelity):** keep the authored Quaternius CC0 models — already integrated, WYSIWYG collision (GDD §5.5). Pure-primitive is a bigger pivot; don't chase it.
- **OQ2 (tube vs ribbon):** still open — tube = cheap enclosed atmosphere + speed cues; open ribbon fits the current sim/hazards. Trade-off, unresolved.
- **OQ3 (palette):** colour science caps categorical palettes at ~8; 12 against black under bloom is hard. Three concrete proposals exist (Wong-extended / max-chroma neon-wheel / value-staggered); lean on **silhouette + value-staggering** as the colourblind backstop, or auto-assign for max pairwise distance among present players. **Decide in S6** (and raise `COLOR_COUNT` 8→12).
- **OQ4 (heavy post):** the synthwave set (Bloom/Vignette/ChromaticAberration/Noise/Scanline) is confirmed in `@react-three/postprocessing` and composes cheaply — but it directly threatens **combat legibility** (bolts + 12 ships wash to white). Gate it behind a **comfort/intensity slider** (§6/§7); consider **SelectiveBloom** now that combat is on screen. Verify exotic effects (DoF/N8AO/GodRays) against the pinned `3.0.4` before use.
- **OQ5 (perf budgets):** set after a first 12-ship test; drei `<PerformanceMonitor>` + `<AdaptiveDpr>` as insurance.

*Key files an S6 art pass would touch: `net-canvas.tsx`, `scene/track-view.tsx`, `scene/scenery.tsx`, `scene/ship-model.tsx`, `colors.ts` (+ `@slur/shared` `COLOR_COUNT`), `scene/explosions.tsx`; new `scene/environment.tsx` (built — env-lab), `scene/trails.tsx`.*

**S6 direction LOCKED (2026-08-10):** aesthetic = **TRON colour/material × Trek-Wars geometry, de-rounded**
(§1/§4/§7); palette = **cyan `#00e5ff` × marigold `#ff9f1c` ("gainda")**, magenta → one player hue; world =
**hybrid open ribbon + distant non-collidable tube-walls** (resolves OQ2); post = **conservative** — bloom + fog
+ starfield + gradient only, chromatic-aberration / scanline / vignette **DEFERRED** to a post-12-ship
legibility gate (resolves OQ4); **`COLOR_COUNT` 8→12**, value-staggered / max-pairwise auto-assign (resolves
OQ3). Chosen environment prototype = **Grid Void** (`scene/environment.tsx`; view at `/env-lab`, keys 1/2/3).
Integrate into the net canvas + landing during S6 Implement; retune wall density/height + bloom at the gate.
**AS-BUILT (2026-08-10):** landing UI shipped (de-rounded neon over Grid-Void, cyan×marigold); **REMAINING** —
in-game net-canvas env integration, hull-colour on the ship, `COLOR_COUNT` 8→12, ship trails, dissolve derezz.
