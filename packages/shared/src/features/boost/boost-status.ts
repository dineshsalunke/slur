import type { FlightTuning } from '../../constants.js';
import type { PlayerInput } from '../../sim/input.js';
import type { SimShip } from '../../sim/types.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../../sim-config.js';

export function startBoost( ship: { boostTimer: number }, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    ship.boostTimer = cfg.boostS;
}

export function boostCap(
    s: SimShip,
    t: FlightTuning,
    cap = t.maxCruise,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): number {
    if ( s.boostTimer <= 0 ) return cap;
    const ease = cfg.boostEaseS > 0 ? Math.min( 1, s.boostTimer / cfg.boostEaseS ) : 1;
    return cap * ( 1 + cfg.boostGain * ease );
}

export function boostThrust(
    s: SimShip,
    input: PlayerInput,
    t: FlightTuning,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
): number {
    if ( s.boostTimer <= 0 || s.stunTimer > 0 || input.brake > 0 || cfg.boostRiseS <= 0 ) return 0;
    return ( cfg.boostGain * t.maxCruise ) / cfg.boostRiseS;
}

export function tickBoostStatus( s: SimShip, _t: FlightTuning, dt: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    if ( s.boostTimer > 0 ) s.boostTimer = Math.max( 0, s.boostTimer - dt );
    if ( s.boostTimer > 0 ) s.glideTimer = s.boostTimer + cfg.boostGlideS;
    else if ( s.glideTimer > 0 ) s.glideTimer = Math.max( 0, s.glideTimer - dt );
}

export function clearBoostStatus( s: SimShip ): void {
    s.boostTimer = 0;
    s.glideTimer = 0;
}
