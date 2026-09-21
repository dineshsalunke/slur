export type AdvanceFn< S > = ( timestamp: number, runGlobalEffects?: boolean, state?: S ) => void;

export type PumpRootState = {
    gl: {
        domElement: { toDataURL( type: string ): string };
        render( scene: unknown, camera: unknown ): void;
    };
    scene: unknown;
    camera: unknown;
};

export type DeltaLog = { first: number; last: number; frames: number };

export function resetLog( log: DeltaLog ): void {
    log.first = 0;
    log.last = 0;
    log.frames = 0;
}

export function recordDelta( log: DeltaLog, delta: number ): void {
    if ( log.frames === 0 ) log.first = delta;
    log.last = delta;
    log.frames += 1;
}

export type TapResult = {
    composed: string;
    bloomOff: string | null;
    firstDelta: number;
    capturedDelta: number;
    pumped: number;
};

export function pumpAndCapture< S extends PumpRootState >( {
    advance,
    getState,
    log,
    now,
    warmup,
    frames,
    ab,
}: {
    advance: AdvanceFn< S >;
    getState: () => S;
    log: DeltaLog;
    now: () => number;
    warmup: number;
    frames: number;
    ab: boolean;
} ): TapResult {
    const warm = Math.max( 0, Math.round( warmup ) );
    const keep = Math.max( 1, Math.round( frames ) );
    const total = warm + keep;

    resetLog( log );
    for ( let i = 0; i < total; i++ ) {
        advance( now(), true, getState() );
    }

    const state = getState();
    const composed = state.gl.domElement.toDataURL( 'image/png' );

    let bloomOff: string | null = null;
    if ( ab ) {
        state.gl.render( state.scene, state.camera );
        bloomOff = state.gl.domElement.toDataURL( 'image/png' );
    }

    return { composed, bloomOff, firstDelta: log.first, capturedDelta: log.last, pumped: total };
}
