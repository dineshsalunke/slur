// Flight-feel tuning + fixed-step constants. Framework-free: no @colyseus/schema here.

export const TICK_RATE = 60;
export const FIXED_DT = 1 / TICK_RATE;

// World authoring grid. Track width, segment depth, obstacle cubes, and ship footprints are all sized as
// multiples of CELL. Movement stays CONTINUOUS — cells are an authoring unit, NOT a lateral movement snap
// (the cuberun contract: grid-placed obstacles, free-flying ship).
export const CELL = 4;

export interface FlightTuning {
    // ── Forward speed — throttle (W/↑), brake (S/↓) ──
    accel: number; // throttle acceleration (u/s²): how fast W ramps you toward maxCruise. Higher = punchier launch.
    brakeDecel: number; // brake deceleration (u/s²): how hard S slows you. Higher = sharper stops.
    coastDrag: number; // passive decel when neither throttle nor brake is held (u/s²). Higher = coasts to a stop sooner; 0 = frictionless glide.
    maxCruise: number; // top forward speed (u/s) — the throttle speed cap. (Boost is a pickup, not a base stat — S5.)

    // ── Lateral strafe — A/D — "drifty" ──
    strafeAccel: number; // sideways acceleration per unit of strafe input (u/s²). Higher = quicker sideways response.
    strafeClamp: number; // max lateral speed (u/s). Caps how fast you can slide sideways.
    strafeDamp: number; // lateral-velocity decay when strafe is released (per second). LOW = drifty (momentum carries); HIGH = snappy (stops quickly).
    halfWidth: number; // corridor half-width (units): invisible side walls clamp x to ±this. S1 stand-in; S3 uses the real track.

    // ── Ship footprint — AABB half-extents (world units). PER-CLASS (see ship-classes.ts). Collision is
    //    width×length only (height is cosmetic); hazards are Minkowski-inflated by these vs point-sampled. ──
    halfW: number; // half-width  (x): lateral half-extent of the hull box → wing-clip death + edge clamp.
    halfL: number; // half-length (z): forward half-extent → later takeoff / earlier landing across gaps.

    // ── Jump — DERIVED from DEFAULT_JUMP via deriveJump(). Tune the JumpDesign below, NOT these. ──
    riseGravity: number; // downward accel while ascending (u/s²). From height + apexTime.
    fallGravity: number; // downward accel while descending (u/s²); > riseGravity = snappier fall. From height + descentTime.
    jumpImpulse: number; // initial upward velocity of a jump (u/s). From height + apexTime.
    doubleJumpImpulse: number; // upward velocity of the air (double) jump (u/s). From doubleHeight + apexTime.
    minJumpVel: number; // upward-velocity cap applied on early release → the shortest tap hop. From minHeight.

    // ── Jump feel — tune directly ──
    maxJumps: number; // total jumps before landing. 2 = double jump · 1 = single · 3 = triple.
    coyoteTime: number; // grace window (s) after leaving a ledge where a jump still counts. Higher = more forgiving.
    jumpBuffer: number; // window (s) before landing where an early jump press still fires on touchdown. Higher = more forgiving.

    // ── S3 collision / death / respawn (all in world units + seconds) ──
    deathY: number; // fall-through kill plane: y below this = fell through a gap → death. MUST be under the lowest floor (0) with margin.
    stepTol: number; // landing snap tolerance (units): you land on a floor/ledge when within this of it — also caps how high a ledge you can "step up" onto without clipping through.
    respawnDelay: number; // seconds derezzed before you respawn (the time-loss stake).
    invulnTime: number; // seconds of block-immunity right after respawn so you don't instantly re-die on the same hazard (falling still kills).
    respawnSetback: number; // world-z you're pushed BACK from the last safe point on respawn — re-approach the hazard, don't teleport past it.
    respawnVz: number; // forward speed (u/s) you respawn with (a fraction of cruise) so you're not dead-stopped.
}

// Jump authored by feel, physics derived — GDC "Building a Better Jump" (Pittman).
// h = ½·g·t²  ⇒  g = 2h/t² , v0 = 2h/t.
export interface JumpDesign {
    height: number; // full-jump peak (world units)
    apexTime: number; // seconds up to the peak (float)
    descentTime: number; // seconds down to ground (< apexTime = snappy fall)
    doubleHeight: number; // air-jump peak (units)
    minHeight: number; // shortest tap hop (units)
}

