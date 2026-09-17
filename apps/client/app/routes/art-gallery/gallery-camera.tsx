import { useFrame } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { galleryFocus } from './gallery-state';
import { SUBJECTS, slotFor } from './subjects';

// Rubberband ease, frame-rate independent — same exp form the chase camera uses.
const EASE = 4;
// How much bigger than the subject the frame should be. 2.4 leaves it comfortably full without clipping.
const FRAMING = 2.4;
// The wide "everything" shot when nothing is focused.
const WIDE = { x: 0, y: 70, z: -150, tx: 0, ty: 0, tz: 40 };

// Scratch targets — module scope so the frame loop allocates nothing (r3f hot-path rule).
const _target = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0 };

function computeTarget( index: number ): typeof _target {
    const s = SUBJECTS[ index ];
    if ( ! s ) return Object.assign( _target, WIDE );
    const [ cx, , cz ] = slotFor( index );
    // Frame on the subject's LARGEST dimension so a 64u slab and a 4u block both fill the view. This is the
    // fix for the first build, where one camera distance served every subject: the slab dominated and the
    // 0.6u edge rail was a sliver. True scale is preserved — only the viewing distance adapts.
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

/**
 * Eases the camera to frame whichever subject is focused (or a wide shot when none is).
 *
 * Returns null — it is a system, not a view. Note it deliberately does NOT use drei `<Bounds>`: Bounds fits
 * to a measured bounding box, which fights `OrbitControls` and re-fires whenever the turntable rotation
 * changes the box. Framing off the subject's DECLARED dimensions is stable under rotation and is honest
 * about scale, which is the whole point of this route.
 */
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
