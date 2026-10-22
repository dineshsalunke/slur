Agent: workerthree · Lane: scene folder grouping, RFC-349 S11 (#412) · Updated: 2026-10-20

## Goal
Group the world no feature owns under `game/scene/{post,track,sky,ships}/`, one commit per group. File moves
and import paths only. Order (supervisor): post → track → sky → ships.

## Done
- post: ff3f5162 — scene-effects/, boost-blur/, tone-mapping, canvas-gl → `game/scene/post/`.
- track: 56f2ad79 — 93 files → `game/scene/track/` (incl. shader-patch); 24 importers; ADD.md,
  ART_SCALE_REFERENCE.md and 3 memory pointers.

## State
- Supervisor decisions: shader-patch → track/; canvas-gl → post/; asteroids + meteors → sky/; root leftovers
  stay at root, no 5th group.
- Verification agreed: typecheck, lint, 3 suites, build per commit; /test-level draws + landing/beat-deck
  load check at the end. No RunSim A/B (no shared/server file changes).
- track commit: shared 0 fail, server 101/101, client 736/736, build ok.
- Red full `pnpm lint` at 56f2ad79 came from workerfour's uncommitted `packages/shared/src/run/*`, not S11.

## Uncommitted
- Sky group MOVED on disk, NOT verified (session killed 2026-10-20 by the owner before checks ran). The
  supervisor cleared the sky claim. In the tree: the old `game/scene/` sky files deleted, new
  `game/scene/sky/` untracked, importers edited (`world-scene.tsx`, `landing-scene.tsx`,
  `track/block-debris/block-debris.utils.ts`, `dev/tuning-schema.ts`, `dev/tuning-panel/tuning-panel.utils.ts`),
  `CREDITS.md` path, and `.claude/handovers/workerthree-move.mjs` deleted (it broke biome).
  To finish: typecheck, lint, 3 suites, build; then a pathspec commit. CAREFUL: `tuning-schema.ts` and
  `tuning-panel.utils.ts` also carry workertwo's committed rules work. Check `git diff` on them shows only
  import paths before committing.
- The move script is now gone from the tree. Recover with `git show e8d29fa2:.claude/handovers/workerthree-move.mjs`
  for the ships group.
- Old session id (for `claude --resume`): 3c893b3e-0f7e-4a9c-948e-3aac449db4cb.

## Held files
- Sky group (cleared by the supervisor): the files above.

## Next
1. **Blocked.** Sky: workertwo holds `dev/tuning-schema.ts` and `dev/tuning-panel/tuning-panel.utils.ts`
   uncommitted (a pathspec commit would sweep its edits). Ships: after #407 closes (workerone's
   reader-parity harness runs over ship readers). Wait for the supervisor's go.
2. Sky group (→ `game/scene/sky/`): game-environment, scene-environment, scene-backdrop/, env-band/, hdri/,
   black-hole/, rock-field/, asteroid-band/, asteroid-config/-field/-geometry/-surface (+tests),
   meteor-assets, meteor-schedule(+test), meteor-scorch.test, meteor-chunks/, meteor-scorch/,
   meteor-strikes/. Prose: CREDITS.md:54 (black-hole path).
3. Ships group (→ `game/scene/ships/`): ships, ship-view, ship-model/, ship-shadow/, ship-dead,
   ship-materials(+test), ship-visuals, hull-look, gltf-lfs-guard(+test), exhaust-drive/-geometry/
   -material/-ports(+tests), exhaust-field/, exhaust-reflections/, explosion-field/. Prose:
   conventions/r3f.md:36, apps/client/PRODUCT.md:56.
4. Per group: re-claim with the supervisor (dry-run lists importers). Map json = `[[from,to],…]` relative to
   `apps/client/app` (dirs allowed). `node .claude/handovers/workerthree-move.mjs <map>` (dry), then with
   `write`. Capture `git status --short -uall` before/after; touched = new `M`/`??` lines.
   `xargs pnpm exec biome check --write < touched` (zsh does not split `$F`). Doc pointers. typecheck, lint,
   3 suites, build. `xargs git add -A --` then `xargs git commit -m … --` from the path list. Push.
5. End: /test-level draws, landing + beat-deck load (ask before starting the stack; it may be up). Close
   #412 with post/track/sky/ships SHAs.

## Open questions
none

## Lessons → memory
none (move-script lesson is in `bulk-ast-edits-via-ast-grep-json.md`; tool saved as
`.claude/handovers/workerthree-move.mjs`)
