import { HIT_MESSAGE } from '../../combat/constants.js';
import type { FireDir } from '../../combat/fire-dir.js';
import { lockTarget, targetShipsOf } from '../../combat/target-lock.js';
import type { PlayerState } from '../../schema.js';
import { stunDurationForShip } from '../../ship-classes.js';
import type { RunContext } from '../define-sim-feature.js';
import { aimSeeker, type SeekerEvent, stepSeekers } from './seeker.js';
import { SEEKER_HIT_MESSAGE, SEEKER_MISS_MESSAGE } from './seeker-constants.js';
import { Seeker } from './seeker-schema.js';

export function fireSeeker(
    ctx: RunContext,
    _run: undefined,
    p: PlayerState,
    ownerId: string,
    _slot: number,
    dir: FireDir,
): boolean {
    const { config } = ctx;
    const ships = targetShipsOf( ctx.state.players.entries() );
    const targetId = lockTarget(
        p,
        ownerId,
        ships,
        ctx.track,
        ctx.broken,
        config.seekerLockRange,
        config.seekerHalf,
        dir,
    );
    const seeker = new Seeker();
    aimSeeker( seeker, p, ownerId, targetId, config, dir );
    ctx.state.seekers.set( ctx.nextId(), seeker );
    return true;
}

export function strikeSeekers( ctx: RunContext, _run: undefined, dt: number ): void {
    const { state } = ctx;
    stepSeekers(
        state.seekers,
        targetShipsOf( state.players.entries() ),
        ctx.track,
        ctx.broken,
        dt,
        ( event ) => resolveSeekerEvent( ctx, event ),
        ctx.config,
    );
}

export function resolveSeekerEvent( ctx: RunContext, event: SeekerEvent ): void {
    const { state, config, broadcast } = ctx;
    const { x, y, z } = event;
    if ( event.outcome === 'miss' ) {
        broadcast( SEEKER_MISS_MESSAGE, event );
        return;
    }
    if ( event.outcome === 'blocked' ) {
        broadcast( HIT_MESSAGE, { x, y, z, victimId: '' } );
        return;
    }
    const v = state.players.get( event.targetId );
    if ( v && ctx.shieldAbsorbs( v, { x, y, z, victimId: event.targetId } ) ) return;
    if ( v ) v.stunTimer = stunDurationForShip( v.shipId, config, config.seekerStunS );
    broadcast( HIT_MESSAGE, { x, y, z, victimId: event.targetId } );
    broadcast( SEEKER_HIT_MESSAGE, event );
}
