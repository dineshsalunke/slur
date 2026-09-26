import * as THREE from 'three';

export const ACCENT_ANCHOR = '#F59A24';

const anchor = new THREE.Color( ACCENT_ANCHOR );

export function accent(): THREE.Color {
    return anchor;
}

export function accentDerived( derive: ( base: THREE.Color, out: THREE.Color ) => void ): THREE.Color {
    const out = new THREE.Color();
    derive( anchor, out );
    return out;
}
