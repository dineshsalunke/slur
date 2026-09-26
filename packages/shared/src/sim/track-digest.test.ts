import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { type Anchor, LEAD_SEGMENTS, type Segment, TRACK_SEGMENTS, type TrackGen } from './space.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';

const DIGEST_SEEDS = [ 1, 7, 42, 1337, 24301 ];

const FROZEN: Record< 'weave' | 'groove', Record< number, string > > = {
    weave: {
        1: '904adcbd62066d5d',
        7: '3aef48913dc97150',
        42: '3ca287da0be94804',
        1337: '654fa7c05c9a1539',
        24301: 'c427d592796d02f4',
    },
    groove: {
        1: '3d86632aac77f5d7',
        7: 'd0f36c4545f37a8c',
        42: '9c621d5604ce962b',
        1337: '7c616791fa3b1370',
        24301: 'c04d9939218a97d6',
    },
};

function segmentLine( s: Segment ): string {
    const floors = s.floors.map( ( f ) => [ f.x0, f.x1, f.y, f.z0 ?? '-', f.z1 ?? '-' ].join( ',' ) );
    const blocks = s.blocks.map( ( b ) => [ b.id, b.kind, b.x0, b.x1, b.y0, b.y1, b.z0, b.z1 ].join( ',' ) );
    return [ s.index, s.z0, s.z1, s.kind, s.isFinish, floors.join( ';' ), blocks.join( ';' ) ].join( '|' );
}

function anchorLine( a: Anchor ): string {
    return [ a.id, a.kind, a.x, a.y, a.z, JSON.stringify( a.params ?? null ) ].join( '|' );
}

function trackDigest( gen: TrackGen, seed: number ): string {
    const track = resolveTrack( procgenDescriptor( seed, gen ) );
    const hash = createHash( 'sha256' );
    for ( let i = -LEAD_SEGMENTS - 2; i < TRACK_SEGMENTS + 2; i++ )
        hash.update( `${ segmentLine( track.segmentAt( i ) ) }\n` );
    hash.update( `finish ${ track.finishZ }\n` );
    for ( const a of track.anchors ) hash.update( `${ anchorLine( a ) }\n` );
    return hash.digest( 'hex' ).slice( 0, 16 );
}

for ( const gen of [ 'weave', 'groove' ] as const ) {
    test( `${ gen } geometry matches its frozen digest on every fixed seed`, () => {
        const actual = Object.fromEntries( DIGEST_SEEDS.map( ( seed ) => [ seed, trackDigest( gen, seed ) ] ) );
        assert.deepEqual( actual, FROZEN[ gen ] );
    } );
}
