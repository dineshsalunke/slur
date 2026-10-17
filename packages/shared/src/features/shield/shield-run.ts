import type { HitMessage } from '../../combat/constants.js';
import type { FireDir } from '../../combat/fire-dir.js';
import type { Broadcast } from '../../run/combat.js';
import type { PlayerState } from '../../schema.js';
import type { RunContext } from '../define-sim-feature.js';
import { SHIELD_POP_MESSAGE } from './shield-constants.js';
import { absorbHit, dropShield, raiseShield, stepShield } from './shield-status.js';

export function fireShield(
    ctx: RunContext,
    _run: undefined,
    p: PlayerState,
    _ownerId: string,
    _slot: number,
    _dir: FireDir,
): boolean {
    ctx.nextId();
    raiseShield( p, ctx.config.shieldS );
    return true;
}

export function wardShields( ctx: RunContext, _run: undefined, dt: number ): void {
    ctx.state.players.forEach( ( p ) => {
        if ( p.dead ) dropShield( p );
        else stepShield( p, dt );
    } );
}

export function resetShields( ctx: RunContext, _run: undefined ): void {
    ctx.state.players.forEach( dropShield );
}

export function shieldAbsorbs( v: PlayerState, at: HitMessage, broadcast: Broadcast ): boolean {
    if ( ! absorbHit( v ) ) return false;
    broadcast( SHIELD_POP_MESSAGE, at );
    return true;
}
