Agent: workerone · Lane: #320 portal gate width + hop cue (PLAN FIRST) · Updated: 2026-09-27 (seam before start)

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#320 "Portal looks 4u wide (should read 6u) and a hop has no clear cue".
1. The drawn portal gate must match the sim catch width, 6u across (`portalR: 3` in `packages/shared/src/combat/portal.ts`, `portalH` 5u; GDD §5 Portal: *"its hull is within **3u** of the ring in x (`portalR`)"*).
2. Add a clear hop cue so the player knows they travelled.

**Plan first. No edits until the owner approves** (relay through slur-supervisor).

## Done

- #318: 4b17a2e (block capacity per track + ahead-first emit), fc85cd7 (editor keeps walls whole). Closed. Handover 2cc7d28.
- #320: read the issue only. No measurement or code reading yet.

## State

- Issue facts (from the issue body, not yet verified by me): the visual rings come from #303 (5e9abd0, a procedural linked-ring pickup + A/B gate). ART_SCALE_REFERENCE may need a correction if it disagrees.
- Owner's hop-cue candidates: screen flash or chromatic warp on exit, FOV punch, exit-ring burst, entry/exit sound, brief HUD tag, camera snap smoothing.
- Stack is up on :5173/:2567 after the reboot [told by the owner, unmeasured].

## Uncommitted

None of mine. Owner data in `tracks/`, not mine, do not commit: `groove-20260921.json` deleted, `phrase-20260921.json` untracked.

## Held files

None yet. Claim goes to the supervisor with the plan.

## Next

1. `gh issue view 320`. Read `packages/shared/src/combat/portal.ts` (portalR, portalH, how the hop moves the ship), `git show 5e9abd0 --stat`, then the gate renderer it added. Find the ring radius, tube and scale constants.
2. Measure the drawn gate on /test-level. Use headless Playwright (`playwright-from-npx-cache-needs-system-chrome`, DPR 1, mute). Grab the scene (`three-devtools-hook-gives-the-scene` or the onBeforeRender hook). Find the gate mesh and read its world bounding box in x (inner and outer edge). Compare it with 2·portalR = 6u. Stage a portal: see `stage-a-mine-on-test-level` (slot write + KeyE) and the portal kind index in the shared combat constants. Kill Chrome after.
3. Check `docs/ART_SCALE_REFERENCE.md` for a portal entry.
4. Look for existing hop hooks: a client event or state change on hop (client ECS / room state), existing SFX (docs/AUDIO.md, the audio module), and existing VFX (block-burst, flash, FOV code in the chase camera).
5. Send the plan to slur-supervisor. It must contain the measured width vs 6u, the size fix (which constant, in which direction; inner vs outer edge = catch edge), 3–5 hop-cue options weighed (visual + audio: correctness · one clock · re-render cost · idiom fit · reuse of an existing loop) with a recommendation, and the file claim.
6. After approval: build, verify on /test-level, commit by pathspec, `gh issue close 320 -c "<SHA>"`.

## Open questions

- #315: should the mirror show in the finished phase?
- #308: should a no-op editor edit push an undo step?
- `unionRects` (fc85cd7) depends on order. Tell me if the owner wants a canonical form.

## Lessons → memory

none this seam.
