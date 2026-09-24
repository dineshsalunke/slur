import { describe, expect, it } from 'vitest';
import { createFinishReset, FADE_IN, FADE_OUT, stepFinishReset } from './finish-reset';

const DT = 1 / 60;

function run( r: ReturnType< typeof createFinishReset >, finished: boolean, seconds: number ): number {
    let resets = 0;
    for ( let t = 0; t < seconds; t += DT ) if ( stepFinishReset( r, finished, DT ) === 'reset' ) resets++;
    return resets;
}

describe( 'stepFinishReset', () => {
    it( 'stays clear until the ship finishes', () => {
        const r = createFinishReset();
        expect( run( r, false, 2 ) ).toBe( 0 );
        expect( r.phase ).toBe( 'idle' );
        expect( r.opacity ).toBe( 0 );
    } );

    it( 'fades to black, resets once at full black, then fades back in', () => {
        const r = createFinishReset();
        stepFinishReset( r, true, DT );
        expect( r.phase ).toBe( 'out' );
        expect( r.opacity ).toBeGreaterThan( 0 );
        expect( r.opacity ).toBeLessThan( 1 );

        let resetAt = -1;
        let t = DT;
        while ( resetAt < 0 && t < 2 ) {
            t += DT;
            if ( stepFinishReset( r, true, DT ) === 'reset' ) resetAt = t;
        }
        expect( resetAt ).toBeGreaterThanOrEqual( FADE_OUT );
        expect( resetAt ).toBeLessThan( FADE_OUT + 2 * DT );
        expect( r.opacity ).toBe( 1 );
        expect( r.phase ).toBe( 'in' );

        expect( run( r, false, FADE_IN / 2 ) ).toBe( 0 );
        expect( r.opacity ).toBeGreaterThan( 0 );
        expect( r.opacity ).toBeLessThan( 1 );

        run( r, false, FADE_IN / 2 + 2 * DT );
        expect( r.phase ).toBe( 'idle' );
        expect( r.opacity ).toBe( 0 );
    } );

    it( 'resets only once per finish', () => {
        const r = createFinishReset();
        expect( run( r, true, FADE_OUT + FADE_IN - 4 * DT ) ).toBe( 1 );
    } );
} );
