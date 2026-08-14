# SLUR — Art Design Document (ADD)

> Status: **v0 draft**. Establishes the visual target and constraints. Concrete asset specs follow once the look is locked.

## 1. Visual pillar

**Neon sci-fi / vector-glow — full TRON.** Dark void, bright emissive lines, heavy bloom. The world reads as
light against black — a TRON grid rushing at you. This is both an aesthetic and a **performance strategy**:
emissive lines + bloom look expensive but are cheap (few materials, lots of instancing).

**Franchise inspiration:**
- **TRON — the *single* visual language** (colour, material, geometry, UI, audio). The grid, light-cycle
  trails, glowing edges, circuit-trace line-work, *derezz* dissolve on death, high-contrast neon on black.
- **Aesthetic formula (locked 2026-08-12 — user direction; supersedes the 2026-08-10 blend):** **pure TRON
  everywhere.** TRON supplies colour + material (neon-on-black, HDR emissive, glow/bloom) **and** shape +
  UI + audio. Geometry is **TRON-native angular** — hard edges, chamfered/cut corners, hex/trapezoidal
  frames (light-cycles, recognizers, the Grid are already de-rounded); roundness is reserved for **lights**
  (status pips, glows, colour dots), never structural panels.
- **Dropped (was 2026-08-10):** the Star Trek / **LCARS** *information-design* borrowing and the Star Wars
  *greeble* borrowing. The three-way blend was muddy and LCARS carried a clone-Trek risk. Full TRON coheres
  with what the game *is* — a light-cycle racer.
- **Which TRON is still OPEN** — 1982 minimal vector vs *TRON: Legacy* (2010) sleek circuit-UI, or a
  deliberate blend. Reference collection + the decision live in **issue #117**; §7 UI specifics are OPEN
  until it lands.

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
- **Geometry = TRON-native angular (locked 2026-08-12):** panels, ship silhouettes, and HUD frames use **chamfered/angular corners and trapezoidal/hex forms** — the language of light-cycles, recognizers, and the Grid. Hard edges + cut corners; **roundness is reserved for *lights*** (status pips, glows, colour dots) — never structural panels. *(Was "de-rounded Trek/Wars" 2026-08-10 — the Trek/Wars borrowings are dropped, but the angular result is unchanged: TRON is already hard-edged.)* See §1 aesthetic formula.

## 5. VFX (the juice)
- **Bloom** (postprocessing EffectComposer) — the signature. Emissive materials + selective bloom on ships/pickups/track lines. See `conventions/r3f.md`.
- **Speed cues:** motion streaks, FOV/camera-shake on boost, star/grid parallax, chromatic aberration ramp with speed.
- **Combat VFX:** **(S5 built)** cyan bolt tracers (instanced+interpolated), hit-spark burst (additive HDR), on-ship stun-flicker. **Planned:** shield shimmer, mine pulse, hit-spin, ship light-trails.
- **Trails:** each ship leaves a fading light-trail in its hue (identity + speed read).
- VFX are **client-local** (not networked) — driven by ECS/game events. See TDD §5.

## 6. Camera — **third-person chase** (decided)
- Chase cam behind + slightly above the ship, low and close for speed. First-person is rejected: it hides your ship's hue/trail (your **identity** signal) and worsens dodge awareness.
- **Aim at a look-ahead point** *ahead* of the ship (not the ship itself) so you read incoming track early.
- **Framing tuned to keep your ship readable (first pass, 2026-08-14 — feel-gate pending).** The
  raised-above-walls vantage (ADR-006: height > `BLOCK_HEIGHT` = 8u so you see over the pillars and plan your
  line) compounded with a *far* look-ahead + wide FOV made the player's own ship a tiny speck low on screen
  (near-invisible for the short-hulled Comet/`bob`). Resolution: **keep the height** (see-over is load-bearing)
  and pull the ship bigger + higher via the other three levers — **shorter look-ahead, tighter base FOV,
  closer trail, lifted aim**. Knobs are named + commented in `apps/client/app/game/camera/chase.ts` (`CHASE`),
  live-tunable. On-screen ship *size* is dominated by this framing, **not** by model scale (locked to the
  collision footprint — GDD §5.5), so "the ship looks small" is a camera or class-size question, never a scale
  bug. The look-ahead↔see-over trade stays a feel-gate tune.
- **Speed cues:** FOV widens + camera pulls back on boost; subtle bank into strafes; light shake at high speed.
- **On hit/stun: spin the *ship*, keep the *camera* stable** — disrupt without disorienting (fair, not nauseating).
- **Comfort options (day one):** sliders to dampen shake / FOV-kick / chromatic aberration — cheap motion-sickness insurance.
- **Death:** TRON derezz, then **spectator** follow-cam on the pack / cycle players.

