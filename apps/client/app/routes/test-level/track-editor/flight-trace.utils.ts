import type { FlightEvent, FlightPoint, FlightTake } from '../flight-recorder/flight-recorder.utils';
import { TRACE_MARKER_COLORS, TRACE_MARKER_PX, TRACE_SPEED_COLORS, TRACE_TAKE_STYLES } from './track-editor.constants';
import { type EditorView, screenX, screenY, visibleSpan } from './track-editor.utils';

export interface ZSpan {
    min: number;
    max: number;
}

export function traceSpan( v: EditorView ): ZSpan {
    const pad = TRACE_MARKER_PX / v.scale;
    return { min: v.scrollZ - pad, max: v.scrollZ + visibleSpan( v ) + pad };
}

export function segmentsInBand(
    runs: readonly FlightPoint[][],
    band: number,
    span: ZSpan,
): [ FlightPoint, FlightPoint ][] {
    const out: [ FlightPoint, FlightPoint ][] = [];
    for ( const run of runs ) {
        for ( let i = 1; i < run.length; i++ ) {
            const a = run[ i - 1 ];
            const b = run[ i ];
            if ( b.band !== band || Math.max( a.z, b.z ) < span.min || Math.min( a.z, b.z ) > span.max ) continue;
            out.push( [ a, b ] );
        }
    }
    return out;
}

function drawMarker( ctx: CanvasRenderingContext2D, v: EditorView, e: FlightEvent ): void {
    const x = screenX( v, e.x );
    const y = screenY( v, e.z );
    const r = TRACE_MARKER_PX;
    ctx.fillStyle = TRACE_MARKER_COLORS[ e.kind ];
    ctx.strokeStyle = TRACE_MARKER_COLORS[ e.kind ];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    switch ( e.kind ) {
        case 'takeoff':
            ctx.moveTo( x, y - r );
            ctx.lineTo( x + r, y + r );
            ctx.lineTo( x - r, y + r );
            ctx.closePath();
            ctx.fill();
            return;
        case 'landing':
            ctx.arc( x, y, r / 2, 0, 2 * Math.PI );
            ctx.fill();
            return;
        case 'pickup':
            ctx.moveTo( x, y - r );
            ctx.lineTo( x + r, y );
            ctx.lineTo( x, y + r );
            ctx.lineTo( x - r, y );
            ctx.closePath();
            ctx.fill();
            return;
        case 'boost':
            ctx.moveTo( x - r, y );
            ctx.lineTo( x, y - r );
            ctx.lineTo( x + r, y );
            ctx.moveTo( x - r, y + r );
            ctx.lineTo( x, y );
            ctx.lineTo( x + r, y + r );
            ctx.stroke();
            return;
        case 'death':
            ctx.arc( x, y, r + 1, 0, 2 * Math.PI );
            ctx.moveTo( x - r / 2, y - r / 2 );
            ctx.lineTo( x + r / 2, y + r / 2 );
            ctx.moveTo( x + r / 2, y - r / 2 );
            ctx.lineTo( x - r / 2, y + r / 2 );
            ctx.stroke();
            return;
        case 'bump':
            ctx.moveTo( x - r, y - r );
            ctx.lineTo( x + r, y + r );
            ctx.moveTo( x + r, y - r );
            ctx.lineTo( x - r, y + r );
            ctx.stroke();
            return;
    }
}

function drawTake(
    ctx: CanvasRenderingContext2D,
    v: EditorView,
    take: FlightTake,
    style: { alpha: number; width: number },
): void {
    const span = traceSpan( v );
    ctx.globalAlpha = style.alpha;
    ctx.lineWidth = style.width;
    ctx.lineCap = 'round';
    for ( let band = 0; band < TRACE_SPEED_COLORS.length; band++ ) {
        const segments = segmentsInBand( take.runs, band, span );
        if ( segments.length === 0 ) continue;
        ctx.strokeStyle = TRACE_SPEED_COLORS[ band ];
        ctx.beginPath();
        for ( const [ a, b ] of segments ) {
            ctx.moveTo( screenX( v, a.x ), screenY( v, a.z ) );
            ctx.lineTo( screenX( v, b.x ), screenY( v, b.z ) );
        }
        ctx.stroke();
    }
    for ( const e of take.events ) if ( e.z >= span.min && e.z <= span.max ) drawMarker( ctx, v, e );
}

export function drawTakes( ctx: CanvasRenderingContext2D, v: EditorView, takes: readonly FlightTake[] ): void {
    ctx.save();
    for ( let i = Math.min( takes.length, TRACE_TAKE_STYLES.length ) - 1; i >= 0; i-- ) {
        drawTake( ctx, v, takes[ i ], TRACE_TAKE_STYLES[ i ] );
    }
    ctx.restore();
}
