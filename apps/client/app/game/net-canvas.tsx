import { getStateCallbacks } from '@colyseus/sdk';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { createFixedStep, FIXED_DT, INPUT_MESSAGE, makeTrack, type Track as TrackHandle } from '@slur/shared';
import type { Entity } from 'koota';
import { useWorld, WorldProvider } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import type { PerspectiveCamera } from 'three';
import { copyShip, createPredictor, type Predictor } from '../net/prediction';
import { useRoom } from '../net/room-context';
import { updateChaseCamera } from './camera/chase';
import { localDeathVfxSystem, netFlightSystem, remoteInterpSystem } from './ecs/net-systems';
import { syncRenderSystem } from './ecs/systems';
import { Interp, LocalPlayer, Net, Prev, Remote, Render, Sim } from './ecs/traits';
import { world } from './ecs/world';
import { attachKeyboard } from './input/keyboard';
import { FinishGate } from './scene/finish-gate';
import { Scenery } from './scene/scenery';
import { Ships } from './scene/ship';
import { TrackView } from './scene/track-view';

// Send buffered inputs at 30Hz (not per render frame) — the batched sender drains every input
// produced since the last send; the server drains them 1-per-tick, so cadence is a bandwidth knob.
const INPUT_SEND_MS = 1000 / 30;

// The ONE networked loop: local predict (fixed-60, records pending) → interpolate local (prev→sim)
// → interpolate remotes (buffered snapshots) → chase camera. Default priority keeps R3F auto-render on.
function NetLoop( { predictor, track }: { predictor: Predictor; track: TrackHandle } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );
    useFrame( ( state, delta ) => {
        const alpha = advance( delta, ( dt ) => netFlightSystem( world, dt, predictor, track ) );
        syncRenderSystem( world, alpha ); // local ship only (remotes have no Sim/Prev)
        remoteInterpSystem( world ); // remote ships (also hides derezzed remotes)
        localDeathVfxSystem( world ); // hide the local ship while derezzed
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );
    return null;
}

// Dev-only readout: polls room.state (200ms, not per-frame) so you can CONFIRM connectivity with a
// number. `players: 2` in both windows = same room, the fix works. `players: 1` in each = the two tabs
// landed in separate rooms (a different bug). ★ marks your own ship.
function NetDebugHud( { track }: { track: TrackHandle } ) {
    const room = useRoom();
    const world = useWorld();
    const ref = useRef< HTMLDivElement >( null );
    // JUSTIFIED EFFECT — syncs with external systems (Colyseus room.state + the ECS world) on a 150ms
    // timer, writing IMPERATIVELY into a DOM ref (textContent). NO setState → it never re-renders React.
    //  1) render-derivation? no — room.state / ECS Sim mutate OUTSIDE React and fire no re-render.
    //  2) event handler? no discrete event — it's a periodic sample of live external state.
    //  3) loader/action data? no — live per-frame telemetry, not navigation-time data.
    //  4) ref/module singleton? YES for the WRITE — we push straight into a DOM ref, React uninvolved;
    //     the effect's only job is to bracket the timer's start/stop to the HUD's mount.
    //  5) external sync? YES — a timer polling external stores. VERDICT: keep; imperative ref write, zero re-render.
    useEffect( () => {
        const id = setInterval( () => {
            const el = ref.current;
            if ( ! el ) return;
            const players: string[] = [];
            room.state.players.forEach( ( p, sid ) => {
                const me = sid === room.sessionId ? '★' : ' ';
                players.push(
                    `${ me } ${ sid.slice( 0, 4 ) }  x=${ p.x.toFixed( 1 ) } z=${ p.z.toFixed( 1 ) }${ p.connected ? '' : ' (gone)' }`,
                );
            } );
            const extra: string[] = [];
            // Local PREDICTED ship + what it's flying over — the diagnostic for "falls at ~120".
            const s = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
            if ( s && track ) {
                const seg = track.segmentAtZ( s.z );
                const K: Record< string, string > = { plain: '·', block: 'BLOCK', platform: 'PLATFM', gap: 'GAP', finish: 'FIN' };
                const ahead = [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => K[ track.segmentAtZ( s.z + n * 20 ).kind ] ?? '?' ).join( ' ' );
                extra.push(
                    `me y=${ s.y.toFixed( 2 ) } z=${ s.z.toFixed( 0 ) } grnd=${ s.grounded ? 1 : 0 } dead=${ s.dead ? 1 : 0 }`,
                    `over: seg${ seg.index } ${ seg.kind } floors=${ seg.floors.length }`,
                    `ahead: ${ ahead }`,
                );
            }
            el.textContent = [
                `room: ${ room.roomId }  (you: ${ room.sessionId.slice( 0, 4 ) })`,
                `players: ${ players.length }`,
                ...players,
                ...extra,
            ].join( '\n' );
        }, 150 );
        return () => clearInterval( id );
    }, [ room, world, track ] );
    return (
        <div
            ref={ ref }
            style={ {
                position: 'fixed',
                top: 8,
                left: 8,
                zIndex: 10,
                pointerEvents: 'none',
                font: '12px monospace',
                color: '#00ff88',
                background: 'rgba(0,0,0,0.6)',
                padding: '6px 8px',
                whiteSpace: 'pre',
                borderRadius: 4,
            } }
        />
    );
}

