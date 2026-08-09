import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { makeTrack, SET_CLASS_MESSAGE, SHIP_ORDER, USE_POWERUP_MESSAGE } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { useEffect, useMemo, useRef } from 'react';
import { attachRoomToWorld } from '../net/attach-room-to-world';
import { createPredictor } from '../net/prediction';
import { useRoom } from '../net/room-context';
import { world } from './ecs/world';
import { attachKeyboard } from './input/keyboard';
import { NetDebugHud } from './net-debug-hud';
import { NetLoop } from './net-loop';
import { ExplosionField } from './scene/explosions';
import { FinishGate } from './scene/finish-gate';
import { HitSpark } from './scene/hit-spark';
import { PickupField } from './scene/pickup-field';
import { ProjectileField } from './scene/projectile-field';
import { Scenery } from './scene/scenery';
import { Ships } from './scene/ship';
import { TrackView } from './scene/track-view';

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

    // JUSTIFIED EFFECT — syncs with an external system: DOM keyboard (E) → a discrete Colyseus fire message.
    // The SERVER validates + spawns the authoritative projectile (the client never predicts a bolt); firing is
    // a reliable one-shot, NOT an input axis (an axis would machine-gun). `e.repeat` is ignored so holding E
    // fires once. Same external-sync shape as the keys-1–5 hot-swap above.
    //  1) render-derivation? no — a discrete keypress isn't derivable from render state.
    //  2) event handler? this IS the handler; the effect only brackets its window-listener lifetime.
    //  3) loader/action data? no — a live per-keystroke intent, not navigation data.
    //  4) ref/module singleton? the room is loader-owned (useRoom); only the listener needs a mount lifetime.
    //  5) external sync? YES — DOM keydown → room.send. VERDICT: keep.
    useEffect( () => {
        const onKey = ( e: KeyboardEvent ) => {
            if ( e.code === 'KeyE' && ! e.repeat ) room.send( USE_POWERUP_MESSAGE );
        };
        addEventListener( 'keydown', onKey );
        return () => removeEventListener( 'keydown', onKey );
    }, [ room ] );

    // JUSTIFIED EFFECT — syncs with an external system: the Colyseus room (schema callbacks) → ECS, plus
    // a 30Hz input-send timer. The wiring itself lives in attachRoomToWorld (net/) so this parent stays
    // free of the dense reconcile (and so the S5 projectile reconcile has a home); the effect only brackets
    // that subscription's mount-scoped lifetime.
    //  1) render-derivation? no — schema mutations arrive over the wire outside React; nothing to derive.
    //  2) event handler? no DOM/user event — these are network callbacks; attachRoomToWorld registers them.
    //  3) loader/action data? no — the loader OWNS the room (S2 lesson); this only SUBSCRIBES to its live
    //     stream. Moving room ownership here would be the create→leave→dispose churn bug; we never do that.
    //  4) ref/module singleton? the room is already a module-singleton/loader-owned resource (we only read
    //     it via useRoom); the onAdd/onChange registrations + send timer need mount-scoped teardown so we
    //     stop spawning ECS entities and sending inputs when this Canvas unmounts.
    //  5) external sync? YES — Colyseus schema callbacks + a timer. VERDICT: keep. Subscribes (does NOT
    //     own) the room and mirrors its player set into the ECS; the returned teardown only detaches
    //     callbacks and clears the timer — it never touches the connection. No cheaper idiom bridges a live
    //     wire stream. Deps: [room, predictor] only — world is a module singleton and trackRef a stable ref
    //     (read via .current), so listing them would needlessly tear down + re-subscribe the room wiring.
    useEffect( () => attachRoomToWorld( room, world, predictor, trackRef ), [ room, predictor ] );

    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 75, position: [ 0, 5, -13 ] } }>
                <color attach="background" args={ [ '#05060a' ] } />
                <ambientLight intensity={ 1 } />
                <NetLoop predictor={ predictor } track={ track } />
                { /* After NetLoop so its useFrame (ship-position sync) runs first — the burst reads each
                     ship's Render group AFTER it's positioned, spawning at the exact derezz spot. */ }
                <ExplosionField />
                <HitSpark />
                <TrackView track={ track } />
                <FinishGate track={ track } />
                <Scenery count={ 50 } seed={ seed } />
                <PickupField room={ room } seed={ seed } />
                <ProjectileField />
                <Ships />
                <EffectComposer multisampling={ 0 }>
                    <Bloom mipmapBlur intensity={ 0.5 } luminanceThreshold={ 0.6 } luminanceSmoothing={ 0.2 } />
                </EffectComposer>
            </Canvas>
            { import.meta.env.DEV && <NetDebugHud track={ track } /> }
        </WorldProvider>
    );
}
