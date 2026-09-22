# Handover — retire the tuning panel, then the two block mechanics

Session of 2026-09-23, `slur-supervisor`. Written at context limit. **Nothing below is started.**

## Where the tree is

`dev` only — `art/hdri-picker` and `art/rail-lights` deleted with `git branch -d` after
`git rev-list --count dev..<branch>` returned 0 for both. One worktree, no stashes, clean tree.
**`dev` is 38 commits ahead of `origin/dev` and unpushed.**

Landed this session: `734877b` (the dev-only branching rule in `CLAUDE.md`) and `fc65986` (ships fall
off the deck edges — see [[HANDOVER-edge-fall]], whose GDD follow-ups are still open).

## Owner's three asks, in the order they were given

### 1. Remove the debug panel — NOT a delete, and it is CONTESTED

**Do not start this without checking with `hud` and `atmospherics` first.** Both are actively
dialling through the panel: `hud` on the exhaust `EngineLight` pass (targeting the deck streak
`#95511a` / pool `#3a2c22`), `atmospherics` on an asteroid look that is still unjudged. Removing it
mid-flight destroys both.

**Scope is larger than it looks.** `apps/client/app/dev/` holds `tuning-panel.tsx`, `tuning.ts`,
`tuning-schema.ts`, `tuning-persist.ts`, `tuning-rebuild.ts`, `tuning-export.ts`,
`use-rebuild-token.ts`. But **19 scene modules import `num()`/`col()`** and read their values at
runtime — `authored-environment`, `back-fill`, `engine-light`, `exhaust-field`, `monolith-group`,
`near-fill`, `rail-lights`, `rear-view` (+ camera), `scene-effects`, `scene-environment`, `scene-fog`,
`track-blocks`, `track-floor`, `track-materials`, `track-rail`, `track-rim`, `track-seams`,
`track-texture`, `test-level-canvas`.

So the job is **bake the dialled values into source constants**, then delete the store. Every
`num( 'X' )` becomes a real constant in the module that owns it (or in `scene/graphite.ts` where it is
shared), and `tuning-schema.ts` is the record of what each value currently is. `tuning-export.ts`
exists and the panel has a **"copy changed defaults"** button — use that to capture the owner's dialled
state before deleting anything, or the tuning of five sessions is lost.

Sequencing that avoids the conflict: let `hud` and `atmospherics` finish and commit their dialled
numbers into the schema first, then bake and delete in one pass.

### 2. No death on block collision — bounce and stop instead

Mechanic 2 of the three announced in
`2026-09-22-block-surface-and-the-fresnel-trade.md:158` — *"Block hit bounces and stops instead of
killing; kill only at full speed."*

`packages/shared/src/sim/step.ts`, the `overlapsBlock` branch: today it is
`if ( insideBody ) { if ( s.invulnTimer <= 0 ) { markDead( s, t ); return; } }`. That whole branch
becomes a speed test — below a threshold, resolve the overlap and apply a reverse impulse; at or above
it, keep the kill.

**This one needs a netcode look and is not purely local.** A bounce is a server-authoritative impulse
the client must predict and reconcile — read `conventions/netcode.md` before writing it. The reverse
impulse must come out of `simulate()` deterministically, or prediction and authority diverge on every
hit. Ship stats are data (non-negotiable 6), so the speed threshold belongs in `ShipClass` config or
`DEFAULT_TUNING`, not in `step.ts`.

Also decide what "stop" means for `vz` — full stop reads as a wall, and at 60+ u/s that may feel worse
than dying. Worth prototyping both before committing to one.

### 3. Organic block sizing — 4u–8u heights, varied depth

Mechanic 1 of the three. Today `sim/track.ts:125-126` fixes `BLOCK_HEIGHT = 8` and `BLOCK_DEPTH = 8`
for every block; only width varies, through `buildWalls`. The owner wants a 4u–8u height range (4u
clearable by a single jump) and more organic sizing so the corridor rewards threading, dodging **and**
jumping rather than only strafing.

**This is BLOCKED and the blocker must be fixed first.** `sim/track.ts:414` `openCenterX` samples
exactly one z-slice per segment:

    const zc = seg.z0 + SEG_LEN / 2;
    ... .filter( ( b ) => b.z0 <= zc && zc < b.z1 )

That is valid **only because every block is centred and 8u deep**. Vary depth or z-offset and the
sampler misses the worst slice, so the threadable-clearance invariant (`docs/GDD.md:31` — *"At every
z-slice, the widest contiguous lethal-free floor run must be ≥ `MIN_CLEAR`"*) stops being enforced and
the generator can emit unthreadable track. **Move the check to sampling every block z-boundary in the
segment, with tests, before any block geometry varies in z.**

**Read `docs/GDD.md` §0 before touching this** — non-negotiable 11 makes it the contract for all
track/geometry/ship-size/collision work, and it holds the roster-conformance rule.

**A height range rewrites the GDD.** `docs/GDD.md:53` — *"Deadly block height | `8u`
(`BLOCK_HEIGHT`) | **above double-jump reach on purpose** — strafe around, never hop"* — and `:148`,
which says *"Jump is **gaps-only**; blocks are **strafe-or-destroy** — the two never overlap."* Asks 2
and 3 together delete that separation deliberately. Update both lines; do not leave the docs diverged.

**Ordering note.** Asks 2 and 3 interact: if a 4u block is jumpable *and* a low-speed hit only bounces,
a mistimed jump becomes a soft landing rather than a death. That is probably the intent, but it is a
design call worth confirming with the owner, not assuming.

## Verify before trusting any of this

Every line-number claim above was checked this session, but the tree moves fast with four sessions in
it. Re-grep before editing.

## Related

- [[HANDOVER-edge-fall]] — mechanic 3, landed at `fc65986`; its GDD updates are still open.
- [[2026-09-22-block-surface-and-the-fresnel-trade]] — where all three mechanics are catalogued.
