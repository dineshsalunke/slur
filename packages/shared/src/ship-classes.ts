import { DEFAULT_TUNING, deriveJump, type FlightTuning, rosterContractFailures } from './constants.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from './sim-config.js';

export type ShipClassId = 'interceptor' | 'fighter' | 'comet' | 'phantom' | 'freighter';
export type ShipId = 'executioner' | 'challenger' | 'bob' | 'dispatcher' | 'split-crown';

export interface ShipClass {
    id: ShipClassId;
    name: string;
    tuning: FlightTuning;
    armour: number;
}

export interface Ship {
    id: ShipId;
    name: string;
    classId: ShipClassId;
}

export const SHIP_CLASSES: Record< ShipClassId, ShipClass > = {
    interceptor: {
        id: 'interceptor',
        name: 'Interceptor',
        armour: 0,
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 84,
            accel: 60,
            brakeDecel: 150,
            strafeAccel: 367,
            strafeClamp: 166,
            strafeDamp: 31.5,
            strafeKick: 40,
            halfW: 1.0,
            halfL: 0.92,
            ...deriveJump( { height: 3.0, apexTime: 0.3, descentTime: 0.24, doubleHeight: 3.6, minHeight: 0.8 } ),
            maxJumps: 2,
        },
    },
    fighter: {
        id: 'fighter',
        name: 'Fighter',
        armour: 0.2,
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 96,
            accel: 58,
            brakeDecel: 130,
            strafeAccel: 288,
            strafeClamp: 140,
            strafeDamp: 24.5,
            strafeKick: 34,
        },
    },
    comet: {
        id: 'comet',
        name: 'Comet',
        armour: 0.1,
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 112,
            accel: 66,
            brakeDecel: 100,
            strafeAccel: 290,
            strafeClamp: 136,
            strafeDamp: 14.4,
            strafeKick: 30,
            halfW: 1.1,
            halfL: 0.59,
            ...deriveJump( { height: 2.8, apexTime: 0.3, descentTime: 0.24, doubleHeight: 3.3, minHeight: 0.8 } ),
            maxJumps: 2,
        },
    },
    phantom: {
        id: 'phantom',
        name: 'Phantom',
        armour: 0.3,
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 90,
            accel: 52,
            brakeDecel: 120,
            strafeAccel: 270,
            strafeClamp: 135,
            strafeDamp: 23.4,
            strafeKick: 30,
            halfW: 1.2,
            halfL: 2.51,
            ...deriveJump( { height: 4.2, apexTime: 0.32, descentTime: 0.26, doubleHeight: 5.0, minHeight: 0.9 } ),
            maxJumps: 3,
        },
    },
    freighter: {
        id: 'freighter',
        name: 'Freighter',
        armour: 0.4,
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 124,
            accel: 30,
            brakeDecel: 150,
            strafeAccel: 236,
            strafeClamp: 130,
            strafeDamp: 20,
            strafeKick: 26,
            halfW: 1.25,
            halfL: 3.0,
            ...deriveJump( { height: 3.6, apexTime: 0.3, descentTime: 0.24, doubleHeight: 4.3, minHeight: 0.9 } ),
            maxJumps: 2,
        },
    },
};

export const SHIPS: Record< ShipId, Ship > = {
    executioner: { id: 'executioner', name: 'Executioner', classId: 'interceptor' },
    challenger: { id: 'challenger', name: 'Challenger', classId: 'fighter' },
    bob: { id: 'bob', name: 'Bob', classId: 'comet' },
    dispatcher: { id: 'dispatcher', name: 'Dispatcher', classId: 'phantom' },
    'split-crown': { id: 'split-crown', name: 'Split Crown', classId: 'freighter' },
};

export const DEFAULT_SHIP: ShipId = 'split-crown';

export const SET_CLASS_MESSAGE = 'setClass';

export function isShipId( id: unknown ): id is ShipId {
    return typeof id === 'string' && id in SHIPS;
}

export const SHIP_ORDER: ShipId[] = [ 'executioner', 'challenger', 'bob', 'dispatcher', 'split-crown' ];

export function shipOf( id: string ): Ship {
    return SHIPS[ id as ShipId ] ?? SHIPS[ DEFAULT_SHIP ];
}
export function classOfShip( id: string ): ShipClass {
    return SHIP_CLASSES[ shipOf( id ).classId ];
}
export function tuningForShip( id: string ): FlightTuning {
    return classOfShip( id ).tuning;
}
export function armourForShip( id: string ): number {
    return classOfShip( id ).armour;
}

export function stunDurationForShip(
    id: string,
    cfg: SimConfig = DEFAULT_SIM_CONFIG,
    seconds: number = cfg.stunSeconds,
): number {
    return seconds * ( 1 - armourForShip( id ) );
}

export const ALL_CLASS_TUNINGS: FlightTuning[] = Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning );

export const FASTEST_CRUISE = Math.max( ...ALL_CLASS_TUNINGS.map( ( t ) => t.maxCruise ) );

const contractFailures = rosterContractFailures( Object.values( SHIP_CLASSES ) );
if ( contractFailures.length > 0 )
    throw new Error( `ship roster breaks the GDD §0 track contract:\n  ${ contractFailures.join( '\n  ' ) }` );
