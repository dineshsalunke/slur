# `art/frame-tap` — LANE FACTS

Raw first-hand facts, one line each, committed with the code. **Not narrative** — LANE-STATE tells the story,
this file is the evidence it is built from. Append, do not rewrite; if a fact is later falsified, strike it
and say what falsified it rather than deleting it, because a quietly-replaced justification is worth more
written down than one that was right first time.

Convention: every line carries **who measured it and when**. `[inherited]` = from a previous context's fact
dump, not re-measured. `[unmeasured]` = believed, never measured, do not build on it.

---

## Session 2 — 2026-09-19 (fresh context after the first handover)

### Branch

- `2026-09-19 s2` HEAD `10b28a5`, pushed; `origin/art/frame-tap` at the same SHA,
  `rev-list --left-right --count` = `0 0`. Tree clean.
- `2026-09-19 s2` The commit pushed was the supervisor's `LANE-STATE.md`; it had been committed locally and
  left unpushed, which is why LANE-STATE's own "Pushed YES" described the state one commit before itself.

### Verify gate — run in full, each step's exit status read separately

- `2026-09-19 s2` `pnpm typecheck` exit 0 — shared, server, client all Done.
- `2026-09-19 s2` `pnpm lint` exit 0 — 3 warnings, all `noExcessiveLinesPerFile` in `packages/shared/src/sim/`,
  none this lane's. `pnpm format` was NOT needed first; lint was clean without it.
- `2026-09-19 s2` `pnpm --filter @slur/shared test` exit 0 — 75 pass, 0 fail.
- `2026-09-19 s2` `pnpm -r test` exit 0 — client 9 files / 58 tests, server 4 tests, 0 fail.
- `2026-09-19 s2` `pnpm build` exit 0.
- `2026-09-19 s2` Canvas-isolation reports wrappers `Canvas, NetCanvas, ArtGalleryCanvas, EnvLabCanvas,
  LandingScene` — `ArtLabCanvas`/`IsoLabCanvas` still absent. Issue #127, not this lane's.

### Nothing ships — re-verified against a fresh build, by string not filename

- `2026-09-19 s2` `grep -rl` over `apps/client/build/` for `slur:frame-tap`, `x-frame-tap`, `__frame-tap`,
  `pumpAndCapture`, `capturedDelta`, `bloom-off` → **0 hits each**.

### Mount sites — supervisor condition 2, re-verified first-hand

- `2026-09-19 s2` Exactly four, each `{ import.meta.env.DEV && <FrameTap /> }`: `iso-lab-canvas.tsx:130`,
  `art-gallery-canvas.tsx:45`, `art-lab-canvas.tsx:92`, `env-lab-canvas.tsx:71`. **No `/game` mount.**
- `2026-09-19 s2` **Re-checked first-hand this session rather than carried from the handover.** Re-verifying an
  inherited fact instead of inheriting it has paid off twice today — here, and on `art/block`, where a "push is
  blocked, the owner must clear it" claim rode three handovers and turned out never to have been true. Cheap
  to re-run, so re-run it.

### The StrictMode hypothesis — PARTLY FALSIFIED from installed source

- `2026-09-19 s2` StrictMode IS active: `@react-router/dev` 8.3.0's default `entry.client.tsx` wraps
  `<HydratedRouter/>` in `<StrictMode>`, and this project ships no custom `entry.client`, so the default is used.
- `2026-09-19 s2` StrictMode DOES cross into R3F's reconciler: fiber 9.7.0 `useBridge`
  (`dist/events-b1bdeb1a.cjs.dev.js:74-89`), commented *"Bridges renderer Context and StrictMode from a primary
  renderer"*, traverses the fiber upward for `React.StrictMode` and wraps R3F's own root in it when found. So
  `<FrameTap/>`'s effect **is** double-invoked.
- `2026-09-19 s2` **But the double-invoke cannot leave two listeners.** Vite 8.2.1 `HMRContext.off`
  (`dist/client/client.mjs:100-111`) filters by callback **identity** out of BOTH `customListenersMap` and
  `newListeners`. StrictMode runs effect → cleanup → effect; each run makes a fresh `onRequest` closure and the
  cleanup removes exactly it. **Net: one listener.**
- `2026-09-19 s2` **Therefore "StrictMode double-registers the listener" is false — but ONLY in the narrow
  sense below. READ THE SCOPE BEFORE CITING THIS.**

#### ⚠ THE SCOPE OF THAT FALSIFICATION — narrowed by the supervisor, 2026-09-19 s2

The three lines above disprove exactly one thing: that **one component instance running its effect twice**
leaves two listeners. It does not. That argument is sourced and it holds.

It is **NOT** an argument about **two component instances each running their effect once**. Those are
different failure modes wearing the same name. If `<FrameTap/>` is instantiated twice, each instance builds
its own `onRequest` closure, each cleanup removes only its own, and the net count is **two** — with every line
of the source analysis above still true.

- `2026-09-19 s2` `[unmeasured]` **The instance count is the open question and it was never asked.** A future
  reader finding "StrictMode double-registration: FALSE" with no scope attached will conclude this was asked
  and answered. It was not.
