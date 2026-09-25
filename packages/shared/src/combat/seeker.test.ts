import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    aimSeeker,
    BLOCK_HEIGHT,
    BLOCK_ID_STRIDE,
    type Block,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    HALF_WIDTH,
    inTerminalWindow,
    lineOfSight,
    lockTarget,
    SEG_LEN,
    type SeekerEvent,
    type SeekerOutcome,
    type SeekerShip,
    type SeekerState,
    type Segment,
    SHIP_CLASSES,
    type SimConfig,
    seekerTopSpeed,
    stepSeeker,
    stepSeekers,
    type Track,
} from '../index.js';

function block( seg: number, x0: number, x1: number ): Block {
    return {
        x0,
        x1,
        y0: 0,
        y1: BLOCK_HEIGHT,
        z0: seg * SEG_LEN,
        z1: seg * SEG_LEN + 8,
        id: seg * BLOCK_ID_STRIDE,
        kind: 'sealed',
    };
}

function trackWith( blocks: Block[] ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'block',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: blocks.filter( ( b ) => Math.floor( b.z0 / SEG_LEN ) === i ),
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

const OPEN = trackWith( [] );

function ship( id: string, over: Partial< SeekerShip > = {} ): SeekerShip {
    return {
        id,
        x: 0,
        y: 0,
        z: 0,
        vz: 55,
        halfW: 1.3,
        halfL: 1.26,
        dead: false,
        spectating: false,
        finished: false,
        ...over,
    };
}

function launched( targetId: string, over: Partial< SeekerState > = {}, cfg = DEFAULT_SIM_CONFIG ): SeekerState {
    const s: SeekerState = { x: 0, y: 0, z: 0, vz: 0, ownerId: '', targetId: '', ttl: 0, committed: false, dir: 1 };
    aimSeeker( s, { x: 0, y: 0, z: 0, vz: 55 }, 'me', targetId, cfg );
    return Object.assign( s, over );
}

type Strafe = ( seeker: SeekerState, target: SeekerShip ) => number;

function fly( seeker: SeekerState, target: SeekerShip, strafe: Strafe, cfg = DEFAULT_SIM_CONFIG ): SeekerOutcome {
    for ( let i = 0; i < 60 * 10; i++ ) {
        target.z += target.vz * FIXED_DT;
        target.x += strafe( seeker, target ) * FIXED_DT;
        const out = stepSeeker( seeker, [ target ], OPEN, new Set(), FIXED_DT, cfg );
        if ( out !== 'flying' ) return out;
    }
    return 'flying';
}

const still: Strafe = () => 0;

test( 'lock picks the nearest living racer ahead within range', () => {
    const ships = [
        ship( 'me', { z: 0 } ),
        ship( 'behind', { z: -20 } ),
        ship( 'far', { z: 400 } ),
        ship( 'near', { z: 150 } ),
        ship( 'dead', { z: 10, dead: true } ),
        ship( 'done', { z: 12, finished: true } ),
        ship( 'watching', { z: 14, spectating: true } ),
        ship( 'beyond', { z: DEFAULT_SIM_CONFIG.seekerLockRange + 1 } ),
    ];
    assert.equal( lockTarget( { x: 0, z: 0 }, 'me', ships, OPEN, new Set() ), 'near' );
    assert.equal( lockTarget( { x: 0, z: 0 }, 'me', [ ships[ 0 ], ships[ 1 ] ], OPEN, new Set() ), '' );
} );

test( 'a back lock picks the nearest living racer behind and ignores the racers ahead', () => {
    const cfg = DEFAULT_SIM_CONFIG;
    const ships = [
        ship( 'me', { z: 500 } ),
        ship( 'ahead', { z: 510 } ),
        ship( 'far', { z: 100 } ),
        ship( 'near', { z: 350 } ),
        ship( 'dead', { z: 490, dead: true } ),
        ship( 'beyond', { z: 500 - cfg.seekerLockRange - 1 } ),
    ];
    assert.equal( lockTarget( { x: 0, z: 500 }, 'me', ships, OPEN, new Set(), cfg, -1 ), 'near' );
    assert.equal( lockTarget( { x: 0, z: 500 }, 'me', [ ships[ 0 ], ships[ 1 ] ], OPEN, new Set(), cfg, -1 ), '' );
} );

test( 'a seeker fired back launches behind the shooter from rest and ramps to top speed toward -z', () => {
    const s: SeekerState = { x: 0, y: 0, z: 0, vz: 0, ownerId: '', targetId: '', ttl: 0, committed: false, dir: 1 };
    aimSeeker( s, { x: 0, y: 0, z: 500, vz: 90 }, 'me', '', DEFAULT_SIM_CONFIG, -1 );
    assert.deepEqual( [ s.z, s.vz, s.dir ], [ 500 - 3, 0, -1 ] );
    let out: SeekerOutcome = 'flying';
    for ( let i = 0; i < 60 && out === 'flying'; i++ ) out = stepSeeker( s, [], OPEN, new Set(), FIXED_DT );
    assert.equal( out, 'flying' );
    assert.equal( s.vz, -seekerTopSpeed() );
    assert.ok( s.z < 500 - 100 );
} );

test( 'a seeker fired back homes on a strafing racer behind and hits it', () => {
    const t = ship( 't', { z: 200, vz: 90 } );
    const s: SeekerState = { x: 0, y: 0, z: 0, vz: 0, ownerId: '', targetId: '', ttl: 0, committed: false, dir: 1 };
    aimSeeker( s, { x: 0, y: 0, z: 500, vz: 90 }, 'me', 't', DEFAULT_SIM_CONFIG, -1 );
    assert.equal(
        fly( s, t, ( _s, ship ) => ( ship.x < 12 ? 20 : 0 ) ),
        'hit',
    );
} );

test( 'a seeker fired back misses when its target jumps over it', () => {
    const t = ship( 't', { z: 200, vz: 90, y: 3 } );
    const s: SeekerState = { x: 0, y: 0, z: 0, vz: 0, ownerId: '', targetId: '', ttl: 0, committed: false, dir: 1 };
    aimSeeker( s, { x: 0, y: 0, z: 500, vz: 90 }, 'me', 't', DEFAULT_SIM_CONFIG, -1 );
    assert.equal( fly( s, t, still ), 'miss' );
} );

test( 'a seeker fired back is destroyed by a block between it and its target', () => {
    const wall = block( 15, -4, 4 );
    const track = trackWith( [ wall ] );
    const t = ship( 't', { z: 200, vz: 0 } );
    const s: SeekerState = { x: 0, y: 0, z: 0, vz: 0, ownerId: '', targetId: '', ttl: 0, committed: false, dir: 1 };
    aimSeeker( s, { x: 0, y: 0, z: 500, vz: 90 }, 'me', 't', DEFAULT_SIM_CONFIG, -1 );
    let out: SeekerOutcome = 'flying';
    for ( let i = 0; i < 600 && out === 'flying'; i++ ) out = stepSeeker( s, [ t ], track, new Set(), FIXED_DT );
    assert.equal( out, 'blocked' );
    assert.ok( s.z < wall.z1 + 1 + seekerTopSpeed() * FIXED_DT );
} );

test( 'a standing block hides a racer; a broken one does not', () => {
    const wall = block( 5, -4, 4 );
    const track = trackWith( [ wall ] );
    const ships = [ ship( 'hidden', { z: 200 } ), ship( 'clear', { x: 20, z: 300 } ) ];
    assert.equal( lockTarget( { x: 0, z: 0 }, 'me', ships, track, new Set() ), 'clear' );
    assert.equal( lockTarget( { x: 0, z: 0 }, 'me', ships, track, new Set( [ wall.id ] ) ), 'hidden' );
} );

test( 'line of sight passes beside a block and fails through it', () => {
    const track = trackWith( [ block( 5, -4, 4 ) ] );
    assert.ok( lineOfSight( track, new Set(), 10, 0, 10, 300 ) );
    assert.ok( ! lineOfSight( track, new Set(), 0, 0, 0, 300 ) );
    assert.ok( ! lineOfSight( track, new Set(), -20, 0, 20, 220 ) );
} );

test( 'speed ramps from the shooter up to the top speed and no further', () => {
    const top = seekerTopSpeed();
    const s = launched( '' );
    assert.equal( s.vz, 55 );
    for ( let i = 0; i < 60; i++ ) stepSeeker( s, [], OPEN, new Set(), FIXED_DT );
    assert.equal( s.vz, top );
    const over = launched( '', { vz: top + 10 } );
    stepSeeker( over, [], OPEN, new Set(), FIXED_DT );
    assert.equal( over.vz, top );
} );

test( 'the top speed is the fastest cruise times the factor and outruns every class', () => {
    const fastest = Math.max( ...Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning.maxCruise ) );
    assert.equal( seekerTopSpeed(), fastest * DEFAULT_SIM_CONFIG.seekerSpeedFactor );
    assert.equal( seekerTopSpeed( { ...DEFAULT_SIM_CONFIG, seekerSpeedFactor: 2 } ), fastest * 2 );
    for ( const c of Object.values( SHIP_CLASSES ) ) assert.ok( seekerTopSpeed() > c.tuning.maxCruise, c.id );
} );

