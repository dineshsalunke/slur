import { hash2, isFullSpan, LEAD_SEGMENTS, SEG_LEN, type Segment, type Track } from '@slur/shared';
import type * as THREE from 'three';
import { packGeometry, pushQuad, UP } from './track-geometry';

export interface SeamInsert {
    x: number;
    y: number;
    z0: number;
    z1: number;
}

export const SEAM_SPACING = 8;
export const SEAM_INSET = 4;
export const SEAM_WIDTH = 0.12;
export const SEAM_LIFT = 0.02;
export const SEAM_CHANCE = 0.45;
export const SEAM_LEN_MIN = 3;
export const SEAM_LEN_MAX = 11;

const SALT_PRESENT = 0x5ea3_1b7d | 0;
const SALT_LENGTH = 0x1f4b_2c95 | 0;
const SALT_OFFSET = 0x6d07_3e11 | 0;

function unit( salt: number, i: number ): number {
    return hash2( salt, i ) / 4294967296;
}

export function seamLanes( halfWidth: number ): number[] {
    const xs: number[] = [];
    for ( let x = SEAM_INSET; x < halfWidth; x += SEAM_SPACING ) xs.push( -x, x );
    return xs;
}

function floorYAt( seg: Segment, x: number ): number | null {
    for ( const f of seg.floors ) {
        if ( ! isFullSpan( f ) ) continue;
        if ( x >= f.x0 - 1e-4 && x <= f.x1 + 1e-4 ) return f.y;
    }
    return null;
}

export function buildSeamInserts( track: Track, segments: number, halfWidth: number ): SeamInsert[] {
    const lanes = seamLanes( halfWidth );
    const inserts: SeamInsert[] = [];

    for ( let i = -LEAD_SEGMENTS; i < segments; i++ ) {
        const seg = track.segmentAt( i );
        for ( let l = 0; l < lanes.length; l++ ) {
            const x = lanes[ l ];
            const y = floorYAt( seg, x );
            if ( y === null ) continue;

            const k = ( i + LEAD_SEGMENTS ) * lanes.length + l;
            if ( unit( SALT_PRESENT, k ) > SEAM_CHANCE ) continue;

            const len = Math.min( SEAM_LEN_MIN + unit( SALT_LENGTH, k ) * ( SEAM_LEN_MAX - SEAM_LEN_MIN ), SEG_LEN );
            const z0 = seg.z0 + unit( SALT_OFFSET, k ) * ( SEG_LEN - len );
            inserts.push( { x, y, z0, z1: z0 + len } );
        }
    }

    return inserts;
}

export function buildSeamGeometry( inserts: SeamInsert[] ): THREE.BufferGeometry {
    const pos: number[] = [];
    const uv: number[] = [];
    const h = SEAM_WIDTH / 2;

    for ( const s of inserts ) {
        const y = s.y + SEAM_LIFT;
        pushQuad(
            pos,
            uv,
            [ s.x - h, y, s.z0 ],
            [ s.x - h, y, s.z1 ],
            [ s.x + h, y, s.z1 ],
            [ s.x + h, y, s.z0 ],
            'xz',
            UP,
        );
    }

    return packGeometry( pos, uv );
}
