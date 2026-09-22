import { useFrame } from '@react-three/fiber';

const TARGET_DPR = 2;

export function RenderScale() {
    useFrame( ( state ) => {
        const target = Math.min( TARGET_DPR, window.devicePixelRatio );
        if ( Math.abs( state.gl.getPixelRatio() - target ) > 1e-3 ) state.setDpr( target );
    } );

    return null;
}
