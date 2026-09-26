import { getStateCallbacks, type Room } from '@colyseus/sdk';
import {
    HeldPower,
    MINE_BURST_MESSAGE,
    type MineEvent,
    PHASE,
    type PlayerState,
    type ProjectileState,
    type RunState,
    SEEKER_HIT_MESSAGE,
    type SeekerState,
} from '@slur/shared';
import { playMusic } from './audio-engine';
import { MUSIC, playBolt, playSfx, startSfxLoop, stopSfxLoop } from './sfx-map';

const THREAT_Z = 90;
const THREAT_X = 8;
const MINE_FAR_GAIN = 0.6;

export function bindRoomAudio( room: Room< RunState > ): () => void {
    const $ = getStateCallbacks( room );
    const me = room.sessionId;
    const perPlayer = new Map< string, () => void >();
    const perProjectile = new Map< string, () => void >();
    const perSeeker = new Map< string, () => void >();

    const prevStun = new Map< string, number >();
    const prevSlots: number[] = [];
    const prevDead = new Map< string, boolean >();
    const threatened = new Set< string >();
    const locked = new Set< string >();

    const slotEdge = ( power: number, slot: number ): void => {
        if ( ( prevSlots[ slot ] ?? HeldPower.none ) === HeldPower.none && power !== HeldPower.none ) {
            playSfx( 'pickup' );
        }
        prevSlots[ slot ] = power;
    };

    const localEdges = ( p: PlayerState ): void => {
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
        prevDead.set( sid, p.dead );
        const offChange = $( p ).onChange( () => onPlayerChange( sid, p ) );
        if ( sid !== me ) {
            perPlayer.set( sid, offChange );
            return;
        }
        prevSlots.splice( 0, prevSlots.length, ...p.slots );
        const offSlots = $( p ).slots.onChange( slotEdge );
        perPlayer.set( sid, () => {
            offChange();
            offSlots();
        } );
    } );
    const offRemove = $( room.state ).players.onRemove( ( _p, sid ) => {
        perPlayer.get( sid )?.();
        perPlayer.delete( sid );
        prevStun.delete( sid );
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
            playBolt();
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

    const seekerKey = ( id: string ): string => `seeker:${ id }`;

    const trackLock = ( s: SeekerState, id: string ): void => {
        const key = seekerKey( id );
        if ( s.targetId !== me ) {
            stopSfxLoop( key );
            locked.delete( id );
            return;
        }
        if ( s.committed ) {
            stopSfxLoop( key );
            if ( ! locked.has( id ) ) {
                locked.add( id );
                playSfx( 'seekerLocked' );
            }
            return;
        }
        startSfxLoop( key, 'seekerLocking' );
    };

    const offSeekerAdd = $( room.state ).seekers.onAdd( ( s, id ) => {
        if ( s.ownerId === me ) playSfx( 'seekerFire' );
        trackLock( s, id );
        perSeeker.set(
            id,
            $( s ).onChange( () => trackLock( s, id ) ),
        );
    } );
    const offSeekerRemove = $( room.state ).seekers.onRemove( ( _s, id ) => {
        perSeeker.get( id )?.();
        perSeeker.delete( id );
        stopSfxLoop( seekerKey( id ) );
        locked.delete( id );
    } );

    const offSeekerHit = room.onMessage( SEEKER_HIT_MESSAGE, () => playSfx( 'seekerHit' ) );
    const offMineBurst = room.onMessage( MINE_BURST_MESSAGE, ( e: MineEvent ) =>
        playSfx( 'mineBurst', e.outcome === 'trigger' ? {} : { gain: 0.85 * MINE_FAR_GAIN } ),
    );

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
        offSeekerAdd();
        offSeekerRemove();
        offSeekerHit();
        offMineBurst();
        offPhase();
        offCd();
        for ( const off of perPlayer.values() ) off();
        for ( const off of perProjectile.values() ) off();
        for ( const [ id, off ] of perSeeker ) {
            off();
            stopSfxLoop( seekerKey( id ) );
        }
        perPlayer.clear();
        perProjectile.clear();
        perSeeker.clear();
    };
}
