import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { INPUT_MESSAGE, type PlayerState, type RunState, type Track } from '@slur/shared';
import type { Entity, World } from 'koota';
import type { RefObject } from 'react';
import { Interp, LocalPlayer, Net, Prev, Remote, Render, Sim } from '../game/ecs/traits';
import { localRole, runPhase } from '../game/spectator';
import { copyShip, type Predictor } from './prediction';

// Send buffered inputs at 30Hz (not per render frame) — the batched sender drains every input
// produced since the last send; the server drains them 1-per-tick, so cadence is a bandwidth knob.
const INPUT_SEND_MS = 1000 / 30;

// Mirror the networked identity (shipId + colorId) into the ECS ONLY when it actually changes (not every
// 20Hz patch), so the ship view re-renders its model/tint on a swap, not continuously.
function mirrorNet( ent: Entity, sessionId: string, shipId: string, colorId: number ): void {
    const cur = ent.get( Net );
    if ( cur && ( cur.shipId !== shipId || cur.colorId !== colorId ) ) ent.set( Net, { sessionId, shipId, colorId } );
}

// Local ship is PREDICTED: reconcile the Sim against the authoritative snapshot and re-mirror the role flip
// (spectating drives the loop's predict-freeze + spectator cam — how Play-Again promotes a spectator back).
function reconcileLocal( ent: Entity, p: PlayerState, predictor: Predictor, track: Track ): void {
    localRole.spectating = p.spectating;
    const s = ent.get( Sim );
    if ( s ) predictor.reconcile( s, p, track );
}

// Remote ship is INTERPOLATED: push the snapshot into its interp buffer (trimmed to ~1s @ 20Hz).
function pushRemote( ent: Entity, p: PlayerState ): void {
    const interp = ent.get( Interp );
    if ( ! interp ) return;
    interp.buffer.push( { t: performance.now(), x: p.x, y: p.y, z: p.z, vx: p.vx, dead: p.dead } );
    if ( interp.buffer.length > 120 ) interp.buffer.shift();
}

// Spawn the ECS entity for a player: local = predicted (Sim/Prev/LocalPlayer), remote = interpolated.
function spawnPlayer(
    world: World,
    isLocal: boolean,
    net: { sessionId: string; shipId: string; colorId: number },
): Entity {
    return isLocal
        ? world.spawn( Render, Net( net ), Sim, Prev, LocalPlayer )
        : world.spawn( Render, Net( net ), Remote, Interp );
}

// Bridge the Colyseus room (schema callbacks) → ECS, plus a 30Hz input-send timer. onAdd spawns an entity
// (local = predicted, remote = interpolated); per-player onChange reconciles the local ship or feeds a
// remote's interp buffer. This is the SUBSCRIPTION wiring only — the room is loader-owned (S2 lesson); we
// never create/leave/dispose it here. Called from NetCanvas's justified external-sync effect; the returned
// teardown detaches every callback + clears the timer + destroys the ECS entities we spawned, and touches
// the connection never. Lives on a module (not inlined in the effect) so the S5 projectile reconcile has a
// home and the Canvas parent stays free of the dense wiring (also clears the net-canvas complexity lint).
export function attachRoomToWorld(
    room: Room< RunState >,
    world: World,
    predictor: Predictor,
    trackRef: RefObject< Track >,
): () => void {
    const $ = getStateCallbacks( room );
    const byId = new Map< string, Entity >();
    const detach: Array< () => void > = [];

    // Mirror the run phase to the loop's module singleton (no React) so the camera/predict branch reads
    // it every frame without a subscription re-rendering this WebGL parent (acceptance gate #3).
    const offPhase = $( room.state ).listen( 'phase', ( v ) => {
        runPhase.value = v;
    } );

    const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
        const isLocal = sid === room.sessionId;
        const e = spawnPlayer( world, isLocal, { sessionId: sid, shipId: p.shipId, colorId: p.colorId } );
        byId.set( sid, e );

        if ( isLocal ) {
            localRole.spectating = p.spectating; // seed the role at spawn (a mid-race joiner spawns spectating)
            const s = e.get( Sim );
            if ( s ) copyShip( s, p ); // seed prediction from the authoritative spawn
        }

        const offChange = $( p ).onChange( () => {
            const ent = byId.get( sid );
            if ( ! ent ) return;
            mirrorNet( ent, sid, p.shipId, p.colorId );
            if ( isLocal ) reconcileLocal( ent, p, predictor, trackRef.current );
            else pushRemote( ent, p );
        } );
        detach.push( offChange );
    } );

    const offRemove = $( room.state ).players.onRemove( ( _p, sid ) => {
        const e = byId.get( sid );
        if ( e ) {
            e.destroy();
            byId.delete( sid );
        }
    } );

    const timer = setInterval( () => {
        const inputs = predictor.drainUnsent();
        if ( inputs.length > 0 ) room.send( INPUT_MESSAGE, { inputs } );
    }, INPUT_SEND_MS );

    return () => {
        clearInterval( timer );
        offPhase();
        offAdd();
        offRemove();
        for ( const off of detach ) off();
        for ( const e of byId.values() ) e.destroy();
        byId.clear();
    };
}
