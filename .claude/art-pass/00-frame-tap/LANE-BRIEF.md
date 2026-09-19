# Lane brief — the frame tap (instrument, not art)

**Branch** `art/frame-tap` · **worktree** `../slur-worktrees/frame-tap` · **ports** 5203 client / 2603 server
· **base** `origin/dev` at `1807bc0`, verified equal at creation.

You are not doing art. You are building the instrument the art pass has been missing, and the art lanes are
blocked behind it. Read `CLAUDE.md`, then `conventions/r3f.md`, before any code.

---

## 1. The problem, framed correctly

Every visual review in this project currently depends on a Chrome tab being **frontmost**. That dependency
has cost two full sessions and is still costing them: a lane opens its route, measures
`document.visibilityState: "hidden"`, and is blind. The owner cannot switch desktops or tabs without
blinding whichever lane was looking at something.

**The dependency is not on focus. It is on `requestAnimationFrame`, which the browser owns and stops calling
when a page is not visible.** `visibilityState` is spec behaviour for a non-active tab — no Chrome flag,
window arrangement or extension setting changes it, and chasing one is the wrong problem. The fix is to stop
depending on the browser's clock.

**We can own the clock.** This is verified, not recalled — check it yourself before building on it:

- `@react-three/fiber` 9.7.0 exports `advance( timestamp, runGlobalEffects?, state?, frame? )`. Its own
  `.d.ts` says *"Advances the frameloop and runs render effects, useful for when manually rendering via
  `frameloop='never'`"*. `RootState` also carries `advance` and `setFrameloop`. On-demand rendering is a
  first-class R3F mechanism.
- `@react-three/postprocessing`'s `EffectComposer` renders **inside** the frameloop:
  `useFrame( ( state, delta ) => { … composer.render( delta ) … }, enabled ? renderPriority : 0 )` with
  `renderPriority` defaulting to 1 (read it in the installed `dist/index.js`). **So driving the frameloop
  drives bloom too.** A pumped frame is the real post-processed frame.

That last point is why this beats the workaround the art lanes have been surviving on. `gl.render( scene,
camera )` + `readPixels` also works with rAF dead, but it **bypasses** `EffectComposer` — useful precisely
*because* it is a free bloom-off read, and worthless for judging a frame where bloom is the thing in
question. Keep both; they answer different questions.

## 2. Definition of done

Two pieces, both **DEV-ONLY**, plus their tests and docs.

**A — the pump.** A way to advance the frameloop N times on demand from outside React, in a tab nobody is
looking at, with the composer in the loop. The existing precedent for publishing R3F internals on `window`
is `net-canvas.tsx:142`; `art/track` has a `SceneProbe` doing the same with `useThree` (that branch is not
merged — look at it for shape, do not depend on it).

**B — the tap.** A way to get the rendered frame out as a **PNG file on disk**, in a directory already
gitignored (`.claude/art-pass/*/refs/` is ignored via `.claude/art-pass/.gitignore`). A data-URL string
returned through the browser bridge is not good enough: a lane cannot *see* an image that way, and neither
can the owner. A file can be opened by the lane, by the supervisor and by the owner, on any desktop, at any
time. **That is the whole point — it makes visual review asynchronous.**

`apps/client/art-refs-plugin.ts` is the precedent for B and you should follow its shape closely: a dev-only
(`apply: 'serve'`) connect middleware registered in `vite.config.ts`, never present in the production build.
Note especially how it makes traversal impossible **by construction** — it whitelists the *shape* of a
filename rather than resolving-and-comparing paths — and copy that discipline, because you are writing files
rather than reading them and the stakes are higher.

**Explicitly NOT in scope:**
- Any change to an art value — no material, emissive, sky, camera or lighting edit. Two art lanes own those
  files and you will collide with them.
- Changing the default rendering behaviour of any route. When a tab *is* visible, everything must behave
  exactly as it does today. Do not set `frameloop="never"` globally to make pumping easier; pump **on top of**
  the existing loop.
- A headless Node render harness. Considered and rejected for now: it drifts from what actually ships.
- Playwright or Puppeteer. Visual lanes drive the owner's real Chrome via `claude-in-chrome` so the owner and
  the lane watch the same live tab; a second browser stack defeats that.
- Shipping any of it in the production bundle. If a `pnpm build` output contains your code, you are not done.

## 3. How this gets judged — the instrument must prove itself

Not by tests alone. The acceptance demonstration is:

