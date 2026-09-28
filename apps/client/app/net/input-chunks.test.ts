import { emptyInput, MAX_QUEUED_INPUTS } from '@slur/shared';
import { describe, expect, it } from 'vitest';
import { INPUT_CHUNK, inputChunks } from './input-chunks';

function inputs( n: number ) {
    return Array.from( { length: n }, ( _, i ) => emptyInput( i + 1 ) );
}

describe( 'inputChunks (#339)', () => {
    it( 'sends a normal batch as one message', () => {
        expect( inputChunks( inputs( 2 ) ) ).toHaveLength( 1 );
        expect( inputChunks( [] ) ).toHaveLength( 0 );
    } );

    it( 'splits a backlog into chunks of at most INPUT_CHUNK, in order', () => {
        const chunks = inputChunks( inputs( 45 ) );
        expect( chunks.map( ( c ) => c.length ) ).toEqual( [ INPUT_CHUNK, INPUT_CHUNK, 5 ] );
        expect( chunks.flat().map( ( i ) => i.seq ) ).toEqual( inputs( 45 ).map( ( i ) => i.seq ) );
    } );

    it( 'keeps only the newest inputs the server would queue', () => {
        const chunks = inputChunks( inputs( MAX_QUEUED_INPUTS + 30 ) );
        expect( chunks.flat() ).toHaveLength( MAX_QUEUED_INPUTS );
        expect( chunks.flat()[ 0 ].seq ).toBe( 31 );
    } );
} );
