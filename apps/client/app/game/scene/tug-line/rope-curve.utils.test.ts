import { describe, expect, it } from 'vitest';
import {
    coilRadius,
    payout,
    pixelsPerUnitAt1,
    type RopeOffset,
    reelDue,
    reelFade,
    reelOffset,
    reelPayout,
    ropeOffset,
    ropeWidth,
    throwSeconds,
} from './rope-curve.utils';
import { LATE_S, MIN_PX, REEL_S, RIPPLE_S, ROPE_W, THROW_MAX_S, THROW_MIN_S, TREMOR_AMP } from './tug-line.constants';

const out: RopeOffset = { side: 0, up: 0 };

function maxBend( age: number, throwS: number, length: number ): number {
    let m = 0;
    for ( let i = 0; i <= 200; i++ ) {
        ropeOffset( i / 200, age, throwS, length, out );
        m = Math.max( m, Math.hypot( out.side, out.up ) );
    }
    return m;
}

describe( 'throwSeconds', () => {
    it( 'keeps the throw between the short and long bounds', () => {
        expect( throwSeconds( 1 ) ).toBe( THROW_MIN_S );
        expect( throwSeconds( 150 ) ).toBeLessThanOrEqual( THROW_MAX_S );
        expect( throwSeconds( 5000 ) ).toBe( THROW_MAX_S );
    } );
} );

describe( 'payout', () => {
    it( 'runs from 0 at the throw to 1 at the latch', () => {
        expect( payout( 0, 0.2 ) ).toBe( 0 );
        expect( payout( 0.1, 0.2 ) ).toBeCloseTo( 0.5 );
        expect( payout( 0.5, 0.2 ) ).toBe( 1 );
    } );
} );

describe( 'ropeOffset', () => {
    it( 'pins both ends at every age', () => {
        for ( const age of [ 0, 0.03, 0.1, 0.15, 0.2, 0.25, 0.4, 0.9 ] ) {
            for ( const s of [ 0, 1 ] ) {
                ropeOffset( s, age, 0.15, 60, out );
                expect( Math.abs( out.side ) + Math.abs( out.up ) ).toBeLessThan( 1e-9 );
            }
        }
    } );

    it( 'is slack in the throw, loose at the ship and straight at the hook', () => {
        expect( maxBend( 0.05, 0.15, 60 ) ).toBeGreaterThan( 0.3 );
        let near = 0;
        let far = 0;
        for ( let i = 0; i <= 100; i++ ) {
            const s = i / 100;
            ropeOffset( s, 0.05, 0.15, 60, out );
            const bend = Math.hypot( out.side, out.up );
            if ( s < 0.4 ) near = Math.max( near, bend );
            if ( s > 0.8 ) far = Math.max( far, bend );
        }
        expect( far ).toBeLessThan( near * 0.1 );
    } );

    it( 'flattens as the hook drags the slack out', () => {
        expect( maxBend( 0.14, 0.15, 60 ) ).toBeLessThan( maxBend( 0.03, 0.15, 60 ) );
    } );

    it( 'is continuous across the latch', () => {
        const before = maxBend( 0.15 - 1e-4, 0.15, 60 );
        const after = maxBend( 0.15 + 1e-4, 0.15, 60 );
        expect( Math.abs( before - after ) ).toBeLessThan( 0.02 );
    } );

    it( 'holds near-straight once the ripple has run', () => {
        for ( const since of [ RIPPLE_S, 0.3, 0.45 ] ) {
            expect( maxBend( 0.15 + since, 0.15, 60 ) ).toBeLessThanOrEqual( TREMOR_AMP + 1e-9 );
        }
    } );

    it( 'runs a ripple bigger than the tremor right after the latch', () => {
        expect( maxBend( 0.15 + RIPPLE_S * 0.4, 0.15, 60 ) ).toBeGreaterThan( TREMOR_AMP * 3 );
    } );
} );

describe( 'reelDue', () => {
    it( 'starts the reel as soon as a seen pull ends, but not before the latch', () => {
        expect( reelDue( 0.5, 0.15, 1.2, 0, true ) ).toBe( true );
        expect( reelDue( 0.1, 0.15, 1.2, 0, true ) ).toBe( false );
        expect( reelDue( 0.5, 0.15, 1.2, 0.3, true ) ).toBe( false );
    } );

    it( 'ignores a zero timer before the pull reaches the client', () => {
        expect( reelDue( 0.5, 0.15, 1.2, 0, false ) ).toBe( false );
    } );

    it( 'falls back to the hold time, with a grace when a pull is still running', () => {
        expect( reelDue( 1.2, 0.15, 1.2, -1, false ) ).toBe( true );
        expect( reelDue( 1.2, 0.15, 1.2, 0.1, true ) ).toBe( false );
        expect( reelDue( 1.2 + LATE_S, 0.15, 1.2, 0.1, true ) ).toBe( true );
    } );
} );

describe( 'reel', () => {
    it( 'winds the hook from the anchor back to the ship', () => {
        expect( reelPayout( 0 ) ).toBe( 1 );
        expect( reelPayout( REEL_S / 2 ) ).toBeCloseTo( 0.5 );
        expect( reelPayout( REEL_S ) ).toBe( 0 );
        for ( let i = 1; i <= 20; i++ ) {
            expect( reelPayout( ( i / 20 ) * REEL_S ) ).toBeLessThanOrEqual(
                reelPayout( ( ( i - 1 ) / 20 ) * REEL_S ),
            );
        }
    } );

    it( 'stays bright while it winds and fades out only at the end', () => {
        expect( reelFade( REEL_S * 0.5 ) ).toBe( 1 );
        expect( reelFade( REEL_S * 0.9 ) ).toBeLessThan( 1 );
        expect( reelFade( REEL_S ) ).toBe( 0 );
    } );

    it( 'pins both ends and settles as the rope comes in', () => {
        for ( const since of [ 0, 0.1, 0.3 ] ) {
            for ( const s of [ 0, 1 ] ) {
                reelOffset( s, since, 60, out );
                expect( Math.abs( out.side ) + Math.abs( out.up ) ).toBeLessThan( 1e-9 );
            }
        }
        let early = 0;
        let late = 0;
        for ( let i = 0; i <= 100; i++ ) {
            early = Math.max( early, Math.abs( reelOffset( i / 100, REEL_S * 0.1, 60, out ).side ) );
            late = Math.max( late, Math.abs( reelOffset( i / 100, REEL_S * 0.9, 60, out ).side ) );
        }
        expect( late ).toBeLessThan( early );
    } );

    it( 'regrows the coil as the payout returns to zero', () => {
        expect( coilRadius( 0, reelPayout( REEL_S ) ) ).toBeGreaterThan( coilRadius( 0, reelPayout( REEL_S / 2 ) ) );
    } );
} );

describe( 'coilRadius', () => {
    it( 'shrinks to nothing as the rope pays out', () => {
        expect( coilRadius( 0, 0 ) ).toBeGreaterThan( 0 );
        expect( coilRadius( 0, 1 ) ).toBe( 0 );
    } );
} );

describe( 'ropeWidth', () => {
    it( 'never falls under the minimum pixel footprint', () => {
        const ppu = pixelsPerUnitAt1( 813, 70 );
        expect( ropeWidth( ROPE_W, 10, ppu ) ).toBe( ROPE_W );
        for ( const d of [ 50, 150, 400 ] ) {
            expect( ( ropeWidth( ROPE_W, d, ppu ) * ppu ) / d ).toBeGreaterThanOrEqual( MIN_PX - 1e-9 );
        }
    } );
} );