export function deriveJump( d: JumpDesign ) {
    const riseGravity = ( 2 * d.height ) / ( d.apexTime * d.apexTime );
    return {
        riseGravity,
        fallGravity: ( 2 * d.height ) / ( d.descentTime * d.descentTime ),
        jumpImpulse: ( 2 * d.height ) / d.apexTime,
        doubleJumpImpulse: ( 2 * d.doubleHeight ) / d.apexTime,
        minJumpVel: Math.sqrt( 2 * riseGravity * d.minHeight ), // early-release cap → ~minHeight
    };
}

// THE intuitive jump-tuning surface — edit these (units + seconds), not gravity numbers.
export const DEFAULT_JUMP: JumpDesign = {
    height: 3.2, // was 2.4 — more air. NB: same-tick gravity in simulate() costs ~10%, so actual peak ≈2.9u.
    apexTime: 0.3, // was 0.34 — shorter rise → punchier, more responsive launch (jumpImpulse ~14 → ~21) with less hang.
    descentTime: 0.24, // was 0.26 — snappy fall (< apexTime); the higher fallGravity kills the floaty hang time.
    doubleHeight: 3.8, // was 3.0 — scaled up with the taller primary so the air jump still reads as a real boost.
    minHeight: 0.8, // shortest tap hop. MUST stay < height so minJumpVel < jumpImpulse → variable jump works: tap ≈ 0.8u hop, hold = full height.
};

// Starting values — tuned live in playtest. Do NOT tune here to "feel"; that is the human gate.
// This is the BASELINE / Fighter preset. Ship classes (S6) supply a per-class FlightTuning that
// simulate() receives as its `t` argument — per-ship flight is a data swap, not a code change.
export const DEFAULT_TUNING: FlightTuning = {
    accel: 40,
    brakeDecel: 110,
    coastDrag: 40,
    maxCruise: 55,
    strafeAccel: 165, // Fighter baseline. Raised 150→165: snappier onset so a flick reaches speed almost instantly.
    strafeClamp: 80, // controllable lateral top speed (UNCHANGED → SLOPE_CAP unchanged, so track fairness is untouched)
    strafeDamp: 14, // raised 8→14: release bleeds lateral momentum FAST → a tap-strafe settles crisply (the "continuous-but-discrete" flick feel), not a drift
    halfWidth: 32, // was 16 — track widened to 16 lanes (64u) on the 4u cell grid (see track.ts HALF_WIDTH).
    halfW: 1.3, // Fighter footprint (challenger model box): 2.6u wide = 0.65 cell.
    halfL: 1.26, // Fighter footprint: 2.52u long = 0.63 cell.
    ...deriveJump( DEFAULT_JUMP ),
    maxJumps: 2,
    coyoteTime: 0.1,
    jumpBuffer: 0.1,
    deathY: -6, // floors sit at y>=0; -6 gives a clear fall before death registers
    stepTol: 0.3,
    respawnDelay: 1, // 1s dead — a real setback, not a game-over
    invulnTime: 1.5,
    respawnSetback: 12, // ~half a segment behind the last safe ground
    respawnVz: 20, // ~36% of maxCruise — moving, but you lost your speed
};

// Fraction of the theoretical jump reach the fairness bound may use — headroom so gaps clear with margin,
// not frame-perfect. Difficulty knob (lower = easier).
export const JUMP_SAFETY = 0.8;

// ── Jump reach (per-class track-fairness input) ──
// A gap is one segment long; with the AABB "generous grounded" rule the airborne z-distance a ship must
// cover to cross it is SEG_LEN − 2·halfL (it takes off later and lands earlier the longer it is). The track
// is gap-fair iff EVERY class's jumpReach() ≥ that distance — asserted per class (floored to the
// least-capable class, since one shared server track must be passable by all). DERIVED from the jump feel +
// top speed, so tuning either auto-retunes fairness (difficulty is a config edit, not a code change).
//
// sqrt is fine HERE — this is a one-time bound. track.ts generation stays sqrt-free for cross-engine
// determinism. jumpAirtime reconstructs apex+descent from the derived jump fields (tUp = apexTime,
// tDown = descentTime), so jumpReach(DEFAULT_TUNING) equals the old MAX_GAP exactly.
export function jumpAirtime( t: FlightTuning ): number {
    const tUp = t.jumpImpulse / t.riseGravity; // rise time  = apexTime
    const tDown = t.jumpImpulse / Math.sqrt( t.riseGravity * t.fallGravity ); // fall time = descentTime
    return tUp + tDown;
}
export function jumpReach( t: FlightTuning ): number {
    return t.maxCruise * jumpAirtime( t ) * JUMP_SAFETY;
}

