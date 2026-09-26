import { classOfShip, type ShipClassId } from '@slur/shared';

export interface EngineVoice {
    pitch: number;
    bright: number;
}

export const ENGINE_VOICE: Record< ShipClassId, EngineVoice > = {
    interceptor: { pitch: 1.15, bright: 1.2 },
    fighter: { pitch: 1.0, bright: 1.0 },
    comet: { pitch: 1.08, bright: 1.1 },
    phantom: { pitch: 0.95, bright: 0.7 },
    freighter: { pitch: 0.78, bright: 0.8 },
};

const RATE_IDLE = 0.7;
const RATE_MAX = 1.4;
const CUTOFF_IDLE = 600;
const CUTOFF_MAX = 6000;
const LEVEL_IDLE = 0.25;
const LEVEL_MAX = 0.6;

export interface EngineParams {
    rate: number;
    cutoff: number;
    gain: number;
}

export function createEngineParams(): EngineParams {
    return { rate: 1, cutoff: CUTOFF_IDLE, gain: 0 };
}

const lerp = ( a: number, b: number, t: number ): number => a + ( b - a ) * t;

export function engineVoice( shipId: string ): EngineVoice {
    return ENGINE_VOICE[ classOfShip( shipId ).id ];
}

export function engineParams( v01: number, voice: EngineVoice, out: EngineParams ): EngineParams {
    const v = Math.min( Math.max( v01, 0 ), 1 );
    out.rate = lerp( RATE_IDLE, RATE_MAX, v ) * voice.pitch;
    out.cutoff = lerp( CUTOFF_IDLE, CUTOFF_MAX, v ) * voice.bright;
    out.gain = lerp( LEVEL_IDLE, LEVEL_MAX, v );
    return out;
}
