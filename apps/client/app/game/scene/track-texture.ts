import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { rebuildToken, subscribeRebuild } from '../../dev/tuning-rebuild';

export const AUTHOR_PLATE_U = 4;

export const COLS = 4;
export const ROWS = 1;

export const TEX_SPAN_X = AUTHOR_PLATE_U * COLS;
export const TEX_SPAN_Z = AUTHOR_PLATE_U * ROWS;

const RES = 1024;

export const NORMAL_SIGN_X = 1;
export const NORMAL_SIGN_Y = 1;

export const ROUGHNESS_MAP_BASE = 0.8;

const PLATE_VALUE_JITTER = 0.16;
const MOTTLE_TILT_RAD = 0.1;
const FINISH_PATCHES = 11;
const FINISH_ROUGHER_MIN = 0.08;
const FINISH_ROUGHER_MAX = 0.18;
const FINISH_SMOOTHER_MIN = 0.08;
const FINISH_SMOOTHER_MAX = 0.2;
const FINISH_ROUGHER_SHARE = 0.6;
const FINISH_LOBE_RADIUS_U: readonly [ number, number ] = [ 1, 2.6 ];
const FINISH_LOBE_SPREAD_U = 2.2;
const SCUFF_CLUSTERS = 7;
const SCUFF_ROUGHER_MIN = 0.08;
const SCUFF_ROUGHER_MAX = 0.16;
const SCUFF_SPREAD_U = 1.6;
const SCUFF_TILT_RAD = 0.2;
const RUB_SEGMENT_CHANCE = 0.22;
const RUB_ROUGHER_MIN = 0.04;
const RUB_ROUGHER_MAX = 0.08;
const RUB_WIDTH_U = 0.12;
const BRUSH_STROKES = 220;
const BRUSH_WIDTH_U: readonly [ number, number ] = [ 0.02, 0.08 ];
const BRUSH_LENGTH_U: readonly [ number, number ] = [ 1.5, 6 ];
const BRUSH_ROUGHER_MIN = 0.05;
const BRUSH_ROUGHER_MAX = 0.14;
const BRUSH_TILT_RAD = 0.06;
const BRUSH_NORMAL_TILT = 0.1;
const BRUSH_NORMAL_ALPHA = 0.45;
const METAL_PLATE = 1;
const CAVITY_BEVEL_LIFT = 0.37;
const SCRATCH_LENGTH_U: readonly [ number, number ] = [ 0.15, 2.5 ];
const SCRATCH_WIDTH_U: readonly [ number, number ] = [ 0.012, 0.03 ];
const SCRATCH_STRENGTH_MIN = 0.35;
const SCRATCH_NORMAL_ALPHA = 0.6;
export const BLOTCH_CELLS_U = 0.3;
export const BLOTCH_OCTAVES = 5;
const BLOTCH_SEED = 0x5c0ffa;
export const BLOTCH_DARK_BAND: readonly [ number, number ] = [ 0.56, 0.68 ];
export const BLOTCH_BRIGHT_BAND: readonly [ number, number ] = [ 0.7, 0.8 ];

interface Grain {
    brushRot: number;
    brushScale: number;
    mottleBlobs: number;
    mottleRadiusU: readonly [ number, number ];
    mottleStretch: number;
    mottleAmount: number;
    finishScale: number;
}

const DECK_GRAIN: Grain = {
    brushRot: 0,
    brushScale: 1,
    mottleBlobs: 34,
    mottleRadiusU: [ 1.2, 3.2 ],
    mottleStretch: 3.5,
    mottleAmount: 0.26,
    finishScale: 1,
};

const GRAPHITE_GRAIN: Grain = {
    brushRot: Math.PI / 2,
    brushScale: 0,
    mottleBlobs: 90,
    mottleRadiusU: [ 0.6, 1.6 ],
    mottleStretch: 1,
    mottleAmount: 0.08,
    finishScale: 0.5,
};

export interface SurfaceParams {
    plate: number;
    base: string;
    joints: boolean;
    jointWidth: number;
    wallTilt: number;
    bevelShare: number;
    jointMetal: number;
    jointRough: number;
    jointContrast: number;
    cavity: number;
    scratchDensity: number;
    scratchLift: number;
    scratchTilt: number;
    blotchDark: number;
    blotchBright: number;
    bakedBlotches: boolean;
    wearValueSpan: number;
    wearRoughSpan: number;
    wearMetalMin: number;
    wearMetalMax: number;
}

