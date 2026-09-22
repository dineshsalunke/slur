import { useFrame } from '@react-three/fiber';
import { num } from './tunables';

export function RenderScale() {
    useFrame( ( state ) => {
        const target = Math.min( num( 'perf.dpr' ), window.devicePixelRatio );
        if ( Math.abs( state.gl.getPixelRatio() - target ) > 1e-3 ) state.setDpr( target );
    } );

    return null;
}
