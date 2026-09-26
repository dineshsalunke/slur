---
name: count-react-renders-over-cdp
description: "Count React component renders on a live route with no repo edits: inject a fake devtools hook over CDP and count fibers with a new actualStartTime AND the PerformedWork flag"
metadata:
  node_type: memory
  type: reference
  originSessionId: aac5c903-afea-4442-b138-626d06f3ecd1
  modified: 2026-09-26T07:39:09.014Z
---

To profile how often a component renders on the owner's stack (#274, 2026-09-26), inject a fake
`__REACT_DEVTOOLS_GLOBAL_HOOK__` with `Page.addScriptToEvaluateOnNewDocument` before navigating.
In `onCommitFiberRoot`, walk `root.current` and count a function fiber by `type.name` when:

- its `actualStartTime` differs from the last value seen for that fiber or its `alternate` (the dev
  build sets it on every fiber that begins work), **and**
- `fiber.flags & 1` (PerformedWork) is set.

Without the flag test, bailouts on the path to an updated child count too: the first try showed
`Overlays` and `LeaveGuard` at 62 renders in a countdown when they really rendered twice.

The second racer is a node `@colyseus/sdk` bot ([[node-bot-as-second-racer]]). It can also **create**
the room (`client.create('run', { name })`) and send `start`, so the Chrome tab joins by
`/game/<id>`, either in the lobby or late as a spectator. Script: `git show afcd0e7` message lists
the numbers; the probe itself lived in the scratchpad.

**Why:** a render count "inferred" from reading code was wrong in both directions. The live count
showed that racing mounts no `useRunView` consumer at all; the patch-rate cost was in the countdown
and the spectator bar.

**How to apply:** use it before and after any subscription change. Run it with headless Chrome at
DPR 1, and kill Chrome by PID after ([[headless-game-tabs-starve-the-gpu]], [[kill-by-pid-never-pkill]]).