export interface Scratch {
    x: number;
    y: number;
    angle: number;
    length: number;
    width: number;
    strength: number;
}

interface Ctx extends SurfaceParams {
    pxPerU: number;
    pxPerV: number;
    plateW: number;
    plateL: number;
    jointPx: number;
    rgb: readonly [ number, number, number ];
    grain: Grain;
    scratches: Scratch[];
    blotches: Float32Array;
}

export function texelDensity( p: SurfaceParams ): { pxPerU: number; pxPerV: number } {
    return { pxPerU: RES / ( p.plate * COLS ), pxPerV: RES / ( p.plate * ( p.joints ? ROWS : COLS ) ) };
}

export function tileSpanU( p: SurfaceParams ): { x: number; y: number } {
    const { pxPerU, pxPerV } = texelDensity( p );
    return { x: RES / pxPerU, y: RES / pxPerV };
}

export function scratchPlan( p: SurfaceParams ): Scratch[] {
    const span = tileSpanU( p );
    const count = Math.round( span.x * span.y * Math.max( 0, p.scratchDensity ) );
    const r = seeded( 0x5c0ff9 );
    const logSpan = Math.log( SCRATCH_LENGTH_U[ 1 ] / SCRATCH_LENGTH_U[ 0 ] );
    const scratches: Scratch[] = [];
    for ( let i = 0; i < count; i++ ) {
        scratches.push( {
            x: r() * span.x,
            y: r() * span.y,
            angle: r() * Math.PI,
            length: SCRATCH_LENGTH_U[ 0 ] * Math.exp( r() * logSpan ),
            width: between( r, SCRATCH_WIDTH_U[ 0 ], SCRATCH_WIDTH_U[ 1 ] ),
            strength: between( r, SCRATCH_STRENGTH_MIN, 1 ),
        } );
    }
    return scratches;
}

function baseRgb( base: string ): readonly [ number, number, number ] {
    const hex = new THREE.Color( base ).getHex( THREE.SRGBColorSpace );
    return [ ( hex >> 16 ) & 0xff, ( hex >> 8 ) & 0xff, hex & 0xff ];
}

function context( p: SurfaceParams ): Ctx {
    const { pxPerU, pxPerV } = texelDensity( p );
    return {
        ...p,
        pxPerU,
        pxPerV,
        grain: p.joints ? DECK_GRAIN : GRAPHITE_GRAIN,
        scratches: scratchPlan( p ),
        blotches: p.bakedBlotches ? blotchField( p ) : new Float32Array( 0 ),
        plateW: RES / COLS,
        plateL: RES / ROWS,
        jointPx: Math.max( 1, p.jointWidth * pxPerU ),
        rgb: baseRgb( p.base ),
    };
}

function shade( c: Ctx, f: number ): string {
    const v = c.rgb.map( ( n ) => Math.max( 0, Math.min( 255, Math.round( n * f ) ) ) );
    return `rgb(${ v[ 0 ] },${ v[ 1 ] },${ v[ 2 ] })`;
}

function shadeAlpha( c: Ctx, f: number, alpha: number ): string {
    const v = c.rgb.map( ( n ) => Math.max( 0, Math.min( 255, Math.round( n * f ) ) ) );
    return `rgba(${ v[ 0 ] },${ v[ 1 ] },${ v[ 2 ] },${ alpha })`;
}

function normal( nx: number, ny: number ): string {
    const nz = Math.sqrt( Math.max( 0, 1 - nx * nx - ny * ny ) );
    const c = ( v: number ) => Math.round( ( v * 0.5 + 0.5 ) * 255 );
    return `rgb(${ c( nx ) },${ c( ny ) },${ c( nz ) })`;
}

function normalAlpha( nx: number, ny: number, alpha: number ): string {
    const nz = Math.sqrt( Math.max( 0, 1 - nx * nx - ny * ny ) );
    const c = ( v: number ) => Math.round( ( v * 0.5 + 0.5 ) * 255 );
    return `rgba(${ c( nx ) },${ c( ny ) },${ c( nz ) },${ alpha })`;
}

function plateValue( col2: number, row: number ): number {
    let h = ( Math.imul( col2, 73856093 ) ^ Math.imul( row, 19349663 ) ) >>> 0;
    h = Math.imul( h ^ ( h >>> 15 ), 0x2c1b3c6d ) >>> 0;
    h = Math.imul( h ^ ( h >>> 12 ), 0x297a2d39 ) >>> 0;
    return 1 + ( ( h >>> 8 ) / 0xffffff - 0.5 ) * 2 * PLATE_VALUE_JITTER;
}

