---
name: simulate-a-hidden-tab-over-cdp
description: "Headless Chrome keeps a background page visible (rAF keeps running), so simulate a hidden game tab by holding requestAnimationFrame callbacks in the page"
metadata:
  node_type: memory
  type: reference
  originSessionId: e49c14c5-de8c-406e-b1e6-fd7bb68cf6ae
  modified: 2026-09-29T11:34:08.895Z
---

In Playwright headless Chrome, opening a second page and calling `bringToFront()` leaves the first page's
`document.visibilityState === 'visible'`, and its rAF keeps running (measured 2026-09-29, #383). So a
"hide the tab" test does nothing.

To simulate a hidden tab, hold rAF in the page:

```js
const raf = window.requestAnimationFrame.bind( window );
hold = ( on ) => {
    if ( on ) { queued = []; window.requestAnimationFrame = ( cb ) => ( queued.push( cb ), 0 ); }
    else { window.requestAnimationFrame = raf; for ( const cb of queued ) raf( cb ); }
};
```

R3F looks up `requestAnimationFrame` at call time, so its loop stops after one frame. Timers keep full
rate (real Chrome throttles them to ~1 Hz); note that in any result.

**What a hidden racer does (measured, #383):** no rAF = no sim tick = no input recorded or sent. The
server steps a ship only on queued inputs, so the ship freezes in place for everyone. The player is not
kicked. After `STALL_SECONDS` (30) with no progress the racer counts as stalled; a solo race ends.

**How to apply:** any test of background-tab behaviour. Related: [[headless-game-tabs-starve-the-gpu]],
[[drive-a-hosted-room-over-cdp]].
