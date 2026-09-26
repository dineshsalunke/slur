import { Vector3 } from 'three';

export const BOOST_BLUR_SAMPLES = 16;
export const BOOST_BLUR_INNER = 0.05;
export const BOOST_BLUR_OUTER = 0.45;
export const BOOST_BLUR_REACH = 0.25;
export const BOOST_BLUR_FAR_AHEAD = 500;
export const BOOST_BLUR_MIN_STRENGTH = 0.001;

export const BOOST_BLUR_AHEAD = new Vector3();

export const BOOST_BLUR_FRAGMENT = `
uniform float strength;
uniform vec2 center;
void mainImage( const in vec4 inputColor, const in vec2 uv, out vec4 outputColor ) {
    vec2 d = uv - center;
    float m = smoothstep( INNER, OUTER, length( d ) ) * strength;
    if ( m < MIN_STRENGTH ) { outputColor = inputColor; return; }
    float jitter = fract( 52.9829189 * fract( dot( gl_FragCoord.xy, vec2( 0.06711056, 0.00583715 ) ) ) );
    vec4 acc = vec4( 0.0 );
    for ( int i = 0; i < SAMPLES; i++ ) {
        float t = ( float( i ) + jitter ) / float( SAMPLES );
        acc += texture2D( inputBuffer, uv - d * m * REACH * t );
    }
    outputColor = acc / float( SAMPLES );
}
`;
