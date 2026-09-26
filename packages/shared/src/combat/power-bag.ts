import { hash2, mulberry32 } from '../sim/rng.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { HeldPower } from './constants.js';

export const POWER_BAG_SIZE = 20;
export const POWER_RUN_CAP = 2;
export const POWER_BAG_SHUFFLES = 256;

const SALT_POWER_BAG = 0x5e3c4b21 | 0;
const BAG_CACHE_LIMIT = 1024;

export interface PowerCount {
    power: HeldPower;
    count: number;
}

export function bagCounts( cfg: SimConfig = DEFAULT_SIM_CONFIG ): PowerCount[] {
    let left = 1;
    const take = ( ratio: number ): number => {
        const share = Math.max( 0, Math.min( ratio, left ) );
        left -= share;
        return share;
    };
    const drawn: [ HeldPower, number ][] = [
        [ HeldPower.seeker, take( cfg.seekerRatio ) ],
        [ HeldPower.mine, take( cfg.mineRatio ) ],
        [ HeldPower.boost, take( cfg.boostRatio ) ],
        [ HeldPower.shield, take( cfg.shieldRatio ) ],
        [ HeldPower.portal, take( cfg.portalRatio ) ],
        [ HeldPower.tug, take( cfg.tugRatio ) ],
    ];
    const shares: [ HeldPower, number ][] = [ [ HeldPower.bolt, left ], ...drawn ];
    const counts = shares.map( ( [ power, share ] ) => ( {
        power,
        count: Math.floor( share * POWER_BAG_SIZE ),
        rest: share * POWER_BAG_SIZE - Math.floor( share * POWER_BAG_SIZE ),
    } ) );
    let spare = POWER_BAG_SIZE - counts.reduce( ( s, c ) => s + c.count, 0 );
    for ( const c of [ ...counts ].sort( ( a, b ) => b.rest - a.rest ) ) {
        if ( spare <= 0 ) break;
        c.count++;
        spare--;
    }
    return counts.filter( ( c ) => c.count > 0 ).map( ( { power, count } ) => ( { power, count } ) );
}

function saltNumber( salt: string ): number {
    let h = SALT_POWER_BAG;
    for ( let i = 0; i < salt.length; i++ ) h = hash2( h, salt.charCodeAt( i ) ) | 0;
    return h;
}

export function longestRun( seq: readonly HeldPower[] ): number {
    let best = 0;
    let run = 0;
    for ( let i = 0; i < seq.length; i++ ) {
        run = i > 0 && seq[ i ] === seq[ i - 1 ] ? run + 1 : 1;
        best = Math.max( best, run );
    }
    return best;
}

function seamSafe( bag: readonly HeldPower[], dominant: HeldPower ): boolean {
    return bag[ 0 ] !== dominant && bag[ bag.length - 1 ] === dominant;
}

function shuffle( bag: HeldPower[], rand: () => number ): void {
    for ( let i = bag.length - 1; i > 0; i-- ) {
        const j = Math.floor( rand() * ( i + 1 ) );
        [ bag[ i ], bag[ j ] ] = [ bag[ j ], bag[ i ] ];
    }
}

function dealBag( salt: string, index: number, cfg: SimConfig ): HeldPower[] {
    const counts = bagCounts( cfg );
    const dominant = counts.reduce( ( a, b ) => ( b.count > a.count ? b : a ) ).power;
    const bag = counts.flatMap( ( { power, count } ) => Array.from( { length: count }, () => power ) );
    const rand = mulberry32( hash2( saltNumber( salt ), index ) );
    let runSafe: HeldPower[] | null = null;
    for ( let t = 0; t < POWER_BAG_SHUFFLES; t++ ) {
        shuffle( bag, rand );
        if ( longestRun( bag ) > POWER_RUN_CAP ) continue;
        if ( seamSafe( bag, dominant ) ) return bag;
        runSafe ??= [ ...bag ];
    }
    return runSafe ?? bag;
}

const bags = new Map< string, HeldPower[] >();

export function powerBag( salt: string, index: number, cfg: SimConfig = DEFAULT_SIM_CONFIG ): readonly HeldPower[] {
    const key = `${ salt }|${ index }|${ cfg.seekerRatio }|${ cfg.mineRatio }|${ cfg.boostRatio }|${ cfg.shieldRatio }|${ cfg.portalRatio }|${ cfg.tugRatio }`;
    let bag = bags.get( key );
    if ( bag === undefined ) {
        if ( bags.size >= BAG_CACHE_LIMIT ) bags.clear();
        bag = dealBag( salt, index, cfg );
        bags.set( key, bag );
    }
    return bag;
}
