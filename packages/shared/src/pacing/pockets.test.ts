import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    classPockets,
    freezeTrack,
    type PacingPocket,
    pocketSlot,
    procgenDescriptor,
    resolveTrack,
    SHIP_CLASSES,
    type ShipClassId,
    squeezesThrough,
} from '../index.js';
import { syntheticTrack, wall } from './fixture.test.js';

const CLASSES = Object.values( SHIP_CLASSES );

function corridor( frontSeg: number ) {
    return freezeTrack(
        syntheticTrack( 10, ( s ) => {
            if ( s.index === 3 || s.index === 4 )
                return { ...s, blocks: [ wall( s.index, -20, -4 ), wall( s.index, 4, 20 ) ] };
            if ( s.index === frontSeg ) return { ...s, blocks: [ wall( s.index, -4, 4 ) ] };
            return s;
        } ),
    );
}

function inBox( p: PacingPocket, k0: number, k1: number, x0: number, x1: number ): boolean {
    return p.k0 <= k1 && k0 <= p.k1 && p.x0 <= x1 && x0 <= p.x1;
}

test( 'a corridor closed at its end traps every class', () => {
    const frozen = corridor( 5 );
    for ( const c of CLASSES ) {
        const trapped = classPockets( frozen, c.id, c.tuning ).filter( ( p ) => p.trapped );
        assert.equal( trapped.length, 1, `${ c.id }: ${ JSON.stringify( trapped ) }` );
        assert.ok( inBox( trapped[ 0 ], 50, 100, -4, 4 ) );
        assert.equal( trapped[ 0 ].window, 0 );
    }
} );

test( 'a side slot longer than every ship frees the corridor', () => {
    const frozen = corridor( 6 );
    for ( const c of CLASSES ) {
        const trapped = classPockets( frozen, c.id, c.tuning ).filter( ( p ) => p.trapped );
        assert.deepEqual( trapped, [], c.id );
    }
} );

const FIXTURE = freezeTrack( resolveTrack( procgenDescriptor( 20260921 ) ) );

function fixturePockets( id: ShipClassId ): PacingPocket[] {
    return classPockets( FIXTURE, id, SHIP_CLASSES[ id ].tuning ).filter(
        ( p ) => p.trapped && inBox( p, 2446, 2460, 9, 11 ),
    );
}

test( 'seed 20260921 z 2446-2460 traps the freighter by its 2.6u slot', () => {
    const [ pocket, ...rest ] = fixturePockets( 'freighter' );
    assert.deepEqual( rest, [] );
    assert.ok(
        pocket.window > 1 && pocket.window < pocketSlot( SHIP_CLASSES.freighter.tuning ),
        `window ${ pocket.window }`,
    );
} );

test( 'seed 20260921 z 2446-2460 traps the phantom: a 3.6u window is shorter than its own length', () => {
    const [ pocket, ...rest ] = fixturePockets( 'phantom' );
    assert.deepEqual( rest, [] );
    assert.ok(
        pocket.window > 2 && pocket.window < pocketSlot( SHIP_CLASSES.phantom.tuning ),
        `window ${ pocket.window }`,
    );
} );

test( 'seed 20260921 z 2446-2460 frees every other class', () => {
    for ( const id of [ 'comet', 'interceptor', 'fighter' ] as const ) {
        assert.deepEqual( fixturePockets( id ), [], id );
    }
} );

test( 'the phantom leaves the fixture pocket left, through a 3.5u stop window', () => {
    const t = SHIP_CLASSES.phantom.tuning;
    const squeeze = ( stopZ: number ): boolean => squeezesThrough( FIXTURE.track, t, { fromX: 10, stopZ, toX: 3 } );
    assert.ok( squeeze( 2459.7 ) && squeeze( 2463.2 ) );
    assert.ok( ! squeeze( 2459.6 ) && ! squeeze( 2463.3 ) );
} );
