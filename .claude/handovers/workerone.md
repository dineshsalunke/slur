Agent: workerone · Lane: RFC-349 F1 engine skeleton (#385) — done, not pushed · Updated: 2026-09-29

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#385: engine skeleton. Registries, `defineSimFeature` / `defineClientFeature`, feature systems on the S16
scheduler, `FeatureViews`, a bridge loop over `net` handlers, the `step()` hook loop, and `PlayerState` from
`schema()`. Zero features. No behaviour or wire change.

## Done

- `1a5415c7` — sim half (see the previous version of this file).
- `f912f7ab` — client half. `engine/define-client-feature.ts` (`ClientFeature { id, sim, systems,
  views.scene, net }`), `features/client-features.ts` (`CLIENT_FEATURES`, `DEV_FEATURES`, both empty),
  `engine/active-features.ts` (`checkClientFeatures`, `ACTIVE_FEATURES`, `FEATURE_SYSTEMS`),
  `engine/feature-views/feature-views.tsx` (mounted in `net-canvas.tsx` after `<PortalField />`),
  `engine/bind-feature-messages.ts` (called in `attachRoomToWorld`, released in its cleanup; throws on a
  message type two features claim, before any subscribe), `FEATURE_SYSTEMS` spread into the `net`
  schedule, `@slur/shared` exports `features/*`, `.ls-lint.yml` `.feature.ts`/`.client.ts`,
  `conventions/features.md` (as-built slots, Q6 in §7, Q7 as §3 "Commands", §8 empty),
  `.claude/rules/features.md` (stale open bullet replaced).

## State

- `pnpm typecheck` clean (after S18 landed ab67960e). `pnpm test`: shared 578/578, server 99/99, client
  702/702. `pnpm lint` passes.
- One new Biome warning: `net/attach-room-to-world.ts` is 305 lines (limit 300, warning). It shrinks as
  handlers move into features.
- Vite on :5173 serves every changed module with 200. /test-level not flown by me `[unmeasured]`; with zero
  features there is nothing to render or bind.
- Local `dev` is 10+ commits ahead of `origin/dev`. I did not push.

## Uncommitted

- none of mine.

## Held files

- none. Release all F1 claims.

## Next

1. Supervisor pushes (or tells me to). Then `gh issue close 385 -c "F1 shipped: 1a5415c7 (sim half), f912f7ab
   (client half)"`.
2. Idle for the next lane.

## Open questions

- Push `dev` now, or batch with other lanes? (supervisor)

## Lessons → memory

- none new. Fish does not word-split `$P`; the `git commit -- $P` form passed one path string and failed
  loudly (no harm). `bash-tool-runs-fish.md` already covers the shell.
