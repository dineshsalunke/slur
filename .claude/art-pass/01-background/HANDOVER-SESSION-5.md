# Handover — session 5 (2026-09-19). Read this before touching the sky or starting task 2.

Written because the session was restarted to upgrade Claude Code (this machine is on **2.1.212**;
cross-session messaging needs **2.1.224+**, which replaces a lossy relay with direct peer messaging — one
decision packet was silently dropped by that relay before the upgrade, which is the bug being fixed).

**Assume no chat history.** Everything load-bearing is here or in a commit.

Branch `art/background`, worktree `../slur-worktrees/background`, client `:5200` / server `:2600`.
Commits this session: `c97bfe4` (fov + decisions) and the handover commit carrying this file.

---

## 0. State in one paragraph

Task 1 (background sky) is **built and green**: the reference jpg is shipped as the display sky on a
camera-locked sphere **patch**, and the scene is lit by a separately-authored `<Lightformer>` rig plus one
`DirectionalLight`. The `/iso-sky` visual gate has **NOT** run — it is **deferred by the owner**, not skipped
and not failed (§4). Task 2 (track) is **decided but not built** (§5). Nothing is blocked on code.

---

## 1. ⚠ Four things a cold context will try to "fix" back. Do not.

### 1a. The bearing convention is `0 = +Z`. Do not re-base it to `0 = −Z`.

`skyDirection( bearingDeg, elevationDeg )` in `sky-config.ts` uses **bearing 0 = +Z** (the way the ship
flies), growing toward **screen-right, which is world −X** — a camera looks down its own −Z, so
`right = up × back = (0,1,0) × (0,0,−1) = (−1,0,0)`.

The **previous** convention was `0 = −Z`, i.e. bearing 0 pointed **behind the player**, while its own comment
claimed the body sat "upper-right of the game's forward view". Both the value and the comment were eye-tuned
in a free-orbit lab where "forward" had no meaning, so nothing caught it.

**Why re-based rather than keeping `0 = −Z` and moving the value to 215°:** the two are **exactly equivalent
in rendered effect** — 215 in the old frame and 66 in the new one are not the same direction, but for any
given direction there is a value in either frame that expresses it. So this was not a correctness choice
between two candidates; it was a choice about which frame a *human* can reason in without re-deriving a sign
every time. `0 = +Z` means "bearing 0 is where you are flying", which is checkable at a glance against
`chase.ts` (camera at `p.z - back`, aimed at `p.z + lookAhead` ⇒ **gameplay forward is +Z**).

It is **pinned by `sky-config.test.ts`**, which projects through a real three `PerspectiveCamera` rather than
re-asserting the algebra that produced the convention. That test is the artifact; the constant is not.

### 1b. The star bearing is **66° / 19°** and it is RESOLVED. It is not an open eye-call.

Do not reopen this as "66 vs 35, let the owner pick". An earlier revision of the record framed it that way and
that framing was **wrong**.

**The measurement — re-run it rather than re-litigating it.** Threshold `nebula-backdrop.jpg` at luma ≥ 210;
take the brightest pixel per row in the upper-right quadrant; Kasa-fit a circle → planet limb centre
**(1679, 622) r 719 px**, residual **rms 4.2 px**. A polar sweep of that circle puts the lit arc from the
frame edge at 120° to a **hard terminator at 169°** (luma 211 → 81 → 34 over six degrees). A crescent's lit
limb spans 180° centred on the sub-stellar azimuth ⇒ the star is at **79° screen-azimuth from the planet
centre**, essentially straight above it ⇒ **bearing 66°, elevation 19°**.

This is the **only actual evidence** anyone has produced about the image's baked-in lighting. A competing
**35°** (offered as 215° in the old frame) was an **eyeball read and is struck**.

**The "55 vs 27°" conflict dissolves — it was never a contradiction**, and a cold context *will* rediscover it
and think it found something. The two claims are about **different objects**:

| claim | what it is about |
|---|---|
| "old-frame `starDirection(55)` = `(0.819, ·, −0.574)`, forward is +Z, so the light came from behind-right" | the **DirectionalLight's world direction** — arithmetic |
| "55 put the star 27° to the planet's right, the mirror of the image" | where the **rendered body landed on screen** |

Both are true. That they *disagreed with each other* **is** the frame bug of §1a — already fixed. Neither is
evidence about the image.

> **Separation from the planet is a composition choice, not a measurement.** The crescent's thickness implies
> a phase angle geometrically inconsistent with the planet's apparent size — expected of an AI render
> (`boards-are-look-target-not-physics`), not worth honouring. Only the **azimuth** is load-bearing.

**Still genuinely the owner's eye, and a different question:** whether the lit result **looks** right once a
track is in frame.

