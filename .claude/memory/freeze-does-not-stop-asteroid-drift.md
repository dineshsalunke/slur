---
name: freeze-does-not-stop-asteroid-drift
description: "KeyP sim-freeze still leaves asteroids drifting, so any two-tap frame diff is contaminated across the whole frame"
metadata: 
  node_type: memory
  type: project
  originSessionId: c4aee720-5af9-46db-8e98-cf73d0c20042
  modified: 2026-09-23T09:15:24.334Z
---

`KeyP` (`apps/client/app/dev/sim-freeze.ts`) holds the sim and the camera, but the asteroid field
keeps drifting. A two-tap A/B diff on `/test-level` therefore changes across the **full frame bbox**
even when frozen — 27k+ pixels, with the largest deltas in the sky, nowhere near the thing under test.

**Why:** a pixel diff can only isolate a change if everything else is identical. It isn't here, so
the diff measures asteroid motion and buries the signal.

**How to apply:** for a *presence* question ("did this thing draw at all?"), don't diff. Force the
element to an unmistakable colour nothing else in the scene uses — `#00ff00` works, the palette is
marigold-and-cold-grey — crank its size, take **one** tap, and scan for `g - max(r,b) > 40`. Zero
hits is decisive proof it never drew. Reserve diffing for magnitude questions, and even then expect
to mask the sky. Extends [[freeze-the-sim-to-ab-a-light]] and [[eyeballing-a-tap-lies-about-brightness]].
