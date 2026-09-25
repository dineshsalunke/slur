import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { rebuildToken } from '../../dev/tuning-rebuild';
import { Interp, Sim } from '../ecs/traits';
import { accent } from './accent';
import { exhaustDrive } from './exhaust-drive';
import { guardLfsPointer } from './gltf-lfs-guard';
import { METAL_METALNESS, METAL_ROUGHNESS } from './metal';
import { type EngineGlow, engineIntensity, engineMaterial } from './ship-materials';
import { SHIP_VISUALS, shipVisual } from './ship-visuals';
import { cleanToMapRoughness } from './track-materials';
import { graphiteSurfaceParams, surfaceMaps, TEX_SPAN_X } from './track-texture';

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

const HULL_PROJECTION = `
#include <uv_vertex>
{
	vec3 hullAxis = abs( normal );
	vec3 hullP = position * length( modelMatrix[ 0 ].xyz );
	vec2 hullUv = hullAxis.y > max( hullAxis.x, hullAxis.z )
		? hullP.xz
		: ( hullAxis.x > hullAxis.z ? hullP.zy : hullP.xy );
	hullUv /= uHullTexSpan;
	#ifdef USE_NORMALMAP
	vNormalMapUv = hullUv;
	#endif
	#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = hullUv;
	#endif
	#ifdef USE_METALNESSMAP
	vMetalnessMapUv = hullUv;
	#endif
}
`;

const hullTexSpan = { value: TEX_SPAN_X };

function patchDissolve( mat: THREE.Material, uniforms: DissolveUniforms, hull: boolean ): void {
    if ( mat.userData.dissolvePatched ) return;
    mat.userData.dissolvePatched = true;
    mat.customProgramCacheKey = () => ( hull ? 'slur-ship-hull' : 'slur-ship' );
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
        if ( hull ) {
            shader.uniforms.uHullTexSpan = hullTexSpan;
            shader.vertexShader = `uniform float uHullTexSpan;\n${ shader.vertexShader }`.replace(
                '#include <uv_vertex>',
                HULL_PROJECTION,
            );
        }
        shader.fragmentShader = ( DISSOLVE_FRAG_HEAD + shader.fragmentShader )
            .replace(
                '#include <clipping_planes_fragment>',
                `#include <clipping_planes_fragment>${ DISSOLVE_DISCARD }`,
            )
            .replace( '#include <dithering_fragment>', `#include <dithering_fragment>${ DISSOLVE_EDGE }` );
    };
    mat.needsUpdate = true;
}

function hullMaterial( mat: THREE.Material ): THREE.MeshStandardMaterial | null {
    const std = mat as THREE.MeshStandardMaterial;
    if ( ! std.isMeshStandardMaterial || std.emissive.getHex() !== 0 ) return null;
    std.metalness = METAL_METALNESS;
    std.roughness = cleanToMapRoughness( METAL_ROUGHNESS );
    return std;
}

function dressHulls( hulls: THREE.MeshStandardMaterial[] ): void {
    const maps = surfaceMaps( graphiteSurfaceParams() );
    for ( const hull of hulls ) {
        hull.normalMap = maps.normalMap;
        hull.roughnessMap = maps.roughnessMap;
        hull.metalnessMap = maps.metalnessMap;
        hull.needsUpdate = true;
    }
}

interface ShipSurfaces {
    hulls: THREE.MeshStandardMaterial[];
    engines: THREE.MeshStandardMaterial[];
}

function collectSurfaces( grp: THREE.Group, uniforms: DissolveUniforms ): ShipSurfaces {
    const found: ShipSurfaces = { hulls: [], engines: [] };
    grp.traverse( ( o ) => {
        const mesh = o as THREE.Mesh;
        if ( ! mesh.isMesh ) return;
        const mats = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
        for ( const mat of mats ) {
            const hull = hullMaterial( mat );
            if ( hull ) found.hulls.push( hull );
            const engine = engineMaterial( mat );
            if ( engine ) found.engines.push( engine );
            patchDissolve( mat, uniforms, hull !== null );
        }
    } );
    return found;
}

const glow: EngineGlow = { idle: 0, cruise: 0 };

function driveEngines( engines: THREE.MeshStandardMaterial[], entity: Entity ): void {
    if ( engines.length === 0 ) return;
    glow.idle = num( 'Ship.engineIdle' );
    glow.cruise = num( 'Ship.engineCruise' );
    const intensity = engineIntensity( glow, exhaustDrive( entity ) );
    for ( const mat of engines ) mat.emissiveIntensity = intensity;
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
    const dressed = useRef( -1 );
    const surfaces = useRef< ShipSurfaces >( { hulls: [], engines: [] } );
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
            surfaces.current = collectSurfaces( grp, uniforms );
            patched.current = true;
        }
        if ( dressed.current !== rebuildToken() ) {
            dressed.current = rebuildToken();
            dressHulls( surfaces.current.hulls );
        }
        const base = col( 'Metal.baseColor' );
        const envMapIntensity = num( 'Ship.envMapIntensity' );
        const normalScale = num( 'Deck.normalScale' );
        for ( const hull of surfaces.current.hulls ) {
            hull.color.set( base );
            hull.envMapIntensity = envMapIntensity;
            hull.normalScale.set( normalScale, normalScale );
        }
        driveEngines( surfaces.current.engines, entity );
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
