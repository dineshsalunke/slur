---
name: decode-audio-in-headless-chrome
description: Check new audio assets by decodeAudioData in headless Chrome and print duration + peak; source cuts can peak over 1.0 or sit at -27 dB
metadata:
  node_type: memory
  type: reference
  originSessionId: f935213a-6b66-45e8-8f2d-e73d1f0d7c80
  modified: 2026-09-26T05:58:44.622Z
---

To check new audio assets, open headless Chrome on a dev-server URL, with `--headless=new
--force-device-scale-factor=1 --mute-audio --remote-debugging-port=<free port>`. Over CDP,
`Runtime.evaluate` a script that fetches each file into `OfflineAudioContext.decodeAudioData` and prints
the duration, channels and peak. Record the Chrome PID and kill that PID afterwards
([[kill-by-pid-never-pkill]], [[headless-game-tabs-starve-the-gpu]]).

**Why:** ffprobe reports Opus durations with the pre-skip added (+6.5 ms). The browser decode gives the
true length (a 6.0 s loop decodes to exactly 288000 samples). The first #267 cuts peaked at up to 1.55,
and the lock tone peaked at 0.046. Nothing showed this until the decoded peaks were printed.

**How to apply:** after rendering cuts, decode them and normalise before you tune the gain table. The
script is small: `fetch` → `arrayBuffer` → `decodeAudioData` → max `|sample|`.
