Agent: workertwo · Lane: #346 phone pad + #347 fullscreen (PLAN sent, awaiting owner) · #338/#340/#341 prod verify after deploy · Updated: 2026-09-28

## Goal
#346: left floating stick (touch = thrust, pull down = brake, left/right = strafe) and right d-pad (prev/next pickup, fire forward/back, centre = jump). #347: fullscreen on the play gesture where supported; iPhone gets an Add to Home Screen hint.

## Done
- #341 landed: 26cc118, 4be2e39, 7eb2da0, 9b0c726. Commented on #341, left OPEN until the final deploy.
- Plans for #346 and #347 sent to slur-supervisor on 2026-09-28 (the SendMessage holds the full text).

## State
- iPhone has no element fullscreen, iOS 26/27 included (caniuse). iOS 26 opens every Home Screen site as a web app (webkit.org/blog/17333). There is no orientation.lock on iOS. [verified by a researcher subagent]
- [unverified] iOS reading manifest orientation; iOS multi-touch pointerId reliability; a -webkit-touch-callout regression on iOS 26.1.
- Strafe kick fires at |strafe| ≥ STRAFE_PRESS 0.5 (step.ts:64). The plan uses client hysteresis: press at 0.45, release at 0.25, digital ±1.

## Uncommitted
none of mine.

## Held files
none until the supervisor clears the claim lists in the plans.

## Next
1. Wait for the owner's decisions: brake (pull-down recommended), KeyR for previous pickup (recommended).
2. #347 first: submit-capture listener in ui/fullscreen.ts + start-control click; pref in localStorage; toggle moved to ui/ and mounted on home; iOS hint; release input on fullscreenchange; root min-h-dvh.
3. #346: touch-pad/ folder (stick + d-pad), touch-state analogue fields, selectPrevious; vitest + CDP touch run.
4. After the owner's deploy: verify #338/#340/#341 on prod, then gh issue close each with its SHA.

## Open questions
Brake mapping; KeyR for previous pickup (sent to supervisor for the owner).

## Lessons → memory
none new.
