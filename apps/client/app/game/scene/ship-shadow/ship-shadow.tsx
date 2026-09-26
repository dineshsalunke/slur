import { useFrame } from '@react-three/fiber';
import { tuningForShip } from '@slur/shared';
import type { Entity } from 'koota';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../../dev/tuning';
import { Render } from '../../ecs/traits';
import { useTrack } from '../../track-context/use-track';
import { isDead } from '../ship-dead';
import { FRAGMENT, VERTEX } from './ship-shadow.constants';
import { floorBelow } from './ship-shadow.utils';

export function ShipShadow( { entity, shipId }: { entity: Entity; shipId: string } ) {
    const track = useTrack();
    const meshRef = useRef< THREE.Mesh >( null );
    const tinted = useRef( '' );
    const uniforms = useMemo(
        () => ( {
            uColor: { value: new THREE.Color( col( 'Shadow.color' ) ) },
            uOpacity: { value: num( 'Shadow.opacity' ) },
            uSoftness: { value: num( 'Shadow.softness' ) },
        } ),
        [],
    );

    useFrame( () => {
        const mesh = meshRef.current;
        const grp = entity.get( Render );
        if ( ! mesh || ! grp ) return;

        const { x, y, z } = grp.position;
        const floor = floorBelow( track, x, y, z );
        if ( floor === null || isDead( entity ) ) {
            mesh.visible = false;
            return;
        }

        const height = Math.max( 0, y - floor );
        const reach = num( 'Shadow.reach' );
        if ( height > reach ) {
            mesh.visible = false;
            return;
        }

        const halfW = tuningForShip( shipId ).halfW;
        const radius = halfW * ( num( 'Shadow.size' ) + height * num( 'Shadow.spread' ) );
        const falloff = 1 - height / reach;

        mesh.visible = true;
        mesh.position.set( x, floor + num( 'Shadow.lift' ), z );
        mesh.scale.set( radius, radius, 1 );

        const tint = col( 'Shadow.color' );
        if ( tint !== tinted.current ) {
            uniforms.uColor.value.set( tint );
            tinted.current = tint;
        }
        uniforms.uOpacity.value = num( 'Shadow.opacity' ) * falloff * falloff;
        uniforms.uSoftness.value = Math.max( 0.3, num( 'Shadow.softness' ) / ( 1 + height * num( 'Shadow.blur' ) ) );
    } );

    return (
        <mesh ref={ meshRef } rotation={ [ -Math.PI / 2, 0, 0 ] }>
            <planeGeometry args={ [ 2, 2 ] } />
            <shaderMaterial
                vertexShader={ VERTEX }
                fragmentShader={ FRAGMENT }
                uniforms={ uniforms }
                transparent
                depthWrite={ false }
            />
        </mesh>
    );
}
