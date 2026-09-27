import { HeldPower } from '@slur/shared';
import * as THREE from 'three';
import { CELL_PAD, CELL_PX, CELLS, VIEWBOX } from './power-arc.constants';

const VOID = '#080b13';
const MARIGOLD = '#f5b024';
const GOLD = '#ffd24a';
const SHEEN = 'rgba(230, 241, 255, 0.1)';
const RIM = 2;

interface Shape {
    d: string;
    fill?: string;
    stroke?: string;
    width?: number;
}

export function polyPath( points: string ): string {
    return `M${ points }Z`;
}

export function circlePath( cx: number, cy: number, r: number ): string {
    return ellipsePath( cx, cy, r, r );
}

export function ellipsePath( cx: number, cy: number, rx: number, ry: number ): string {
    return `M${ cx - rx } ${ cy } A${ rx } ${ ry } 0 1 0 ${ cx + rx } ${ cy } A${ rx } ${ ry } 0 1 0 ${ cx - rx } ${ cy }Z`;
}

export function roundRectPath( x: number, y: number, w: number, h: number, r: number ): string {
    const arc = `A${ r } ${ r } 0 0 1`;
    return `M${ x + r } ${ y } H${ x + w - r } ${ arc } ${ x + w } ${ y + r } V${ y + h - r } ${ arc } ${
        x + w - r
    } ${ y + h } H${ x + r } ${ arc } ${ x } ${ y + h - r } V${ y + r } ${ arc } ${ x + r } ${ y }Z`;
}

export function starPoints( spikes: number, outer: number, inner: number ): string {
    const pts: string[] = [];
    for ( let i = 0; i < spikes * 2; i++ ) {
        const r = i % 2 === 0 ? outer : inner;
        const a = ( i / ( spikes * 2 ) ) * Math.PI * 2 - Math.PI / 2;
        pts.push( `${ ( 24 + r * Math.cos( a ) ).toFixed( 2 ) },${ ( 24 + r * Math.sin( a ) ).toFixed( 2 ) }` );
    }
    return pts.join( ' ' );
}

function plate( d: string ): Shape {
    return { d, fill: VOID, stroke: MARIGOLD, width: RIM };
}

const SQUARE = roundRectPath( 8, 8, 32, 32, 2 );
const PORTAL_RING = { d: ellipsePath( 24, 24, 9, 14 ), stroke: MARIGOLD, width: 3 };

const GLYPHS: Record< number, Shape[] > = {
    [ HeldPower.none ]: [ { d: SQUARE, stroke: MARIGOLD, width: 2.5 } ],
    [ HeldPower.bolt ]: [
        plate( SQUARE ),
        { d: polyPath( '24,9 39,9 39,39 24,39' ), fill: SHEEN },
        { d: roundRectPath( 16, 16, 16, 16, 1.5 ), fill: MARIGOLD },
        { d: polyPath( '24,19 29,19 29,29 24,29' ), fill: GOLD },
    ],
    [ HeldPower.seeker ]: [
        plate( roundRectPath( 9, 9, 30, 30, 5 ) ),
        { d: circlePath( 24, 24, 8 ), fill: MARIGOLD },
        { d: circlePath( 24, 24, 4 ), fill: GOLD },
    ],
    [ HeldPower.mine ]: [
        plate( polyPath( starPoints( 8, 22, 11 ) ) ),
        { d: circlePath( 24, 24, 6.5 ), fill: MARIGOLD },
        { d: circlePath( 24, 24, 3.2 ), fill: GOLD },
    ],
    [ HeldPower.boost ]: [
        plate( polyPath( '24,3 42,21 42,28 24,10 6,28 6,21' ) ),
        plate( polyPath( '24,19 42,37 42,44 24,26 6,44 6,37' ) ),
        { d: polyPath( '24,5 36,17 36,20 24,8 12,20 12,17' ), fill: GOLD },
        { d: polyPath( '24,21 36,33 36,36 24,24 12,36 12,33' ), fill: MARIGOLD },
    ],
    [ HeldPower.shield ]: [
        plate( circlePath( 24, 24, 19 ) ),
        { d: circlePath( 24, 24, 13 ), stroke: MARIGOLD, width: 3 },
        { d: polyPath( starPoints( 3, 6, 6 ) ), fill: GOLD },
    ],
    [ HeldPower.portal ]: [
        plate( circlePath( 24, 24, 19 ) ),
        PORTAL_RING,
        { d: ellipsePath( 24, 24, 4, 8 ), stroke: GOLD, width: 2 },
    ],
    [ HeldPower.portalB ]: [
        plate( circlePath( 24, 24, 19 ) ),
        PORTAL_RING,
        { d: 'M24 16 A4 8 0 0 1 24 32 Z', fill: GOLD },
    ],
    [ HeldPower.tug ]: [
        plate( roundRectPath( 9, 9, 30, 30, 15 ) ),
        { d: 'M24 12 V28 A6 6 0 0 1 12 28', stroke: MARIGOLD, width: 3 },
        { d: circlePath( 24, 12, 3.2 ), fill: GOLD },
    ],
};

function drawShape( ctx: CanvasRenderingContext2D, s: Shape ): void {
    const path = new Path2D( s.d );
    if ( s.fill ) {
        ctx.fillStyle = s.fill;
        ctx.fill( path );
    }
    if ( s.stroke ) {
        ctx.strokeStyle = s.stroke;
        ctx.lineWidth = s.width ?? RIM;
        ctx.stroke( path );
    }
}

export function glyphAtlas(): THREE.CanvasTexture {
    const canvas = document.createElement( 'canvas' );
    canvas.width = CELL_PX * CELLS;
    canvas.height = CELL_PX;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'glyphAtlas: no 2d context' );
    const scale = ( CELL_PX - 2 * CELL_PAD ) / VIEWBOX;
    ctx.lineJoin = 'round';
    for ( let cell = 0; cell < CELLS; cell++ ) {
        ctx.save();
        ctx.translate( cell * CELL_PX + CELL_PAD, CELL_PAD );
        ctx.scale( scale, scale );
        for ( const shape of GLYPHS[ cell ] ?? [] ) drawShape( ctx, shape );
        ctx.restore();
    }
    const texture = new THREE.CanvasTexture( canvas );
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}
