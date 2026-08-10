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
    strafeAccel: 150, // was 120 — snappier sideways response (reaches the cap in ~0.27s)
    strafeClamp: 80, // was 200 (never actually reached) — a controllable, quickly-attained lateral top speed
    strafeDamp: 8, // was 1 (drifty) — release now bleeds sideways momentum fast, so it stops crisply
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
// gentler line. sqrt is fine — this is a ONE-TIME bound computed once at makeTrack, never per-segment (same
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
export const WEAVE_CARRIER_BUDGET = 0.7; // fraction of the slope/curvature caps the carrier may spend — the rest is headroom for the perturbation + the player's reaction margin.
export const WEAVE_NOISE_FRAC = 0.15; // amplitude share of the organic perturbation (rest = the readable carrier). Kept small so the channel stays followable.

// Carrier period [rows] so a smoothstep-rounded triangle stays under BOTH caps (× budget). For s(t)=smoothstep,
// a triangle of period P has peak |slope| = 1.5·(2/P)·amp and peak |curv| = 6·(2/P)²·amp. Solve each ≤ cap·budget
// and take the larger P (curvature usually binds). Bigger P = gentler, slower sweep. One-time (sqrt allowed).
export function deriveWeavePeriod( slopeCap: number, curvCap: number, amp: number, budget: number ): number {
    const pSlope = ( 3 * amp ) / ( slopeCap * budget );
    const pCurv = Math.sqrt( ( 24 * amp ) / ( curvCap * budget ) );
    return Math.ceil( Math.max( pSlope, pCurv ) );
}

// Corridor width curve [lanes]: wide (easy) → narrow (hard) as D:0→1. Integer lanes; never below the fairness
// floor (2 lanes = MIN_LANE = 8u). This is THE difficulty dial for lateral pressure.
export const CORRIDOR_W_START = 5; // open lanes at D = 0 (was 8 — too roomy; the start played as a cakewalk). The moving carrier + this width read as a clear channel, not an open field.
export const CORRIDOR_W_MIN = 2; // open lanes at D = 1 — the MIN_LANE floor; the generator clamps here, never lower.

// Wall field: a non-corridor cell becomes a wall when coherent value-noise(lane, z) < density(D). Low
// frequencies → contiguous runs (RLE-merged into wide blocks = the width-variety goal), not scatter.
export const WALL_DENSITY_START = 0.5; // fill fraction of the wall zone at D = 0 (was 0.35 — walls were too sparse, so the open band drifted far past the corridor; denser walls frame the channel).
export const WALL_DENSITY_MAX = 0.72; // …at D = 1. Denser ⇒ more CONTIGUOUS ⇒ RLE-merges into FEWER, wider blocks, so the renderer's BLOCK_LIMIT budget is unaffected (verified by the block-count test).
export const WALL_NOISE_FZ_LANE = 4.5; // value-noise period across LANES → typical wall-run width (wider = fewer, fatter blocks → renderer budget).
export const WALL_NOISE_FZ_SEG = 2.6; // value-noise period across SEGMENTS → walls persist/flow forward, not per-seg flicker.

// Difficulty D(i) ∈ [0,1]: smoothstep ease-out to a cap (Race) + a triangle-wave pacing swing (tension/release).
// Survival's unbounded growth is DEFERRED to S7 (no `mode` field yet — parent decision Q2).
export const D_RAMP_SEGMENTS = 35; // segments after START_SAFE to reach the ease-out cap (was 90 — near-peak only ~1500u in, so the first third played easy). Faster ramp = the track bites sooner.
export const D_EASE_CAP = 0.85; // Race tops out here (< 1 leaves headroom for S7 Survival to grow into).
export const D_PACE_AMP = 0.15; // ± difficulty swing added by the pacing wave.
export const D_PACE_WAVELENGTH = 24; // segments per tension→release cycle.

// Gaps (jump punctuation) stay orthogonal to the weave: sparse, ≤ one segment, never two in a row, never in
// start-safe. Probability rises slightly with D. GAP-REACH is already asserted per class in the track test.
export const GAP_P_START = 0.08; // P(gap) at D = 0 (was 0.05 — jumps too rare to punctuate).
export const GAP_P_MAX = 0.18; // P(gap) at D = 1.

// ── Drag blocks (amber) — the non-lethal hazard. A fraction of the wall field is PASSABLE-but-slow instead
// of lethal: fly through and your top speed is clamped while inside (a time cost, not a death). Lethal (red)
// walls still enforce the corridor + do the S5 stun-killing; drag adds a risk/reward line choice (cut through
// a drag patch to straighten a tight line, eat the slowdown). Drag is allowed ON the racing line; lethal is not.
export const DRAG_FRAC = 0.3; // fraction of wall blocks that are drag (amber) rather than lethal (red).
export const DRAG_NOISE_FZ_LANE = 3.2; // value-noise period across LANES for the lethal/drag classification (coherent runs, not per-cell speckle).
export const DRAG_NOISE_FZ_SEG = 3.0; // …across SEGMENTS, so a drag patch persists a little forward.
export const DRAG_SPEED_FRAC = 0.5; // while inside a drag block, vz is clamped to this × the ship's maxCruise (per-class fair). Lower = harsher slow.
