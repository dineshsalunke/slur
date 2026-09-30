import { ArraySchema, type InferValueType } from '@colyseus/schema';
import { HeldPower, POWER_SLOTS } from './combat/constants.js';
import type { SimFeature } from './features/define-sim-feature.js';
import { SIM_FEATURES } from './features/registry.js';
import { DEFAULT_SHIP } from './ship-classes.js';

const SIM_FLOAT = { type: 'float32', default: 0, sim: true } as const;
const SIM_FALSE = { type: 'boolean', default: false, sim: true } as const;
const FLOAT = { type: 'float32', default: 0 } as const;
const FALSE = { type: 'boolean', default: false } as const;
const LOCAL_FLOAT = { type: 'float32', default: 0, sync: false } as const;

export const CORE_PLAYER_FIELDS = {
    x: SIM_FLOAT,
    y: SIM_FLOAT,
    z: SIM_FLOAT,
    vx: SIM_FLOAT,
    vy: SIM_FLOAT,
    vz: SIM_FLOAT,
    grounded: { type: 'boolean', default: true, sim: true },
    jumpsUsed: { type: 'uint8', default: 0, sim: true },
    jumpHeld: SIM_FALSE,
    coyoteTimer: SIM_FLOAT,
    bufferTimer: SIM_FLOAT,
    lastProcessedInput: { type: 'uint32', default: 0 },
    connected: { type: 'boolean', default: true },
    dead: SIM_FALSE,
    respawnTimer: SIM_FLOAT,
    invulnTimer: FLOAT,
    lastSafeX: SIM_FLOAT,
    lastSafeZ: SIM_FLOAT,
    finished: SIM_FALSE,
    finishTime: FLOAT,
    shipId: { type: 'string', default: DEFAULT_SHIP },
    name: { type: 'string', default: '' },
    colorId: { type: 'uint8', default: 0 },
    spectating: FALSE,
    stunTimer: SIM_FLOAT,
    heldPower: { type: 'uint8', default: 0 },
    slots: {
        array: 'uint8',
        default: new ArraySchema< number >( ...Array< number >( POWER_SLOTS ).fill( HeldPower.none ) ),
    },
    boostTimer: SIM_FLOAT,
    shielded: FALSE,
    shieldTimer: LOCAL_FLOAT,
    portalHops: { type: 'uint8', default: 0, sim: true },
    strafeHeld: { type: 'int8', default: 0, sim: true },
    kickLeft: SIM_FLOAT,
    kicking: SIM_FALSE,
    glideTimer: SIM_FLOAT,
    progressAt: FLOAT,
    bestZ: LOCAL_FLOAT,
} as const;

type UnionToIntersection< U > = ( U extends unknown ? ( u: U ) => void : never ) extends ( i: infer I ) => void
    ? I
    : never;

export type FeaturePlayerFields< Fs extends readonly SimFeature[] > = [ Fs[ number ] ] extends [ never ]
    ? Record< never, never >
    : UnionToIntersection< NonNullable< NonNullable< Fs[ number ][ 'fields' ] >[ 'player' ] > >;

type Writable< T > = { -readonly [ K in keyof T ]: T[ K ] };

export function composePlayerFields< C extends object, Fs extends readonly SimFeature[] >(
    core: C,
    features: Fs,
): Writable< C & FeaturePlayerFields< Fs > > {
    const out: Record< string, unknown > = Object.fromEntries( Object.entries( core ) );
    for ( const f of features ) {
        for ( const [ name, spec ] of Object.entries( f.fields?.player ?? {} ) ) {
            if ( name in out ) throw new Error( `PlayerState: feature "${ f.id }" redeclares field "${ name }"` );
            out[ name ] = spec;
        }
    }
    return out as Writable< C & FeaturePlayerFields< Fs > >;
}

export const PLAYER_FIELDS = composePlayerFields( CORE_PLAYER_FIELDS, SIM_FEATURES );

type PlayerFields = typeof PLAYER_FIELDS;

type SimKey = { [ K in keyof PlayerFields ]: PlayerFields[ K ] extends { sim: true } ? K : never }[
    keyof PlayerFields
];

type SimFloatKey = { [ K in SimKey ]: PlayerFields[ K ] extends { type: 'float32' } ? K : never }[ SimKey ];

export type SimShipFields = { -readonly [ K in SimKey ]: InferValueType< PlayerFields[ K ] > };

interface FieldFlags {
    readonly type?: unknown;
    readonly default?: unknown;
    readonly sim?: true;
}

function keysWhere< K extends string >( keep: ( spec: FieldFlags ) => boolean ): readonly K[] {
    const specs: Readonly< Record< string, FieldFlags > > = PLAYER_FIELDS;
    return Object.entries( specs )
        .filter( ( [ , spec ] ) => keep( spec ) )
        .map( ( [ k ] ) => k as K );
}

export const SIM_SHIP_KEYS = keysWhere< SimKey >( ( spec ) => spec.sim === true );

export const SIM_FLOAT_KEYS = keysWhere< SimFloatKey >( ( spec ) => spec.sim === true && spec.type === 'float32' );

export type FeatureShipFields = Omit< SimShipFields, keyof typeof CORE_PLAYER_FIELDS >;

function featureShipDefaults(): FeatureShipFields {
    const out: Record< string, unknown > = {};
    for ( const f of SIM_FEATURES ) {
        for ( const [ name, spec ] of Object.entries( f.fields?.player ?? {} ) ) {
            if ( spec.sim === true ) out[ name ] = spec.default;
        }
    }
    return out as FeatureShipFields;
}

export const FEATURE_SHIP_DEFAULTS: Readonly< FeatureShipFields > = featureShipDefaults();
