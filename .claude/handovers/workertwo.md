Agent: workertwo · Lane: #302 marigold reads as orange (closed) · Updated: 2026-09-27

Older versions hold #301, #298, #290 and earlier (`git log -p -- .claude/handovers/workertwo.md`).

## Goal

- #302: make the primary colour read as marigold, not orange. Done and closed.

## Done

- `fff0555`: marigold `#F59A24` → `#F5B024` (owner picked B) in app.css (the hex + 4 rgba glows), accent.ts,
  apps/client/DESIGN.md, conventions/r3f.md. ADD §3 and ART_MATERIALS §7 item 20 have the decisions +
  departures note. Pushed to origin/dev. #302 closed with the SHA.
- Memory: preview-a-constant-by-route-rewrite (committed with this handover).

## State

- Before: HUD 245,154,36 (hue 34°). Bright 3D emissive 251,173,103 (hue 27°, sat 0.62). Deck halo hue 22° [measured].
- After, live /test-level: HUD 245,176,36. Bright 3D emissive 251,192,106 (hue ~36°). Deck halo hue 26° [measured].
- Cause: the hex (hue 34°). Neutral tone mapping at emissive 2 adds ~6° warmer and desaturates. It runs once,
  with no double tone map [measured + modelled].
- Lint 0 errors (7 warnings from before) and client typecheck 0, at fff0555 [measured].
- Variant PNGs in scratchpad c62984f8: marigold-{0-baseline-F59A24,A-F5AA24,B-F5B024,C-F5B624,B-F5B024-lowglow}.png.
- Headless Chrome: none left running (Playwright pipe, ps checked).

## Uncommitted

None of mine.

## Held files

None. The #302 files are released.

## Next

1. Wait for the next lane from slur-supervisor.

## Open questions

- Owner: Amber `#FFB52E` (hue 41°) now has almost the same hue as the new marigold. The M7 core-to-edge gradient
  now changes only in brightness. Keep it, or pick a hotter amber?
- Owner: paste the ChatGPT note (sent to the supervisor) into the art-direction project.

## Lessons → memory

- `.claude/memory/preview-a-constant-by-route-rewrite.md`
