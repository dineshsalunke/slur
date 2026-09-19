# Lane handover — the debug panel, at the unit-2 seam (2026-09-20)

Written by the supervisor. **This file is self-contained. Do not re-read `INDEX.md`, the GDD, or the
art-direction package to start work** — everything you need for the next three units is here, and the
big docs will cost you the context this handover exists to save.

## Position — nothing owed, nothing dirty

`art/track-slice2` tip **`ae5b547`**, pushed; `origin/art/track-slice2` matches. Tree clean.

- `56d6f99` — chase camera + ADR-011.
- `c9efcdf` — lane state carried onto the branch.
- `ae5b547` — ADR-011 margin fixup (23.0°, not 15.5° — `fovStretch` compounds with `backStretch`).

Gate re-run green at the tip: biome shows 3 **pre-existing** `noExcessiveLinesPerFile`, nothing new;
Canvas-isolation clean across 8 route entry modules; comment ratchet "27 changed source files, none
gained comment lines"; typecheck clean; shared 75/75, client 66/66, server 4/4; `pnpm build` ✓.

Stack: already up on client `:5201` / server `:2601`. **Check before starting another.**

## Unit 1 — DONE, do not reopen

Camera landed verbatim: `height 7.5 · back 15 · lookAhead 9.5 · lookAtLift 6 · fov 70`. Shipped values
framed the ship at **−0.20°** (off the bottom edge); new values give **11.94°** margin at rest, widening
to **23.00°** at top speed. The `CHASE` comment block that asserted "MUST stay > BLOCK_HEIGHT (8)" has
been rewritten to state plainly that the eye is below 8u and the see-over vantage is given up.

## Unit 2 — the panel's non-camera knobs. NOT SOLVED. Read all of this before touching anything.

**Symptom (owner, in a live-rAF tab):** the four non-camera knobs — bloom, floor `envMapIntensity`,
ambient — do nothing. The five camera knobs work.

### What is established

- **`notify()` defers through `requestAnimationFrame`.** In a hidden tab rAF is dead (free-running
  counter read 0 across four separate CDP calls), so `debugTuningVersion()` is stuck at 0 and the panel
  is dead **by construction**. This is a defect in its own right — see "Unit 2c".
- **Store → React → three.js is wired.** In that same hidden tab, calling `setDebugTuning` directly and
  then forcing a re-render by an unrelated route (a discrete click on a lab layer toggle) DID apply:
  floor `envMapIntensity` 1→0, AmbientLight 1→2, and the panel's own DOM numbers moved with them.

### The observation that wounds the hypothesis — and why it is not yet evidence

In a tab that was genuinely `visible`, `hasFocus: true`, canvas 2760×1474, real rAF alive at 1022 ticks:
`setDebugTuning('floorEnvMapIntensity', 0)` and `('ambientIntensity', 2)` → one frame later **`version`
went 0→1, so `notify()` fired and the listeners were called** — and AmbientLight was still 1, floor
`envMapIntensity` still 1, panel DOM still reading 1. Nothing re-rendered despite a successful notify.

**Two reasons not to build on that, both stated by the lane that measured it:**

1. **Contamination.** The read came back `visibility: "hidden"` — the window was re-occluded between the
   notify and the read, so React may simply never have flushed. One observation, across a visibility flip.
2. **Possible duplicate module.** The store was reached via `await import('/app/dev/debug-tuning.ts')`.
   If Vite ever handed a *second* module instance, those writes were invisible to the app and **the whole
   block above is void**. Evidence against: on first load the panel DOM did reflect values set through
   that import. Not proven.

### Unit 2a — the control that must run FIRST (cheap, and it validates or voids everything above)

Drive **`camHeight`** through the same `await import(...)` path and watch the camera actually move.
`camHeight` is the known-good knob: `updateChaseCamera` reads the `CHASE` singleton every frame and never
crosses React. So:

- camera moves → one module instance, the evidence block is real, go to 2b.
- camera does not move → you had a duplicate module, every unit-2 experiment so far is void, and the
  correct next move is to reach the store through the page's own UI instead of an import.

Do not skip this. It is the difference between a real finding and an artefact.

### Unit 2b — the untested hypothesis family: the value reaches React and stops before the object

**Nothing here has been tested.** No `<primitive object>` check, no `needsUpdate` test, no postprocessing
accessor check.

- A three.js object held as a module singleton or `useMemo` and mounted via `<primitive object={…}>` gets
  **no prop diffing** — React re-renders and R3F applies nothing. `floorSurface()` and the material
  `track-floor.tsx` hands `envMapIntensity` to is the prime suspect.
