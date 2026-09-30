export interface GlyphShape {
    d: string;
    fill?: string;
    stroke?: string;
    width?: number;
}

export const VOID = '#080b13';
export const ACCENT = 'accent';
export const GOLD = '#ffd24a';
export const SHEEN = 'rgba(230, 241, 255, 0.1)';
export const RIM = 2;
export const SEAM = 2.4;

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

export function plate( d: string ): GlyphShape {
    return { d, fill: VOID, stroke: ACCENT, width: RIM };
}

export function inlay( d: string ): GlyphShape[] {
    return [
        { d, stroke: VOID, width: SEAM },
        { d, fill: ACCENT },
    ];
}
