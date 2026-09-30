import type { TugEvent } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import type { Tether } from './tug-line';
import { STALE_S } from './tug-line.constants';
import { applyTug, tetherDone } from './tug-line.utils';

function event( outcome: TugEvent[ 'outcome' ], seconds: number, ownerId = 'a' ): TugEvent {
    return { outcome, ownerId, targetId: 'v', dir: 1, x: 1, y: 2, z: 300, seconds };
}

describe( 'applyTug', () => {
    it( 'spawns a tether on the throw with the server throw time', () => {
        const tethers: Tether[] = [];
        applyTug( tethers, event( 'throw', 0.25 ) );
        expect( tethers ).toHaveLength( 1 );
        expect( tethers[ 0 ].throwS ).toBe( 0.25 );
        expect( tethers[ 0 ].latchAt ).toBe( -1 );
    } );

    it( 'latches the tether in flight at its current age with the pull time', () => {
        const tethers: Tether[] = [];
        applyTug( tethers, event( 'throw', 0.25 ) );
        tethers[ 0 ].age = 0.26;
        applyTug( tethers, { ...event( 'latch', 2 ), z: 320 } );
        expect( tethers ).toHaveLength( 1 );
        expect( tethers[ 0 ].latchAt ).toBe( 0.26 );
        expect( tethers[ 0 ].pullS ).toBe( 2 );
        expect( tethers[ 0 ].z ).toBe( 320 );
    } );

    it( 'reels a missed throw back at once', () => {
        const tethers: Tether[] = [];
        applyTug( tethers, event( 'throw', 0.25 ) );
        tethers[ 0 ].age = 0.25;
        applyTug( tethers, event( 'miss', 0 ) );
        expect( tethers[ 0 ].reelAt ).toBe( 0.25 );
        expect( tethers[ 0 ].latchAt ).toBe( -1 );
    } );

    it( 'matches a latch to its own owner', () => {
        const tethers: Tether[] = [];
        applyTug( tethers, event( 'throw', 0.25, 'a' ) );
        applyTug( tethers, event( 'throw', 0.25, 'b' ) );
        applyTug( tethers, event( 'anchor', 2, 'a' ) );
        expect( tethers[ 0 ].latchAt ).toBe( 0 );
        expect( tethers[ 1 ].latchAt ).toBe( -1 );
    } );

    it( 'spawns a latched tether when the throw was never seen', () => {
        const tethers: Tether[] = [];
        applyTug( tethers, event( 'latch', 2 ) );
        expect( tethers ).toHaveLength( 1 );
        expect( tethers[ 0 ].throwS ).toBe( 0 );
        expect( tethers[ 0 ].latchAt ).toBe( 0 );
    } );

    it( 'drops a tether that never reeled after the stale time', () => {
        const tethers: Tether[] = [];
        applyTug( tethers, event( 'throw', 0.25 ) );
        tethers[ 0 ].age = STALE_S - 0.01;
        expect( tetherDone( tethers[ 0 ] ) ).toBe( false );
        tethers[ 0 ].age = STALE_S;
        expect( tetherDone( tethers[ 0 ] ) ).toBe( true );
    } );
} );
