import assert from 'node:assert/strict';
import { test } from 'node:test';
import { FIXED_DT } from '../constants.js';
import { PlayerState } from '../schema.js';
import { ALL_CLASS_TUNINGS } from '../ship-classes.js';
import type { PlayerInput } from './input.js';
import { simulate } from './step.js';
import { copySimShip, froundSimShip, SIM_FLOAT_KEYS, SIM_SHIP_KEYS, spawnShip } from './types.js';

function inputAt( seq: number ): PlayerInput {
    return {
        seq,
        throttle: seq % 50 < 40 ? 1 : 0,
        brake: seq % 50 >= 45 ? 1 : 0,
        strafe: Math.sin( seq / 7 ),
        jump: seq % 30 === 0,
    };
}

function wire( ship: ReturnType< typeof spawnShip > ): ReturnType< typeof spawnShip > {
    const out = spawnShip();
    copySimShip( out, ship );
    for ( const k of SIM_FLOAT_KEYS ) out[ k ] = new Float32Array( [ ship[ k ] ] )[ 0 ];
    return out;
}

test( 'SIM_FLOAT_KEYS is exactly the float32 schema fields a SimShip carries', () => {
    const meta = ( PlayerState as unknown as Record< symbol, Record< string, { name: string; type: unknown } > > )[
        Symbol.metadata
    ];
    const simKeys = new Set< string >( SIM_SHIP_KEYS );
    const float32 = Object.values( meta )
        .filter( ( f ) => f?.type === 'float32' && simKeys.has( f.name ) )
        .map( ( f ) => f.name );
    assert.deepEqual( [ ...float32 ].sort(), [ ...SIM_FLOAT_KEYS ].sort() );
} );

test( 'froundSimShip makes every float key float32-exact and is idempotent', () => {
    const s = spawnShip( 0.1, 1234.5678 );
    s.vz = 123.456789;
    s.stunTimer = 1.2;
    froundSimShip( s );
    for ( const k of SIM_FLOAT_KEYS ) assert.equal( s[ k ], Math.fround( s[ k ] ), k );
    const again = wire( s );
    froundSimShip( again );
    assert.deepEqual( again, s );
} );

test( 'a replay from a float32 snapshot lands bit-exact on a server that rounds each tick', () => {
    for ( const tuning of ALL_CLASS_TUNINGS ) {
        const server = spawnShip();
        let snapshot = wire( server );
        for ( let seq = 1; seq <= 240; seq++ ) {
            simulate( server, inputAt( seq ), FIXED_DT, tuning );
            froundSimShip( server );
            if ( seq === 120 ) snapshot = wire( server );
        }
        const client = snapshot;
        for ( let seq = 121; seq <= 240; seq++ ) {
            simulate( client, inputAt( seq ), FIXED_DT, tuning );
            froundSimShip( client );
        }
        assert.deepEqual( client, server );
    }
} );
