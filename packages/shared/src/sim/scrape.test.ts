import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIXED_DT, type FlightTuning } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { emptyInput } from './input.js';
import { BLOCK_HEIGHT, type Block, HALF_WIDTH, SEG_LEN, type Segment, type Track } from './space.js';
import { type Contact, simulate } from './step.js';
import { spawnShip } from './types.js';

const WALL_Z0 = 3 * SEG_LEN;
const WALL_X0 = 5;
const HOLD_TICKS = Math.round( 4 / FIXED_DT );

function trackWith( wall: Block ): Track {
    const seg = ( i: number ): Segment => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: i >= 3 ? 'block' : 'plain',
        floors: [ { x0: -HALF_WIDTH, x1: HALF_WIDTH, y: 0 } ],
        blocks: i >= 3 ? [ wall ] : [],
        isFinish: false,
    } );
    return { finishZ: 1e9, segmentAt: seg, segmentAtZ: ( z ) => seg( Math.floor( z / SEG_LEN ) ), anchors: [] };
}

function wall( x0: number, x1: number ): Block {
    return { x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0: WALL_Z0, z1: 1e6, id: 3 * 64, kind: 'sealed' };
}

function holdIntoWall( t: FlightTuning ): { contacts: Contact[]; minVz: number; vz: number; stunned: boolean } {
    const track = trackWith( wall( WALL_X0, WALL_X0 + 8 ) );
    const s = spawnShip( WALL_X0 - t.halfW - 0.5, WALL_Z0 + 2 * SEG_LEN );
    s.vz = t.maxCruise;
    const inp = emptyInput();
    inp.throttle = 1;
    inp.strafe = 1;
    const contacts: Contact[] = [];
    let minVz = s.vz;
    let stunned = false;
    for ( let i = 0; i < HOLD_TICKS; i++ ) {
        const c = simulate( s, inp, FIXED_DT, t, track );
        if ( c !== null ) contacts.push( c );
        minVz = Math.min( minVz, s.vz );
        stunned ||= s.stunTimer > 0;
    }
    return { contacts, minVz, vz: s.vz, stunned };
}

test( 'holding strafe into a long wall for 4 s keeps cruise for every class', () => {
    for ( const [ id, c ] of Object.entries( SHIP_CLASSES ) ) {
        const t = c.tuning;
        const r = holdIntoWall( t );
        assert.deepEqual( r.contacts, [ { kind: 'scrape', dir: -1 } ], `${ id }: expected one fresh scrape` );
        assert.equal( r.stunned, false, `${ id }: the wall stunned the ship` );
        assert.ok( r.minVz >= t.maxCruise * t.scrapeKeep - 1e-9, `${ id }: vz fell to ${ r.minVz }` );
        assert.ok( Math.abs( r.vz - t.maxCruise ) < 1e-6, `${ id }: vz ${ r.vz } never returned to cruise` );
    }
} );

test( 'a head-on hit still bounces back and stuns every class', () => {
    for ( const [ id, c ] of Object.entries( SHIP_CLASSES ) ) {
        const t = c.tuning;
        const track = trackWith( wall( -8, 8 ) );
        const s = spawnShip( 0, WALL_Z0 - t.halfL - 10 );
        s.vz = t.maxCruise;
        const inp = emptyInput();
        inp.throttle = 1;
        let contact: Contact = null;
        for ( let i = 0; i < 60 && contact === null; i++ ) contact = simulate( s, inp, FIXED_DT, t, track );
        assert.deepEqual( contact, { kind: 'hit', dir: -1 }, id );
        assert.equal( s.vz, -t.bounceBack, id );
        assert.equal( s.stunTimer, t.bounceStun, id );
    }
} );
