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

function annulus( inner: number, outer: number ): THREE.Shape {
    const s = new THREE.Shape();
    s.absarc( 0, 0, outer, 0, Math.PI * 2, false );
    const hole = new THREE.Path();
    hole.absarc( 0, 0, inner, 0, Math.PI * 2, true );
    s.holes.push( hole );
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

export function ringSleeveGeometry( spec: RingSpec, sleeve: SleeveSpec ): THREE.BufferGeometry {
    return extrude(
        annulus( spec.inner - sleeve.inset, spec.inner + sleeve.reach ),
        spec.depth + 2 * sleeve.proud,
        0,
        spec.wedges * 3,
    );
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
