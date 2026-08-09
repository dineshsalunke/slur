import { getStateCallbacks } from '@colyseus/sdk';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { INPUT_MESSAGE, makeTrack, SET_CLASS_MESSAGE, SHIP_ORDER } from '@slur/shared';
import type { Entity } from 'koota';
import { WorldProvider } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import { copyShip, createPredictor } from '../net/prediction';
import { useRoom } from '../net/room-context';
import { Interp, LocalPlayer, Net, Prev, Remote, Render, Sim } from './ecs/traits';
import { world } from './ecs/world';
import { attachKeyboard } from './input/keyboard';
import { NetDebugHud } from './net-debug-hud';
import { NetLoop } from './net-loop';
import { ExplosionField } from './scene/explosions';
import { FinishGate } from './scene/finish-gate';
import { Scenery } from './scene/scenery';
import { Ships } from './scene/ship';
import { TrackView } from './scene/track-view';

// Send buffered inputs at 30Hz (not per render frame) — the batched sender drains every input
// produced since the last send; the server drains them 1-per-tick, so cadence is a bandwidth knob.
const INPUT_SEND_MS = 1000 / 30;

// Mirror a class hot-swap into the ECS ONLY when shipId actually changes (not every 20Hz patch), so the
// ship view re-renders its model on a swap, not continuously.
function mirrorShipId( ent: Entity, sessionId: string, shipId: string ): void {
    const cur = ent.get( Net );
    if ( cur && cur.shipId !== shipId ) ent.set( Net, { sessionId, shipId } );
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

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard → a Colyseus message. Dev class
    // hot-swap (keys 1..5) requests a ship; the SERVER validates + owns the change (never client-owned),
    // then patches shipId back so the sim/camera/bank/model re-resolve.
    //  1) render-derivation? no — a discrete keypress is not derivable from render state.
    //  2) event handler? this IS the handler; the effect only brackets its window-listener lifetime.
    //  3) loader/action data? no — a live per-keystroke intent, not navigation data.
    //  4) ref/module singleton? the room is loader-owned (read via useRoom); only the listener needs a
    //     mount-scoped lifetime. 5) external sync? YES — DOM keydown → room.send. VERDICT: keep.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            const n = Number( e.key );
            if ( n >= 1 && n <= SHIP_ORDER.length ) room.send( SET_CLASS_MESSAGE, SHIP_ORDER[ n - 1 ] );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

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
            const net = { sessionId: sid, shipId: p.shipId };
            const e = isLocal
                ? world.spawn( Render, Net( net ), Sim, Prev, LocalPlayer )
                : world.spawn( Render, Net( net ), Remote, Interp );
            byId.set( sid, e );

            if ( isLocal ) {
                const s = e.get( Sim );
                if ( s ) copyShip( s, p ); // seed prediction from the authoritative spawn
            }

            const offChange = $( p ).onChange( () => {
                const ent = byId.get( sid );
                if ( ! ent ) return;
                mirrorShipId( ent, sid, p.shipId );
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
                <ambientLight intensity={ 1 } />
                <NetLoop predictor={ predictor } track={ track } />
                { /* After NetLoop so its useFrame (ship-position sync) runs first — the burst reads each
                     ship's Render group AFTER it's positioned, spawning at the exact derezz spot. */ }
                <ExplosionField />
                <TrackView track={ track } />
                <FinishGate track={ track } />
                <Scenery count={ 50 } seed={ seed } />
                <Ships />
                <EffectComposer multisampling={ 0 }>
                    <Bloom mipmapBlur intensity={ 0.5 } luminanceThreshold={ 0.6 } luminanceSmoothing={ 0.2 } />
                </EffectComposer>
            </Canvas>
            { import.meta.env.DEV && <NetDebugHud track={ track } /> }
        </WorldProvider>
    );
}
