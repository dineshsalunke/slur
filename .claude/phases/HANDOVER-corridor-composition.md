# Handover — make the corridor interesting: five changes to the generator

Session of 2026-09-23, `slur-supervisor`. **Briefed, not started.** Written at context limit and
handed to the `corridor-composition` herdr lane.

## The problem, as diagnosed

The owner says the level does not feel interesting. It is not a content shortage — it is that the
corridor only ever asks **one** question.

Every deadly block is identical but for width: `sim/track.ts:125-126` fixes `BLOCK_HEIGHT = 8` and
`BLOCK_DEPTH = 8`. So every block has the same answer — strafe around it. Gaps ask the only other
question, jump. And the two **never co-occur**: `sim/track.ts:400-403` returns a `kind: 'gap'` segment
early, before `buildWalls` is ever reached, so a gap segment cannot contain blocks. Two verbs, two
channels, no interaction. The player is never asked to jump *and* be somewhere specific laterally.

`docs/GDD.md:148` states the separation as intent — *"Jump is **gaps-only**; blocks are
**strafe-or-destroy** — the two never overlap."* Change 2 below deliberately retires that sentence, so
the GDD must be updated in the same PR.

## The five changes, in dependency order

### 0. PREREQUISITE — fix the single-slice clearance sampler

**Nothing involving varied depth or z-offset may land before this.** `sim/track.ts:414` `openCenterX`:

    const zc = seg.z0 + SEG_LEN / 2;
    ... .filter( ( b ) => b.z0 <= zc && zc < b.z1 )

It samples exactly one z-slice per segment, and that is sound **only because every block is currently
centred and 8u deep**. Vary depth and the sampler misses the worst slice, so the threadable-clearance
invariant — `docs/GDD.md:31`, *"At every z-slice, the widest contiguous lethal-free floor run must be
≥ `MIN_CLEAR`"* — silently stops being enforced and the generator can emit unpassable track.

Rewrite it to sample **every block z-boundary in the segment** (the set of `b.z0` and `b.z1` values,
clamped to the segment, is sufficient — clearance only changes at a boundary). **Write the tests
first**, including one that fails against the current implementation with a non-centred block.

### 1. Vary DEPTH, not just height

`BLOCK_DEPTH = 8` is the under-used axis and the cheapest win. A 4u-deep block is a post to thread
past; a 24u-deep one is a wall you must commit to a side of early. Same primitive, different decision,
and it is **legible at speed** because depth reads as how long you are committed.

Do this before touching height. It needs no new art, no netcode, and does not disturb the jump/strafe
split.

### 2. Let gaps and blocks co-occur

The early return at `sim/track.ts:400-403` makes the two mutually exclusive. Allow blocks on a gap
segment's landing side, so a gap plus a block is one decision with two parts.

**Clearance is the hard part.** A gap already removes floor; a block on the remaining floor removes
more. The sampler from change 0 must be run over the combined result, not over blocks alone.
Generate-and-test is acceptable here: roll, check the invariant, reroll on failure with a bounded
attempt count and a documented fallback.

### 3. Space by TIME, not by segment

At 60–80 u/s the ship crosses a 20u segment in 0.25–0.33s. Uniform spacing in *distance* means
difficulty swings with speed — and speed varies by throttle and by ship class, so the same track is a
different game for a Freighter and an Interceptor.

Author spacing in **seconds of reaction time**, then convert to distance using a reference speed.
`DEFAULT_TUNING.maxCruise` is the natural reference. This is the change most likely to make the track
feel deliberate rather than arbitrary.

### 4. Rest beats density

Uniform density reads as noise. `intensityAt` (`sim/track.ts:176`) already exists to modulate it —
use it to author explicit **rest / build / spike / release** phrases rather than a smooth ramp. A flat
stretch after a hard passage is what makes the hard passage feel hard.

### 5. Lengthen the test track 3–4x

`apps/client/app/routes/test-level/test-level-canvas.tsx:16` — `TEST_LEVEL_SEGMENTS = 120`, which at
`SEG_LEN = 20` is a 2400u track. Take it to **~420 segments (8400u, 3.5x)**. Check the block streaming
window still behaves: `track-instancing.ts` `BACK` is 240 and load-bearing for the rearview mirror
(do not lower it), and `BLOCK_LIMIT` is 160 with a worst case previously measured at 71.

## Constraints that bind this work

- **Read `docs/GDD.md` §0 first.** Non-negotiable 11 makes it the contract for all
  track/geometry/collision work, and it holds `MIN_CLEAR` and the roster-conformance rule.
- **`CELL = 4u` is an authoring snap grid only** — not a runtime unit, not a block-size rule. Blocks
  may be any size. The sim never reads it.
- Generator internals are ADR-006/ADR-007 in `docs/DECISIONS.md`.
- The generator is in `@slur/shared` and runs on **both** ends — it must stay deterministic from the
  descriptor. Same seed, same track, client and server (ADR-000/ADR-001).
- **Update `docs/GDD.md`** in the same PR: `:148` (jump/block separation, retired by change 2) and
  `:53` if block height varies later.

## Explicitly NOT in this scope

- **The 4u jumpable block.** Deferred on purpose. If a 4u and an 8u block are the same object at two
  sizes, the player must *measure* at 70 u/s to know whether to jump or strafe — that is a guess, not
  difficulty. It needs a distinct silhouette or material first, which is art direction.
- **Bounce-instead-of-kill** ([[HANDOVER-block-mechanics]]) — needs a netcode read.
- **Retiring the tuning panel** — contested, waits on `hud`.

## Open research

A `procgen-research` lane (sonnet) is investigating obstacle sizing, rhythm and readability in Trials,
Spelunky, Canabalt, Thumper, F-Zero GX, Wipeout, Redout and Race the Sun. Its report lands at
`.claude/research/procgen-level-design.md`. **Changes 3 and 4 are the ones most likely to be revised
by it** — prefer its numbers over the guesses above where they conflict.

## Related

- [[HANDOVER-block-mechanics]] — the two deferred mechanics and the sampler blocker.
- [[HANDOVER-edge-fall]] — landed at `fc65986`; its GDD follow-ups are still open.
