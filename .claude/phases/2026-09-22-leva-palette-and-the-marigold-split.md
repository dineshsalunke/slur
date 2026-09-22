# leva, the ADR-008 palette, and the marigold split

**Date:** 2026-09-22 · **Issues:** #200 #201 #204 · **PRs:** #202 #203 #205

Supervisor session. Three threads: leva replaced the deleted tuning panel, the DOM palette was
brought up to ADR-008, and marigold was found to be inconsistent for a reason nobody had named.

## Merged to `dev`

| PR | What | Merge |
|----|------|-------|
| #199 | delete the tunables system, inline its defaults as constants | `723eb48` |
| #203 | `app.css` palette up to ADR-008 | `ea30356` |
| #198 | clear the lighting stack, retire `/env-lab` | `9475650` |

`dev` is now the bare-scene baseline: no lights at all, emissive surfaces only.

## Open

- **PR #202** — leva 0.10.1 + a lighting-scoped tuning panel. Retargeted from the merged-dead
  `art/clear-tunables` onto `dev`; `MERGEABLE CLEAN`. Branch `feat/leva-panel` must survive until it
  lands. Never playtested live — no slider was ever dragged.
- **PR #205** — unify marigold emissive intensity. Not visually confirmed; monolith seams drop 5x
  and rims 3x, so the scene gets darker.

## The marigold finding

The owner saw deck seams and monolith seams as different colours. Both already derived from
`ACCENT_ANCHOR`. The cause was brightness, not hue: `#f59a24` is `rgb(245,154,36)`, red near the
ceiling, so rising intensity clips red then green and the hue washes to cream. Five surfaces ran at
five intensities — deck 2, rail 2, rim 6, monolith seam 10, sealed-block seam 1. All five now route
through `MARIGOLD_REFERENCE_INTENSITY`.

A separate, earlier drift: `app.css` still held the pre-ADR-008 `#ff9f1c` and `#00e5ff` while the 3D
scene was correct, so marigold differed depending on whether it arrived via a material or a
`className`. Fixed in #203. `game/colors.ts` entry 1 is still `#ff9f1c` and was deliberately left —
it is a player identity hue, not the brand token.

## Open problems, none fixed

- **Blocks are invisible.** `sealed-block-material.ts` sets a near-black body colour and no
  `emissive`; with #198 there are no lights, so block bodies render pure black on black. The
  collision geometry is live — the owner dies on blocks he cannot see. Needs either the lighting
  rebuild or an explicit block treatment that reads unlit.
- **`monolith-group.tsx:69` overwrites its own config every frame.** `monolith-config.ts:58`
  declares `intensity: 2`, the JSX passes it, the `useFrame` stomps it. Left alone because #202
  reintroduces live tuning through those same writes.
- **The environmental tier is unimplemented.** `ART_MATERIALS.md` §3 puts monolith seams at
  "≤ 0.25 of gameplay"; `ENVIRONMENTAL_MARIGOLD_INTENSITY` (`track-materials.ts:55`, = 0.5) has zero
  consumers. The owner chose flat unification, so monoliths now match the deck instead of sitting
  below it. Worth revisiting after the lighting rebuild.
- **#198 left dead imports** in `track-rail.tsx` — `LocalPlayer`, `Sim`, and an unused `world` from
  `useWorld()`. Two of the nine standing lint warnings.
- **#202's PR body** still describes itself as stacked on `art/clear-tunables`. Stale prose.
- `art/clear-lighting-stack` and `art/clear-tunables` are both fully merged and safe to delete.

## Next

1. Merge #202, then playtest `/test-level` and dial the emissives live.
2. Decide the light source (options weighed in [[2026-09-22-lighting-strip]], still undecided).
3. Give blocks something that reads without lights.
4. Add rows for this note and the leva note to `.claude/phases/INDEX.md` — it exists on `dev` now.

## Related

- [[2026-09-22-lighting-strip]] — the removal this builds on.
- [[2026-09-22-leva-reversal-and-the-lighting-knobs]] — the leva reversal, written by that agent.
- [[2026-09-22-tuning-panel-and-punch]] — the original panel and the table that rejected leva.