function seeded( seed: number ): () => number {
    let s = seed >>> 0;
    return () => {
        s = ( Math.imul( s ^ ( s >>> 15 ), 0x2c1b3c6d ) + 0x6d2b79f5 ) >>> 0;
        s = Math.imul( s ^ ( s >>> 12 ), 0x297a2d39 ) >>> 0;
        return ( s >>> 8 ) / 0xffffff;
    };
}

function between( r: () => number, lo: number, hi: number ): number {
    return lo + r() * ( hi - lo );
}

function wrapRect( ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number ): void {
    for ( const dx of [ -RES, 0, RES ] ) {
        for ( const dy of [ -RES, 0, RES ] ) ctx.fillRect( x + dx, y + dy, w, h );
    }
}

function wrapDraw( draw: ( dx: number, dy: number ) => void ): void {
    for ( const dx of [ -RES, 0, RES ] ) {
        for ( const dy of [ -RES, 0, RES ] ) draw( dx, dy );
    }
}

function eachJoint(
    c: Ctx,
    longitudinal: ( centrePx: number ) => void,
    transverse: ( centrePx: number ) => void,
): void {
    if ( ! c.joints ) return;
    for ( let i = 0; i < COLS; i++ ) longitudinal( i * c.plateW );
    for ( let i = 0; i < ROWS; i++ ) transverse( i * c.plateL );
}

function fillJoints( c: Ctx, ctx: CanvasRenderingContext2D, style: string ): void {
    ctx.fillStyle = style;
    eachJoint(
        c,
        ( cx ) => wrapRect( ctx, cx - c.jointPx / 2, 0, c.jointPx, RES ),
        ( cy ) => wrapRect( ctx, 0, cy - c.jointPx / 2, RES, c.jointPx ),
    );
}

function valueLobe(
    c: Ctx,
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    rot: number,
    f: number,
): void {
    wrapDraw( ( dx, dy ) => {
        ctx.save();
        ctx.translate( x + dx, y + dy );
        ctx.rotate( rot );
        ctx.scale( rx, ry );
        const g = ctx.createRadialGradient( 0, 0, 0, 0, 0, 1 );
        g.addColorStop( 0, shadeAlpha( c, f, 0.85 ) );
        g.addColorStop( 0.55, shadeAlpha( c, f, 0.45 ) );
        g.addColorStop( 1, shadeAlpha( c, f, 0 ) );
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc( 0, 0, 1, 0, Math.PI * 2 );
        ctx.fill();
        ctx.restore();
    } );
}

function paintMottle( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    const g = c.grain;
    const r = seeded( 0x5c0ff4 );
    for ( let i = 0; i < g.mottleBlobs; i++ ) {
        const x = r() * RES;
        const y = r() * RES;
        const rx = between( r, g.mottleRadiusU[ 0 ], g.mottleRadiusU[ 1 ] ) * c.pxPerU;
        const f = 1 + ( r() - 0.5 ) * 2 * g.mottleAmount;
        valueLobe( c, ctx, x, y, rx, rx * g.mottleStretch, ( r() - 0.5 ) * 2 * MOTTLE_TILT_RAD, f );
    }
}

function lattice( ix: number, iy: number, seed: number ): number {
    let h = ( Math.imul( ix, 73856093 ) ^ Math.imul( iy, 19349663 ) ^ Math.imul( seed, 83492791 ) ) >>> 0;
    h = Math.imul( h ^ ( h >>> 15 ), 0x2c1b3c6d ) >>> 0;
    h = Math.imul( h ^ ( h >>> 12 ), 0x297a2d39 ) >>> 0;
    return ( h >>> 8 ) / 0xffffff;
}

function smooth( t: number ): number {
    return t * t * ( 3 - 2 * t );
}

function band( lo: number, hi: number, v: number ): number {
    return smooth( Math.max( 0, Math.min( 1, ( v - lo ) / ( hi - lo ) ) ) );
}

