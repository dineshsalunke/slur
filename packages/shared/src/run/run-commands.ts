import { isSlot } from '../combat/combat-step.js';
import { DROP_POWERUP_MESSAGE, type PowerSlotMessage, USE_POWERUP_MESSAGE } from '../combat/constants.js';
import { END_RACE_MESSAGE, isColorId, RESTART_MESSAGE, SET_COLOR_MESSAGE, START_MESSAGE } from '../race/director.js';
import { isShipId, SET_CLASS_MESSAGE, type ShipId } from '../ship-classes.js';
import { INPUT_MESSAGE, type InputMessage } from '../sim/input.js';
import { type CommandFormat, commandFormat } from './command-format.js';
import { type FireIntent, parseFire, sanitizeInputs } from './input-queue.js';
import type { RunSim } from './run-sim.js';

export interface RunCommandInputs {
    readonly [ INPUT_MESSAGE ]: InputMessage;
    readonly [ SET_CLASS_MESSAGE ]: ShipId;
    readonly [ SET_COLOR_MESSAGE ]: number;
    readonly [ START_MESSAGE ]: undefined;
    readonly [ RESTART_MESSAGE ]: undefined;
    readonly [ END_RACE_MESSAGE ]: undefined;
    readonly [ USE_POWERUP_MESSAGE ]: PowerSlotMessage;
    readonly [ DROP_POWERUP_MESSAGE ]: PowerSlotMessage;
}

export interface RunCommandOutputs {
    readonly [ INPUT_MESSAGE ]: InputMessage;
    readonly [ SET_CLASS_MESSAGE ]: ShipId | null;
    readonly [ SET_COLOR_MESSAGE ]: number | null;
    readonly [ START_MESSAGE ]: undefined;
    readonly [ RESTART_MESSAGE ]: undefined;
    readonly [ END_RACE_MESSAGE ]: undefined;
    readonly [ USE_POWERUP_MESSAGE ]: FireIntent | null;
    readonly [ DROP_POWERUP_MESSAGE ]: number | null;
}

export type RunCommandType = keyof RunCommandInputs;

export type CommandTarget = Pick<
    RunSim,
    'input' | 'setClass' | 'setColor' | 'start' | 'restart' | 'endRace' | 'usePower' | 'dropPower'
>;

export type RunCommandFormats = {
    readonly [ K in RunCommandType ]: CommandFormat< RunCommandInputs[ K ], RunCommandOutputs[ K ] >;
};

export type RunCommandHandlers = {
    readonly [ K in RunCommandType ]: (
        target: CommandTarget,
        sessionId: string,
        message: RunCommandOutputs[ K ],
    ) => void;
};

function inputsOf( value: unknown ): InputMessage {
    const inputs = typeof value === 'object' && value !== null && 'inputs' in value ? value.inputs : undefined;
    return { inputs: sanitizeInputs( inputs ) };
}

function slotOf( value: unknown ): number | null {
    const slot = typeof value === 'object' && value !== null && 'slot' in value ? value.slot : undefined;
    return isSlot( slot ) ? slot : null;
}

function nothing(): undefined {
    return undefined;
}

export const RUN_COMMAND_FORMATS: RunCommandFormats = {
    [ INPUT_MESSAGE ]: commandFormat( inputsOf ),
    [ SET_CLASS_MESSAGE ]: commandFormat( ( value ) => ( isShipId( value ) ? value : null ) ),
    [ SET_COLOR_MESSAGE ]: commandFormat( ( value ) => ( isColorId( value ) ? value : null ) ),
    [ START_MESSAGE ]: commandFormat( nothing ),
    [ RESTART_MESSAGE ]: commandFormat( nothing ),
    [ END_RACE_MESSAGE ]: commandFormat( nothing ),
    [ USE_POWERUP_MESSAGE ]: commandFormat( parseFire ),
    [ DROP_POWERUP_MESSAGE ]: commandFormat( slotOf ),
};

export const RUN_COMMAND_HANDLERS: RunCommandHandlers = {
    [ INPUT_MESSAGE ]: ( target, id, message ) => target.input( id, message ),
    [ SET_CLASS_MESSAGE ]: ( target, id, shipId ) => target.setClass( id, shipId ),
    [ SET_COLOR_MESSAGE ]: ( target, id, colorId ) => target.setColor( id, colorId ),
    [ START_MESSAGE ]: ( target, id ) => target.start( id ),
    [ RESTART_MESSAGE ]: ( target, id ) => target.restart( id ),
    [ END_RACE_MESSAGE ]: ( target, id ) => target.endRace( id ),
    [ USE_POWERUP_MESSAGE ]: ( target, id, fire ) => target.usePower( id, fire ?? undefined ),
    [ DROP_POWERUP_MESSAGE ]: ( target, id, slot ) => target.dropPower( id, slot === null ? undefined : { slot } ),
};

export const RUN_COMMAND_TYPES = Object.freeze( [
    INPUT_MESSAGE,
    SET_CLASS_MESSAGE,
    SET_COLOR_MESSAGE,
    START_MESSAGE,
    RESTART_MESSAGE,
    END_RACE_MESSAGE,
    USE_POWERUP_MESSAGE,
    DROP_POWERUP_MESSAGE,
] as const satisfies readonly RunCommandType[] );

export function isRunCommand( type: string ): type is RunCommandType {
    return Object.hasOwn( RUN_COMMAND_HANDLERS, type );
}

export function applyRunCommand< K extends RunCommandType >(
    target: CommandTarget,
    sessionId: string,
    type: K,
    raw: unknown,
): void {
    const handle: RunCommandHandlers[ K ] = RUN_COMMAND_HANDLERS[ type ];
    handle( target, sessionId, RUN_COMMAND_FORMATS[ type ][ '~standard' ].validate( raw ).value );
}
