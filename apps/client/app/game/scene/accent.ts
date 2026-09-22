import * as THREE from 'three';

export const ACCENT_TRIALS = {
    marigold: '#F59A24',
    ember: '#F5761F',
    amber: '#F5B324',
    brass: '#DFA63C',
    signal: '#FFB020',
    coral: '#F56A46',
    vermilion: '#F54624',
    vermilionPigment: '#E34234',
    vermilionBright: '#FF4F1F',
} as const;

export const ACCENT_ANCHOR: string = ACCENT_TRIALS.marigold;

export const ACCENT_SHIFT_LIMIT_DEG = 24;

type Derive = ( base: THREE.Color, out: THREE.Color ) => void;

const anchor = new THREE.Color( ACCENT_ANCHOR );
const live = new THREE.Color().copy( anchor );
const hsl = { h: 0, s: 0, l: 0 };
const derived: { out: THREE.Color; derive: Derive }[] = [];

let shiftDeg = 0;

function refresh(): void {
    anchor.getHSL( hsl, THREE.SRGBColorSpace );
    live.setHSL( hsl.h + shiftDeg / 360, hsl.s, hsl.l, THREE.SRGBColorSpace );
    for ( const entry of derived ) entry.derive( live, entry.out );
}

export function accent(): THREE.Color {
    return live;
}

export function accentDerived( derive: Derive ): THREE.Color {
    const out = new THREE.Color();
    derived.push( { out, derive } );
    derive( live, out );
    return out;
}

export function accentHex(): string {
    return `#${ live.getHexString( THREE.SRGBColorSpace ) }`;
}

export function accentShiftDeg(): number {
    return shiftDeg;
}

export function setAccentShiftDeg( deg: number ): void {
    shiftDeg = Math.max( -ACCENT_SHIFT_LIMIT_DEG, Math.min( ACCENT_SHIFT_LIMIT_DEG, deg ) );
    refresh();
}

export function setAccentAnchor( hex: string ): void {
    anchor.set( hex );
    refresh();
}
