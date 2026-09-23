---
name: two-client-check-needs-two-chromes
description: "Headless Chrome renders only its front tab, so a two-client live check needs one Chrome process per client; count calls with a CDP logpoint, not a repo edit"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 3c30e912-f078-4597-ac8e-845b18df48e2
  modified: 2026-09-23T21:12:20.212Z
---

For a live check with two clients, launch **one headless Chrome per client**, each on its own debug port
and `--user-data-dir`. Two tabs in one Chrome do not work: only the front tab makes frames. The
background tab still gets network messages, but its `useFrame` work waits until something forces a
frame, for example a `Page.captureScreenshot`. `--disable-renderer-backgrounding` and the other
background flags do not change this.

To count calls to a client function without a repo edit, set a CDP logpoint. Call `Debugger.enable`, and
on `scriptParsed` for the module URL read `Debugger.getScriptSource`. Find the line and call
`Debugger.setBreakpoint` with the condition `(console.log('TAG', …), false)`. Read the output from
`Runtime.consoleAPICalled`. Add `new Error().stack` to get the caller. Put the breakpoint on a line
where the variables you log are already bound. A breakpoint on a `for (const e of …)` header runs
before `e` exists, so the condition throws and nothing is logged.

**Why:** on 2026-09-24 the #233 check put A and B in one Chrome. A's remote spark reached `pushHit` on
time but drained 3.4 s late, at the screenshot. That looked like a render bug. With two Chrome
processes both clients drained in the same frame.

**How to apply:** use this with [[drive-a-hosted-room-over-cdp]] and [[check-the-cdp-port-is-yours]].
Check both ports before launch, and kill both Chromes after. A fresh profile keeps
`localStorage` separate. The console of a reused tab replays old logs on `Runtime.enable`, so ignore
events from before the run starts.
