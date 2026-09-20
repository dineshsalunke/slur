import { useFrame } from '@react-three/fiber';
import {
    createFixedStep,
    DEFAULT_SHIP,
    FIXED_DT,
    simulate,
    type Track as TrackHandle,
    tuningForShip,
} from '@slur/shared';
import type { Entity, World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from '../../game/camera/chase';
import { syncRenderSystem } from '../../game/ecs/systems';
import { LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard, currentInput } from '../../game/input/keyboard';
import { labCommands, labControls } from './lab-state';

// One fixed-step tick. This is `netFlightSystem` MINUS the networking: same Prev-then-simulate order,
// no Predictor (nothing to reconcile without a server) and no Net-trait requirement on the query.
//
// The `prev` copy BEFORE `simulate` is load-bearing and not cosmetic: `syncRenderSystem` lerps Prev→Sim by
// the frame's leftover alpha. Skip the refresh and it interpolates a STALE Prev toward a fresh Sim every
// frame, which reads as a ship vibrating in place — the S4 lobby-jitter bug (memory:
// `gating-a-system-strands-invariants`). Any branch that skips stepping MUST still keep Prev == Sim.
function labFlightStep( world: World, dt: number, track: TrackHandle ): void {
    const input = currentInput();
    world.query( Sim, Prev, Net, LocalPlayer ).updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        simulate( s, input, dt, tuningForShip( net.shipId ), track );
    } );
}

// Ghost advance: no physics, no collision, no death — just slide down the ribbon so the art can be
// inspected without the run ending. Prev is still refreshed so the render lerp stays well-formed.
function ghostStep( world: World, dt: number ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        s.z += labControls.ghostSpeed * dt;
        s.vz = labControls.ghostSpeed; // the chase cam reads vz for trail-stretch + speed-FOV
        s.dead = false;
        s.y = 0;
        s.grounded = true;
    } );
}

/**
 * Centre of the widest lethal-free interval at world-z `z`.
 *
 * Deliberately lab-local rather than an export from `@slur/shared`: the sim has an equivalent private
 * helper (`maxOpenAtSlice`), but widening the shared API to serve a dev tool would be the tail wagging
 * the dog. This walks the PUBLIC `Segment` shape (floors + blocks) only.
 */
function safeXAt( track: TrackHandle, z: number ): number {
    const seg = track.segmentAtZ( z );
    if ( seg.floors.length === 0 ) return 0;
    // Lethal spans that straddle this z, as [x0, x1] intervals, left to right.
    const walls = seg.blocks
        .filter( ( b ) => b.lethal && z >= b.z0 && z <= b.z1 )
        .map( ( b ) => [ b.x0, b.x1 ] as const )
        .sort( ( a, b ) => a[ 0 ] - b[ 0 ] );

    let bestWidth = 0;
    let bestCentre = 0;
    for ( const f of seg.floors ) {
        let cursor = f.x0;
        for ( const [ lo, hi ] of walls ) {
            if ( lo > cursor && lo - cursor > bestWidth ) {
                bestWidth = lo - cursor;
                bestCentre = ( cursor + lo ) / 2;
            }
            cursor = Math.max( cursor, hi );
        }
        if ( f.x1 > cursor && f.x1 - cursor > bestWidth ) {
            bestWidth = f.x1 - cursor;
            bestCentre = ( cursor + f.x1 ) / 2;
        }
    }
    return bestWidth > 0 ? bestCentre : 0;
}

// Hold the render pose exactly where it is. Used while paused — see the Prev note on labFlightStep.
function freezePrev( world: World ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

/**
 * Drives the art lab: owns the single local ship entity, runs the real shared `simulate()` over the real
 * materialized track, and points the real chase camera at it — with no Colyseus room anywhere in the path.
 * That is the whole point: what you see here is what the game renders, not an approximation of it.
 */
export function ArtLabRig( { track }: { track: TrackHandle } ) {
    const world = useWorld();
    const ship = useRef< Entity | null >( null );
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    // JUSTIFIED EFFECT — external sync: window keydown/keyup. `attachKeyboard()` installs the listeners and
    // returns its own teardown, so the Effect is a pure subscribe/unsubscribe bracket, which is the one job
    // Effects are for. Rejected alternatives: React onKeyDown (needs focus + a focusable element, and the
    // Canvas is not one), and a module-level listener installed at import (would keep firing after the route
    // unmounts). No setState, so this never re-renders.
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — external sync: the koota world is a module singleton OUTSIDE React, so the lab's
    // entity is created in it imperatively and removed on unmount or it leaks into the next route.
    useEffect( () => {
        const e = world.spawn(
            Sim,
            Prev,
            Render,
            Net( { sessionId: 'art-lab', shipId: DEFAULT_SHIP, colorId: 0 } ),
            LocalPlayer,
        );
        ship.current = e;
        return () => {
            ship.current = null;
            e.destroy();
        };
    }, [ world ] );

    useFrame( ( state, delta ) => {
        // Setting the trait rather than respawning: ShipView subscribes to Net, so only that leaf re-renders.
        const nextShip = labCommands.setShip;
        if ( nextShip !== null ) {
            labCommands.setShip = null;
            ship.current?.set( Net, { sessionId: 'art-lab', shipId: nextShip, colorId: 0 } );
        }
        // Drain any pending teleport BEFORE stepping, so the step and the render lerp agree this frame.
        const jump = labCommands.jumpToZ;
        if ( jump !== null ) {
            labCommands.jumpToZ = null;
            // Land in the widest OPEN lane, not at x=0. Dropping blind at centre lands you inside a block at
            // any real intensity — the ship dies instantly and the chase cam renders from inside the geometry
            // (a wall of flat colour, which looks like a broken renderer rather than a misplaced spawn).
            const x = safeXAt( track, jump );
            world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
                s.z = jump;
                s.x = x;
                s.y = 0;
                s.vx = 0;
                s.vy = 0;
                s.vz = 0;
                s.dead = false;
                s.respawnTimer = 0;
                s.lastSafeX = x;
                s.lastSafeZ = jump;
                prev.x = s.x;
                prev.y = s.y;
                prev.z = s.z;
            } );
        }

        const alpha = advance( delta, ( dt ) => {
            if ( labControls.paused ) return;
            if ( labControls.ghost ) ghostStep( world, dt );
            else labFlightStep( world, dt, track );
        } );
        if ( labControls.paused ) freezePrev( world );
        syncRenderSystem( world, alpha );
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );

    return null;
}
