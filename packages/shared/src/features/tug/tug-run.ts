import type { FireDir } from '../../combat/fire-dir.js';
import { seekerShipsOf } from '../../combat/seeker.js';
import type { PlayerState } from '../../schema.js';
import type { RunContext } from '../define-sim-feature.js';
import { catapult, reel, slowTarget, type TugEvent, throwSeconds, towTarget, tugTarget } from './tug.js';
import { TUG_MESSAGE } from './tug-constants.js';

export interface TugThrow {
    ownerId: string;
    targetId: string;
    blockId: number;
    dir: FireDir;
    x: number;
    z: number;
    left: number;
}

const LATCH_EPS = 1e-6;

export function fireTug(
    ctx: RunContext,
    throws: TugThrow[],
    p: PlayerState,
    ownerId: string,
    _slot: number,
    dir: FireDir,
): boolean {
    const ships = seekerShipsOf( ctx.state.players.entries() );
    const target = tugTarget( p, ownerId, ships, ctx.track, ctx.broken, ctx.config, dir );
    if ( target === null ) return false;
    if ( target.kind === 'block' ) {
        const s = throwSeconds( target.z - p.z, ctx.config.tugBlockMax, ctx.config );
        throws.push( { ownerId, targetId: '', blockId: target.id, dir, x: target.x, z: target.z, left: s } );
        ctx.broadcast( TUG_MESSAGE, tugEvent( 'throw', ownerId, '', dir, target.x, p.y, target.z, s ) );
        return true;
    }
    const v = ctx.state.players.get( target.id );
    if ( v === undefined ) return false;
    const s = throwSeconds( Math.hypot( v.x - p.x, v.z - p.z ), ctx.config.tugRange, ctx.config );
    throws.push( { ownerId, targetId: target.id, blockId: -1, dir, x: v.x, z: v.z, left: s } );
    ctx.broadcast( TUG_MESSAGE, tugEvent( 'throw', ownerId, target.id, dir, v.x, v.y, v.z, s ) );
    return true;
}

export function stepTugThrows( ctx: RunContext, throws: TugThrow[], dt: number ): void {
    let kept = 0;
    for ( const t of throws ) {
        t.left -= dt;
        if ( t.left > LATCH_EPS ) throws[ kept++ ] = t;
        else latch( ctx, t );
    }
    throws.length = kept;
}

export function clearTugThrows( throws: TugThrow[] ): void {
    throws.length = 0;
}

function gone( p: PlayerState ): boolean {
    return p.dead || p.finished || p.spectating;
}

function latch( ctx: RunContext, t: TugThrow ): void {
    const p = ctx.state.players.get( t.ownerId );
    if ( p === undefined || gone( p ) ) {
        miss( ctx, t, p?.y ?? 0 );
        return;
    }
    if ( t.targetId === '' ) {
        if ( ctx.broken.has( t.blockId ) ) {
            miss( ctx, t, p.y );
            return;
        }
        reel( p, t.z, ctx.config );
        ctx.broadcast( TUG_MESSAGE, tugEvent( 'anchor', t.ownerId, '', t.dir, t.x, p.y, t.z, ctx.config.tugS ) );
        return;
    }
    const v = ctx.state.players.get( t.targetId );
    const reach = ctx.config.tugRange * ctx.config.tugLatchSlack;
    if ( v === undefined || gone( v ) || Math.hypot( v.x - p.x, v.z - p.z ) > reach ) {
        miss( ctx, t, p.y );
        return;
    }
    if ( t.dir > 0 ) catapult( p, ctx.config );
    if ( ! ctx.shieldAbsorbs( v, { x: v.x, y: v.y, z: v.z, victimId: t.targetId } ) ) {
        if ( t.dir > 0 ) slowTarget( v, ctx.config );
        else towTarget( v, ctx.config );
    }
    const pull = t.dir > 0 ? p.tugTimer : v.towTimer;
    ctx.broadcast( TUG_MESSAGE, tugEvent( 'latch', t.ownerId, t.targetId, t.dir, v.x, v.y, v.z, pull ) );
}

function miss( ctx: RunContext, t: TugThrow, y: number ): void {
    ctx.broadcast( TUG_MESSAGE, tugEvent( 'miss', t.ownerId, t.targetId, t.dir, t.x, y, t.z, 0 ) );
}

function tugEvent(
    outcome: TugEvent[ 'outcome' ],
    ownerId: string,
    targetId: string,
    dir: number,
    x: number,
    y: number,
    z: number,
    seconds: number,
): TugEvent {
    return { outcome, ownerId, targetId, dir, x, y, z, seconds };
}