test( 'a seeker with no lock flies straight at fly height and expires', () => {
    const s = launched( '' );
    let out: SeekerOutcome = 'flying';
    let ticks = 0;
    while ( out === 'flying' ) {
        out = stepSeeker( s, [ ship( 'x', { z: 30 } ) ], OPEN, new Set(), FIXED_DT );
        ticks++;
    }
    assert.equal( out, 'expired' );
    assert.equal( s.x, 0 );
    assert.equal( s.y, DEFAULT_SIM_CONFIG.seekerFlyY );
    assert.ok( Math.abs( ticks * FIXED_DT - DEFAULT_SIM_CONFIG.seekerTtl ) < 2 * FIXED_DT );
} );

test( 'a target that holds its line is hit', () => {
    assert.equal( fly( launched( 't' ), ship( 't', { z: 200, x: 12 } ), still ), 'hit' );
} );

test( 'an early full-rate strafe does not shake it', () => {
    const clamp = 95;
    const early: Strafe = ( s ) =>
        s.ttl > DEFAULT_SIM_CONFIG.seekerTtl - 3 ? (s.ttl % 1 > 0.5 ? clamp : -clamp) : 0;
    assert.equal( fly( launched( 't' ), ship( 't', { z: 500 } ), early ), 'hit' );
} );