export function NetCanvas( { seed }: { seed: number } ) {
    const room = useRoom();
    const predictor = useMemo( createPredictor, [] );

    // The track is a pure function of the seed, which the route loader ALREADY waited to decode before
    // rendering us (run/route.tsx) — so it's a stable prop, correct from the first render, matching the
    // server's track. We build it ONCE here: no subscription, no reactive state at this Canvas-wrapping
    // parent (r3f.md: the root holds ZERO reactive subscriptions — a re-render here churns the whole
    // scene graph). Deriving from a prop, not room.state, is what fixes the stale-seed desync.
    const track = useMemo( () => makeTrack( seed ), [ seed ] );
    // Latest-track ref so the Colyseus subscription effect below can reconcile against the current
    // track WITHOUT listing it as a dependency (which would tear down + re-subscribe the room wiring).
    const trackRef = useRef( track );
    trackRef.current = track;

    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    //  1) render-derivation? no — key state is a global input stream, not derivable from render inputs.
    //  2) event handler? the listeners ARE the handlers; the effect only attaches/detaches them.
    //  3) loader/action data? no — RR data flows on navigation, not per-keystroke.
    //  4) ref/module singleton? the input buffer lives on a module singleton (keyboard.ts); only the
    //     window listener registration needs a mount/unmount lifetime, which a ref can't provide.
    //  5) external sync? YES — global DOM events. VERDICT: keep. Same window-keyboard sync as /solo — the
    //     add/removeEventListener pair must bracket the scene's presence; no cheaper idiom fits.
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — syncs with an external system: the Colyseus room (schema callbacks) → ECS, plus
    // a 30Hz input-send timer. onAdd spawns an entity (local = predicted, remote = interpolated);
    // per-player onChange reconciles the local ship or feeds a remote's interp buffer.
    //  1) render-derivation? no — schema mutations arrive over the wire outside React; nothing to derive.
    //  2) event handler? no DOM/user event — these are network callbacks; the effect registers them.
    //  3) loader/action data? no — the loader OWNS the room (S2 lesson); this only SUBSCRIBES to its live
    //     stream. Moving room ownership here would be the create→leave→dispose churn bug; we never do that.
    //  4) ref/module singleton? the room is already a module-singleton/loader-owned resource (we only read
    //     it via useRoom); the onAdd/onChange registrations + send timer need mount-scoped teardown so we
    //     stop spawning ECS entities and sending inputs when this Canvas unmounts.
    //  5) external sync? YES — Colyseus schema callbacks + a timer. VERDICT: keep. Subscribes (does NOT
    //     own) the room and mirrors its player set into the ECS; the cleanup only detaches callbacks and
    //     clears the timer — it never touches the connection. No cheaper idiom bridges a live wire stream.
    useEffect( () => {
        const $ = getStateCallbacks( room );
        const byId = new Map< string, Entity >();
        const detach: Array< () => void > = [];
        // Something over here

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
                    if ( s ) predictor.reconcile( s, p, trackRef.current );
                } else {
                    const interp = ent.get( Interp );
                    if ( ! interp ) return;
                    interp.buffer.push( { t: performance.now(), x: p.x, y: p.y, z: p.z, vx: p.vx, dead: p.dead } );
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
                <NetLoop predictor={ predictor } track={ track } />
                <TrackView track={ track } />
                <FinishGate track={ track } />
                <Scenery count={ 50 } seed={ seed } />
                <Ships />
                <EffectComposer multisampling={ 0 }>
                    <Bloom mipmapBlur intensity={ 1.2 } luminanceThreshold={ 0.6 } luminanceSmoothing={ 0.2 } />
                </EffectComposer>
            </Canvas>
            { import.meta.env.DEV && <NetDebugHud track={ track } /> }
        </WorldProvider>
    );
}
