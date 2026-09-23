import { type Block, fullFloor, SEG_LEN, type Segment, type Track } from '../index.js';

export function syntheticTrack( length: number, edit: ( s: Segment ) => Segment = ( s ) => s ): Track {
    const segmentAt = ( i: number ): Segment =>
        edit( {
            index: i,
            z0: i * SEG_LEN,
            z1: ( i + 1 ) * SEG_LEN,
            kind: i >= length ? 'finish' : 'plain',
            floors: fullFloor( 0 ),
            blocks: [],
            isFinish: i >= length,
        } );
    return {
        finishZ: length * SEG_LEN,
        anchors: [],
        segmentAt,
        segmentAtZ: ( z: number ) => segmentAt( Math.floor( z / SEG_LEN ) ),
    };
}

export function wall( i: number, x0: number, x1: number ): Block {
    return { id: i * 64, kind: 'sealed', x0, x1, y0: 0, y1: 8, z0: i * SEG_LEN, z1: ( i + 1 ) * SEG_LEN };
}