- `2026-09-19 s2` `[unmeasured]` A concrete path to two instances, consistent with every source fact above:
  the OUTER StrictMode double-invokes `<Canvas>` itself, and `<Canvas>`'s effect is what creates the R3F root.
  Mount → cleanup → mount, with R3F's root teardown not fully completing in between, leaves **two roots**,
  each with its own `<FrameTap/>` and its own listener. Unverified — stated as the hypothesis to test, not as
  a finding.
- `2026-09-19 s2` **Two instances fits the observation better than re-invocation does.** The two `received`
  lines had the **same id and same timestamp**; two listeners firing off one `hot.send` in one tick is
  same-millisecond by construction, whereas a re-invocation is not.
- `2026-09-19 s2` `[unmeasured]` The actual live listener count. The experiment must carry **two** fields, not
  one — upload count alone cannot separate the last two outcomes, and they want completely different fixes:
  - a **module-level instance counter**, incremented at `FrameTap` construction and reported with the upload;
  - the upload count per tap id.

  One tap then separates three outcomes cleanly: **1 instance / 1 upload** → the falsification holds and the
  hang is elsewhere; **1 instance / 2 uploads** → something duplicates on the wire or inside the handler;
  **2 instances / 2 uploads** → the dedupe was right all along, for a reason nobody had correctly stated.
- `2026-09-19 s2` The two RECEIVED lines must be logged at **distinct code points with distinct labels**:
  "logged twice" is currently ambiguous between two requests arriving and one request traversing a path that
  logs twice, and that ambiguity is load-bearing.
- `2026-09-19 s2` ⚠ **CONFLICT in the instrumentation instruction, raised rather than silently resolved.**
  "Keep the instrumentation server-side only, nothing in `frame-tap.tsx` changes" and "add a module-level
  instance counter, incremented at `FrameTap` construction and reported with the upload" **cannot both hold**
  — the counter lives in `frame-tap.tsx` by definition, and reporting it means a new upload header. The upload
  COUNT is server-side; the instance COUNT is not.
  Consequence if the client file is touched: the HMR-prune trap comes back into scope, so every measurement
  run must follow a **full page reload**, never an HMR update. That is survivable and already the standing
  rule, but it must be stated or the measurement inherits the exact false signal that produced the retraction.

### Environment

- `2026-09-19 s2` My stack is up: `:5203` (client) and `:2603` (server) listening. `apps/client/.env` has
  `CLIENT_PORT=5203`, `VITE_SERVER_PORT=2603`. Other lanes on `:5201` and `:5202` — never touch those tabs.
- `2026-09-19 s2` No page open on 5203: a tap returns the 504 "nobody answered". Server half is healthy; there
  is simply no responder.

### Docs already carrying what was asked for — checked, not assumed

- `2026-09-19 s2` The delta-as-rAF-liveness qualification is already committed in `README.md:79-83`, in full,
  including "leave a gap: tap, wait ~10 s, tap again".
- `2026-09-19 s2` The `createFixedStep` `maxSteps = 5` / ~83 ms correction is already committed in
  `README.md:92-95`, including the replacement justification (`updateChaseCamera` damps against the raw delta
  and snaps).

---

## Session 1 — 2026-09-19 `[inherited]`, from the first context's fact dump

Not re-measured by session 2. Listed so the numbers survive the conversation that produced them.

- `[inherited]` Acceptance demo passed: tab `visibilityState: "hidden"`, `__rafN === 1` read on a later call
  (zero rAF frames since install).
- `[inherited]` Tap returned 200; `refs/art-lab-hidden.png` written. `firstDeltaSeconds: 9.1657`,
  `capturedDeltaSeconds: 0.0169`, `pumped: 3`.
- `2026-09-19 s2` The three PNGs are on disk and `file(1)` reports each as `PNG image data, 3456 x 1926,
  8-bit/color RGBA, non-interlaced` — `art-lab-hidden.png` 4,324,611 B, `ab-proof.png` 4,316,560 B,
  `ab-proof.bloom-off.png` 4,059,448 B. (Sizes/dimensions measured by s2; that they depict the track is
  `[inherited]` — s2 has not viewed them.)
- `[inherited]` A/B disagreement: SSIM R 0.7949 · G 0.8730 · B 0.9265 · all 0.8648; PSNR avg 23.645 dB;
  **alpha `inf`**. The alpha-at-infinity is the load-bearing half — identical alpha with divergent colour is a
  post pass over the same scene, not a different scene. Red diverging most is what marigold-primary bloom
  predicts. Either number alone proves nothing.
- `[inherited]` ⚠ RETRACTED: "a tab loaded while hidden never mounts R3F at all" is **WRONG**. The effect runs
  in a hidden tab with the canvas still at `300×150` (`PROBE effect ran, hot = true`) and the request is
  received. Falsified by the lane against itself.
- `[inherited]` Cause of that wrong claim: **HMR updates to `frame-tap.tsx` do not re-register the listener** —
  Vite prunes a replaced module's custom listeners and Fast Refresh does not re-run an effect inside R3F's
  reconciler, so a probe added by editing the file looks like it never ran. Every successful tap followed a
  **full page reload**; every failure followed an HMR-only update.
- `[inherited]` The open failure: channel delivers → handler entered → nothing. No upload, no error event;
  neither throws nor rejects.
- `[unmeasured]` Whether the hang is in `pumpAndCapture`, `toDataURL`, or the upload fetch. The inner probe
  never loaded (HMR trap), so there is no reading past handler entry.
