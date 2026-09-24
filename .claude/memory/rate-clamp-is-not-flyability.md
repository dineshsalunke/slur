---
name: rate-clamp-is-not-flyability
description: A pacing path that obeys the strafe rate clamp can still be unflyable; check it against the sim's strafeAccel
metadata:
  type: project
---

The pacing `PathSolver` limits lateral speed per row but has no velocity state, so it can go 0 → 65 u/s in one 1u row. The sim is acceleration-limited (`step.ts`, `strafeAccel` 165). A path that passes a max-|dx| test can still be unflyable: F4 on seed 20260921 moved 31.9u in 0.49 s, and the minimum from rest is 0.62 s. Issue #246.

**Why:** a clamp test passed on all five seeds while the owner could see the route was impossible.

**How to apply:** prove flyability by flying the path with the sim's strafe model (an accel-limited pilot), not by checking |dx| per row. Also remember the `/pacing` strip draws x ~9× denser than z at default zoom, so steep-looking lines need the numbers before a verdict. Related: [[escape-sweep-pilot-must-stop]].
