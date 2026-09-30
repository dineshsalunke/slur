import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import type { SimShip } from './types.js';

export function tickStatus( s: SimShip, dt: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): void {
    if ( s.stunTimer > 0 ) s.stunTimer = Math.max( 0, s.stunTimer - dt );
    if ( s.boostTimer > 0 ) s.boostTimer = Math.max( 0, s.boostTimer - dt );
    if ( s.boostTimer > 0 ) s.glideTimer = s.boostTimer + cfg.boostGlideS;
    else if ( s.glideTimer > 0 ) s.glideTimer = Math.max( 0, s.glideTimer - dt );
}

export function clearStatus( s: SimShip ): void {
    s.boostTimer = 0;
    s.glideTimer = 0;
}
