Agent: workerone · Lane: #345 scene lighting (SHIPPED, owner check pending) · #337/#339 open until deploy · Updated: 2026-09-28

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#345: the track reads evenly bright at every distance and facing on every tier. Space stays dark.
Owner approved option 6.

## Done

- `8c94537` #345 option 6: `Metal.baseColor` #7b7f86 (F0 ≈ 0.2, metalness 1). New `Hull.baseColor`
  #4a4d52 keeps hulls unchanged. New `game/scene/key-light/key-light.tsx` (world-fixed DirectionalLight
  #cfd8e6 ×2 from (10,30,−20), no shadows, `KeyLight.*` dials + panel group). Docs: ART_MATERIALS rev. 9
  §7 item 21, ADR-029, ADD lights list. Pushed. Comment on #345, left open for the owner.
- `7022faf` memory index line (raycast luma probe).
- Found #344 P2's black canvas on quality=low (post gate + priority-0.25 useFrames). workerthree fixed it in `286c8ef`.
- Earlier: #339 `fda4814` `e8bb786` `8fc2486`, #337 `59a4599` (pushed, not deployed). #342 `eaeb301`.

## State

- Luma medians at spawn on /test-level, old → new. High: deck <30u 15.2→43.5, 30–80u 27.4→50.0,
  80–160u 34.4→58.0, block fronts 14.5→36.2, frame 23.2→36.9.
- Low: deck 15.2→42.3, 25.2→47.2, 30.4→53.4. Block fronts 5.9→30.8.
- Draws: +0 (124 high, 47 low). GPU, uncapped 1600×900: high 9.5 ms both; low old 3.0–5.6, new 4.6–5.8 (noise).
- Hull-bright option (`Hull.baseColor` #7b7f86): hull luma near 50→83. Screenshot `high-hullbright.png`.
- Typecheck, lint and 627 client tests pass.
- Probe + shots: `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/c84f5797-672f-4083-a451-e043b6bd4666/scratchpad/light/`
  (`probe.mjs` gained `UNCAP=1`). Before/after shots: `high-old-old.png`, `high-new-new.png`, `low-*`.

## Uncommitted

- none of mine. Other workers' changes in the tree: packages/shared/*, routes/test-level/tuned-sim-config.ts.

## Held files

- none (the #345 claims are released on commit).

## Next

1. Owner checks #345 on /test-level. Hull choice: keep dark (default) or set `Hull.baseColor` #7b7f86.
   Close #345 with the SHA after the owner signs off.
2. After the owner deploys: prod /metrics in a race, then close #337 and #339.

## Open questions

- Owner: hulls dark (#4a4d52, current) or bright (#7b7f86)?
- Kick button on the results rows (#342 follow-up)? Still with the owner.

## Lessons → memory

- none this seam. The vsync-capped meter (16.7 ms for all variants) is already handled by the
  perf-analysis scripts, which uncap.
