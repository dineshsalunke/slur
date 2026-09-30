import type { PrimitiveType } from '@colyseus/schema';
import type { HeldPower, HitMessage } from '../combat/constants.js';
import type { FireDir } from '../combat/fire-dir.js';
import type { FlightTuning } from '../constants.js';
import type { Broadcast } from '../run/combat.js';
import type { PlayerState, RunState } from '../schema.js';
import type { PlayerInput } from '../sim/input.js';
import type { Track } from '../sim/space.js';
import type { SimShip } from '../sim/types.js';
import type { SimConfig } from '../sim-config.js';

export interface PlayerFieldSpec {
    readonly type: Extract< PrimitiveType, string >;
    readonly default: number | boolean | string;
    readonly sim?: true;
    readonly sync?: false;
}

export type PlayerFieldSpecs = Readonly< Record< string, PlayerFieldSpec > >;

export interface ShipHooks {
    readonly input?: ( s: SimShip, input: PlayerInput, cfg: SimConfig ) => PlayerInput;
    readonly thrust?: ( s: SimShip, input: PlayerInput, t: FlightTuning, cfg: SimConfig ) => number;
    readonly cap?: ( s: SimShip, t: FlightTuning, cap: number, cfg: SimConfig ) => number;
    readonly tick?: ( s: SimShip, t: FlightTuning, dt: number, cfg: SimConfig ) => void;
    readonly clear?: ( s: SimShip ) => void;
}

export interface RunContext {
    readonly state: RunState;
    readonly track: Track;
    readonly broken: ReadonlySet< number >;
    readonly config: SimConfig;
    readonly broadcast: Broadcast;
    readonly shieldAbsorbs: ( v: PlayerState, at: HitMessage ) => boolean;
}

export interface RunHooks< S > {
    readonly open: () => S;
    readonly use?: ( ctx: RunContext, run: S, p: PlayerState, ownerId: string, slot: number, dir: FireDir ) => boolean;
    readonly tick?: ( ctx: RunContext, run: S, dt: number ) => void;
    readonly reset?: ( run: S ) => void;
}

export interface OpenRun {
    readonly use?: ( ctx: RunContext, p: PlayerState, ownerId: string, slot: number, dir: FireDir ) => boolean;
    readonly tick?: ( ctx: RunContext, dt: number ) => void;
    readonly reset?: () => void;
}

export interface PowerSpec {
    readonly kind: HeldPower;
    readonly bagWeight: ( cfg: SimConfig ) => number;
}

export interface SimFeatureSpec< F extends PlayerFieldSpecs, S > {
    readonly id: string;
    readonly power?: PowerSpec;
    readonly fields?: { readonly player?: F };
    readonly ship?: ShipHooks;
    readonly run?: RunHooks< S >;
    readonly messages?: readonly string[];
}

export interface SimFeature< F extends PlayerFieldSpecs = PlayerFieldSpecs > {
    readonly id: string;
    readonly power?: PowerSpec;
    readonly fields?: { readonly player?: F };
    readonly ship?: ShipHooks;
    readonly openRun?: () => OpenRun;
    readonly messages?: readonly string[];
}

function bindRun< S >( hooks: RunHooks< S > ): () => OpenRun {
    return () => {
        const run = hooks.open();
        const { use, tick, reset } = hooks;
        return {
            use: use && ( ( ctx, p, ownerId, slot, dir ) => use( ctx, run, p, ownerId, slot, dir ) ),
            tick: tick && ( ( ctx, dt ) => tick( ctx, run, dt ) ),
            reset: reset && ( () => reset( run ) ),
        };
    };
}

export function defineSimFeature< const F extends PlayerFieldSpecs, S = undefined >(
    spec: SimFeatureSpec< F, S >,
): SimFeature< F > {
    const { run, ...rest } = spec;
    return run ? { ...rest, openRun: bindRun( run ) } : rest;
}
