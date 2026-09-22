import * as THREE from 'three';

export const EMITTER_SLOTS = 12;

const STRIDE = 4;

export interface EmitterUniforms {
    uEmitters: { value: Float32Array };
    uEmitterTint: { value: Float32Array };
    uEmitterAxis: { value: THREE.Vector3 };
    uEmitterDecay: { value: number };
    uEmitterCount: { value: number };
}

function createEmitterUniforms(): EmitterUniforms {
    return {
        uEmitters: { value: new Float32Array( EMITTER_SLOTS * STRIDE ) },
        uEmitterTint: { value: new Float32Array( EMITTER_SLOTS * STRIDE ) },
        uEmitterAxis: { value: new THREE.Vector3( 0, 0, 1 ) },
        uEmitterDecay: { value: 1 },
        uEmitterCount: { value: 0 },
    };
}

export const railEmitters = createEmitterUniforms();

export function writeEmitter(
    u: EmitterUniforms,
    slot: number,
    view: THREE.Vector3,
    halfLength: number,
    color: THREE.Color,
    intensity: number,
    range: number,
): void {
    const i = slot * STRIDE;
    const p = u.uEmitters.value;
    const t = u.uEmitterTint.value;
    p[ i ] = view.x;
    p[ i + 1 ] = view.y;
    p[ i + 2 ] = view.z;
    p[ i + 3 ] = halfLength;
    t[ i ] = color.r * intensity;
    t[ i + 1 ] = color.g * intensity;
    t[ i + 2 ] = color.b * intensity;
    t[ i + 3 ] = range;
}

export function parkEmitter( u: EmitterUniforms, slot: number ): void {
    u.uEmitterTint.value[ slot * STRIDE + 3 ] = 0;
}

const FRAG_HEAD = `
uniform vec4 uEmitters[ ${ EMITTER_SLOTS } ];
uniform vec4 uEmitterTint[ ${ EMITTER_SLOTS } ];
uniform vec3 uEmitterAxis;
uniform float uEmitterDecay;
uniform int uEmitterCount;
`;

const FRAG_LIGHTS = `
{
	float emCavity = 1.0;
	#ifdef USE_ROUGHNESSMAP
		emCavity = texture2D( roughnessMap, vRoughnessMapUv ).r;
	#endif
	vec3 emRay = reflect( - geometryViewDir, geometryNormal );
	vec3 emAxis = normalize( ( viewMatrix * vec4( uEmitterAxis, 0.0 ) ).xyz );
	for ( int emI = 0; emI < ${ EMITTER_SLOTS }; emI ++ ) {
		if ( emI >= uEmitterCount ) break;
		vec4 emTint = uEmitterTint[ emI ];
		vec4 emE = uEmitters[ emI ];
		vec3 emCenter = ( viewMatrix * vec4( emE.xyz, 1.0 ) ).xyz;
		vec3 emL0 = emCenter - emAxis * emE.w - geometryPosition;
		vec3 emLd = emAxis * ( 2.0 * emE.w );
		float emLen2 = dot( emLd, emLd );

		float emTd = emLen2 > 1e-4 ? clamp( - dot( emL0, emLd ) / emLen2, 0.0, 1.0 ) : 0.0;
		vec3 emVecD = emL0 + emLd * emTd;
		float emDistD = max( length( emVecD ), 1e-4 );
		vec3 emDirD = emVecD / emDistD;
		vec3 emIrrD = saturate( dot( geometryNormal, emDirD ) ) * emCavity *
			emTint.rgb * getDistanceAttenuation( emDistD, emTint.w, uEmitterDecay );
		reflectedLight.directDiffuse += emIrrD * BRDF_Lambert( material.diffuseContribution );

		float emRd = dot( emRay, emLd );
		float emDen = emLen2 - emRd * emRd;
		float emTs = emDen > 1e-4
			? clamp( ( dot( emRay, emL0 ) * emRd - dot( emL0, emLd ) ) / emDen, 0.0, 1.0 )
			: emTd;
		vec3 emVecS = emL0 + emLd * emTs;
		float emDistS = max( length( emVecS ), 1e-4 );
		vec3 emDirS = emVecS / emDistS;
		vec3 emIrrS = saturate( dot( geometryNormal, emDirS ) ) * emCavity *
			emTint.rgb * getDistanceAttenuation( emDistS, emTint.w, uEmitterDecay );
		reflectedLight.directSpecular += emIrrS *
			BRDF_GGX_Multiscatter( emDirS, geometryViewDir, geometryNormal, material );
	}
}
`;

export function applyEmitterShader( shader: THREE.WebGLProgramParametersWithUniforms, u = railEmitters ): void {
    shader.uniforms.uEmitters = u.uEmitters;
    shader.uniforms.uEmitterTint = u.uEmitterTint;
    shader.uniforms.uEmitterAxis = u.uEmitterAxis;
    shader.uniforms.uEmitterDecay = u.uEmitterDecay;
    shader.uniforms.uEmitterCount = u.uEmitterCount;
    shader.fragmentShader = ( FRAG_HEAD + shader.fragmentShader ).replace(
        '#include <lights_fragment_begin>',
        `#include <lights_fragment_begin>${ FRAG_LIGHTS }`,
    );
}

export function patchEmitterLight( mat: THREE.Material, u = railEmitters ): void {
    if ( mat.userData.emitterPatched ) return;
    if ( ! ( mat as THREE.MeshStandardMaterial ).isMeshStandardMaterial ) return;
    mat.userData.emitterPatched = true;
    mat.onBeforeCompile = ( shader ) => applyEmitterShader( shader, u );
    mat.needsUpdate = true;
}

export function patchEmitterTree( root: THREE.Object3D, u = railEmitters ): void {
    root.traverse( ( o ) => {
        const mesh = o as THREE.Mesh;
        if ( ! mesh.isMesh ) return;
        const mats = Array.isArray( mesh.material ) ? mesh.material : [ mesh.material ];
        for ( const mat of mats ) patchEmitterLight( mat, u );
    } );
}
