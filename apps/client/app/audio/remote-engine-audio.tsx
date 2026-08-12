import { useThree } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useQuery } from 'koota/react';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { Remote, Render } from '../game/ecs/traits';
import { loadSample } from './audio-engine';
import { attachPositionalLoop, detachPositional, ensureListener } from './positional';

// ── Positional engine hum for REMOTE ships. ──────────────────────────────────────────────────────────────
// Uses the positional helper: a looping CC0 engine sample attached as a child of each remote ship's Render
// group, panned/attenuated by the camera-listener. This is the "hear where a rival is" signal (AUDIO.md §5).
// Lifetime == the ship ENTITY (r3f.md sanctions R3F-owned positional audio): useQuery re-renders only on a
// remote spawn/despawn, and we diff the live set into attach/detach — never per frame, never on movement
// (three updates the panner from the group's world transform at render time on its own).
//
// NOTE: this is the one piece not hear-verified (built + typechecked only). It is graceful (no buffer →
// no-op) and low-volume; `M` mutes everything, and it can be removed from net-canvas without touching the
// rest of the audio subsystem.
const LOOP_NAME = 'engineLoop';
const LOOP_URL = '/audio/sfx/engine_loop.ogg';

// Diff the live remote set into the emitter map: detach departed ships, attach positional loops to new ones.
// Extracted from the effect to keep it simple (cognitive-complexity budget).
function syncEmitters( remotes: readonly Entity[], map: Map< number, THREE.PositionalAudio > ): void {
    const present = new Set( remotes.map( ( e ) => e.id() ) );
    for ( const [ id, audio ] of map ) {
        if ( ! present.has( id ) ) {
            detachPositional( audio );
            map.delete( id );
        }
    }
    for ( const e of remotes ) {
        if ( map.has( e.id() ) ) continue;
        const grp = e.get( Render );
        if ( ! grp ) continue;
        const audio = attachPositionalLoop( grp, LOOP_NAME, { volume: 0.32, refDistance: 12 } );
        if ( audio ) map.set( e.id(), audio );
    }
}

export function RemoteEngineAudio() {
    const remotes = useQuery( Remote, Render );
    const camera = useThree( ( s ) => s.camera );
    const [ ready, setReady ] = useState( false );
    const active = useRef( new Map< number, THREE.PositionalAudio >() );

    // JUSTIFIED EFFECT — syncs with TWO external systems: the three.js object graph (parenting the shared
    // AudioListener to this Canvas's camera) and the Web Audio decode pipeline (fetch → decodeAudioData).
    //  1) render-derivation? no — parenting is a scene-graph MUTATION and the decode is async I/O; neither is
    //     a value that can be computed from props during render.
    //  2) event handler? no — nothing user-initiated triggers it; the listener must exist as soon as this
    //     component is in the tree, independent of input.
    //  3) loader/action data? no — `ensureListener` needs the R3F camera, which only exists INSIDE the Canvas,
    //     and this is a Canvas child, not a route module. (A loader could prefetch the .ogg, but that would be
    //     an optimisation on top of `loadSample`'s cache — it could not do the parenting.)
    //  4) ref/module singleton? both resources ALREADY are: the AudioContext + buffer cache live on
    //     audio-engine module singletons (not component state — deliberately not the S2 bug), and `loadSample`
    //     is idempotent. What a ref CANNOT do is the second job here — flipping `ready` so the diff effect
    //     below re-runs once the buffer exists. That needs a render, so it needs state.
    //  5) external sync? YES — three.js graph + Web Audio. VERDICT: keep. The `live` flag drops the setState
    //     if the decode resolves after unmount; the cleanup deliberately does NOT remove the listener, since
    //     `camera.add` reparents it and the engine graph outlives this component.
    useEffect( () => {
        let live = true;
        ensureListener( camera );
        void loadSample( LOOP_NAME, LOOP_URL ).then( () => {
            if ( live ) setReady( true );
        } );
        return () => {
            live = false;
        };
    }, [ camera ] );

    // JUSTIFIED EFFECT — syncs the ECS remote set INTO the three.js scene graph: attach a positional loop to
    // each newly-spawned remote ship, detach departed ones. Never per frame, and never on movement (three
    // re-reads the panner from the group's world transform at render time by itself).
    //
    // How OFTEN this re-runs is not the load-bearing property — `syncEmitters` is fully IDEMPOTENT. It skips
    // any id already in the map and only detaches ids no longer present, so running it more often than
    // strictly necessary attaches and stops nothing. That is what makes it safe to key on `remotes`, whose
    // array identity (not the ship set) decides when the effect fires.
    //  1) render-derivation? no — `obj.add(audio)` / `removeFromParent()` are mutations of a graph React does
    //     not own; running them during render would be a side effect in render, and the Render group may not
    //     be committed yet.
    //  2) event handler? no — membership changes arrive as a koota query re-render, not a DOM/user event.
    //  3) loader/action data? no — live ECS membership for the current scene, not navigation-time data.
    //  4) ref/module singleton? the emitter map IS a ref (`active`) precisely so this never re-renders. But a
    //     ref cannot schedule anything: the diff has to run when the query result changes and AFTER commit,
    //     which is what an effect provides.
    //  5) external sync? YES — ECS → three.js. VERDICT: keep. Deliberately has NO TEARDOWN cleanup — only a
    //     teardown carries the consequence: it would run on every re-fire, detaching and re-attaching EVERY
    //     remote emitter whenever any ship joined or left. That is audible, not just wasteful, because
    //     `detachPositional` stops and disconnects the node and re-attaching constructs a NEW PositionalAudio
    //     and calls play() — so every rival's engine loop would restart from zero. Unmount teardown lives in
    //     the separate mount-scoped effect below, which is the only reason that one exists.
    useEffect( () => {
        if ( ready ) syncEmitters( remotes, active.current );
    }, [ remotes, ready ] );

    // JUSTIFIED EFFECT — releases external resources at unmount: stop + detach + disconnect every
    // PositionalAudio node this component parented into the scene graph. The engine graph itself persists (it
    // is a module singleton); only these emitters go.
    //  1) render-derivation? no — this produces no value at all, it only frees external nodes.
    //  2) event handler? no — unmount is not an event we can hook any other way.
    //  3) loader/action data? no — teardown of a live audio graph, unrelated to navigation data.
    //  4) ref/module singleton? the map is a ref, and that is the point: refs have NO unmount hook, so an
    //     effect cleanup is the only mechanism React offers for releasing what a ref accumulated. `map` is
    //     captured once and is safe to capture, because `active.current` is a stable Map that is never
    //     reassigned — so this closes over the same instance the diff effect above writes into.
    //  5) external sync? YES — Web Audio / three.js nodes that leak if not disconnected.
    //  VERDICT: keep, and it CANNOT be folded into the diff effect above: `[]` here means unmount-only, while
    //  that effect's deps are `[remotes, ready]`, so sharing its cleanup would tear down every emitter on
    //  every spawn/despawn. Two effects because they have two different lifetimes, not by oversight.
    useEffect( () => {
        const map = active.current;
        return () => {
            for ( const audio of map.values() ) detachPositional( audio );
            map.clear();
        };
    }, [] );

    return null;
}
