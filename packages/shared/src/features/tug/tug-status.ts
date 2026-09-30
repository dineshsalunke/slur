import type { FlightTuning } from '../../constants.js';
import type { PlayerInput } from '../../sim/input.js';
import type { SimShip } from '../../sim/types.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../../sim-config.js';

function pullOf( s: SimShip ): number {
    return Math.max( s.tugTimer, s.towTimer );
}

function strong( pull: number, cfg: SimConfig ): boolean {
    return pull > cfg.tugEaseS;
}

export function pullEase( pull: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): number {
    const e = cfg.tugEaseS > 0 ? Math.min( 1, Math.max( 0, pull / cfg.tugEaseS ) ) : 1;
    return e * e * ( 3 - 2 * e );
}

function liftedCap( pull: number, t: FlightTuning, cfg: SimConfig ): number {
    return t.maxCruise * ( 1 + cfg.tugGain * pullEase( pull, cfg ) );
}

export function tugCap( s: SimShip, t: FlightTuning, cap: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): number {
    const pull = pullOf( s );
    const lifted = pull > 0 ? Math.max( cap, liftedCap( pull, t, cfg ) ) : cap;
    return s.slowTimer > 0 ? Math.min( lifted, t.maxCruise * cfg.slowCap ) : lifted;
}

export function tugThrust(
    s: SimShip,
    input: PlayerInput,
    t: FlightTuning,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): number {
    if ( ! strong( pullOf( s ), cfg ) || s.stunTimer > 0 || input.brake > 0 || cfg.tugRiseS <= 0 ) return 0;
    return ( cfg.tugGain * t.maxCruise ) / cfg.tugRiseS;
}

export function towedInput( s: SimShip, input: PlayerInput, cfg: SimConfig = DEFAULT_SIM_CONFIG ): PlayerInput {
    if ( ! strong( s.towTimer, cfg ) ) return input;
    return { ...input, strafe: input.strafe * cfg.towStrafeScale, jump: cfg.towJump && input.jump };
}

export function reelReleased( s: SimShip, t: FlightTuning, cfg: SimConfig = DEFAULT_SIM_CONFIG ): boolean {
    if ( s.tugAnchorZ === 0 ) return false;
    return s.tugAnchorZ - ( s.z + t.halfL ) <= Math.max( 0, s.vz ) * cfg.tugReleaseS;
}

export function tickTugStatus( s: SimShip, t: FlightTuning, dt: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    if ( reelReleased( s, t, cfg ) ) {
        s.tugTimer = Math.min( s.tugTimer, cfg.tugEaseS );
        s.tugAnchorZ = 0;
    }
    if ( s.tugTimer > 0 ) s.tugTimer = Math.max( 0, s.tugTimer - dt );
    if ( s.tugTimer === 0 ) s.tugAnchorZ = 0;
    if ( s.slowTimer > 0 ) s.slowTimer = Math.max( 0, s.slowTimer - dt );
    if ( s.towTimer > 0 ) s.towTimer = Math.max( 0, s.towTimer - dt );
}

export function clearTugStatus( s: SimShip ): void {
    s.tugTimer = 0;
    s.slowTimer = 0;
    s.towTimer = 0;
    s.tugAnchorZ = 0;
}
