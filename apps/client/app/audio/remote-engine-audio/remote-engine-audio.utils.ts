import type { Entity } from 'koota';
import type * as THREE from 'three';
import { Render } from '../../game/ecs/traits';
import { getContext } from '../audio-engine';
import { attachPositionalLoop, detachPositional } from '../positional';
import { ENGINE_LOOP } from '../sfx-map';

export interface Emitter {
    audio: THREE.PositionalAudio;
    filter: BiquadFilterNode;
    z: number;
    vz: number;
    armed: boolean;
}

export function syncEmitters( remotes: readonly Entity[], map: Map< number, Emitter > ): void {
    const present = new Set( remotes.map( ( e ) => e.id() ) );
    for ( const [ id, em ] of map ) {
        if ( ! present.has( id ) ) {
            detachPositional( em.audio );
            map.delete( id );
        }
    }
    const ctx = getContext();
    if ( ! ctx ) return;
    for ( const e of remotes ) {
        if ( map.has( e.id() ) ) continue;
        const grp = e.get( Render );
        if ( ! grp ) continue;
        const audio = attachPositionalLoop( grp, ENGINE_LOOP.name, { volume: 0.32, refDistance: 12 } );
        if ( ! audio ) continue;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.Q.value = 0.7;
        audio.setFilter( filter );
        map.set( e.id(), { audio, filter, z: grp.position.z, vz: 0, armed: true } );
    }
}
