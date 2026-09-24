import {
    BLOCK_HEIGHT,
    type Block,
    type BlockBox,
    blockId,
    CALM_TUBE_HALF,
    CELL,
    type ComposedScore,
    type EmittedScore,
    fullFloor,
    HALF_WIDTH,
    type OpenSpan,
    SEG_LEN,
    type Segment,
    SMASH_HALF,
    START_SAFE,
    segIndexForZ,
} from '@slur/shared';
import type { LabStage } from './bundle.ts';

export const OPEN_RAIL = CELL;
export const OPEN_NEAR = CALM_TUBE_HALF + 1e-6;

type Side = 'a' | 'b';

function box( x0: number, x1: number, z0: number, z1: number ): BlockBox {
    return { x0, x1, y0: 0, y1: BLOCK_HEIGHT, z0, z1 };
}

function railOf( s: OpenSpan, side: Side, before: number ): BlockBox | null {
    const edge = side === 'a' ? s.a : s.b;
    if ( side === 'a' ? edge <= -HALF_WIDTH : edge >= HALF_WIDTH ) return null;
    const near = Math.abs( edge - s.line ) <= OPEN_NEAR;
    const keep = s.role === 'gate' || ( ( s.role === 'calm' || s.role === 'preview' ) && near );
    if ( ! keep ) return null;
    const cover = s.role === 'gate' && near ? CALM_TUBE_HALF + Math.abs( before - edge ) : 0;
    const width = Math.max( OPEN_RAIL, cover );
    return side === 'a'
        ? box( Math.max( -HALF_WIDTH, edge - width ), edge, s.z0, s.z1 )
        : box( edge, Math.min( HALF_WIDTH, edge + width ), s.z0, s.z1 );
}

function rails( spans: readonly OpenSpan[], side: Side ): BlockBox[] {
    const out: BlockBox[] = [];
    let before = 0;
    for ( const s of spans ) {
        if ( s.role === 'calm' || s.role === 'preview' ) before = s.line;
        const r = railOf( s, side, before );
        if ( r === null ) continue;
        const prev = out[ out.length - 1 ];
        if ( prev !== undefined && prev.x0 === r.x0 && prev.x1 === r.x1 && prev.z1 === r.z0 ) prev.z1 = r.z1;
        else out.push( r );
    }
    return out;
}

function smashes( spans: readonly OpenSpan[] ): BlockBox[] {
    return spans
        .filter( ( s ) => s.role === 'smash' )
        .map( ( s ) => box( s.line - SMASH_HALF, s.line + SMASH_HALF, s.z0, s.z1 ) );
}

function holes( score: ComposedScore ): Set< number > {
    const out = new Set< number >();
    for ( const n of score.notes ) {
        const i = segIndexForZ( n.z );
        if ( n.kind === 'jump' ) out.add( i );
        if ( n.kind === 'double' ) {
            out.add( i );
            out.add( i + 1 );
        }
    }
    return out;
}

function clip( b: BlockBox, z0: number, z1: number ): BlockBox | null {
    const lo = Math.max( b.z0, z0 );
    const hi = Math.min( b.z1, z1 );
    return hi - lo > 1e-6 ? { ...b, z0: lo, z1: hi } : null;
}

function segmentBlocks(
    groups: readonly [ BlockBox[], Block[ 'kind' ] ][],
    i: number,
    z0: number,
    z1: number,
): Block[] {
    const blocks: Block[] = [];
    for ( const [ boxes, kind ] of groups )
        for ( const b of boxes ) {
            const c = clip( b, z0, z1 );
            if ( c !== null ) blocks.push( { ...c, id: blockId( i, blocks.length ), kind } );
        }
    return blocks;
}

function stageRails( spans: readonly OpenSpan[], rails: readonly [ number, number ][] ): BlockBox[] {
    const out: BlockBox[] = [];
    for ( const [ z0, z1 ] of rails )
        for ( const s of spans ) {
            const lo = Math.max( z0, s.z0 );
            const hi = Math.min( z1, s.z1 );
            if ( hi - lo <= 1e-6 ) continue;
            const a0 = Math.max( -HALF_WIDTH, s.line - CALM_TUBE_HALF - OPEN_RAIL );
            const b1 = Math.min( HALF_WIDTH, s.line + CALM_TUBE_HALF + OPEN_RAIL );
            if ( s.line - CALM_TUBE_HALF > a0 ) out.push( box( a0, s.line - CALM_TUBE_HALF, lo, hi ) );
            if ( b1 > s.line + CALM_TUBE_HALF ) out.push( box( s.line + CALM_TUBE_HALF, b1, lo, hi ) );
        }
    return out;
}

export function stagedSegments( score: ComposedScore, emitted: EmittedScore, stage: LabStage ): Segment[] {
    const open = stage.open.length > 0 ? openSegments( score, emitted.spans ) : [];
    const inOpen = ( s: Segment ) => stage.open.some( ( [ z0, z1 ] ) => s.z0 >= z0 && s.z1 <= z1 );
    const rails = stageRails( emitted.spans, stage.rails );
    return emitted.segments.map( ( seg, i ) => {
        const base = inOpen( seg ) ? ( open[ i ] ?? seg ) : seg;
        if ( base.kind === 'gap' || base.kind === 'finish' ) return base;
        const added: Block[] = [];
        for ( const b of rails ) {
            const c = clip( b, base.z0, base.z1 );
            if ( c !== null )
                added.push( { ...c, id: blockId( i, base.blocks.length + added.length ), kind: 'sealed' } );
        }
        if ( added.length === 0 ) return base;
        return { ...base, kind: base.kind === 'plain' ? 'block' : base.kind, blocks: [ ...base.blocks, ...added ] };
    } );
}

export function openSegments( score: ComposedScore, spans: readonly OpenSpan[] ): Segment[] {
    const groups: [ BlockBox[], Block[ 'kind' ] ][] = [
        [ [ ...rails( spans, 'a' ), ...rails( spans, 'b' ) ], 'sealed' ],
        [ smashes( spans ), 'fractured' ],
    ];
    const gaps = holes( score );
    return Array.from( { length: score.length }, ( _, i ): Segment => {
        const z0 = i * SEG_LEN;
        const z1 = z0 + SEG_LEN;
        const base = { index: i, z0, z1, isFinish: false };
        if ( i < START_SAFE ) return { ...base, kind: 'plain', floors: fullFloor( 0 ), blocks: [] };
        const blocks = segmentBlocks( groups, i, z0, z1 );
        const hole = gaps.has( i );
        return {
            ...base,
            kind: hole ? 'gap' : blocks.length > 0 ? 'block' : 'plain',
            floors: hole ? [] : fullFloor( 0 ),
            blocks,
        };
    } );
}