function tileNoise( fx: number, fy: number, cx: number, cy: number, seed: number ): number {
    const x = fx * cx;
    const y = fy * cy;
    const x0 = Math.floor( x );
    const y0 = Math.floor( y );
    const tx = smooth( x - x0 );
    const ty = smooth( y - y0 );
    const ax = x0 % cx;
    const ay = y0 % cy;
    const bx = ( x0 + 1 ) % cx;
    const by = ( y0 + 1 ) % cy;
    const top = lattice( ax, ay, seed ) + ( lattice( bx, ay, seed ) - lattice( ax, ay, seed ) ) * tx;
    const bottom = lattice( ax, by, seed ) + ( lattice( bx, by, seed ) - lattice( ax, by, seed ) ) * tx;
    return top + ( bottom - top ) * ty;
}

export function blotchField( p: SurfaceParams ): Float32Array {
    const span = tileSpanU( p );
    const field = new Float32Array( RES * RES );
    const cx = Math.max( 1, Math.round( span.x * BLOTCH_CELLS_U ) );
    const cy = Math.max( 1, Math.round( span.y * BLOTCH_CELLS_U ) );
    for ( let py = 0; py < RES; py++ ) {
        const fy = ( py + 0.5 ) / RES;
        for ( let px = 0; px < RES; px++ ) {
            const fx = ( px + 0.5 ) / RES;
            let n = 0;
            let amp = 0.5;
            let norm = 0;
            for ( let o = 0; o < BLOTCH_OCTAVES; o++ ) {
                const k = 1 << o;
                n += amp * tileNoise( fx, fy, cx * k, cy * k, BLOTCH_SEED + o );
                norm += amp;
                amp *= 0.5;
            }
            n /= norm;
            field[ py * RES + px ] =
                band( BLOTCH_DARK_BAND[ 0 ], BLOTCH_DARK_BAND[ 1 ], n ) -
                band( BLOTCH_BRIGHT_BAND[ 0 ], BLOTCH_BRIGHT_BAND[ 1 ], 1 - n );
        }
    }
    return field;
}

function paintBlotches( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    if ( c.blotchDark <= 0 && c.blotchBright <= 0 ) return;
    const img = ctx.getImageData( 0, 0, RES, RES );
    const d = img.data;
    for ( let t = 0; t < c.blotches.length; t++ ) {
        const b = c.blotches[ t ];
        if ( b === 0 ) continue;
        const f = b > 0 ? 1 - c.blotchDark * b : 1 - c.blotchBright * b;
        const i = t * 4;
        d[ i ] = Math.round( d[ i ] * f );
        d[ i + 1 ] = Math.round( d[ i + 1 ] * f );
        d[ i + 2 ] = Math.round( d[ i + 2 ] * f );
    }
    ctx.putImageData( img, 0, 0 );
}

function strokeScratches(
    c: Ctx,
    ctx: CanvasRenderingContext2D,
    op: GlobalCompositeOperation,
    style: ( s: Scratch ) => string,
    offset = 0,
    widthShare = 1,
): void {
    ctx.save();
    ctx.globalCompositeOperation = op;
    ctx.lineCap = 'round';
    for ( const s of c.scratches ) {
        const ux = Math.cos( s.angle ) * s.length * 0.5;
        const uy = Math.sin( s.angle ) * s.length * 0.5;
        const ox = -Math.sin( s.angle ) * s.width * offset;
        const oy = Math.cos( s.angle ) * s.width * offset;
        ctx.strokeStyle = style( s );
        wrapDraw( ( dx, dy ) => {
            ctx.setTransform( c.pxPerU, 0, 0, c.pxPerV, dx, dy );
            ctx.lineWidth = s.width * widthShare;
            ctx.beginPath();
            ctx.moveTo( s.x + ox - ux, s.y + oy - uy );
            ctx.lineTo( s.x + ox + ux, s.y + oy + uy );
            ctx.stroke();
        } );
    }
    ctx.restore();
}

function paintScratchLift( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    if ( c.scratchLift <= 0 ) return;
    strokeScratches( c, ctx, 'lighter', ( s ) => shadeAlpha( c, c.scratchLift, s.strength ) );
}

function paintAlbedo( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    for ( let row = 0; row < ROWS; row++ ) {
        for ( let column = 0; column < COLS; column++ ) {
            ctx.fillStyle = shade( c, c.joints ? plateValue( column, row ) : 1 );
            ctx.fillRect( column * c.plateW, row * c.plateL, c.plateW, c.plateL );
        }
    }
    paintMottle( c, ctx );
    paintBlotches( c, ctx );
    paintScratchLift( c, ctx );
    fillJoints( c, ctx, shade( c, 1 - c.jointContrast ) );
}