- `postprocessing` 3.0.4's `Bloom` exposes several settings as accessors rather than constructor args;
  some need re-instantiation. `radius`/`levels` were already suspected of needing a key-remount — check
  whether `intensity`/`threshold`/`smoothing` are in that same family before assuming they differ.
- Mutating a live material can need `needsUpdate`. This repo already has the scar: **HMR does not rebuild
  an already-mounted material** — every sweep frame needs a full reload regardless.

`envMapIntensity` is the cleanest test in the set: `scene.environment` is set **even with the lab's `env`
layer OFF**, so it is live and *should* be strongly visible on a `metalness: 1.0` deck. It is still
unexplained.

### Unit 2c — fix the rAF-deferred notify regardless of the outcome above

`notify()` must stop coalescing on `requestAnimationFrame`. A microtask or a timer behaves identically in
a visible tab and keeps working in a hidden one. As written, the panel can never drive a frame-tap
capture either — an `advance()` pump does **not** flush pending rAF callbacks.

### Accepted and closed — `ambientLight` is inert here for PHYSICAL reasons

The deck is `metalness: 1.0` and has no diffuse term. The only other lit surface in the default lab frame
is a `metalness: 0` boundary whose base colour is near-black `#15171a` under `emissiveIntensity: 2.0`; the
rest are two `MeshBasicMaterial` meshes and a `Points` ShaderMaterial, which ignore lights entirely.
**Nothing in that frame can visibly answer `ambientLight`.** If the ambient knob notifies correctly and
still changes nothing on screen, that is not a bug — do not chase it, and note that the ambient axis may
have nothing to measure in the lab's default frame.

## Frame tap — the README is WRONG for our case, and this supersedes it

Probed this session: full page reload on `:5201/art-lab`, then
`curl 'http://localhost:5201/__frame-tap?name=probe-01'` → **504, "nobody answered"**, no file written.

**The cause is verified and it is NOT the README's intermittent fault, so its "reload and tap again"
remedy does not apply.** Immediately after that reload the canvas measured **300×150 with
`window.__ART_LAB` absent — R3F never mounted at all.** `FrameTap` lives inside `<Canvas>`, so its HMR
listener was never registered. Nobody answered because *the responder does not exist in a hidden tab*.

Why: R3F gates root creation on a non-zero measured size, and measurement never resolves while the tab is
hidden. `resize_window` forces it — that is how a mounted 1442×1992 canvas was obtained earlier in the
session — but it failed on retry (1380→1360), so it is **not reliable**.

**The claim "frame-tap retires the focused-tab constraint" is therefore false as stated.** The tap cannot
photograph a tab that was never visible, because the tap's own client half cannot mount in one.

**The one probe that decides whether unfocused captures are possible at all** — run it, it is cheap:
mount the tab **while visible** (confirm a real canvas size and `window.__ART_LAB` present), then let it
go hidden, then tap. Evidence it may work: one earlier tap answered **200** with a 1442×1992 PNG
(`.claude/art-pass/00-frame-tap/refs/probe-mounted.png`) at a moment when the lane's own canvas was
unmounted — so some other already-mounted lab tab served it. Mount-then-hide is untested.

If that probe answers 200, unfocused captures work and the rule is simply "mount visible first". If it
504s, frame-tap is only usable from a visible tab and we plan every visual gate around that.

## Order of work

1. **Unit 2a** — the `camHeight` control. Everything else is conditional on it.
2. **Frame-tap mount-then-hide probe.** Cheap, and it sets the rules for every remaining visual gate.
3. **Unit 2b** — the primitive / `needsUpdate` / accessor family.
4. **Unit 2c** — move `notify()` off rAF.

## Still held — do not start without the supervisor saying so

The bloom/deck/ambient sweep, the PR for `art/track-slice2`, the retone, the emitter array.

## Standing constraints

- **No key light on the track, ever** (`03-lighting/README.md` §1a: "NOT a three-point rig"; the star
  "barely touches the track"). Every fix here is subtractive.
- **Do not mount the sky rig in `/game` on this branch** — it visibly changes the shipped game, which
  makes it 03-lighting's subject. Owner ruling. Do not do it "while you're in there".
- **`FLOOR_METALNESS` stays 1.0** and **the rail stays 1.0u**. Settled; if a later pass wants the rail
  thinner, stop and ask.
- Backdrop takes **30–45 s** after every reload — before it lands the deck is dark and the sky black.
  That is a loading state, not your change.
- Write lane docs into **this worktree**, never the shared checkout at `/Users/apple/Projects/personal/slur`.
