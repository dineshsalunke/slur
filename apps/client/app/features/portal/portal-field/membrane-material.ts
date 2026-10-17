import * as THREE from 'three';

const VERTEX = `
#include <fog_pars_vertex>
uniform float uCentreY;
varying vec2 vLocal;
varying vec3 vTint;
varying float vFacing;

void main() {
    vLocal = vec2( position.x, position.y - uCentreY );
    vTint = vec3( 1.0 );
    #ifdef USE_INSTANCING_COLOR
        vTint = instanceColor;
    #endif
    vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
    vec3 n = normalize( normalMatrix * mat3( instanceMatrix ) * normal );
    vFacing = abs( dot( n, normalize( -mvPosition.xyz ) ) );
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
}
`;

const FRAGMENT = `
#include <fog_pars_fragment>
uniform float uRadius;
uniform float uTime;
uniform float uFlow;
uniform float uOpacity;
uniform float uGlow;
varying vec2 vLocal;
varying vec3 vTint;
varying float vFacing;

void main() {
    float r = clamp( length( vLocal ) / uRadius, 0.0, 1.0 );
    float a = r > 0.001 ? atan( vLocal.y, vLocal.x ) : 0.0;
    float t = uTime * uFlow;
    float swirl = sin( a * 3.0 + t * 1.7 ) * 0.6;
    float wave = 0.5 + 0.5 * sin( r * 16.0 - t * 5.0 + swirl );
    float rim = smoothstep( 0.55, 1.0, r );
    float body = 0.3 + 0.7 * rim * rim;
    float face = smoothstep( 0.04, 0.35, vFacing );
    float alpha = uOpacity * body * ( 0.75 + 0.25 * wave ) * face;
    #ifdef USE_FOG
        #ifdef FOG_EXP2
            alpha *= exp( -fogDensity * fogDensity * vFogDepth * vFogDepth );
        #else
            alpha *= 1.0 - smoothstep( fogNear, fogFar, vFogDepth );
        #endif
    #endif
    gl_FragColor = vec4( vTint * uGlow, alpha );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

export interface MembraneShape {
    radius: number;
    centreY: number;
}

export function buildMembraneMaterial( shape: MembraneShape ): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial( {
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
            ...THREE.UniformsUtils.clone( THREE.UniformsLib.fog ),
            uRadius: { value: shape.radius },
            uCentreY: { value: shape.centreY },
            uTime: { value: 0 },
            uFlow: { value: 1 },
            uOpacity: { value: 0.2 },
            uGlow: { value: 1 },
        },
        fog: true,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
    } );
}

export function membraneGeometry( shape: MembraneShape, segments: number ): THREE.BufferGeometry {
    const floor = Math.asin( Math.max( -1, Math.min( 1, -shape.centreY / shape.radius ) ) );
    const s = new THREE.Shape();
    s.absarc( 0, 0, shape.radius, floor, Math.PI - floor, false );
    s.closePath();
    return new THREE.ShapeGeometry( s, segments ).translate( 0, shape.centreY, 0 );
}
