import { DEFAULT_TUNING, deriveJump, type FlightTuning } from './constants.js';
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
            maxCruise: 48,
            accel: 45,
            strafeAccel: 210,
            strafeClamp: 95,
            strafeDamp: 18,
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
        tuning: DEFAULT_TUNING,
    },
    comet: {
        id: 'comet',
        name: 'Comet',
        armour: 0.1,
        tuning: {
            ...DEFAULT_TUNING,
            maxCruise: 70,
            accel: 52,
            strafeAccel: 180,
            strafeClamp: 85,
            strafeDamp: 9,
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
            maxCruise: 50,
            accel: 38,
            strafeAccel: 150,
            strafeClamp: 75,
            strafeDamp: 13,
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
            maxCruise: 62,
            accel: 30,
            strafeAccel: 118,
            strafeClamp: 65,
            strafeDamp: 10,
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

export const DEFAULT_SHIP: ShipId = 'challenger';

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

export function stunDurationForShip( id: string, cfg: SimConfig = DEFAULT_SIM_CONFIG ): number {
    return cfg.stunSeconds * ( 1 - armourForShip( id ) );
}

export const ALL_CLASS_TUNINGS: FlightTuning[] = Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning );
