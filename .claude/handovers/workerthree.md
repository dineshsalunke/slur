Agent: workerthree · Lane: landing blank-gap fix (#389, follow-up to #386) · Updated: 2026-09-29 17:40

## Goal
Keep StillBackdrop visible on the home page until the 3D landing scene paints its first frame.

## Done
- 6acf1345 (#389): LiveBackdrop + LandingCover + LandingReveal (`landing.reveal` system, `overlay` phase). One reveal store per mount. Local only, not pushed. Issue #389 is open with a SHA comment. Close it after the push.
- Earlier: ea385b6b (#384) is local only. 04684954 (#386) is on origin (per the supervisor).

## State
- Blank gap before: 0.93–1.03 s (11–14 rAF frames), cold and warm, 4 loads. After: 0 frames, 6 loads. Headless Metal, DPR 1, :5173.
- A frame-id trace shows cover-off in the same rAF frame as the first content draw (cold 30, warm 23). That frame takes about 150 ms (shader compile).
- Canvas alive at 11 s, 45 draws per frame, no context loss.
- The reveal-frame screenshot shows the full scene.
- typecheck clean, vitest 104 files / 705 tests, lint: no findings in my files.
- No headless Chrome left running.

## Uncommitted
none

## Held files
routes/home/landing-backdrop/*, routes/home/landing-reveal/*, routes/home/landing-scene/landing-scene.tsx. Release them when the supervisor confirms.

## Next
1. The owner checks the home page: no blank flash between the still image and the 3D scene.
2. After the owner pushes: `gh issue close 389 -c "<SHA>"`.

## Open questions
- Push of ea385b6b and 6acf1345: the owner decides.

## Lessons → memory
none. The probe footgun: a rAF sampler registered before R3F's loop credits a frame's draws to the next sample. Stamp a frame id on each event instead.
