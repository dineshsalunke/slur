import { HALF_WIDTH } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import type { FlightTake } from '../flight-recorder/flight-recorder.utils';
import { drawTakes, segmentsInBand } from './flight-trace.utils';
import { screenX, viewOf } from './track-editor.utils';

function take( xs: number[], zs: number[], band = 3 ): FlightTake {
    return { id: 1, ticks: xs.length, runs: [ xs.map( ( x, i ) => ( { x, z: zs[ i ], band } ) ) ], events: [] };
}

function recordingCtx() {
    const moves: [ number, number ][] = [];
    const ctx = new Proxy(
        {},
        {
            get: ( _t, key ) =>
                key === 'moveTo' ? ( x: number, y: number ) => moves.push( [ x, y ] ) : () => undefined,
            set: () => true,
        },
    ) as CanvasRenderingContext2D;
    return { ctx, moves };
}

describe( 'segmentsInBand', () => {
    it( 'keeps segments of the band that touch the z span', () => {
        const t = take( [ 0, 0, 0, 0 ], [ 0, 10, 20, 30 ] );
        expect( segmentsInBand( t.runs, 3, { min: 12, max: 18 } ) ).toHaveLength( 1 );
        expect( segmentsInBand( t.runs, 3, { min: 0, max: 30 } ) ).toHaveLength( 3 );
        expect( segmentsInBand( t.runs, 2, { min: 0, max: 30 } ) ).toHaveLength( 0 );
    } );

    it( 'never joins two runs', () => {
        const runs = [ [ { x: 0, z: 0, band: 0 } ], [ { x: 20, z: 1, band: 0 } ] ];
        expect( segmentsInBand( runs, 0, { min: 0, max: 10 } ) ).toHaveLength( 0 );
    } );
} );

describe( 'drawTakes', () => {
    it( 'places the trace with the editor x mirror', () => {
        const v = viewOf( 800, 600, { zoom: 1, scrollX: 0, scrollZ: 0 } );
        const { ctx, moves } = recordingCtx();
        drawTakes( ctx, v, [ take( [ HALF_WIDTH / 2, HALF_WIDTH / 2 ], [ 5, 6 ] ) ] );
        expect( moves[ 0 ][ 0 ] ).toBeCloseTo( screenX( v, HALF_WIDTH / 2 ) );
        expect( moves[ 0 ][ 0 ] ).toBeLessThan( v.left + HALF_WIDTH * v.scale );
    } );
} );
