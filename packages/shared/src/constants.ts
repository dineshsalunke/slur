// Flight-feel tuning + fixed-step constants. Framework-free: no @colyseus/schema here.

export const TICK_RATE = 60;
export const FIXED_DT = 1 / TICK_RATE;

export interface FlightTuning {
    // ── Forward speed — throttle (W/↑), brake (S/↓) ──
    accel: number; // throttle acceleration (u/s²): how fast W ramps you toward maxCruise. Higher = punchier launch.
    brakeDecel: number; // brake deceleration (u/s²): how hard S slows you. Higher = sharper stops.
    coastDrag: number; // passive decel when neither throttle nor brake is held (u/s²). Higher = coasts to a stop sooner; 0 = frictionless glide.
    maxCruise: number; // normal top forward speed (u/s) without boost — the un-boosted speed cap.

    // ── Boost — Shift, spends energy ──
    boostMul: number; // top-speed multiplier while boosting (cap = maxCruise × this). Higher = faster boost ceiling.
    boostAccel: number; // extra forward accel while boosting (u/s²). Higher = snappier boost kick.
    energyMax: number; // boost-energy capacity (and the value it refills back up to).
    energyDrain: number; // energy spent per second while boosting. Higher = shorter boosts.
    energyRegen: number; // energy recovered per second when NOT boosting. Higher = recharges sooner.

    // ── Lateral strafe — A/D — "drifty" ──
    strafeAccel: number; // sideways acceleration per unit of strafe input (u/s²). Higher = quicker sideways response.
    strafeClamp: number; // max lateral speed (u/s). Caps how fast you can slide sideways.
    strafeDamp: number; // lateral-velocity decay when strafe is released (per second). LOW = drifty (momentum carries); HIGH = snappy (stops quickly).
    halfWidth: number; // corridor half-width (units): invisible side walls clamp x to ±this. S1 stand-in; S3 uses the real track.

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
    height: 2.4, // was 1 — a hop that clears the ship + tall platforms. MAX_STEP auto-rises to 2.4×0.8=1.92.
    apexTime: 0.34, // was 0.42 — faster rise → punchier launch (jumpImpulse ~4.8 → ~14) and less hang.
    descentTime: 0.26, // was 0.3 — snappy fall (< apexTime); the higher fallGravity kills the floaty hang time.
    doubleHeight: 3.0, // was 4.5 — a controlled second jump, not a huge boost.
    minHeight: 0.8, // was 1.5 — BUG: minHeight > height made minJumpVel > jumpImpulse, so early-release never fired (every jump = max height, no tap control). Now < height → variable jump works: tap ≈ 0.8u hop, hold = full 2.4.
};

// Starting values — tuned live in playtest. Do NOT tune here to "feel"; that is the human gate.
export const DEFAULT_TUNING: FlightTuning = {
    accel: 40,
    brakeDecel: 110,
    coastDrag: 40,
    maxCruise: 55,
    boostMul: 1.6,
    boostAccel: 50,
    energyMax: 100,
    energyDrain: 45,
    energyRegen: 22,
    strafeAccel: 300, // was 120 — snappier sideways response (reaches the cap in ~0.27s)
    strafeClamp: 80, // was 200 (never actually reached) — a controllable, quickly-attained lateral top speed
    strafeDamp: 8, // was 1 (drifty) — release now bleeds sideways momentum fast, so it stops crisply
    halfWidth: 16,
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

// Fraction of the theoretical jump reach the generator may use when sizing a hazard — leaves headroom
// so hazards clear with margin, not frame-perfect. Difficulty knob (lower = easier).
const JUMP_SAFETY = 0.8;

// ── Derived hazard limits (track generator fairness) ──
// The generator NEVER emits a gap wider than a jump can cross or a step taller than a jump can reach.
// DERIVED from the jump feel (DEFAULT_JUMP) + top speed, so tuning the jump auto-retunes the track's
// fairness — difficulty is a config edit, not a code change (project convention).
//
// MAX_GAP: horizontal z-distance covered while airborne over one jump arc (apex + descent) at cruise
//   speed, × safety. A gap segment's z-length (SEG_LEN) must be ≤ this so a well-timed jump clears it.
// MAX_STEP: peak rise of a single ground jump (design height), × safety. A height-step's rise must be
//   ≤ this so you can jump onto it from below.
export const MAX_GAP = DEFAULT_TUNING.maxCruise * ( DEFAULT_JUMP.apexTime + DEFAULT_JUMP.descentTime ) * JUMP_SAFETY;
export const MAX_STEP = DEFAULT_JUMP.height * JUMP_SAFETY;
