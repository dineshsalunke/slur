import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface RingSpec {
    inner: number;
    outer: number;
    depth: number;
    wedges: number;
    seam: number;
    bevel: number;
}

export interface SleeveSpec {
    inset: number;
    reach: number;
    proud: number;
}

function sector( inner: number, outer: number, a0: number, a1: number ): THREE.Shape {
    const s = new THREE.Shape();
    s.absarc( 0, 0, outer, a0, a1, false );
    s.absarc( 0, 0, inner, a1, a0, true );
    s.closePath();
    return s;
}

function rect( xa: number, xb: number, y0: number, y1: number ): THREE.Shape {
    const x0 = Math.min( xa, xb );
    const x1 = Math.max( xa, xb );
    const s = new THREE.Shape();
    s.moveTo( x0, y0 );
    s.lineTo( x1, y0 );
    s.lineTo( x1, y1 );
    s.lineTo( x0, y1 );
    s.closePath();
    return s;
}

function extrude( shape: THREE.Shape, depth: number, bevel: number, curveSegments: number ): THREE.BufferGeometry {
    const g = new THREE.ExtrudeGeometry( shape, {
        depth: depth - 2 * bevel,
        bevelEnabled: bevel > 0,
        bevelThickness: bevel,
        bevelSize: bevel,
        bevelSegments: 1,
        curveSegments,
    } );
    g.translate( 0, 0, -( depth - 2 * bevel ) / 2 );
    g.clearGroups();
    return g;
}

export function wedgeStep( spec: RingSpec ): number {
    return ( Math.PI * 2 ) / spec.wedges;
}

export function wedgeGeometry( spec: RingSpec ): THREE.BufferGeometry {
    const { inner, outer, depth, seam, bevel } = spec;
    const mid = ( inner + outer ) / 2;
    const half = wedgeStep( spec ) / 2 - ( seam / 2 + bevel ) / mid;
    return extrude( sector( inner + bevel, outer - bevel, -half, half ), depth, bevel, 3 );
}

function spin( parts: THREE.BufferGeometry[], step: number, source: THREE.BufferGeometry, count: number ) {
    for ( let i = 0; i < count; i++ ) parts.push( source.clone().rotateZ( i * step ) );
}

export function ringGeometry( spec: RingSpec ): THREE.BufferGeometry {
    const wedge = wedgeGeometry( spec );
    const parts: THREE.BufferGeometry[] = [];
    spin( parts, wedgeStep( spec ), wedge, spec.wedges );
    wedge.dispose();
    return mergeParts( parts );
}

export function dashedSleeveGeometry( spec: RingSpec, sleeve: SleeveSpec, dash: number ): THREE.BufferGeometry {
    const step = wedgeStep( spec );
    const half = ( step * dash ) / 2;
    const one = extrude(
        sector( spec.inner - sleeve.inset, spec.inner + sleeve.reach, -half, half ),
        spec.depth + 2 * sleeve.proud,
        0,
        2,
    );
    const parts: THREE.BufferGeometry[] = [];
    spin( parts, step, one, spec.wedges );
    one.dispose();
    return mergeParts( parts );
}

export function archLegSegments( spec: RingSpec, leg: number ): number {
    const mid = ( spec.inner + spec.outer ) / 2;
    return Math.max( 1, Math.round( leg / ( mid * wedgeStep( spec ) ) ) );
}

export function archGeometry( spec: RingSpec, leg: number ): THREE.BufferGeometry {
    const { inner, outer, depth, seam, bevel } = spec;
    const step = wedgeStep( spec );
    const parts: THREE.BufferGeometry[] = [];
    const wedge = wedgeGeometry( spec );
    for ( let i = 0; i < spec.wedges / 2; i++ )
        parts.push(
            wedge
                .clone()
                .rotateZ( ( i + 0.5 ) * step )
                .translate( 0, leg, 0 ),
        );
    wedge.dispose();
    const count = archLegSegments( spec, leg );
    const len = leg / count;
    for ( let k = 0; k < count; k++ ) {
        const y0 = k * len + seam / 2 + bevel;
        const y1 = ( k + 1 ) * len - seam / 2 - bevel;
        for ( const side of [ -1, 1 ] )
            parts.push(
                extrude( rect( side * ( inner + bevel ), side * ( outer - bevel ), y0, y1 ), depth, bevel, 1 ),
            );
    }
    return mergeParts( parts );
}

export function archSleeveGeometry( spec: RingSpec, sleeve: SleeveSpec, leg: number ): THREE.BufferGeometry {
    const a = spec.inner - sleeve.inset;
    const b = spec.inner + sleeve.reach;
    const depth = spec.depth + 2 * sleeve.proud;
    const parts = [ extrude( sector( a, b, 0, Math.PI ), depth, 0, ( spec.wedges * 3 ) / 2 ).translate( 0, leg, 0 ) ];
    for ( const side of [ -1, 1 ] ) parts.push( extrude( rect( side * a, side * b, 0, leg ), depth, 0, 1 ) );
    return mergeParts( parts );
}

export function boxPart( w: number, h: number, d: number, x: number, y: number, z: number ): THREE.BufferGeometry {
    const box = new THREE.BoxGeometry( w, h, d ).translate( x, y, z );
    const flat = box.toNonIndexed();
    box.dispose();
    return flat;
}

export function mergeParts( parts: THREE.BufferGeometry[] ): THREE.BufferGeometry {
    const merged = mergeGeometries( parts, false );
    for ( const p of parts ) p.dispose();
    if ( ! merged ) throw new Error( 'portal ring parts do not share attributes' );
    return merged;
}
