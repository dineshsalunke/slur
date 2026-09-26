import { useFrame } from '@react-three/fiber';
import { spanHasZ, type Track, tuningForShip } from '@slur/shared';
import type { Entity } from 'koota';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { Interp, Render, Sim } from '../ecs/traits';
import { useTrack } from '../track-context/use-track';

const VERTEX = `
varying vec2 vShadowUv;
void main() {
    vShadowUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const FRAGMENT = `
uniform vec3 uColor;
uniform float uOpacity;
uniform float uSoftness;
varying vec2 vShadowUv;
void main() {
    float d = length( vShadowUv * 2.0 - 1.0 );
    float a = pow( max( 0.0, 1.0 - d ), uSoftness );
    gl_FragColor = vec4( uColor, a * uOpacity );
}
`;

function floorBelow( track: Track, x: number, y: number, z: number ): number | null {
    const seg = track.segmentAtZ( z );
    let best: number | null = null;
    for ( const f of seg.floors ) {
        if ( ! spanHasZ( seg, f, z ) ) continue;
        if ( x < f.x0 || x > f.x1 ) continue;
        if ( f.y > y + 1e-3 ) continue;
        if ( best === null || f.y > best ) best = f.y;
    }
    return best;
}

function isDead( entity: Entity ): boolean {
    const sim = entity.get( Sim );
    if ( sim ) return sim.dead;
    const buf = entity.get( Interp )?.buffer;
    return buf !== undefined && buf.length > 0 && buf[ buf.length - 1 ].dead;
}

export function ShipShadow( { entity, shipId }: { entity: Entity; shipId: string } ) {
    const track = useTrack();
    const meshRef = useRef< THREE.Mesh >( null );
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

        uniforms.uColor.value.set( col( 'Shadow.color' ) );
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
