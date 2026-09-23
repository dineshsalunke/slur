Agent: workertwo · Lane: destructible block rebuild (#222) · Updated: 2026-09-23, ~21:40

## Goal

#222: rebuild the fractured block and its break to match `docs/art-direction/ingredients/blocks/blocks.png`
(panel 2 look, panel 5 INTACT → HIT → BREAK → CLEAR). The owner approved the plan (see `2ab2c2c` body).

## Done

- `4589412`: `ART_MATERIALS.md` §7 item 15 (departures).
- `2ab2c2c`: the build (12 Voronoi cells, pre-glow, analytic debris, flash).
- `fef4a21`: ADR-015 amendment.
- `b83ac9a`: tuning defaults. Fracture.gap 0.3, glow 10. Break.flare 0.3, flashLife 0.18, flashSize 0.8,
  flashBright 2.

## State

- At `b83ac9a`: client vitest 241/241, client tsc clean, biome clean on the schema, comment ratchet passes.
- Stills are in `.claude/frame-tap-refs/222/` (git-ignored). Pair: fractured 16449 (x −5.5…2.8, z 5143)
  beside sealed 16448. Ranges 20/50/100/180u = `n020…n180`. Break = `nb60/150/300/600` (ms after the
  break). Pre-glow: `npre` (no bolt), `np02` (bolt 2u short). `old-*` = the defaults from before.
- Readability: the crack web reads at 50u and at 100u. At 180u it is a small spark (1–2 px). The
  sealed block shows a single seam line, so it is distinct at every range.
- Break: at 60 ms the cells open; at 150 ms dark chunks with glowing inner faces; at 300 ms they
  spread; at 600 ms dark chunks fall; at 900 ms clear.
- Frame 0 of a break is a hole: the block is gone and the debris is not drawn yet. It lasts one frame
  (16 ms), because TrackBlocks queues the break and BlockDebris drains it on the next frame. [inferred
  from the order; seen in `b000.png` in the scratchpad]
- Pre-glow works: the web brightens as a bolt closes in (3 frames of `noteBolt`).
- Draw calls (swiftshader, averaged over 60 frames): 134 with the fractured mesh visible, 132 with it hidden.
  During a break: 137 calls, +8.7k tris (16 debris slots at ~600 tris; free slots draw degenerate).
- CPU per frame (swiftshader, JS side): 7.4 ms idle, 8.4 ms with fractured hidden (noise), 9.7 ms
  during a break. Rough numbers; no "before" build was measured (it needs a worktree). [partial]
- HMR of `tuning-schema.ts` left the page rendering the fracture with no glow until Chrome was
  relaunched. Dev-only. Cause not found. [unmeasured]
- Mend-cancel and late-join are still not tested. [unmeasured]
- The scratch vite (5186) and headless Chrome (9338) are killed.

## Uncommitted

None of mine.

## Held files

The eight #222 client files: `scene/{fractured-block-geometry.ts, fractured-block-geometry.test.ts,
fractured-block-shader.ts, block-debris.tsx, block-breaks.ts, block-burst.tsx, track-blocks.tsx}` and
`game/block-state.ts`. `tuning-schema.ts` is released again.

## Next

0. NEW LANE assigned by the supervisor at ~21:45, NOT STARTED (context seam): fix the sky-work review
   findings (#221 + #224, merged as `81f9462`, issue #215). Read
   `.claude/phases/2026-09-23-review-pr-221-224.md` first and verify each finding before fixing. Order:
   rear-view uniforms in main-camera view space (rail-glow.ts, rock-field.tsx, rear-view-pass.tsx) ·
   rail glow ignores rail gaps · ADD.md:258 rock-texture claim · ADD.md:191 planet/moon counts ·
   `.gitignore` `.tmp/` (ASK first: `.tmp/dev.log` depends on it) · nebula-shaders.ts:171 fwidth after
   a divergent return · measure sky bake time at DPR 1. Also: a before/after darkness still pair
   (036645c vs dev), with no fix. File an issue first and claim the files. Own stack on 5183/2577. Never kill :5173/:2567.
1. #222: the owner judges the stills at race speed (the ADR-015 gate).
2. If asked: fix the one-frame hole (spawn the debris in the same frame as the break).
3. If asked: set debris `mesh.count` to the live count so free slots are not drawn.
4. Test mend-cancel.

## Open questions

1. The #214 questions stay open: do sealed blocks stop a bolt, and is there one smashKeep for every class?
2. A remote player's smash animates as a bolt break. Fine for now?
3. At 180u the web is 1–2 px. Is that enough, or should far blocks get a distance glow boost?

## Lessons → memory

- `.claude/memory/step-the-r3f-clock-for-timed-taps.md` (new, indexed)
