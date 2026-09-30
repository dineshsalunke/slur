# GDD deviations — doc against code

Audit of `docs/GDD.md` (709 lines) against shipped code, 2026-09-30. Re-checks every finding from the
2026-09-23 report (git history) and adds new ones found this session. Tug feature is mid-move
(uncommitted work moves it into `features/tug/`) — audited against committed HEAD, not reported as a
deviation.

## Summary

| Severity | Count |
|---|---|
| (a) Doc describes a contract that does not exist | 1 |
| (b) Doc/code behaviour mismatch (code lacks doc behaviour, or has behaviour doc lacks) | 2 |
| (c) Stale pointer or number | 3 |
| Resolved since 2026-09-23 | 3 |

---

## Carried over from the 2026-09-23 report

### 1. `MIN_CLEAR`/`CLEARANCE_MARGIN` still not in code — STILL OPEN — (a)

GDD §0:

> *"the widest contiguous lethal-free floor run must be ≥ `MIN_CLEAR`, where `MIN_CLEAR = MAX_SHIP_WIDTH +
> CLEARANCE_MARGIN` … `CLEARANCE_MARGIN = 3u` → `MIN_CLEAR = 7u`."* Also: *"the only tunable is
> `CLEARANCE_MARGIN`"* and *"Any `MIN_LANE`-style constant is derived, **not** an axiom."*

Still true: `packages/shared/src/sim/space.ts:10` —

    export const MIN_LANE = 2 * CELL;

8u, an axiom, not 7u derived from a margin. Neither `MIN_CLEAR` nor `CLEARANCE_MARGIN` exists anywhere in
`packages/shared/src` or `apps`. The project's own ADR log already tracks this exact gap —
`docs/DECISIONS.md:678`: *"GDD §0's clearance identifiers (`MIN_CLEAR 7u`, `CLEARANCE_MARGIN`) still do
not exist in code; what ships is `MIN_LANE = 2·CELL = 8u` as an axiom … untouched here because correcting
8u to 7u is itself a reshape of every seed and wants its own decision."*

**Suggested resolution:** doc moves — rewrite §0's clearance block to document `MIN_LANE = 8u` as the
shipped axiom, or code moves — introduce `CLEARANCE_MARGIN`/`MIN_CLEAR` and accept the seed reshape. Owner
decides; `docs/DECISIONS.md` already frames the choice.

### 2. Roster-conformance module-load guard — RESOLVED (ADR-013)

GDD §0: *"Module-load guard: `rosterContractFailures( SHIP_CLASSES )` runs at import of
`ship-classes.ts` and **throws**."* Confirmed live — `packages/shared/src/ship-classes.ts:164-166`:

    const contractFailures = rosterContractFailures( Object.values( SHIP_CLASSES ) );
    if ( contractFailures.length > 0 )
        throw new Error( `ship roster breaks the GDD §0 track contract:\n  ${ contractFailures.join( '\n  ' ) }` );

Unconditional (not dev-gated), matches the doc. No action needed.

### 3. Clearance/caps derived from a fixed contract, not the roster — RESOLVED (ADR-013)

GDD §0: *"The generator reads `TRACK_CONTRACT` … and never the ship roster."* Confirmed —
`packages/shared/src/constants.ts:140-149` hardcodes four literals (`pacingCruise: 55`, `weaveCruise: 62`,
`weaveStrafeClamp: 65`, `weaveStrafeAccel: 118`), and `WEAVE_SLOPE_CAP`/`WEAVE_CURVATURE_CAP`
(`constants.ts:161-165`) derive only from those, never from `ALL_CLASS_TUNINGS`. `sim/weave.ts` no longer
imports the roster. Matches ADR-013 in `docs/DECISIONS.md:612`. No action needed.

### 4. Slow blocks — PARTIALLY RESOLVED, residual stale text — (c)

GDD §5.2 (line 188) already says correctly: *"Three primitives remain: gaps · sealed · fractured. Slow
blocks are gone."* And §10 (line 699): *"slow blocks: removed."* Both match code — no slow/drag block
exists in `packages/shared/src/sim` (only the unrelated flight constant `coastDrag`).

But the doc contradicts itself two paragraphs later. GDD §5.2 line 203 still says:

> *"The core game is **three primitives only: gaps + deadly blocks + slow blocks**"*

and line 210: *"**slow blocks = grace-notes ON the line**"*. These two lines are leftover text from
before ADR-009/ADR-015 and were never updated when lines 188/699 were fixed.

**Suggested resolution:** doc moves — delete "+ slow blocks" from line 203 and the slow-blocks clause from
line 210; they contradict the doc's own lines 188 and 699.

### 5. `tier` wired to nothing — STILL OPEN — (b)

GDD §5.2: *"procgen `{seed, tier}`"*, implying tier drives generation. Still hardcoded —
`packages/shared/src/sim/track-provider.ts:19-24`:

    export function procgenDescriptor( seed: number, gen: TrackGen = DEFAULT_TRACK_GEN ): TrackDescriptor {
        return {
            kind: 'procgen',
            seed,
            tier: 0,
            ...

`tier` is still on the wire (`packages/shared/src/schema.ts:65`, `@type( 'uint8' ) tier = 0;`, copied at
lines 77/92) but no generator code branches on it.

**Suggested resolution:** code moves — either wire `tier` to a real difficulty knob, or drop the field
from the schema and the doc's descriptor shape.

### 6. `/env-lab` route — RESOLVED

GDD §5.6 now correctly reads: *"REMOVED 2026-09-21 | Nothing replaces them. What is left: `/test-level`
and a hosted room (`/env-lab` was removed 2026-09-22, #196)."* Matches `apps/client/app/routes.ts`, which
lists only `home`, `game/:roomId`, and (dev-only) `test-level` and `beat-deck`. No action needed.

### 7. Flight-stats table stale — unchanged, self-flagged — informational

GDD §5.5 still carries its own warning (*"⚠ STALE — do not code against this table … playtest tuning
moved strafe power and grip past these numbers"*). Not re-verified number-by-number since the doc already
disclaims it; no new finding needed.

---

## New findings this session

### 8. Portal radius and clear-spot sizes are stale — STILL OPEN — (c)/(b)

GDD §5.3 (lines 338, 340-341, 356) documents:

> *"The circle has radius **3u** (`portalR`) and its centre is 3u above the gate floor (`portalY`)."*
> *"An end goes only on a floor spot with room for the widest ship plus **3u** (`portalClearW`), **6u**
> each side in z (`portalClearHalfL`)."*
> *"The drawn gate is a full ring with a **6u** clear aperture (`2 × portalR`)."*

Code, `packages/shared/src/combat/portal.ts:24-38` (`DEFAULT_PORTAL_CONFIG`, unchanged at HEAD):

    portalR: 5,
    portalY: 3,
    ...
    portalClearW: 12,
    portalClearHalfL: 11.5,

`portalR` is 5u, not 3u — a 10u aperture, not 6u. `portalClearW`/`portalClearHalfL` are 12u/11.5u, not
"widest ship + 3u" (≈5.6u) / 6u. Commit `350febce` — *"portal ring 10u across, 2u into the deck; clear
window holds the exit hull and rim"* — resized the ring after issue #329 and the GDD Portal section was
never updated (it still cites only #325, the earlier 6u-ring commit).

**Impact:** a reader sizing anything off the Portal numbers (art scale, HUD, balance) gets the wrong
aperture and clear-spot footprint. Player-facing size, not just an internal constant.

**Suggested resolution:** doc moves — update §5.3's Portal radius/clear-spot numbers to match `350febce`
and cite #329 alongside #325.

### 9. Tug/Tow hold durations are stale — STILL OPEN — (c)

GDD §5.3 (lines 306, 309-310):

> *"For **0.6 s** (`TUG_S`) its speed cap rises to 1.5× cruise … eased in over **0.2 s** (`TUG_EASE_S`)."*
> *"the same lifted cap for **0.8 s** (`TOW_S`, scaled by class)."*

Code, `packages/shared/src/combat/tug-constants.ts` (HEAD, via `git show HEAD:...`):

    export const TUG_S = 1;
    export const TUG_EASE_S = 0.5;
    export const TUG_RISE_S = 0.25;
    ...
    export const TOW_S = 1;

`TUG_S` is 1s not 0.6s, `TUG_EASE_S` is 0.5s not 0.2s, and there's a `TUG_RISE_S` (0.25s) the doc never
mentions. `TOW_S` is 1s not 0.8s. `sim-config.ts` wires these straight through with no override
(`tugS: TUG_S`, `towS: TOW_S`), so these are the live values. Everything else in the Tug section (`TUG_KICK
40`, `TUG_GAIN 0.5`, `TUG_RELEASE_S 0.35`, `TUG_SPEED_CUT 0.7`, `SLOW_CAP 0.6`, `TOW_KICK 40`,
`TOW_STRAFE_SCALE 0.3`, `TOW_JUMP false`) matches code exactly.

**Suggested resolution:** doc moves — update the two numbers and add the missing `TUG_RISE_S` term
(inference: this was likely a retune that never made it back into the GDD prose, the same pattern as the
Portal finding above).

### 10. The phrase generator (ADR-023, #300) is undocumented in GDD §5.2 — STILL OPEN — (b) inference-light

GDD §5.2's "Generation — rhythm-paced (ADR-006)" section (lines 202-214) describes only the original
arrangement-envelope + discrete-slalom/flick generator. It never mentions phrases, motifs, arenas, set
pieces, or acts.

`docs/DECISIONS.md:1268` (ADR-023, accepted with amendments, S1-S3 built) describes a materially different
generator that ships in code: `packages/shared/src/sim/phrase/` builds tracks as chains of phrase types
(`weave`, `motif`, `arena`, `set piece`, `rest`) grouped into three acts, with per-class derived pitch
(`pitch.ts`) replacing the fixed `WEAVE_PITCH` table. `TRACK_GENS` in `space.ts:127` lists
`'weave' | 'score' | 'groove' | 'phrase'` — four generators, not the one GDD §5.2 describes.

**This is an inference, not a contradiction**, because GDD §5.2 never claims to be exhaustive about
generator internals and defers "dimensions and the as-built shape" to TDD §4 and ADR-006 specifically — it
just doesn't cite ADR-023 at all, and ADR-023 is a live, partially-shipped generator with its own vocabulary
(acts, motifs, set pieces) that changes how tracks read. `DEFAULT_TRACK_GEN` in `space.ts:132` is still
`'groove'`, not `'phrase'` — ADR-023 §7 gates `'phrase'` behind `?gen=` until S7, so the doc's silence may
be deliberate (not yet the shipped default). Flagging because a reader of GDD §5.2 alone would not know
`'phrase'` exists.

**Suggested resolution:** doc moves — once `'phrase'` becomes default (ADR-023 S7), fold a short pointer
into GDD §5.2 alongside the ADR-006 paragraph; until then, optionally add one line noting `'phrase'` is
staged behind ADR-023 so the doc isn't silently behind.

---

## Not re-litigated

Sampled and found accurate, not re-reported: ship footprint/flight-stat base numbers (§5.5) match
`ship-classes.ts`; Mine constants (§5.3) match `combat/constants.ts` exactly (`MINE_RATIO 0.15`,
`MINE_LEAD_S 0.8`, `MINE_ARM_S 0.5`, `MINE_TRIGGER_R 3`, `MINE_STUN_S 1.5`, `MINE_SPEED_CUT 0.6`,
`MINE_TTL 20`, `MINE_MAX_PER_OWNER 3`); pickup grab (`PICKUP_GRAB_R 3.2`); lobby chat limits (140 chars,
`CHAT_BURST 5` / `CHAT_WINDOW_MS 5000`, `CHAT_HISTORY_LINES 30`); room-code/private-room shape; controls
table (§8) matches ADR-032's shipped layout, and the no-rear-view-mirror / seeker-lock-HUD text matches
ADR-034/#372.