// ── S4 session/race lifecycle (seconds; framework-free, read by the server room + client overlays) ──
export const COUNTDOWN_SECONDS = 3; // "3-2-1" prep after host GO; ships + picks frozen, NO sim motion yet.
export const RACE_GRACE_SECONDS = 20; // after the FIRST finisher, everyone else has this long before results.
export const MAX_RACE_SECONDS = 180; // hard safety cap: a race with no finisher at all still ends (→ all DNF).
// Team-colour palette size (colorId ∈ [0, COLOR_COUNT)); the hexes live client-side. 12 so a full room (the
// GDD's 12-player max) can be all-distinct. colors.ts carries a compile-time guard that fails the build if
// the client palette length ever drifts from this.
export const COLOR_COUNT = 12;
export const START_STAGGER = CELL; // lateral spacing (u) between racers on the start line (feel-gate tweakable).

// ── S6 procgen v2 — coherent carved racing-line + variable-width noise walls ──────────────────────────
// Design + derivations: .claude/phases/2026-08-10-procgen-weave-width. The generator (track.ts) carves a
// value-noise "racing line" the player threads, walls the space OUTSIDE a corridor around it, and RLE-merges
// contiguous wall lanes into variable-width blocks — fair BY CONSTRUCTION (the corridor is never walled).
// EVERY field here is an intuitive, unit-carrying tuning surface ([[intuitive-tuning-surfaces]]); the derived
// caps below are FUNCTIONS of the ship roster, not hand-picked numbers.

// Headroom factors: the weave never demands more than this fraction of the LEAST-capable ship's ability
// (like JUMP_SAFETY). Lower = easier / more margin.
export const WEAVE_SLOPE_SAFETY = 0.8; // caps the racing-line SLOPE below (strafeClamp / maxCruise) — top lateral speed.
export const WEAVE_CURV_SAFETY = 0.8; // caps the racing-line CURVATURE below the strafeAccel-limited REVERSAL rate.
export const NODE_PERIOD_SAFETY = 1.1; // extra margin on the derived noise node period (rows): slower, safer weave.

// Worst-case 2-octave fBm (amplitudes 1 + ½) normalized derivative factors for smoothstep value-noise:
//   peak |ds/dt|  = 1.5 → summed-octave slope factor     = 2   (both octaves peaking together, Δnode = 1)
//   peak |d²s/dt²| = 6  → summed-octave curvature factor  = 12
// These are pessimistic (the octaves never actually peak in phase), so the runtime weave sits well inside caps.
export const WEAVE_SLOPE_OCTAVE_FACTOR = 2;
export const WEAVE_CURV_OCTAVE_FACTOR = 12;

// Racing-line slope cap [lanes/row]: to hold a 1-lane offset while advancing 1 row a ship needs
// lateral_speed / forward_speed ≥ 1, i.e. strafeClamp / maxCruise ≥ 1. Floor to the least-capable weaver.
export function deriveWeaveSlopeCap( tunings: FlightTuning[] ): number {
    let m = Number.POSITIVE_INFINITY;
    for ( const t of tunings ) m = Math.min( m, t.strafeClamp / t.maxCruise );
    return m * WEAVE_SLOPE_SAFETY;
}
// Racing-line curvature cap [Δ(lanes/row) per row]: a zig-zag also demands fast lateral REVERSAL, bounded by
// strafeAccel. Per row (dt = cell/vz) the reachable slope change is strafeAccel·cell / maxCruise². The
// slope cap alone is INSUFFICIENT (a tight oscillation inside it is still un-threadable) — this is the real
// "harder-but-fair" lever. Floor to the least-capable class.
export function deriveWeaveCurvatureCap( tunings: FlightTuning[], cell: number ): number {
    let m = Number.POSITIVE_INFINITY;
    for ( const t of tunings ) m = Math.min( m, ( t.strafeAccel * cell ) / ( t.maxCruise * t.maxCruise ) );
    return m * WEAVE_CURV_SAFETY;
}
// Noise node period [rows]: the larger of the slope- and curvature-safe periods (× safety). Bigger period =
// gentler line. sqrt is fine — this is a ONE-TIME bound computed once at module load, never per-segment (same
// rule as jumpReach). `amp` = the max racing-line amplitude in lanes (see WEAVE_AMP_LANES in track.ts).
export function deriveNodePeriod( slopeCap: number, curvCap: number, amp: number ): number {
    const slopeReq = ( amp * WEAVE_SLOPE_OCTAVE_FACTOR ) / slopeCap;
    const curvReq = Math.sqrt( ( amp * WEAVE_CURV_OCTAVE_FACTOR ) / curvCap );
    return Math.ceil( Math.max( slopeReq, curvReq ) * NODE_PERIOD_SAFETY );
}

