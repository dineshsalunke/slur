import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tuningForShip } from '../ship-classes.js';
import { BLOCK_HEIGHT, type Block, HALF_WIDTH, SEG_LEN, type Segment, type Track } from '../sim/space.js';
import {
    DEFAULT_PORTAL_CONFIG as CFG,
    clearSpotAt,
    hopThroughPortal,
    type PortalRider,
    type PortalState,
    placePortalEnd,
    portalReach,
    portalTargetZ,
} from './portal.js';

const HULL = tuningForShip( 'fighter' );
const HALF_CLEAR = CFG.portalClearW / 2;

interface Fixture {
    gapAt?: number;
    blocks?: Omit< Block, 'id' | 'kind' | 'y0' | 'y1' >[];
    finishZ?: number;
}

function track( { gapAt = -1, blocks = [], finishZ = 1e9 }: Fixture = {} ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: i === gapAt ? 'gap' : 'plain',
        floors: i === gapAt ? [] : [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: blocks
            .map( ( b, k ) => ( { ...b, y0: 0, y1: BLOCK_HEIGHT, id: k + 1, kind: 'sealed' as const } ) )
            .filter( ( b ) => b.z1 > i * SEG_LEN && b.z0 < ( i + 1 ) * SEG_LEN ),
        isFinish: false,
    } );
    return { finishZ, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function rider( over: Partial< PortalRider > = {} ): PortalRider {
    return {
        x: 0,
        y: 0,
        z: 0,
        vz: 60,
        dead: false,
        finished: false,
        lastSafeX: 0,
        lastSafeZ: 0,
        portalHops: 0,
        ...over,
    };
}

function pair( az: number, bz: number, over: Partial< PortalState > = {} ): PortalState {
    return { ax: 0, ay: 0, az, bx: 10, by: 0, bz, ends: 2, armA: true, armB: true, ...over };
}

test( 'near forward leads by portalNearLeadS at the current speed', () => {
    const z = portalTargetZ( { x: 0, z: 100, vz: 50 }, HULL, false, 1 );
    assert.equal( z, 100 + portalReach( HULL, CFG, 1 ) + 50 * CFG.portalNearLeadS );
} );

test( 'far is one portalFarS of travel at the hull cruise, both ways', () => {
    const ship = { x: 0, z: 500, vz: 0 };
    const reach = HULL.maxCruise * CFG.portalFarS;
    assert.equal( portalTargetZ( ship, HULL, true, 1 ), 500 + portalReach( HULL, CFG, 1 ) + reach );
    assert.equal( portalTargetZ( ship, HULL, true, -1 ), 500 - portalReach( HULL, CFG, -1 ) - reach );
} );

test( 'near back sits behind the tail by the back gap', () => {
    const z = portalTargetZ( { x: 0, z: 100, vz: 80 }, HULL, false, -1 );
    assert.equal( z, 100 - HULL.halfL - CFG.portalR - CFG.portalBackGap );
} );

test( 'open deck places the end straight at the target', () => {
    const spot = placePortalEnd( { x: 5, z: 200, vz: 0 }, HULL, true, 1, track(), new Set() );
    assert.deepEqual( spot, { x: 5, y: 0, z: portalTargetZ( { x: 5, z: 200, vz: 0 }, HULL, true, 1 ) } );
} );

test( 'an end inside a block moves sideways to the nearest clear x', () => {
    const z = 240;
    const t = track( { blocks: [ { x0: -4, x1: 6, z0: z - 4, z1: z + 4 } ] } );
    const spot = clearSpotAt( t, new Set(), 0, z );
    assert.ok( spot );
    assert.equal( spot.x, -4 - HALF_CLEAR );
} );

test( 'a broken block does not push the end', () => {
    const z = 240;
    const t = track( { blocks: [ { x0: -4, x1: 6, z0: z - 4, z1: z + 4 } ] } );
    const id = t.segmentAtZ( z ).blocks[ 0 ].id;
    assert.equal( clearSpotAt( t, new Set( [ id ] ), 0, z )?.x, 0 );
} );

test( 'the deck edge keeps the clear width on the deck', () => {
    const spot = clearSpotAt( track(), new Set(), HALF_WIDTH - 1, 100 );
    assert.equal( spot?.x, HALF_WIDTH - HALF_CLEAR );
} );

test( 'a full-width wall steps the end back toward the ship', () => {
    const ship = { x: 0, z: 100, vz: 0 };
    const target = portalTargetZ( ship, HULL, true, 1 );
    const wall = { x0: -HALF_WIDTH, x1: HALF_WIDTH, z0: target - 10, z1: target + 10 };
    const spot = placePortalEnd( ship, HULL, true, 1, track( { blocks: [ wall ] } ), new Set() );
    assert.ok( spot );
    assert.ok( spot.z <= wall.z0 - CFG.portalClearHalfL );
    assert.ok( spot.z > wall.z0 - CFG.portalClearHalfL - CFG.portalZStep );
} );

test( 'a gap under the target steps the end back to the deck', () => {
    const ship = { x: 0, z: 10, vz: 0 };
    const target = portalTargetZ( ship, HULL, true, 1 );
    const gapAt = Math.floor( target / SEG_LEN );
    const spot = placePortalEnd( ship, HULL, true, 1, track( { gapAt } ), new Set() );
    assert.ok( spot );
    assert.ok( spot.z + CFG.portalClearHalfL <= gapAt * SEG_LEN );
} );

test( 'no clear spot between the target and the ship fizzles', () => {
    const ship = { x: 0, z: 100, vz: 0 };
    const wall = { x0: -HALF_WIDTH, x1: HALF_WIDTH, z0: 100, z1: 400 };
    assert.equal( placePortalEnd( ship, HULL, true, 1, track( { blocks: [ wall ] } ), new Set() ), null );
} );

test( 'the far end stops short of the finish line', () => {
    const t = track( { finishZ: 300 } );
    const spot = placePortalEnd( { x: 0, z: 285, vz: 0 }, HULL, true, 1, t, new Set() );
    assert.equal( spot, null );
    const early = placePortalEnd( { x: 0, z: 200, vz: 0 }, HULL, true, 1, t, new Set() );
    assert.equal( early?.z, 300 - CFG.portalFinishGap );
} );

test( 'crossing end A forward exits past end B with velocity kept', () => {
    const s = rider( { z: 50.5, vz: 60, x: 1, y: 2 } );
    assert.ok( hopThroughPortal( s, 49.5, HULL, [ pair( 50, 300 ) ] ) );
    assert.equal( s.x, 10 );
    assert.equal( s.y, 2 );
    assert.equal( s.z, 300 + CFG.portalR + HULL.halfL + CFG.portalExitGap );
    assert.equal( s.vz, 60 );
    assert.equal( s.portalHops, 1 );
    assert.deepEqual( [ s.lastSafeX, s.lastSafeZ ], [ 10, 300 ] );
} );

test( 'two-way: crossing end B throws the ship back to end A', () => {
    const s = rider( { z: 301, x: 10 } );
    assert.ok( hopThroughPortal( s, 299, HULL, [ pair( 50, 300 ) ] ) );
    assert.equal( s.z, 50 + CFG.portalR + HULL.halfL + CFG.portalExitGap );
} );

test( 'a fast ship cannot tunnel through an end', () => {
    const s = rider( { z: 53 } );
    assert.ok( hopThroughPortal( s, 50.5 - 150 / 60, HULL, [ pair( 50, 300 ) ] ) );
} );

test( 'a lone end, an unarmed end, a miss wide and a jump over are all inert', () => {
    const cross = () => rider( { z: 51 } );
    assert.ok( ! hopThroughPortal( cross(), 49, HULL, [ pair( 50, 300, { ends: 1 } ) ] ) );
    assert.ok( ! hopThroughPortal( cross(), 49, HULL, [ pair( 50, 300, { armA: false } ) ] ) );
    const wide = rider( { z: 51, x: CFG.portalR + HULL.halfW } );
    assert.ok( ! hopThroughPortal( wide, 49, HULL, [ pair( 50, 300 ) ] ) );
    const high = rider( { z: 51, y: CFG.portalH } );
    assert.ok( ! hopThroughPortal( high, 49, HULL, [ pair( 50, 300 ) ] ) );
} );

test( 'dead and finished ships never hop', () => {
    assert.ok( ! hopThroughPortal( rider( { z: 51, dead: true } ), 49, HULL, [ pair( 50, 300 ) ] ) );
    assert.ok( ! hopThroughPortal( rider( { z: 51, finished: true } ), 49, HULL, [ pair( 50, 300 ) ] ) );
} );

test( 'the exit clears the far ring, so the next tick does not hop again', () => {
    const s = rider( { z: 51 } );
    hopThroughPortal( s, 49, HULL, [ pair( 50, 300 ) ] );
    const prev = s.z;
    s.z += 1;
    assert.ok( ! hopThroughPortal( s, prev, HULL, [ pair( 50, 300 ) ] ) );
    assert.equal( s.portalHops, 1 );
} );

test( 'the hop counter wraps at 255', () => {
    const s = rider( { z: 51, portalHops: 255 } );
    hopThroughPortal( s, 49, HULL, [ pair( 50, 300 ) ] );
    assert.equal( s.portalHops, 0 );
} );
