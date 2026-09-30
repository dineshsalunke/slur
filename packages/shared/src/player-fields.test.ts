import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PlayerState } from './schema.js';
import { DEFAULT_SHIP } from './ship-classes.js';
import { SIM_FLOAT_KEYS, SIM_SHIP_KEYS } from './sim/types.js';

const MAX_FIELD_INDEX = 63;

const WIRE_ORDER = [
    [ 'x', 'float32' ],
    [ 'y', 'float32' ],
    [ 'z', 'float32' ],
    [ 'vx', 'float32' ],
    [ 'vy', 'float32' ],
    [ 'vz', 'float32' ],
    [ 'grounded', 'boolean' ],
    [ 'jumpsUsed', 'uint8' ],
    [ 'jumpHeld', 'boolean' ],
    [ 'coyoteTimer', 'float32' ],
    [ 'bufferTimer', 'float32' ],
    [ 'lastProcessedInput', 'uint32' ],
    [ 'connected', 'boolean' ],
    [ 'dead', 'boolean' ],
    [ 'respawnTimer', 'float32' ],
    [ 'invulnTimer', 'float32' ],
    [ 'lastSafeX', 'float32' ],
    [ 'lastSafeZ', 'float32' ],
    [ 'finished', 'boolean' ],
    [ 'finishTime', 'float32' ],
    [ 'shipId', 'string' ],
    [ 'name', 'string' ],
    [ 'colorId', 'uint8' ],
    [ 'spectating', 'boolean' ],
    [ 'stunTimer', 'float32' ],
    [ 'heldPower', 'uint8' ],
    [ 'slots', 'array:uint8' ],
    [ 'boostTimer', 'float32' ],
    [ 'shielded', 'boolean' ],
    [ 'portalHops', 'uint8' ],
    [ 'strafeHeld', 'int8' ],
    [ 'kickLeft', 'float32' ],
    [ 'kicking', 'boolean' ],
    [ 'glideTimer', 'float32' ],
    [ 'progressAt', 'float32' ],
    [ 'tugTimer', 'float32' ],
    [ 'slowTimer', 'float32' ],
    [ 'towTimer', 'float32' ],
    [ 'tugAnchorZ', 'float32' ],
] as const;

const SIM_KEYS = [
    'x',
    'y',
    'z',
    'vx',
    'vy',
    'vz',
    'grounded',
    'jumpsUsed',
    'jumpHeld',
    'coyoteTimer',
    'bufferTimer',
    'dead',
    'respawnTimer',
    'lastSafeX',
    'lastSafeZ',
    'finished',
    'stunTimer',
    'boostTimer',
    'glideTimer',
    'tugTimer',
    'slowTimer',
    'towTimer',
    'tugAnchorZ',
    'portalHops',
    'strafeHeld',
    'kickLeft',
    'kicking',
];

interface FieldMeta {
    name: string;
    type: unknown;
    index: number;
}

function wireFields(): FieldMeta[] {
    const meta = ( PlayerState as unknown as Record< symbol, Record< number, FieldMeta | undefined > > )[
        Symbol.metadata
    ];
    const fields: FieldMeta[] = [];
    for ( let i = 0; meta[ i ] !== undefined; i++ ) fields.push( meta[ i ] as FieldMeta );
    return fields;
}

function typeName( type: unknown ): string {
    if ( typeof type === 'string' ) return type;
    const [ kind, child ] = Object.entries( type as object )[ 0 ] ?? [];
    return `${ kind }:${ String( child ) }`;
}

test( 'PlayerState keeps every existing field at its wire index and type', () => {
    const fields = wireFields();
    WIRE_ORDER.forEach( ( [ name, type ], index ) => {
        const f = fields[ index ];
        assert.ok( f, `field ${ index } (${ name }) is missing` );
        assert.equal( f.name, name, `index ${ index }` );
        assert.equal( f.index, index, name );
        assert.equal( typeName( f.type ), type, name );
    } );
} );

test( 'PlayerState only appends fields and every index stays below 64', () => {
    const fields = wireFields();
    assert.ok( fields.length >= WIRE_ORDER.length );
    for ( const f of fields ) assert.ok( f.index <= MAX_FIELD_INDEX, `${ f.name } sits at index ${ f.index }` );
} );

test( 'PlayerState keeps shieldTimer and bestZ off the wire with a zero default', () => {
    const names = new Set( wireFields().map( ( f ) => f.name ) );
    const p = new PlayerState();
    for ( const k of [ 'shieldTimer', 'bestZ' ] as const ) {
        assert.ok( ! names.has( k ), k );
        assert.equal( p[ k ], 0, k );
    }
} );

test( 'a new PlayerState starts from the same defaults', () => {
    const p = new PlayerState();
    assert.equal( p.grounded, true );
    assert.equal( p.connected, true );
    assert.equal( p.shipId, DEFAULT_SHIP );
    assert.equal( p.name, '' );
    assert.deepEqual( [ ...p.slots ], [ 0, 0, 0 ] );
    assert.notEqual( p.slots, new PlayerState().slots );
} );

test( 'SIM_SHIP_KEYS and SIM_FLOAT_KEYS cover the same fields as before', () => {
    assert.deepEqual( [ ...SIM_SHIP_KEYS ].sort(), [ ...SIM_KEYS ].sort() );
    const float32 = WIRE_ORDER.filter( ( [ name, type ] ) => type === 'float32' && SIM_KEYS.includes( name ) );
    assert.deepEqual( [ ...SIM_FLOAT_KEYS ].sort(), float32.map( ( [ name ] ) => name ).sort() );
} );
