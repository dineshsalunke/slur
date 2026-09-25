import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    BLOCK_HEIGHT,
    BLOCK_ID_STRIDE,
    type Block,
    boltBlockHit,
    createSimWorld,
    DEFAULT_TUNING,
    emptyInput,
    FIXED_DT,
    FRACTURE_MAX_DEPTH,
    FRACTURE_MAX_WIDTH,
    HALF_WIDTH,
    type ProjectileState,
    procgenDescriptor,
    resolveTrack,
    SEG_LEN,
    type Segment,
    type SimWorld,
    simulate,
    spawnShip,
    TRACK_SEGMENTS,
    type Track,
} from '../index.js';

const t = DEFAULT_TUNING;
const SEEDS = [ 1, 2, 1234, 0xdeadbeef, 42, 99991 ];

function wall( i: number, kind: Block[ 'kind' ], x0 = -HALF_WIDTH, x1 = HALF_WIDTH ): Block {
    return { x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0: i * SEG_LEN, z1: i * SEG_LEN + 6, id: i * BLOCK_ID_STRIDE, kind };
}

function trackWith( blocksAt: ( i: number ) => Block[] ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'block',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: blocksAt( i ),
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function cruise( s: ReturnType< typeof spawnShip >, track: Track, world: SimWorld | undefined, ticks: number ): void {
    const inp = emptyInput();
    inp.throttle = 1;
    for ( let k = 0; k < ticks; k++ ) simulate( s, inp, FIXED_DT, t, track, undefined, world );
}

function allBlocks( track: Track ): Block[] {
    const out: Block[] = [];
    for ( let i = 0; i < TRACK_SEGMENTS; i++ ) out.push( ...track.segmentAt( i ).blocks );
    return out;
}

test( 'the generator marks some blocks fractured, the same ones every time, with unique ids', () => {
    for ( const seed of SEEDS ) {
        const a = allBlocks( resolveTrack( procgenDescriptor( seed ) ) );
        const b = allBlocks( resolveTrack( procgenDescriptor( seed ) ) );
        assert.deepEqual(
            a.map( ( x ) => [ x.id, x.kind ] ),
            b.map( ( x ) => [ x.id, x.kind ] ),
            `seed ${ seed }: kinds or ids differ between two materializations`,
        );
        assert.equal( new Set( a.map( ( x ) => x.id ) ).size, a.length, `seed ${ seed }: two blocks share an id` );
        const fractured = a.filter( ( x ) => x.kind === 'fractured' );
        assert.ok( fractured.length > 0, `seed ${ seed }: no fractured blocks at all` );
        assert.ok( fractured.length < a.length, `seed ${ seed }: every block is fractured` );
    }
} );

test( 'block ids decode back to their segment', () => {
    const track = resolveTrack( procgenDescriptor( 1234 ) );
    for ( let i = 0; i < TRACK_SEGMENTS; i++ ) {
        for ( const b of track.segmentAt( i ).blocks ) {
            assert.equal( Math.floor( b.id / BLOCK_ID_STRIDE ), i, `block ${ b.id } is not in segment ${ i }` );
        }
    }
} );

test( 'a fractured block stays within the size caps', () => {
    for ( const seed of SEEDS ) {
        for ( const b of allBlocks( resolveTrack( procgenDescriptor( seed ) ) ) ) {
            if ( b.kind !== 'fractured' ) continue;
            assert.ok( b.x1 - b.x0 <= FRACTURE_MAX_WIDTH + 1e-9, `seed ${ seed }: fractured block ${ b.id } too wide` );
            assert.ok( b.z1 - b.z0 <= FRACTURE_MAX_DEPTH + 1e-9, `seed ${ seed }: fractured block ${ b.id } too deep` );
        }
    }
} );

test( 'smashing a fractured block breaks it, keeps the ship moving and costs speed', () => {
    const track = trackWith( ( i ) => ( i === 3 ? [ wall( 3, 'fractured' ) ] : [] ) );
    const world = createSimWorld();
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    s.vz = t.maxCruise;
    let vzBefore = s.vz;
    const inp = emptyInput();
    inp.throttle = 1;
    for ( let k = 0; k < 120 && world.broken.size === 0; k++ ) {
        vzBefore = s.vz;
        simulate( s, inp, FIXED_DT, t, track, undefined, world );
    }
    assert.ok( world.broken.has( 3 * BLOCK_ID_STRIDE ), 'the ship never broke the block' );
    assert.equal( s.stunTimer, 0, 'the smash stunned the ship like a bounce' );
    assert.ok( s.vz > 0, 'the smash stopped or reversed the ship' );
    assert.ok( s.vz < vzBefore * t.smashKeep + t.accel * FIXED_DT + 1e-9, `no speed tax (vz ${ s.vz })` );
    cruise( s, track, world, 60 );
    assert.ok( s.z > SEG_LEN * 3 + 6, 'the ship did not pass through the broken block' );
} );

test( 'a broken block is passed through with no further tax', () => {
    const track = trackWith( ( i ) => ( i === 3 ? [ wall( 3, 'fractured' ) ] : [] ) );
    const world = createSimWorld();
    world.broken.add( 3 * BLOCK_ID_STRIDE );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    s.vz = t.maxCruise;
    cruise( s, track, world, 60 );
    assert.equal( s.vz, t.maxCruise, 'a broken block still slowed the ship' );
    assert.ok( s.z > SEG_LEN * 3 + 6, 'a broken block still stopped the ship' );
} );

test( 'a sealed block still bounces when a world is supplied', () => {
    const track = trackWith( ( i ) => ( i === 3 ? [ wall( 3, 'sealed' ) ] : [] ) );
    const world = createSimWorld();
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    s.vz = t.maxCruise;
    let bounced = false;
    for ( let k = 0; k < 30; k++ ) {
        cruise( s, track, world, 1 );
        bounced ||= s.stunTimer > 0;
    }
    assert.ok( bounced, 'a sealed block did not bounce the ship' );
    assert.equal( world.broken.size, 0, 'a sealed block was broken' );
    assert.ok( s.z < SEG_LEN * 3, 'the ship went through a sealed block' );
} );

test( 'without a world a fractured block behaves as sealed', () => {
    const track = trackWith( ( i ) => ( i === 3 ? [ wall( 3, 'fractured' ) ] : [] ) );
    const s = spawnShip( 0, SEG_LEN * 2.5 );
    s.vz = t.maxCruise;
    cruise( s, track, undefined, 30 );
    assert.ok( s.z < SEG_LEN * 3, 'the ship went through a fractured block with nowhere to record the break' );
} );

test( 'an invulnerable ship phases through a fractured block without breaking it', () => {
    const track = trackWith( ( i ) => ( i === 3 ? [ wall( 3, 'fractured' ) ] : [] ) );
    const world = createSimWorld();
    const s = spawnShip( 0, SEG_LEN * 3 + 3 );
    s.vz = t.maxCruise;
    s.invulnTimer = t.invulnTime;
    const inp = emptyInput();
    inp.throttle = 1;
    simulate( s, inp, FIXED_DT, t, track, undefined, world );
    assert.equal( world.broken.size, 0, 'an invulnerable ship broke the block' );
    assert.ok( s.invulnTimer > 0, 'invulnerability was spent while still inside the block' );
} );

test( 'replaying the same inputs over a fresh world reproduces the smash exactly', () => {
    const track = trackWith( ( i ) => ( i === 3 ? [ wall( 3, 'fractured' ) ] : [] ) );
    const run = () => {
        const world = createSimWorld();
        const s = spawnShip( 0, SEG_LEN * 2.5 );
        cruise( s, track, world, 90 );
        return { s, broken: [ ...world.broken ] };
    };
    assert.deepEqual( run(), run() );
} );

function bolt( x: number, z: number ): ProjectileState {
    return { x, y: 0, z, ownerId: 'a', ttl: 1, dir: 1 };
}

test( 'a swept bolt finds the nearest standing block it crossed', () => {
    const near = wall( 3, 'fractured', -4, 4 );
    const far = { ...wall( 4, 'sealed', -4, 4 ) };
    const track = trackWith( ( i ) => ( i === 3 ? [ near ] : i === 4 ? [ far ] : [] ) );
    const b = bolt( 0, SEG_LEN * 4 + 3 );
    assert.equal( boltBlockHit( b, track, new Set(), SEG_LEN * 2 )?.id, near.id );
    assert.equal( boltBlockHit( b, track, new Set( [ near.id ] ), SEG_LEN * 2 )?.id, far.id );
    assert.equal( boltBlockHit( bolt( 10, SEG_LEN * 4 + 3 ), track, new Set(), SEG_LEN * 2 ), null );
} );

test( 'a bolt that has not reached a block does not hit it', () => {
    const track = trackWith( ( i ) => ( i === 3 ? [ wall( 3, 'fractured', -4, 4 ) ] : [] ) );
    assert.equal( boltBlockHit( bolt( 0, SEG_LEN * 3 - 5 ), track, new Set(), 4 ), null );
} );
