# Lane handover — unit 2 CLOSED, and the sweep needs re-aiming (2026-09-20)

Written by the supervisor. **Self-contained. Do not re-read `INDEX.md`, the GDD, `LANE-BRIEF.md`,
`SLICE-2-BRIEF.md`, or anything under `docs/art-direction/`** to start work.

Supersedes the previous version of this file. Everything below is first-hand measurement unless marked
`[unmeasured]`.

## Position

`art/track-slice2` tip **`868d5f8`**, pushed, origin matches, tree clean, gate green at that tip
(typecheck clean; biome 3 **pre-existing** `noExcessiveLinesPerFile`; canvas-isolation 8/8; comment
ratchet no gain; shared 75/75, client 66/66, server 4/4; `pnpm build` ✓).

Landed on this branch: the owner-dialled chase camera + ADR-011 (`56d6f99`, `ae5b547`), the debug panel
(`4305a4d`), and the synchronous-notify fix (`868d5f8`).

## Unit 2 — SOLVED. The rAF defer was the whole bug.

The old `notify()` was `if (pending) return; pending = true; requestAnimationFrame(...)` — and `pending`
was cleared **only inside the rAF callback**. A hidden tab never runs rAF (free-running counter read 0
across four separate calls: dead, not throttled), so `pending` latched `true` **permanently** and every
later `notify()` short-circuited forever, *including after the tab came back to the foreground*. One
backgrounding poisoned the store for the life of the page.

That explains the owner's live tab exactly. `setDebugTuning` does `applyCamera()` — a synchronous mutation
of the `CHASE` singleton that `updateChaseCamera` reads every frame — **and then** `notify()`. So the five
camera knobs kept working past the short-circuit while every React-path knob was dead, and `DebugPanel`'s
own numbers were stuck because the panel is itself a consumer.

**"The camera knobs work" was never evidence the store was healthy — it was evidence of the opposite shape.**

**Verified fixed** at `868d5f8`, in a *hidden* tab, driven through the app's own slider elements with no
dynamic import in the path: bloom intensity 1.2→0.4, floor envMap 1→0.25, ambient 1→1.8, camHeight 7.5→9.
All four panel DOM values moved. Impossible before the fix.

## Unit 2a — duplicate module CONFIRMED. It was instrumentation, not the app.

`performance` resource entries show two URLs: `/app/dev/debug-tuning.ts?t=1789849203541` (what the app
runs, via Vite HMR) and `/app/dev/debug-tuning.ts` (what `await import(...)` returns). Two instances.
Behavioural control: wrote `DEBUG_TUNING.camHeight = 42` on the probe's instance, drove the app's instance
through its real slider, and the app's `applyCamera` read **7.5, not 42**.

**Standing rule from this:** every future probe must drive **the app's own DOM elements**. A value written
through `await import(...)` is written into a module the app is not running. This voided an entire earlier
evidence block and cost a unit.

## Unit 2b — RETIRED on first-hand evidence.

Panel `envMapIntensity` 0 and 2 both landed on the live material (`material.envMapIntensity` read 0, then
2). R3F applies the prop; there is no `<primitive object>` in the path. The value does **not** stop before
the object.

## The finding that re-aims the sweep — the deck's washout is on NO panel axis

Deck mesh, identified by visibility toggle: 10704 verts, `MeshStandardMaterial`, `metalness 1`,
`roughness 0.42`, `color ffffff`, `map` present, **`envMap null`**, **`emissive c8d0d8` @
`emissiveIntensity 0.05`**.

- `emissiveIntensity` 0.05 → 0 **blacks the deck out**. That is the dominant term.
- `envMapIntensity` 0 → 2: no visible change.
- `AmbientLight` 1 → 0: no visible change.
- `DirectionalLight` 1.6 → 0: no visible change.
- `scene.environment` is a `CubeTexture`, mapping 301, image dims `undefined`. `gl.toneMapping` 0 (None),
  exposure 1.

**So the panel's three "washout cause" knobs do not control the washout, and the knob that does is not on
the panel.** The deck is self-lit, which is the art direction working as intended — `03-lighting/README.md`
§1a has the track lighting itself from its own emissives — so the live question is its *level and colour*
(`c8d0d8` is a cool grey-white), not whether it should be emissive at all.

**The bloom/deck/ambient sweep as originally scoped is dead.** Do not run it.

## The DirectionalLight is NOT a constraint violation — closed, do not re-raise

Traced at source: that light is `StarLight` (`game/scene/star-light.tsx`), mounted only through
`DeepSpaceSky`, which reaches `/art-lab` via `TunableSky` and otherwise only `/iso-sky`. Its own doc
comment states why it exists — "a PMREM-convolved cubemap cannot hold a small hard highlight — the rig does
the soft rim, this does the crisp one." It is **the star**, which `03-lighting/README.md` §1a explicitly
sanctions ("barely touches the track"), not a key light.

It is also **lab-only**: `/game` mounts no authored rig at all, its entire light list being one
`<ambientLight intensity={1}>`. "No key light on the track, ever" still stands and is not breached here.

## Frame tap — mount-then-hide ANSWERS 504. Visual gates are visible-tab-only.

Probe condition met exactly: mounted while visible (canvas 3456×1882, `window.__ART_LAB` present), a second
tab opened to force hidden (`visibilityState "hidden"`, canvas still 3456×1882, `__ART_LAB` still present),
then curl → **HTTP 504 in 0.26 s**, no file written.

Caveat carried honestly: there is **no same-session visible-tab control** for that curl, because the window
re-hid before one could be taken. The only 200 on record is a cross-session one. So "504 means hidden" is
strong but not airtight. `[unmeasured]`

Reconfirmed: a **never-visible** tab never mounts R3F at all (canvas 300×150, `__ART_LAB` undefined, rAF 0),
and `resize_window` did not fix it.

**Plan every visual gate around a visible tab.** Do not spend more time on frame-tap.

## Known instrument hazards — read before trusting any visual read

- **`gl.info.render.frame` can be FROZEN while the lab's run button reads "running"** — observed stuck at
  57951, 0 frames in 1 s. Screenshots taken then are the same stale frame and prove nothing. After toggling
  the lab run state: 720 frames in 600 ms. **Check the frame counter is advancing before believing any
  before/after pair.** Why the counter read 0 while the button said "running" is `[unmeasured]`.
- Browser pairing is per-session and **needs a retry**: `switch_browser` first returned "No other browsers
  available" and `list_connected_browsers` returned `[]`, then listed `Browser 1` on retry;
  `select_browser 88bbfbbc-2060-436d-89a2-7925ab89fd7f` then worked.
- Backdrop takes **30–45 s** after every reload — dark deck and black sky before it lands is a loading
  state, not your change.
- **HMR does not rebuild an already-mounted material** — every sweep frame needs a full reload.

## Standing constraints

- **No key light on the track, ever.** Every fix here is subtractive.
- **Do not mount the sky rig in `/game` on this branch** — that is 03-lighting's subject. Owner ruling.
- **`FLOOR_METALNESS` stays 1.0**; **the rail stays 1.0u**. If a later pass wants the rail thinner, ask.
- Write lane docs into **this worktree**, never the shared checkout.
