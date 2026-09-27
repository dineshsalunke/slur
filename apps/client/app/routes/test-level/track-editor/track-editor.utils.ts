import {
    type AuthoredBlock,
    type AuthoredLevel,
    type AuthoredRect,
    authoredTrack,
    BLOCK_ID_STRIDE,
    clamp,
    HALF_WIDTH,
    SEG_LEN,
    START_SAFE,
    startPointFor,
    tuningForShip,
    widestShip,
} from '@slur/shared';
import {
    LABEL_EVERY_SEGMENTS,
    MAP_COLORS,
    MAP_MARGIN_LEFT,
    MAP_MARGIN_RIGHT,
    MAP_MAX_SCALE,
    MIN_GRID_PX,
    START_MARKER_MIN_PX,
    START_SNAP_EPS,
    TOOL_PREVIEW,
    ZOOM_MAX,
    ZOOM_MIN,
} from './track-editor.constants';
import type { EditorCamera, EditorPoint, EditorState, EditorTool } from './track-editor.state';

export interface EditorView {
    width: number;
    height: number;
    scale: number;
    left: number;
    scrollZ: number;
}

function mapRoom( width: number ): number {
    return Math.max( 1, width - MAP_MARGIN_LEFT - MAP_MARGIN_RIGHT );
}

function scaleOf( width: number, zoom: number ): number {
    return Math.min( MAP_MAX_SCALE, mapRoom( width ) / ( 2 * HALF_WIDTH ) ) * zoom;
}

export function maxScrollX( width: number, zoom: number ): number {
    return Math.max( 0, 2 * HALF_WIDTH - mapRoom( width ) / scaleOf( width, zoom ) );
}

export function viewOf( width: number, height: number, camera: EditorCamera ): EditorView {
    const scale = scaleOf( width, camera.zoom );
    const spare = mapRoom( width ) - scale * 2 * HALF_WIDTH;
    const left =
        spare >= 0
            ? MAP_MARGIN_LEFT + spare / 2
            : MAP_MARGIN_LEFT - clamp( camera.scrollX, 0, maxScrollX( width, camera.zoom ) ) * scale;
    return { width, height, scale, left, scrollZ: camera.scrollZ };
}

export function clampCamera( width: number, height: number, level: AuthoredLevel, camera: EditorCamera ): EditorCamera {
    const zoom = clamp( camera.zoom, ZOOM_MIN, ZOOM_MAX );
    const v = viewOf( width, height, { ...camera, zoom } );
    return {
        zoom,
        scrollX: clamp( camera.scrollX, 0, maxScrollX( width, zoom ) ),
        scrollZ: clamp( camera.scrollZ, 0, maxScrollZ( level, v ) ),
    };
}

export function zoomAround(
    width: number,
    height: number,
    level: AuthoredLevel,
    camera: EditorCamera,
    px: number,
    py: number,
    zoom: number,
): EditorCamera {
    const p = worldAt( viewOf( width, height, camera ), px, py );
    const next = clamp( zoom, ZOOM_MIN, ZOOM_MAX );
    const scale = scaleOf( width, next );
    return clampCamera( width, height, level, {
        zoom: next,
        scrollX: ( MAP_MARGIN_LEFT - px ) / scale + p.x + HALF_WIDTH,
        scrollZ: p.z - ( height - py ) / scale,
    } );
}

export function screenX( v: EditorView, x: number ): number {
    return v.left + ( x + HALF_WIDTH ) * v.scale;
}

export function screenY( v: EditorView, z: number ): number {
    return v.height - ( z - v.scrollZ ) * v.scale;
}

export function worldAt( v: EditorView, px: number, py: number ): EditorPoint {
    return { x: ( px - v.left ) / v.scale - HALF_WIDTH, z: v.scrollZ + ( v.height - py ) / v.scale };
}

export function visibleSpan( v: EditorView ): number {
    return v.height / v.scale;
}

export function maxScrollZ( level: AuthoredLevel, v: EditorView ): number {
    return Math.max( 0, trackLength( level ) - visibleSpan( v ) + SEG_LEN );
}

export function trackLength( level: AuthoredLevel ): number {
    return level.length * SEG_LEN;
}

export function lockedZ(): number {
    return START_SAFE * SEG_LEN;
}

function cellEdge( v: number, snap: number ): number {
    return Math.floor( v / snap ) * snap;
}

export function snapRect( a: EditorPoint, b: EditorPoint, snap: number, length: number ): AuthoredRect | null {
    const x0 = clamp( cellEdge( Math.min( a.x, b.x ), snap ), -HALF_WIDTH, HALF_WIDTH );
    const x1 = clamp( cellEdge( Math.max( a.x, b.x ), snap ) + snap, -HALF_WIDTH, HALF_WIDTH );
    const z0 = clamp( cellEdge( Math.min( a.z, b.z ), snap ), lockedZ(), length );
    const z1 = clamp( cellEdge( Math.max( a.z, b.z ), snap ) + snap, lockedZ(), length );
    return x1 > x0 && z1 > z0 ? { x: x0, z: z0, w: x1 - x0, l: z1 - z0 } : null;
}

