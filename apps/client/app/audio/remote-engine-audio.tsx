import { useThree } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useQuery } from 'koota/react';
import { useEffect, useRef, useState } from 'react';
import type * as THREE from 'three';
import { Remote, Render } from '../game/ecs/traits';
import { loadSample } from './audio-engine';
import { attachPositionalLoop, detachPositional, ensureListener } from './positional';

const LOOP_NAME = 'engineLoop';
const LOOP_URL = '/audio/sfx/engine_loop.ogg';

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
    useEffect( () => {
        if ( ready ) syncEmitters( remotes, active.current );
    }, [ remotes, ready ] );

    // JUSTIFIED EFFECT — releases external resources at unmount: stop + detach + disconnect every
    useEffect( () => {
        const map = active.current;
        return () => {
            for ( const audio of map.values() ) detachPositional( audio );
            map.clear();
        };
    }, [] );

    return null;
}
