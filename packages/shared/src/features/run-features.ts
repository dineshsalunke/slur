import { spendPower } from '../combat/combat-step.js';
import type { FireDir } from '../combat/fire-dir.js';
import type { PlayerState } from '../schema.js';
import type { OpenRun, RunContext, SimFeature } from './define-sim-feature.js';
import { SIM_FEATURES } from './registry.js';
import { sortFeatures } from './sim-hooks.js';

type PowerUse = NonNullable< OpenRun[ 'use' ] >;

export interface RunFeatures {
    use( ctx: RunContext, p: PlayerState, ownerId: string, slot: number, dir: FireDir, kind: number ): boolean;
    tick( ctx: RunContext, dt: number ): void;
    reset(): void;
}

export function openRunFeatures( features: readonly SimFeature[] = SIM_FEATURES ): RunFeatures {
    const runs: OpenRun[] = [];
    const uses = new Map< number, PowerUse >();
    for ( const f of sortFeatures( features ) ) {
        const run = f.openRun?.();
        if ( ! run ) continue;
        runs.push( run );
        if ( ! run.use ) continue;
        const kind = f.power?.kind;
        if ( kind === undefined ) throw new Error( `feature "${ f.id }": run.use needs a power kind` );
        if ( uses.has( kind ) ) throw new Error( `feature "${ f.id }": power kind ${ kind } is taken` );
        uses.set( kind, run.use );
    }
    return {
        use( ctx, p, ownerId, slot, dir, kind ) {
            const use = uses.get( kind );
            if ( ! use ) return false;
            if ( use( ctx, p, ownerId, slot, dir ) ) spendPower( p, slot );
            return true;
        },
        tick( ctx, dt ) {
            for ( const run of runs ) run.tick?.( ctx, dt );
        },
        reset() {
            for ( const run of runs ) run.reset?.();
        },
    };
}