// ── Racing-line carrier (S6.1 challenge pass) ──────────────────────────────────────────────────────────
// The old line was pure fBm: threadable but MOSTLY FLAT (measured: it used ~10% of its slope budget → the
// weave read as a static maze, not a race). The new line is a ROUNDED-TRIANGLE carrier: near-constant slope
// down each leg → you strafe continuously (that IS the challenge), with smoothstep-rounded apexes so the
// reversal respects the curvature cap (a SHARP triangle apex would blow it). A small fBm perturbation keeps
// apex positions organic (not metronomic). Both terms are trig-free (tri + smoothstep + value-noise).
export const WEAVE_CARRIER_BUDGET = 0.88; // fraction of the slope/curvature caps the carrier may spend. Higher → SHORTER period → more frequent, more EVEN L-R strafing (fewer long straights) — still < 1 so it stays under the fairness caps (which already bake in the 0.8 safety).
export const WEAVE_NOISE_FRAC = 0.08; // amplitude share of the organic perturbation (rest = the readable carrier). Reduced 0.15→0.08 for a MORE REGULAR, predictable weave rhythm (the random wiggle was making it flat here / tight there).

// Carrier period [rows] so a smoothstep-rounded triangle stays under BOTH caps (× budget). For s(t)=smoothstep,
// a triangle of period P has peak |slope| = 1.5·(2/P)·amp and peak |curv| = 6·(2/P)²·amp. Solve each ≤ cap·budget
// and take the larger P (curvature usually binds). Bigger P = gentler, slower sweep. One-time (sqrt allowed).
export function deriveWeavePeriod( slopeCap: number, curvCap: number, amp: number, budget: number ): number {
    const pSlope = ( 3 * amp ) / ( slopeCap * budget );
    const pCurv = Math.sqrt( ( 24 * amp ) / ( curvCap * budget ) );
    return Math.ceil( Math.max( pSlope, pCurv ) );
}

// ── ADR-006 — rhythm-paced generation: arrangement envelope + BANKS model ───────────────────────────────
// Replaces the S6 monotonic D(i) (ease-out + triangle) with a "Believer" SECTION envelope, and the noise-wall
// field with the BANKS model (deadly = SOLID corridor edges; slow = grace-notes INSIDE the line). Every field
// is an intuitive, unit-carrying tuning surface ([[intuitive-tuning-surfaces]]); tune live. See
// `.claude/phases/2026-08-10-rhythm-paced-generation.md`.

// Corridor width curve [lanes]: the SAFE band around the weave, wide (breather) → tighter (peak) as
// intensity 0→1. Kept ROOMY (never a claustrophobic slot) — peak difficulty comes from block DENSITY + weave
// speed + gaps, NOT from pinching a tube. Clamped ≥ MIN_LANE.
export const CORRIDOR_W_START = 5; // open safe lanes at intensity 0 — narrow enough that tracking the WEAVING line requires real strafing (a wide corridor let you drift straight).
export const CORRIDOR_W_MIN = 4; // open safe lanes at intensity 1 — roomy enough that a steep weave here isn't an irritating pinch; strafing frequency (weave period) carries the peak difficulty, not a tight slot.

// Deadly blocks OUTSIDE the corridor are DISCRETE — a lane becomes a block where coherent value-noise(lane, z)
// clears the density; holes between them leave dodge-space (NOT a solid bank), so you SLALOM around sparse
// obstacles. Density rises with intensity; block width is capped so no single slab fills the view.
export const WALL_DENSITY_START = 0.14; // P(pillar) per off-corridor lane at intensity 0 — sparse (occasional pillar to dodge).
export const WALL_DENSITY_MAX = 0.4; // …at intensity 1 — busier, but ISOLATED pillars (never a wall). Crank up once the feel is right.
export const WALL_NOISE_FZ_LANE = 1.0; // period across LANES = 1 → adjacent lanes UNCORRELATED → discrete 1-lane pillars (NOT clumped walls). THE anti-wall knob.
export const WALL_NOISE_FZ_SEG = 1.5; // period across SEGMENTS → a pillar persists ~1–2 segments deep (a column you pass), not per-seg flicker.
export const BLOCK_MAX_LANES = 3; // cap a merged block's width (lanes) so no giant wall-slab fills the view (rarely binds now that lanes are discrete).
export const CORRIDOR_BUFFER = 1; // clear lanes kept EMPTY on each side of the safe corridor — no pillar may crowd the edge, so the threadable path always has margin (kills "frame-perfect / unreasonable" tight convergences).

