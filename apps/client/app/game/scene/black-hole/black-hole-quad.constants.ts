export const QUAD_VERT = `
varying vec2 vUv;
varying vec4 vClip;

void main() {
    vUv = vec2( 1.0 - uv.x, uv.y );
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vClip = gl_Position;
}
`;

export const QUAD_FRAG = `
uniform sampler2D uShade;
uniform sampler2D uLens;
uniform sampler2D uBackdrop;
uniform mat3 uBackdropTransform;
uniform vec2 uHalfUv;
uniform float uLensStrength;
uniform float uEdge;
varying vec2 vUv;
varying vec4 vClip;

void main() {
    float r = length( vUv * 2.0 - 1.0 );
    float w = 1.0 - smoothstep( uEdge, 1.0, r );
    if ( w <= 0.0 ) discard;
    vec4 disk = texture2D( uShade, vUv );
    vec4 lens = texture2D( uLens, vUv );
    vec2 screenUv = vClip.xy / vClip.w * 0.5 + 0.5;
    vec2 lensedUv = screenUv + lens.xy * uHalfUv * uLensStrength * w;
    vec3 sky = texture2D( uBackdrop, ( uBackdropTransform * vec3( lensedUv, 1.0 ) ).xy ).rgb;
    sky *= 1.0 - lens.z;
    gl_FragColor = vec4( disk.rgb + ( 1.0 - disk.a ) * sky, 1.0 );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    gl_FragColor = vec4( gl_FragColor.rgb * w, w );
}
`;
