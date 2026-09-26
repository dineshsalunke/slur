import type { Entity } from 'koota';
import type * as THREE from 'three';
import { num } from '../../../dev/tuning';
import { exhaustDrive } from '../exhaust-drive';
import { METAL_METALNESS, METAL_ROUGHNESS } from '../metal';
import { engineIntensity, engineMaterial } from '../ship-materials';
import { cleanToMapRoughness } from '../track-materials';
import { graphiteSurfaceParams, surfaceMaps } from '../track-texture';
import type { DissolveUniforms, ShipSurfaces } from './ship-model';
import { DISSOLVE_DISCARD, DISSOLVE_EDGE, DISSOLVE_FRAG_HEAD, HULL_PROJECTION } from './ship-model.constants';
import { glow, hullTexSpan } from './ship-model.state';

export function patchDissolve( mat: THREE.Material, uniforms: DissolveUniforms, hull: boolean ): void {
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

export function hullMaterial( mat: THREE.Material ): THREE.MeshStandardMaterial | null {
    const std = mat as THREE.MeshStandardMaterial;
    if ( ! std.isMeshStandardMaterial || std.emissive.getHex() !== 0 ) return null;
    std.metalness = METAL_METALNESS;
    std.roughness = cleanToMapRoughness( METAL_ROUGHNESS );
    return std;
}

export function dressHulls( hulls: THREE.MeshStandardMaterial[] ): void {
    const maps = surfaceMaps( graphiteSurfaceParams() );
    for ( const hull of hulls ) {
        hull.normalMap = maps.normalMap;
        hull.roughnessMap = maps.roughnessMap;
        hull.metalnessMap = maps.metalnessMap;
        hull.needsUpdate = true;
    }
}

export function collectSurfaces( grp: THREE.Group, uniforms: DissolveUniforms ): ShipSurfaces {
    const found: ShipSurfaces = { hulls: [], engines: [], all: [] };
    grp.traverse( ( o ) => {
        const mesh = o as THREE.Mesh;
        if ( ! mesh.isMesh ) return;
        const mats = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
        for ( const mat of mats ) {
            found.all.push( mat );
            const hull = hullMaterial( mat );
            if ( hull ) found.hulls.push( hull );
            const engine = engineMaterial( mat );
            if ( engine ) found.engines.push( engine );
            patchDissolve( mat, uniforms, hull !== null );
        }
    } );
    return found;
}

export function driveEngines( engines: THREE.MeshStandardMaterial[], entity: Entity ): void {
    if ( engines.length === 0 ) return;
    glow.idle = num( 'Ship.engineIdle' );
    glow.cruise = num( 'Ship.engineCruise' );
    const intensity = engineIntensity( glow, exhaustDrive( entity ) );
    for ( const mat of engines ) mat.emissiveIntensity = intensity;
}
