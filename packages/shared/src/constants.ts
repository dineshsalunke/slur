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
export const COLOR_COUNT = 8; // team-colour palette size (colorId ∈ [0, COLOR_COUNT)); the hexes live client-side.
export const START_STAGGER = CELL; // lateral spacing (u) between racers on the start line (feel-gate tweakable).
