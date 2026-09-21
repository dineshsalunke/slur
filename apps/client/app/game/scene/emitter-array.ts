import * as THREE from 'three';

export const EMITTER_SLOTS = 24;

const STRIDE = 4;

export interface EmitterUniforms {
    uEmitters: { value: Float32Array };
    uEmitterTint: { value: Float32Array };
    uEmitterAxis: { value: THREE.Vector3 };
    uEmitterDecay: { value: number };
}

export function createEmitterUniforms(): EmitterUniforms {
    return {
        uEmitters: { value: new Float32Array( EMITTER_SLOTS * STRIDE ) },
        uEmitterTint: { value: new Float32Array( EMITTER_SLOTS * STRIDE ) },
        uEmitterAxis: { value: new THREE.Vector3( 0, 0, 1 ) },
        uEmitterDecay: { value: 1 },
    };
}

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
`;

const FRAG_LIGHTS = `
{
	vec3 emRay = reflect( - geometryViewDir, geometryNormal );
	for ( int emI = 0; emI < ${ EMITTER_SLOTS }; emI ++ ) {
		vec4 emTint = uEmitterTint[ emI ];
		if ( emTint.w <= 0.0 ) continue;
		vec4 emE = uEmitters[ emI ];
		vec3 emL0 = emE.xyz - uEmitterAxis * emE.w - geometryPosition;
		vec3 emLd = uEmitterAxis * ( 2.0 * emE.w );
		float emRd = dot( emRay, emLd );
		float emDen = dot( emLd, emLd ) - emRd * emRd;
		float emT = emDen > 1e-4
			? clamp( ( dot( emRay, emL0 ) * emRd - dot( emL0, emLd ) ) / emDen, 0.0, 1.0 )
			: 0.0;
		vec3 emVec = emL0 + emLd * emT;
		float emDist = max( length( emVec ), 1e-4 );
		directLight.direction = emVec / emDist;
		directLight.color = emTint.rgb * getDistanceAttenuation( emDist, emTint.w, uEmitterDecay );
		directLight.visible = true;
		RE_Direct(
			directLight, geometryPosition, geometryNormal, geometryViewDir,
			geometryClearcoatNormal, material, reflectedLight
		);
	}
}
`;

export function patchEmitterLight( mat: THREE.Material, u: EmitterUniforms ): void {
    if ( mat.userData.emitterPatched ) return;
    mat.userData.emitterPatched = true;
    mat.onBeforeCompile = ( shader ) => {
        shader.uniforms.uEmitters = u.uEmitters;
        shader.uniforms.uEmitterTint = u.uEmitterTint;
        shader.uniforms.uEmitterAxis = u.uEmitterAxis;
        shader.uniforms.uEmitterDecay = u.uEmitterDecay;
        shader.fragmentShader = ( FRAG_HEAD + shader.fragmentShader ).replace(
            '#include <lights_fragment_begin>',
            `#include <lights_fragment_begin>${ FRAG_LIGHTS }`,
        );
    };
    mat.needsUpdate = true;
}
