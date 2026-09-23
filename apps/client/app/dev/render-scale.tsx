import { useFrame } from '@react-three/fiber';
import { num } from './tuning';

export function RenderScale() {
    useFrame( ( state ) => {
        const target = num( 'Render.dpr' );
        if ( Math.abs( state.gl.getPixelRatio() - target ) <= 1e-3 ) return;
        state.setDpr( target );
        const { width, height, top, left } = state.size;
        state.setSize( width, height, top, left );
    } );

    return null;
}
