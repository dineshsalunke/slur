import { addAfterEffect, addEffect } from '@react-three/fiber';

const WINDOW_MS = 500;

const listeners = new Set< () => void >();

let frames = 0;
let windowStart = performance.now();
let previous = windowStart;
let frameStart = windowStart;
let slowest = 0;
let cpuTotal = 0;
let fps = 0;
let worst = 0;
let cpu = 0;

addEffect( () => {
    frameStart = performance.now();
} );

addAfterEffect( () => {
    const now = performance.now();
    slowest = Math.max( slowest, now - previous );
    cpuTotal += now - frameStart;
    previous = now;
    frames++;
    if ( now - windowStart < WINDOW_MS ) return;
    fps = Math.round( ( frames * 1000 ) / ( now - windowStart ) );
    worst = Math.round( slowest );
    cpu = Math.round( ( cpuTotal / frames ) * 10 ) / 10;
    frames = 0;
    slowest = 0;
    cpuTotal = 0;
    windowStart = now;
    for ( const listener of listeners ) listener();
} );

export function subscribeFrameMeter( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function frameRate(): number {
    return fps;
}

export function worstFrameMs(): number {
    return worst;
}

export function cpuFrameMs(): number {
    return cpu;
}
