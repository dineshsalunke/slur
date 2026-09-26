import type { FlightTuning } from '../constants.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import type { PlayerInput } from './input.js';
import type { SimShip } from './types.js';

function liftedCap( pull: number, t: FlightTuning, cfg: SimConfig ): number {
    const ease = cfg.tugEaseS > 0 ? Math.min( 1, pull / cfg.tugEaseS ) : 1;
    return t.maxCruise * ( 1 + cfg.tugGain * ease );
}

export function tugCap( s: SimShip, t: FlightTuning, cap: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): number {
    const pull = Math.max( s.tugTimer, s.towTimer );
    const lifted = pull > 0 ? Math.max( cap, liftedCap( pull, t, cfg ) ) : cap;
    return s.slowTimer > 0 ? Math.min( lifted, t.maxCruise * cfg.slowCap ) : lifted;
}

export function towedInput( s: SimShip, input: PlayerInput, cfg: SimConfig = DEFAULT_SIM_CONFIG ): PlayerInput {
    if ( s.towTimer <= 0 ) return input;
    return { ...input, strafe: input.strafe * cfg.towStrafeScale, jump: cfg.towJump && input.jump };
}

export function reelReleased( s: SimShip, t: FlightTuning, cfg: SimConfig = DEFAULT_SIM_CONFIG ): boolean {
    if ( s.tugAnchorZ === 0 ) return false;
    return s.tugAnchorZ - ( s.z + t.halfL ) <= Math.max( 0, s.vz ) * cfg.tugReleaseS;
}

export function tickStatus( s: SimShip, t: FlightTuning, dt: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    if ( s.stunTimer > 0 ) s.stunTimer = Math.max( 0, s.stunTimer - dt );
    if ( s.boostTimer > 0 ) s.boostTimer = Math.max( 0, s.boostTimer - dt );
    if ( reelReleased( s, t, cfg ) ) {
        s.tugTimer = Math.min( s.tugTimer, cfg.tugEaseS );
        s.tugAnchorZ = 0;
    }
    if ( s.tugTimer > 0 ) s.tugTimer = Math.max( 0, s.tugTimer - dt );
    if ( s.tugTimer === 0 ) s.tugAnchorZ = 0;
    if ( s.slowTimer > 0 ) s.slowTimer = Math.max( 0, s.slowTimer - dt );
    if ( s.towTimer > 0 ) s.towTimer = Math.max( 0, s.towTimer - dt );
}

export function clearStatus( s: SimShip ): void {
    s.boostTimer = 0;
    s.tugTimer = 0;
    s.slowTimer = 0;
    s.towTimer = 0;
    s.tugAnchorZ = 0;
}
