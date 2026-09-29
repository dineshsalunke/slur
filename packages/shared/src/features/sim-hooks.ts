import type { FireDir } from '../combat/fire-dir.js';
import type { FlightTuning } from '../constants.js';
import type { PlayerState } from '../schema.js';
import type { PlayerInput } from '../sim/input.js';
import type { SimShip } from '../sim/types.js';
import type { SimConfig } from '../sim-config.js';
import type { OpenRun, RunContext, SimFeature } from './define-sim-feature.js';
import { SIM_FEATURES } from './registry.js';

type PowerUse = NonNullable< OpenRun[ 'use' ] >;

export interface RunFeatures {
    use( ctx: RunContext, p: PlayerState, ownerId: string, slot: number, dir: FireDir, kind: number ): boolean;
    tick( ctx: RunContext, dt: number ): void;
    reset(): void;
}

export function sortFeatures< T extends { readonly id: string } >( features: readonly T[] ): T[] {
    const sorted = [ ...features ].sort( ( a, b ) => ( a.id < b.id ? -1 : a.id > b.id ? 1 : 0 ) );
    sorted.forEach( ( f, i ) => {
        if ( i > 0 && sorted[ i - 1 ]?.id === f.id ) throw new Error( `feature registry: duplicate id "${ f.id }"` );
    } );
    return sorted;
}

const SORTED = sortFeatures< SimFeature >( SIM_FEATURES );
const THRUST = SORTED.flatMap( ( f ) => f.ship?.thrust ?? [] );
const CAP = SORTED.flatMap( ( f ) => f.ship?.cap ?? [] );
const TICK = SORTED.flatMap( ( f ) => f.ship?.tick ?? [] );

export function featureThrust( s: SimShip, input: PlayerInput, t: FlightTuning, cfg: SimConfig ): number {
    let sum = 0;
    for ( const thrust of THRUST ) sum += thrust( s, input, t, cfg );
    return sum;
}

export function featureCap( s: SimShip, t: FlightTuning, cap: number, cfg: SimConfig ): number {
    let out = cap;
    for ( const fold of CAP ) out = fold( s, t, out, cfg );
    return out;
}

export function tickFeatures( s: SimShip, t: FlightTuning, dt: number, cfg: SimConfig ): void {
    for ( const tick of TICK ) tick( s, t, dt, cfg );
}

export function openRunFeatures( features: readonly SimFeature[] = SORTED ): RunFeatures {
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
            use( ctx, p, ownerId, slot, dir );
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