### 1c. The vertical extent is ALREADY derived from the image's real aspect. The oval-planet risk never existed.

Stated plainly because it was raised against the build **on a false premise** and will be raised again.

A sphere patch runs UV 0–1 across `phiLength × thetaLength`, so if an authored pair drifts from the jpg's
**1672 × 941 (1.78)** the planet renders **oval**. `sky-backdrop.tsx:87-88` therefore authors only the
horizontal and derives the vertical:

```ts
const aspect = ( image?.width ?? 16 ) / ( image?.height ?? 9 );
const fovVDeg = config.fovDeg / aspect;
```

There is **one** authored angle. There is no second number to drift. Do not "fix" this by hardcoding a
`160 × 90` pair — that reintroduces exactly the drift the derivation prevents.

### 1d. `fovDeg` is **140**, and the test — not the constant — is the artifact.

The shipped value was **120** and it was **under-spec**. Both derivations that produced it sized the cone from
the camera's frame alone and **omitted the camera's own yaw**. `SkyFollow` copies camera **position** only,
deliberately never rotation, so the patch is world-fixed and the camera turns **inside** it.

Derivation, from `camera/chase.ts:10-18` + `packages/shared/src/constants.ts:89-91`:

| term | value |
|---|---|
| sustained max-strafe rubberband lag | `strafeClamp / follow` = 80/16 = **5u** |
| look distance | `back` (11→14 at speed) + `lookAhead` (7) = **18–21u** |
| ⇒ peak yaw | `atan(5/18)` ≈ **15.5°** |
| horizontal fov at top speed | `2·atan(tan(37.5°)·16/9)` ≈ **107.5°** (`CHASE.fov` is three's **vertical** fov, 60→75 under `fovStretch`) |
| **⇒ coverage need** | `108 + 2·15.5` ≈ **138.5°** |

**140, not the 160 that was proposed.** 138.5 is the derived floor; 160 pays **~14% more composition
zoom-out** than the geometry demands, which shrinks everything and drifts the planet limb cornerward — for a
**transient** excursion (`strafeDamp: 14` bleeds lateral momentum fast) that the edge fade degrades to **dark,
not to hard void**. 140 is the **floor, not the answer**; the final value is an eye call at the gate.

**The real fix was the test.** `sky-config.test.ts` asserted `fovDeg > 2 * halfDeg` **with no yaw term** —
which is exactly what let 120 pass. It now derives the yaw term from the same `chase.ts` constants, so the
number cannot silently drift back.

---

## 2. Other decisions already closed (do not re-derive)

- **Mapping: a sphere PATCH, no shader.** A stock sphere's default UVs **are** equirectangular, so "swap the
  ShaderMaterial for a texture" would have silently shipped the exact equirect mapping the brief rejects.
  `phiLength`/`thetaLength` cut the cone a framed image actually covers.
  - **`phiLength` IS NEGATIVE** on purpose (so image-left lands screen-left), which flips the winding — hence
    **`DoubleSide`**, rather than reasoning about which way the normals ended up pointing.
  - The edge fade is an **`alphaMap` `DataTexture`**, not an `onBeforeCompile` patch, so the shader count
    stays at **zero** — which was the point of the whole pivot.
- **Single source for the light direction.** `star-light.tsx:21` and `sky-environment.tsx:49` **both** call
  `skyDirection( config.starBearingDeg, … )`. The `<Lightformer>` rig and the `DirectionalLight` cannot drift.
  `sky-config.ts:119` labels it *"THE SINGLE SOURCE OF TRUTH FOR THE LIGHT'S DIRECTION"*. Keep it that way.
- **`celestial-body.tsx` is deleted**, and its `bearingDeg: 28` was **not** carried forward. The jpg already
  contains the rim-lit planet limb; a second procedural body would double it.
- **No CDN.** drei `<Environment preset="…">` fetches remotely and is **forbidden** — this must work offline
  and on the office LAN. The `<Environment>` **children** path was verified to fetch nothing: **zero external
  requests across 62** on `/iso-sky`.

---

## 3. Why the lab's state design is "one render per change" and that is correct

The retired procedural version wrote slider values straight into **shader uniforms** inside `useFrame` (zero
React renders), and its own comment rejected `useSyncExternalStore` as "still per-tick". That was right **while
the sky was a shader**.

There are now **no uniforms**. The knobs are **geometry arguments** and `<Lightformer>` transforms, reachable
only through props — so one render per change is the **floor**, not a regression. Split memoisation in
`tunable-sky.tsx` keeps a backdrop drag from re-baking the cubemap.

---

## 4. The `/iso-sky` gate — DEFERRED, and why

**Not skipped. Not failed. Deferred by the owner**, because two roughness probes are not enough scene to judge
lighting against: tone mapping, patch FOV and tilt are all **whole-frame composition calls**, and tilt is
outright unjudgeable in a free orbit (the chase cam is pitched **18–21° down**, so only the top ~10–20% of the
frame is sky). The track lands first; then the gate runs with a real track in frame.

When it does run:

```
PORT=2600 pnpm dev          # from this worktree
```
then `http://localhost:5200/iso-sky` **in a FOREGROUND tab**, bloom **on and off**, then `/art-lab` at race speed.

> ⚠ **Never gate this from an automated Chrome tab.** The tab reports `document.visibilityState === "hidden"`,
> so rAF never fires and the WebGL canvas stays **black** while the DOM panels render fine. That is the
> `hidden-tab-blank-canvas` trap, **already paid for twice**. It is not a render bug and there is nothing to
> debug.

**The acceptance test that matters is the roughness probes differentiating:**

| Step | Switches | Expected |
|---|---|---|
| 1 | `Star light` OFF, `Env rig` OFF | both probes go **flat/black**. If not, something else is lighting them and the test proves nothing. |
| 2 | `Star light` OFF, `Env rig` ON | `0.2` and `0.9` look **visibly different** ← **the pass condition**; the procedural path never achieved it |
| 3 | both ON | the shipped look |

The display sky needs **no histogram tuning** — it *is* the reference. Compare against the
`Nebula backdrop (boards' sky)` board, already the route's default. `Copy config` emits a paste-ready
`sky-config.ts` fragment.

**Three knobs deliberately at a defensible default, awaiting the eye:** `Tone map` (shipped **ON**; OFF shows
the reference ungraded — A/B it, and note this is the *same* decision as task 2's D3), `Field of view` (**140**,
the floor per §1d), and `Tilt` (**0°**, the one most likely to move, judgeable only in `/art-lab`).

---

## 5. Task 2 (track) — DECIDED, NOT STARTED

**Do not begin it from this handover alone.** Three decisions are of-record in
[`02-track/README.md` §7](../02-track/README.md), with full reasoning. Headlines:

- **D1** — `TrackFloor` (one generated continuous mesh) becomes the game's floor; `TrackView`'s instanced
  floor quads are deleted. Gap treatment is *geometry*, and instanced boxes repeat every 4u — the exact
  "dense emissive seam grid" the direction forbids.
- **D2** — task 3's emitter array comes **forward** into task 2: `MeshStandardMaterial` patched via
  `onBeforeCompile`, **fixed-size** uniform array of the K nearest emitters, rails as the only emitters.
  **Fixed-size is load-bearing and must be said in the code**: a varying light count recompiles the shader
  mid-race; a fixed array has no count to churn.
- **D3** — `toneMapped: false` on every track surface contradicts the done-criterion ("reads marigold **in the
  final tone-mapped frame**"). Becomes a panel switch, settled once for the whole frame alongside task 1's.

Also noted there: lethal blocks are saturated red `#ff2740` while **red is explicitly excluded** from the
palette — retone them as part of the *review setup* or every material read is taken against a forbidden colour.

**`02-track/README.md`'s header still reads "Depends on: task 1 (judged under the real sky)". That dependency
is inverted on purpose** (§4). The file says so in §7; do not "correct" it back.

---

## 6. ⚠ Housekeeping — a divergence to MERGE, not clobber

`.claude/art-pass/INDEX.md` has **diverged** between this worktree and the shared checkout, and **each side
has content the other lacks**:

- **this worktree** has the `### ▶ NEXT — state as of 2026-09-19` block;
- **the shared checkout** *replaced* that block with `### 2026-09-19 (later) — the lane's plan reviewed, three
  decisions relayed`.

**Do not reconcile this yourself** — the owner will, before the PR. Flagged here only so a cold context does
not overwrite one side with the other. Note that some of the shared copy's relayed decisions are **superseded**
by this session: its "cone size — 160° × 90°" is answered by §1d (140, and the vertical is derived not
authored), and its star-bearing entry is answered by §1b.

The whole `.claude/art-pass/**` tree, plus `CLAUDE.md`, `.claude/backlog.md` and
`.claude/phases/2026-09-18-art-lanes-supervisor.md`, **must ride out of this worktree** — the pre-commit hook
blocks Claude committing them in the shared checkout.

---

## 7. Verify gate, verbatim

`pnpm -r test` **silently skips `@slur/shared`** and its 75 sim tests, so the explicit filter is *not*
redundant:

```sh
pnpm typecheck && pnpm lint && pnpm --filter @slur/shared test && pnpm -r test && pnpm build
```

Green as of this commit: typecheck · lint · **75** shared + **34** client + **4** server · build.

**Tests never gate art.** A green run means the code is sound, not that the art is right.
