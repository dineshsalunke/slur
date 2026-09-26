import { Effect, EffectAttribute } from 'postprocessing';
import { type Camera, Uniform, Vector2 } from 'three';
import {
    BOOST_BLUR_AHEAD,
    BOOST_BLUR_FAR_AHEAD,
    BOOST_BLUR_FRAGMENT,
    BOOST_BLUR_INNER,
    BOOST_BLUR_MIN_STRENGTH,
    BOOST_BLUR_OUTER,
    BOOST_BLUR_REACH,
    BOOST_BLUR_SAMPLES,
} from './boost-blur.constants';

function glslFloat( n: number ): string {
    return Number.isInteger( n ) ? `${ n }.0` : String( n );
}

function clamp01( n: number ): number {
    return Math.min( 1, Math.max( 0, n ) );
}

export class BoostBlurEffect extends Effect {
    constructor() {
        super( 'BoostBlur', BOOST_BLUR_FRAGMENT, {
            attributes: EffectAttribute.CONVOLUTION,
            uniforms: new Map< string, Uniform >( [
                [ 'strength', new Uniform( 0 ) ],
                [ 'center', new Uniform( new Vector2( 0.5, 0.5 ) ) ],
            ] ),
            defines: new Map( [
                [ 'SAMPLES', String( BOOST_BLUR_SAMPLES ) ],
                [ 'INNER', glslFloat( BOOST_BLUR_INNER ) ],
                [ 'OUTER', glslFloat( BOOST_BLUR_OUTER ) ],
                [ 'REACH', glslFloat( BOOST_BLUR_REACH ) ],
                [ 'MIN_STRENGTH', glslFloat( BOOST_BLUR_MIN_STRENGTH ) ],
            ] ),
        } );
    }

    set strength( value: number ) {
        ( this.uniforms.get( 'strength' ) as Uniform< number > ).value = value;
    }

    get strength(): number {
        return ( this.uniforms.get( 'strength' ) as Uniform< number > ).value;
    }

    aimAhead( camera: Camera ): void {
        BOOST_BLUR_AHEAD.copy( camera.position );
        BOOST_BLUR_AHEAD.z += BOOST_BLUR_FAR_AHEAD;
        BOOST_BLUR_AHEAD.project( camera );
        const center = ( this.uniforms.get( 'center' ) as Uniform< Vector2 > ).value;
        center.set( clamp01( BOOST_BLUR_AHEAD.x * 0.5 + 0.5 ), clamp01( BOOST_BLUR_AHEAD.y * 0.5 + 0.5 ) );
    }
}
