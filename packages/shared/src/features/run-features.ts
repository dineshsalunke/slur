import { spendPower } from '../combat/combat-step.js';
import type { FireDir } from '../combat/fire-dir.js';
import type { FireIntent } from '../run/input-queue.js';
import type { PlayerState } from '../schema.js';
import type { HopOrigin, OpenRun, RunContext, SimFeature } from './define-sim-feature.js';
import { SIM_FEATURES } from './registry.js';
import { sortFeatures } from './sim-hooks.js';

type PowerUse = NonNullable< OpenRun[ 'use' ] >;

export interface RunFeatures {
    tap( ctx: RunContext, p: PlayerState, ownerId: string, intent: FireIntent ): boolean;
    use( ctx: RunContext, p: PlayerState, ownerId: string, slot: number, dir: FireDir, kind: number ): boolean;
    hop( ctx: RunContext, victimId: string, from: HopOrigin, p: PlayerState ): void;
    ward( ctx: RunContext, dt: number ): void;
    strike( ctx: RunContext, dt: number ): void;
    settle( ctx: RunContext, dt: number ): void;
    tick( ctx: RunContext, dt: number ): void;
    reset( ctx: RunContext ): void;
}

function registerUses( f: SimFeature, use: PowerUse, uses: Map< number, PowerUse > ): void {
    const kind = f.power?.kind;
    if ( kind === undefined ) throw new Error( `feature "${ f.id }": run.use needs a power kind` );
    for ( const k of [ kind, ...( f.power?.uses ?? [] ) ] ) {
        if ( uses.has( k ) ) throw new Error( `feature "${ f.id }": power kind ${ k } is taken` );
        uses.set( k, use );
    }
}

export function openRunFeatures( features: readonly SimFeature[] = SIM_FEATURES ): RunFeatures {
    const runs: OpenRun[] = [];
    const uses = new Map< number, PowerUse >();
    for ( const f of sortFeatures( features ) ) {
        const run = f.openRun?.();
        if ( ! run ) continue;
        runs.push( run );
        if ( run.use ) registerUses( f, run.use, uses );
    }
    return {
        tap( ctx, p, ownerId, intent ) {
            return runs.some( ( run ) => run.tap?.( ctx, p, ownerId, intent ) ?? false );
        },
        use( ctx, p, ownerId, slot, dir, kind ) {
            const use = uses.get( kind );
            if ( ! use ) return false;
            if ( use( ctx, p, ownerId, slot, dir ) ) spendPower( p, slot );
            return true;
        },
        hop( ctx, victimId, from, p ) {
            for ( const run of runs ) run.hop?.( ctx, victimId, from, p );
        },
        ward( ctx, dt ) {
            for ( const run of runs ) run.ward?.( ctx, dt );
        },
        strike( ctx, dt ) {
            for ( const run of runs ) run.strike?.( ctx, dt );
        },
        settle( ctx, dt ) {
            for ( const run of runs ) run.settle?.( ctx, dt );
        },
        tick( ctx, dt ) {
            for ( const run of runs ) run.tick?.( ctx, dt );
        },
        reset( ctx ) {
            for ( const run of runs ) run.reset?.( ctx );
        },
    };
}
