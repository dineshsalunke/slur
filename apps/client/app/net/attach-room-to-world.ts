import { getStateCallbacks, type Room } from '@colyseus/sdk';
import {
    BOUNCE_MESSAGE,
    type BounceMessage,
    INPUT_MESSAGE,
    MINE_BURST_MESSAGE,
    type PlayerState,
    type ProjectileState,
    type RunState,
    type SeekerState,
    SHIELD_POP_MESSAGE,
    type Track,
} from '@slur/shared';
import type { Entity, World } from 'koota';
import type { RefObject } from 'react';
import { clearBlockState, confirmBreak, unconfirmBreak } from '../game/block-state';
import { sparkAt } from '../game/ecs/bounce-spark';
import {
    Attitude,
    Held,
    Hover,
    Interp,
    LocalPlayer,
    Net,
    NetMine,
    NetProjectile,
    NetSeeker,
    Prev,
    ProjInterp,
    Remote,
    Render,
    SeekerTrail,
    Shield,
    Sim,
} from '../game/ecs/traits';
import { settleSlot } from '../game/input/power-select';
import { pushHit } from '../game/scene/hit-events';
import { burstMine } from '../game/scene/mine-shock-events';
import { launchMine } from '../game/scene/mine-shots';
import { localRole, runPhase } from '../game/spectator';
import { copyShip, type Predictor } from './prediction';

const INPUT_SEND_MS = 1000 / 30;

function mirrorNet( ent: Entity, sessionId: string, shipId: string, colorId: number ): void {
    const cur = ent.get( Net );
    if ( cur && ( cur.shipId !== shipId || cur.colorId !== colorId ) ) ent.set( Net, { sessionId, shipId, colorId } );
}

function reconcileLocal( ent: Entity, p: PlayerState, predictor: Predictor, track: Track ): void {
    localRole.spectating = p.spectating;
    const s = ent.get( Sim );
    if ( s ) predictor.reconcile( s, p, track );
}

function pushRemote( ent: Entity, p: PlayerState ): void {
    const interp = ent.get( Interp );
    if ( ! interp ) return;
    interp.buffer.push( {
        t: performance.now(),
        x: p.x,
        y: p.y,
        z: p.z,
        vx: p.vx,
        dead: p.dead,
        stunned: p.stunTimer > 0,
        boost: p.boostTimer,
    } );
    if ( interp.buffer.length > 120 ) interp.buffer.shift();
}

function pushProjectile( ent: Entity, proj: ProjectileState | SeekerState ): void {
    const pi = ent.get( ProjInterp );
    if ( ! pi ) return;
    pi.buffer.push( { t: performance.now(), x: proj.x, y: proj.y, z: proj.z } );
    if ( pi.buffer.length > 30 ) pi.buffer.shift();
}

function pushSeeker( ent: Entity, s: SeekerState ): void {
    pushProjectile( ent, s );
    const cur = ent.get( NetSeeker );
    if ( cur && ( cur.ownerId !== s.ownerId || cur.targetId !== s.targetId ) ) {
        ent.set( NetSeeker, { ownerId: s.ownerId, targetId: s.targetId } );
    }
}

function mirrorRack( ent: Entity | undefined, p: PlayerState ): void {
    if ( ! ent ) return;
    const slots = Array.from( p.slots );
    ent.set( Held, { slots } );
    settleSlot( slots );
}

function spawnPlayer(
    world: World,
    isLocal: boolean,
    net: { sessionId: string; shipId: string; colorId: number },
): Entity {
    return isLocal
        ? world.spawn( Render, Hover, Attitude, Net( net ), Sim, Prev, LocalPlayer, Held, Shield )
        : world.spawn( Render, Hover, Attitude, Net( net ), Remote, Interp, Shield );
}

function mirrorShield( ent: Entity | undefined, on: boolean ): void {
    if ( ! ent ) return;
    const now = performance.now() / 1000;
    ent.set( Shield, ( prev ) => ( on ? { on, since: now, popAt: -1 } : { ...prev, on } ) );
}

function popShield( ent: Entity | undefined ): void {
    ent?.set( Shield, ( prev ) => ( { ...prev, on: false, popAt: performance.now() / 1000 } ) );
}

