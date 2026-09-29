Agent: workertwo · Lane: seeker lock warning HUD (#372) — PLAN SENT, awaiting owner · #348 PAUSED · #338/#340/#341 prod verify after deploy · Updated: 2026-09-29

## Goal
Warn the player when a homing seeker is locked on them, now that the rear-view mirror is being removed (#371, workerthree).

## Done
- Mirror GPU cost measured (previous lane, cdadd1f). Owner chose removal.
- Filed #372. Plan sent to slur-supervisor for the owner.

## State
- Seekers carry `targetId` from launch (`aimSeeker`) and live in room state `seekers` [verified].
- Lock range 600u; seeker top 186 u/s; closing 62–102 u/s by class → 6–10 s of warning; `committed` = last 0.35 s [verified from constants].
- Audio already loops `seekerLocking` and plays `seekerLocked` on commit (`bind-room-audio.ts`) [verified].
- `overlays/threat-hud/threat-hud.tsx` = bolt-from-behind tick + vignette via `addEffect`; ignores seekers [verified].
- /test-level is a solo loopback room; needs a dev "Incoming seeker" Leva button to test.
- Plan pick: option 4, bottom-edge red LOCK chevron (DOM + addEffect), slides by dx, 1–3 bars by time to impact, solid + vignette on commit, top edge for back-fired seekers.

## Uncommitted
none.

## Held files
none yet. To claim on approval: new `apps/client/app/game/overlays/seeker-warning/*`, `overlays/overlays.tsx`, `routes/test-level/pickup-grants/pickup-grants.utils.ts` (+test), `docs/GDD.md` §5.3.

## Next
1. Wait for the owner's approval (and bars vs ring answer). Build nothing before it.
2. On approval: claim the files, build, test on /test-level, close #372 with the SHA.
3. After the owner's deploy: verify #338/#340/#341 on prod.
4. Later: resume #348.

## Open questions
- Owner: approve option 4? Bars or shrinking ring for time to impact?

## Lessons → memory
none.
