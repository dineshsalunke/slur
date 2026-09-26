import assert from 'node:assert/strict';
import { test } from 'node:test';
import { pickupPower, pickupsOf } from '../combat/pickups.js';
import {
    PICKUP_GAP_MIN_SEGS,
    PICKUP_X_MAX,
    pickupColumnClear,
    pickupIdSalt,
    pickupOrdinal,
    pickupSalt,
} from './pickup-place.js';
import { SEG_LEN, type Segment, type TrackGen } from './space.js';
import { procgenDescriptor, resolveTrack } from './track-provider.js';

const SEEDS = Array.from( { length: 30 }, ( _, k ) => k + 1 );
const GENS: TrackGen[] = [ 'groove', 'weave' ];
const WIDE_X = 24;

function memo( at: ( i: number ) => Segment ): ( i: number ) => Segment {
    const cache = new Map< number, Segment >();
    return ( i ) => {
        let s = cache.get( i );
        if ( s === undefined ) {
            s = at( i );
            cache.set( i, s );
        }
        return s;
    };
}

test( 'pickup ids parse back to ordinal and salt', () => {
    assert.equal( pickupOrdinal( '42.abc' ), 42 );
    assert.equal( pickupIdSalt( '42.abc' ), 'abc' );
    assert.equal( pickupOrdinal( '17' ), 17 );
    assert.equal( pickupIdSalt( '17' ), '' );
} );

for ( const gen of GENS ) {
    test( `${ gen }: pickups are spaced, spread across the deck, and every one has a clear approach`, () => {
        let wide = 0;
        let total = 0;
        const orders = new Set< string >();
        for ( const seed of SEEDS ) {
            const track = resolveTrack( procgenDescriptor( seed, gen ) );
            const at = memo( ( i ) => track.segmentAt( i ) );
            const pickups = pickupsOf( track );
            assert.equal(
                new Set( pickups.map( ( p ) => p.id ) ).size,
                pickups.length,
                `seed ${ seed }: duplicate id`,
            );
            pickups.forEach( ( p, k ) => {
                assert.ok( p.id.endsWith( `.${ pickupSalt( seed ) }` ), `seed ${ seed }: ${ p.id } unsalted` );
                assert.ok( Math.abs( p.x ) <= PICKUP_X_MAX, `seed ${ seed }: ${ p.id } past the rail margin` );
                assert.ok( pickupColumnClear( p.x, p.z, at ), `seed ${ seed }: ${ p.id } approach blocked` );
                if ( k > 0 ) assert.ok( p.z - pickups[ k - 1 ].z >= PICKUP_GAP_MIN_SEGS * SEG_LEN );
                if ( Math.abs( p.x ) > WIDE_X ) wide++;
            } );
            total += pickups.length;
            orders.add( pickups.map( ( p ) => pickupPower( p.id ) ).join( '' ) );
        }
        assert.ok( wide / total >= 0.25, `${ gen }: only ${ wide }/${ total } pickups beyond ±${ WIDE_X }u` );
        assert.equal( orders.size, SEEDS.length, `${ gen }: power orders repeat across seeds` );
    } );
}
