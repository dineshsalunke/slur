import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    aimMine,
    BLOCK_HEIGHT,
    BLOCK_ID_STRIDE,
    type Block,
    DEFAULT_SIM_CONFIG,
    evictOldest,
    FIXED_DT,
    HALF_WIDTH,
    HeldPower,
    type MineEvent,
    type MineState,
    type ProjectileState,
    pickupPower,
    SEG_LEN,
    type SeekerShip,
    type Segment,
    type SimConfig,
    stepBolts,
    stepMines,
    type Track,
    tuningForShip,
} from '../index.js';

const HULL = tuningForShip( 'fighter' );

function track( gapAt = -1, wallAt = -1, deckY = 0 ): Track {
    const seg = ( i: number ): Segment => {
        const wall: Block = {
            x0: -HALF_WIDTH,
            x1: HALF_WIDTH,
            y0: deckY,
            y1: deckY + BLOCK_HEIGHT,
            z0: i * SEG_LEN,
            z1: i * SEG_LEN + 6,
            id: i * BLOCK_ID_STRIDE,
            kind: 'sealed',
        };
        return {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: i === gapAt ? 'gap' : 'plain',
            floors: i === gapAt ? [] : [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: deckY } ],
            blocks: i === wallAt ? [ wall ] : [],
            isFinish: false,
        };
    };
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function blank(): MineState {
    return { x: 0, y: 0, z: 0, ownerId: '', armed: false, ttl: 0 };
}

function laid( x: number, z: number, ownerId = 'owner', t = track() ): MineState {
    const m = blank();
    assert.ok( aimMine( m, { x, y: 0, z }, HULL, ownerId, t, DEFAULT_SIM_CONFIG, -1 ) );
    return m;
}

function ship( id: string, over: Partial< SeekerShip > = {} ): SeekerShip {
    return {
        id,
        x: 0,
        y: 0,
        z: 0,
        vz: 90,
        halfW: HULL.halfW,
        halfL: HULL.halfL,
        dead: false,
        spectating: false,
        finished: false,
        ...over,
    };
}

function run( mines: Map< string, MineState >, ships: SeekerShip[], seconds: number ): MineEvent[] {
    const events: MineEvent[] = [];
    for ( let t = 0; t < seconds - 1e-9; t += FIXED_DT ) stepMines( mines, ships, FIXED_DT, ( e ) => events.push( e ) );
    return events;
}

test( 'the pickup split keeps every seeker and turns about mineRatio of the rest into mines', () => {
    const ids = Array.from( { length: 2000 }, ( _, i ) => String( i ) );
    const noMines: SimConfig = { ...DEFAULT_SIM_CONFIG, mineRatio: 0 };
    let mines = 0;
    for ( const id of ids ) {
        const before = pickupPower( id, noMines );
        const after = pickupPower( id );
        if ( before === HeldPower.seeker ) assert.equal( after, HeldPower.seeker, id );
        if ( after === HeldPower.mine ) {
            assert.equal( before, HeldPower.bolt, id );
            mines++;
        }
    }
    assert.ok( Math.abs( mines / ids.length - DEFAULT_SIM_CONFIG.mineRatio ) < 0.04, `ratio ${ mines / ids.length }` );
} );

test( 'a mine fired forward lands on the deck mineDropAhead past the nose, unarmed, with the full ttl', () => {
    const m = blank();
    const shipAt = { x: 5, y: 3.2, z: 100 };
    assert.ok( aimMine( m, shipAt, HULL, 'owner', track( -1, -1, 1.5 ) ) );
    assert.deepEqual( m, {
        x: 5,
        y: 1.5,
        z: 100 + HULL.halfL + DEFAULT_SIM_CONFIG.mineDropAhead,
        ownerId: 'owner',
        armed: false,
        ttl: DEFAULT_SIM_CONFIG.mineTtl,
    } );
} );

test( 'a mine fired back lands on the deck under the ship', () => {
    const m = blank();
    assert.ok( aimMine( m, { x: -4, y: 3.2, z: 100 }, HULL, 'owner', track( -1, -1, 1.5 ), DEFAULT_SIM_CONFIG, -1 ) );
    assert.deepEqual( [ m.x, m.y, m.z ], [ -4, 1.5, 100 ] );
} );

test( 'a mine dropped over a gap fizzles, forward or back', () => {
    const m = blank();
    const over = { x: 0, y: 2, z: 5 * SEG_LEN + 5 };
    assert.equal( aimMine( m, over, HULL, 'owner', track( 5 ) ), false );
    assert.equal( aimMine( m, over, HULL, 'owner', track( 5 ), DEFAULT_SIM_CONFIG, -1 ), false );
} );

