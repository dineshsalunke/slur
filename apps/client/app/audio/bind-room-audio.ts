import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { HeldPower, PHASE, type PlayerState, type ProjectileState, type RunState } from '@slur/shared';
import { playMusic } from './audio-engine';
import { MUSIC, playSfx } from './sfx-map';

const THREAT_Z = 90;
const THREAT_X = 8;

export function bindRoomAudio( room: Room< RunState > ): () => void {
    const $ = getStateCallbacks( room );
    const me = room.sessionId;
    const perPlayer = new Map< string, () => void >();
    const perProjectile = new Map< string, () => void >();

    const prevStun = new Map< string, number >();
    const prevHeld = new Map< string, number >();
    const prevDead = new Map< string, boolean >();
    const threatened = new Set< string >();

    const localEdges = ( p: PlayerState ): void => {
        const ph = prevHeld.get( me ) ?? HeldPower.none;
        if ( ph === HeldPower.none && p.heldPower !== HeldPower.none ) playSfx( 'pickup' );
        prevHeld.set( me, p.heldPower );

        const pd = prevDead.get( me ) ?? false;
        if ( ! pd && p.dead ) playSfx( 'death' );
        else if ( pd && ! p.dead ) playSfx( 'respawn' );
        prevDead.set( me, p.dead );
    };

    const onPlayerChange = ( sid: string, p: PlayerState ): void => {
        const ps = prevStun.get( sid ) ?? 0;
        if ( ps <= 0 && p.stunTimer > 0 ) {
            playSfx( 'hit' );
            if ( sid === me ) playSfx( 'stun' );
        }
        prevStun.set( sid, p.stunTimer );
        if ( sid === me ) localEdges( p );
    };

    const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
        prevStun.set( sid, p.stunTimer );
        prevHeld.set( sid, p.heldPower );
        prevDead.set( sid, p.dead );
        perPlayer.set(
            sid,
            $( p ).onChange( () => onPlayerChange( sid, p ) ),
        );
    } );
    const offRemove = $( room.state ).players.onRemove( ( _p, sid ) => {
        perPlayer.get( sid )?.();
        perPlayer.delete( sid );
        prevStun.delete( sid );
        prevHeld.delete( sid );
        prevDead.delete( sid );
    } );

    const checkThreat = ( proj: ProjectileState, id: string ): void => {
        if ( proj.ownerId === me || threatened.has( id ) ) return;
        const self = room.state.players.get( me );
        if ( ! self || self.spectating || self.dead ) return;
        const dz = self.z - proj.z;
        if ( dz > -4 && dz < THREAT_Z && Math.abs( proj.x - self.x ) < THREAT_X ) {
            threatened.add( id );
            playSfx( 'threat' );
        }
    };

    const offProjAdd = $( room.state ).projectiles.onAdd( ( proj, id ) => {
        if ( proj.ownerId === me ) {
            playSfx( 'fire' );
            return;
        }
        checkThreat( proj, id );
        perProjectile.set(
            id,
            $( proj ).onChange( () => checkThreat( proj, id ) ),
        );
    } );
    const offProjRemove = $( room.state ).projectiles.onRemove( ( _proj, id ) => {
        perProjectile.get( id )?.();
        perProjectile.delete( id );
        threatened.delete( id );
    } );

    let prevPhase = room.state.phase;
    const offPhase = $( room.state ).listen( 'phase', ( v ) => {
        if ( v === PHASE.racing && prevPhase !== PHASE.racing ) playSfx( 'go' );
        playMusic( v === PHASE.racing ? MUSIC.run.name : MUSIC.lobby.name );
        prevPhase = v;
    } );

    let prevCeil = Math.ceil( room.state.countdown );
    const offCd = $( room.state ).listen( 'countdown', ( v ) => {
        const c = Math.ceil( v );
        if ( v > 0 && c !== prevCeil && c <= 3 ) playSfx( 'countdown', { rate: 1 + ( 3 - c ) * 0.14 } );
        prevCeil = c;
    } );

    return () => {
        offAdd();
        offRemove();
        offProjAdd();
        offProjRemove();
        offPhase();
        offCd();
        for ( const off of perPlayer.values() ) off();
        for ( const off of perProjectile.values() ) off();
        perPlayer.clear();
        perProjectile.clear();
    };
}
