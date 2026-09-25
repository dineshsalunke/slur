Agent: workerone · Lane: #258 follow-up — scratched cast iron (round 3) · Updated: 2026-09-25 19:05

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

Owner: *"the texture on the metal still looks more raindrops on windsheild. i want a scratched cast iron
sort of feeling."* Replace the round-pit field with multi-direction scratches plus irregular blotches.
HOLD the commit and push until the owner OKs the captures.

## Done

- 3b62bc4 arch leg v + groove bevel sign + #4a4d52, pushed (round 1).
- Round 3 built in the working tree. NOT committed. Captures sent to the supervisor.

## State (measured unless marked)

- Pits removed: pit-field.ts + its test deleted (never committed). `Pit.*` tunables gone.
- New tunables: `Scratch.density` 3/u² · `Scratch.roughness` 0.18 · `Scratch.lift` 0.35 · `Scratch.tilt`
  0.15 · `Blotch.dark` 0.3 · `Blotch.bright` 0.15. Panel folders Scratch + Blotch.
- Scratches: angle uniform 0–π, length log-uniform 0.15–2.5u, width 0.012–0.03u, drawn under
  setTransform(pxPerU, pxPerV) so world-correct on both tiles; wrapDraw tiles them.
- Blotches: tileable fBm (0.3 cells/u, 5 octaves). Dark share 0.197 and bright share 0.267 on graphite with
  the first bright band [0.62, 0.72]. The band moved to [0.7, 0.8], and the test asserts bright < dark.
  The field costs 140 ms per surface, at rebuild only.
- A first try used round lobe blotches. They read as leopard spots on the monolith face, so they were replaced.
- Graphite brushScale 0.4 → 0 (no brush direction). Deck keeps its z-brush + plate grid.
- Gates: typecheck pass · lint 0 errors / 7 warnings · client vitest 50 files / 365 tests.
- Draws before = after: 102 (approach/up/deck/ship/block), 95 (face/lintel).
- Shots: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/781777e4-a44f-4efd-9760-a6edac60c514/scratchpad/shots/`
  — `before-*` (pit tree), `after-*` (lobe blotches, rejected), `after2-*` (final), `cmp-{deck,ship,block,face}.png`
  (before over after). Script `../arch-shoot.mjs <url> 9341 shots <label>`; it kills its own Chrome.
- Ship scratches read faint at the ship pose [observed, not measured].

## Uncommitted

apps/client/app/dev/{tuning-schema.ts, tuning-panel.tsx} · apps/client/app/game/scene/{track-texture.ts,
track-texture.test.ts} · docs/ART_MATERIALS.md · deletion of the untracked pit-field files (nothing to commit).

## Held files

The uncommitted list above.

## Next

1. **NEW owner feedback (via the supervisor), not started:** *"also the repeat on the deck is noticeable"*.
   Screenshot: `.claude/frame-tap-refs/owner-refs/deck-repeat.png`. The circled areas show the blotch and scratch
   pattern repeating tile after tile down the deck (the tile is 16 × 4u, so the z period is 4u). Break the repeat
   with no extra draw calls. Weigh these options (≥5, per NN-13): sample the blotch mask in world space at a large
   period (64–128u) in the shader instead of baking it into the tile · a per-plate hashed offset or rotation of the
   UV in the shader · a second low-frequency world-space breakup layer · a larger deck tile (for example
   16 × 16u, with the plate grid kept) · stochastic tiling. Find the deck material's `onBeforeCompile` or shader
   hook first. Measure: capture down a long straight before and after, and state the repeat period you can see.
   Send the captures to slur-supervisor. Keep holding the commit and push.
2. Wait for the owner's OK (through the supervisor). A likely tune: raise `Scratch.lift` / `Scratch.roughness` for
   the ship, or scale scratches down on the ship's box projection.
3. On OK: re-run gates, `git commit -- <uncommitted paths>` with `feat(scene): scratched cast-iron graphite
   finish (#258)`, `git push origin dev`, commit this handover.

## Open questions

- Owner: is the scratch density/strength right? Should the ship scratches be stronger?

## Lessons → memory

`.claude/memory/round-lobes-read-as-spots.md`
