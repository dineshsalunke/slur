import { useFrame } from '@react-three/fiber';
import { HALF_WIDTH } from '@slur/shared';
import { useWorld } from 'koota/react';
import { Fragment, useRef } from 'react';
import type * as THREE from 'three';
import { LocalPlayer, Sim } from '../ecs/traits';
import { MARIGOLD_EMISSIVE } from './track-materials';

export const BOUNCE_SKY_COLOR = '#2b3a4d';
export const BOUNCE_GROUND_COLOR = '#b2650f';
export const BOUNCE_INTENSITY = 1.2;

export const RAIL_GLOW_COLOR = MARIGOLD_EMISSIVE;
export const RAIL_GLOW_INTENSITY = 700;
export const RAIL_GLOW_DISTANCE = 170;
export const RAIL_GLOW_DECAY = 2;
export const RAIL_GLOW_LIFT = 1.5;
export const RAIL_GLOW_OFFSETS = [ 0, 55 ] as const;

const STATIONS = RAIL_GLOW_OFFSETS.flatMap( ( offset ) =>
    [ -1, 1 ].map( ( side ) => ( { offset, side, key: `${ offset }:${ side }` } ) ),
);

export function CorridorLight() {
    const world = useWorld();
    const lights = useRef< ( THREE.PointLight | null )[] >( [] );

    useFrame( () => {
        const z = world.queryFirst( LocalPlayer, Sim )?.get( Sim )?.z ?? 0;
        for ( let i = 0; i < STATIONS.length; i++ ) {
            const light = lights.current[ i ];
            if ( light ) light.position.z = z + STATIONS[ i ].offset;
        }
    } );

    return (
        <Fragment>
            <hemisphereLight args={ [ BOUNCE_SKY_COLOR, BOUNCE_GROUND_COLOR, BOUNCE_INTENSITY ] } />
            { STATIONS.map( ( station, i ) => (
                <pointLight
                    key={ station.key }
                    ref={ ( light ) => {
                        lights.current[ i ] = light;
                    } }
                    position={ [ station.side * HALF_WIDTH, RAIL_GLOW_LIFT, station.offset ] }
                    color={ RAIL_GLOW_COLOR }
                    intensity={ RAIL_GLOW_INTENSITY }
                    distance={ RAIL_GLOW_DISTANCE }
                    decay={ RAIL_GLOW_DECAY }
                />
            ) ) }
        </Fragment>
    );
}
