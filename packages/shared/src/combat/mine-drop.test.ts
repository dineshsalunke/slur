import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
    aimMine,
    DEFAULT_SIM_CONFIG,
    FIXED_DT,
    type FlightTuning,
    HALF_WIDTH,
    type MineEvent,
    type MineState,
    type PlayerInput,
    SEG_LEN,
    type SeekerShip,
    type Segment,
    SHIP_CLASSES,
    type SimShip,
    simulate,
    spawnShip,
    stepMines,
    strafeToward,
    type Track,
} from '../index.js';

const HULL = SHIP_CLASSES.fighter.tuning;
const R = DEFAULT_SIM_CONFIG.mineTriggerR;
const REACT_S = 0.5;

function flat( deckY = 0 ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: deckY } ],
        blocks: [],
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function blank(): MineState {
    return { x: 0, y: 0, z: 0, ownerId: '', armed: false, ttl: 0 };
}

function hullOf( id: string, s: SimShip, t: FlightTuning ): SeekerShip {
    return {
        id,
        x: s.x,
        y: s.y,
        z: s.z,
        vz: s.vz,
        halfW: t.halfW,
        halfL: t.halfL,
        dead: false,
        spectating: false,
        finished: false,
    };
}

type Pilot = ( s: SimShip, t: FlightTuning, age: number ) => PlayerInput;

const idle: Pilot = () => ( { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: false } );

const strafer: Pilot = ( s, t, age ) => {
    const goal = R + t.halfW + 0.5;
    const strafe = age < REACT_S ? 0 : strafeToward( t, goal - s.x, s.vx );
    return { seq: 0, throttle: 1, brake: 0, strafe, jump: false };
};

const jumper: Pilot = ( _s, _t, age ) => ( { seq: 0, throttle: 1, brake: 0, strafe: 0, jump: age >= REACT_S } );

function flyOverOwnMine( t: FlightTuning, pilot: Pilot ): MineEvent[] {
    const track = flat();
    const s = spawnShip( 0, 100 );
    s.vz = t.maxCruise;
    const mine = blank();
    assert.ok( aimMine( mine, s, t, 'owner', track ) );
    const mines = new Map( [ [ 'm', mine ] ] );
    const events: MineEvent[] = [];
    for ( let n = 0; n * FIXED_DT < 3 && mines.size > 0; n++ ) {
        simulate( s, pilot( s, t, n * FIXED_DT ), FIXED_DT, t );
        stepMines( mines, [ hullOf( 'owner', s, t ) ], FIXED_DT, ( e ) => events.push( e ) );
    }
    return events.filter( ( e ) => e.outcome === 'trigger' );
}

test( 'a forward mine lands mineLeadS of the layer speed past the trigger reach of the nose', () => {
    const m = blank();
    assert.ok( aimMine( m, { x: 5, y: 3.2, z: 100, vz: 90 }, HULL, 'owner', flat( 1.5 ) ) );
    assert.deepEqual( m, {
        x: 5,
        y: 1.5,
        z: 100 + HULL.halfL + R + 90 * DEFAULT_SIM_CONFIG.mineLeadS,
        ownerId: 'owner',
        armed: false,
        ttl: DEFAULT_SIM_CONFIG.mineTtl,
    } );
} );

test( 'a back mine lands behind the tail, clear of the trigger reach', () => {
    const m = blank();
    assert.ok( aimMine( m, { x: -4, y: 3.2, z: 100, vz: 90 }, HULL, 'owner', flat( 1.5 ), DEFAULT_SIM_CONFIG, -1 ) );
    assert.deepEqual( [ m.x, m.y, m.z ], [ -4, 1.5, 100 - HULL.halfL - R - DEFAULT_SIM_CONFIG.mineBackGap ] );
} );

test( 'a stopped layer survives its own mine arming, forward or back', () => {
    for ( const dir of [ 1, -1 ] ) {
        const m = blank();
        assert.ok( aimMine( m, { x: 0, y: 0, z: 100, vz: 0 }, HULL, 'owner', flat(), DEFAULT_SIM_CONFIG, dir ) );
        const mines = new Map( [ [ 'm', m ] ] );
        const s = spawnShip( 0, 100 );
        const events: MineEvent[] = [];
        for ( let n = 0; n * FIXED_DT < 2; n++ )
            stepMines( mines, [ hullOf( 'owner', s, HULL ) ], FIXED_DT, ( e ) => events.push( e ) );
        assert.equal( m.armed, true, `dir ${ dir }` );
        assert.deepEqual( events, [], `dir ${ dir }` );
    }
} );

test( 'a rival just ahead of the layer reaches the forward mine first', () => {
    const t = SHIP_CLASSES.fighter.tuning;
    const layer = spawnShip( 0, 100 );
    layer.vz = t.maxCruise;
    const rival = spawnShip( 0, 150 );
    rival.vz = 40;
    const m = blank();
    assert.ok( aimMine( m, layer, t, 'owner', flat() ) );
    const mines = new Map( [ [ 'm', m ] ] );
    const events: MineEvent[] = [];
    for ( let n = 0; n * FIXED_DT < 3 && mines.size > 0; n++ ) {
        simulate( layer, idle( layer, t, 0 ), FIXED_DT, t );
        rival.z += rival.vz * FIXED_DT;
        stepMines( mines, [ hullOf( 'owner', layer, t ), hullOf( 'rival', rival, t ) ], FIXED_DT, ( e ) =>
            events.push( e ),
        );
    }
    assert.deepEqual(
        events.map( ( e ) => [ e.outcome, e.victimId ] ),
        [ [ 'trigger', 'rival' ] ],
    );
} );

for ( const c of Object.values( SHIP_CLASSES ) ) {
    test( `${ c.id } at top speed: its own forward mine hits it if it holds its line`, () => {
        assert.deepEqual(
            flyOverOwnMine( c.tuning, idle ).map( ( e ) => e.victimId ),
            [ 'owner' ],
        );
    } );

    test( `${ c.id } at top speed: a strafe ${ REACT_S } s after the drop clears its own mine`, () => {
        assert.deepEqual( flyOverOwnMine( c.tuning, strafer ), [] );
    } );

    test( `${ c.id } at top speed: a jump ${ REACT_S } s after the drop clears its own mine`, () => {
        assert.deepEqual( flyOverOwnMine( c.tuning, jumper ), [] );
    } );
}
