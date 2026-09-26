import { useFrame, useThree } from '@react-three/fiber';
import { tuningForShip } from '@slur/shared';
import { useQuery, useWorld } from 'koota/react';
import { useEffect, useRef, useState } from 'react';
import { Interp, LocalPlayer, Net, Remote, Render, Sim } from '../../game/ecs/traits';
import { getContext, loadSample } from '../audio-engine';
import { engineParams, engineVoice } from '../engine-voice';
import { passByEdge } from '../movement-edges';
import { detachPositional, ensureListener } from '../positional';
import { ENGINE_LOOP, playSfx } from '../sfx-map';
import { SMOOTH_S, VZ_TAU_S } from './remote-engine-audio.constants';
import { mine, params, theirs } from './remote-engine-audio.state';
import { type Emitter, syncEmitters } from './remote-engine-audio.utils';

export function RemoteEngineAudio() {
    const world = useWorld();
    const remotes = useQuery( Remote, Render );
    const camera = useThree( ( s ) => s.camera );
    const [ ready, setReady ] = useState( false );
    const active = useRef( new Map< number, Emitter >() );

    // Syncs with Web Audio and the three.js camera: attaches the listener and loads the engine loop sample.
    useEffect( () => {
        let live = true;
        ensureListener( camera );
        void loadSample( ENGINE_LOOP.name, ENGINE_LOOP.file ).then( () => {
            if ( live ) setReady( true );
        } );
        return () => {
            live = false;
        };
    }, [ camera ] );

    // Syncs the ECS remote ships into the three.js scene graph: one positional engine loop per remote ship.
    useEffect( () => {
        if ( ready ) syncEmitters( remotes, active.current );
    }, [ remotes, ready ] );

    // Releases Web Audio at unmount: detaches and disconnects every positional engine loop.
    useEffect( () => {
        const map = active.current;
        return () => {
            for ( const em of map.values() ) detachPositional( em.audio );
            map.clear();
        };
    }, [] );

    useFrame( ( _s, dt ) => {
        const map = active.current;
        const ctx = getContext();
        if ( map.size === 0 || ! ctx || dt <= 0 ) return;
        const me = world.queryFirst( Sim, LocalPlayer )?.get( Sim );
        const now = ctx.currentTime;
        const k = 1 - Math.exp( -dt / VZ_TAU_S );
        world.query( Remote, Render, Net, Interp ).readEach( ( [ grp, net, interp ], e ) => {
            const em = map.get( e.id() );
            if ( ! em ) return;
            const max = tuningForShip( net.shipId ).maxCruise;
            const raw = ( grp.position.z - em.z ) / dt;
            em.z = grp.position.z;
            em.vz += ( Math.min( Math.max( raw, -max ), 1.5 * max ) - em.vz ) * k;
            const p = engineParams( max > 0 ? em.vz / max : 0, engineVoice( net.shipId ), params );
            em.audio.setPlaybackRate( p.rate );
            em.filter.frequency.setTargetAtTime( p.cutoff, now, SMOOTH_S );
            const dead = interp.buffer[ interp.buffer.length - 1 ]?.dead ?? false;
            if ( ! me || me.dead || dead ) return;
            mine.x = me.x;
            mine.z = me.z;
            mine.vz = me.vz;
            theirs.x = grp.position.x;
            theirs.z = grp.position.z;
            theirs.vz = em.vz;
            if ( passByEdge( em, mine, theirs ) ) playSfx( 'passBy' );
        } );
    } );

    return null;
}
