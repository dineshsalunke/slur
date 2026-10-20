import type { PrimitiveType } from '@colyseus/schema';
import type { HeldPower, HitMessage } from '../combat/constants.js';
import type { FireDir } from '../combat/fire-dir.js';
import type { MineEvent } from '../combat/mine-hit.js';
import type { FlightTuning } from '../constants.js';
import type { RuleEntry } from '../rules/define-rules.js';
import type { Broadcast } from '../run/combat.js';
import type { FireIntent } from '../run/input-queue.js';
import type { RunEvent } from '../run/run-event.js';
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
    readonly broken: Set< number >;
    readonly config: SimConfig;
    readonly broadcast: Broadcast;
    readonly shieldAbsorbs: ( v: PlayerState, at: HitMessage ) => boolean;
    readonly resolveMine: ( event: MineEvent ) => void;
    readonly nextId: () => string;
}

export interface HopOrigin {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

export interface RunHooks< S > {
    readonly open: () => S;
    readonly tap?: ( ctx: RunContext, run: S, p: PlayerState, ownerId: string, intent: FireIntent ) => boolean;
    readonly use?: ( ctx: RunContext, run: S, p: PlayerState, ownerId: string, slot: number, dir: FireDir ) => boolean;
    readonly hop?: ( ctx: RunContext, run: S, victimId: string, from: HopOrigin, p: PlayerState ) => void;
    readonly ward?: ( ctx: RunContext, run: S, dt: number ) => void;
    readonly strike?: ( ctx: RunContext, run: S, dt: number ) => void;
    readonly settle?: ( ctx: RunContext, run: S, dt: number ) => void;
    readonly tick?: ( ctx: RunContext, run: S, dt: number ) => void;
    readonly reset?: ( ctx: RunContext, run: S ) => void;
}

export interface OpenRun {
    readonly tap?: ( ctx: RunContext, p: PlayerState, ownerId: string, intent: FireIntent ) => boolean;
    readonly use?: ( ctx: RunContext, p: PlayerState, ownerId: string, slot: number, dir: FireDir ) => boolean;
    readonly hop?: ( ctx: RunContext, victimId: string, from: HopOrigin, p: PlayerState ) => void;
    readonly ward?: ( ctx: RunContext, dt: number ) => void;
    readonly strike?: ( ctx: RunContext, dt: number ) => void;
    readonly settle?: ( ctx: RunContext, dt: number ) => void;
    readonly tick?: ( ctx: RunContext, dt: number ) => void;
    readonly reset?: ( ctx: RunContext ) => void;
}

interface PowerKinds {
    readonly kind: HeldPower;
    readonly uses?: readonly HeldPower[];
}

export interface WeightedPower extends PowerKinds {
    readonly bagWeight: ( cfg: SimConfig ) => number;
}

export interface RestPower extends PowerKinds {
    readonly bagRest: true;
}

export type PowerSpec = WeightedPower | RestPower;

export interface SimFeatureSpec< F extends PlayerFieldSpecs, S > {
    readonly id: string;
    readonly power?: PowerSpec;
    readonly fields?: { readonly player?: F };
    readonly ship?: ShipHooks;
    readonly run?: RunHooks< S >;
    readonly messages?: readonly RunEvent< unknown >[];
    readonly rules?: readonly RuleEntry[];
}

export interface SimFeature< F extends PlayerFieldSpecs = PlayerFieldSpecs > {
    readonly id: string;
    readonly power?: PowerSpec;
    readonly fields?: { readonly player?: F };
    readonly ship?: ShipHooks;
    readonly openRun?: () => OpenRun;
    readonly messages?: readonly RunEvent< unknown >[];
    readonly rules?: readonly RuleEntry[];
}

function bindRun< S >( hooks: RunHooks< S > ): () => OpenRun {
    return () => {
        const run = hooks.open();
        const { tap, use, hop, ward, strike, settle, tick, reset } = hooks;
        return {
            tap: tap && ( ( ctx, p, ownerId, intent ) => tap( ctx, run, p, ownerId, intent ) ),
            use: use && ( ( ctx, p, ownerId, slot, dir ) => use( ctx, run, p, ownerId, slot, dir ) ),
            hop: hop && ( ( ctx, victimId, from, p ) => hop( ctx, run, victimId, from, p ) ),
            ward: ward && ( ( ctx, dt ) => ward( ctx, run, dt ) ),
            strike: strike && ( ( ctx, dt ) => strike( ctx, run, dt ) ),
            settle: settle && ( ( ctx, dt ) => settle( ctx, run, dt ) ),
            tick: tick && ( ( ctx, dt ) => tick( ctx, run, dt ) ),
            reset: reset && ( ( ctx ) => reset( ctx, run ) ),
        };
    };
}

export function defineSimFeature< const F extends PlayerFieldSpecs, S = undefined >(
    spec: SimFeatureSpec< F, S >,
): SimFeature< F > {
    const { run, ...rest } = spec;
    return run ? { ...rest, openRun: bindRun( run ) } : rest;
}
