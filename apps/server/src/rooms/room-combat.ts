import {
    aimBolt,
    aimSeeker,
    HeldPower,
    lockTarget,
    type PlayerState,
    Projectile,
    type RunState,
    SEEKER_HIT_MESSAGE,
    SEEKER_MISS_MESSAGE,
    Seeker,
    type SeekerEvent,
    type SimConfig,
    seekerShipsOf,
    stunDurationForShip,
    type Track,
} from '@slur/shared';

export type Broadcast = ( type: string, message: unknown ) => void;

export interface FireContext {
    state: RunState;
    track: Track;
    broken: ReadonlySet< number >;
    config: SimConfig;
}

export function firePower( ctx: FireContext, id: string, p: PlayerState, ownerId: string ): void {
    if ( p.heldPower === HeldPower.seeker ) fireSeeker( ctx, id, p, ownerId );
    else fireBolt( ctx, id, p, ownerId );
    p.heldPower = HeldPower.none;
}

function fireBolt( ctx: FireContext, id: string, p: PlayerState, ownerId: string ): void {
    const bolt = new Projectile();
    aimBolt( bolt, p, ownerId, ctx.config );
    ctx.state.projectiles.set( id, bolt );
}

function fireSeeker( ctx: FireContext, id: string, p: PlayerState, ownerId: string ): void {
    const ships = seekerShipsOf( ctx.state.players.entries() );
    const targetId = lockTarget( p, ownerId, ships, ctx.track, ctx.broken, ctx.config );
    const seeker = new Seeker();
    aimSeeker( seeker, p, ownerId, targetId, ctx.config );
    ctx.state.seekers.set( id, seeker );
}

export function resolveSeekerEvent(
    state: RunState,
    event: SeekerEvent,
    broadcast: Broadcast,
    config: SimConfig,
): void {
    const { x, y, z } = event;
    if ( event.outcome === 'miss' ) {
        broadcast( SEEKER_MISS_MESSAGE, event );
        return;
    }
    if ( event.outcome === 'blocked' ) {
        broadcast( 'hit', { x, y, z, victimId: '' } );
        return;
    }
    const v = state.players.get( event.targetId );
    if ( v ) v.stunTimer = stunDurationForShip( v.shipId, config, config.seekerStunS );
    broadcast( 'hit', { x, y, z, victimId: event.targetId } );
    broadcast( SEEKER_HIT_MESSAGE, event );
}