export function overlaps( a: AuthoredRect, b: AuthoredRect ): boolean {
    return a.x < b.x + b.w && b.x < a.x + a.w && a.z < b.z + b.l && b.z < a.z + a.l;
}

export function subtractRect< T extends AuthoredRect >( a: T, r: AuthoredRect ): T[] {
    if ( ! overlaps( a, r ) ) return [ a ];
    const aTop = a.z + a.l;
    const aRight = a.x + a.w;
    const z0 = Math.max( a.z, r.z );
    const z1 = Math.min( aTop, r.z + r.l );
    const x1 = Math.min( aRight, r.x + r.w );
    const pieces: T[] = [
        { ...a, l: z0 - a.z },
        { ...a, z: z1, l: aTop - z1 },
        { ...a, w: Math.max( a.x, r.x ) - a.x, z: z0, l: z1 - z0 },
        { ...a, x: x1, w: aRight - x1, z: z0, l: z1 - z0 },
    ];
    return pieces.filter( ( p ) => p.w > 0 && p.l > 0 );
}

export function applyTool( level: AuthoredLevel, tool: EditorTool, r: AuthoredRect ): AuthoredLevel {
    switch ( tool ) {
        case 'eraser':
            return {
                ...level,
                blocks: level.blocks.flatMap( ( b ) => subtractRect( b, r ) ),
                gaps: level.gaps.flatMap( ( g ) => subtractRect( g, r ) ),
            };
        case 'gap':
            return { ...level, gaps: [ ...level.gaps, r ] };
        case 'destructible':
        case 'solid':
            return { ...level, blocks: [ ...level.blocks, { ...r, destructible: tool === 'destructible' } ] };
    }
}

export function crowdedSegments( blocks: readonly AuthoredBlock[] ): number[] {
    const counts = new Map< number, number >();
    for ( const b of blocks ) {
        const last = Math.ceil( ( b.z + b.l ) / SEG_LEN ) - 1;
        for ( let i = Math.floor( b.z / SEG_LEN ); i <= last; i++ ) counts.set( i, ( counts.get( i ) ?? 0 ) + 1 );
    }
    return [ ...counts ]
        .filter( ( [ , n ] ) => n > BLOCK_ID_STRIDE )
        .map( ( [ i ] ) => i )
        .sort( ( a, b ) => a - b );
}

export function slugOf( name: string ): string {
    return name
        .toLowerCase()
        .replace( /[^a-z0-9]+/g, '-' )
        .replace( /^-+|-+$/g, '' )
        .slice( 0, 64 );
}

export function hash8( text: string ): string {
    let h = 0x811c9dc5;
    for ( let i = 0; i < text.length; i++ ) {
        h ^= text.charCodeAt( i );
        h = Math.imul( h, 0x01000193 );
    }
    return ( h >>> 0 ).toString( 16 ).padStart( 8, '0' );
}

function fillRect( ctx: CanvasRenderingContext2D, v: EditorView, r: AuthoredRect ): void {
    ctx.fillRect( screenX( v, r.x ), screenY( v, r.z + r.l ), r.w * v.scale, r.l * v.scale );
}

function strokeRect( ctx: CanvasRenderingContext2D, v: EditorView, r: AuthoredRect ): void {
    ctx.strokeRect( screenX( v, r.x ) + 0.5, screenY( v, r.z + r.l ) + 0.5, r.w * v.scale - 1, r.l * v.scale - 1 );
}

function inView( v: EditorView, r: AuthoredRect ): boolean {
    return r.z + r.l >= v.scrollZ && r.z <= v.scrollZ + visibleSpan( v );
}

