Agent: workerthree · Lane: #351 live marigold dial (research done, NOT claimed, no edits) · Updated: 2026-09-28 (seam at ~153k)

## Goal
#351 (owner): one dev-panel colour dial `Accent.color` (default `#F5B024`) on /test-level drives every 3D
marigold use AND the Tailwind `--color-marigold`. Derived tiers stay derived. A Copy button for the value.
Owner verifies on /test-level. Close the issue with the SHA. #344 race-profile plan is PARKED until this lands.

## Done
- #349 §5 sent; workerone merged it at 77d7df6 (my stages renumbered S14–S21, scheduler = S16). Nothing more owed.
- 8c9f100: handover + memory `useframe-order-is-subscribe-time.md`.

## State (read this session; re-verify lines before editing)
- Anchor: `game/scene/accent.ts:3` `ACCENT_ANCHOR = '#F5B024'`; `accent()` returns ONE shared `THREE.Color`; `accentDerived(fn)` computes a copy ONCE.
- Tuning: `dev/tuning.ts` `col/setCol`; `dev/tuning-schema.ts` `COLOR_TUNABLES` (imports ACCENT_ANCHOR → a cycle if accent.ts imports tuning; move the constant to `game/scene/accent.constants.ts`). Panel: `dev/tuning-panel/tuning-panel.tsx` (leva `useControls`), `colorControl()` in `tuning-panel.utils.ts:17`. Copy pattern: `dev/tuning-export.ts` `copyDefaults` (leva `button`).
- `rebuild: true` → `bumpRebuild` → every `useRebuildToken` user rebuilds (track textures, blocks, monoliths). Do NOT use it for this dial: leva fires onChange per drag tick.
- Sites that are LIVE once the anchor mutates in place (they hold the object): `shield-look.ts:109`, `bolt-streak-material.ts:50`, `boost-streak-material.ts:47`, `pickup-pool-material.ts:33`, `ship-model.tsx:54`, `pickup-body.ts:16`, `portal-pickups.utils.ts:19`, `bolt-embers.ts:64` [check it holds, not copies]; and per-frame `_c.copy(accent())` in tug-line, mine-shock, block-burst, portal-field, seeker-bodies, meteor-scorch, meteor-strikes, mine-bodies, rock-field. Check none of them mutates the value in place.
- SNAPSHOT sites to convert:
  - `track-materials.ts:67–80` `MARIGOLD_EMISSIVE` in `BOUNDARY_SURFACE`/`SEAM_SURFACE` → used by `track-rail.tsx:19`, `track-seams.tsx:17`. Add `emissive.copy(accent())` in their existing useFrame.
  - `monolith-config.ts:39`, `track-rim.utils.ts:100` (param copy), `finish-gate.tsx:20,22` (string prop).
  - module Colors: `explosion-field.constants.ts:22` MARIGOLD, `hit-spark.constants.ts:24` SPARK, `meteor-assets.ts:24` TAIL, `exhaust-material.ts:51` `.clone()`.
  - `accentDerived` module consts: `sealed-block-shader.ts:25`, `fractured-block-shader.ts:20` → registry, re-derive in place on change.
  - `power-arc/glyph-atlas.ts:6` own `'#f5b024'` string, rasterised to a canvas → needs re-raster on change.
  - Dials defaulting to the accent: `Env.bandColor` (`nebula-env-shell.ts:64`), `Exhaust.cool` (`exhaust-field.utils.ts:16`). Proposal: follow the accent while unchanged from default.
- DOM: `app.css:18` `@theme { --color-marigold }` (plain `@theme`, not `inline` → utilities use the var [recalled; verify in served CSS]). rgba(245,176,36,…) copies at `app.css:66,68,80` → `color-mix(in oklab, var(--color-marigold) N%, transparent)`. Set the var with `document.documentElement.style.setProperty`.
- Track editor 2D canvas hexes `routes/test-level/track-editor/track-editor.constants.ts:30,47,61,79` — outside the issue's list; ask or leave.
- Intensity tiers (`MARIGOLD_REFERENCE_INTENSITY`, finish-gate ×2, rim) are scalars → already derived; untouched.
- Proposed mechanism (weigh ≥5 in the PR body, NN-13): the panel control's onChange calls `setCol` + `syncAccent()` (anchor.set, re-derive registry, CSS var, atlas re-raster). Startup sync from restored `col('Accent.color')`. Alternatives to weigh: rebuild token · pull-compare inside `accent()` · per-path tuning listeners · world trait · per-site useFrame copies.

## Uncommitted
none

## Held files
none — claim NOT yet sent to slur-supervisor.

## Next
1. Send the claim to slur-supervisor: accent.ts, new accent.constants.ts, tuning-schema.ts, tuning-panel.tsx(+utils), app.css, and the snapshot files above. Wait for "clear" (workertwo is planning #350 seams).
2. Build; `pnpm typecheck && pnpm lint && pnpm test`; verify on /test-level (drag the dial: rails, seams, pickups, portal, power arc, HUD buttons change).
3. Commit by pathspec, push, `gh issue close 351 -c "<what + SHA>"`.
4. Then resume the #344 race-profile plan (sent to the supervisor; awaiting go + a time window).

## Open questions
- Should `Env.bandColor` / `Exhaust.cool` follow the accent, or stay independent dials?
- Is the track-editor canvas in scope?

## Lessons → memory
none this seam
