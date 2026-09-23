import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { rebuildToken, subscribeRebuild } from '../../dev/tuning-rebuild';

export const AUTHOR_PLATE_U = 4;

const COLS = 4;
const ROWS = 1;

export const TEX_SPAN_X = AUTHOR_PLATE_U * COLS;
export const TEX_SPAN_Z = AUTHOR_PLATE_U * ROWS;

const RES = 1024;

export const NORMAL_SIGN_X = 1;
export const NORMAL_SIGN_Y = 1;

export const ROUGHNESS_MAP_BASE = 0.8;

const PLATE_VALUE_JITTER = 0.16;
const MOTTLE_BLOBS = 34;
const MOTTLE_RADIUS_U: readonly [ number, number ] = [ 1.2, 3.2 ];
const MOTTLE_STRETCH = 3.5;
const MOTTLE_AMOUNT = 0.26;
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
const METAL_PATCH_MIN = 0.5;
const METAL_PATCH_MAX = 1;
const CAVITY_BEVEL_LIFT = 0.37;

export interface SurfaceParams {
    plate: number;
    base: string;
    jointWidth: number;
    wallTilt: number;
    bevelShare: number;
    jointMetal: number;
    jointRough: number;
    jointContrast: number;
    cavity: number;
}

interface Ctx extends SurfaceParams {
    pxPerU: number;
    plateW: number;
    plateL: number;
    jointPx: number;
    rgb: readonly [ number, number, number ];
}

function context( p: SurfaceParams ): Ctx {
    const span = p.plate * COLS;
    const pxPerU = RES / span;
    const hex = new THREE.Color( p.base ).getHex( THREE.SRGBColorSpace );
    return {
        ...p,
        pxPerU,
        plateW: RES / COLS,
        plateL: RES / ROWS,
        jointPx: Math.max( 1, p.jointWidth * pxPerU ),
        rgb: [ ( hex >> 16 ) & 0xff, ( hex >> 8 ) & 0xff, hex & 0xff ],
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
    for ( let i = 0; i < COLS; i++ ) longitudinal( i * c.plateW );
    for ( let i = 0; i < ROWS; i++ ) transverse( i * c.plateL );
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
    const r = seeded( 0x5c0ff4 );
    for ( let i = 0; i < MOTTLE_BLOBS; i++ ) {
        const x = r() * RES;
        const y = r() * RES;
        const rx = between( r, MOTTLE_RADIUS_U[ 0 ], MOTTLE_RADIUS_U[ 1 ] ) * c.pxPerU;
        const f = 1 + ( r() - 0.5 ) * 2 * MOTTLE_AMOUNT;
        valueLobe( c, ctx, x, y, rx, rx * MOTTLE_STRETCH, ( r() - 0.5 ) * 2 * MOTTLE_TILT_RAD, f );
    }
}

function paintAlbedo( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    for ( let row = 0; row < ROWS; row++ ) {
        for ( let column = 0; column < COLS; column++ ) {
            ctx.fillStyle = shade( c, plateValue( column, row ) );
            ctx.fillRect( column * c.plateW, row * c.plateL, c.plateW, c.plateL );
        }
    }
    paintMottle( c, ctx );
    ctx.fillStyle = shade( c, 1 - c.jointContrast );
    eachJoint(
        c,
        ( cx ) => wrapRect( ctx, cx - c.jointPx / 2, 0, c.jointPx, RES ),
        ( cy ) => wrapRect( ctx, 0, cy - c.jointPx / 2, RES, c.jointPx ),
    );
}

function normalLobe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    rot: number,
    nx: number,
): void {
    wrapDraw( ( dx, dy ) => {
        ctx.save();
        ctx.translate( x + dx, y + dy );
        ctx.rotate( rot );
        ctx.scale( rx, ry );
        const g = ctx.createRadialGradient( 0, 0, 0, 0, 0, 1 );
        g.addColorStop( 0, normalAlpha( nx, 0, BRUSH_NORMAL_ALPHA ) );
        g.addColorStop( 1, normalAlpha( nx, 0, 0 ) );
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc( 0, 0, 1, 0, Math.PI * 2 );
        ctx.fill();
        ctx.restore();
    } );
}

