import { getStateCallbacks } from '@colyseus/sdk';
import { Canvas, useFrame } from '@react-three/fiber';
import { createFixedStep, FIXED_DT, INPUT_MESSAGE } from '@slur/shared';
import type { Entity } from 'koota';
import { useWorld, WorldProvider } from 'koota/react';
import { useEffect, useMemo, useState } from 'react';
import type { PerspectiveCamera } from 'three';
import { useRoom } from '../net/room-context';
import { copyShip, createPredictor, type Predictor } from '../net/prediction';
import { updateChaseCamera } from './camera/chase';
import { netFlightSystem, remoteInterpSystem } from './ecs/net-systems';
import { syncRenderSystem } from './ecs/systems';
import { Interp, LocalPlayer, Net, Prev, Remote, Render, Sim } from './ecs/traits';
import { world } from './ecs/world';
import { attachKeyboard } from './input/keyboard';
import { Scenery } from './scene/scenery';
import { Ships } from './scene/ship';
import { Track } from './scene/track';

// Send buffered inputs at 30Hz (not per render frame) — the batched sender drains every input
// produced since the last send; the server drains them 1-per-tick, so cadence is a bandwidth knob.
const INPUT_SEND_MS = 1000 / 30;

// The ONE networked loop: local predict (fixed-60, records pending) → interpolate local (prev→sim)
// → interpolate remotes (buffered snapshots) → chase camera. Default priority keeps R3F auto-render on.
function NetLoop( { predictor }: { predictor: Predictor } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const alpha = advance( delta, ( dt ) => netFlightSystem( world, dt, predictor ) );
        syncRenderSystem( world, alpha ); // local ship only (remotes have no Sim/Prev)
        remoteInterpSystem( world ); // remote ships
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );
    return null;
}

// Dev-only readout: polls room.state (200ms, not per-frame) so you can CONFIRM connectivity with a
// number. `players: 2` in both windows = same room, the fix works. `players: 1` in each = the two tabs
// landed in separate rooms (a different bug). ★ marks your own ship.
function NetDebugHud() {
    const room = useRoom();
    const [ rows, setRows ] = useState<string[]>( [] );
    useEffect( () => {
        const id = setInterval( () => {
            const out: string[] = [];
            room.state.players.forEach( ( p, sid ) => {
                const me = sid === room.sessionId ? '★' : ' ';
                out.push( `${ me } ${ sid.slice( 0, 4 ) }  x=${ p.x.toFixed( 1 ) } z=${ p.z.toFixed( 1 ) }${ p.connected ? '' : ' (gone)' }` );
            } );
            setRows( out );
        }, 200 );
        return () => clearInterval( id );
    }, [ room ] );
    return (
        <div
            style={ {
                position: 'fixed', top: 8, left: 8, zIndex: 10, pointerEvents: 'none',
                font: '12px monospace', color: '#00ff88', background: 'rgba(0,0,0,0.6)',
                padding: '6px 8px', whiteSpace: 'pre', borderRadius: 4,
            } }
        >
            { `room: ${ room.roomId }  (you: ${ room.sessionId.slice( 0, 4 ) })\nplayers: ${ rows.length }\n${ rows.join( '\n' ) }` }
        </div>
    );
}

export function NetCanvas() {
    const room = useRoom();
    const predictor = useMemo( createPredictor, [] );

    useEffect( attachKeyboard, [] );

    // Wire Colyseus → ECS: onAdd spawns an entity (local = predicted, remote = interpolated);
    // per-player onChange reconciles the local ship or feeds a remote's interp buffer.
    useEffect( () => {
        const $ = getStateCallbacks( room );
        const byId = new Map<string, Entity>();
        const detach: Array<() => void> = [];

        const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
            const isLocal = sid === room.sessionId;
            const e = isLocal
                ? world.spawn( Render, Net( { sessionId: sid } ), Sim, Prev, LocalPlayer )
                : world.spawn( Render, Net( { sessionId: sid } ), Remote, Interp );
            byId.set( sid, e );

            if ( isLocal ) {
                const s = e.get( Sim );
                if ( s ) copyShip( s, p ); // seed prediction from the authoritative spawn
            }

            const offChange = $( p ).onChange( () => {
                const ent = byId.get( sid );
                if ( ! ent ) return;
                if ( isLocal ) {
                    const s = ent.get( Sim );
                    if ( s ) predictor.reconcile( s, p );
                } else {
                    const interp = ent.get( Interp );
                    if ( ! interp ) return;
                    interp.buffer.push( { t: performance.now(), x: p.x, y: p.y, z: p.z, vx: p.vx } );
                    if ( interp.buffer.length > 120 ) interp.buffer.shift(); // trim to ~1s @ 20Hz
                }
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
            offAdd();
            offRemove();
            for ( const off of detach ) off();
            for ( const e of byId.values() ) e.destroy();
            byId.clear();
        };
    }, [ room, predictor ] );

    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 75, position: [ 0, 5, -13 ] } }>
                <color attach="background" args={ [ '#05060a' ] } />
                <ambientLight intensity={ 0.5 } />
                <NetLoop predictor={ predictor } />
                <Track />
                <Scenery count={ 50 } seed={ room.state.seed || 1234 } />
                <Ships />
            </Canvas>
            { import.meta.env.DEV && <NetDebugHud /> }
        </WorldProvider>
    );
}
