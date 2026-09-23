# Handover — the four-corner HUD

Session of 2026-09-22. Branch `dev`, shared checkout with `slur-supervisor` (block/monolith
surfaces) and `rearview-mirror` (rear-view, net-canvas, track-instancing).

## State: done and committed

`7996fc5 feat(hud): the four-corner readout from the approved boards, in /test-level`.
Closes issue #209. `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all green at that
commit; lint's 9 warnings are pre-existing file-length ones in `packages/shared`.

Verified on screen at `/test-level`: all four blocks render over the real track, speed and progress
track the ship, the clock runs.

### What was built

The HUD carried by both approved golden-reference boards — `cruise-lighting.png` and
`scene-and-hud.png` show the *same* HUD, so the layout was already settled. No panels, no borders,
flat uppercase type on the scene in four corners.

| File | Role |
|---|---|
| `game/hud/hud-layer.tsx` | Fixed frame, viewport insets, font/colour/text-shadow inherited by all blocks. Zero subscriptions. |
| `game/hud/roster-panel.tsx` · `roster-line.tsx` | Top-left `8 CONNECTED` + rows; self row marigold. Exports `RosterEntry`. |
| `game/hud/flight-readout.tsx` | Bottom-left `70 u/s` + `4 / 8  42%  00:48`. **The only per-frame subscription.** |
| `game/hud/power-slot.tsx` · `power-gem.tsx` | Bottom-right gem + label + key hint. Gem is an inline SVG stand-in for the board's rendered pickup. |
| `game/hud/readout-format.ts` + `.test.ts` | Pure formatters, unit-tested. |
| `routes/test-level/{hud-fixture,run-clock,test-level-hud}.ts(x)` | Test-level composition and fixtures. |
| `public/fonts/chakra-petch-{400,600,700}-latin.woff2` + `OFL.txt` | The face, self-hosted. |

`app.css` gained five `@theme` tokens (`--font-readout`, `--color-readout`, `--color-readout-dim`,
`--text-shadow-readout`, `--text-shadow-readout-marigold`, `--drop-shadow-power-gem`) and three
`@font-face` rules. **Additive only — no existing token changed.**

`test-level-canvas.tsx` gained exactly two lines (import + `<TestLevelHud track={ track } />`). It
must sit inside `WorldProvider` for `useWorld()` and outside `<Canvas>` because it is DOM. That file
belongs to `rearview-mirror`; the supervisor acked the edit.

### Decisions that are load-bearing

**Per-frame values go through one `addEffect` writing `textContent` via refs.** Weighed against
React state from `useFrame`, a `setInterval` poll, a store subscription, and a koota `useQuery` —
the first three re-render the tree 60x/s (non-negotiable #4), the interval also runs a second clock
beside R3F's, and `useQuery` fires on structural change, which is not what moves here. Full weighing
is in the commit body per non-negotiable #13.

**The leaves are net-agnostic.** They take plain props plus `clock: () => number`. Nothing in
`game/hud/` imports Colyseus. This is what makes the follow-up cheap.

**Fixtures are confined to `routes/test-level/`.** `/test-level` has no server, so roster, rank and
held power are fixtures there; speed and progress are real, off the ECS `Sim` trait and
`track.finishZ`.

## Next steps

1. **Reconcile `/game/:roomId` onto these components and retire the cyan panel HUD** (the open half
   of #209, not started). `overlays/race-hud.tsx` is `HudPanel` glass — top-centre timer, top-right
   standings — and does not match the approved boards. Feed the same leaves from the room:
   `computeStandings()` already produces the roster, and `clock` becomes `() => room.state.elapsed`.
   Decide there whether `HeldPowerChip` folds into `PowerSlot`.
2. **`» BOOST ACTIVE`** — present on the action board above the power slot, deliberately out of
   scope here. Needs a real boost state first.
3. **Threat HUD** (`overlays/threat-hud.tsx`) is untouched and still its own look.
4. **The power gem** is a flat SVG stand-in. The board shows a rendered 3D pickup; if that matters,
   it wants art direction, not more SVG polygons.

## Two hazards that cost real time

- **Issue #166 is live and hostile to iteration.** Any HMR edit that re-renders the Canvas subtree
  kills the page with `Converting circular structure to JSON` from `@react-three-postprocessing`.
  Hard reload recovers. Mechanism (from `rearview-mirror`, via the supervisor): under React 19 `ref`
  is an ordinary prop, so `<Bloom ref={ ref } mipmapBlur />` at `scene-effects.tsx:24` lands in
  `JSON.stringify(restProps)` and its internal passes reach a scene whose `children[0].parent`
  closes the circle. **The supervisor owns this fix and has promoted it; do not start it.**
- **The extension backgrounds the driven tab and rAF freezes solid.** The render loop runs zero
  frames, so the Canvas screenshots **black** and every `addEffect`-written readout stays **empty**,
  while static React renders fine — it looks exactly like a broken scene plus a broken subscription.
  A single click into the page wakes it. It also hung a CDP `Runtime.evaluate` for 45s. Never judge
  anything from the first screenshot after a navigate or reload. Recorded in
  `.claude/memory/browser-extension-throttles-fps.md`.
- **Leva persists to `localStorage`** and an HMR of the tuning panel can capture stale in-memory
  values into it (supervisor's warning; it corrupted three judgements in a prior session). Clear
  storage and hard-reload before trusting anything visual.
