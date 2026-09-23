Agent: workerfour · Lane: in-room ship pick, comp B (no issue, waived) · Updated: 2026-09-24 ~02:45

## Goal

Build the in-room ship pick (PHASE.lobby overlay) to comp B, which the owner picked. Also approved: a
Copy-link chip, Enter = GO for the host, a HOST word tag in place of ★, and the deep-link join.

## Done

- `9b97078` + `a894141` `apps/client/DESIGN.md` + `.impeccable/design.json` (menu system).
- `efd671f` step 1: ship store and stepper, ship sent on every entry, deep-link join.
- `2a05eda` owner request via supervisor: tuning panel hidden by default (Backquote toggles), NetDebugHud
  unmounted from net-canvas. `game/net-debug-hud.tsx` is NOT deleted: the classifier blocked `git rm`, and
  the owner chose to commit without the delete. The file is an orphan. `--color-debug` in app.css is unused.
- `7b4579f` comp B lobby: leaves `room-title`, `copy-link`, `spec-tag`, `roster` (chips),
  `lobby-ship-picker`, `colour-swatches`, `start-control`; `leave-button` gets `tone: 'hud' | 'ghost'`;
  `ui/button` gets optional `type`/`onClick`; AudioToggle hidden in PHASE.lobby (M still mutes). 3 new
  tests in `overlays.test.tsx` (Roster/SpecTag boundary, D sends SET_CLASS, Enter host-only).

## State

- tsc clean, 247/247 vitest, comment ratchet + ls-lint pass. Biome errors exist only in scene files
  (`track-rail`, `track-texture`, `world-scene`), which are not mine.
- Headless check (port 9471, DPR 1, mute, killed after) on :5173/:2567: host lobby, guest by deep link
  ("Hosty's run"), bad id → `/?run=closed` with the notice, D cycles the class, host Enter leaves the
  lobby, guest Enter does not, scrollWidth 390 at 390×844. Shots in this session's scratchpad `shots/`.
- Copy link NOT verified: headless clipboard write fails with "Document is not focused" [unmeasured in a
  real browser].
- Finish review (impeccable-finish-reviewer) launched on 7b4579f; result pending.

## Uncommitted

None.

## Held files

`game/overlays/{lobby-overlay,roster,leave-button,overlays,overlays.test,room-title,copy-link,spec-tag,
lobby-ship-picker,colour-swatches,start-control}.tsx`, `game/net-canvas.tsx`, `dev/panel-visibility.ts`,
`routes/game/route.tsx`, `net/matchmaking.ts`, `ship/*`, `ui/{key-hint,chevron,field-label,button}.tsx`,
`apps/client/DESIGN.md`. Menu files as before.

## Next

1. Apply the material fixes from the finish review; re-shoot headless; commit.
2. Update `apps/client/DESIGN.md` with the lobby surface; commit.
3. Report to the supervisor and ask about the orphan `net-debug-hud.tsx` delete.

## Open questions

- Delete `game/net-debug-hud.tsx` (owner must run `git rm` or allow it).

## Lessons → memory

`.claude/memory/biome-class-sort-glues-arbitrary-property.md`.
