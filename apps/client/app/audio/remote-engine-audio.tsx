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

    // Park the listener on the camera + decode the loop once; flip `ready` so the diff effect can attach.
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

    // Diff the live remote set → attach a positional loop to new ships, detach departed ones. Re-runs on
    // spawn/despawn (remotes) and once the sample decodes (ready).
    useEffect( () => {
        if ( ready ) syncEmitters( remotes, active.current );
    }, [ remotes, ready ] );

    // Detach everything when the scene unmounts (the engine graph persists; only these emitters go).
    useEffect( () => {
        const map = active.current;
        return () => {
            for ( const audio of map.values() ) detachPositional( audio );
            map.clear();
        };
    }, [] );

    return null;
}
