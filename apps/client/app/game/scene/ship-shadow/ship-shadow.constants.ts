export const VERTEX = `
varying vec2 vShadowUv;
void main() {
    vShadowUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const FRAGMENT = `
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
