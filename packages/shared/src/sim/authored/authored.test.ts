import assert from 'node:assert/strict';
import { test } from 'node:test';
import { HALF_WIDTH, type Segment, START_SAFE, spanHasZ, type Track, type TrackGen } from '../space.js';
import { procgenDescriptor, resolveTrack } from '../track-provider.js';
import {
    type AuthoredLevel,
    authoredTrack,
    parseAuthoredLevel,
    registerAuthoredLevel,
    serializeAuthoredLevel,
} from './authored-level.js';
import { decompileTrack } from './decompile.js';

const LEVEL: AuthoredLevel = {
    version: 1,
    id: 'hand-made',
    name: 'Hand made',
    length: 40,
    source: { gen: 'groove', seed: 20260921 },
    savedAt: '2026-09-27T00:00:00.000Z',
    blocks: [
        { x: 4, z: 300, w: 8, l: 4, destructible: false },
        { x: -12, z: 300, w: 8, l: 4, destructible: true },
    ],
    gaps: [ { x: -HALF_WIDTH, z: 500, w: 2 * HALF_WIDTH, l: 12 } ],
};

function boxes( s: Segment ): string[] {
    return s.blocks.map( ( b ) => `${ b.kind } ${ b.x0 } ${ b.x1 } ${ b.z0 } ${ b.z1 }` ).sort();
}

function onFloor( s: Segment, x: number, z: number ): boolean {
    return s.floors.some( ( f ) => x >= f.x0 && x <= f.x1 && spanHasZ( s, f, z ) );
}

function assertSameGeometry( a: Track, b: Track, from: number ): void {
    assert.equal( a.finishZ, b.finishZ );
    for ( let i = from; i * 20 < a.finishZ; i++ ) {
        const [ sa, sb ] = [ a.segmentAt( i ), b.segmentAt( i ) ];
        assert.deepEqual( boxes( sb ), boxes( sa ), `blocks differ in segment ${ i }` );
        for ( let z = sa.z0 + 0.5; z < sa.z1; z += 1 )
            for ( let x = -HALF_WIDTH + 0.5; x < HALF_WIDTH; x += 1 )
                assert.equal( onFloor( sb, x, z ), onFloor( sa, x, z ), `floor differs at x=${ x } z=${ z }` );
    }
}

test( 'serialize then parse returns the same level, entries sorted by z then x', () => {
    const text = serializeAuthoredLevel( LEVEL );
    const back = parseAuthoredLevel( JSON.parse( text ) );
    assert.deepEqual(
        back.blocks.map( ( b ) => b.x ),
        [ -12, 4 ],
    );
    assert.deepEqual( { ...back, blocks: [] }, { ...LEVEL, blocks: [] } );
    assert.equal( text.split( '\n' ).filter( ( l ) => l.includes( '"destructible"' ) ).length, 2 );
} );

test( 'parse rejects out-of-bounds, empty and malformed entries', () => {
    const bad = ( patch: Partial< AuthoredLevel > | Record< string, unknown > ) =>
        assert.throws( () => parseAuthoredLevel( { ...LEVEL, ...patch } ) );
    bad( { version: 2 } );
    bad( { id: '../escape' } );
    bad( { length: 3 } );
    bad( { blocks: [ { x: 44, z: 300, w: 8, l: 4, destructible: true } ] } );
    bad( { blocks: [ { x: 0, z: 300, w: 0, l: 4, destructible: true } ] } );
    bad( { blocks: [ { x: 0, z: 300, w: 4, l: 4 } ] } );
    bad( { gaps: [ { x: 0, z: 795, w: 4, l: 8 } ] } );
    bad( { gaps: [ { x: 0, z: -1, w: 4, l: 4 } ] } );
    bad( { gaps: 'none' } );
} );

test( 'authored track places blocks and gaps where the level says', () => {
    const t = authoredTrack( LEVEL );
    assert.equal( t.finishZ, 800 );
    assert.deepEqual( t.anchors, [] );
    assert.deepEqual( boxes( t.segmentAt( 15 ) ), [ 'fractured -12 -4 300 304', 'sealed 4 12 300 304' ] );
    assert.equal( onFloor( t.segmentAt( 25 ), 0, 505 ), false );
    assert.equal( onFloor( t.segmentAt( 25 ), 0, 513 ), true );
} );

test( 'resolveTrack serves a registered authored level and throws for an unknown one', () => {
    registerAuthoredLevel( LEVEL );
    assert.equal( resolveTrack( { kind: 'authored', levelId: 'hand-made' } ).finishZ, 800 );
    assert.throws( () => resolveTrack( { kind: 'authored', levelId: 'missing' } ) );
} );

for ( const [ gen, seed ] of [
    [ 'groove', 20260921 ],
    [ 'groove', 7 ],
    [ 'phrase', 42 ],
] as [ TrackGen, number ][] ) {
    test( `decompile of ${ gen } seed ${ seed } rebuilds the same geometry`, () => {
        const source = resolveTrack( procgenDescriptor( seed, gen ) );
        const level = decompileTrack( source, { id: `${ gen }-${ seed }`, source: { gen, seed } } );
        const reparsed = parseAuthoredLevel( JSON.parse( serializeAuthoredLevel( level ) ) );
        assertSameGeometry( source, authoredTrack( reparsed ), START_SAFE );
        assert.deepEqual( decompileTrack( authoredTrack( reparsed ), { id: level.id } ).blocks, reparsed.blocks );
    } );
}
