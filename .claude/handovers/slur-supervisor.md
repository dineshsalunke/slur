Agent: slur-supervisor · Lane: supervision · Updated: 2026-09-24, ~04:00

## Goal

Assign lanes, hold the file-claim table, relay plans and questions between the owner and the workers.
The rules are in `CLAUDE.local.md`. The clear and resume steps are in memory `supervisor-clears-workers-via-herdr.md`.

## Done this session

- #213 leftovers (workerthree): `1ccc673` `0dd9b97` `56dc932` `c21a50b`; live two-client check passed, #233 closed.
  #231 graze and #232 pocket trap are open and wait on the owner.
- /pacing step 1 (workerone) `5211671`. Step 2 (jump contract) waits on the owner's look at /pacing.
- Lobby comp B (workerfour) `efd671f` `7b4579f` `e26a79c` `3a92a96`.
- Debug UI `2a05eda`. `game/net-debug-hud.tsx` is an orphan: git rm was permission-blocked, so the owner must run it.
  `--color-debug` goes with it.
- Hosted HUD = /test-level set (#236, workerone) `b255460`. #236 is open for owner review.
- PUSHED local dev to origin: `81f9462..16a6829` (84 commits). Owner request.

## PR merge (owner-approved order, NOT yet assigned: no worker was free)

Give it to the first worker that finishes. Steps:
1. `gh pr merge` 188 (docs, clean) and 225 (draft: mark it ready first; clean).
2. Merge 230, then 237 (mahendradambe's fork PRs; heads at `refs/remotes/pr/230`, `pr/237`) into local dev.
   Resolve the conflicts: 230 conflicts in tuning-schema.ts, sealed-block-material.ts, ART_MATERIALS.md. 237 adds
   block-debris.tsx and metal.ts. Run tests, push, and let GitHub close the PRs (or comment + close).
3. 195 (the owner's feat/ship-feel, 33 commits, 134 files, needs a rebase) gets its own lane LATER.
Check the claims first: the conflicting files may be held by then.

## Workers (all building, owner-approved)

| Worker | Pane | Lane | Held files |
|---|---|---|---|
| workerone | w2P:pD | #241 hosted finish curtain + camera watch; hide FlightReadout after the own finish | game/finish/* (git mv from routes/test-level finish-*), test-level local-loop.tsx + test-level-canvas.tsx (imports), net-loop.tsx, net-canvas.tsx, finish-watch.ts(+test), net/standings-store.ts(+test), hud/net-pilot-readout.tsx |
| workertwo | w2P:pF | #240 in-race Leave + mute ghost restyle, SVG speaker, click-no-focus fix, hide AudioToggle in lobby AND finished | leave-button.tsx, audio-toggle.tsx, overlays.tsx, ui/ghost.ts, ui/speaker-glyph.tsx, DESIGN.md (In-race controls entry) |
| workerthree | w2P:pG | #239 pickup SFX cut (engine-level `cut`), plus a pickup sound on /test-level | audio-engine.ts(+test), sfx-map.ts, test-level local-combat.ts(+test), test-level route.tsx |
| workerfour | w2P:pH | #238 results comp B (winner card); "<Name> wins", "Race again ›", Enter = Race again, staggered rows | results-overlay.tsx + new leaves, overlays.test.tsx (results tests), DESIGN.md (Results section) |

Hand-off agreed: the curtain owns the local finish (it never holds black), and results mount on PHASE.finished
above z-30, independently.

## Open owner decisions

1. Click Copy link once in a real tab.
2. Owner-run `git rm apps/client/app/game/net-debug-hud.tsx` and drop `--color-debug`.
3. #231, #232, perf fixes, pacing step 2, PR 195 rebase.
4. Rail seam lip yellow (old). 5. Untracked `.claude/agents|skills/` (break `pnpm lint`). 6. docs/art-direction changes are ChatGPT's; leave them alone.

## Uncommitted

none of mine.

## Since the seam (~04:15)

- #240 landed `aee81fb` (workertwo). Stills in `.claude/frame-tap-refs/240-*`. Its claims are released.
- workertwo cleared and given the PR merge lane (188, 225, then 230 + 237 with conflicts resolved; 195 out of scope).
  It sends its conflict files for a claim check before the first write.
- QUEUED for workerfour after #238 (owner): remove the ship picker from the main menu. Keep the ship store.
  Plan + issue first.

- 188 + 225 MERGED on GitHub by workertwo (~04:25). Local dev pushed first (787b7be). Local dev is now BEHIND
  origin/dev by those two merges.
- Shared index held workerone's staged renames, so `git merge` here is unsafe. Owner APPROVED a detached worktree
  `../slur-worktrees/pr-merge` for workertwo: merge 230 → 237 there, `git push origin HEAD:dev`.
  THEN: sync this checkout (`git merge origin/dev`) ONLY when `git status` shows nothing staged and the workers
  are idle or committed. Ask workertwo, or do it yourself.
- workerfour cleared + resumed at ~04:20 (building #238 comp B from its handover spec).

## Next

1. Relay each lane's result (stills/SHAs) to the owner.
2. After workertwo's push: sync the checkout at a clean-index moment (above).
3. Check workertwo's merge claims against workerone (net-*), workerthree (audio, test-level), workerfour (results).

## Lessons → memory

none.
