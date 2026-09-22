import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { Interp, Sim } from '../ecs/traits';
import { accent } from './accent';
import { guardLfsPointer } from './gltf-lfs-guard';
import { GRAPHITE_ALBEDO, GRAPHITE_METALNESS, GRAPHITE_ROUGHNESS } from './graphite';
import { SHIP_VISUALS, shipVisual } from './ship-visuals';

for ( const v of Object.values( SHIP_VISUALS ) ) {
    useGLTF.preload( v.url, undefined, undefined, guardLfsPointer );
}

const DISSOLVE_DURATION = 0.7;
const DISSOLVE_NOISE_SCALE = 1.8;
const DISSOLVE_EDGE_WIDTH = 0.09;
const DISSOLVE_EDGE_INTENSITY = 2.6;

interface DissolveUniforms {
    uDissolve: { value: number };
    uNoiseScale: { value: number };
    uEdgeWidth: { value: number };
    uEdgeColor: { value: THREE.Color };
    uEdgeIntensity: { value: number };
}

const DISSOLVE_FRAG_HEAD = `
uniform float uDissolve;
uniform float uNoiseScale;
uniform float uEdgeWidth;
uniform vec3 uEdgeColor;
uniform float uEdgeIntensity;
varying vec3 vDissolvePos;
float dsvHash( vec3 p ) { return fract( sin( dot( p, vec3( 127.1, 311.7, 74.7 ) ) ) * 43758.5453123 ); }
float dsvNoise( vec3 x ) {
    vec3 i = floor( x ); vec3 f = fract( x ); f = f * f * ( 3.0 - 2.0 * f );
    return mix(
        mix( mix( dsvHash( i + vec3( 0., 0., 0. ) ), dsvHash( i + vec3( 1., 0., 0. ) ), f.x ),
             mix( dsvHash( i + vec3( 0., 1., 0. ) ), dsvHash( i + vec3( 1., 1., 0. ) ), f.x ), f.y ),
        mix( mix( dsvHash( i + vec3( 0., 0., 1. ) ), dsvHash( i + vec3( 1., 0., 1. ) ), f.x ),
             mix( dsvHash( i + vec3( 0., 1., 1. ) ), dsvHash( i + vec3( 1., 1., 1. ) ), f.x ), f.y ), f.z );
}
`;

const DISSOLVE_DISCARD = `
    float dsvN = dsvNoise( vDissolvePos * uNoiseScale );
    if ( uDissolve > 0.001 && dsvN < uDissolve ) discard;
`;

const DISSOLVE_EDGE = `
    if ( uDissolve > 0.001 ) {
        float dsvEdge = 1.0 - smoothstep( uDissolve, uDissolve + uEdgeWidth, dsvN );
        gl_FragColor.rgb += uEdgeColor * dsvEdge * uEdgeIntensity;
    }
`;

function patchDissolve( mat: THREE.Material, uniforms: DissolveUniforms ): void {
    if ( mat.userData.dissolvePatched ) return;
    mat.userData.dissolvePatched = true;
    mat.onBeforeCompile = ( shader ) => {
        shader.uniforms.uDissolve = uniforms.uDissolve;
        shader.uniforms.uNoiseScale = uniforms.uNoiseScale;
        shader.uniforms.uEdgeWidth = uniforms.uEdgeWidth;
        shader.uniforms.uEdgeColor = uniforms.uEdgeColor;
        shader.uniforms.uEdgeIntensity = uniforms.uEdgeIntensity;
        shader.vertexShader = `varying vec3 vDissolvePos;\n${ shader.vertexShader }`.replace(
            '#include <begin_vertex>',
            '#include <begin_vertex>\n\tvDissolvePos = position;',
        );
        shader.fragmentShader = ( DISSOLVE_FRAG_HEAD + shader.fragmentShader )
            .replace(
                '#include <clipping_planes_fragment>',
                `#include <clipping_planes_fragment>${ DISSOLVE_DISCARD }`,
            )
            .replace( '#include <dithering_fragment>', `#include <dithering_fragment>${ DISSOLVE_EDGE }` );
    };
    mat.needsUpdate = true;
}

function applyGraphite( mat: THREE.Material ): void {
    const std = mat as THREE.MeshStandardMaterial;
    if ( ! std.isMeshStandardMaterial || std.emissive.getHex() !== 0 ) return;
    std.color.set( GRAPHITE_ALBEDO );
    std.metalness = GRAPHITE_METALNESS;
    std.roughness = GRAPHITE_ROUGHNESS;
}

function isDead( entity: Entity ): boolean {
    const sim = entity.get( Sim );
    if ( sim ) return sim.dead;
    const buf = entity.get( Interp )?.buffer;
    return buf !== undefined && buf.length > 0 && buf[ buf.length - 1 ].dead;
}

export function ShipModel( { entity, shipId }: { entity: Entity; shipId: string } ) {
    const v = shipVisual( shipId );
    const { scene } = useGLTF( v.url, undefined, undefined, guardLfsPointer );
    const cloneRef = useRef< THREE.Group >( null );
    const patched = useRef( false );
    const uniforms = useMemo< DissolveUniforms >(
        () => ( {
            uDissolve: { value: 0 },
            uNoiseScale: { value: DISSOLVE_NOISE_SCALE },
            uEdgeWidth: { value: DISSOLVE_EDGE_WIDTH },
            uEdgeColor: { value: accent() },
            uEdgeIntensity: { value: DISSOLVE_EDGE_INTENSITY },
        } ),
        [],
    );

    useFrame( ( _state, delta ) => {
        const grp = cloneRef.current;
        if ( ! grp ) return;
        if ( ! patched.current ) {
            grp.traverse( ( o ) => {
                const mesh = o as THREE.Mesh;
                if ( ! mesh.isMesh ) return;
                const mats = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
                for ( const mat of mats ) {
                    applyGraphite( mat );
                    patchDissolve( mat, uniforms );
                }
            } );
            patched.current = true;
        }
        const target = isDead( entity ) ? 1 : 0;
        const u = uniforms.uDissolve;
        const step = delta / DISSOLVE_DURATION;
        if ( u.value < target ) u.value = Math.min( target, u.value + step );
        else if ( u.value > target ) u.value = Math.max( target, u.value - step );
    } );

    return (
        <Clone
            ref={ cloneRef }
            object={ scene }
            deep="materialsOnly"
            position={ [ 0, v.lift, 0 ] }
            scale={ v.scale }
            rotation={ v.facing }
        />
    );
}
