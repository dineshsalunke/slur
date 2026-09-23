import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    airDistance,
    buildGrid,
    clearsGap,
    DEFAULT_TUNING,
    freezeTrack,
    HALF_WIDTH,
    measureGaps,
    referencePath,
    SEG_LEN,
    TRACK_CONTRACT,
    takeoffWindow,
} from '../index.js';
import { syntheticTrack } from './fixture.test.js';

function holeTrack( holeLen: number ) {
    return syntheticTrack( 8, ( s ) => {
        if ( s.index !== 3 ) return s;
        return {
            ...s,
            kind: 'gap',
            floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0, z0: s.z0 + holeLen, z1: s.z1 } ],
        };
    } );
}

test( 'a double jump carries further than a single one', () => {
    const single = airDistance( DEFAULT_TUNING, 'single' );
    const double = airDistance( DEFAULT_TUNING, 'double' );
    assert.ok( single > 20, `single jump covers ${ single }u` );
    assert.ok( double > single, `double ${ double } is not beyond single ${ single }` );
} );

test( 'a longer hole leaves a shorter takeoff window', () => {
    const lip = 3 * SEG_LEN;
    const short = takeoffWindow( holeTrack( 8 ), DEFAULT_TUNING, 0, lip, lip + 8, 'single' );
    const long = takeoffWindow( holeTrack( 18 ), DEFAULT_TUNING, 0, lip, lip + 18, 'single' );
    assert.ok( short !== null && long !== null );
    assert.ok( short.seconds > long.seconds, `${ short.seconds }s vs ${ long.seconds }s` );
    assert.ok( long.to >= 0 && long.from < 0, 'the window should straddle the lip' );
} );

test( 'a full-width hole is a forced jump, measured on the column the path flew', () => {
    const frozen = freezeTrack( holeTrack( 16 ) );
    const grid = buildGrid( frozen );
    const path = referencePath( grid, TRACK_CONTRACT.pacingCruise, 30 );
    const [ gap ] = measureGaps( frozen, grid, path, DEFAULT_TUNING );
    assert.equal( gap.forced, true );
    assert.equal( gap.jumped, true );
    assert.equal( gap.holeLen, 16 );
    assert.ok( gap.single !== null && gap.double !== null );
    assert.ok( gap.double.seconds >= gap.single.seconds );
    assert.ok( gap.double.from > -90, `double window starts ${ gap.double.from }u out, at the scan edge` );
    assert.equal( gap.slot, false );
} );

test( 'a double jump presses once in the air, never again from the floor', () => {
    const lip = 3 * SEG_LEN;
    const early = lip - 80;
    const exit = lip + 16 + DEFAULT_TUNING.halfL + 2;
    assert.equal( clearsGap( holeTrack( 16 ), DEFAULT_TUNING, 0, early, exit, 'double' ), false );
} );

test( 'a hole with floor beside it is optional', () => {
    const track = syntheticTrack( 8, ( s ) =>
        s.index === 3 ? { ...s, kind: 'gap', floors: [ { x0: 8, x1: HALF_WIDTH, y: 0 } ] } : s,
    );
    const frozen = freezeTrack( track );
    const grid = buildGrid( frozen );
    const [ gap ] = measureGaps( frozen, grid, referencePath( grid, TRACK_CONTRACT.pacingCruise, 30 ), DEFAULT_TUNING );
    assert.equal( gap.forced, false );
} );

test( 'a hole the hull spans is rolled over, and gets no takeoff window', () => {
    const frozen = freezeTrack( holeTrack( 2 ) );
    const grid = buildGrid( frozen );
    const [ gap ] = measureGaps( frozen, grid, referencePath( grid, TRACK_CONTRACT.pacingCruise, 30 ), DEFAULT_TUNING );
    assert.equal( gap.rolls, true );
    assert.equal( gap.single, null );
    const [ deep ] = measureGaps(
        freezeTrack( holeTrack( 16 ) ),
        buildGrid( freezeTrack( holeTrack( 16 ) ) ),
        referencePath( buildGrid( freezeTrack( holeTrack( 16 ) ) ), TRACK_CONTRACT.pacingCruise, 30 ),
        DEFAULT_TUNING,
    );
    assert.equal( deep.rolls, false );
} );
