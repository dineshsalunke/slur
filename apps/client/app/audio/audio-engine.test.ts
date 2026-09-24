import { beforeAll, describe, expect, it, vi } from 'vitest';

class FakeParam {
    value = 1;
    ramps: [ number, number ][] = [];
    cancelScheduledValues(): void {}
    setValueAtTime( v: number ): void {
        this.value = v;
    }
    setTargetAtTime(): void {}
    linearRampToValueAtTime( v: number, t: number ): void {
        this.ramps.push( [ v, t ] );
    }
}

class FakeNode {
    gain = new FakeParam();
    threshold = new FakeParam();
    knee = new FakeParam();
    ratio = new FakeParam();
    attack = new FakeParam();
    release = new FakeParam();
    connect(): void {}
    disconnect(): void {}
}

class FakeSource extends FakeNode {
    buffer: unknown = null;
    playbackRate = new FakeParam();
    onended: ( () => void ) | null = null;
    stoppedAt: number | null = null;
    start(): void {}
    stop( t = 0 ): void {
        this.stoppedAt = t;
    }
}

const sources: FakeSource[] = [];

class FakeContext {
    currentTime = 5;
    state = 'running';
    destination = new FakeNode();
    createGain(): FakeNode {
        return new FakeNode();
    }
    createDynamicsCompressor(): FakeNode {
        return new FakeNode();
    }
    createBufferSource(): FakeSource {
        const s = new FakeSource();
        sources.push( s );
        return s;
    }
    decodeAudioData(): Promise< object > {
        return Promise.resolve( {} );
    }
    resume(): Promise< void > {
        return Promise.resolve();
    }
}

let engine: typeof import('./audio-engine');

beforeAll( async () => {
    vi.stubGlobal( 'window', {
        AudioContext: FakeContext,
        addEventListener() {},
        removeEventListener() {},
    } );
    vi.stubGlobal( 'fetch', () =>
        Promise.resolve( { ok: true, arrayBuffer: () => Promise.resolve( new ArrayBuffer( 0 ) ) } ),
    );
    engine = await import( './audio-engine' );
    await engine.loadSample( 'a', '/a.ogg' );
    await engine.loadSample( 'b', '/b.ogg' );
} );

function played(): FakeSource {
    const s = sources.at( -1 );
    if ( ! s ) throw new Error( 'nothing played' );
    return s;
}

describe( 'audio engine cut', () => {
    it( 'a cut play stops the previous source of the same sample after a short fade', () => {
        engine.play( 'a', { cut: true } );
        const first = played();
        engine.play( 'a', { cut: true } );

        expect( first.stoppedAt ).toBeCloseTo( 5.01 );
        expect( played().stoppedAt ).toBeNull();
    } );

    it( 'a plain play stops nothing', () => {
        engine.play( 'b' );
        const first = played();
        engine.play( 'b' );

        expect( first.stoppedAt ).toBeNull();
    } );

    it( 'a cut play leaves another sample playing', () => {
        engine.play( 'b', { cut: true } );
        const other = played();
        engine.play( 'a', { cut: true } );

        expect( other.stoppedAt ).toBeNull();
    } );

    it( 'a source that already ended is not stopped again', () => {
        engine.play( 'b', { cut: true } );
        const first = played();
        first.onended?.();
        engine.play( 'b', { cut: true } );

        expect( first.stoppedAt ).toBeNull();
    } );
} );