test( 'a mine arms after mineArmS and not before', () => {
    const mines = new Map( [ [ 'm', laid( 0, 50 ) ] ] );
    const victim = ship( 'v', { z: 50 } );
    const arm = DEFAULT_SIM_CONFIG.mineArmS;
    assert.deepEqual( run( mines, [ victim ], arm - 0.02 ), [] );
    assert.equal( mines.get( 'm' )?.armed, false );
    const events = run( mines, [ victim ], 0.04 );
    assert.deepEqual(
        events.map( ( e ) => [ e.outcome, e.victimId ] ),
        [ [ 'trigger', 'v' ] ],
    );
    assert.equal( mines.size, 0 );
} );

test( 'the owner never triggers its own mine', () => {
    const mines = new Map( [ [ 'm', laid( 0, 50 ) ] ] );
    assert.deepEqual( run( mines, [ ship( 'owner', { z: 50 } ) ], 2 ), [] );
    assert.equal( mines.size, 1 );
} );

test( 'dead, spectating and finished ships do not trigger it', () => {
    const mines = new Map( [ [ 'm', laid( 0, 50 ) ] ] );
    const ships = [
        ship( 'a', { z: 50, dead: true } ),
        ship( 'b', { z: 50, spectating: true } ),
        ship( 'c', { z: 50, finished: true } ),
    ];
    assert.deepEqual( run( mines, ships, 2 ), [] );
} );

test( 'a jump at mineTriggerH clears it and a ship just under it does not', () => {
    const h = DEFAULT_SIM_CONFIG.mineTriggerH;
    const high = new Map( [ [ 'm', laid( 0, 50 ) ] ] );
    assert.deepEqual( run( high, [ ship( 'v', { z: 50, y: h } ) ], 1 ), [] );
    const low = new Map( [ [ 'm', laid( 0, 50 ) ] ] );
    assert.equal( run( low, [ ship( 'v', { z: 50, y: h - 0.01 } ) ], 1 ).length, 1 );
} );

test( 'the trigger box is mineTriggerR past the hull, on x and on z', () => {
    const r = DEFAULT_SIM_CONFIG.mineTriggerR;
    const edgeX = r + HULL.halfW;
    const edgeZ = r + HULL.halfL;
    const cases: [ number, number, number ][] = [
        [ edgeX - 0.01, 0, 1 ],
        [ edgeX + 0.01, 0, 0 ],
        [ 0, edgeZ - 0.01, 1 ],
        [ 0, edgeZ + 0.01, 0 ],
    ];
    for ( const [ dx, dz, want ] of cases ) {
        const mines = new Map( [ [ 'm', laid( 0, 50 ) ] ] );
        assert.equal( run( mines, [ ship( 'v', { x: dx, z: 50 + dz } ) ], 1 ).length, want, `${ dx },${ dz }` );
    }
} );

test( 'a mine expires at mineTtl', () => {
    const mines = new Map( [ [ 'm', laid( 0, 50 ) ] ] );
    assert.deepEqual( run( mines, [], DEFAULT_SIM_CONFIG.mineTtl - 0.05 ), [] );
    const events = run( mines, [], 0.1 );
    assert.deepEqual(
        events.map( ( e ) => e.outcome ),
        [ 'expired' ],
    );
    assert.equal( mines.size, 0 );
} );

test( 'a fourth mine evicts the owner oldest and leaves other owners alone', () => {
    const mines = new Map< string, MineState >();
    const events: MineEvent[] = [];
    const lay = ( id: string, owner: string ) => {
        evictOldest( mines, owner, ( e ) => events.push( e ) );
        mines.set( id, laid( 0, 50, owner ) );
        run( mines, [], 0.1 );
    };
    lay( 'other', 'rival' );
    for ( const id of [ '1', '2', '3', '4' ] ) lay( id, 'owner' );
    assert.deepEqual( [ ...mines.keys() ], [ 'other', '2', '3', '4' ] );
    assert.deepEqual(
        events.map( ( e ) => [ e.outcome, e.ownerId ] ),
        [ [ 'evicted', 'owner' ] ],
    );
} );

function bolt( z: number, ownerId = 'shooter', dir = 1 ): ProjectileState {
    return { x: 0, y: 0, z, ownerId, ttl: DEFAULT_SIM_CONFIG.boltTtl, dir };
}

function fire(
    b: ProjectileState,
    mines: Map< string, MineState >,
    ships: SeekerShip[] = [],
    t = track(),
): { strikes: string[]; mines: MineEvent[]; bolts: number } {
    const bolts = new Map( [ [ 'b', b ] ] );
    const strikes: string[] = [];
    const cleared: MineEvent[] = [];
    for ( let i = 0; i < 10 && bolts.size > 0; i++ ) {
        stepBolts(
            bolts,
            ships,
            t,
            new Set(),
            FIXED_DT,
            ( s ) => strikes.push( s.victimId ),
            DEFAULT_SIM_CONFIG,
            mines,
            ( e ) => cleared.push( e ),
        );
    }
    return { strikes, mines: cleared, bolts: bolts.size };
}

