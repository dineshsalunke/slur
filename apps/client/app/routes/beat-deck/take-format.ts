import type { FlightTuning, PlayerInput, SimConfig, SimShip } from '@slur/shared';

export const TAKE_VERSION = 1;

export const INPUT_BITS = { throttle: 1, brake: 2, left: 4, right: 8, jump: 16 } as const;

export type TakeEnd = 'esc' | 'song-end' | 'finish';

export type SongClock = 'output-timestamp' | 'current-time';

export interface TakeSong {
    name: string;
    bytes: number;
    sha256: string;
    durationS: number;
}

export interface TakeAudio {
    clock: SongClock;
    baseLatencyS: number;
    outputLatencyS: number;
}

export interface KeyColumns {
    songMs: number[];
    tick: number[];
    code: string[];
    down: number[];
}

export interface TickColumns {
    tick: number[];
    songMs: number[];
    bits: number[];
    x: number[];
    y: number[];
    z: number[];
    vx: number[];
    vz: number[];
}

export interface Take {
    version: number;
    createdAt: string;
    song: TakeSong;
    shipId: string;
    tuning: FlightTuning;
    simConfig: SimConfig;
    dt: number;
    autoCruise: true;
    bits: typeof INPUT_BITS;
    audio: TakeAudio;
    end: TakeEnd;
    keys: KeyColumns;
    ticks: TickColumns;
}

export function round3( v: number ): number {
    return Math.round( v * 1000 ) / 1000;
}

export function inputBits( i: PlayerInput ): number {
    return (
        ( i.throttle > 0 ? INPUT_BITS.throttle : 0 ) |
        ( i.brake > 0 ? INPUT_BITS.brake : 0 ) |
        ( i.strafe > 0 ? INPUT_BITS.left : 0 ) |
        ( i.strafe < 0 ? INPUT_BITS.right : 0 ) |
        ( i.jump ? INPUT_BITS.jump : 0 )
    );
}

export function emptyKeys(): KeyColumns {
    return { songMs: [], tick: [], code: [], down: [] };
}

export function emptyTicks(): TickColumns {
    return { tick: [], songMs: [], bits: [], x: [], y: [], z: [], vx: [], vz: [] };
}

export function pushKey( k: KeyColumns, songMs: number, tick: number, code: string, down: boolean ): void {
    k.songMs.push( round3( songMs ) );
    k.tick.push( tick );
    k.code.push( code );
    k.down.push( down ? 1 : 0 );
}

export function pushTick( t: TickColumns, tick: number, songMs: number, bits: number, s: SimShip ): void {
    t.tick.push( tick );
    t.songMs.push( round3( songMs ) );
    t.bits.push( bits );
    t.x.push( round3( s.x ) );
    t.y.push( round3( s.y ) );
    t.z.push( round3( s.z ) );
    t.vx.push( round3( s.vx ) );
    t.vz.push( round3( s.vz ) );
}
