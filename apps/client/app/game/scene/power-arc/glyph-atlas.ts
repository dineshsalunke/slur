import { HeldPower } from '@slur/shared';
import * as THREE from 'three';
import { accent, accentVersion } from '../accent';
import { CELL_PAD, CELL_PX, CELLS, VIEWBOX } from './power-arc.constants';

const VOID = '#080b13';
const ACCENT = 'accent';
const GOLD = '#ffd24a';
const SHEEN = 'rgba(230, 241, 255, 0.1)';
const RIM = 2;
const SEAM = 2.4;

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
    return { d, fill: VOID, stroke: ACCENT, width: RIM };
}

function inlay( d: string ): Shape[] {
    return [
        { d, stroke: VOID, width: SEAM },
        { d, fill: ACCENT },
    ];
}

const SQUARE = roundRectPath( 8, 8, 32, 32, 2 );
const DIAMOND = polyPath( '24,2 38,24 24,46 10,24' );
const PORTAL_RING = { d: ellipsePath( 24, 24, 9, 14 ), stroke: ACCENT, width: 3 };

const GLYPHS: Record< number, Shape[] > = {
    [ HeldPower.none ]: [ { d: SQUARE, stroke: ACCENT, width: 2.5 } ],
    [ HeldPower.bolt ]: [
        plate( DIAMOND ),
        { d: polyPath( '24,2 31,24 24,46' ), fill: SHEEN },
        { d: polyPath( '24,12 31,24 24,36 17,24' ), fill: ACCENT },
        { d: polyPath( '24,16 28,24 24,32' ), fill: GOLD },
    ],
    [ HeldPower.seeker ]: [
        plate( roundRectPath( 9, 9, 30, 30, 5 ) ),
        { d: circlePath( 24, 24, 8 ), fill: ACCENT },
        { d: circlePath( 24, 24, 4 ), fill: GOLD },
    ],
    [ HeldPower.mine ]: [
        plate( polyPath( starPoints( 8, 22, 11 ) ) ),
        { d: circlePath( 24, 24, 6.5 ), fill: ACCENT },
        { d: circlePath( 24, 24, 3.2 ), fill: GOLD },
    ],
    [ HeldPower.boost ]: [
        plate( polyPath( '24,3 42,21 42,28 24,10 6,28 6,21' ) ),
        plate( polyPath( '24,19 42,37 42,44 24,26 6,44 6,37' ) ),
        { d: polyPath( '24,5 36,17 36,20 24,8 12,20 12,17' ), fill: GOLD },
        { d: polyPath( '24,21 36,33 36,36 24,24 12,36 12,33' ), fill: ACCENT },
    ],
    [ HeldPower.shield ]: [
        plate( circlePath( 24, 24, 19 ) ),
        { d: circlePath( 24, 24, 13 ), stroke: ACCENT, width: 3 },
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
        ...inlay( polyPath( '17.1,12.4 22.1,7.4 23.7,8.5 18.5,14' ) ),
        ...inlay( polyPath( '26.1,5.4 29.1,15.5 15.1,30.6 24.4,43.9 16,43.9 6.6,31.9' ) ),
        ...inlay( polyPath( '21.3,27.1 27.6,35.9 34.3,35.9 39.2,28.6 41.4,30.3 35.5,40.7 25.1,40.7 17.9,31.3' ) ),
        ...inlay( polyPath( '40.3,14 36.3,18 30.6,18 26.6,14 26.6,8.3 30.6,4.3 36.3,4.3 40.3,8.3' ) ),
        { d: circlePath( 32.4, 11.5, 3.4 ), fill: VOID },
    ],
};

function ink( value: string, accentStyle: string ): string {
    return value === ACCENT ? accentStyle : value;
}

function drawShape( ctx: CanvasRenderingContext2D, s: Shape, accentStyle: string ): void {
    const path = new Path2D( s.d );
    if ( s.fill ) {
        ctx.fillStyle = ink( s.fill, accentStyle );
        ctx.fill( path );
    }
    if ( s.stroke ) {
        ctx.strokeStyle = ink( s.stroke, accentStyle );
        ctx.lineWidth = s.width ?? RIM;
        ctx.stroke( path );
    }
}

function paintGlyphs( texture: THREE.CanvasTexture ): void {
    const canvas = texture.image as HTMLCanvasElement;
    const ctx = canvas.getContext( '2d' );
    if ( ! ctx ) throw new Error( 'glyphAtlas: no 2d context' );
    const scale = ( CELL_PX - 2 * CELL_PAD ) / VIEWBOX;
    const accentStyle = accent().getStyle();
    ctx.clearRect( 0, 0, canvas.width, canvas.height );
    ctx.lineJoin = 'round';
    for ( let cell = 0; cell < CELLS; cell++ ) {
        ctx.save();
        ctx.translate( cell * CELL_PX + CELL_PAD, CELL_PAD );
        ctx.scale( scale, scale );
        for ( const shape of GLYPHS[ cell ] ?? [] ) drawShape( ctx, shape, accentStyle );
        ctx.restore();
    }
    texture.needsUpdate = true;
    texture.userData.painted = accentVersion();
}

export function glyphAtlas(): THREE.CanvasTexture {
    const canvas = document.createElement( 'canvas' );
    canvas.width = CELL_PX * CELLS;
    canvas.height = CELL_PX;
    const texture = new THREE.CanvasTexture( canvas );
    texture.colorSpace = THREE.SRGBColorSpace;
    paintGlyphs( texture );
    return texture;
}

export function repaintGlyphs( texture: THREE.CanvasTexture ): void {
    if ( texture.userData.painted !== accentVersion() ) paintGlyphs( texture );
}
