import { HeldPower } from '@slur/shared';
import * as THREE from 'three';
import { ACTIVE_FEATURES } from '../../../engine/active-features';
import type { ClientFeature } from '../../../engine/define-client-feature';
import { accent, accentVersion } from '../accent';
import { ACCENT, type GlyphShape, RIM, roundRectPath } from './glyph-shapes';
import { CELL_PAD, CELL_PX, CELLS, VIEWBOX } from './power-arc.constants';

const SQUARE = roundRectPath( 8, 8, 32, 32, 2 );

const GLYPHS: Record< number, readonly GlyphShape[] > = {
    [ HeldPower.none ]: [ { d: SQUARE, stroke: ACCENT, width: 2.5 } ],
};

function claimGlyph( featureId: string, kind: number, glyph: readonly GlyphShape[] ): void {
    if ( GLYPHS[ kind ] ) throw new Error( `feature "${ featureId }": glyph for power ${ kind } is taken` );
    if ( kind >= CELLS ) throw new Error( `feature "${ featureId }": power ${ kind } has no atlas cell` );
    GLYPHS[ kind ] = glyph;
}

function claimUseGlyphs( f: ClientFeature ): void {
    const uses = f.sim?.power?.uses ?? [];
    for ( const [ key, glyph ] of Object.entries( f.hud?.glyphs ?? {} ) ) {
        const kind = Number( key );
        if ( ! uses.some( ( u ) => u === kind ) ) {
            throw new Error( `feature "${ f.id }": power ${ kind } is not in its power uses` );
        }
        if ( glyph ) claimGlyph( f.id, kind, glyph );
    }
}

for ( const f of ACTIVE_FEATURES ) {
    const kind = f.sim?.power?.kind;
    const glyph = f.hud?.glyph;
    if ( kind !== undefined && glyph ) claimGlyph( f.id, kind, glyph );
    claimUseGlyphs( f );
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
