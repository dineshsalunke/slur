# Handover — monolith metal texture swap (2026-09-23)

## Done, committed, on `dev`

- `a4f909f` — monoliths (`apps/client/app/game/scene/monolith-group.tsx`) now render with the same
  `Metal046B` photographic metal maps as the deadly obstacle blocks (`useSealedBlockMaps`), replacing
  the procedural canvas panel texture whose tiling (`Monolith.plate = 17`) looked misaligned. Added
  `Monolith.textureSpan` / `Monolith.normalScale` dev-tuning knobs (mirroring `Block.*`), removed the
  dead `monolithBodySurface`/`monolithSurfaceParams` procedural path and the `Monolith.plate`/
  `plateColor` tunables. Typecheck, biome, comment-ratio and vitest all green; verified live in
  `/test-level`.
- `807ca9e` — `docs/ART_MATERIALS.md` Revision 6 + `docs/ADD.md` §4 updated to record this as an
  accepted owner decision, not silent drift: monoliths move from material family M3 (dielectric
  stone) to M2 (coated metal), which cuts against a named 2026-09-19 owner decision (§7 item 1) that
  chose block metal *specifically* so hazards read differently from scenery. New project memory
  `.claude/memory/monoliths-are-metal-now.md` carries the same story for future sessions.

## Left open — real, not busywork

**`ART_MATERIALS.md` §4 criterion 2 has not been re-gated.** That's the "hazard vs scenery
unambiguous in the Monolith Field sector at cruise speed" test, written against the old M3/M2 split.
Nobody has looked at the converged material in that specific framing yet. §7 item 11 names the
fallback order if it fails a look: seam colour/count, then coat finish, then texture scale — before
reaching for a second image texture. This needs a human (or a playtest agent) actually looking at the
Monolith Field sector up close at speed, not a code check.

## Not mine — do not touch

At handover time, another concurrent session has uncommitted work in the shared checkout:
`apps/client/app/game/scene/rear-view.tsx` → `rear-view-pass.tsx` (renamed), plus new
`apps/client/app/dev/rear-view-toggle.ts` and `apps/client/app/dev/typing-target.ts`. Recent `dev`
log entries ("the forward judder, and the camera axis that hides half of it") suggest camera/rear-view
work in progress. Leave it alone — per
`.claude/memory/shared-checkout-shares-one-git-index.md`, `git add` is not session-local.