function normalLobe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    rot: number,
    nx: number,
    ny: number,
): void {
    wrapDraw( ( dx, dy ) => {
        ctx.save();
        ctx.translate( x + dx, y + dy );
        ctx.rotate( rot );
        ctx.scale( rx, ry );
        const g = ctx.createRadialGradient( 0, 0, 0, 0, 0, 1 );
        g.addColorStop( 0, normalAlpha( nx, ny, BRUSH_NORMAL_ALPHA ) );
        g.addColorStop( 1, normalAlpha( nx, ny, 0 ) );
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc( 0, 0, 1, 0, Math.PI * 2 );
        ctx.fill();
        ctx.restore();
    } );
}

function paintNormalBrush( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    const g = c.grain;
    if ( g.brushScale <= 0 ) return;
    const across: readonly [ number, number ] = [ Math.cos( g.brushRot ), Math.sin( g.brushRot ) ];
    const r = seeded( 0x5c0ff6 );
    for ( let i = 0; i < BRUSH_STROKES; i++ ) {
        const x = r() * RES;
        const y = r() * RES;
        const rx = between( r, BRUSH_WIDTH_U[ 0 ], BRUSH_WIDTH_U[ 1 ] ) * c.pxPerU;
        const ry = between( r, BRUSH_LENGTH_U[ 0 ], BRUSH_LENGTH_U[ 1 ] ) * c.pxPerU;
        const tilt = ( r() < 0.5 ? -1 : 1 ) * between( r, BRUSH_NORMAL_TILT * 0.3, BRUSH_NORMAL_TILT ) * g.brushScale;
        const rot = g.brushRot + ( r() - 0.5 ) * 2 * BRUSH_TILT_RAD;
        normalLobe( ctx, x, y, rx, ry, rot, tilt * across[ 0 ], tilt * across[ 1 ] );
    }
}

function paintScratchNormals( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    if ( c.scratchTilt <= 0 ) return;
    const t = c.scratchTilt;
    for ( const side of [ 1, -1 ] ) {
        strokeScratches(
            c,
            ctx,
            'source-over',
            ( s ) =>
                normalAlpha(
                    side * Math.sin( s.angle ) * t,
                    side * Math.cos( s.angle ) * t,
                    SCRATCH_NORMAL_ALPHA * s.strength,
                ),
            side * 0.25,
            0.5,
        );
    }
}

function paintNormal( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    ctx.fillStyle = normal( 0, 0 );
    ctx.fillRect( 0, 0, RES, RES );
    paintNormalBrush( c, ctx );
    paintScratchNormals( c, ctx );
    paintJointNormals( c, ctx );
}

function paintJointNormals( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    if ( c.wallTilt <= 0 ) return;

    const hw = c.jointPx / 2;
    const bevel = c.jointPx * c.bevelShare;
    const floorPx = c.jointPx - 2 * bevel;
    eachJoint(
        c,
        ( cx ) => {
            ctx.fillStyle = normal( c.wallTilt, 0 );
            wrapRect( ctx, cx - hw, 0, bevel, RES );
            ctx.fillStyle = normal( 0, 0 );
            wrapRect( ctx, cx - hw + bevel, 0, floorPx, RES );
            ctx.fillStyle = normal( -c.wallTilt, 0 );
            wrapRect( ctx, cx + hw - bevel, 0, bevel, RES );
        },
        ( cy ) => {
            ctx.fillStyle = normal( 0, -c.wallTilt );
            wrapRect( ctx, 0, cy - hw, RES, bevel );
            ctx.fillStyle = normal( 0, 0 );
            wrapRect( ctx, 0, cy - hw + bevel, RES, floorPx );
            ctx.fillStyle = normal( 0, c.wallTilt );
            wrapRect( ctx, 0, cy + hw - bevel, RES, bevel );
        },
    );
}

function grey( v: number, alpha: number ): string {
    const g = Math.round( Math.max( 0, Math.min( 1, v ) ) * 255 );
    return `rgba(${ g },${ g },${ g },${ alpha })`;
}

function roughGrey( delta: number, alpha: number ): string {
    return grey( ROUGHNESS_MAP_BASE + delta, alpha );
}

function softLobe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    rot: number,
    delta: number,
): void {
    wrapDraw( ( dx, dy ) => {
        ctx.save();
        ctx.translate( x + dx, y + dy );
        ctx.rotate( rot );
        ctx.scale( rx, ry );
        const g = ctx.createRadialGradient( 0, 0, 0, 0, 0, 1 );
        g.addColorStop( 0, roughGrey( delta, 1 ) );
        g.addColorStop( 0.5, roughGrey( delta, 0.6 ) );
        g.addColorStop( 1, roughGrey( delta, 0 ) );
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc( 0, 0, 1, 0, Math.PI * 2 );
        ctx.fill();
        ctx.restore();
    } );
}

