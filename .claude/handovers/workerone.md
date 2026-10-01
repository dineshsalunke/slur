Agent: workerone · Lane: RFC-349 F4b seeker (#397) — DONE, issue closed · Updated: 2026-10-01

Older versions: `git log -p -- .claude/handovers/workerone.md`.

## Goal

#397: move seeker into two feature folders (F4a pattern, 85365ecc). Owner approved S1–S6 on 2026-10-01.

## Done

- **Part 1, sim half: f80acb55.** S1–S5.
- **Part 2, client half: 65784e33.** S6.
  - `apps/client/app/features/seeker/`: `seeker.client.ts`, `seeker-glyph.ts`, `seeker-look.ts` (+ test),
    `seeker-trail.ts` (+ test), `seeker-field/`, `seeker-bodies/`, `seeker-pickups/` (+ test), `seeker-warning/`.
  - New `hud.overlay` slot (`define-client-feature.ts`) rendered by `engine/feature-overlays/feature-overlays.tsx`
    in `net-hud.tsx`, where SeekerWarning sat.
  - `splitPickupLayout` + `PickupLayouts` moved to `game/scene/pickup-layout/`, without seekers.
  - Docs: RFC-349 §3.8 "F4b result" + §7 row; `conventions/features.md` F4b slot rules.
- `gh issue close 397` done with both SHAs and the numbers.

## State (measured this session)

- Two SDK clients on :2567: 2 seekers decoded with all 9 fields, 2 seekerHit seen by both, B stun read by both, 0 decode logs.
- /test-level draws 76 (DPR 1, quality high). Seeker owns 4 (72 with seeker dropped from CLIENT_FEATURES in the tab).
  Black hole (#399) owns 1. Against F4a's 74, 1 draw is not attributed.
- 101 live shared dist modules import alone. 6 orphan dist files from F2 remain (stale output; 2 fail to import).
- Non-test central files naming seeker: 34 → 16. With tests 53 → 30.
- client 726/726. shared/server untouched by part 2 (585/585, 99/99 at part 1). Typecheck clean, lint 0 errors.
- Scripts in scratch `/private/tmp/claude-501/-Users-apple-Projects-personal-slur/546cf273-97b9-4c76-ae1b-373a1a85545d/scratchpad/`:
  `f4-bh.mjs` (draws + black-hole draws), `f4-noseek.mjs` (NOSEEK=1 drops seeker by route rewrite), `f4b-seeker.mjs` (SDK check).

## Uncommitted

- none.

## Held files

- none. Release all F4b claims.

## Next

1. Idle. Wait for the supervisor's next lane (F4c: mine, boost, shield or portal).

## Open questions

- Resolved: the 6 orphan dist files (+ .d.ts, .d.ts.map) were deleted on supervisor's word; `tsc -b --force`;
  101/101 dist modules import alone; typecheck clean.
- 1 draw on /test-level since F4a is not attributed (not seeker). Worth a look only if someone is chasing draws.

## Lessons → memory

- `live-hmr-sees-half-applied-edits.md`: feature moves remove the central mount + core glyph before registering.
- `shared-watcher-can-leave-dist-stale.md`: tsc leaves orphan dist files; skip them in an import sweep.
