# Supervisor handover — session 17 (2026-09-20)

## What shipped

**`art/track-slice2` @ `fcd9112`, pushed.** Slice 2 is code-complete, unmerged, no PR yet.

| Commit | What |
|---|---|
| `81000f1` | Re-shape — boundary becomes the slab's top-outer corner, not a rail on top of it |
| `e68d400` | Ruling recorded in LANE-FACTS |
| `fcd9112` | Retone — `#F59A24` @ 2.0; `FLOOR_METALNESS` 0.12 → 1.0, `FLOOR_ROUGHNESS` 0.62 → 0.42 |

**`docs/codex-reconcile` @ `84291fb`**, committed, **not pushed, no PR**. Adopts Codex's art-direction
reconciliation; keeps the Claude-owned sheets. Bin it freely if the owner has cooled on it.

## The finding — with pixels, at last

`.claude/art-pass/00-frame-tap/refs/s2-retone-bloomon.jpg` and `…-bloomoff.jpg`.

**The boundary is RIGHT.** Continuous narrow marigold at the upper outer edge, embedded not raised,
breaking over gaps, and it blooms into exactly the warm halo board 24 asks for. That half is done.

**The deck is WRONG, and not in the predicted direction.** The forecast was that metalness 1.0 would go
*black*, because the sky is ~linear 0.01 as an IBL source. It went *pale* — a near-white specular sheet
with the graphite texture washed out of it.

**Why (inferred, not yet measured):** the chase camera looks down the ribbon at a very shallow angle, and
Fresnel reflectance goes to 1.0 at grazing incidence for every material. So a metalness-1.0 deck mirrors
the star and the bright sky across almost its whole visible area, regardless of albedo — and the albedo is
genuinely dark, `BASE = '#14181e'` in `track-texture.ts`, so "darken the base colour" is NOT the fix. The
shipped 0.12 metalness was avoiding this by accident.

**This is the M1 question answered by a frame instead of by arithmetic.** The Codex sheet's own words
cover it — "Numeric settings are inherited first-pass tuning presets… Tune to the final references under
the real camera and lighting."

**Next, and it is one value:** sweep metalness down from 1.0 at fixed roughness 0.42 and screenshot each.
Roughness will blur the sheen but not remove it, because Fresnel is an angle term, not a roughness term.

## Still owed

- Frames are JPEG screenshots via the Chrome MCP tab, **not** the frame tap — the tap answered
  "nobody answered" on both 5201 and 5202 with the lab demonstrably loaded and `[vite] connected` in
  console. Unresolved; the screenshot route worked first time and cost nothing.
- **Stale dev servers are running**: 5201 + 5202 + 2601 (this worktree, two stacks), 5203, 5173/2567.
  Worth a sweep.
- No PR for either branch. Gate was green at `81000f1`; `fcd9112` had typecheck + lint only.

## The session's actual lesson

The owner stopped this session twice for the same reason: lanes and supervisor both spent their budget on
prose instead of pixels. The track lane burned 178k → 245k producing one docs commit and a refusal, and I
spent my own first half on a docs reconciliation while the thing the owner wanted was two screenshots.

**The frame was three commands.** Take the picture first; write about it only if the picture raises a
question.