1. Open `/art-lab` on **your own** port (5203) in a tab, and **do not focus it** — confirm
   `document.visibilityState` is `"hidden"` and that rAF is dead.
2. Pump frames and tap one out to a PNG.
3. The PNG shows the actual track from the chase camera, **with bloom**.
4. Prove the bloom claim rather than asserting it: a `gl.render` + `readPixels` read of the same frame
   bypasses the composer, so the two paths should **disagree** in a way you can state numerically. If they
   agree exactly, your pump is not going through the composer and A is not finished.

To check rAF cheaply, use the counter pattern — install a free-running counter and read it on a **later**
call (`window.__rafN = 0; (function tick(){ window.__rafN++; requestAnimationFrame(tick); })();` then read
`window.__rafN` in a separate call). A value of `1` means rAF has fired zero times since. **Never `await` a
frame** — that burns the CDP evaluate to its 45-second timeout, and the hang itself is the diagnosis.

**Do not use `computer screenshot` as a check.** It *forces* a canvas measure: it resized a `300×150` canvas
to `3456×1882` in a tab that was still hidden with rAF dead. Canvas size therefore proves nothing about
whether anything is rendering — both a small unmeasured canvas and a correctly-sized one have been observed
in dead-rAF tabs.

## 4. Before you write the mechanism, enumerate the alternatives

Project non-negotiable #14: for any *mechanism* decision, the trained defaults are the **last** candidates,
not the first. List **at least five** real options, weigh them (correctness · one-clock-vs-many · re-render
cost · idiom-fit · reuses-existing-loop), and commit the winner with a one-line rationale in the code. For
this lane that applies at least to: how the pump is exposed and driven, and how the PNG gets from the canvas
to disk. `art-refs-plugin.ts`'s header is the house standard for what that record looks like — five
mechanisms, each with the reason it lost.

**Send me your mechanism recommendation before implementing it.** That is the one escalation this lane owes
regardless of whether you feel blocked.

## 5. Traps already paid for — do not rediscover these

- **`pnpm format` BEFORE `pnpm lint`.** Biome treats formatting as a lint *error*; skipping this failed a
  lane's gate twice on nothing.
- **The commit hook rejects a `Co-Authored-By` trailer**, even though your session instructions tell you to
  add one. Commit without it. Do not bundle `git add` and `git commit` into one shell call — a hook
  rejection kills the whole call.
- **`pnpm -r test` silently skips `@slur/shared`** and its 75 tests. The gate below names it explicitly; that
  is not redundant.
- **A fresh worktree often serves a stale Vite dep cache**, which makes koota's `useWorld` see a null React
  and blanks the entire Canvas behind the error boundary. Fix: `rm -rf apps/client/node_modules/.vite`, restart.
- **Unsmudged git-lfs assets 404 and take the Canvas down the same way.** Fix: `git lfs pull`.
- **All edits and commits happen in this worktree**, never the shared checkout — a committed pre-commit hook
  hard-blocks a Claude commit there.
- **Tab groups are per-session.** `tabs_context_mcp` returns *"No tab group exists for this session"* after a
  restart, so you cannot adopt a tab from a previous conversation. Never record a tab id as durable state —
  record the URL. Create your own tab and pass its `tabId` on every call; three lanes share one Chrome, and
  matching on **your own port (5203)** is the collision-proof way to tell yours apart. Never touch a tab on
  `:5201` or `:5202` — those are the art lanes' and grabbing one means two lanes diagnose each other's page.

## 6. The verify gate — all of it, green, before you report done

```
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

## 7. Escalation

You escalate to the supervisor, never to the owner directly, and never treat silence as approval. Escalate:
your mechanism recommendation (§4), anything that would touch a file the art lanes own, anything that changes
behaviour for a visible tab, and any genuine fork with real trade-offs. Use exactly this shape:

```
NEEDS-DECISION: <one line, specific, answerable>
CONTEXT: <2-4 lines: what you are doing, why this fork exists>
OPTION A — <label>: <what it means> / consequence: <what it costs or commits us to>
OPTION B — <label>: <...>
RECOMMENDATION: <which, and why — a recommendation without a defence is a preference>
IF NO ANSWER: <what you do meanwhile, or that you are genuinely blocked>
```

Do **not** escalate anything settleable by verifying — an API's behaviour, a measured value, whether
something renders. Verify, don't ask. Two lanes have now had a confident, well-argued conclusion overturned
by a measurement; in this codebase, rendering and measuring beat reasoning every time.
