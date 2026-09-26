import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    HeldPower,
    PORTAL_FIZZLE_MESSAGE,
    PORTAL_HOP_MESSAGE,
    type PortalHopMessage,
    SEEKER_MISS_MESSAGE,
} from '../combat/constants.js';
import { FIXED_DT } from '../constants.js';
import { PHASE } from '../race/director.js';
import { PlayerState, Portal, RunState, Seeker } from '../schema.js';
import { tuningForShip } from '../ship-classes.js';
import { HALF_WIDTH, SEG_LEN, type Segment, type Track } from '../sim/space.js';
import { procgenDescriptor } from '../sim/track-provider.js';
import { DEFAULT_SIM_CONFIG } from '../sim-config.js';
import type { FireContext } from './combat.js';
import { isDoubleTap, placePortal, portalHopped, stepPortals, throwPortalFar } from './portal-run.js';
import { RunSim } from './run-sim.js';

const CFG = DEFAULT_SIM_CONFIG;

function flat( deck = true ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: deck ? [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ] : [],
        blocks: [],
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function context( deck = true ) {
    const sent: { type: string; message: unknown }[] = [];
    const ctx: FireContext = {
        state: new RunState(),
        track: flat( deck ),
        broken: new Set(),
        config: CFG,
        broadcast: ( type, message ) => sent.push( { type, message } ),
    };
    return { ctx, sent };
}

function racer( ctx: FireContext, id: string, z: number ): PlayerState {
    const p = new PlayerState();
    p.x = 1.3;
    p.z = z;
    p.slots[ 0 ] = HeldPower.portal;
    ctx.state.players.set( id, p );
    return p;
}

test( 'the first tap places end A just ahead and leaves the second charge in the slot', () => {
    const { ctx } = context();
    const p = racer( ctx, 'a', 100 );
    assert.equal( placePortal( ctx, p, 'a', 0, 1 ), 'a' );
    const pair = ctx.state.portals.get( 'a' );
    assert.ok( pair );
    assert.equal( pair.ends, 1 );
    assert.equal( pair.armA, false );
    assert.equal( pair.az, Math.fround( 100 + tuningForShip( p.shipId ).halfL + CFG.portalR ) );
    assert.equal( pair.ax, Math.fround( 1.3 ) );
    assert.equal( p.slots[ 0 ], HeldPower.portalB );
} );

test( 'the second tap places end B behind, spends the slot and restarts the lifetime', () => {
    const { ctx } = context();
    const p = racer( ctx, 'a', 100 );
    placePortal( ctx, p, 'a', 0, 1 );
    stepPortals( ctx.state, 4 );
    assert.equal( placePortal( ctx, p, 'a', 0, -1 ), 'b' );
    const pair = ctx.state.portals.get( 'a' );
    assert.ok( pair );
    assert.equal( pair.ends, 2 );
    assert.ok( pair.bz < 100 );
    assert.equal( pair.ttl, CFG.portalTtl );
    assert.equal( p.slots[ 0 ], HeldPower.none );
} );

test( 'a portal with no clear spot fizzles and keeps its charge', () => {
    const { ctx, sent } = context( false );
    const p = racer( ctx, 'a', 100 );
    assert.equal( placePortal( ctx, p, 'a', 0, 1 ), null );
    assert.equal( ctx.state.portals.size, 0 );
    assert.equal( p.slots[ 0 ], HeldPower.portal );
    assert.deepEqual(
        sent.map( ( s ) => s.type ),
        [ PORTAL_FIZZLE_MESSAGE ],
    );
} );

test( 'a fresh pickup replaces the live pair and drops its unused second charge', () => {
    const { ctx } = context();
    const p = racer( ctx, 'a', 100 );
    p.slots[ 1 ] = HeldPower.portal;
    placePortal( ctx, p, 'a', 0, 1 );
    p.z = 300;
    assert.equal( placePortal( ctx, p, 'a', 1, 1 ), 'a' );
    assert.equal( ctx.state.portals.size, 1 );
    assert.ok( ( ctx.state.portals.get( 'a' )?.az ?? 0 ) > 300 );
    assert.deepEqual( [ p.slots[ 0 ], p.slots[ 1 ] ], [ HeldPower.none, HeldPower.portalB ] );
} );

test( 'ends arm after the arm delay, and a lone end expires with the second charge', () => {
    const { ctx } = context();
    const p = racer( ctx, 'a', 100 );
    placePortal( ctx, p, 'a', 0, 1 );
    const pair = ctx.state.portals.get( 'a' );
    assert.ok( pair );
    stepPortals( ctx.state, CFG.portalArmS / 2 );
    assert.equal( pair.armA, false );
    stepPortals( ctx.state, CFG.portalArmS );
    assert.equal( pair.armA, true );
    assert.equal( pair.armB, false );
    stepPortals( ctx.state, CFG.portalTtl );
    assert.equal( ctx.state.portals.size, 0 );
    assert.equal( p.slots[ 0 ], HeldPower.none );
} );

test( 'a double tap throws the tapped end to the far distance', () => {
    const { ctx } = context();
    const p = racer( ctx, 'a', 100 );
    placePortal( ctx, p, 'a', 0, 1 );
    const tap = { slot: 0, dir: 1 as const, seq: 10, end: 'a' as const };
    assert.equal( isDoubleTap( tap, { slot: 0, dir: 1, seq: 10 + CFG.portalDoubleTapTicks }, CFG ), true );
    assert.equal( isDoubleTap( tap, { slot: 0, dir: 1, seq: 11 + CFG.portalDoubleTapTicks }, CFG ), false );
    assert.equal( isDoubleTap( tap, { slot: 0, dir: -1, seq: 12 }, CFG ), false );
    assert.equal( throwPortalFar( ctx, p, 'a', tap ), true );
    const hull = tuningForShip( p.shipId );
    const far = 100 + hull.halfL + CFG.portalR + hull.maxCruise * CFG.portalFarS;
    assert.equal( ctx.state.portals.get( 'a' )?.az, Math.fround( far ) );
    assert.equal( p.slots[ 0 ], HeldPower.portalB );
} );

test( 'a hop broadcasts both points and makes every seeker on the victim miss', () => {
    const { ctx, sent } = context();
    const p = racer( ctx, 'v', 400 );
    const chasing = new Seeker();
    chasing.targetId = 'v';
    chasing.ownerId = 'o';
    const other = new Seeker();
    other.targetId = 'w';
    ctx.state.seekers.set( '1', chasing );
    ctx.state.seekers.set( '2', other );
    portalHopped( ctx.state, 'v', { x: 0, y: 0, z: 50 }, p, ctx.broadcast );
    const hop = sent.find( ( s ) => s.type === PORTAL_HOP_MESSAGE )?.message as PortalHopMessage;
    assert.deepEqual( [ hop.fromZ, hop.z, hop.victimId ], [ 50, 400, 'v' ] );
    assert.equal( sent.filter( ( s ) => s.type === SEEKER_MISS_MESSAGE ).length, 1 );
    assert.deepEqual( [ ...ctx.state.seekers.keys() ], [ '2' ] );
} );

function racing() {
    const sent: { type: string; message: unknown }[] = [];
    const sim = new RunSim(
        procgenDescriptor( 1 ),
        { broadcast: ( type, message ) => sent.push( { type, message } ), onMeta: () => {} },
        { countdownSeconds: 0 },
    );
    sim.join( 'a' );
    sim.start( 'a' );
    const p = sim.state.players.get( 'a' );
    assert.ok( p );
    assert.equal( sim.state.phase, PHASE.racing );
    return { sim, sent, p };
}

test( 'RunSim reads a second tap inside the window as a far throw, and a later tap as end B', () => {
    const { sim, p } = racing();
    p.slots[ 0 ] = HeldPower.portal;
    p.lastProcessedInput = 100;
    sim.usePower( 'a', { slot: 0, seq: 80 } );
    const nearZ = sim.state.portals.get( 'a' )?.az ?? 0;
    sim.usePower( 'a', { slot: 0, seq: 90 } );
    const pair = sim.state.portals.get( 'a' );
    assert.ok( pair );
    assert.ok( pair.az > nearZ + 40, `far ${ pair.az } vs near ${ nearZ }` );
    assert.equal( pair.ends, 1 );
    assert.equal( p.slots[ 0 ], HeldPower.portalB );
    sim.usePower( 'a', { slot: 0, seq: 95 } );
    assert.equal( pair.ends, 2 );
    assert.equal( p.slots[ 0 ], HeldPower.none );
} );

test( 'RunSim carries a racer through a live pair and broadcasts the hop', () => {
    const { sim, sent, p } = racing();
    const pair = new Portal();
    Object.assign( pair, { ax: p.x, az: p.z + 15, bx: p.x, bz: p.z + 300, ends: 2, armA: true, armB: true, ttl: 9 } );
    sim.state.portals.set( 'b', pair );
    const inputs = Array.from( { length: 180 }, ( _, i ) => ( {
        seq: i + 1,
        throttle: 1,
        brake: 0,
        strafe: 0,
        jump: false,
    } ) );
    sim.input( 'a', { inputs } );
    for ( let i = 0; i < 60; i++ ) sim.fixedStep( FIXED_DT );
    assert.equal( p.portalHops, 1 );
    assert.ok( p.z > pair.bz );
    assert.equal( sent.filter( ( s ) => s.type === PORTAL_HOP_MESSAGE ).length, 1 );
} );
