---
name: quit-docker-desktop-via-cli
description: osascript quit leaves Docker Desktop's backend running; `docker desktop stop` actually stops it
metadata:
  type: reference
---

To free the owner's CPU after a Docker build, run `docker desktop stop`. `osascript -e 'quit app "Docker"'`
left `com.docker.backend` and the Electron tray running for over 60 s (measured 2026-09-28, #336).
Check with `pgrep -f com.docker.backend`.

**Why:** the owner's CPU and battery are a standing concern ([[headless-game-tabs-starve-the-gpu]]).

**How to apply:** start with `open -a Docker`, stop with `docker desktop stop`, then confirm no backend PID.
