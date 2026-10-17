import type * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import {
    boostPickupCoreGeometry,
    boostPickupGlyphGeometry,
    boostPickupShellGeometry,
    boostStreakGeometry,
} from './boost-look';
import { boostLevel } from './boost-streaks/boost-streaks.utils';

function meanX( g: THREE.BufferGeometry, side: number, keep: ( absY: number ) => boolean ): number {
    const pos = g.getAttribute( 'position' );
    let sum = 0;
    let n = 0;
    for ( let i = 0; i < pos.count; i++ ) {
        if ( pos.getZ( i ) * side <= 0 || ! keep( Math.abs( pos.getY( i ) ) ) ) continue;
        sum += pos.getX( i );
        n++;
    }
    expect( n ).toBeGreaterThan( 0 );
    return sum / n;
}

describe( 'boost streak plane', () => {
    it( 'runs from the ship at z 0 back to z -1, with uv.y 0 at the ship', () => {
        const g = boostStreakGeometry();
        const pos = g.getAttribute( 'position' );
        const uv = g.getAttribute( 'uv' );
        for ( let i = 0; i < pos.count; i++ ) {
            expect( pos.getY( i ) ).toBeCloseTo( 0 );
            expect( pos.getZ( i ) ).toBeCloseTo( -uv.getY( i ) );
        }
    } );
} );

describe( 'boost level', () => {
    it( 'is zero when idle, eases out over the last ease window, and is full before it', () => {
        expect( boostLevel( 0, 0.2 ) ).toBe( 0 );
        expect( boostLevel( 0.1, 0.2 ) ).toBeCloseTo( 0.5 );
        expect( boostLevel( 1.5, 0.2 ) ).toBe( 1 );
    } );
} );

describe( 'boost pickup', () => {
    it( 'is centred on its anchor', () => {
        const g = boostPickupShellGeometry();
        g.computeBoundingBox();
        const b = g.boundingBox;
        expect( b ).not.toBeNull();
        if ( ! b ) return;
        expect( b.max.x + b.min.x ).toBeCloseTo( 0 );
        expect( b.max.y + b.min.y ).toBeCloseTo( 0 );
        expect( b.max.z + b.min.z ).toBeCloseTo( 0 );
    } );

    it.each( [
        [ 'shell', boostPickupShellGeometry ],
        [ 'glyph', boostPickupGlyphGeometry ],
        [ 'core', boostPickupCoreGeometry ],
    ] )( '%s chevrons point +x on both faces', ( _name, build ) => {
        const g = build();
        for ( const side of [ 1, -1 ] ) {
            const tipX = meanX( g, side, ( y ) => y < 0.05 );
            const armX = meanX( g, side, ( y ) => y > 0.6 );
            expect( tipX ).toBeGreaterThan( armX );
        }
    } );
} );
