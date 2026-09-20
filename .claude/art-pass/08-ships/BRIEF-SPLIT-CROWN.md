# Brief — put the Split Crown on the Freighter

Self-contained. **Do not re-read the big docs** (GDD, ADD, the art-direction package). Everything you
need is here. Every measurement below is first-hand, taken from the GLB binary this session.

## The job

Replace the Freighter's placeholder model (`imperial`, a Quaternius CC0 asset) with **`split-crown.glb`**,
the first bespoke ship asset in the project, built by Codex to the authoritative footprint.

**Scope: the Freighter only.** `comet.glb` exists and is equally ready (see "Also ready" below) but is NOT
in this slice.

## Measured facts — verified from the binary, not from the README

`docs/art-direction/vehicles/split_crown/split-crown.glb`

- **Bounding box 2.5000 x 1.0025 x 6.0000** (X x Y x Z), min `(-1.25, -0.0000, -3.0)`, max
  `(1.25, 1.0025, 3.0)`.
- **Every node transform is identity.** Nothing is pre-scaled or pre-rotated.
- 6 meshes, 6 materials, 2,616 triangles, **0 embedded images** (all colour/roughness/emission are
  material factors).
- Material groups: `Charcoal_coating`, `Recess_interior`, `Armor_panels`, `Marigold_emission`,
  `Recess_bezels`, `Engine_core`.
- Emissive factors: `Marigold_emission` = `[0.91, 0.32, 0.02]`, `Engine_core` = `[1.00, 0.46, 0.03]`.

**The Freighter class footprint is `halfW: 1.25` / `halfL: 3.0` = 2.5u x 6.0u** (`ship-classes.ts`). The
model matches it EXACTLY on both axes.

=> **`scale: 1.0`, `lift: 0`.** Do not derive them; the derivation formula in `ship-visuals.ts`
(`scale = classWidthU / nativeWidthX`, `lift = -nativeMinY * scale`) yields exactly 1.0 and 0 here.
**Assert it rather than trusting this brief** — measure the loaded bbox once and confirm, then drop the
assertion or keep it as a test, your call.

## The OWNER'S DECISION that shapes this slice

**There is no team colour. Everything is marigold, for now.** (Owner, this session, explicit.)

So `ship-model.tsx`'s team wash must **go**, not be filtered:

- `tintHull()` does `std.emissive.set( color )` at `HULL_TINT_INTENSITY 0.55` on **every**
  `MeshStandardMaterial` in the clone. On this model that overwrites `Marigold_emission` and
  `Engine_core` with the player's colour — erasing the authored detailing that is the entire reason the
  asset exists.
- The **team-colour beacon** (the emissive `<mesh>` sphere at `position={[0, 1, 0]}`) is the same
  decision and goes with it. Note its y=1 sits exactly at this hull's 1.0025u roofline, so it would
  intersect the crowns anyway.
- **`uEdgeColor` (the derezz burn edge) also reads `color`.** Do not leave it dangling — give it the
  marigold (`MARIGOLD_EMISSIVE` from `track-materials.ts`) so the dissolve keeps its burn.

Removing the wash touches all five ships, not just the Freighter. That is intended and it is the owner's
call, not scope creep — say so in the PR body.

## The thing most likely to bite you

**Facing.** `ship-visuals.ts` says *"all five share Quaternius's +Z-forward convention today"* and gives
every ship `facing: [0, 0, 0]`. The split-crown's own README says **forward is -Z**. The bbox is
symmetric in Z (-3.0 .. +3.0) so **geometry cannot settle this** — you must look at it.

If the README is right, it needs `facing: [0, Math.PI, 0]`. **A backwards ship is obvious in one frame
and invisible to every test**, so eye-check it before you call the slice done.

## The other thing — `.glb` is new here

`.gitattributes` already LFS-tracks `apps/client/public/models/**/*.glb`, so copying the asset in makes it
an LFS object by design. Good.

**But `gltf-lfs-guard.ts` has only ever seen `.gltf`.** It prefix-matches `'version https://git-lfs'`
against `data`, which for a `.gltf` arrives as a **string**. A `.glb` reaches `parse` as an
**ArrayBuffer**. **Verify the guard still fires on a `.glb` pointer**; if it does not, a fresh clone
without `git lfs pull` gets a raw three.js parse error instead of the written `LFS_POINTER_HINT`. Fix it
if it is broken — it is a two-line decode, and this slice is what first exposes the path.

## Getting the asset in

> **`docs/art-direction/` is READ-ONLY. Never edit, move, rename or delete anything under it.**
> **COPY** the file out; leave the original exactly where it is.

`cp docs/art-direction/vehicles/split_crown/split-crown.glb apps/client/public/models/ships/`

Then `ship-visuals.ts` gets `url: '/models/ships/split-crown.glb'`.

## Naming — DECIDED by the owner: the ship becomes Split Crown

