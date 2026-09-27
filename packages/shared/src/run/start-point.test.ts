import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SHIP_ORDER, tuningForShip } from '../ship-classes.js';
import { AUTHORED_LEVEL_VERSION, type AuthoredLevel, authoredTrack } from '../sim/authored/authored-level.js';
import { openRunsAtSlice } from '../sim/clearance.js';
import { startPointFor, widestShip } from './start-point.js';

function level( blocks: AuthoredLevel[ 'blocks' ], gaps: AuthoredLevel[ 'gaps' ] = [] ): AuthoredLevel {
    return {
        version: AUTHORED_LEVEL_VERSION,
        id: 'start-point',
        name: 'start-point',
        length: 20,
        source: null,
        savedAt: '',
        blocks,
        gaps,
    };
}

test( 'a clear point on the deck is kept as it is', () => {
    const track = authoredTrack( level( [] ) );
    assert.deepEqual( startPointFor( track, widestShip(), 6, 120 ), { x: 6, z: 120 } );
} );

test( 'a point inside a block snaps to the nearest clear x at the same z', () => {
    const track = authoredTrack( level( [ { x: -8, z: 100, w: 20, l: 40, destructible: false } ] ) );
    const id = widestShip();
    const p = startPointFor( track, id, 0, 120 );
    assert.equal( p.z, 120 );
    assert.ok( p.x <= -8 - tuningForShip( id ).halfW, `x ${ p.x } clears the block's left face` );
} );

test( 'a point over a full-width gap steps back to a z with deck under it', () => {
    const track = authoredTrack( level( [], [ { x: -48, z: 100, w: 96, l: 60 } ] ) );
    assert.deepEqual( openRunsAtSlice( track.segmentAtZ( 130 ), 130 ), [] );
    const p = startPointFor( track, widestShip(), 0, 130 );
    assert.ok( p.z < 130 );
    const runs = openRunsAtSlice( track.segmentAtZ( p.z ), p.z );
    assert.ok(
        runs.some( ( [ lo, hi ] ) => lo <= p.x && p.x <= hi ),
        `deck under ${ p.x }, ${ p.z }`,
    );
} );

test( 'the start point stays on the track between the start line and the finish', () => {
    const track = authoredTrack( level( [] ) );
    const id = widestShip();
    assert.equal( startPointFor( track, id, 0, -50 ).z, 0 );
    assert.equal( startPointFor( track, id, 0, 1e6 ).z, track.finishZ - tuningForShip( id ).halfL );
} );

test( 'the widest ship is at least as wide as every class', () => {
    const w = tuningForShip( widestShip() ).halfW;
    for ( const id of SHIP_ORDER ) assert.ok( tuningForShip( id ).halfW <= w );
} );
