---
name: drive-beat-deck-headless
description: "Record a /beat-deck take headless: DOM.setFileInputFiles loads the mp3, Input.dispatchKeyEvent drives Enter/A/D/Esc, the HUD's data-phase says when it saved"
metadata:
  node_type: memory
  type: reference
  originSessionId: 77b676a0-9792-435a-823c-872266103273
  modified: 2026-09-24T19:22:01.978Z
---

To check `/beat-deck` without the owner, run a client-only dev server on a free port
(`CLIENT_PORT=5291 npx react-router dev` in `apps/client`; no game server needed). Then use a headless
Chrome with `--force-device-scale-factor=1 --mute-audio --autoplay-policy=no-user-gesture-required`.

- Load the song with CDP `DOM.querySelector('input[type=file]')` + `DOM.setFileInputFiles`. Then blur
  the active element, because Enter is ignored while an input has focus (`typingTarget`).
- Keys: `Input.dispatchKeyEvent` keyDown/keyUp with `code`. These are trusted events, so key-hold
  timings land within ~3 ms of the requested hold.
- Wait on `document.querySelector('[data-phase]').dataset.phase` (`empty → ready → recording → saved`).
  The saved file name is on `[data-take-file]`.
- Validate with jq. Every `ticks.*` and `keys.*` column must have the same length, and `song.sha256`
  must equal `shasum -a 256` of the mp3.

Measured 2026-09-25: a 6.6 s take is 17 KB with 399 ticks, so the headless tab ran the sim at the full
60 Hz. The script was `take.mjs` in workerone's scratchpad. Rebuild it from these steps. Kill both
PIDs after the run ([[kill-by-pid-never-pkill]], [[check-the-cdp-port-is-yours]]).
