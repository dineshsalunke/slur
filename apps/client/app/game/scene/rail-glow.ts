import { HALF_WIDTH } from '@slur/shared';
import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { RAIL_W } from './track-geometry';

const RAIL_X = HALF_WIDTH + RAIL_W / 2;

export interface RailGlowUniforms {
    uRailOrigin: { value: THREE.Vector3[] };
    uRailDir: { value: THREE.Vector3 };
    uRailColor: { value: THREE.Color };
}

export function railGlowUniforms(): RailGlowUniforms {
    return {
        uRailOrigin: { value: [ new THREE.Vector3(), new THREE.Vector3() ] },
        uRailDir: { value: new THREE.Vector3( 0, 0, 1 ) },
        uRailColor: { value: new THREE.Color( 0, 0, 0 ) },
    };
}

const _world = new THREE.Vector3();

export function updateRailGlow( u: RailGlowUniforms, camera: THREE.Camera ): void {
    const lift = num( 'RailLight.lift' );
    for ( let i = 0; i < 2; i++ ) {
        _world.set( i === 0 ? -RAIL_X : RAIL_X, lift, camera.position.z );
        u.uRailOrigin.value[ i ].copy( _world ).applyMatrix4( camera.matrixWorldInverse );
    }
    u.uRailDir.value.set( 0, 0, 1 ).transformDirection( camera.matrixWorldInverse );
    u.uRailColor.value.set( col( 'RailLight.color' ) ).multiplyScalar( num( 'RailLight.intensity' ) );
}

const FRAG_HEAD = `
uniform vec3 uRailOrigin[ 2 ];
uniform vec3 uRailDir;
uniform vec3 uRailColor;

void railGlowLine( vec3 origin, vec3 p, vec3 n, vec3 v, float roughness, vec3 diffuseColor, vec3 specularColor, inout vec3 diffuse, inout vec3 specular ) {
	vec3 toOrigin = origin - p;
	vec3 nearest = toOrigin - uRailDir * dot( toOrigin, uRailDir );
	float d = max( length( nearest ), 0.6 );
	vec3 l = nearest / d;
	float wrap = max( dot( n, l ) + 0.15, 0.0 ) / 1.15;
	diffuse += diffuseColor * uRailColor * wrap / d;

	vec3 r = reflect( - v, n );
	float rd = dot( r, uRailDir );
	float denom = 1.0 - rd * rd;
	float t = ( dot( toOrigin, r ) - dot( toOrigin, uRailDir ) * rd ) / max( denom, 1e-4 );
	float s = dot( toOrigin, uRailDir ) - t * rd;
	vec3 q = origin - uRailDir * s;
	vec3 lq = q - p;
	float dq = max( length( lq ), 0.6 );
	lq /= dq;
	float miss = length( r * max( t, 0.0 ) - ( q - p ) );
	float width = 0.4 + roughness * roughness * 6.0;
	float streak = exp( - miss * miss / ( width * width ) ) * step( 0.0, t );
	specular += specularColor * uRailColor * streak * max( dot( n, lq ), 0.0 ) * ( 1.0 - roughness ) * 1.5 / dq;
}
`;

const FRAG_LIGHT = `
#include <lights_fragment_end>
{
	vec3 railDiffuse = vec3( 0.0 );
	vec3 railSpecular = vec3( 0.0 );
	for ( int i = 0; i < 2; i++ ) {
		railGlowLine( uRailOrigin[ i ], geometryPosition, geometryNormal, geometryViewDir, material.roughness, BRDF_Lambert( material.diffuseColor ), material.specularColor, railDiffuse, railSpecular );
	}
	reflectedLight.directDiffuse += railDiffuse;
	reflectedLight.directSpecular += railSpecular;
}
`;

export function patchRailGlow( material: THREE.MeshStandardMaterial, uniforms: RailGlowUniforms ): void {
    material.onBeforeCompile = ( shader ) => {
        Object.assign( shader.uniforms, uniforms );
        shader.fragmentShader =
            FRAG_HEAD + shader.fragmentShader.replace( '#include <lights_fragment_end>', FRAG_LIGHT );
    };
    material.customProgramCacheKey = () => 'slur-rail-glow';
}