interface FinishLobe {
    x: number;
    y: number;
    rx: number;
    ry: number;
    rot: number;
}

interface FinishPatch {
    rougher: boolean;
    delta: number;
    lobes: FinishLobe[];
}

function finishPatchPlan( c: Ctx ): FinishPatch[] {
    const r = seeded( 0x5c0ff1 );
    const plan: FinishPatch[] = [];
    for ( let i = 0; i < FINISH_PATCHES; i++ ) {
        const cx = r() * RES;
        const cy = r() * RES;
        const rougher = r() < FINISH_ROUGHER_SHARE;
        const delta =
            ( rougher
                ? between( r, FINISH_ROUGHER_MIN, FINISH_ROUGHER_MAX )
                : -between( r, FINISH_SMOOTHER_MIN, FINISH_SMOOTHER_MAX ) ) * c.grain.finishScale;
        const count = 3 + Math.floor( r() * 3 );
        const lobes: FinishLobe[] = [];
        for ( let l = 0; l < count; l++ ) {
            lobes.push( {
                x: cx + ( r() - 0.5 ) * FINISH_LOBE_SPREAD_U * c.pxPerU,
                y: cy + ( r() - 0.5 ) * FINISH_LOBE_SPREAD_U * c.pxPerU,
                rx: between( r, FINISH_LOBE_RADIUS_U[ 0 ], FINISH_LOBE_RADIUS_U[ 1 ] ) * c.pxPerU,
                ry: between( r, FINISH_LOBE_RADIUS_U[ 0 ], FINISH_LOBE_RADIUS_U[ 1 ] ) * c.pxPerU,
                rot: r() * Math.PI,
            } );
        }
        plan.push( { rougher, delta, lobes } );
    }
    return plan;
}

function paintFinishPatches( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    for ( const p of finishPatchPlan( c ) ) {
        for ( const l of p.lobes ) softLobe( ctx, l.x, l.y, l.rx, l.ry, l.rot, p.delta );
    }
}

function paintMetalness( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    ctx.fillStyle = grey( METAL_PLATE, 1 );
    ctx.fillRect( 0, 0, RES, RES );
    fillJoints( c, ctx, grey( c.jointMetal, 1 ) );
}

function paintJointMask( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    ctx.fillStyle = grey( 0, 1 );
    ctx.fillRect( 0, 0, RES, RES );
    fillJoints( c, ctx, grey( 1, 1 ) );
}

function paintScuffClusters( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    const r = seeded( 0x5c0ff2 );
    for ( let i = 0; i < SCUFF_CLUSTERS; i++ ) {
        const cx = r() * RES;
        const cy = r() * RES;
        const strokes = 3 + Math.floor( r() * 4 );
        for ( let s = 0; s < strokes; s++ ) {
            softLobe(
                ctx,
                cx + ( r() - 0.5 ) * SCUFF_SPREAD_U * c.pxPerU,
                cy + ( r() - 0.5 ) * SCUFF_SPREAD_U * 2 * c.pxPerU,
                between( r, 0.08, 0.2 ) * c.pxPerU,
                between( r, 0.8, 2.2 ) * c.pxPerU,
                c.grain.brushRot + ( r() - 0.5 ) * 2 * SCUFF_TILT_RAD,
                between( r, SCUFF_ROUGHER_MIN, SCUFF_ROUGHER_MAX ),
            );
        }
    }
}

