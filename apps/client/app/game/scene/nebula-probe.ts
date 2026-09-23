import * as THREE from 'three';

export const PROBE_W = 64;
export const PROBE_H = 32;
const HORIZON_HALF_SPAN = 3;
const KEY_LIFT = 1.4;
const KEY_DEPTH = 0.35;
const KEY_TINT = 0.45;

const SRGB_TO_LINEAR = Float32Array.from( { length: 256 }, ( _, i ) => {
    const c = i / 255;
    return c <= 0.04045 ? c / 12.92 : ( ( c + 0.055 ) / 1.055 ) ** 2.4;
} );

const _color = new THREE.Color();

export interface ProbeResult {
    horizon: THREE.Color;
    direction: THREE.Vector3;
    color: THREE.Color;
}

export function measureProbe( px: Uint8Array, out: ProbeResult ): void {
    let hr = 0;
    let hg = 0;
    let hb = 0;
    let hn = 0;
    let kx = 0;
    let ky = 0;
    let kz = 0;
    let kr = 0;
    let kg = 0;
    let kb = 0;
    const midRow = PROBE_H / 2;
    const midCol = PROBE_W / 2;

    for ( let row = 0; row < PROBE_H; row++ ) {
        const lat = ( ( row + 0.5 ) / PROBE_H - 0.5 ) * Math.PI;
        const cosLat = Math.cos( lat );
        for ( let col = 0; col < PROBE_W; col++ ) {
            const lon = ( ( col + 0.5 ) / PROBE_W - 0.5 ) * Math.PI * 2;
            const i = ( row * PROBE_W + col ) * 4;
            const r = SRGB_TO_LINEAR[ px[ i ] ];
            const g = SRGB_TO_LINEAR[ px[ i + 1 ] ];
            const b = SRGB_TO_LINEAR[ px[ i + 2 ] ];
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const w = lum * lum * cosLat;
            kx += w * cosLat * Math.sin( lon );
            ky += w * Math.sin( lat );
            kz += w * cosLat * Math.cos( lon );
            kr += w * r;
            kg += w * g;
            kb += w * b;
            if ( ( row === midRow - 1 || row === midRow ) && Math.abs( col + 0.5 - midCol ) <= HORIZON_HALF_SPAN ) {
                hr += r;
                hg += g;
                hb += b;
                hn++;
            }
        }
    }

    out.horizon.setRGB( hr / hn, hg / hn, hb / hn, THREE.LinearSRGBColorSpace );

    const len = Math.hypot( kx, ky, kz );
    if ( len > 0 ) {
        out.direction.set( kx / len, ky / len + KEY_LIFT, ( kz / len ) * KEY_DEPTH ).normalize();
    }
    const peak = Math.max( kr, kg, kb );
    if ( peak > 0 ) {
        _color.setRGB( kr / peak, kg / peak, kb / peak );
        out.color.setRGB( 1, 1, 1 ).lerp( _color, KEY_TINT );
    }
}
