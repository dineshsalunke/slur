import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    FZ_ROWS,
    MOTIF_LIBRARY,
    motifDigest,
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
    const freighter = SHIP_CLASSES.freighter.tuning;
    const thread = weaveThreadSpeed( freighter );
    assert.equal(
        thread,
        weaveThreadSpeed( { ...freighter, maxCruise: freighter.maxCruise * 3 } ),
        'how fast a ship can follow the line must not depend on its top speed',
    );
    assert.ok( thread < freighter.maxCruise, 'the Freighter should have to lift off the throttle for the weave' );
    assert.deepEqual( rosterContractFailures( [ { id: 'freighter', tuning: freighter } ] ), [] );
} );

test( 'no class may outrun the frozen register cruise', () => {
    assert.equal( TRACK_CONTRACT.registerCruise, 124 );
    for ( const c of Object.values( SHIP_CLASSES ) )
        assert.ok( c.tuning.maxCruise <= TRACK_CONTRACT.registerCruise, c.id );
    const fast = { ...SHIP_CLASSES.freighter.tuning, maxCruise: TRACK_CONTRACT.registerCruise + 1 };
    assert.deepEqual( rosterContractFailures( [ { id: 'fast', tuning: fast } ] ), [
        'fast: maxCruise 125u/s exceeds the 124u/s register cruise',
    ] );
} );

test( 'the motif library is frozen (re-pin only for a deliberate reshape of every score seed)', () => {
    assert.equal( motifDigest( MOTIF_LIBRARY ), 2694968437 );
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
    assert.equal( FZ_ROWS, 63 );
    assert.equal( WEAVE_PERIOD_ROWS, 98 );
    assert.equal( weaveDigest( 1, 4000 ), 3647193385 );
    assert.equal( weaveDigest( 20260921, 4000 ), 2095466698 );
    assert.equal( weaveDigest( 0xdeadbeef, 4000 ), 372694567 );
} );
