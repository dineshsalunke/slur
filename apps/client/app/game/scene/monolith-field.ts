import { hash2, intensityAt, mulberry32, SEG_LEN, START_SAFE } from '@slur/shared';
import type { MonolithFieldConfig, MonolithRange } from './monolith-config';

export interface MonolithPlacement {
    z: number;
    side: number;
    scaleW: number;
    scaleH: number;
    scaleD: number;
    push: number;
}

export const MIN_SPACING = 8;

const SALT_MONOLITH = 0x6b1f37c5 | 0;
const SIDE_SALT = 0x9e3779b9 | 0;

export function monolithSpacing( intensity: number, calm: number, intense: number ): number {
    return Math.max( MIN_SPACING, calm + ( intense - calm ) * intensity );
}

function pick( u: number, range: MonolithRange ): number {
    return range.min + ( range.max - range.min ) * u;
}

function walk( finishZ: number, config: MonolithFieldConfig, side: number, phase: number ): MonolithPlacement[] {
    const length = Math.max( 1, Math.round( finishZ / SEG_LEN ) );
    const out: MonolithPlacement[] = [];
    let z = START_SAFE * SEG_LEN + phase;
    let step = 0;

    while ( z < finishZ ) {
        const r = mulberry32( hash2( ( SALT_MONOLITH ^ ( side > 0 ? SIDE_SALT : 0 ) ) | 0, step ) );
        const drop = r();
        const scaleW = pick( r(), config.width );
        const scaleH = pick( r(), config.height );
        const scaleD = pick( r(), config.depth );
        const push = r() * config.pushMax;
        const jitter = pick( r(), config.spacing );

        if ( drop >= config.dropRate ) out.push( { z, side, scaleW, scaleH, scaleD, push } );

        const base = monolithSpacing(
            intensityAt( Math.floor( z / SEG_LEN ), length ),
            config.spacingCalm,
            config.spacingIntense,
        );
        z += Math.max( MIN_SPACING, base * jitter );
        step++;
    }
    return out;
}

export function monolithField( finishZ: number, config: MonolithFieldConfig ): MonolithPlacement[] {
    const phase = monolithSpacing( 0, config.spacingCalm, config.spacingIntense ) * config.sidePhase;
    return [ ...walk( finishZ, config, -1, 0 ), ...walk( finishZ, config, 1, phase ) ];
}
