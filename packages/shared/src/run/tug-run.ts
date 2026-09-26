import { spendPower } from '../combat/combat-step.js';
import type { FireDir } from '../combat/fire-dir.js';
import { seekerShipsOf } from '../combat/seeker.js';
import { catapult, reel, slowTarget, type TugEvent, towTarget, tugTarget } from '../combat/tug.js';
import { TUG_MESSAGE } from '../combat/tug-constants.js';
import type { PlayerState } from '../schema.js';
import { type FireContext, shieldAbsorbs } from './combat.js';

export function fireTug( ctx: FireContext, p: PlayerState, ownerId: string, slot: number, dir: FireDir ): boolean {
    const ships = seekerShipsOf( ctx.state.players.entries() );
    const target = tugTarget( p, ownerId, ships, ctx.track, ctx.broken, ctx.config, dir );
    if ( target === null ) return false;
    if ( target.kind === 'block' ) {
        spendPower( p, slot );
        reel( p, target.z, ctx.config );
        ctx.broadcast( TUG_MESSAGE, tugEvent( 'anchor', ownerId, '', dir, target.x, p.y, target.z ) );
        return true;
    }
    const v = ctx.state.players.get( target.id );
    if ( v === undefined ) return false;
    spendPower( p, slot );
    if ( dir > 0 ) catapult( p, ctx.config );
    if ( ! shieldAbsorbs( v, { x: v.x, y: v.y, z: v.z, victimId: target.id }, ctx.broadcast ) ) {
        if ( dir > 0 ) slowTarget( v, ctx.config );
        else towTarget( v, ctx.config );
    }
    ctx.broadcast( TUG_MESSAGE, tugEvent( 'latch', ownerId, target.id, dir, v.x, v.y, v.z ) );
    return true;
}

function tugEvent(
    outcome: TugEvent[ 'outcome' ],
    ownerId: string,
    targetId: string,
    dir: number,
    x: number,
    y: number,
    z: number,
): TugEvent {
    return { outcome, ownerId, targetId, dir, x, y, z };
}
