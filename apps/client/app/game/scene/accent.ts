import * as THREE from 'three';
import { col } from '../../dev/tuning';
import { ACCENT_ANCHOR } from './accent.constants';

const anchor = new THREE.Color( col( 'Accent.color' ) );
let version = 0;

export function accent(): THREE.Color {
    return anchor;
}

export function accentVersion(): number {
    return version;
}

export function syncAccent(): void {
    anchor.set( col( 'Accent.color' ) );
    version++;
}

export function followAccent( value: string ): string {
    return value.toLowerCase() === ACCENT_ANCHOR.toLowerCase() ? col( 'Accent.color' ) : value;
}
