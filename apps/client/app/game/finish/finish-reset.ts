export const FADE_OUT = 0.35;
export const FADE_IN = 0.45;

export type FinishResetPhase = 'idle' | 'out' | 'in';

export interface FinishReset {
    phase: FinishResetPhase;
    t: number;
    opacity: number;
    el: HTMLElement | null;
    shown: number;
}

export function createFinishReset(): FinishReset {
    return { phase: 'idle', t: 0, opacity: 0, el: null, shown: -1 };
}

export const finishReset = createFinishReset();

export function stepFinishReset( r: FinishReset, finished: boolean, dt: number ): 'reset' | null {
    if ( r.phase === 'idle' ) {
        if ( ! finished ) return null;
        r.phase = 'out';
        r.t = 0;
    }
    r.t += dt;
    if ( r.phase === 'out' ) {
        r.opacity = Math.min( 1, r.t / FADE_OUT );
        if ( r.t < FADE_OUT ) return null;
        r.phase = 'in';
        r.t = 0;
        r.opacity = 1;
        return 'reset';
    }
    r.opacity = Math.max( 0, 1 - r.t / FADE_IN );
    if ( r.t >= FADE_IN ) {
        r.phase = 'idle';
        r.t = 0;
        r.opacity = 0;
    }
    return null;
}

export function showFinishFade( r: FinishReset ): void {
    if ( ! r.el || r.opacity === r.shown ) return;
    r.el.style.opacity = String( r.opacity );
    r.shown = r.opacity;
}

export function registerFinishFade( el: HTMLElement | null ): void {
    finishReset.el = el;
    finishReset.shown = -1;
}
