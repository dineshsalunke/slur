import { MAX_SHIP_WIDTH } from '../constants.js';
import { SHIP_CLASSES } from '../ship-classes.js';
import { type Block, type FloorSpan, HALF_WIDTH, SEG_LEN, type Segment } from './space.js';

export const FRACTURE_SHADOW_S = 1;
export const FRACTURE_SHADOW_Z =
    FRACTURE_SHADOW_S *
    Math.max( ...Object.values( SHIP_CLASSES ).map( ( c ) => c.tuning.smashKeep * c.tuning.maxCruise ) );
export const FRACTURE_SHADOW_PAD = MAX_SHIP_WIDTH / 2;
export const FRACTURE_SHADOW_SEGMENTS = Math.ceil( FRACTURE_SHADOW_Z / SEG_LEN );

export type ShadowHazard = 'block' | 'gap';

export interface ShadowBox {
    x0: number;
    x1: number;
    z0: number;
    z1: number;
}

export interface ShadowRule {
    clear: number;
    pad: number;
}

export const FRACTURE_SHADOW_RULE: ShadowRule = { clear: FRACTURE_SHADOW_Z, pad: FRACTURE_SHADOW_PAD };

export function shadowOf( b: Block, rule: ShadowRule = FRACTURE_SHADOW_RULE ): ShadowBox {
    return {
        x0: Math.max( -HALF_WIDTH, b.x0 - rule.pad ),
        x1: Math.min( HALF_WIDTH, b.x1 + rule.pad ),
        z0: b.z1,
        z1: b.z1 + rule.clear,
    };
}

function meetsZ( s: ShadowBox, z0: number, z1: number ): boolean {
    return z0 < s.z1 && z1 > s.z0;
}

function blockIn( s: ShadowBox, o: Block ): boolean {
    return meetsZ( s, o.z0, o.z1 ) && o.x0 < s.x1 && o.x1 > s.x0;
}

function floorCovers( floors: FloorSpan[], x0: number, x1: number ): boolean {
    const spans = floors.filter( ( f ) => f.x1 > x0 && f.x0 < x1 ).sort( ( a, b ) => a.x0 - b.x0 );
    let reach = x0;
    for ( const f of spans ) {
        if ( f.x0 > reach ) return false;
        reach = Math.max( reach, f.x1 );
        if ( reach >= x1 ) return true;
    }
    return reach >= x1;
}

export function shadowHazard(
    b: Block,
    segs: Segment[],
    rule: ShadowRule = FRACTURE_SHADOW_RULE,
): ShadowHazard | null {
    const s = shadowOf( b, rule );
    let gap = false;
    for ( const seg of segs ) {
        if ( ! meetsZ( s, seg.z0, seg.z1 ) ) continue;
        if ( seg.blocks.some( ( o ) => o.id !== b.id && blockIn( s, o ) ) ) return 'block';
        gap ||= ! floorCovers( seg.floors, s.x0, s.x1 );
    }
    return gap ? 'gap' : null;
}

export function sealShadowed( seg: Segment, ahead: Segment[], rule: ShadowRule = FRACTURE_SHADOW_RULE ): Block[] {
    const segs = [ seg, ...ahead ];
    return seg.blocks.map( ( b ) =>
        b.kind === 'fractured' && shadowHazard( b, segs, rule ) !== null ? { ...b, kind: 'sealed' } : b,
    );
}
