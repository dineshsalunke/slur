import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { type Anchor, LEAD_SEGMENTS, type Segment, TRACK_GENS, type TrackGen } from './space.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';

const DIGEST_SEEDS = [ 1, 7, 42, 1337, 24301 ];

const FROZEN: Partial< Record< TrackGen, Record< number, string > > > = {
    weave: {
        1: '2016bfab544d70db',
        7: 'bf36b5dc7bab9163',
        42: '26e0d6e50e4f8cab',
        1337: '2f529bfc3bb2906e',
        24301: '891d2561764a5454',
    },
    groove: {
        1: '3d86632aac77f5d7',
        7: 'd0f36c4545f37a8c',
        42: '9c621d5604ce962b',
        1337: '7c616791fa3b1370',
        24301: 'c04d9939218a97d6',
    },
    phrase: {
        1: '58bbd49d9e3b2f50',
        7: '7b9b5e50322f6837',
        42: '5aaf49a61c263b79',
        1337: '654837291619a350',
        24301: 'b30ec16a35f65f03',
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
    const descriptor = procgenDescriptor( seed, gen );
    const length = descriptor.kind === 'procgen' ? descriptor.length : 0;
    const track = resolveTrack( descriptor );
    const hash = createHash( 'sha256' );
    for ( let i = -LEAD_SEGMENTS - 2; i < length + 2; i++ ) hash.update( `${ segmentLine( track.segmentAt( i ) ) }\n` );
    hash.update( `finish ${ track.finishZ }\n` );
    for ( const a of track.anchors ) hash.update( `${ anchorLine( a ) }\n` );
    return hash.digest( 'hex' ).slice( 0, 16 );
}

for ( const gen of TRACK_GENS ) {
    const frozen = FROZEN[ gen ];
    if ( frozen === undefined ) continue;
    test( `${ gen } geometry matches its frozen digest on every fixed seed`, () => {
        const actual = Object.fromEntries( DIGEST_SEEDS.map( ( seed ) => [ seed, trackDigest( gen, seed ) ] ) );
        assert.deepEqual( actual, frozen );
    } );
}
