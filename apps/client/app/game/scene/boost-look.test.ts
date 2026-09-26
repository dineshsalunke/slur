import { describe, expect, it } from 'vitest';
import { boostPickupShellGeometry, boostStreakGeometry } from './boost-look';
import { boostLevel } from './boost-streaks/boost-streaks.utils';

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
} );
