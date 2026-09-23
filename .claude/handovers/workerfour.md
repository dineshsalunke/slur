Agent: workerfour · Lane: main-menu rework (no issue number yet) · Updated: 2026-09-24

## Goal

Rework the main menu (`/`) to match `docs/art-direction/golden-reference/cruise-lighting.png`, using the
impeccable skill. The owner must approve the plan before any build.

## Done

- No code commits. Planning only.
- Impeccable init: the owner's answers are in `apps/client/PRODUCT.md` (untracked).
- Layout round: the owner locked **Broadcast lower third** (seed `31489d20`, code-led). The direction
  contract is in `apps/client/.impeccable/surfaces/app-routes-home-tsx.md` (untracked).
- Plan and file claims sent to slur-supervisor (msg `037530a0`). Awaiting owner approval.

## State

- Current menu: 13 draws/frame, JS 0.30 ms median, 0.50 ms p95 (headless, SwiftShader).
- `/test-level` full WorldScene: 116 draws/frame, JS 1.1 ms median.
- Cyan on the menu: drei Grid `sectionColor="#1fa8c8"`; `ui/button.tsx` primary `bg-cyan`; `ui/panel.tsx`
  wedge; call-sign `focus:border-cyan`; `lobby/room-list.tsx:44` `text-cyan`.
- `ui/button.tsx` and `ui/panel.tsx` are imported only by `call-sign-console.tsx` and `room-list.tsx`.
- The server accepts `SET_CLASS_MESSAGE` only in `PHASE.lobby` (`apps/server/src/rooms/run-room.ts:92`).
- The HUD face is Chakra Petch (`--font-readout`, `app/app.css:42`).
- The owner typed `/impeccable install`. That is not a command. It was not run; the owner was asked
  what they meant.

## Uncommitted

- `apps/client/PRODUCT.md`, `apps/client/.impeccable/**`: impeccable artefacts. Commit only on the
  owner's word.
- `.claude/agents/`, `.claude/skills/`: from the plugin install, not mine.

## Held files

Granted by the supervisor: `ui/button.tsx`, `ui/panel.tsx`, `lobby/room-list.tsx`. Claimed pending
approval: `routes/home.tsx`, `routes/home/*` (plus new `ship-picker.tsx`, `key-hint.tsx`,
`menu-ship.ts`).

## Next

1. Wait for the owner's approval through the supervisor.
2. Rerun `impeccable context --target apps/client/app/routes/home.tsx` from `apps/client`. Read
   `.claude/skills/impeccable/reference/craft-floor.md` before the first UI edit.
3. Build two throwaway backdrops in `landing-scene.tsx`: (a) lean hand-built; (b) GameEnvironment +
   TrackView + SceneEffects over a short `resolveTrack()` track. Measure both with the probe (memory
   `count-draw-calls-without-repo-edits`). Report both to the supervisor and pick one.
4. Build the lower-third DOM layer, the ship picker and the key hint. Change the cyan to the approved
   look. Send `SET_CLASS_MESSAGE` after host/join.
5. Run `impeccable detect --json`, take desktop + mobile captures into `apps/client/.impeccable/review/`,
   run the finish reviewer, then the documenter (DESIGN.md).

## Open questions

- Owner: what did `/impeccable install` mean? Options: `hooks on`, `doctor`, or `npx impeccable update`.
- Owner: commit the impeccable artefacts (`PRODUCT.md`, `.impeccable/`)?
- Supervisor: file a GitHub issue for this lane (CONTRIBUTING requires one before build).

## Lessons → memory

`.claude/memory/count-draw-calls-without-repo-edits.md`