export function attachRoomToWorld(
    room: Room< RunState >,
    world: World,
    predictor: Predictor,
    trackRef: RefObject< Track >,
): () => void {
    const $ = getStateCallbacks( room );
    const byId = new Map< string, Entity >();
    const projById = new Map< string, Entity >();
    const seekerById = new Map< string, Entity >();
    const perPlayer = new Map< string, () => void >();
    const perProjectile = new Map< string, () => void >();
    const perSeeker = new Map< string, () => void >();
    const mineById = new Map< string, Entity >();
    const perMine = new Map< string, () => void >();

    const offPhase = $( room.state ).listen( 'phase', ( v ) => {
        runPhase.value = v;
        predictor.reset();
    } );

    const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
        const isLocal = sid === room.sessionId;
        const e = spawnPlayer( world, isLocal, { sessionId: sid, shipId: p.shipId, colorId: p.colorId } );
        byId.set( sid, e );

        if ( isLocal ) {
            localRole.spectating = p.spectating;
            const s = e.get( Sim );
            if ( s ) copyShip( s, p );
        }

        const offChange = $( p ).onChange( () => {
            const ent = byId.get( sid );
            if ( ! ent ) return;
            mirrorNet( ent, sid, p.shipId, p.colorId );
            if ( isLocal ) reconcileLocal( ent, p, predictor, trackRef.current );
            else pushRemote( ent, p );
        } );
        const offShield = $( p ).listen( 'shielded', ( on ) => mirrorShield( byId.get( sid ), on ) );
        if ( ! isLocal ) {
            perPlayer.set( sid, () => {
                offChange();
                offShield();
            } );
            return;
        }
        mirrorRack( e, p );
        const offSlots = $( p ).slots.onChange( () => mirrorRack( byId.get( sid ), p ) );
        perPlayer.set( sid, () => {
            offChange();
            offShield();
            offSlots();
        } );
    } );

    const offRemove = $( room.state ).players.onRemove( ( _p, sid ) => {
        perPlayer.get( sid )?.();
        perPlayer.delete( sid );
        const e = byId.get( sid );
        if ( e ) {
            e.destroy();
            byId.delete( sid );
        }
    } );

    const offProjAdd = $( room.state ).projectiles.onAdd( ( proj, id ) => {
        const e = world.spawn( ProjInterp, NetProjectile( { dir: proj.dir } ) );
        projById.set( id, e );
        pushProjectile( e, proj );
        const offProjChange = $( proj ).onChange( () => {
            const ent = projById.get( id );
            if ( ent ) pushProjectile( ent, proj );
        } );
        perProjectile.set( id, offProjChange );
    } );

    const offProjRemove = $( room.state ).projectiles.onRemove( ( _proj, id ) => {
        perProjectile.get( id )?.();
        perProjectile.delete( id );
        const e = projById.get( id );
        if ( e ) {
            e.destroy();
            projById.delete( id );
        }
    } );

    const offSeekerAdd = $( room.state ).seekers.onAdd( ( s, id ) => {
        const e = world.spawn( ProjInterp, NetSeeker( { ownerId: s.ownerId, targetId: s.targetId } ), SeekerTrail );
        seekerById.set( id, e );
        pushProjectile( e, s );
        const offSeekerChange = $( s ).onChange( () => {
            const ent = seekerById.get( id );
            if ( ent ) pushSeeker( ent, s );
        } );
        perSeeker.set( id, offSeekerChange );
    } );

    const offSeekerRemove = $( room.state ).seekers.onRemove( ( _s, id ) => {
        perSeeker.get( id )?.();
        perSeeker.delete( id );
        const e = seekerById.get( id );
        if ( e ) {
            e.destroy();
            seekerById.delete( id );
        }
    } );

    const offMineAdd = $( room.state ).mines.onAdd( ( m, id ) => {
        const e = world.spawn( NetMine( launchMine( m, byId.get( m.ownerId ) ) ) );
        mineById.set( id, e );
        perMine.set(
            id,
            $( m ).listen( 'armed', ( armed ) =>
                mineById.get( id )?.set( NetMine, ( prev ) => ( { ...prev, armed } ) ),
            ),
        );
    } );

    const offMineRemove = $( room.state ).mines.onRemove( ( _m, id ) => {
        perMine.get( id )?.();
        perMine.delete( id );
        mineById.get( id )?.destroy();
        mineById.delete( id );
    } );

    const offMineBurst = room.onMessage( MINE_BURST_MESSAGE, burstMine );

    const offBreak = $( room.state ).blockBroken.onAdd( ( _v, key ) => confirmBreak( Number( key ) ) );
    const offUnbreak = $( room.state ).blockBroken.onRemove( ( _v, key ) => unconfirmBreak( Number( key ) ) );

    const offHit = room.onMessage( 'hit', ( m: { x: number; y: number; z: number; victimId: string } ) => {
        pushHit( { x: m.x, y: m.y, z: m.z } );
    } );

    const offShieldPop = room.onMessage(
        SHIELD_POP_MESSAGE,
        ( m: { x: number; y: number; z: number; victimId: string } ) => {
            popShield( byId.get( m.victimId ) );
            pushHit( { x: m.x, y: m.y, z: m.z } );
        },
    );

    const offBounce = room.onMessage( BOUNCE_MESSAGE, ( m: BounceMessage ) => {
        if ( m.victimId !== room.sessionId ) sparkAt( m );
    } );

    // Wall clock, not useFrame: sends must hold 30Hz when a backgrounded tab throttles rAF.
    const timer = setInterval( () => {
        const inputs = predictor.drainUnsent();
        if ( inputs.length > 0 ) room.send( INPUT_MESSAGE, { inputs } );
    }, INPUT_SEND_MS );

    return () => {
        clearInterval( timer );
        offPhase();
        offAdd();
        offRemove();
        offProjAdd();
        offProjRemove();
        offSeekerAdd();
        offSeekerRemove();
        offMineAdd();
        offMineRemove();
        offMineBurst();
        offHit();
        offShieldPop();
        offBounce();
        offBreak();
        offUnbreak();
        clearBlockState();
        for ( const offs of [ perPlayer, perProjectile, perSeeker, perMine ] ) drainOffs( offs );
        for ( const entities of [ byId, projById, seekerById, mineById ] ) destroyAll( entities );
    };
}

function drainOffs( offs: Map< string, () => void > ): void {
    for ( const off of offs.values() ) off();
    offs.clear();
}

function destroyAll( entities: Map< string, Entity > ): void {
    for ( const e of entities.values() ) e.destroy();
    entities.clear();
}
