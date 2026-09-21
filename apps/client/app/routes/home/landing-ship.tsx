import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useRef } from 'react';
import type { Group } from 'three';
import { LocalPlayer, Sim } from '../../game/ecs/traits';
import { guardLfsPointer } from '../../game/scene/gltf-lfs-guard';
import { shipVisual } from '../../game/scene/ship-visuals';

const HERO_SHIP = 'challenger';
useGLTF.preload( shipVisual( HERO_SHIP ).url, undefined, undefined, guardLfsPointer );

const AHEAD = 7;
const REST_Y = 1.2;
const BOB_AMP = 0.35;
const BOB_HZ = 0.45;
const BANK = 0.16;
const TWO_PI = Math.PI * 2;

export function LandingShip() {
    const world = useWorld();
    const ref = useRef< Group >( null );
    const v = shipVisual( HERO_SHIP );
    const { scene } = useGLTF( v.url, undefined, undefined, guardLfsPointer );

    useFrame( ( state ) => {
        const grp = ref.current;
        if ( ! grp ) return;
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const z = ( sim ? sim.z : 0 ) + AHEAD;
        const phase = state.clock.elapsedTime * BOB_HZ * TWO_PI;
        grp.position.set( 0, REST_Y + Math.sin( phase ) * BOB_AMP, z );
        grp.rotation.z = Math.cos( phase ) * BANK;
    } );

    return (
        <group ref={ ref }>
            <Clone object={ scene } scale={ v.scale * 2 } position={ [ 0, v.lift, 0 ] } rotation={ v.facing } />
        </group>
    );
}
