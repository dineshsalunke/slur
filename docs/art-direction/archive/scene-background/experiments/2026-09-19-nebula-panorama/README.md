# Nebula panoramic sky — first candidate

Status: unapproved texture experiment, not a validated seamless cubemap. Art direction only; Claude owns conversion and integration.

Source artwork: [nebula_panorama_01_CANDIDATE.png](nebula_panorama_01_CANDIDATE.png). Generated using the built-in image tool from approved board 25 as an atmosphere reference. [Exact prompt](PROMPT.txt).

Actual file: 1774 × 887, exactly 2:1, 8-bit RGB PNG. The prompt requested ideally 3840 × 1920, but the output is lower resolution. It is not an HDR lighting map. A 2:1 aspect ratio alone does not establish valid spherical projection or seamless wrapping.

## Visual assessment

Dark charcoal voids, desaturated slate-blue cloud edges, branching dust bands and broad open areas follow the approved nebula direction. Planets, track, props, ships, HUD and warm gameplay energy are absent. The top and bottom become dark and low-detail. Some bright cloud rims and dense star regions may compete with gameplay and need review in context.

The left and right borders visibly contain different cloud structures; horizontal continuity is not certified. Polar continuity and distortion have not been tested in a spherical viewer. Treat this as a visual source candidate requiring wrap repair/validation before production use, not six ready-to-load cube faces. Generated appearance does not establish an exact physical projection.

## Handoff scope

After visual approval, Claude can assess spherical wrapping, correct the longitude seam and polar behavior, convert to the project's cube-face convention and review at gameplay exposure. Preserve deep blacks and faint cold colour; avoid raising exposure to reveal every cloud detail. Keep planets separate for composition flexibility. Do not use this LDR sky as an approved scene-lighting prescription.

No application code, runtime textures or integration settings changed.
