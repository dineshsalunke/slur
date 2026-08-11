# SLUR — Superseded design (history, forward-framed)

> **Read direction is inverted on purpose.** The live docs (`docs/GDD.md`, `CLAUDE.md`) state only the
> **current** design, as fact, with no inline "⚠ SUPERSEDED" interruptions. Retired design intent is not lost —
> it lives **here**, framed as **PRECEDED**: each entry says *what it was* and *what it became*, pointing
> **forward** to the live design + the ADR that moved us. So a live-doc reader never peels back retractions; a
> historian comes here and follows the arrows forward.
>
> - **Current design** → `docs/GDD.md` · `CLAUDE.md`
> - **Decisions + rationale (why we moved)** → `docs/DECISIONS.md` (the ADR log)
> - **This file** → the retired *prose verbatim*, so the exact old wording survives the summarising an ADR does.

---

## PRECEDED: two modes (Race + endless Survival) → **now Race-only, finite tracks** (ADR-004, retired 2026-08-10)

The game had **two** modes; endless Survival was dropped in favour of longer finite tracks, and the per-mode
join policy collapsed to Race-always (late join → spectate the round). Retired verbatim:

> **B. Survival (endless) — fast-follow.** Procedural endless track; a **chasing derezz-wall** sweeps forward
> behind the pack (camp = caught) with **distance/time as score**. Furthest/last-flying wins. (cuberun + our
> chase mechanic.) Home of the §5.1 forward-pressure mechanism.
>
> **Join policy — per mode (S4):** **Race** locks the field at GO — late join → **spectate** the round and race
> the next. **Survival** keeps **live drop-in** — a late joiner **spawns beside the pack** (an endless track has
> no start line to gate on). One server seam (`shouldSpectateOnJoin`), a per-mode branch not two code paths.

**Why moved:** playtest-informed (user, 2026-08-10). Endless was the *sole* justification for O(1) random-access
generation; dropping it lets all tracks **materialize once at load** and reopened the generator design space.
Replaced by **longer finite tracks** + an in-track difficulty arc. The `shouldSpectateOnJoin` Survival branch
and the onJoin spawn-stagger became dead-code-in-waiting. The S1 forward-pressure "chasing derezz-wall +
distance/time scoring" retired with it — Race self-pressures via the finish line (+ optional timer).

---

## PRECEDED: "deterministic track from a **seed**" → **now an opaque `TrackDescriptor`** (ADR-000/001, retired 2026-08-10)

> The seed is no longer a first-class room/track concept; it is one field inside an opaque `TrackDescriptor`
> owned by the procgen provider. The room syncs the descriptor; each end materializes the `Track` locally.

The `Track` a room holds became **physics + gameplay anchors**, materialized locally from the descriptor;
**visuals are resolved separately, client-side, never synced** (ADR-002, the 3-layer model). Live contract:
GDD §5.2 + the load-bearing-track-contract.

---

## PRECEDED: obstacle cube is **1×1 cell** → **now arbitrary block size** (ADR-007, retired 2026-08-11)

> **The world is a 4u cell grid (LOCKED 2026-08-09).** Track = **16 lanes** wide (64u, `HALF_WIDTH 32`); a
> segment is **5 z-cells** deep (`SEG_LEN 20`); an obstacle cube is **1×1 cell** (4u) and **2 cells (8u) tall** —
> **un-jumpable** (strafe around or destroy, never hop). The ship is a **~1-cell craft**.

Blocks may now be **any size** (`5.5×5.5×8u`, …). `CELL = 4u` was re-scoped to an **authoring snap grid only**;
the sim is continuous float-AABB and never reads it. Live contract: **GDD §0** + non-negotiable #11.

---

## PRECEDED: ADR-003 two-layer generator (macro grammar of beats) → **folded into ADR-006** (retired 2026-08-10)

The planned macro layer — a 1-D grammar sequencing the §5.7 mechanic vocabulary — was concretized and
**superseded** by ADR-006's fixed three-primitive arrangement envelope (the "wait for BC5 beats" gate is void).
Retired verbatim:

> **Difficulty progression → a two-layer generator (ADR-003).** *Micro layer:* the corridor-noise weave fills
> geometry via a difficulty scalar `D(i)` (ease-out trend + deterministic triangle-wave pacing — NOT `Math.sin`),
> driving corridor width / density / meander. *Macro layer (planned):* a **1-D grammar of beats** (warmup ·
> weave · jump-gauntlet · slow-slalom · fork · shrink-crescendo · set-piece) that sequences the §5.7 mechanic
> vocabulary with legality / a difficulty budget / no-repeat / teach-before-test, and which **doubles as the
> authored-level validator** (generate == validate). Materialize-once (finite tracks) makes its stateful
> generation legal. Build it *after* there are ≥2–3 beat types to sequence.

**Why moved:** ADR-006 decided the vocabulary is deliberately **three primitives** (gaps + deadly + slow), so
there is no multi-beat grammar to wait on. The `D(i)` weave-line + derived slope/curvature/MIN_LANE fairness
backbone was **kept** and reused as ADR-006's difficulty ceiling.

---

## PRECEDED: S6 procgen v2 (carved value-noise line + noise-walls) → **now ADR-006 discrete slalom/flick** (retired 2026-08-10)

The first "banks / corridor-edge" idea played as a tube and was dropped; the value-noise racing-line +
variable-width noise-walls model it produced is superseded by ADR-006's **discrete slalom + flick** micro
(short cube pillars OUTSIDE a moving corridor + a flick pillar + varied gaps). Retired verbatim:

> **AS-BUILT (procgen v2, S6 · 2026-08-10):** the generator is a **carved value-noise racing-line +
> variable-width noise-walls** model (`sim/track.ts` + new `sim/noise.ts`) — a coherent line you *thread*, with
> walls RLE-merged into **variable-width blocks** OUTSIDE a `≥ MIN_LANE` corridor (fair BY CONSTRUCTION). The
> line's slope **and curvature** are capped from the least-capable class; `D(i)` = ease-out + trig-free
> triangle-wave pacing. Blocks may now span **multiple lanes** (width variety); walls are **full-segment-depth**
> (a `BLOCK_LIMIT=128` trade — no depth variety yet). **Pickups sit on the corridor line** (`corridorCenterX`).
> Renderer + collision unchanged (`Segment`/`Block` shapes preserved).

Also retired: the earlier **IID cube-scatter** that this noise-wall model itself replaced, and the "procedural
is the PRIMARY path" claim (ADR-004 reopened procgen-vs-authored as an open choice).