// FLICK pillars: on some segments a pillar intrudes from ONE edge of the safe corridor, forcing a quick
// SIDESTEP — the "flick". A flick is a DISCRETE dodge (NOT curvature-limited like the smooth weave), so it can
// be sharp and frequent — this is what makes you actively strafe around blocks instead of just tracking a line.
// It alternates sides and never fires two segments in a row (a clear segment to recover → stays reachable/fair).
export const FLICK_RATE_START = 0.15; // P(flick) per corridor segment at intensity 0.
export const FLICK_RATE_MAX = 0.55; // …at intensity 1 (with no-two-in-a-row ≈ every other segment).
export const FLICK_WIDTH = 1; // lanes the flick pillar occupies inside the corridor — a 1-lane pillar = a crisp small sidestep that leaves plenty of open room (2 was pinch-y).

// Slow grace-notes: inside the corridor, an occasional SMALL passable drag block — the eat-or-dodge decision
// ON the line. Kept sparse so it reads as a note, never a wall. Rises with intensity.
export const SLOW_GRACE_START = 0.05; // P(slow) at intensity 0.
export const SLOW_GRACE_MAX = 0.13; // P(slow) at intensity 1.
export const SLOW_NOISE_FZ_LANE = 3.2; // value-noise period across LANES → slow patches cluster, not per-cell speckle.
export const SLOW_NOISE_FZ_SEG = 3.0; // …across SEGMENTS → a slow patch persists a little forward.

// The difficulty ARRANGEMENT — a "Believer" (Imagine Dragons) staircase of escalating waves. Each section has
// a relative `weight` (length, normalized across the table to the post-START_SAFE track) and an intensity ramp
// `i0→i1` (smoothstepped within the section; i1<i0 = a decrescendo, e.g. the outro). Intensity drives corridor
// width, weave amplitude/frequency, and slow-grace density. HIDDEN pacing scaffold — the surface stays
// continuous, never a rhythm game. Tune the whole feel of a run by editing this table.
export interface Section {
    name: string;
    weight: number;
    i0: number;
    i1: number;
}
export const SECTIONS: Section[] = [
    { name: 'intro', weight: 5, i0: 0.5, i1: 0.55 }, // the hook — establishes, moderate
    { name: 'verse1', weight: 7, i0: 0.26, i1: 0.32 }, // pared-back / tense breather
    { name: 'verse2', weight: 7, i0: 0.3, i1: 0.36 },
    { name: 'prechor1', weight: 5, i0: 0.4, i1: 0.66 }, // build → drop
    { name: 'chorus1', weight: 7, i0: 0.8, i1: 0.82 }, // SLAM
    { name: 'chorus2', weight: 6, i0: 0.82, i1: 0.8 },
    { name: 'verse3', weight: 6, i0: 0.38, i1: 0.44 }, // pull back, floor risen
    { name: 'verse4', weight: 5, i0: 0.42, i1: 0.48 },
    { name: 'prechor2', weight: 5, i0: 0.52, i1: 0.74 },
    { name: 'chorus3', weight: 6, i0: 0.88, i1: 0.9 }, // bigger
    { name: 'chorus4', weight: 6, i0: 0.9, i1: 0.88 },
    { name: 'bridge', weight: 8, i0: 0.18, i1: 0.28 }, // BREAKDOWN valley (Slice 2 makes it jump-heavy)
    { name: 'finalcho', weight: 10, i0: 0.96, i1: 1.0 }, // biggest
    { name: 'outro', weight: 7, i0: 0.6, i1: 0.06 }, // ease to a plain finish
];

// Gaps (jump punctuation): sparse, ≤ one segment, never two in a row, never in start-safe; probability rises
// with intensity. FULL-WIDTH in Slice 1 (Slice 2 = positional strips + section-char density). GAP-REACH per
// class is asserted in the track test.
export const GAP_P_START = 0.06; // P(gap) at intensity 0.
export const GAP_P_MAX = 0.16; // P(gap) at intensity 1.
export const FULL_GAP_FRAC = 0.4; // fraction of gaps that are FULL-WIDTH (must jump). The rest are PARTIAL — a floor strip at the weave line + a hole to the side (strafe across, or jump) → gaps of different widths/positions.

// While inside a drag (slow) block, vz is clamped to this × the ship's maxCruise (per-class fair). Lower = harsher.
export const DRAG_SPEED_FRAC = 0.5;
