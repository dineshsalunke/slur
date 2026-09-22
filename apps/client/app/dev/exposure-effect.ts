import { Effect } from 'postprocessing';
import * as THREE from 'three';

const FRAGMENT = `
uniform float exposure;

void mainImage( const in vec4 inputColor, const in vec2 uv, out vec4 outputColor ) {
	outputColor = vec4( inputColor.rgb * exposure, inputColor.a );
}
`;

export class ExposureEffect extends Effect {
    constructor() {
        super( 'ExposureEffect', FRAGMENT, { uniforms: new Map( [ [ 'exposure', new THREE.Uniform( 1 ) ] ] ) } );
    }

    set exposure( value: number ) {
        const uniform = this.uniforms.get( 'exposure' );
        if ( uniform ) uniform.value = value;
    }
}
