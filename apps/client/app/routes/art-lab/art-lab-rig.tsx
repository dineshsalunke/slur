import { useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, simulate, type Track as TrackHandle, tuningForShip } from '@slur/shared';
import type { Entity, World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from '../../game/camera/chase';
import { syncRenderSystem } from '../../game/ecs/systems';
import { LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard, currentInput } from '../../game/input/keyboard';
import { LAB_DEFAULT_SHIP } from './lab-defaults';
import { labCommands, labControls } from './lab-state';

function labFlightStep( world: World, dt: number, track: TrackHandle ): void {
    const input = currentInput();
    world.query( Sim, Prev, Net, LocalPlayer ).updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        simulate( s, input, dt, tuningForShip( net.shipId ), track );
    } );
}

function ghostStep( world: World, dt: number ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        s.z += labControls.ghostSpeed * dt;
        s.vz = labControls.ghostSpeed;
        s.dead = false;
        s.y = 0;
        s.grounded = true;
    } );
}

function safeXAt( track: TrackHandle, z: number ): number {
    const seg = track.segmentAtZ( z );
    if ( seg.floors.length === 0 ) return 0;
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

function freezePrev( world: World ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

export function ArtLabRig( { track }: { track: TrackHandle } ) {
    const world = useWorld();
    const ship = useRef< Entity | null >( null );
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    // JUSTIFIED EFFECT — external sync: window keydown/keyup. `attachKeyboard()` installs the listeners and
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — external sync: the koota world is a module singleton OUTSIDE React, so the lab's
    useEffect( () => {
        const e = world.spawn(
            Sim,
            Prev,
            Render,
            Net( { sessionId: 'art-lab', shipId: LAB_DEFAULT_SHIP, colorId: 0 } ),
            LocalPlayer,
        );
        ship.current = e;
        return () => {
            ship.current = null;
            e.destroy();
        };
    }, [ world ] );

    useFrame( ( state, delta ) => {
        const nextShip = labCommands.setShip;
        if ( nextShip !== null ) {
            labCommands.setShip = null;
            ship.current?.set( Net, { sessionId: 'art-lab', shipId: nextShip, colorId: 0 } );
        }
        const jump = labCommands.jumpToZ;
        if ( jump !== null ) {
            labCommands.jumpToZ = null;
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
