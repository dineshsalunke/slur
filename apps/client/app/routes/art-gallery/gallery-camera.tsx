import { useFrame } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { galleryFocus } from './gallery-state';
import { SUBJECTS, slotFor } from './subjects';

const EASE = 4;
const FRAMING = 2.4;
const WIDE = { x: 0, y: 70, z: -150, tx: 0, ty: 0, tz: 40 };

const _target = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };

function computeTarget( index: number ): typeof _target {
    const s = SUBJECTS[ index ];
    if ( ! s ) return Object.assign( _target, WIDE );
    const [ cx, , cz ] = slotFor( index );
    const size = s.dims ? Math.max( ...s.dims ) : 12;
    const dist = Math.max( 8, size * FRAMING );
    return Object.assign( _target, {
        x: cx,
        y: dist * 0.45,
        z: cz - dist,
        tx: cx,
        ty: s.dims ? s.dims[ 1 ] / 2 : 2,
        tz: cz,
    } );
}

export function GalleryCamera() {
    useFrame( ( state, delta ) => {
        const t = computeTarget( galleryFocus.index );
        const k = 1 - Math.exp( -EASE * delta );
        const cam = state.camera as PerspectiveCamera;
        cam.position.x += ( t.x - cam.position.x ) * k;
        cam.position.y += ( t.y - cam.position.y ) * k;
        cam.position.z += ( t.z - cam.position.z ) * k;
        cam.lookAt( t.tx, t.ty, t.tz );
    } );
    return null;
}