**The row is renamed.** `imperial`/"Imperial" was a placeholder named after a Quaternius asset; the lobby
should not keep calling a Split Crown an Imperial. Owner's call, 2026-09-20.

- `ship-classes.ts`: `ShipId` union `'imperial'` -> **`'split-crown'`**; the `SHIPS` row becomes
  `'split-crown': { id: 'split-crown', name: 'Split Crown', classId: 'freighter' }`; `SHIP_ORDER`'s last
  entry follows (keep it last — the entry's index is the dev hot-swap key `5`).
- `ship-visuals.ts`: the `SHIP_VISUALS` key renames with the union, and its `url` becomes
  `'/models/ships/split-crown.glb'`.
- `ship-classes.test.ts`: three `'imperial'` occurrences (a stun-table key and two
  `stunDurationForShip` calls).
- The `halfW: 1.25` comment in the `freighter` class says "imperial CAPPED for size" — a historical note
  about a feel-gate on 2026-08-09. Update the name in it; **keep the fact**, it explains why the
  footprint is what it is.

**No migration is needed and you must not write one.** `shipId` is networked, but rooms are ephemeral
and nothing persists it — `localStorage` holds only the call-sign and the audio prefs. The two guards
already cover a stale value: the server's `isShipId()` rejects an unknown id on `setClass`, and
`shipOf()` falls back to `DEFAULT_SHIP` ('challenger'). Worst case for a client mid-race across the
deploy is that it flies a Fighter. Verified this session.

**A hyphenated key needs quoting** in the `SHIPS` / `SHIP_VISUALS` object literals. Biome's config here
only pins `quoteStyle: single` — it does not enforce consistent quoting — so a single quoted key beside
unquoted ones is fine. If lint disagrees, tell the supervisor rather than inventing a different id.

## Also ready, NOT in this slice

`docs/art-direction/vehicles/comet/comet.glb` — measured **2.2000 x 0.3700 x 1.1800**, identity
transforms, 524 tris, same six material groups and the same two emissive factors. The Comet class is
`halfW 1.1` / `halfL 0.59` = **2.2 x 1.18 — also exact**, so it is also `scale: 1.0, lift: 0` and would
replace `bob`. Mention it in the PR as a follow-up; do not build it here.

## Done means

- Freighter renders the Split Crown at true footprint, nose forward, on the rig.
- No team wash anywhere; authored marigold and engine emission intact.
- Full verify gate, all four, and **the explicit `--filter` is not redundant**: `pnpm typecheck` ·
  `pnpm lint` · `pnpm --filter @slur/shared test` · `pnpm -r test` · `pnpm build`. `pnpm -r test` alone
  **silently skips `@slur/shared`**, which is where the ship tests you are editing live.
- Worked in your own worktree off fresh `origin/dev`, PR opened, 2-dot `git diff origin/dev HEAD`
  inspected for reverts before you ask for a merge.

---

## Amendments — supervisor, at dispatch (2026-09-20)

### The asset is ALREADY IN YOUR WORKTREE. Do not go looking for it.

`docs/art-direction/vehicles/` **is not on `dev`** — Codex's delivery is untracked in the owner's shared
checkout and whether it gets committed is the owner's undecided call, tangled up with the
`docs/codex-reconcile` snapshot. So the `cp` line in "Getting the asset in" **cannot run here** and you
must not recreate that folder.

The supervisor has already placed the file:

**`apps/client/public/models/ships/split-crown.glb`** — 257,784 bytes, which matches the size Codex's
own README states, so it is the real binary and not an LFS pointer. It is untracked; `git add` it and it
becomes an LFS object by the existing `.gitattributes` rule. That is intended.

The other ship models in that directory are **smudged correctly in this worktree** (`imperial.gltf`
opens as JSON, 4.5 MB) — verified at dispatch, so the `git lfs pull` trap is not live for you.

### Facing — geometry CAN settle it after all, via the engine cores

The brief says only an eye can settle -Z vs +Z because the bbox is Z-symmetric. That is true of the
bbox, but Codex's README gives a tell the brief did not carry:

> "Four stern emitters in a 2×2 arrangement; two forward crown ports"

So the **`Engine_core` material's four meshes sit at the STERN**. Find their mean Z in the loaded model:
negative mean Z means the engines point down -Z, which means **-Z is backwards and forward is +Z**;
positive mean Z means forward is -Z and you need `facing: [0, Math.PI, 0]`. The README claims forward is
-Z, so the expected reading is a **positive** engine-core mean Z.

**Measure it, then still look at it.** The measurement tells you which way to rotate; the eye confirms
you rotated the right thing. And write the number into `LANE-FACTS.md` — it is the fact that stops the
next ship rediscovering this.

### File the work against issue #159

`https://github.com/dineshsalunke/slur/issues/159` — "Put the Split Crown on the Freighter". Reference
it in the PR body so it closes.
