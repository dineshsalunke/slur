import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { INPUT_MESSAGE, type PlayerState, type ProjectileState, type RunState, type Track } from '@slur/shared';
import type { Entity, World } from 'koota';
import type { RefObject } from 'react';
import { Interp, LocalPlayer, Net, NetProjectile, Prev, ProjInterp, Remote, Render, Sim } from '../game/ecs/traits';
import { pushHit } from '../game/scene/hit-events';
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
    // Carry `stunned` in the snapshot EXACTLY like `dead` — remoteInterpSystem reads the latest to flicker a
    // hit remote (stunTimer isn't otherwise interpolated; the flag is all the cosmetic cue needs).
    interp.buffer.push( {
        t: performance.now(),
        x: p.x,
        y: p.y,
        z: p.z,
        vx: p.vx,
        dead: p.dead,
        stunned: p.stunTimer > 0,
    } );
    if ( interp.buffer.length > 120 ) interp.buffer.shift();
}

// A projectile (bolt) is INTERP-ONLY (never predicted): push each authoritative pose into its buffer. Bolts
// are short-lived (ttl ~2.5s ⇒ ~50 patches), so a small buffer is plenty.
function pushProjectile( ent: Entity, proj: ProjectileState ): void {
    const pi = ent.get( ProjInterp );
    if ( ! pi ) return;
    pi.buffer.push( { t: performance.now(), x: proj.x, y: proj.y, z: proj.z } );
    if ( pi.buffer.length > 30 ) pi.buffer.shift();
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
    const projById = new Map< string, Entity >(); // bolt id → its interp-only ECS entity
    // Per-entity onChange detaches, keyed like the entity maps above. A bolt is added and removed many times
    // per race, so its listener MUST come off in onRemove — a flat array drained only at teardown grows for
    // the whole room lifetime and keeps every dead bolt's schema object reachable.
    const perPlayer = new Map< string, () => void >();
    const perProjectile = new Map< string, () => void >();

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
        perPlayer.set( sid, offChange );
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

    // Projectiles = server-owned, INTERP-ONLY entities. onAdd spawns a bolt ECS entity; onChange feeds its
    // interp buffer; onRemove (server prune on hit/expire) destroys it. The client NEVER predicts these.
    const offProjAdd = $( room.state ).projectiles.onAdd( ( proj, id ) => {
        const e = world.spawn( ProjInterp, NetProjectile );
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

    // One-shot impact FX: the server broadcasts 'hit' at the moment a bolt connects (NOT state — colyseus.md:
    // one-shot FX are messages). Queue it for the imperative <HitSpark> field; never touches React.
    const offHit = room.onMessage( 'hit', ( m: { x: number; y: number; z: number; victimId: string } ) => {
        pushHit( { x: m.x, y: m.y, z: m.z } );
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
        offProjAdd();
        offProjRemove();
        offHit();
        for ( const off of perPlayer.values() ) off();
        for ( const off of perProjectile.values() ) off();
        for ( const e of byId.values() ) e.destroy();
        for ( const e of projById.values() ) e.destroy();
        perPlayer.clear();
        perProjectile.clear();
        byId.clear();
        projById.clear();
    };
}
