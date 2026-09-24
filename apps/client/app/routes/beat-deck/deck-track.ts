import { fullFloor, SEG_LEN, type Segment, segmentsTrack, type Track } from '@slur/shared';

export const DECK_SEGMENTS = 3000;

export function deckTrack( length: number = DECK_SEGMENTS ): Track {
    const segments: Segment[] = Array.from( { length }, ( _, i ) => ( {
        index: i,
        z0: i * SEG_LEN,
        z1: ( i + 1 ) * SEG_LEN,
        kind: 'plain',
        floors: fullFloor( 0 ),
        blocks: [],
        isFinish: false,
    } ) );
    return segmentsTrack( segments, length );
}
