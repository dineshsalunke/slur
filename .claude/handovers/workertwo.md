Agent: workertwo · Lane: rear-view mirror GPU cost (measure only, no issue) — DONE, fix plan sent · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
Measure what the rear-view mirror costs per frame, ON vs OFF. Measure only; no code change.

## Done
- 32852a5 #360 follow-up: Rock.spin default 0 (owner: stop spin). Earlier cd742d0 (sway, no fade).
- Mirror measurement (no repo edits). Report sent to the supervisor.

## State
- Method: system Chrome headless via Playwright, `--use-angle=metal --disable-gpu-vsync --disable-frame-rate-limit --force-device-scale-factor=1 --mute-audio`, viewport 1728×1080, `/test-level?quality=high`, mirror set through `localStorage slur.rearView`, ArrowUp held for 1.5 s, then a 3 s window with a readPixels(1 px) bracket each frame. Median frame delta per load. A CDP-free init hook counts draws per frame and times rAF callbacks (my own meter callback excluded). One warm load, then off,on,on,off ×3.
- Screenshots confirm the panel is present when ON and absent when OFF.
- DPR 2 (3456×2160), run A: OFF 9.9–10.3 ms (median 10.0), ON 10.3–12.2 (median 10.75). Δ ≈ 0.75 ms. (JS column invalid in this run: it included the meter.)
- DPR 2, run B (machine slower overall, cause unknown): OFF 13.9–15.2 (median ~14.25), ON 14.8–16.5 (median ~15.05). Δ ≈ 0.8 ms.
- DPR 1 (1728×1080): OFF 9.2–10.2 (median ~9.55), ON 9.7–10.4 (median ~10.1). Δ ≈ 0.55 ms.
- Draw calls: ON 129, OFF 74 → mirror = 55 calls (43% of the frame's calls). Exact, every run.
- JS per frame: ON 1.6–1.9 ms, OFF 1.4–1.6 → mirror ≈ +0.3 ms CPU.
- No other headless Chrome during the timed runs (pgrep before each). The owner's own tab may have been open [unmeasured].
- The synced meter is serial CPU+GPU, an upper bound. DPR 1 ≈ DPR 2 in run A, so the frame is not fill-bound at this meter [inferred].

## Uncommitted
none.

## Held files
none.

## Next
1. Wait for the owner's pick on the mirror plan (sent to the supervisor). Build nothing until approved.
2. After the owner's deploy: verify #338/#340/#341 on prod and close each one with its SHA.
3. Later: resume #348 (gamepad side of Blur controls).

## Open questions
- Owner: which mirror option, if any (plan in the supervisor message).

## Lessons → memory
force-quality-high-in-headless.md (new). freeze-does-not-stop-asteroid-drift.md updated at the #360 seam.
