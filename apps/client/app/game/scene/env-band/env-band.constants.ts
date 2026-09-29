export const BAND_FEATHER = 0.35;

export const BAND_VERTEX = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

export const BAND_FRAGMENT = `
uniform sampler2D hdri;
uniform vec3 bandColor;
uniform float halfHeight;
uniform float feather;
varying vec2 vUv;
void main() {
    float elevation = abs( ( vUv.y - 0.5 ) * 3.14159265 );
    float edge = halfHeight * feather;
    float inside = 1.0 - smoothstep( halfHeight - edge, halfHeight + edge, elevation );
    gl_FragColor = vec4( texture2D( hdri, vUv ).rgb + bandColor * inside, 1.0 );
}
`;
