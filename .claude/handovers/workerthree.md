Agent: workerthree · Lane: #363 remove hidden W throttle key (CLOSED) · Updated: 2026-09-29

## Goal
Remove the silent W throttle key: with Ctrl held (fire/drop), W auto-repeat sends Ctrl+W and the tab closes on Windows/Linux Chrome.

## Done
- 056e436: keyboard.ts throttle reads KeyQ only; GDD.md controls note; lobby-chat.test.tsx holds KeyQ. Pushed. #363 closed with the SHA.
- d47a026 (#362): cyclorama_hard_light default HDRI. 400c7ea handover.

## State
- Client vitest 97 files / 665 tests pass. Biome clean on touched files (one warning elsewhere: track-texture.ts line count).
- No KeyW left in apps/client/app.
- Chrome cannot cancel Ctrl+W from a page [recalled, not tested].
- R/F/E risk: under Ctrl, handlePowerKey returns early without preventDefault → Ctrl+R reloads, Ctrl+F/Ctrl+E steal focus [read from source, not tested in a browser]. Owner deciding via supervisor.

## Uncommitted
none

## Held files
none

## Next
1. Idle. Wait for the owner's answer on R/F/E and the #362 band/intensity dials.

## Open questions
- Owner: R/F/E under Ctrl — remove them, or preventDefault them under Ctrl?
- Owner (#362): keep bandIntensity 1.5 or raise to 5–7; lower Environment.intensity?

## Lessons → memory
none