function paintEdgeRub( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    const r = seeded( 0x5c0ff3 );
    const hw = c.jointPx / 2;
    eachJoint(
        c,
        ( cx ) => {
            for ( let row = 0; row < ROWS; row++ ) {
                if ( r() >= RUB_SEGMENT_CHANCE ) continue;
                const side = r() < 0.5 ? -1 : 1;
                softLobe(
                    ctx,
                    cx + side * ( hw + RUB_WIDTH_U * c.pxPerU * 0.5 ),
                    ( row + between( r, 0.25, 0.75 ) ) * c.plateL,
                    RUB_WIDTH_U * c.pxPerU,
                    between( r, 0.8, 1.8 ) * c.pxPerU,
                    0,
                    between( r, RUB_ROUGHER_MIN, RUB_ROUGHER_MAX ),
                );
            }
        },
        ( cy ) => {
            for ( let column = 0; column < COLS; column++ ) {
                if ( r() >= RUB_SEGMENT_CHANCE ) continue;
                const side = r() < 0.5 ? -1 : 1;
                softLobe(
                    ctx,
                    ( column + between( r, 0.25, 0.75 ) ) * c.plateW,
                    cy + side * ( hw + RUB_WIDTH_U * c.pxPerU * 0.5 ),
                    between( r, 0.6, 1.4 ) * c.pxPerU,
                    RUB_WIDTH_U * c.pxPerU,
                    0,
                    between( r, RUB_ROUGHER_MIN, RUB_ROUGHER_MAX ),
                );
            }
        },
    );
}

function paintBrush( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    if ( c.grain.brushScale <= 0 ) return;
    const r = seeded( 0x5c0ff5 );
    for ( let i = 0; i < BRUSH_STROKES; i++ ) {
        const x = r() * RES;
        const y = r() * RES;
        const rx = between( r, BRUSH_WIDTH_U[ 0 ], BRUSH_WIDTH_U[ 1 ] ) * c.pxPerU;
        const ry = between( r, BRUSH_LENGTH_U[ 0 ], BRUSH_LENGTH_U[ 1 ] ) * c.pxPerU;
        const delta = ( r() < 0.5 ? -1 : 1 ) * between( r, BRUSH_ROUGHER_MIN, BRUSH_ROUGHER_MAX ) * c.grain.brushScale;
        softLobe( ctx, x, y, rx, ry, c.grain.brushRot + ( r() - 0.5 ) * 2 * BRUSH_TILT_RAD, delta );
    }
}

function paintRoughness( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    ctx.fillStyle = roughGrey( 0, 1 );
    ctx.fillRect( 0, 0, RES, RES );
    paintBrush( c, ctx );
    paintFinishPatches( c, ctx );
    paintScuffClusters( c, ctx );
    paintEdgeRub( c, ctx );
    fillJoints( c, ctx, grey( c.jointRough, 1 ) );
}

function paintCavity( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    const hw = c.jointPx / 2;
    const bevel = c.jointPx * c.bevelShare;
    const floorPx = c.jointPx - 2 * bevel;
    const lip = Math.min( 1, c.cavity + CAVITY_BEVEL_LIFT );
    ctx.fillStyle = grey( 1, 1 );
    ctx.fillRect( 0, 0, RES, RES );
    eachJoint(
        c,
        ( cx ) => {
            ctx.fillStyle = grey( lip, 1 );
            wrapRect( ctx, cx - hw, 0, c.jointPx, RES );
            ctx.fillStyle = grey( c.cavity, 1 );
            wrapRect( ctx, cx - hw + bevel, 0, floorPx, RES );
        },
        ( cy ) => {
            ctx.fillStyle = grey( lip, 1 );
            wrapRect( ctx, 0, cy - hw, RES, c.jointPx );
            ctx.fillStyle = grey( c.cavity, 1 );
            wrapRect( ctx, 0, cy - hw + bevel, RES, floorPx );
        },
    );
}

function canvasFor( c: Ctx, paint: ( c: Ctx, ctx: CanvasRenderingContext2D ) => void ): HTMLCanvasElement {
    const canvas = document.createElement( 'canvas' );
    canvas.width = RES;
    canvas.height = RES;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'track-texture: 2D context unavailable' );
    paint( c, ctx );
    return canvas;
}

export function applyWear(
    p: SurfaceParams,
    albedo: Uint8ClampedArray,
    joints: Uint8ClampedArray,
    packed: Uint8ClampedArray,
): void {
    const rgb = baseRgb( p.base );
    const base = Math.max( 1, rgb[ 0 ] + rgb[ 1 ] + rgb[ 2 ] );
    const span = Math.max( 1e-3, p.wearValueSpan );
    for ( let i = 0; i < packed.length; i += 4 ) {
        const open = 1 - joints[ i ] / 255;
        if ( open <= 0 ) continue;
        const v = ( albedo[ i ] + albedo[ i + 1 ] + albedo[ i + 2 ] ) / base;
        const w = Math.max( -1, Math.min( 1, ( v - 1 ) / span ) );
        const metal = ( p.wearMetalMin + ( ( p.wearMetalMax - p.wearMetalMin ) * ( w + 1 ) ) / 2 ) * 255;
        packed[ i + 1 ] = Math.round( packed[ i + 1 ] - w * p.wearRoughSpan * 255 * open );
        packed[ i + 2 ] = Math.round( packed[ i + 2 ] + ( metal - packed[ i + 2 ] ) * open );
    }
}

