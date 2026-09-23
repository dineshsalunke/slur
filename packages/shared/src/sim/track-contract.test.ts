import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    FZ_ROWS,
    rosterContractFailures,
    SHIP_CLASSES,
    TRACK_CONTRACT,
    WEAVE_CURVATURE_CAP,
    WEAVE_MIN_THREAD_FRACTION,
    WEAVE_PERIOD_ROWS,
    WEAVE_SLOPE_CAP,
    weaveLineLanes,
    weaveThreadSpeed,
} from '../index.js';

test( 'the shipped roster meets every track contract', () => {
    assert.deepEqual( rosterContractFailures( Object.values( SHIP_CLASSES ) ), [] );
} );

test( 'every ship class can follow the racing line well above the contract floor', () => {
    const floor = TRACK_CONTRACT.pacingCruise * WEAVE_MIN_THREAD_FRACTION;
    for ( const c of Object.values( SHIP_CLASSES ) ) {
        const thread = weaveThreadSpeed( c.tuning );
        assert.ok(
            thread >= floor,
            `class ${ c.id } follows the line at ${ thread.toFixed( 1 ) }u/s, under the ${ floor }u/s floor`,
        );
    }
} );

test( 'a ship faster than the contract brakes for the weave instead of reshaping it', () => {
    const fast = { ...SHIP_CLASSES.freighter.tuning, maxCruise: 124 };
    const thread = weaveThreadSpeed( fast );
    assert.equal(
        thread,
        weaveThreadSpeed( SHIP_CLASSES.freighter.tuning ),
        'how fast a ship can follow the line must not depend on its top speed',
    );
    assert.ok( thread < fast.maxCruise, 'a 124u/s freighter should have to lift off the throttle for the weave' );
    assert.deepEqual( rosterContractFailures( [ { id: 'fast-freighter', tuning: fast } ] ), [] );
} );

function weaveDigest( seed: number, rows: number ): number {
    let h = 0x811c9dc5 | 0;
    for ( let row = 0; row < rows; row++ ) {
        let v = Math.round( weaveLineLanes( seed, row ) * 1e6 ) | 0;
        for ( let b = 0; b < 4; b++ ) {
            h = Math.imul( h ^ ( v & 0xff ), 0x01000193 );
            v >>>= 8;
        }
    }
    return h >>> 0;
}

test( 'the racing line a seed generates is frozen (re-pin only for a deliberate reshape)', () => {
    assert.equal( WEAVE_SLOPE_CAP, 0.8387096774193549, 'WEAVE_SLOPE_CAP moved: every seed now weaves differently' );
    assert.equal(
        WEAVE_CURVATURE_CAP,
        0.09823100936524454,
        'WEAVE_CURVATURE_CAP moved: every seed now weaves differently',
    );
    assert.equal( FZ_ROWS, 49 );
    assert.equal( WEAVE_PERIOD_ROWS, 67 );
    assert.equal( weaveDigest( 1, 4000 ), 4017613166 );
    assert.equal( weaveDigest( 20260921, 4000 ), 3771230904 );
    assert.equal( weaveDigest( 0xdeadbeef, 4000 ), 1799438663 );
} );
