import type { SeekerState } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import {
    lockBars,
    lockShift,
    lockText,
    lockVisible,
    makeLock,
    nearestLock,
    timeToImpact,
} from './seeker-warning.utils';

function seeker( over: Partial< SeekerState > ): SeekerState {
    return {
        x: 0,
        y: 2.5,
        z: 0,
        vz: 180,
        ownerId: 'rival',
        targetId: 'me',
        ttl: 20,
        committed: false,
        dir: 1,
        ...over,
    };
}

const self = { x: 0, z: 400, vz: 80 };

describe( 'timeToImpact', () => {
    it( 'divides the gap by the closing speed', () => {
        expect( timeToImpact( seeker( { z: 200, vz: 180 } ), self ) ).toBeCloseTo( 2 );
    } );

    it( 'is infinite while the seeker is not closing', () => {
        expect( timeToImpact( seeker( { z: 200, vz: 60 } ), self ) ).toBe( Number.POSITIVE_INFINITY );
    } );

    it( 'handles a back-fired seeker flying toward -z', () => {
        expect( timeToImpact( seeker( { z: 600, vz: -120, dir: -1 } ), self ) ).toBeCloseTo( 1 );
    } );
} );

describe( 'nearestLock', () => {
    it( 'ignores seekers aimed at someone else', () => {
        const lock = nearestLock( [ seeker( { targetId: 'other' } ) ], 'me', self, makeLock() );
        expect( lock.count ).toBe( 0 );
        expect( lockText( lock ) ).toBe( '' );
    } );

    it( 'shows nothing for a ship that cannot be hit', () => {
        for ( const gone of [ undefined, { ...self, dead: true }, { ...self, finished: true } ] ) {
            expect( nearestLock( [ seeker( {} ) ], 'me', gone, makeLock() ).count ).toBe( 0 );
        }
    } );

    it( 'counts every lock and reports the soonest one', () => {
        const lock = nearestLock(
            [ seeker( { z: 0, x: -10 } ), seeker( { z: 300, x: 12, committed: true } ) ],
            'me',
            self,
            makeLock(),
        );
        expect( lock.count ).toBe( 2 );
        expect( lock.dx ).toBe( 12 );
        expect( lock.committed ).toBe( true );
        expect( lockText( lock ) ).toBe( '▲▲▲ LOCK ×2' );
    } );

    it( 'flags a lock that comes from ahead', () => {
        const lock = nearestLock( [ seeker( { z: 1100, vz: -120, dir: -1 } ) ], 'me', self, makeLock() );
        expect( lock.ahead ).toBe( true );
        expect( lockText( lock ) ).toBe( '▼▽▽ LOCK' );
    } );
} );

describe( 'lockBars', () => {
    it( 'fills as impact nears and is full once committed', () => {
        expect( lockBars( 5, false ) ).toBe( 1 );
        expect( lockBars( 2, false ) ).toBe( 2 );
        expect( lockBars( 1, false ) ).toBe( 3 );
        expect( lockBars( 5, true ) ).toBe( 3 );
    } );
} );

describe( 'lockShift', () => {
    it( 'clamps the lateral offset to one screen step each way', () => {
        expect( lockShift( 10 ) ).toBeCloseTo( 0.5 );
        expect( lockShift( -80 ) ).toBe( -1 );
    } );
} );

describe( 'lockVisible', () => {
    it( 'blinks while tracking and holds solid once committed', () => {
        const tracking = nearestLock( [ seeker( { z: 0 } ) ], 'me', self, makeLock() );
        expect( lockVisible( tracking, 0 ) ).toBe( true );
        expect( lockVisible( tracking, 400 ) ).toBe( false );
        tracking.committed = true;
        expect( lockVisible( tracking, 400 ) ).toBe( true );
    } );
} );
