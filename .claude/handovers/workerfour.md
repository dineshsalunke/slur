Agent: workerfour · Lane: phone play — touch pad, Gamepad API, fullscreen #251 (PLAN SENT) · Updated: 2026-09-24

## Goal

Make the game playable on a phone: an on-screen touch pad, physical controller support, and fullscreen
with a landscape lock. All inputs go through the keyboard's input seam.

## Done

- #247 landed as `821a78a` (previous lane).
- #249 filed (a flaky server test, tracking only).
- #251 filed. The PLAN was sent to slur-supervisor for owner approval. No code yet.

## State (verified this session)

- Seam: `game/input/keyboard.ts` `currentInput()` bumps seq. `ecs/net-systems.ts:39` and `ecs/systems.ts:9`
  read it once per fixed step.
- The jump is a held bool. `step.ts:49-50` makes tap/hold/double from the edges. Throttle, brake and
  strafe are multiplied by the input value (`step.ts:13/14/25`), so analog input works.
- MDN bcd 8.1.2: iPhone Safari has no element fullscreen ("Only available on iPad"). All Safari has no
  `orientation.lock`. Chrome Android has both. safari_ios supports manifest `display` from 11.3.
- Tailwind 4.3.3 is installed and has the `pointer-coarse:` variant.
- `run-room.ts:83-88` does not clamp inputs. This is a side finding, not filed.
- PR #195 is paused. Worktree `../slur-worktrees/merge-195` is detached at `74a7b89`.

## Uncommitted

None.

## Held files

None until the owner approves. The proposed claims are in the PLAN: game/input/*, the ecs/systems.ts and
net-systems.ts imports, hud/touch-pad.tsx, hud/touch-button.tsx, net-hud.tsx,
overlays/fullscreen-toggle.tsx, rotate-hint.tsx, overlays.tsx, ui/fullscreen.ts, and if Q2 = yes, root.tsx
and public/manifest.webmanifest.

## Next

1. Wait for the owner's approval and the answers to Q1 and Q2.
2. Commit 1: current-input.ts merge + touch-state + gamepad (addEffect) + synth-key + TouchPad + tests.
3. Commit 2: FullscreenToggle, rotate hint, and the manifest and meta if approved.
4. Headless narrow capture with CDP touch emulation. Kill Chrome after.

## Open questions

- Q1: throttle as a hold button, or tap-to-latch?
- Q2: manifest + Add-to-Home-Screen for iPhone?
- Discrete actions: synthesized KeyboardEvents, or an action bus?
- File the server input clamp as a separate issue?
- #195 owner calls A/B/C. GDD §5.5 table owner. Delete `game/net-debug-hud.tsx`.

## Lessons → memory

none