test( 'a strafe inside the terminal window beats it', () => {
    const late: Strafe = ( s ) => ( s.committed ? 80 : 0 );
    const seeker = launched( 't' );
    assert.equal( fly( seeker, ship( 't', { z: 200 } ), late ), 'miss' );
    assert.ok( seeker.committed );
} );

test( 'a strafe just before the window is still tracked', () => {
    const cfg = DEFAULT_SIM_CONFIG;
    const before: Strafe = ( s, t ) => {
        const closing = s.vz - t.vz;
        const eta = ( t.z - s.z ) / closing;
        return eta > cfg.seekerWindowS + 0.05 && eta < cfg.seekerWindowS + 0.6 ? 80 : 0;
    };
    assert.equal( fly( launched( 't' ), ship( 't', { z: 200 } ), before ), 'hit' );
} );

test( 'jumping over it makes it miss', () => {
    const t = ship( 't', { z: 200 } );
    const s = launched( 't' );
    let out: SeekerOutcome = 'flying';
    while ( out === 'flying' ) {
        t.z += t.vz * FIXED_DT;
        t.y = t.z - s.z < 10 ? 3 : 0;
        out = stepSeeker( s, [ t ], OPEN, new Set(), FIXED_DT );
    }
    assert.equal( out, 'miss' );
} );

test( 'a tap jump does not clear the band', () => {
    const t = ship( 't', { z: 200 } );
    const s = launched( 't' );
    let out: SeekerOutcome = 'flying';
    while ( out === 'flying' ) {
        t.z += t.vz * FIXED_DT;
        t.y = t.z - s.z < 10 ? 0.8 : 0;
        out = stepSeeker( s, [ t ], OPEN, new Set(), FIXED_DT );
    }
    assert.equal( out, 'hit' );
} );

test( 'it flies at fly height, even when fired mid-jump, and drops to strike height before impact', () => {
    const cfg = DEFAULT_SIM_CONFIG;
    const t = ship( 't', { z: 300 } );
    const s: SeekerState = { x: 0, y: 0, z: 0, vz: 0, ownerId: '', targetId: '', ttl: 0, committed: false, dir: 1 };
    aimSeeker( s, { x: 0, y: 3, z: 0, vz: 55 }, 'me', 't' );
    let out: SeekerOutcome = 'flying';
    while ( out === 'flying' ) {
        if ( ! s.committed ) assert.equal( s.y, cfg.seekerFlyY );
        t.z += t.vz * FIXED_DT;
        out = stepSeeker( s, [ t ], OPEN, new Set(), FIXED_DT );
    }
    assert.equal( out, 'hit' );
    assert.equal( s.y, cfg.seekerStrikeY );
    assert.ok( cfg.seekerFlyY >= 2 && cfg.seekerFlyY <= 3 );
    assert.ok( cfg.seekerFlyY > cfg.seekerHitBand && cfg.seekerFlyY < BLOCK_HEIGHT );
} );

function flyInto( kind: Block[ 'kind' ] ): { out: SeekerOutcome; broken: Set< number >; id: number } {
    const wall = { ...block( 10, -4, 4 ), kind };
    const track = trackWith( [ wall ] );
    const broken = new Set< number >();
    const t = ship( 't', { z: 10 * SEG_LEN + 30, vz: 0 } );
    const s = launched( 't', { z: 10 * SEG_LEN - 20, vz: 120 } );
    let out: SeekerOutcome = 'flying';
    while ( out === 'flying' ) out = stepSeeker( s, [ t ], track, broken, FIXED_DT );
    return { out, broken, id: wall.id };
}

