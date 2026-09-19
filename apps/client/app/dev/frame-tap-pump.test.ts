import { describe, expect, it } from 'vitest';
import { type DeltaLog, type PumpRootState, pumpAndCapture, recordDelta } from './frame-tap-pump';

// A fake root whose canvas returns a different string depending on what was last rendered into it, so the
// tests can tell a composed frame from a bloom-off one WITHOUT a GPU. That distinction is the only thing this
// instrument really has to get right.
function fakeRoot( deltas: number[], log: DeltaLog ) {
    const calls: string[] = [];
    let framebuffer = 'composed';
    let frame = 0;

    const state: PumpRootState = {
        gl: {
            domElement: {
                toDataURL: ( type: string ) => {
                    calls.push( `toDataURL:${ framebuffer }` );
                    return `data:${ type };base64,${ framebuffer }`;
                },
            },
            render: () => {
                calls.push( 'gl.render' );
                framebuffer = 'bloom-off';
            },
        },
        scene: {},
        camera: {},
    };

    // Stands in for fiber's `update()`: it is the thing that feeds `useFrame` subscribers, and the priority-0
    // observer in `<FrameTap/>` is what fills the log.
    const advance = () => {
        recordDelta( log, deltas[ Math.min( frame, deltas.length - 1 ) ] ?? 0.016 );
        frame += 1;
        calls.push( 'advance' );
    };

    return { state, advance, calls, pumped: () => frame };
}

const pump = ( over: Partial< Parameters< typeof pumpAndCapture >[ 0 ] > = {}, deltas = [ 0.016 ] ) => {
    const log: DeltaLog = { first: 0, last: 0, frames: 0 };
    const root = fakeRoot( deltas, log );
    const result = pumpAndCapture( {
        advance: root.advance,
        getState: () => root.state,
        log,
        now: () => 0,
        warmup: 2,
        frames: 3,
        ab: false,
        ...over,
    } );
    return { result, root, log };
};

describe( 'pumpAndCapture', () => {
    it( 'pumps warmup + frames and captures after the last one', () => {
        const { result, root } = pump();
        expect( root.pumped() ).toBe( 5 );
        expect( result.pumped ).toBe( 5 );
        // Every advance precedes the single capture — capturing mid-pump would photograph a warm frame.
        expect( root.calls ).toEqual( [ 'advance', 'advance', 'advance', 'advance', 'advance', 'toDataURL:composed' ] );
    } );

    it( 'drives the frameloop and never renders around the composer when ab is off', () => {
        // THE load-bearing assertion. The failure this guards is a later refactor "simplifying" the pump into
        // a direct `gl.render( scene, camera )`, which bypasses EffectComposer and silently turns bloom off in
        // every frame the art pass is judged on. A bare gl.render must never appear on the default path.
        const { root } = pump();
        expect( root.calls ).not.toContain( 'gl.render' );
        expect( root.calls.filter( ( c ) => c === 'advance' ).length ).toBeGreaterThan( 0 );
    } );

    it( 'captures the composed frame BEFORE the bloom-off re-render overwrites it', () => {
        const { result, root } = pump( { ab: true } );
        expect( root.calls.slice( -3 ) ).toEqual( [ 'toDataURL:composed', 'gl.render', 'toDataURL:bloom-off' ] );
        // The two reads must differ — if a future change made them identical, the A/B would "pass" while
        // proving nothing.
        expect( result.composed ).not.toBe( result.bloomOff );
        expect( result.composed ).toContain( 'composed' );
        expect( result.bloomOff ).toContain( 'bloom-off' );
    } );

    it( 'reports the first pumped delta separately from the captured one', () => {
        // The rAF-liveness reading. `update()` takes its delta from `clock.getDelta()` — wall time since the
        // last frame from ANY source — so a long first delta means rAF has not been running. Collapsing the
        // two into one number would destroy that signal, because the warm-up deliberately makes the captured
        // delta tiny.
        const { result } = pump( {}, [ 41.2, 0.0002, 0.0002, 0.0002, 0.0003 ] );
        expect( result.firstDelta ).toBeCloseTo( 41.2 );
        expect( result.capturedDelta ).toBeCloseTo( 0.0003 );
    } );

    it( 'clamps to at least one captured frame and a non-negative warm-up', () => {
        const { root } = pump( { warmup: -5, frames: 0 } );
        expect( root.pumped() ).toBe( 1 );
    } );

    it( 'resets the log so a previous tap cannot leak into this one', () => {
        const log: DeltaLog = { first: 9.9, last: 9.9, frames: 7 };
        const root = fakeRoot( [ 0.5 ], log );
        const result = pumpAndCapture( {
            advance: root.advance,
            getState: () => root.state,
            log,
            now: () => 0,
            warmup: 0,
            frames: 1,
            ab: false,
        } );
        expect( result.firstDelta ).toBeCloseTo( 0.5 );
    } );
} );
