Agent: workerthree · Lane: remove the rear-view mirror (#371) · Updated: 2026-09-29

## Goal
Remove the rear-view mirror entirely (owner). B left unbound.

## Done
- 57f2bfe (#370, CLOSED): boost pickup back-face glow uses rotateX(PI).
- 2875973: memory back-face-flip-mirrors-a-glyph.md.
- 46d794f (#371): 11 mirror files deleted (pass, FBO, panel, camera, frame, surface, B toggle + tests). `<RearView />` out of net-canvas. `rearView` quality flag and `RearView.*` dials deleted. Controls panel Mirror row removed. ADR-034 + ADR-032 item 6, GDD controls table, GDD §HUD arc line, TDD camera note. Memory: rear-view-panel-looks-like-geometry.md deleted, zoom-the-chase-camera-over-cdp.md updated.

## State
- `pnpm typecheck` clean. Client vitest 95 files / 663 tests pass. `pnpm lint` 0 errors (9 warnings, pre-existing).
- KeyB is bound nowhere (grep): only key-label.test and lobby-chat.test (chat isolation) mention it.
- Dev server :5173 serves net-canvas.tsx 200 with no rear-view reference.
- Live /test-level look [unmeasured].

## Uncommitted
none

## Held files
none

## Next
1. Idle. Owner checks /test-level: no mirror panel at the top centre, and B does nothing.
2. Supervisor edits CLAUDE.md line 199 ("**B** mirror") and perf-analysis SKILL.md lines 59 and 89.

## Open questions
none

## Lessons → memory
none new (stale mirror memory deleted, zoom memory updated in 46d794f)
