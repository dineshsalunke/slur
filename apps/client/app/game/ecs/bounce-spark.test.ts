import {
    DEFAULT_TUNING,
    emptyInput,
    FIXED_DT,
    fullFloor,
    type Segment,
    simulate,
    spawnShip,
    type Track,
} from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { drainHits, type HitEvent } from '../scene/hit-events';
import { sparkIfBounced } from './bounce-spark';

const t = DEFAULT_TUNING;
const SEGS = 20;
const TICKS = 240;

function trackWith( x0: number, x1: number ): Track {
    const segs: Segment[] = Array.from( { length: SEGS }, ( _, i ) => ( {
        index: i,
        z0: i * 20,
        z1: i * 20 + 20,
        kind: 'plain',
        floors: fullFloor( 0 ),
        blocks: [],
        isFinish: false,
    } ) );
    segs[ 5 ].blocks.push( { x0, x1, y0: 0, y1: 8, z0: 104, z1: 110, id: 1, kind: 'sealed' } );
    const at = ( i: number ) => segs[ Math.max( 0, Math.min( SEGS - 1, i ) ) ];
    return { finishZ: 1e9, anchors: [], segmentAt: at, segmentAtZ: ( z ) => at( Math.floor( z / 20 ) ) };
}

function flyInto( track: Track, escapeStrafe: number ): HitEvent[] {
    drainHits( () => {} );
    const s = spawnShip( 0, 20 );
    s.vz = t.maxCruise;
    const hits: HitEvent[] = [];
    let bounced = false;
    for ( let i = 0; i < TICKS; i++ ) {
        const stunBefore = s.stunTimer;
        const vzBefore = s.vz;
        const strafe = bounced ? escapeStrafe : 0;
        simulate( s, { ...emptyInput( i ), throttle: 1, strafe }, FIXED_DT, t, track );
        bounced ||= s.stunTimer > 0;
        sparkIfBounced( s, stunBefore, vzBefore, FIXED_DT, t );
    }
    drainHits( ( e ) => hits.push( e ) );
    return hits;
}

describe( 'sparkIfBounced', () => {
    it( 'fires nothing on a clean run', () => {
        expect( flyInto( trackWith( 10, 20 ), 0 ) ).toEqual( [] );
    } );

    it( 'fires at the front face on a head-on bounce', () => {
        const hits = flyInto( trackWith( -6, 6 ), 1 );
        expect( hits.length ).toBeGreaterThan( 0 );
        expect( hits[ 0 ].x ).toBeCloseTo( 0, 1 );
        expect( hits[ 0 ].z ).toBeCloseTo( 104, 0 );
    } );

    it( 'fires again for each fresh bounce while the ship keeps driving into the wall', () => {
        expect( flyInto( trackWith( -20, 20 ), 0 ).length ).toBeGreaterThan( 1 );
    } );
} );
