---
name: delay-the-perception-not-the-loop
description: "A human-like sim pilot needs its reaction delay on what it sees (the course), not on its control loop; per-tick noise bloats RLE inputs"
metadata:
  node_type: memory
  type: feedback
  originSessionId: b88b79e6-811d-4e3f-bf57-dedae1d29558
  modified: 2026-09-24T14:48:02.556Z
---

To make a scripted pilot human-like, delay its **perception of the course** (steer to the line at the
z it held N ticks ago), never the whole input stream. A bang-bang strafe with an N-tick loop delay
limit-cycles: on #253, a 9-tick input delay gave even "pro" hundreds of bumps per run. Also hold aim
noise for ~15 ticks (per-tick noise made 10k RLE entries per run, 26 MB bundle) and clamp the aimed
target inside the open span, or the ship pins on a wall (d29 b695).

**Why:** f98f9e5 took three measured tries on Believer to get a graded pro/club/rookie signal.
**How to apply:** any bot that stands in for a player (song lab, balance sims). See
[[score-pilot-must-not-lead-the-note]] for the planner side.
