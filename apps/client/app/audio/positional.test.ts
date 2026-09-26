import * as THREE from 'three';
import { beforeAll, describe, expect, it, vi } from 'vitest';

class FakeParam {
    value = 1;
    setTargetAtTime(): void {}
    setValueAtTime(): void {}
}

class FakeNode {
    gain = new FakeParam();
    threshold = new FakeParam();
    knee = new FakeParam();
    ratio = new FakeParam();
    attack = new FakeParam();
    release = new FakeParam();
    constructor( readonly kind: string ) {}
    connect(): void {}
    disconnect(): void {}
}

const contexts: FakeContext[] = [];
const handlers = new Map< string, () => void >();

class FakeContext {
    state = 'suspended';
    currentTime = 0;
    destination = new FakeNode( 'destination' );
    nodes: FakeNode[] = [];
    constructor() {
        contexts.push( this );
    }
    private node( kind: string ): FakeNode {
        const n = new FakeNode( kind );
        this.nodes.push( n );
        return n;
    }
    createGain(): FakeNode {
        return this.node( 'gain' );
    }
    createDynamicsCompressor(): FakeNode {
        return this.node( 'compressor' );
    }
    resume(): Promise< void > {
        this.state = 'running';
        return Promise.resolve();
    }
}

let engine: typeof import('./audio-engine');
let positional: typeof import('./positional');

beforeAll( async () => {
    vi.stubGlobal( 'window', {
        AudioContext: FakeContext,
        addEventListener( type: string, fn: () => void ) {
            handlers.set( type, fn );
        },
        removeEventListener( type: string ) {
            handlers.delete( type );
        },
    } );
    vi.stubGlobal( 'localStorage', {
        getItem: () => JSON.stringify( { muted: true, volume: 0.8 } ),
        setItem() {},
    } );
    engine = await import( './audio-engine' );
    positional = await import( './positional' );
} );

describe( 'ensureListener before any gesture', () => {
    it( 'puts the listener on the engine context, the only context made', () => {
        const listener = positional.ensureListener( new THREE.PerspectiveCamera() );

        expect( contexts ).toHaveLength( 1 );
        expect( listener?.context ).toBe( engine.getContext() );
        expect( THREE.AudioContext.getContext() ).toBe( engine.getContext() );
    } );

    it( 'leaves the context suspended until the first pointerdown resumes it', () => {
        const ctx = contexts[ 0 ];
        expect( ctx.state ).toBe( 'suspended' );

        handlers.get( 'pointerdown' )?.();

        expect( ctx.state ).toBe( 'running' );
    } );

    it( 'keeps the stored mute on the master gain', () => {
        const nodes = contexts[ 0 ].nodes;
        const master = nodes[ nodes.findIndex( ( n ) => n.kind === 'compressor' ) + 1 ];

        expect( engine.isMuted() ).toBe( true );
        expect( master.gain.value ).toBe( 0 );
    } );
} );