test( 'a sealed block in its path destroys the seeker', () => {
    const { out, broken } = flyInto( 'sealed' );
    assert.equal( out, 'blocked' );
    assert.equal( broken.size, 0 );
} );

test( 'a fractured block in its path is destroyed with the seeker', () => {
    const { out, broken, id } = flyInto( 'fractured' );
    assert.equal( out, 'blocked' );
    assert.ok( broken.has( id ) );
} );

function detour( z: number ): number {
    const into = Math.min( 1, Math.max( 0, ( z - 370 ) / 15 ) );
    const out = Math.min( 1, Math.max( 0, ( 445 - z ) / 15 ) );
    return 10 * into * out;
}

test( 'it follows the path the target flew around a block', () => {
    const track = trackWith( [ block( 20, -4, 4 ) ] );
    const s = launched( 't' );
    const t = ship( 't', { z: 350 } );
    let out: SeekerOutcome = 'flying';
    while ( out === 'flying' ) {
        t.z += t.vz * FIXED_DT;
        t.x = detour( t.z );
        out = stepSeeker( s, [ t ], track, new Set(), FIXED_DT );
    }
    assert.equal( out, 'hit' );
    assert.ok( s.z > 20 * SEG_LEN + 8 );
} );

test( 'a wasted seeker stops at the first block in its line', () => {
    const track = trackWith( [ block( 10, -4, 4 ) ] );
    const s = launched( '' );
    let out: SeekerOutcome = 'flying';
    while ( out === 'flying' ) out = stepSeeker( s, [], track, new Set(), FIXED_DT );
    assert.equal( out, 'blocked' );
    assert.ok( s.z < 10 * SEG_LEN + 8 );
} );

test( 'the seeker is lost when its target dies or finishes', () => {
    assert.equal(
        stepSeeker( launched( 't' ), [ ship( 't', { z: 100, dead: true } ) ], OPEN, new Set(), FIXED_DT ),
        'lost',
    );
    assert.equal(
        stepSeeker( launched( 't' ), [ ship( 't', { z: 100, finished: true } ) ], OPEN, new Set(), FIXED_DT ),
        'lost',
    );
    assert.equal( stepSeeker( launched( 't' ), [], OPEN, new Set(), FIXED_DT ), 'lost' );
} );

test( 'the window commits by time or by distance', () => {
    const t = ship( 't', { z: 50, vz: 55 } );
    const byTime = launched( 't', { z: 50 - 65 * 0.3, vz: 120 } );
    assert.ok( inTerminalWindow( byTime, t ) );
    assert.ok( ! inTerminalWindow( launched( 't', { z: 50 - 65 * 0.5, vz: 120 } ), t ) );
    const distance: SimConfig = { ...DEFAULT_SIM_CONFIG, seekerWindowMode: 'distance' };
    assert.ok( inTerminalWindow( launched( 't', { z: 50 - distance.seekerWindowU } ), t, distance ) );
    assert.ok( ! inTerminalWindow( launched( 't', { z: 50 - distance.seekerWindowU - 1 } ), t, distance ) );
    assert.ok(
        ! inTerminalWindow( launched( 't', { z: 0, vz: 50 } ), t ),
        'an unclosing seeker never commits by time',
    );
} );

test( 'stepSeekers reports a hit and a miss and removes spent seekers', () => {
    const seekers = new Map< string, SeekerState >( [
        [ 'a', launched( 'hit', { z: 49 } ) ],
        [ 'b', launched( 'jump', { z: 60, x: 0 } ) ],
        [ 'c', launched( '', {} ) ],
    ] );
    const events: SeekerEvent[] = [];
    const ships = [ ship( 'hit', { z: 50 } ), ship( 'jump', { z: 57, y: 3 } ) ];
    stepSeekers( seekers, ships, OPEN, new Set(), FIXED_DT, ( e ) => events.push( e ) );
    assert.deepEqual(
        events.map( ( e ) => [ e.outcome, e.targetId ] ),
        [
            [ 'hit', 'hit' ],
            [ 'miss', 'jump' ],
        ],
    );
    assert.deepEqual( [ ...seekers.keys() ], [ 'c' ] );
} );

test( 'two identical runs give bit-identical seekers', () => {
    const run = () => {
        const t = ship( 't', { z: 250 } );
        const s = launched( 't' );
        const trace: number[] = [];
        fly( s, t, ( k ) => Math.sin( k.ttl * 3 ) * 90 );
        trace.push( s.x, s.y, s.z, s.vz, s.ttl, s.committed ? 1 : 0 );
        return trace;
    };
    assert.deepEqual( run(), run() );
} );