function pixels( canvas: HTMLCanvasElement ): Uint8ClampedArray {
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'track-texture: 2D context unavailable' );
    return ctx.getImageData( 0, 0, RES, RES ).data;
}

function packedSurfaceCanvas( c: Ctx, albedo: HTMLCanvasElement ): HTMLCanvasElement {
    const rd = pixels( canvasFor( c, paintRoughness ) );
    const md = pixels( canvasFor( c, paintMetalness ) );
    const cd = pixels( canvasFor( c, paintCavity ) );
    const canvas = document.createElement( 'canvas' );
    canvas.width = RES;
    canvas.height = RES;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'track-texture: 2D context unavailable' );
    const out = ctx.createImageData( RES, RES );
    for ( let i = 0; i < out.data.length; i += 4 ) {
        out.data[ i ] = cd[ i ];
        out.data[ i + 1 ] = rd[ i + 1 ];
        out.data[ i + 2 ] = md[ i + 2 ];
        out.data[ i + 3 ] = 255;
    }
    applyWear( c, pixels( albedo ), pixels( canvasFor( c, paintJointMask ) ), out.data );
    ctx.putImageData( out, 0, 0 );
    return canvas;
}

export interface TrackSurfaceMaps {
    map: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
    metalnessMap: THREE.CanvasTexture;
}

function configure( tex: THREE.CanvasTexture, repeat: number, srgb: boolean ): THREE.CanvasTexture {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    tex.repeat.set( repeat, repeat );
    if ( srgb ) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
}

function build( p: SurfaceParams ): TrackSurfaceMaps {
    const c = context( p );
    const repeat = TEX_SPAN_X / ( p.plate * COLS );
    const albedo = canvasFor( c, paintAlbedo );
    const surface = configure( new THREE.CanvasTexture( packedSurfaceCanvas( c, albedo ) ), repeat, false );
    return {
        map: configure( new THREE.CanvasTexture( albedo ), repeat, true ),
        normalMap: configure( new THREE.CanvasTexture( canvasFor( c, paintNormal ) ), repeat, false ),
        roughnessMap: surface,
        metalnessMap: surface,
    };
}

const cache = new Map< string, TrackSurfaceMaps >();

let token = rebuildToken();

subscribeRebuild( () => {
    if ( rebuildToken() === token ) return;
    token = rebuildToken();
    for ( const maps of cache.values() ) {
        maps.map.dispose();
        maps.normalMap.dispose();
        maps.roughnessMap.dispose();
    }
    cache.clear();
} );

export function surfaceMaps( p: SurfaceParams ): TrackSurfaceMaps {
    const key = JSON.stringify( p );
    const hit = cache.get( key );
    if ( hit ) return hit;
    const maps = build( p );
    cache.set( key, maps );
    return maps;
}

export function deckSurfaceParams(): SurfaceParams {
    return {
        plate: num( 'Deck.plate' ),
        base: col( 'Metal.baseColor' ),
        joints: true,
        jointWidth: num( 'Groove.width' ),
        wallTilt: num( 'Groove.wallTilt' ),
        bevelShare: num( 'Groove.bevelShare' ),
        jointMetal: num( 'Groove.metalness' ),
        jointRough: num( 'Groove.roughness' ),
        jointContrast: num( 'Groove.darkening' ),
        cavity: num( 'Groove.cavity' ),
        scratchDensity: num( 'Scratch.density' ),
        scratchLift: num( 'Scratch.lift' ),
        scratchTilt: num( 'Scratch.tilt' ),
        blotchDark: num( 'Blotch.dark' ),
        blotchBright: num( 'Blotch.bright' ),
        bakedBlotches: false,
        wearValueSpan: num( 'Wear.valueSpan' ),
        wearRoughSpan: num( 'Wear.roughSpan' ),
        wearMetalMin: num( 'Wear.metalMin' ),
        wearMetalMax: num( 'Wear.metalMax' ),
    };
}

export function graphiteSurfaceParams(): SurfaceParams {
    return { ...deckSurfaceParams(), joints: false, bakedBlotches: true };
}

export function wallSurfaceParams(): SurfaceParams {
    return { ...deckSurfaceParams(), joints: false };
}