function drawGrid( ctx: CanvasRenderingContext2D, v: EditorView, snap: number, length: number ): void {
    const top = Math.min( length, v.scrollZ + visibleSpan( v ) );
    const bottom = Math.max( 0, v.scrollZ );
    const yTop = screenY( v, top );
    const yBottom = screenY( v, bottom );
    ctx.lineWidth = 1;
    if ( snap * v.scale >= MIN_GRID_PX ) {
        ctx.strokeStyle = MAP_COLORS.grid;
        ctx.beginPath();
        for ( let x = -HALF_WIDTH; x <= HALF_WIDTH; x += snap ) {
            const px = Math.round( screenX( v, x ) ) + 0.5;
            ctx.moveTo( px, yTop );
            ctx.lineTo( px, yBottom );
        }
        for ( let z = cellEdge( bottom, snap ); z <= top; z += snap ) {
            const py = Math.round( screenY( v, z ) ) + 0.5;
            ctx.moveTo( screenX( v, -HALF_WIDTH ), py );
            ctx.lineTo( screenX( v, HALF_WIDTH ), py );
        }
        ctx.stroke();
    }
    ctx.strokeStyle = MAP_COLORS.segment;
    ctx.fillStyle = MAP_COLORS.label;
    ctx.font = '11px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.beginPath();
    for ( let i = Math.floor( bottom / SEG_LEN ); i * SEG_LEN <= top; i++ ) {
        const py = Math.round( screenY( v, i * SEG_LEN ) ) + 0.5;
        ctx.moveTo( screenX( v, -HALF_WIDTH ), py );
        ctx.lineTo( screenX( v, HALF_WIDTH ), py );
        if ( i % LABEL_EVERY_SEGMENTS === 0 ) ctx.fillText( String( i ), v.left - 8, py );
    }
    ctx.stroke();
}

function drawBlock( ctx: CanvasRenderingContext2D, v: EditorView, b: AuthoredBlock ): void {
    ctx.fillStyle = b.destructible ? MAP_COLORS.destructible : MAP_COLORS.solid;
    fillRect( ctx, v, b );
    ctx.strokeStyle = b.destructible ? MAP_COLORS.destructibleEdge : MAP_COLORS.solidEdge;
    strokeRect( ctx, v, b );
}

function drawPreview( ctx: CanvasRenderingContext2D, v: EditorView, s: EditorState, length: number ): void {
    if ( s.hover === null ) return;
    const r = snapRect( s.anchor ?? s.hover, s.hover, s.snap, length );
    if ( r === null ) return;
    ctx.fillStyle = TOOL_PREVIEW[ s.tool ];
    fillRect( ctx, v, r );
    ctx.strokeStyle = s.tool === 'eraser' ? MAP_COLORS.eraser : MAP_COLORS.destructibleEdge;
    ctx.setLineDash( [ 4, 3 ] );
    strokeRect( ctx, v, r );
    ctx.setLineDash( [] );
}

export function snapStart( level: AuthoredLevel, at: EditorPoint ): { point: EditorPoint; moved: boolean } {
    const point = startPointFor( authoredTrack( level ), widestShip(), at.x, at.z );
    return { point, moved: Math.hypot( point.x - at.x, point.z - at.z ) > START_SNAP_EPS };
}

function drawStart( ctx: CanvasRenderingContext2D, v: EditorView, p: EditorPoint ): void {
    const t = tuningForShip( widestShip() );
    const w = Math.max( START_MARKER_MIN_PX, t.halfW * v.scale );
    const l = Math.max( START_MARKER_MIN_PX, t.halfL * v.scale );
    const cx = screenX( v, p.x );
    const cy = screenY( v, p.z );
    ctx.fillStyle = MAP_COLORS.start;
    ctx.beginPath();
    ctx.moveTo( cx, cy - l );
    ctx.lineTo( cx + w, cy + l );
    ctx.lineTo( cx - w, cy + l );
    ctx.closePath();
    ctx.fill();
}

export function drawMap( ctx: CanvasRenderingContext2D, v: EditorView, s: EditorState ): void {
    const length = trackLength( s.level );
    const deck = { x: -HALF_WIDTH, z: 0, w: 2 * HALF_WIDTH, l: length };
    ctx.fillStyle = MAP_COLORS.void;
    ctx.fillRect( 0, 0, v.width, v.height );
    ctx.fillStyle = MAP_COLORS.deck;
    fillRect( ctx, v, deck );
    ctx.fillStyle = MAP_COLORS.crowded;
    for ( const i of crowdedSegments( s.level.blocks ) ) fillRect( ctx, v, { ...deck, z: i * SEG_LEN, l: SEG_LEN } );
    ctx.strokeStyle = MAP_COLORS.gapEdge;
    for ( const g of s.level.gaps ) {
        if ( ! inView( v, g ) ) continue;
        ctx.fillStyle = MAP_COLORS.void;
        fillRect( ctx, v, g );
        strokeRect( ctx, v, g );
    }
    drawGrid( ctx, v, s.snap, length );
    for ( const b of s.level.blocks ) if ( inView( v, b ) ) drawBlock( ctx, v, b );
    ctx.fillStyle = MAP_COLORS.locked;
    fillRect( ctx, v, { ...deck, l: lockedZ() } );
    ctx.fillStyle = MAP_COLORS.finish;
    ctx.fillRect( screenX( v, -HALF_WIDTH ), screenY( v, length ) - 1, 2 * HALF_WIDTH * v.scale, 3 );
    drawPreview( ctx, v, s, length );
    if ( s.start !== null ) drawStart( ctx, v, s.start );
}