test( 'a bolt clears an armed mine and is spent', () => {
    const mines = new Map( [ [ 'm', laid( 0, 40, 'rival' ) ] ] );
    run( mines, [], 1 );
    assert.equal( mines.get( 'm' )?.armed, true );
    const out = fire( bolt( 0 ), mines );
    assert.deepEqual(
        out.mines.map( ( e ) => [ e.outcome, e.ownerId ] ),
        [ [ 'cleared', 'rival' ] ],
    );
    assert.equal( mines.size, 0 );
    assert.equal( out.bolts, 0 );
    assert.deepEqual( out.strikes, [] );
} );

test( 'a bolt also clears a mine that is still arming', () => {
    const mines = new Map( [ [ 'm', laid( 0, 40, 'rival' ) ] ] );
    assert.equal( mines.get( 'm' )?.armed, false );
    assert.equal( fire( bolt( 0 ), mines ).mines.length, 1 );
    assert.equal( mines.size, 0 );
} );

test( 'the owner bolt clears its own mine', () => {
    const mines = new Map( [ [ 'm', laid( 0, 40, 'owner' ) ] ] );
    assert.equal( fire( bolt( 0, 'owner' ), mines ).mines.length, 1 );
} );

test( 'a mine in front of a ship shields it and a ship in front of a mine takes the bolt', () => {
    const shielded = new Map( [ [ 'm', laid( 0, 40 ) ] ] );
    const behind = fire( bolt( 0 ), shielded, [ ship( 'v', { z: 60 } ) ] );
    assert.deepEqual( [ behind.strikes, behind.mines.length ], [ [], 1 ] );
    const exposed = new Map( [ [ 'm', laid( 0, 80 ) ] ] );
    const ahead = fire( bolt( 0 ), exposed, [ ship( 'v', { z: 40 } ) ] );
    assert.deepEqual( [ ahead.strikes, ahead.mines.length, exposed.size ], [ [ 'v' ], 0, 1 ] );
} );

test( 'a block in front of a mine stops the bolt first', () => {
    const mines = new Map( [ [ 'm', laid( 0, 3 * SEG_LEN + 12 ) ] ] );
    const out = fire( bolt( 0 ), mines, [], track( -1, 3 ) );
    assert.deepEqual( [ out.mines.length, mines.size, out.bolts ], [ 0, 1, 0 ] );
} );

test( 'a bolt passes over a mine when the shooter is high in a jump', () => {
    const mines = new Map( [ [ 'm', laid( 0, 40 ) ] ] );
    const high = { ...bolt( 0 ), y: DEFAULT_SIM_CONFIG.mineHeight + DEFAULT_SIM_CONFIG.boltHalf + 0.1 };
    assert.equal( fire( high, mines ).mines.length, 0 );
    assert.equal( mines.size, 1 );
} );

test( 'a bolt fired back clears the nearest mine behind and leaves the one ahead', () => {
    const mines = new Map( [
        [ 'far', laid( 0, 20 ) ],
        [ 'near', laid( 0, 60 ) ],
        [ 'ahead', laid( 0, 140 ) ],
    ] );
    const out = fire( bolt( 100, 'shooter', -1 ), mines );
    assert.deepEqual( [ ...mines.keys() ], [ 'far', 'ahead' ] );
    assert.equal( out.mines.length, 1 );
    assert.equal( out.bolts, 0 );
} );

test( 'a bolt fired back hits a ship behind before a mine further back', () => {
    const mines = new Map( [ [ 'm', laid( 0, 20 ) ] ] );
    const out = fire( bolt( 100, 'shooter', -1 ), mines, [ ship( 'v', { z: 60 } ), ship( 'ahead', { z: 130 } ) ] );
    assert.deepEqual( [ out.strikes, out.mines.length, mines.size ], [ [ 'v' ], 0, 1 ] );
} );

test( 'a bolt fired back strikes a block at its far face and spares the mine behind it', () => {
    const t = track( -1, 3 );
    const mines = new Map( [ [ 'm', laid( 0, 40, 'owner', t ) ] ] );
    const bolts = new Map( [ [ 'b', bolt( 100, 'shooter', -1 ) ] ] );
    const zs: number[] = [];
    for ( let i = 0; i < 10 && bolts.size > 0; i++ ) {
        stepBolts( bolts, [], t, new Set(), FIXED_DT, ( s ) => zs.push( s.z ), DEFAULT_SIM_CONFIG, mines );
    }
    assert.deepEqual( [ zs, mines.size, bolts.size ], [ [ 3 * SEG_LEN + 6 ], 1, 0 ] );
} );
