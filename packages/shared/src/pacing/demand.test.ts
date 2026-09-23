import assert from 'node:assert/strict';
import { test } from 'node:test';
import { measureDemand, PACING_DZ, type ReferencePath } from '../index.js';

const CRUISE = 55;

function pathOf( xs: number[], air: number[] = [] ): ReferencePath {
    const a = new Uint8Array( xs.length );
    for ( const k of air ) a[ k ] = 1;
    return { x: Float32Array.from( xs ), air: a, stuck: new Uint8Array( xs.length ), maxStep: 2, airLimit: 30 };
}

test( 'a straight path has no moves and one quiet span the length of the track', () => {
    const d = measureDemand( pathOf( new Array( 110 ).fill( 0 ) ), CRUISE );
    assert.equal( d.moves.length, 0 );
    assert.equal( d.quiet.length, 1 );
    assert.ok( Math.abs( d.quiet[ 0 ].seconds - ( 110 * PACING_DZ ) / CRUISE ) < 1e-9 );
    assert.equal( d.bins.length, 2 );
} );

test( 'moves split the quiet time, reversals count direction changes, jumps count air', () => {
    const xs = new Array( 200 ).fill( 0 );
    for ( let k = 40; k < 50; k++ ) xs[ k ] = ( k - 39 ) * 0.5;
    for ( let k = 50; k < 200; k++ ) xs[ k ] = 5;
    for ( let k = 120; k < 130; k++ ) xs[ k ] = 5 - ( k - 119 ) * 0.5;
    for ( let k = 130; k < 200; k++ ) xs[ k ] = 0;
    const d = measureDemand( pathOf( xs, [ 160, 161, 162 ] ), CRUISE );
    assert.deepEqual(
        d.moves.map( ( m ) => m.kind ),
        [ 'strafe', 'strafe', 'jump' ],
    );
    assert.equal( d.quiet.length, 4 );
    assert.equal(
        d.bins.reduce( ( s, b ) => s + b.reversals, 0 ),
        1,
    );
    assert.equal(
        d.bins.reduce( ( s, b ) => s + b.jumps, 0 ),
        1,
    );
    const lateral = d.bins.reduce( ( s, b ) => s + b.lateral, 0 );
    assert.ok( Math.abs( lateral - 10 ) < 1e-6, `lateral total ${ lateral }` );
} );

test( 'a slow drift that pauses between steps is still one move', () => {
    const xs: number[] = [];
    for ( let k = 0; k < 60; k++ ) xs.push( Math.floor( k / 3 ) * 0.5 );
    const d = measureDemand( pathOf( xs ), CRUISE );
    assert.equal( d.moves.length, 1 );
} );