## 7. UI / HUD — **TRON circuit-UI** *(direction OPEN — issue #117)*
- **TRON interface language (locked-to-TRON 2026-08-12; specifics pending #117):** glowing circuit-line
  frames, thin geometric type, animated trace-in reveals, high negative space, angular (chamfered/hex/
  trapezoidal) panels per §4 — **not** LCARS's colour-coded panel blocks. Applied to landing/lobby/host/join
  + the in-game HUD. The **which-TRON** call (1982 minimal vector vs *Legacy* sleek circuit-UI) and the
  concrete frame/type/motion spec are collected + decided in **issue #117**. *(LCARS info-design was dropped
  2026-08-12; the earlier de-rounded-LCARS mockup is retired.)*
- HUD content: speed/fuel, held power-up, position/alive-count, mini threat indicators (incoming bolt/mine). **(S5 built:** `heldPower` chip + directional threat-warning HUD; dev stun/held/bolt readout. Speed/position/alive-count still to do.)
- Diegetic-lite and minimal — never clutter the flight view; readable in peripheral vision at speed.
- Death = **TRON derezz** dissolve; respawn = materialize-in.
- *Caveat: it's an office toy — evoke TRON, keep it original; don't lift film assets/logos.*

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

**S6 direction LOCKED (2026-08-10):** aesthetic = ~~**TRON colour/material × Trek-Wars geometry, de-rounded**~~
**→ SUPERSEDED by the 2026-08-12 full-TRON pivot below** (§1/§4/§7; the angular result is unchanged, the
Trek/Wars borrowings are dropped); palette = **cyan `#00e5ff` × marigold `#ff9f1c` ("gainda")**, magenta → one player hue; world =
**hybrid open ribbon + distant non-collidable tube-walls** (resolves OQ2); post = **conservative** — bloom + fog
+ starfield + gradient only, chromatic-aberration / scanline / vignette **DEFERRED** to a post-12-ship
legibility gate (resolves OQ4); **`COLOR_COUNT` 8→12**, value-staggered / max-pairwise auto-assign (resolves
OQ3). Chosen environment prototype = **Grid Void** (`scene/environment.tsx`; view at `/env-lab`, keys 1/2/3).
Integrate into the net canvas + landing during S6 Implement; retune wall density/height + bloom at the gate.
**AS-BUILT (2026-08-10):** landing UI shipped (de-rounded neon over Grid-Void, cyan×marigold); **REMAINING** —
in-game net-canvas env integration, hull-colour on the ship, `COLOR_COUNT` 8→12, ship trails, dissolve derezz.

**AESTHETIC PIVOT (2026-08-12 — user direction):** **LCARS dropped → full TRON** (see §1/§4/§7). The
2026-08-10 TRON×Trek×Wars blend is superseded: TRON is now the *single* language for colour, material,
geometry, UI, and audio. Angular geometry is unchanged (TRON-native); the **cyan×marigold "gainda" duo stays
locked** (it's peak *Legacy* cyan-vs-orange — out of scope). OPEN and gated behind **issue #117**: which TRON
era (1982 vs *Legacy*), the concrete UI/HUD frame+type+motion spec, the TRON audio-UI vocabulary (replacing
the LCARS chirps in AUDIO.md), and a licensed TRON-appropriate typeface. #117 is a `design` issue — research +
references + decision first, implementation spun out after.

## 12. Physics ⇄ visual split — **FROZEN** (ADR-002, 2026-08-10)

**WYSIWYG collision stays a documented rule, not code.** The hull the player sees IS the collidable
footprint, and the rendered track IS the physics `Segment` set — `scene/track-view.tsx` renders the shared
sim's physics `Segment`s **directly**. There is deliberately **no** `resolveVisual` / `VisualTrack` / visual
abstraction: introducing one before authored content or the art pass actually needs the visual to diverge from
the hull would be speculative structure.

- **Where the seam sits:** gameplay data that both clients must agree on (pickups today; hazards/checkpoints
  later) is a first-class `Track.anchors[]`, materialized by the provider and derived from the descriptor — see
  ADR-002 and `sim/track.ts`. Cosmetic-only data does **not** go on the `Track`.
- **Litmus (ADR-000) for anything new:** "would two clients disagreeing on this desync the game?" **yes →** it
  is gameplay data (a `Track` anchor / physics `Segment`); **cosmetic-only →** it would belong to the future
  (currently unbuilt) VisualTrack, never the physics `Track`.
- **Unfreeze when:** authored levels or the art pass require the rendered geometry to diverge from the
  collidable hull. Until then, render output is byte-for-byte the physics track.
