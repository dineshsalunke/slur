import { HeldPower } from '@slur/shared';
import * as THREE from 'three';
import { ACTIVE_FEATURES } from '../../../engine/active-features';
import { accent, accentVersion } from '../accent';
import {
    ACCENT,
    circlePath,
    ellipsePath,
    type GlyphShape,
    GOLD,
    plate,
    polyPath,
    RIM,
    roundRectPath,
    SHEEN,
    starPoints,
} from './glyph-shapes';
import { CELL_PAD, CELL_PX, CELLS, VIEWBOX } from './power-arc.constants';

const SQUARE = roundRectPath( 8, 8, 32, 32, 2 );
const DIAMOND = polyPath( '24,2 38,24 24,46 10,24' );
const PORTAL_RING = { d: ellipsePath( 24, 24, 9, 14 ), stroke: ACCENT, width: 3 };

const CORE_GLYPHS: Record< number, readonly GlyphShape[] > = {
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
};

const GLYPHS: Record< number, readonly GlyphShape[] > = { ...CORE_GLYPHS };
for ( const f of ACTIVE_FEATURES ) {
    const kind = f.sim?.power?.kind;
    const glyph = f.hud?.glyph;
    if ( kind === undefined || ! glyph ) continue;
    if ( GLYPHS[ kind ] ) throw new Error( `feature "${ f.id }": glyph for power ${ kind } is taken` );
    if ( kind >= CELLS ) throw new Error( `feature "${ f.id }": power ${ kind } has no atlas cell` );
    GLYPHS[ kind ] = glyph;
}

function ink( value: string, accentStyle: string ): string {
    return value === ACCENT ? accentStyle : value;
}

function drawShape( ctx: CanvasRenderingContext2D, s: GlyphShape, accentStyle: string ): void {
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