function paintNormalBrush( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    const r = seeded( 0x5c0ff6 );
    for ( let i = 0; i < BRUSH_STROKES; i++ ) {
        const x = r() * RES;
        const y = r() * RES;
        const rx = between( r, BRUSH_WIDTH_U[ 0 ], BRUSH_WIDTH_U[ 1 ] ) * c.pxPerU;
        const ry = between( r, BRUSH_LENGTH_U[ 0 ], BRUSH_LENGTH_U[ 1 ] ) * c.pxPerU;
        const nx = ( r() < 0.5 ? -1 : 1 ) * between( r, BRUSH_NORMAL_TILT * 0.3, BRUSH_NORMAL_TILT );
        normalLobe( ctx, x, y, rx, ry, ( r() - 0.5 ) * 2 * BRUSH_TILT_RAD, nx );
    }
}

function paintNormal( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    ctx.fillStyle = normal( 0, 0 );
    ctx.fillRect( 0, 0, RES, RES );
    paintNormalBrush( c, ctx );
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
            ctx.fillStyle = normal( 0, c.wallTilt );
            wrapRect( ctx, 0, cy - hw, RES, bevel );
            ctx.fillStyle = normal( 0, 0 );
            wrapRect( ctx, 0, cy - hw + bevel, RES, floorPx );
            ctx.fillStyle = normal( 0, -c.wallTilt );
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
        const delta = rougher
            ? between( r, FINISH_ROUGHER_MIN, FINISH_ROUGHER_MAX )
            : -between( r, FINISH_SMOOTHER_MIN, FINISH_SMOOTHER_MAX );
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

function metalLobe(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    rot: number,
    v: number,
): void {
    wrapDraw( ( dx, dy ) => {
        ctx.save();
        ctx.translate( x + dx, y + dy );
        ctx.rotate( rot );
        ctx.scale( rx, ry );
        const g = ctx.createRadialGradient( 0, 0, 0, 0, 0, 1 );
        g.addColorStop( 0, grey( v, 1 ) );
        g.addColorStop( 0.5, grey( v, 0.6 ) );
        g.addColorStop( 1, grey( v, 0 ) );
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc( 0, 0, 1, 0, Math.PI * 2 );
        ctx.fill();
        ctx.restore();
    } );
}

function paintMetalness( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    ctx.fillStyle = grey( METAL_PLATE, 1 );
    ctx.fillRect( 0, 0, RES, RES );
    const r = seeded( 0x5c0ff7 );
    for ( const p of finishPatchPlan( c ) ) {
        if ( ! p.rougher ) continue;
        const v = between( r, METAL_PATCH_MIN, METAL_PATCH_MAX );
        for ( const l of p.lobes ) metalLobe( ctx, l.x, l.y, l.rx, l.ry, l.rot, v );
    }
    ctx.fillStyle = grey( c.jointMetal, 1 );
    eachJoint(
        c,
        ( cx ) => wrapRect( ctx, cx - c.jointPx / 2, 0, c.jointPx, RES ),
        ( cy ) => wrapRect( ctx, 0, cy - c.jointPx / 2, RES, c.jointPx ),
    );
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
                ( r() - 0.5 ) * 2 * SCUFF_TILT_RAD,
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
    const r = seeded( 0x5c0ff5 );
    for ( let i = 0; i < BRUSH_STROKES; i++ ) {
        const x = r() * RES;
        const y = r() * RES;
        const rx = between( r, BRUSH_WIDTH_U[ 0 ], BRUSH_WIDTH_U[ 1 ] ) * c.pxPerU;
        const ry = between( r, BRUSH_LENGTH_U[ 0 ], BRUSH_LENGTH_U[ 1 ] ) * c.pxPerU;
        const delta = ( r() < 0.5 ? -1 : 1 ) * between( r, BRUSH_ROUGHER_MIN, BRUSH_ROUGHER_MAX );
        softLobe( ctx, x, y, rx, ry, ( r() - 0.5 ) * 2 * BRUSH_TILT_RAD, delta );
    }
}

function paintRoughness( c: Ctx, ctx: CanvasRenderingContext2D ): void {
    ctx.fillStyle = roughGrey( 0, 1 );
    ctx.fillRect( 0, 0, RES, RES );
    paintBrush( c, ctx );
    paintFinishPatches( c, ctx );
    paintScuffClusters( c, ctx );
    paintEdgeRub( c, ctx );
    ctx.fillStyle = grey( c.jointRough, 1 );
    eachJoint(
        c,
        ( cx ) => wrapRect( ctx, cx - c.jointPx / 2, 0, c.jointPx, RES ),
        ( cy ) => wrapRect( ctx, 0, cy - c.jointPx / 2, RES, c.jointPx ),
    );
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

function packedSurfaceCanvas( c: Ctx ): HTMLCanvasElement {
    const rough = canvasFor( c, paintRoughness );
    const metal = canvasFor( c, paintMetalness );
    const cavity = canvasFor( c, paintCavity );
    const canvas = document.createElement( 'canvas' );
    canvas.width = RES;
    canvas.height = RES;
    const ctx = canvas.getContext( '2d' );
    const rctx = rough.getContext( '2d' );
    const mctx = metal.getContext( '2d' );
    const cctx = cavity.getContext( '2d' );
    if ( ! ctx || ! rctx || ! mctx || ! cctx ) throw new Error( 'track-texture: 2D context unavailable' );
    const rd = rctx.getImageData( 0, 0, RES, RES ).data;
    const md = mctx.getImageData( 0, 0, RES, RES ).data;
    const cd = cctx.getImageData( 0, 0, RES, RES ).data;
    const out = ctx.createImageData( RES, RES );
    for ( let i = 0; i < out.data.length; i += 4 ) {
        out.data[ i ] = cd[ i ];
        out.data[ i + 1 ] = rd[ i + 1 ];
        out.data[ i + 2 ] = md[ i + 2 ];
        out.data[ i + 3 ] = 255;
    }
    ctx.putImageData( out, 0, 0 );
    return canvas;
}

export interface TrackSurfaceMaps {
    map: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    roughnessMap: THREE.CanvasTexture;
    metalnessMap: THREE.CanvasTexture;
}

function textureFor( c: Ctx, paint: ( c: Ctx, ctx: CanvasRenderingContext2D ) => void ): THREE.CanvasTexture {
    return new THREE.CanvasTexture( canvasFor( c, paint ) );
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
    const surface = configure( new THREE.CanvasTexture( packedSurfaceCanvas( c ) ), repeat, false );
    return {
        map: configure( textureFor( c, paintAlbedo ), repeat, true ),
        normalMap: configure( textureFor( c, paintNormal ), repeat, false ),
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

function grooveParams(): Omit< SurfaceParams, 'plate' | 'base' > {
    return {
        jointWidth: num( 'Groove.width' ),
        wallTilt: num( 'Groove.wallTilt' ),
        bevelShare: num( 'Groove.bevelShare' ),
        jointMetal: num( 'Groove.metalness' ),
        jointRough: num( 'Groove.roughness' ),
        jointContrast: num( 'Groove.darkening' ),
        cavity: num( 'Groove.cavity' ),
    };
}

export function deckSurfaceParams(): SurfaceParams {
    return { plate: num( 'Deck.plate' ), base: col( 'Metal.baseColor' ), ...grooveParams() };
}

export function railSurfaceParams(): SurfaceParams {
    return { plate: num( 'Rail.plate' ), base: col( 'Metal.baseColor' ), ...grooveParams() };
}
