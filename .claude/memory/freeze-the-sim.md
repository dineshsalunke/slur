---
name: freeze-the-sim
description: "A lighting or scene A/B needs the camera still — KeyP sim-freeze at the spawn pose holds it (a timed flight does not land the same frame twice), but the asteroid field keeps drifting under freeze and contaminates a two-tap pixel diff unless Rock.speed/spin are zeroed"
metadata:
  node_type: memory
  type: feedback
  originSessionId: c4aee720-5af9-46db-8e98-cf73d0c20042
  modified: 2026-09-29T04:07:40.499Z
---

### Freeze the sim to A/B a light

`KeyP` toggles `simFreeze` (`apps/client/app/dev/sim-freeze.ts`); `LocalLoop` skips the sim but
still runs `updateChaseCamera`, so the frame holds. That is what makes an A/B of two lighting
values comparable.

**Correction (2026-09-23):** this note used to claim a fixed flight duration lands the same frame.
**It does not.** Two identical default runs holding `KeyW` for 4s came back at **SSIM 0.906** —
enough drift to move a monolith across the frame and to swamp any effect under ~2 levels. The
number of sim steps inside a wall-clock window is not deterministic.

**How to apply:** freeze at the **spawn pose** — reload, send no `KeyW` at all, `KeyP`, tap. That is
SSIM **0.995** run to run. When a flown pose is unavoidable, do not trust fixed pixel coordinates:
probe by feature per frame ([[probe-by-feature-not-by-pixel]]). Drive a headless Chrome over CDP
(`/json/list` → `Runtime.evaluate` over the native `WebSocket` in node 24); set the override with
`localStorage.setItem('slur.tuning.v1', ...)` — entries are `{value, from}` and `restore()` drops
one whose `from` no longer matches the schema default — then `location.reload()`. Reconnect the CDP
socket after the reload; the pre-reload session stops answering. If `Runtime.evaluate` hangs or the
tap reports "nobody answered", the browser is wedged: `pkill -f "remote-debugging-port=<port>"` and
relaunch. Input is read from `e.code`, so a synthetic `new KeyboardEvent('keydown', {code:'KeyW'})`
works — but a strafe of even 1.1s off the spawn pose throws the ship off the deck edge.
**Superseded for tunable A/Bs (2026-09-23):** freezing is no longer the answer — the page can
import its own live module graph over CDP and call `setNum` with **no reload at all**, which is
bit-identical run to run (SSIM 0.99992). See [[tuning-over-cdp]]. Freezing still matters when you
need the ship held somewhere specific.

Related: [[headless-game-tabs-starve-the-gpu]], [[eyeballing-a-tap-lies-about-brightness]].

### Freeze does not stop asteroid drift

**Update 2026-09-29 (#360, cd742d0):** drift is now a small sine sway (Rock.speed 0.6, spin 0.5), but
it still changes ~2% of sky pixels per second when frozen. For a clean diff, override the page's
localStorage `slur.tuning.v1` with Rock.speed 0 and Rock.spin 0 (entries `{value, from}`, `from` = the
schema default); that floor is 0.01%/s.

`KeyP` (`apps/client/app/dev/sim-freeze.ts`) holds the sim and the camera, but the asteroid field
keeps drifting. A two-tap A/B diff on `/test-level` therefore changes across the **full frame bbox**
even when frozen — 27k+ pixels, with the largest deltas in the sky, nowhere near the thing under test.

**Why:** a pixel diff can only isolate a change if everything else is identical. It isn't here, so
the diff measures asteroid motion and buries the signal.

**How to apply:** for a *presence* question ("did this thing draw at all?"), don't diff. Force the
element to an unmistakable colour nothing else in the scene uses — `#00ff00` works, the palette is
marigold-and-cold-grey — crank its size, take **one** tap, and scan for `g - max(r,b) > 40`. Zero
hits is decisive proof it never drew. Reserve diffing for magnitude questions, and even then expect
to mask the sky. Extends the spawn-pose freeze above and [[eyeballing-a-tap-lies-about-brightness]].
